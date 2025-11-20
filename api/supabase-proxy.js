export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  // Remove "/api/supabase-proxy" da URL original e mantém o resto (/rest/v1/...)
  const path = req.url.replace("/api/supabase-proxy", "");

  // Monta a URL final para o Supabase
  const targetUrl = `${SUPABASE_URL}${path}`;

  try {
    // ==========================================
    // 📌 CORREÇÃO CRUCIAL PARA VERCEL
    // Captura o body REAL da requisição
    // ==========================================
    const rawBody =
      req.method === "POST" || req.method === "PATCH" || req.method === "PUT"
        ? await req.text()
        : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "apikey": SUPABASE_SERVICE_ROLE,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      // Se GET → sem body
      // Se POST/PATCH/PUT → passa o rawBody certo
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : rawBody
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message,
      stack: err.stack
    });
  }
}
