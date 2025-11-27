import express from "express";
import handler from "./worker.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  console.log("HoopBrain Proxy is running on port " + PORT);
});
