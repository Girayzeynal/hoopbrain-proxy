import express from "express";
import handler from "./worker.js";

const app = express();
const PORT = process.env.PORT || 8080;

// JSON / FORM parse
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Browser root test
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Health check
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Proxy
app.all("*", async (req, res) => {
  try {
    const result = await handler(req);
    res.status(result.status).send(result.body);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy server error");
  }
});

app.listen(PORT, () => {
  console.log(`HoopBrain Proxy is running on port ${PORT}`);
});
