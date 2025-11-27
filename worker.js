import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Her ihtimale karşı base URL
    const BASE = "https://hoopbrain-proxy.fly.dev";

    // Gelen istek URL bilgisini al
    let incoming = req.originalUrl || "/";

    // Relative URL'ler için BASE ile birleştir
    let targetUrl = new URL(incoming, BASE);

    // Proxy target hostu ayarla
    targetUrl.hostname = "zeynal-bot-core.fly.dev";
    targetUrl.protocol = "https:";

    // BODY verisini oku (GET ve HEAD hariç)
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Proxy isteğini gönder
    const proxied = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: body,
      redirect: "follow",
    });

    const text = await proxied.text();

    return {
      status: proxied.status,
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
