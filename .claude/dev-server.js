// Крошечный статический сервер для тестов «Навара» в панели Browser.
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = "E:\\navar";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  let file = path.join(ROOT, urlPath === "/" ? "navar.html" : urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(8123, "127.0.0.1", () => console.log("navar static server on http://127.0.0.1:8123"));
