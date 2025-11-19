import fetch from "node-fetch";

export default async function handler(req, res) {
  const { path, ...query } = req.query;

  const supabaseURL = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

  const url = `${supabaseURL}${path}?${new URLSearchParams(query)}`;

  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });

  const data = await response.json();

  res.status(response.status).json(data);
}
