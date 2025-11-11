export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Hedef veri kaynaklarının alanları (ban yememek için)
    const targetHost = request.headers.get("X-Target-Host");
    if (!targetHost) {
      return new Response("Missing X-Target-Host header", { status: 400 });
    }

    url.host = targetHost;

    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    return response;
  }
}
