export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Domain'i Fly.io backend adresine çeviriyoruz
    url.hostname = "zeynal-bot-core.fly.dev";
    url.protocol = "https:";

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : null,
      redirect: "follow"
    });

    return await fetch(modifiedRequest);
  }
};
