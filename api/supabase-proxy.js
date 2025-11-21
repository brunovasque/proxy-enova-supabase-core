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

    // Debug
    console.log("PROXY-DIAGNOSTIC → decodedPath =", decodedPath);
    console.log("PROXY-DIAGNOSTIC → baseUrl =", baseUrl);
    console.log("PROXY-DIAGNOSTIC → rest =", rest);

    const url = `${baseUrl}${decodedPath}?${new URLSearchParams(rest)}`;

    const response = await fetch(url, {
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

    const data = await response.text();
    let json;

    try {
      json = JSON.parse(data);
    } catch {
      json = { raw: data };
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
