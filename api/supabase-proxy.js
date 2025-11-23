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

    // ================================================
    // 🔒 REMOVER HEADERS INSEGUROS DA VERCEL
    // ================================================
    const unsafeHeaders = [
      "x-vercel-proxy-signature",
      "x-vercel-oidc-token",
      "x-vercel-proxied-for",
      "x-vercel-forwarded-for",
      "x-vercel-id",
      "forwarded"
    ];

    unsafeHeaders.forEach(h => delete req.headers[h.toLowerCase()]);

    // ================================================
    // REPASSA HEADERS IMPORTANTES (INCLUINDO UPSERT!)
    // ================================================
    const forwardHeaders = {
      "Content-Type": req.headers["content-type"] || "application/json",
      "Accept": req.headers["accept"] || "application/json",
      "Prefer": req.headers["prefer"] || undefined,   // ⭐ IMPORTANTE
      "apikey": process.env.SUPABASE_SERVICE_ROLE,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`
    };

    // Remove undefined (caso GET)
    Object.keys(forwardHeaders).forEach(
      k => forwardHeaders[k] === undefined && delete forwardHeaders[k]
    );

    // ================================================
    // DEBUG OPCIONAL
    // ================================================
    console.log("PROXY-DIAGNOSTIC → decodedPath =", decodedPath);
    console.log("PROXY-DIAGNOSTIC → forwardHeaders =", forwardHeaders);
    console.log("PROXY-DIAGNOSTIC → rest =", rest);

    const finalUrl = `${baseUrl}${decodedPath}?${new URLSearchParams(rest)}`;

    // ================================================
    // 🧱 ENVIA REQUISIÇÃO AO SUPABASE
    // ================================================
    const response = await fetch(finalUrl, {
      method: req.method,
      headers: forwardHeaders,
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
    return res.status(500).json({
      error: true,
      message: err.message
    });
  }
}
