import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

/**
 * 🔥 HEALTH CHECK (PING)
 * Cloudflare → Fly.io → Proxy → Çalışıyor mu?
 */
app.get("/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HoopBrain Proxy",
    mode: "Fly.io",
    time: Date.now(),
  });
});

/**
 * 🔥 PROXY ENDPOINT
 * https://hoopbrain.xyz/api?url=URL
 */
app.get("/api", async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing URL parameter" });
    }

    const response = await fetch(targetUrl);
    const data = await response.text();

    res.status(200).send(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

/**
 * 404 Fallback
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    route: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🔥 HoopBrain Proxy running on port ${PORT}`);
});
