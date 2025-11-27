import fetch from "node-fetch";

export default async function handler(req) {
  try {
    const path = req.originalUrl || "/";

    // LOCAL route’ları ASLA proxy’e gönderme!
    if (path === "/" || path.startsWith("/ping")) {
      return {
        status: 200,
        body: "LOCAL_ROUTE",
      };
    }

    const targetBase = "https://zeynal-bot-core.fly.dev";
    const targetUrl = new URL(path, targetBase);

    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const cleanHeaders = { ...req.headers };
    delete cleanHeaders.host;
    delete cleanHeaders.origin;
    delete cleanHeaders.referer;
    delete cleanHeaders["content-length"];

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
