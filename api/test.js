export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API endpoint works!',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}