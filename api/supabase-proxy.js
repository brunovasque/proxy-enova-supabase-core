export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  // Remove prefixo
  const path = req.url.replace("/api/supabase-proxy", "");
  const targetUrl = `${SUPABASE_URL}${path}`;

  // 🔧 Correção CRUCIAL: ler RAW body corretamente no Vercel
  let rawBody = '';

  await new Promise((resolve, reject) => {
    req.on('data', chunk => { rawBody += chunk });
    req.on('end', resolve);
    req.on('error', reject);
  });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "apikey": SUPABASE_SERVICE_ROLE,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`
      },

      // 🔥 CORREÇÃO REAL: enviar o RAW JSON corretamente
      body: req.method !== "GET" ? rawBody : undefined
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
