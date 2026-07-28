const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(s){ return parseFloat(s.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function loadUrl(f, hash){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"file:///app.html"+(hash||"")}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }
function click(w,el){ el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }
const P = p => (process.env.NAVAR_DIR||".") + "/" + p;

(async () => {
console.log("V4.1 — таблица в ссылке, a11y, живой title:");
let w = loadUrl(P("navar-auto.html")), d = w.document;

// сохраняю две сделки, жду дебаунс, забираю ссылку
d.getElementById("itemname").value="Королла"; setVal(w,"buy","300000"); setVal(w,"sale","420000");
click(w, d.getElementById("save-item"));
d.getElementById("itemname").value="Пассат"; setVal(w,"buy","450000"); setVal(w,"sale","600000");
click(w, d.getElementById("save-item"));
await new Promise(r=>setTimeout(r,950));
const link = w.location.hash;
ok(link.length > 30, "ссылка содержит данные");

// новая сессия по ссылке: обе сделки на месте, цифры пересчитаны честно
let w2 = loadUrl(P("navar-auto.html"), link), d2 = w2.document;
const rows = d2.querySelectorAll("#cmp-body tr");
ok(rows.length === 2, "по ссылке восстановлены обе сделки");
ok(d2.getElementById("cmp-body").textContent.includes("Королла") && d2.getElementById("cmp-body").textContent.includes("Пассат"), "имена сделок восстановлены");
// Пассат: 600000*0.97=582000; 582000-450000-35000-8000-2000-3000=84000
const passatRow = [...rows].find(r=>r.textContent.includes("Пассат"));
ok(passatRow && Math.abs(num(passatRow.cells[3].textContent) - 84000) <= 5, "навар Пассата пересчитан по ссылке: 84 000");
// форма тоже восстановлена (последние введённые значения)
ok(d2.getElementById("buy").value.replace(/\u00A0/g,"") === "450000", "форма восстановлена из ссылки");

// живой заголовок вкладки
ok(w2.document.title.includes("Навар.Авто"), "title статичный, бренд на месте");

// a11y: подписи связаны с полями
ok(d2.querySelector('label[for="buy"]') !== null, 'label for="buy" присутствует');
ok(d2.getElementById("profit").getAttribute("aria-live") === "polite", "aria-live на главной цифре");

// Навар: то же самое смок-тестом
w = loadUrl(P("navar.html")); d = w.document;
ok(d.querySelector('label[for="price"]') !== null, 'Навар: label for="price" присутствует');
ok(w.document.title.includes("Навар"), "Навар: title на месте");

console.log("V4.1: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
})();
