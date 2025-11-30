import fetch from "node-fetch";

const TARGET = "https://zeynal-bot-core.fly.dev";

let failCount = 0;
let circuitOpen = false;
let circuitResetTime = 0;

export default async function handler(req) {
  const now = Date.now();

  // CIRCUIT BREAKER
  if (circuitOpen && now < circuitResetTime) {
    return { status: 503, body: "backend-down-circuit-open" };
  }
  if (circuitOpen && now >= circuitResetTime) {
    circuitOpen = false;
    failCount = 0;
  }

  const path = req.originalUrl || "/";

  // LOCAL ROUTES
  if (path === "/" || path.startsWith("/ping")) {
    return { status: 200, body: "LOCAL_ROUTE" };
  }

  const targetUrl = new URL(path, TARGET);

  // READ RAW BODY
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  // CLEAN HEADERS
  const cleanHeaders = { ...req.headers };
  delete cleanHeaders.host;
  delete cleanHeaders.origin;
  delete cleanHeaders.referer;
  delete cleanHeaders["content-length"];

  // NEW: Fly.io forwarded headers fix
  delete cleanHeaders["x-forwarded-for"];
  delete cleanHeaders["x-forwarded-proto"];

  cleanHeaders["x-proxy"] = "hoopbrain-proxy-f14";

  // RETRIES
  const MAX_RETRY = 3;
  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      // NEW TIMEOUT FIX (AbortController)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: cleanHeaders,
        body,
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await response.text();

      failCount = 0;
      circuitOpen = false;

      return { status: response.status, body: text };
    } catch (err) {
      failCount++;
      console.error(`[RETRY ${i + 1}/${MAX_RETRY}] →`, err.message);

      if (failCount >= MAX_RETRY) {
        circuitOpen = true;
        circuitResetTime = Date.now() + 15000;
        console.error("CIRCUIT OPEN FOR 15s");
      }
    }
  }

  return { status: 503, body: "backend-failed-all-retries" };
} 
