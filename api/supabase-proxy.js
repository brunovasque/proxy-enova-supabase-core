export default async function handler(req, res) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${req.url}`;

  const supabaseRes = await fetch(url, {
    method: req.method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
  });

  const data = await supabaseRes.text();
  res.status(supabaseRes.status).send(data);
}
