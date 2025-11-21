export const config = {
  runtime: "nodejs20"
};

export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  // LOG: URL recebida
  console.log("PROXY-REQ url =", req.url);

  // ============================================================
  // 1) GET REAL DO PATH E DOS FILTROS (cano transparente)
  // ============================================================
  const baseUrl = new URL(req.url, "http://localhost");

  // Path REST real é sempre enviado pela Enova como:
  // /api/supabase-proxy?path=/rest/v1/enova_state&select=*&wa_id=eq.xxx
  const rawPath = baseUrl.searchParams.get("path");

  if (!rawPath) {
    console.error("PROXY-ERROR: Missing path param");
    return res.status(400).json({ error: "missing path parameter" });
  }

  // Remove param path e deixa só filtros (select, eq, neq, etc)
  baseUrl.searchParams.delete("path");

  const qs = baseUrl.searchParams.toString();
  const finalUrl = `${SUPABASE_URL}${rawPath}${qs ? `?${qs}` : ""}`;

  console.log("PROXY-TARGET =", finalUrl);

  // ============================================================
  // 2) RAW BODY (para POST / PATCH / UPSERT)
  // ============================================================
  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", chunk => (rawBody += chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  console.log("PROXY-BODY bytes =", rawBody.length);

  // ============================================================
  // 3) FAZ O PROXY
  // ============================================================
  try {
    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: req.method !== "GET" ? rawBody : undefined
    });

    const text = await response.text();
    console.log("PROXY-RESP status =", response.status);
    res.status(response.status).send(text);

  } catch (err) {
    console.error("PROXY-FATAL:", err);
    res.status(500).json({
      error: true,
      message: err.message,
      stack: err.stack
    });
  }
}
