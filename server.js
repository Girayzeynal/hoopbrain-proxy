import express from "express";
import handler from "./worker.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/", (req, res) => {
  res.status(200).send("OK - HoopBrain Proxy F14");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

app.all("*", async (req, res) => {
  try {
    const result = await handler(req);
    res.status(result.status).send(result.body);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy internal error");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 HoopBrain Proxy F14 running at 0.0.0.0:${PORT}`);
}); 
