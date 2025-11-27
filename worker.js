import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Gelen path
    const path = req.originalUrl || "/";

    // Proxy hedefi — FAZ-Core (gerekirse port ekleriz)
    const targetBase = "https://zeynal-bot-core.fly.dev";

    // Hedef URL
    const targetUrl = new URL(path, targetBase);

    // Body oku
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Header fix — TARAYICI HOST HEADER’I SİL (EN KRİTİK FIX)
    const cleanHeaders = {
      ...req.headers,
    };

    delete cleanHeaders.host;     // HTTPS fix
    delete cleanHeaders.origin;   // güvenlik fix
    delete cleanHeaders.referer;  // CORS fix
    delete cleanHeaders["content-length"]; // Fly bazen kırıyor

    // Proxy isteği
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: cleanHeaders,
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
