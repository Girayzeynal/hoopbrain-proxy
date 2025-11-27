import express from "express";
import handler from "./worker.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Root endpoint - Browser test için
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Sağlık kontrolü
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Tüm diğer istekleri worker.js'ye yönlendir
app.all("*", async (req, res) => {
  try {
    const response = await handler(req);
    res.status(response.status || 200).send(response.body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Proxy server error");
  }
});

app.listen(PORT, () => {
  console.log(`HoopBrain Proxy is running on port ${PORT}`);
});
