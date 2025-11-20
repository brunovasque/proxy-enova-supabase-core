export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  console.log("PROXY-DIAGNOSTIC req.url =", req.url);

  // ============================================================
  // 1) PARSE CORRETO DO QUERYSTRING
  // ============================================================
  const url = new URL(req.url, "http://localhost");

  // pega a rota Supabase da querystring
  let supabasePath = url.searchParams.get("path") || "";
  if (!supabasePath) {
    return res.status(400).json({ error: "missing path param" });
  }

  // 🔥 CORREÇÃO NECESSÁRIA: decodificar path
  supabasePath = decodeURIComponent(supabasePath);

  // remove o parametro path da URL, deixa só filtros
  url.searchParams.delete("path");
  const qs = url.searchParams.toString();

  // monta URL final REAL do Supabase
  const targetUrl =
    `${SUPABASE_URL}${supabasePath}` +
    (qs ? `?${qs}` : "");

  console.log("PROXY-DIAGNOSTIC: targetUrl =", targetUrl);

  // ============================================================
  // 2) LER RAW BODY (POST/PUT/PATCH)
  // ============================================================
  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", c => (rawBody += c));
    req.on("end", resolve);
    req.on("error", reject);
  });

  // ============================================================
  // 3) FAZER O PROXY REAL
  // ============================================================
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: req.method !== "GET" ? rawBody : undefined
    });

    const text = await response.text();
    res.status(response.status).send(text);

  } catch (err) {
    console.error("PROXY ERROR:", err);
    res.status(500).json({
      error: true,
      message: err.message,
      stack: err.stack
    });
  }
}
