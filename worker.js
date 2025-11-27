import fetch from "node-fetch";

export default async function handler(req) {
  try {
    // Gelen istek URL'sini absolute hale getiriyoruz
    const base = "https://hoopbrain-proxy.fly.dev";
    const path = req.originalUrl || "/";
    const fullUrl = new URL(path, base);

    // Proxy hedef domain
    fullUrl.hostname = "zeynal-bot-core.fly.dev";
    fullUrl.protocol = "https:";

    // BODY okunması (GET/HEAD harici)
    let bodyData = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      bodyData = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Proxy FETCH isteği
    const proxyResponse = await fetch(fullUrl.href, {
      method: req.method,
      headers: req.headers,
      body: bodyData,
      redirect: "follow"
    });

    // Yanıt gövdesini TEXT olarak okuyoruz
    const responseBody = await proxyResponse.text();

    return {
      status: proxyResponse.status,
      body: responseBody
    };

  } catch (error) {
    console.error("Proxy error:", error);
    return {
      status: 500,
      body: "Proxy server error"
    };
  }
}
