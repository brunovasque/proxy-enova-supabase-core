export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({
      error: "Missing SUPABASE_URL or SERVICE_ROLE"
    });
  }

  // ================================
  // RECONSTRUIR URL FINAL DO SUPABASE
  // ================================
  const { path, ...query } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing 'path' query parameter" });
  }

  const url = `${SUPABASE_URL}${decodeURIComponent(path)}?${
    new URLSearchParams(query).toString()
  }`;

  // ================================
  // HEADER CORRIGIDO (PONTO CRÍTICO!)
  // ================================
  // Pegamos todos os headers do request original
  const incomingHeaders = { ...req.headers };

  // REMOVEMOS headers que o Vercel insere e não devem ser repassados
  delete incomingHeaders.host;
  delete incomingHeaders["x-forwarded-for"];
  delete incomingHeaders["x-forwarded-proto"];
  delete incomingHeaders["x-real-ip"];
  delete incomingHeaders["content-length"];

  // FORÇAMOS o header prefer de volta (o Vercel remove!
  const finalHeaders = {
    ...incomingHeaders,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",  // <= PATCH ABSOLUTO
    "apikey": SERVICE_ROLE,
    "Authorization": `Bearer ${SERVICE_ROLE}`
  };

  // ================================
  // BODY
  // ================================
  let bodyToSend = null;

  if (req.method !== "GET" && req.method !== "HEAD") {
    bodyToSend = req.body ? JSON.stringify(req.body) : null;
  }

  // ================================
  // FETCH PARA O SUPABASE
  // ================================
  let supabaseResponse;
  try {
    supabaseResponse = await fetch(url, {
      method: req.method,
      headers: finalHeaders,
      body: bodyToSend
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to reach Supabase",
      details: err.message
    });
  }

  // ================================
  // LÊ RESPOSTA DO SUPABASE
  // ================================
  const text = await supabaseResponse.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // SE DER ERRO, DEVOLVE MESMO ASSIM
  if (!supabaseResponse.ok) {
    return res.status(supabaseResponse.status).json(data);
  }

  // TUDO CERTO
  return res.status(200).json(data);
}
