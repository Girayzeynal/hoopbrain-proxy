// ====================================================================
// 🎯 HoopBrain Proxy F15 - Final Production Server
// ====================================================================
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

// ---------------------------
// HEALTH ENDPOINTS
// ---------------------------
app.get("/", (req, res) => {
  res.send("OK - HoopBrain Proxy F15");
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/ping-b", (req, res) => {
  res.send("PING_BACK_OK");
});

app.get("/local", (req, res) => {
  res.send("LOCAL_ROUTE");
});

// ---------------------------
// PROXY ROUTE
// ---------------------------
// Örnek kullanım:
// https://hoopbrain-proxy.fly.dev/proxy?url=https://example.com/data.json
app.get("/proxy", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "HoopBrain-Proxy-F15" },
    });
    res.status(200).send(response.data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({
      error: "Proxy error",
      details: err.message,
    });
  }
});

// ---------------------------
// START
// ---------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 HoopBrain Proxy F15 running at 0.0.0.0:${PORT}`);
});
