import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.query.path as string;

  if (!path) {
    return res.status(400).json({ error: "Missing path param" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRole) {
    return res.status(500).json({ error: "Proxy misconfigured: missing env vars" });
  }

  try {
    const targetUrl = `${supabaseUrl}/rest/v1${path}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (err: any) {
    res.status(500).json({
      error: "Proxy error",
      details: err?.message || String(err)
    });
  }
}
