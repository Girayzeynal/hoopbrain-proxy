import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Eğer url sadece "/" veya relatif ise, base URL ekle
    let incomingUrl = req.originalUrl || "/";
    const base = "https://hoopbrain-proxy.fly.dev";
    const fullUrl = new URL(incomingUrl, base);

    // Proxy target host
    fullUrl.hostname = "zeynal-bot-core.fly.dev";
    fullUrl.protocol = "https:";

    // BODY okuma
    let bodyData = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      bodyData = await new Promise((resolve) => {
        let chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Proxy request
    const response = await fetch(fullUrl.toString(), {
      method: req.method,
      headers: req.headers,
      body: bodyData,
      redirect: "follow"
    });

    const text = await response.text();

    return {
      status: response.status,
      body: text
    };

  } catch (err) {
    console.error("Proxy error:", err);
    return {
      status: 500,
      body: "Proxy server error"
    };
  }
}
