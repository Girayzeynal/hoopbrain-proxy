import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Node ortamı için base URL veriyoruz
    const base = "https://hoopbrain-proxy.fly.dev";
    const url = new URL(req.originalUrl, base);

    // Backend hedef domain
    url.hostname = "zeynal-bot-core.fly.dev";
    url.protocol = "https:";

    // Body okuma
    let bodyData = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      bodyData = await new Promise((resolve) => {
        let chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Yeni istek
    const modifiedRequest = {
      method: req.method,
      headers: req.headers,
      body: bodyData,
      redirect: "follow"
    };

    // Proxy istek
    const response = await fetch(url.toString(), modifiedRequest);
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
