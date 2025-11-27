export default async function handler(req) {
  try {
    const path = req.originalUrl || "/";

    // Proxy hedefi — FAZ-Core backend
    const targetBase = "https://zeynal-bot-core.fly.dev";
    const targetUrl = new URL(path, targetBase);

    // Body oku
    let body = null;
    if (!["GET", "HEAD"].includes(req.method)) {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Header temizleme (SSL + CORS fix)
    const cleanHeaders = { ...req.headers };
    delete cleanHeaders.host;
    delete cleanHeaders.origin;
    delete cleanHeaders.referer;
    delete cleanHeaders["content-length"];

    // Proxy request
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: cleanHeaders,
      body: body,
      redirect: "follow",
    });

    // Response type auto-detect
    const contentType = response.headers.get("content-type") || "";
    let responseBody;

    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      body: responseBody,
    };

  } catch (error) {
    console.error("Proxy error:", error);
    return { status: 500, body: "Proxy server error" };
  }
}
