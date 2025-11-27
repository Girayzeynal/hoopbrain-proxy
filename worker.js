import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Gelen path
    const path = req.originalUrl || "/";

    // Proxy target base URL (Zeynal bot-core)
    const targetBase = "https://zeynal-bot-core.fly.dev";

    // Path'i yukarıdaki base ile BİRLEŞTİR (kesin çözüm)
    const targetUrl = new URL(path, targetBase);

    // Body verisini oku
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Proxy isteği
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
      redirect: "follow",
    });

    const text = await response.text();
    return {
      status: response.status,
      body: text,
    };

  } catch (err) {
    console.error("Proxy error:", err);
    return {
      status: 500,
      body: "Proxy server error",
    };
  }
} 
