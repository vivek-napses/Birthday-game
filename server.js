const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const rootDir = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function resolveFilePath(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  if (pathname.split("/").includes("..")) {
    return null;
  }
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^([/\\])+/, "");
  const filePath = path.join(rootDir, normalizedPath);
  if (!filePath.startsWith(rootDir + path.sep) && filePath !== path.join(rootDir, "index.html")) {
    return null;
  }
  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFilePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        const shouldFallbackToIndex = path.extname(filePath) === "";
        if (!shouldFallbackToIndex) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }

        const fallbackPath = path.join(rootDir, "index.html");
        fs.readFile(fallbackPath, (fallbackError, fallbackContent) => {
          if (fallbackError) {
            res.writeHead(500);
            res.end("Server error");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fallbackContent);
        });
        return;
      }
      res.writeHead(500);
      res.end("Server error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Birthday game server listening on ${port}`);
});
