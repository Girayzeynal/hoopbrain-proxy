import fetch from "node-fetch";

const TARGET = "https://zeynal-bot-core.fly.dev";

// Circuit breaker state
let failCount = 0;
let circuitOpen = false;
let circuitResetTime = 0;

export default async function handler(req) {
  const now = Date.now();

  // CIRCUIT BREAKER (backend çökerse proxy korumaya geçer)
  if (circuitOpen && now < circuitResetTime) {
    return {
      status: 503,
      body: "backend-down-circuit-open",
    };
  }

  if (circuitOpen && now >= circuitResetTime) {
    circuitOpen = false;
    failCount = 0;
  }

  const path = req.originalUrl || "/";
  if (path === "/" || path.startsWith("/ping")) {
    return { status: 200, body: "LOCAL_ROUTE" };
  }

  const targetUrl = new URL(path, TARGET);

  // Read body
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  // Clean headers
  const cleanHeaders = { ...req.headers };
  delete cleanHeaders.host;
  delete cleanHeaders.origin;
  delete cleanHeaders.referer;
  delete cleanHeaders["content-length"];
  cleanHeaders["x-proxy"] = "hoopbrain-proxy-f14";

  // RETRY LOGIC (3 kez dener)
  const MAX_RETRY = 3;
  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      const response = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: cleanHeaders,
        body,
        redirect: "follow",
        timeout: 5000, // anti freeze
      });

      const text = await response.text();

      // Success → circuit breaker reset
      failCount = 0;
      circuitOpen = false;

      return { status: response.status, body: text };
    } catch (err) {
      failCount++;

      // Log
      console.error(
        `[RETRY ${i + 1}/${MAX_RETRY}] Error → ${targetUrl} ::`,
        err.message
      );

      if (failCount >= 3) {
        circuitOpen = true;
        circuitResetTime = Date.now() + 15000; // 15s cooldown
        console.error("CIRCUIT OPENED for 15s");
      }
    }
  }

  return { status: 503, body: "backend-failed-all-retries" };
} 
