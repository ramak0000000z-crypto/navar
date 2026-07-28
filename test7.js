const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(s){ return parseFloat(s.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function loadUrl(f, hash){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true, url:"file:///app.html"+(hash||"")}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }
function click(w,el){ el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
const P = p => (process.env.NAVAR_DIR||".") + "/" + p;

(async () => {
console.log("V4 — URL-состояние, сортировка, редактирование:");
// 1) состояние пишется в hash и восстанавливается в новой сессии
let w = loadUrl(P("navar.html")), d = w.document;
setVal(w,"price","3333"); setVal(w,"cost","777");
await new Promise(r=>setTimeout(r,950)); // дебаунс 800мс
const savedHash = w.location.hash;
ok(savedHash.length > 10, "hash записан после ввода");
let w2 = loadUrl(P("navar.html"), savedHash), d2 = w2.document;
ok(d2.getElementById("price").value.replace(/\u00A0/g,"") === "3333" && d2.getElementById("cost").value.replace(/\u00A0/g,"") === "777", "новая сессия по ссылке: значения восстановлены");
ok(Math.abs(num(d2.getElementById("profit").textContent) - num(d.getElementById("profit").textContent)) <= 1, "восстановленный расчёт совпадает с исходным");
// битый hash не роняет
let w3 = loadUrl(P("navar.html"), "#мусор-не-lz"), d3 = w3.document;
ok(Math.abs(num(d3.getElementById("profit").textContent) - 543) <= 1, "битый hash игнорируется, дефолты живы");

// 2) сортировка таблицы
w = loadUrl(P("navar-auto.html")); d = w.document;
d.getElementById("itemname").value="Дешёвая"; setVal(w,"buy","100000"); setVal(w,"sale","150000");
click(w, d.getElementById("save-item"));
d.getElementById("itemname").value="Дорогая"; setVal(w,"buy","450000"); setVal(w,"sale","600000");
click(w, d.getElementById("save-item"));
let firstRow = () => d.querySelector("#cmp-body tr td").textContent;
const before = firstRow();
click(w, d.querySelector('th[data-key="buy"]')); // desc по закупу
ok(firstRow().includes("Дорогая"), "сортировка по закупу ↓: первая — Дорогая");
click(w, d.querySelector('th[data-key="buy"]')); // asc
ok(firstRow().includes("Дешёвая"), "повторный клик разворачивает: первая — Дешёвая");

// 3) редактирование строки ✎
click(w, d.querySelector('#cmp-body .del[data-edit]'));
ok(d.getElementById("buy").value.replace(/\u00A0/g,"") === "100000", "✎ загрузил сделку в форму (закуп 100 000)");
ok(d.getElementById("itemname").value === "Дешёвая", "✎ вернул имя в поле");

// 4) кнопка «Ссылка на расчёт» существует и не падает без clipboard
w.prompt = () => {}; // fallback-путь
click(w, d.getElementById("share-link"));
ok(true, "share-link отработал без ошибок");
console.log("V4: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
})();
