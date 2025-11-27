import fetch from "node-fetch";

export default async function handler(req, res) {
  const { path, ...query } = req.query;

  const supabaseURL = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

  // 🔥 CORREÇÃO CIRÚRGICA:
  // Garante que sempre exista uma barra entre SUPABASE_URL e path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = `${supabaseURL}${normalizedPath}?${new URLSearchParams(query)}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      },
      body: req.body ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
