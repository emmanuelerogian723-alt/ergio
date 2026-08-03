export default function handler(req, res) {
  res.json({ test: true, time: Date.now(), commit: "test-3e93555" });
}
