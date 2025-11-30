import express from "express";
import handler from "./worker.js";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8080;

// Body limits
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Root
app.get("/", (req, res) => {
  res.status(200).send("OK - HoopBrain Proxy F14");
});

// Health check
app.get("/ping", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const hb = await fetch("https://zeynal-bot-core.fly.dev/ping", {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (hb.ok) return res.status(200).send("pong");
    return res.status(503).send("backend-failed");
  } catch (err) {
    return res.status(503).send("backend-error");
  }
});

// Proxy
app.all("*", async (req, res) => {
  try {
    const result = await handler(req);
    res.status(result.status).send(result.body);
  } catch (err) {
    console.error("Proxy handler crashed:", err);
    res.status(500).send("Proxy internal error");
  }
});

// Listen
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 HoopBrain Proxy F14 running at 0.0.0.0:${PORT}`);
});
