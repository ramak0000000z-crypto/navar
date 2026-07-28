// Сборка линейки «Навар» из единого шаблона.
// Запуск: node build.js
// Правило: правишь template/*.tpl.html и template/shared/*.inc, затем собираешь.
// Руками navar.html / navar-auto.html не редактировать — сборка перезапишет.
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const TPL = path.join(ROOT, "template");

function build(tplName, outName) {
  const tpl = fs.readFileSync(path.join(TPL, tplName), "utf8").split("\n");
  const out = [];
  for (const line of tpl) {
    const m = line.match(/^<<<INC:([a-z0-9_-]+)>>>$/i);
    if (m) {
      const inc = fs.readFileSync(path.join(TPL, "shared", m[1] + ".inc"), "utf8");
      out.push(inc);
    } else {
      out.push(line);
    }
  }
  fs.writeFileSync(path.join(ROOT, outName), out.join("\n"), "utf8");
  console.log("built " + outName);
}

build("navar.tpl.html", "navar.html");
build("navar-auto.tpl.html", "navar-auto.html");

/* ---------- копии для GitHub Pages + установка на телефон (PWA) ----------
   Принцип «один самодостаточный файл» не нарушен: navar.html и navar-auto.html
   в корне остаются чистыми и работают с file://. Манифест, иконки и офлайн-кэш
   добавляются ТОЛЬКО в копии для сайта (navar/ и avto/). */

// версия кэша: меняется при каждой правке продукта, иначе телефон покажет старое
function buildStamp(file) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const PRODUCTS = [
  { src: "navar.html", dir: "navar", icon: "navar",
    name: "Навар · Авито", short: "Навар", color: "#22C55E",
    desc: "Сколько ты реально зарабатываешь на Авито: комиссия с минимальным удержанием, доставка, продвижение, невыкупы и налог." },
  { src: "navar-auto.html", dir: "avto", icon: "avto",
    name: "Навар.Авто", short: "Навар.Авто", color: "#F59E0B",
    desc: "Сделка перекупа до того, как отданы деньги: навар со сделки и в день, потолок торга, стресс-тест «зависла»." },
];

for (const p of PRODUCTS) {
  const dir = path.join(ROOT, p.dir);
  fs.mkdirSync(dir, { recursive: true });

  const stamp = buildStamp(p.src);
  const html = fs.readFileSync(path.join(ROOT, p.src), "utf8");

  // блок установки — только для копии на сайте
  const head = [
    '<link rel="manifest" href="manifest.json">',
    '<meta name="theme-color" content="#101418">',
    '<link rel="apple-touch-icon" href="icon-192.png">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-title" content="' + p.short + '">',
  ].join("\n");
  // офлайн-кэш + своя кнопка установки: искать пункт в меню браузера обычный
  // человек не станет, а Chrome прячет его по-разному в разных версиях
  const tail = `<script>
(function(){
  if(location.protocol==="file:") return;
  if("serviceWorker" in navigator) addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});
  var deferred=null;
  addEventListener("beforeinstallprompt",function(e){ e.preventDefault(); deferred=e; show(); });
  addEventListener("appinstalled",hide);
  function hide(){ var b=document.getElementById("navar-install"); if(b) b.remove(); }
  function show(){
    if(document.getElementById("navar-install")) return;
    if(matchMedia("(display-mode: standalone)").matches) return;
    var bar=document.createElement("div");
    bar.id="navar-install";
    bar.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;display:flex;gap:10px;align-items:center;max-width:520px;margin:0 auto;background:#1B212B;border:1px solid #2A323E;border-radius:12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.45);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
    var txt=document.createElement("div");
    txt.style.cssText="flex:1;min-width:0;color:#EDF1F5;font-size:13px;font-weight:700;line-height:1.35";
    txt.textContent="Установить на телефон";
    var sub=document.createElement("div");
    sub.style.cssText="color:#8A94A3;font-size:11.5px;font-weight:400";
    sub.textContent="иконка на экране, считает без интернета";
    txt.appendChild(sub);
    var ok=document.createElement("button");
    ok.textContent="Установить";
    ok.style.cssText="flex:none;background:${p.color};color:#0E1116;border:none;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer";
    ok.onclick=function(){ if(!deferred) return; deferred.prompt(); deferred.userChoice.then(function(){ deferred=null; hide(); }); };
    var no=document.createElement("button");
    no.textContent="×"; no.setAttribute("aria-label","Закрыть");
    no.style.cssText="flex:none;background:transparent;color:#8A94A3;border:none;font-size:20px;line-height:1;padding:4px 8px;cursor:pointer;font-family:inherit";
    no.onclick=hide;
    bar.appendChild(txt); bar.appendChild(ok); bar.appendChild(no);
    document.body.appendChild(bar);
  }
})();
</script>`;

  const page = html
    .replace("</head>", head + "\n</head>")
    .replace("</body>", tail + "\n</body>");
  fs.writeFileSync(path.join(dir, "index.html"), page, "utf8");

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    name: p.name,
    short_name: p.short,
    description: p.desc,
    start_url: ".",
    scope: ".",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101418",
    theme_color: "#101418",
    lang: "ru",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }, null, 2), "utf8");

  for (const size of [192, 512]) {
    fs.copyFileSync(
      path.join(ROOT, "pwa", "icons", p.icon + "-" + size + ".png"),
      path.join(dir, "icon-" + size + ".png"));
  }

  // офлайн-кэш: отдаём из кэша, в фоне обновляем; старые версии сносим
  fs.writeFileSync(path.join(dir, "sw.js"),
`/* Навар — офлайн-кэш. Сгенерировано build.js, руками не править. */
var CACHE = "navar-${p.dir}-${stamp}";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){ return caches.match(e.request).then(function(m){ return m || caches.match("./index.html"); }); })
  );
});
`, "utf8");

  console.log("deployed " + p.src + " -> " + p.dir + "/ (устанавливается на телефон, кэш " + stamp + ")");
}
