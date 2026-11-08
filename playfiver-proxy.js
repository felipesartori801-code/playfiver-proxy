import http from "node:http";
import https from "node:https";
import process from "node:process";
import { Buffer } from "node:buffer";

const PORT = Number(process.env.PORT || 8080);
const TOKEN = process.env.PROXY_TOKEN || process.env.PROXY_KEY || "";
const UPSTREAM = "https://api.playfivers.com";

const json = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

http
  .createServer((req, res) => {
    const sent = req.headers["x-proxy-token"] || req.headers["x-proxy-key"] || "";
    if (TOKEN && sent !== TOKEN) return json(res, 401, { error: "unauthorized" });
    if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true });
    if (!req.url || !req.url.startsWith("/api/v2/")) return json(res, 404, { error: "not found" });

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const payload = Buffer.concat(chunks);
      const headers = {
        "Content-Type": req.headers["content-type"] || "application/json",
        Accept: "application/json",
      };
      if (payload.length) headers["Content-Length"] = payload.length;

      const upstream = https.request(
        UPSTREAM + req.url,
        { method: req.method, headers },
        (up) => {
          res.writeHead(up.statusCode || 502, {
            "Content-Type": up.headers["content-type"] || "application/json",
          });
          up.pipe(res);
        },
      );

      upstream.on("error", (error) => json(res, 502, { error: error.message }));
      if (payload.length) upstream.write(payload);
      upstream.end();
    });
  })
  .listen(PORT, () => console.log(`playfiver proxy listening on ${PORT}`));
