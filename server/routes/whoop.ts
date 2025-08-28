import express, { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import { authenticateToken, type AuthenticatedRequest } from "../auth.js";
import { db } from "../db.js";
import { storage } from "../storage.js";
import { whoopTokens, whoopEvents, whoopResourceCache } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// Minimal WHOOP API scaffold (OAuth2 + example fetch)
// NOTE: You must configure WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI in env

const router = Router();

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} not set`);
  return v;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    if (!key) continue;
    const value = rest.join("=").trim();
    out[key] = decodeURIComponent(value || "");
  }
  return out;
}

function generateState(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function computeHmacSha256Base64(secret: string, data: string | Buffer): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64");
}

async function getUserTokens(userId: number) {
  const [row] = await db.select().from(whoopTokens).where(eq(whoopTokens.userId, userId));
  return row as any | undefined;
}

async function saveUserTokens(userId: number, tokenResponse: any) {
  const existing = await getUserTokens(userId);
  const expiresIn = Number(tokenResponse.expires_in || 3600);
  const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000);
  const nextRefreshToken = tokenResponse.refresh_token ? String(tokenResponse.refresh_token) : (existing?.refreshToken || "");
  const data = {
    userId,
    accessToken: String(tokenResponse.access_token),
    refreshToken: nextRefreshToken,
    tokenType: String(tokenResponse.token_type || "bearer"),
    scope: String(tokenResponse.scope || existing?.scope || ""),
    expiresAt,
    updatedAt: new Date(),
  } as any;
  if (existing) {
    await db.update(whoopTokens).set(data).where(eq(whoopTokens.userId, userId));
  } else {
    await db.insert(whoopTokens).values({ ...data, createdAt: new Date() });
  }
}

async function ensureValidAccessToken(userId: number): Promise<string> {
  const tokens = await getUserTokens(userId);
  if (!tokens) throw new Error("WHOOP not connected for this user");
  const isExpired = !tokens.expiresAt || new Date(tokens.expiresAt).getTime() <= Date.now();
  if (!isExpired) return tokens.accessToken as string;

  const clientId = getEnv("WHOOP_CLIENT_ID");
  const clientSecret = getEnv("WHOOP_CLIENT_SECRET");
  const tokenUrl = "https://api.prod.whoop.com/oauth/oauth2/token";
  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", tokens.refreshToken);
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  const r = await fetch(tokenUrl, { method: "POST", body: form as any });
  const data = await r.json();
  if (!r.ok) throw new Error(`Refresh failed: ${JSON.stringify(data)}`);
  await saveUserTokens(userId, data);
  return String(data.access_token);
}

// Prepare WHOOP auth: set user id cookie using app auth
router.post("/prepare", authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    res.cookie("whoop_user_id", String(req.userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/api/whoop",
      maxAge: 10 * 60 * 1000,
    });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Prepare failed" });
  }
});

// Step 1: Redirect user to WHOOP authorization
router.get("/auth", (req, res) => {
  try {
    const clientId = getEnv("WHOOP_CLIENT_ID");
    const redirectUri = getEnv("WHOOP_REDIRECT_URI");

    const state = generateState();
    res.cookie("whoop_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/api/whoop",
      maxAge: 10 * 60 * 1000,
    });

    const scopes = [
      "offline",
      "read:profile",
      "read:recovery",
      "read:cycles",
      "read:workout",
      "read:sleep",
      "read:body_measurement",
    ];
    const scope = encodeURIComponent(scopes.join(" "));
    const prompt = "prompt=consent&approval_prompt=force";
    const url = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}&${prompt}`;
    res.redirect(url);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Disconnect WHOOP for current user
router.post("/disconnect", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    await db.delete(whoopTokens).where(eq(whoopTokens.userId, userId));
    return res.json({ disconnected: true });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Disconnect failed" });
  }
});

