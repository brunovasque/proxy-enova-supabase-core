export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

  // Remove "/api/supabase-proxy" da URL original e mantém o resto (/rest/v1/...)
  const path = req.url.replace("/api/supabase-proxy", "");
  const targetUrl = `${SUPABASE_URL}${path}`;

  // Lê o corpo cru corretamente no Vercel
  let rawBody = "";
  await new Promise((resolve) => {
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", resolve);
  });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "apikey": SUPABASE_SERVICE_ROLE,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: req.method !== "GET" ? rawBody : undefined
    });

    const responseText = await response.text();

    res.status(response.status).send(responseText);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message,
      stack: err.stack
    });
  }
}
