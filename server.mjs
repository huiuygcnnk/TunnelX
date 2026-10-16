import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(projectRoot, "bqc24_launcher_bundle");
const host = "127.0.0.1";
const port = Number(process.env.PORT ?? 4173);
const wispPort = 8081;
const allowedOrigin = `http://${host}:${port}`;
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;
logging.set_level(logging.WARN);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".wasm", "application/wasm"],
  [".woff2", "font/woff2"],
  [".bin", "text/css; charset=utf-8"],
]);

const webServer = createServer(async (request, response) => {
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  } catch {
    response.writeHead(400).end("Invalid URL");
    return;
  }

  if (pathname === "/") {
    response.writeHead(302, { Location: "/index.html" }).end();
    return;
  }

  const filePath = path.resolve(publicRoot, `.${pathname}`);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory() && !pathname.endsWith("/")) {
      response.writeHead(308, { Location: `${pathname}/${new URL(request.url, `http://${host}:${port}`).search}` }).end();
      return;
    }
    const resolvedPath = fileStat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const resolvedStat = fileStat.isDirectory() ? await stat(resolvedPath) : fileStat;
    response.writeHead(200, {
      "Content-Length": resolvedStat.size,
      "Content-Type": mimeTypes.get(path.extname(resolvedPath)) ?? "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      const stream = createReadStream(resolvedPath);
      stream.on("error", (error) => {
        console.error(`Could not read ${pathname}:`, error);
        if (response.headersSent) {
          response.destroy(error);
        } else {
          response.writeHead(500).end("Internal server error");
        }
      });
      stream.pipe(response);
    }
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      response.writeHead(404).end("Not found");
      return;
    }
    console.error(`Could not serve ${pathname}:`, error);
    response.writeHead(500).end("Internal server error");
  }
});

const wispServer = createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Local Wisp service is running.");
});
const wispSockets = new Set();
wispServer.on("upgrade", (request, socket, head) => {
  const requestPath = new URL(request.url, `http://${host}:${wispPort}`).pathname;
  if (requestPath !== "/wisp/" || request.headers.origin !== allowedOrigin) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wispSockets.add(socket);
  socket.on("close", () => wispSockets.delete(socket));
  wisp.routeRequest(request, socket, head);
});

function closeServers() {
  if (webServer.listening) webServer.close();
  if (wispServer.listening) wispServer.close();
  for (const socket of wispSockets) socket.destroy();
}

webServer.on("error", (error) => {
  console.error(`Could not start the local web server on http://${host}:${port}:`, error);
  closeServers();
  process.exitCode = 1;
});
wispServer.on("error", (error) => {
  console.error(`Could not start the local Wisp service on ${host}:${wispPort}:`, error);
  closeServers();
  process.exitCode = 1;
});

webServer.listen(port, host, () => {
  console.log(`BQC24 is running at http://${host}:${port}`);
});
wispServer.listen(wispPort, host, () => {
  console.log(`Local Wisp service is running at ws://${host}:${wispPort}/wisp/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    closeServers();
  });
}
