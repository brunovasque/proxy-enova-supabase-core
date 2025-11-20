export default async function handler(req, res) {
  console.log("PROXY-DIAGNOSTIC: req.url =", req.url);
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  // -----------------------------
  // 🔧 Correção definitiva do prefixo
  // -----------------------------
  const path = req.url.split("/api/supabase-proxy")[1] || "";
  const targetUrl = `${SUPABASE_URL}${path}`;
  console.log("PROXY-DIAGNOSTIC: targetUrl =", targetUrl);

  // -----------------------------
  // 🔧 Ler RAW body corretamente
  // -----------------------------
  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", chunk => (rawBody += chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  // -----------------------------
  // 📌 Modo diagnóstico (retorna sem tocar no Supabase)
  // -----------------------------
  if (req.headers["x-proxy-diagnostic"] === "1") {
    return res.status(200).json({
      diagnostic: true,
      reqUrl: req.url,
      proxyPath: path,
      finalUrl: targetUrl
    });
  }

  // -----------------------------
  // 🚀 Proxy real → para o Supabase
  // -----------------------------
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
