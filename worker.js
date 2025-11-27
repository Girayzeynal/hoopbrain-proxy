import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Orijinal isteğin tüm detaylarını alıyoruz
    const originalUrl = req.url;
    const url = new URL(originalUrl);

    // Domain'i Fly.io backend’e yönlendiriyoruz
    url.hostname = "zeynal-bot-core.fly.dev";
    url.protocol = "https:";

    // Body okuma
    let bodyData = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        bodyData = await new Promise((resolve) => {
          let data = [];
          req.on("data", chunk => data.push(chunk));
          req.on("end", () => resolve(Buffer.concat(data)));
        });
      } catch (e) {
        console.error("Body parse error:", e);
      }
    }

    // Yeni request oluşturuyoruz
    const modifiedRequest = {
      method: req.method,
      headers: req.headers,
      body: bodyData,
      redirect: "follow"
    };

    // Backend’e yönlendiriyoruz
    const response = await fetch(url.toString(), modifiedRequest);

    const responseText = await response.text();

    return {
      status: response.status,
      body: responseText
    };

  } catch (err) {
    console.error("Proxy error:", err);
    return {
      status: 500,
      body: "Proxy server error"
    };
  }
}
