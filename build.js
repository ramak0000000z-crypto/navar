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

// копии для GitHub Pages: /navar и /avto
for (const [src, dir] of [["navar.html", "navar"], ["navar-auto.html", "avto"]]) {
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  fs.copyFileSync(path.join(ROOT, src), path.join(ROOT, dir, "index.html"));
  console.log("copied " + src + " -> " + dir + "/index.html");
}
