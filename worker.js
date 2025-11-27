import fetch from "node-fetch";

const BACKEND_URL = "http://zeynal-bot-core.internal:8080";

export default async function handler(req) {
  try {
    const path = req.originalUrl || "/";
    const targetUrl = BACKEND_URL + path;

    // Body verisi
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Proxy isteği
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined, // backend host override engelleme
      },
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
