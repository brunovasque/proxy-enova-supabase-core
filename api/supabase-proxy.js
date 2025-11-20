export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  console.log("PROXY-DIAGNOSTIC req.url =", req.url);

  // ============================================================
  // 1) PARSE CORRETO DO QUERYSTRING
  // ============================================================
  const url = new URL(req.url, "http://localhost");

  let supabasePath = url.searchParams.get("path") || "";
  if (!supabasePath) {
    return res.status(400).json({ error: "missing path param" });
  }

  // 🔥 decodifica o path corretamente
  supabasePath = decodeURIComponent(supabasePath);

  url.searchParams.delete("path");
  const qs = url.searchParams.toString();

  const targetUrl =
    `${SUPABASE_URL}${supabasePath}` +
    (qs ? `?${qs}` : "");

  console.log("PROXY-DIAGNOSTIC: targetUrl =", targetUrl);

  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", c => (rawBody += c));
    req.on("end", resolve);
    req.on("error", reject);
  });

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
