import express, { Router } from "express";
import fetch from "node-fetch";
import crypto from "crypto";

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

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function computeHmacSha256(secret: string, payload: Buffer | string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

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

    const scope = encodeURIComponent("offline read:recovery read:cycles read:workout read:sleep");
    const url = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`;
    res.redirect(url);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Step 2: OAuth callback to exchange code for tokens
router.get("/callback", async (req, res) => {
  try {
    const stateFromQuery = String(req.query.state || "");
    const cookies = parseCookies(req.headers.cookie);
    const expectedState = cookies["whoop_oauth_state"] || "";

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

    // Clear the state cookie once verified
    res.clearCookie("whoop_oauth_state", { path: "/api/whoop" });

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
    // TODO: persist tokens to DB by user
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
// Uses raw body for signature verification
router.post("/webhook", (req: any, res) => {
  try {
    const secret = process.env.WHOOP_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("WHOOP_WEBHOOK_SECRET not set; skipping signature verification");
    }

    const signatureHeader = (req.headers["x-whoop-signature"] || req.headers["X-Whoop-Signature"]) as string | undefined;

    if (secret) {
      if (!signatureHeader) {
        return res.status(400).json({ message: "Missing signature header" });
      }

      // Support two formats:
      // 1) raw hex signature
      // 2) key=value pairs like "t=..., v1=..."; we extract v1
      let provided = signatureHeader;
      if (signatureHeader.includes("=")) {
        const parts = signatureHeader.split(/[\,\s]+/).map(p => p.trim());
        const dict: Record<string, string> = {};
        for (const p of parts) {
          const [k, v] = p.split("=");
          if (k && v) dict[k] = v;
        }
        provided = dict["v1"] || dict["signature"] || signatureHeader;
      }

      const rawBody: Buffer = req.rawBody ? req.rawBody as Buffer : Buffer.from(JSON.stringify(req.body ?? {}));
      const expected = computeHmacSha256(secret, rawBody);
      const ok = timingSafeEqual(provided, expected);
      if (!ok) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    // Parse payload now that signature is verified (or no secret)
    const payload = req.rawBody ? JSON.parse((req.rawBody as Buffer).toString("utf8")) : req.body;

    // Minimal v2 event handling scaffold
    // Examples: workout.updated, sleep.updated, recovery.updated
    const eventType = payload?.type || payload?.event || "unknown";
    console.log("WHOOP webhook received:", eventType, payload?.id || payload?.resource_id || "");

    // TODO: enqueue job or handle event types (v2 uses UUID ids)

    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error("WHOOP webhook error:", e);
    return res.status(500).json({ message: e.message || "Webhook error" });
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

export default router;

