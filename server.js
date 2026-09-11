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

function buildStaticFileMap(baseDir, routePrefix = "") {
  const staticFiles = new Map();
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(baseDir, entry.name);
    const routePath = `${routePrefix}/${entry.name}`.replace(/\\/g, "/");
    if (entry.isDirectory()) {
      for (const [childRoute, childPath] of buildStaticFileMap(fullPath, routePath)) {
        staticFiles.set(childRoute, childPath);
      }
      continue;
    }

    if (mimeTypes[path.extname(entry.name).toLowerCase()]) {
      staticFiles.set(routePath, fullPath);
    }
  }

  return staticFiles;
}

const staticFiles = buildStaticFileMap(rootDir);

function resolveFilePath(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  } catch (error) {
    return { badRequest: true };
  }
  if (pathname.split("/").includes("..")) {
    return { forbidden: true };
  }
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = staticFiles.get(requestedPath);
  if (!filePath) {
    return { notFound: true };
  }
  return { filePath };
}

const server = http.createServer((req, res) => {
  const resolution = resolveFilePath(req.url || "/");
  if (resolution.badRequest) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }
  if (resolution.forbidden) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }
  if (resolution.notFound) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const { filePath } = resolution;
  const ext = path.extname(filePath).toLowerCase();
  const fileStream = fs.createReadStream(filePath);

  fileStream.on("open", () => {
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    fileStream.pipe(res);
  });

  fileStream.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  });
});

server.listen(port, () => {
  console.log(`Birthday game server listening on ${port}`);
});
