export default async function handler(req, res) {
  try {
    const { path, ...rest } = req.query;

    if (!path) {
      return res.status(400).json({
        error: true,
        message: "Missing path parameter"
      });
    }

    const decodedPath = decodeURIComponent(path);
    const baseUrl = process.env.SUPABASE_URL;

    if (!baseUrl) {
      return res.status(500).json({
        error: true,
        message: "SUPABASE_URL is undefined inside proxy"
      });
    }

    // Remove headers inseguros da Vercel
    const unsafe = [
      "authorization",
      "x-vercel-proxy-signature",
      "x-vercel-oidc-token",
      "x-vercel-proxied-for",
      "x-vercel-forwarded-for",
      "x-vercel-id",
      "forwarded"
    ];
    unsafe.forEach(h => delete req.headers[h]);

    const finalUrl = `${baseUrl}${decodedPath}?${new URLSearchParams(rest)}`;

    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return res.status(response.status).json(json);
  } catch (err) {
    console.error("PROXY ERROR", err);
    return res.status(500).json({ error: true, message: err.message });
  }
}