// Step 2: OAuth callback to exchange code for tokens
router.get("/callback", async (req, res) => {
  try {
    const stateFromQuery = String(req.query.state || "");
    const cookies = parseCookies(req.headers.cookie);
    const expectedState = cookies["whoop_oauth_state"] || "";
    const userIdCookie = cookies["whoop_user_id"] || "";
    const userId = Number(userIdCookie || 0);

    if (!stateFromQuery || stateFromQuery.length < 8) {
      return res.status(400).json({
        message: "OAuth error",
        error: "invalid_state",
        error_description: "Missing or too short state parameter",
        received: req.query,
      });
    }

    if (!expectedState || expectedState !== stateFromQuery) {
      return res.status(400).json({
        message: "OAuth error",
        error: "invalid_state",
        error_description: "State mismatch",
        received: req.query,
      });
    }

    if (!userId) {
      return res.status(400).json({ message: "Missing user id for token association" });
    }

    // Clear the state cookies once verified
    res.clearCookie("whoop_oauth_state", { path: "/api/whoop" });
    res.clearCookie("whoop_user_id", { path: "/api/whoop" });

    const code = String(req.query.code || "");
    if (!code) {
      const { error, error_description } = req.query as any;
      return res.status(400).json({ message: error ? "OAuth error" : "Missing code", error, error_description, received: req.query });
    }

    const clientId = getEnv("WHOOP_CLIENT_ID");
    const clientSecret = getEnv("WHOOP_CLIENT_SECRET");
    const redirectUri = getEnv("WHOOP_REDIRECT_URI");
    const tokenUrl = "https://api.prod.whoop.com/oauth/oauth2/token";

    const form = new URLSearchParams();
    form.set("grant_type", "authorization_code");
    form.set("code", code);
    form.set("redirect_uri", redirectUri);
    form.set("client_id", clientId);
    form.set("client_secret", clientSecret);

    const r = await fetch(tokenUrl, { method: "POST", body: form as any });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ message: "Token exchange failed", data });

    // Fetch WHOOP profile to capture user id (v2)
    let whoopUserId: string | undefined = undefined;
    try {
      const profileRes = await fetch("https://api.prod.whoop.com/developer/v2/user/profile/basic", {
        headers: { Authorization: `Bearer ${String(data.access_token)}` },
      });
      if (profileRes.ok) {
        const profileJson: any = await profileRes.json();
        whoopUserId = String(profileJson?.id || profileJson?.user_id || "");
      }
    } catch {}

    await saveUserTokens(userId, { ...data, whoop_user_id: whoopUserId });

    return res.redirect("/integrations?whoop=connected");
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Env check route: helps verify runtime env var visibility safely
router.get("/env-check", (req, res) => {
  const keys = ["WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET", "WHOOP_REDIRECT_URI"] as const;
  const whoop: Record<string, any> = {};
  for (const key of keys) {
    const value = process.env[key];
    const masked = key === "WHOOP_REDIRECT_URI"
      ? value || null
      : (value ? `${value.slice(0, 4)}...${value.slice(-4)}` : null);
    whoop[key] = {
      present: !!value,
      length: value ? value.length : 0,
      preview: masked,
    };
  }
  res.json({ whoop, nodeEnv: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
});

// WHOOP Webhook receiver (v2-ready)
// Verify with Client Secret and timestamp header
router.post("/webhook", (req: any, res) => {
  // Pre-try logging
  console.log("[WHOOP webhook] Received request", {
    ts: new Date().toISOString(),
    method: req.method,
    path: req.path,
    contentType: req.headers["content-type"],
    hasSignature: !!req.headers["x-whoop-signature"],
    hasTimestamp: !!req.headers["x-whoop-signature-timestamp"],
    rawBodyLen: req.rawBody ? (req.rawBody as Buffer).length : undefined,
  });
  try {
    console.log("[WHOOP webhook] Entered try block");
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const signature = req.headers["x-whoop-signature"] as string | undefined;
    const timestamp = req.headers["x-whoop-signature-timestamp"] as string | undefined;

    if (!clientSecret) {
      console.error("[WHOOP webhook] WHOOP_CLIENT_SECRET not set");
      return res.status(500).json({ message: "WHOOP_CLIENT_SECRET not set" });
    }
    if (!signature || !timestamp) {
      console.error("[WHOOP webhook] Missing signature or timestamp header", {
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
      });
      return res.status(400).json({ message: "Missing signature or timestamp header" });
    }

    const rawBody: Buffer = req.rawBody ? req.rawBody as Buffer : Buffer.from(JSON.stringify(req.body ?? {}));
    const payloadString = rawBody.toString("utf8");

    // WHOOP signing: HMAC-SHA256 over `${timestamp}${payload}`, base64-encoded
    const signed = computeHmacSha256Base64(clientSecret, `${timestamp}${payloadString}`);
    const valid = timingSafeEqualString(signature, signed);
    console.log("[WHOOP webhook] Signature check", { valid });

    if (!valid) {
      console.error("[WHOOP webhook] Invalid signature", { timestamp, signaturePreview: signature.slice(0, 6) + "..." });
      return res.status(400).json({ message: "Invalid signature" });
    }

    let payload: any;
    try {
      payload = req.rawBody ? JSON.parse((req.rawBody as Buffer).toString("utf8")) : req.body;
      console.log("[WHOOP webhook] JSON parsed successfully");
    } catch (parseErr: any) {
      console.error("[WHOOP webhook] Failed to parse JSON payload", { error: parseErr?.message });
      return res.status(400).json({ message: "Invalid JSON payload" });
    }

    const eventType = payload?.type || payload?.event || "unknown";
    const resourceId = payload?.id || payload?.resource_id || undefined;
    const whoopUserId = payload?.user_id || payload?.user?.id || undefined;
    console.log("[WHOOP webhook] Event received", { eventType, id: resourceId, whoopUserId });

    // Log event
    await db.insert(whoopEvents).values({
      userId: null,
      whoopUserId: whoopUserId ? String(whoopUserId) : null,
      eventType: String(eventType),
      resourceId: resourceId ? String(resourceId) : null,
      rawPayload: payload,
    });

    // Map whoop user to our user via whoopTokens
    let mappedUserId: number | null = null;
    if (whoopUserId) {
      const [tokenRow] = await db.select().from(whoopTokens).where(eq(whoopTokens.whoopUserId, String(whoopUserId)));
      if (tokenRow) mappedUserId = tokenRow.userId as number;
    }

    // Fetch resource details for known v2 types
    const typeToPath: Record<string, string> = {
      "workout.updated": "activity/workout",
      "sleep.updated": "activity/sleep",
      "recovery.updated": "recovery",
    };
    const path = typeToPath[eventType];
    if (path && resourceId && whoopUserId && mappedUserId) {
      try {
        const accessToken = await ensureValidAccessToken(mappedUserId);
        const url = `https://api.prod.whoop.com/developer/v2/${path}/${resourceId}`;
        const rsrc = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } });
        const bodyText = await rsrc.text();
        let json: any = bodyText;
        try { json = JSON.parse(bodyText); } catch {}
        if (!rsrc.ok || typeof json !== 'object') {
          console.warn("[WHOOP webhook] Failed to fetch resource", { status: rsrc.status, url });
        } else {
          // Map WHOOP resource to Journey activity where applicable
          const kind = path.split('/')[1] || path;
          if (kind === 'workout') {
            const start = new Date(json.start);
            const end = new Date(json.end);
            const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
            const activity = {
              userId: mappedUserId,
              activityType: (json?.sport?.toLowerCase?.() || 'workout') as string,
              startTime: start,
              endTime: end,
              durationMinutes,
              date: start,
            } as any;
            await storage.createActivity(activity);
            console.log("[WHOOP webhook] Inserted workout activity", { id: resourceId, activityType: activity.activityType });
          } else if (kind === 'sleep') {
            const start = new Date(json.start);
            const end = new Date(json.end);
            const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
            const activity = {
              userId: mappedUserId,
              activityType: 'sleep',
              startTime: start,
              endTime: end,
              durationMinutes,
              date: start,
            } as any;
            await storage.createActivity(activity);
            console.log("[WHOOP webhook] Inserted sleep activity", { id: resourceId });
          } else if (kind === 'recovery') {
            // No-op insert for now; we fetched json already
            console.log("[WHOOP webhook] Fetched recovery (no-op)", { id: resourceId });
          }
        }
      } catch (e: any) {
        console.error("[WHOOP webhook] Error fetching resource", e?.message);
      }
    }

    console.log("[WHOOP webhook] Responding 200 OK");
    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error("[WHOOP webhook] Exception", e);
    return res.status(500).json({ message: e.message || "Webhook error" });
  }
});

