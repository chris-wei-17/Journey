import { Router } from "express";
import fetch from "node-fetch";

// Minimal WHOOP API scaffold (OAuth2 + example fetch)
// NOTE: You must configure WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI in env

const router = Router();

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} not set`);
  return v;
}

// Step 1: Redirect user to WHOOP authorization
router.get("/auth", (req, res) => {
  try {
    const clientId = getEnv("WHOOP_CLIENT_ID");
    const redirectUri = getEnv("WHOOP_REDIRECT_URI");
    const scope = encodeURIComponent("offline read:recovery read:cycles read:workout read:sleep");
    const url = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    res.redirect(url);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// Step 2: OAuth callback to exchange code for tokens
router.get("/callback", async (req, res) => {
  try {
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
    res.json({ message: "whoop connected", tokens: data });
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

