export default async function handler(req, res) {
  return res.status(200).json({
    debug: "headers_received_from_worker",
    method: req.method,
    received_headers: req.headers,
    timestamp: new Date().toISOString()
  });
}