// WHOOP Test webhook sender - POST helper for signed forward
router.post("/test-webhook", async (req: any, res) => {
  try {
    const clientSecret = getEnv("WHOOP_CLIENT_SECRET");
    const host = req.get("host");
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const webhookUrl = `${protocol}://${host}/api/whoop/webhook`;

    const payload = (req.body && Object.keys(req.body).length > 0) ? req.body : {
      type: "workout.updated",
      id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
      trace_id: "test-trace"
    };
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = computeHmacSha256Base64(clientSecret, `${timestamp}${body}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WHOOP-Signature": signature,
        "X-WHOOP-Signature-Timestamp": timestamp,
      },
      body,
    });

    const text = await response.text();
    return res.status(200).json({ sentTo: webhookUrl, status: response.status, response: text });
  } catch (e: any) {
    console.error("WHOOP test-webhook error:", e);
    return res.status(500).json({ message: e.message || "Test webhook error" });
  }
});

// WHOOP Test webhook sender - GET convenience for browser
router.get("/test-webhook", async (req: any, res) => {
  try {
    const clientSecret = getEnv("WHOOP_CLIENT_SECRET");
    const host = req.get("host");
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const webhookUrl = `${protocol}://${host}/api/whoop/webhook`;

    const payload = {
      type: "workout.updated",
      id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
      trace_id: "test-trace"
    };
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = computeHmacSha256Base64(clientSecret, `${timestamp}${body}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WHOOP-Signature": signature,
        "X-WHOOP-Signature-Timestamp": timestamp,
      },
      body,
    });

    const text = await response.text();
    return res.status(200).json({ sentTo: webhookUrl, status: response.status, response: text });
  } catch (e: any) {
    console.error("WHOOP test-webhook (GET) error:", e);
    return res.status(500).json({ message: e.message || "Test webhook error" });
  }
});

// WHOOP v2 body measurement tester for current user
router.get("/test-body", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const accessToken = await ensureValidAccessToken(userId);
    const r = await fetch("https://api.prod.whoop.com/developer/v2/user/measurement/body", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const text = await r.text();
    const contentType = r.headers.get("content-type") || "";
    let payload: any = text;
    if (contentType.includes("application/json")) {
      try {
        payload = JSON.parse(text);
      } catch {
        // keep raw text if JSON parse fails
        payload = text;
      }
    }
    if (!r.ok) {
      return res.status(r.status).json({ error: "WHOOP API error", status: r.status, body: payload });
    }
    return res.json(payload);
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "WHOOP test failed" });
  }
});

// WHOOP connection status for current user
router.get("/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const tokens = await getUserTokens(userId);
    if (!tokens) return res.json({ connected: false });
    return res.json({
      connected: true,
      expiresAt: tokens.expiresAt,
      hasRefreshToken: !!tokens.refreshToken,
      scope: tokens.scope,
      tokenType: tokens.tokenType,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Status check failed" });
  }
});

// Example: Fetch profile (requires stored access token)
router.get("/me", async (req, res) => {
  try {
    const accessToken = String(req.headers["x-whoop-token"] || "");
    if (!accessToken) return res.status(400).json({ message: "Missing x-whoop-token" });
    const r = await fetch("https://api.prod.whoop.com/developer/v1/user/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ message: "WHOOP API error", data });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Diagnostics: show raw token scope for current user
router.get("/debug-scope", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const t = await getUserTokens(req.userId!);
    if (!t) return res.json({ connected: false });
    return res.json({ connected: true, scope: t.scope, expiresAt: t.expiresAt });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Scope check failed" });
  }
});

// Diagnostics: force refresh and report scope
router.post("/debug-refresh", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const before = await getUserTokens(userId);
    // Trigger refresh regardless of expiry
    const clientId = getEnv("WHOOP_CLIENT_ID");
    const clientSecret = getEnv("WHOOP_CLIENT_SECRET");
    const tokenUrl = "https://api.prod.whoop.com/oauth/oauth2/token";
    const form = new URLSearchParams();
    form.set("grant_type", "refresh_token");
    form.set("refresh_token", String(before?.refreshToken || ""));
    form.set("client_id", clientId);
    form.set("client_secret", clientSecret);
    const r = await fetch(tokenUrl, { method: "POST", body: form as any });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ message: "Refresh failed", data });
    await saveUserTokens(userId, data);
    const after = await getUserTokens(userId);
    return res.json({ before: { scope: before?.scope, expiresAt: before?.expiresAt }, after: { scope: after?.scope, expiresAt: after?.expiresAt } });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || "Refresh debug failed" });
  }
});

export default router;

