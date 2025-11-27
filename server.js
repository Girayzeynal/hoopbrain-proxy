import express from "express";
import handler from "./worker.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Body parsing (proxy için limit artırıldı)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check (Fly.io otomatik çağırır)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Tüm istekleri worker.js'ye gönderiyoruz
app.all("*", async (req, res) => {
  try {
    const response = await handler(req);

    // Response headers ileride eklenebilir, şu an gerek yok
    res.status(response.status || 200).send(response.body);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Proxy server error");
  }
});

// Sunucu başlat
app.listen(PORT, () => {
  console.log(`HoopBrain Proxy is running on port ${PORT}`);
});
