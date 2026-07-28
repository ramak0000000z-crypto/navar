const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(el){ return parseFloat(el.textContent.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function load(f){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }
function click(w,s){ w.document.querySelector(s).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }

console.log("МЕТОДОЛОГИЯ V2 — НАВАР:");
let w = load("./navar.html"), d = w.document;

// 1. умный ввод: пробелы и запятая
setVal(w,"price","1 200");
ok(Math.abs(num(d.getElementById("profit")) - 543) <= 1, "ввод «1 200» с пробелом парсится");
setVal(w,"commission","6,0");
ok(Math.abs(num(d.getElementById("profit")) - 543) <= 1, "ввод «6,0» с запятой парсится");
// формат на blur
const priceEl = d.getElementById("price");
priceEl.dispatchEvent(new w.Event("blur",{bubbles:true}));
ok(priceEl.value.includes("\u00A0") || priceEl.value === "1 200".replace(" ","\u00A0"), "blur форматирует тысячи: " + JSON.stringify(priceEl.value));
priceEl.dispatchEvent(new w.Event("focus",{bubbles:true}));
ok(!priceEl.value.includes("\u00A0"), "focus снимает формат для правки");

// 2. обратка невыкупов: 50₽ при 15% отмен → +8.82₽ расходов → net ≈ 544
setVal(w,"retdeliv","50");
ok(Math.abs(num(d.getElementById("profit")) - (543 - 8.8)) <= 1.5, "обратка невыкупов вычитается (≈544)");
setVal(w,"retdeliv","0");

// 3. УСН15 минимальный налог 1%: делаем товар убыточным до налога
click(w,'#tax-seg button[data-tax="usn15"]');
setVal(w,"cost","1100"); // pre < 0 → налог всё равно 1% от 1200 = 12₽
let netLoss = num(d.getElementById("profit"));
setVal(w,"cost","400");
// при прибыльном: max(15%·pre, 1%·price)
let pre = 543; // pre без налога при дефолтах
let expected = pre - Math.max(pre*0.15, 1200*0.01);
ok(Math.abs(num(d.getElementById("profit")) - expected) <= 1.5, "УСН15: 15% с прибыли когда она есть");
click(w,'#tax-seg button[data-tax="none"]');

console.log("МЕТОДОЛОГИЯ V2 — НАВАР.АВТО:");
w = load("./navar-auto.html"); d = w.document;

// 4. умный ввод больших сумм
setVal(w,"buy","450 000");
ok(Math.abs(num(d.getElementById("profit")) - 84000) <= 5, "«450 000» с пробелом → навар 84 000");

// 5. стоимость денег: 20% годовых на 493 000 за 21 день = 5 672.9
setVal(w,"rate","20");
ok(Math.abs(num(d.getElementById("profit")) - (84000 - 5673)) <= 10, "кредитные деньги: −5 673₽ (78 327)");
ok(d.getElementById("wf-legend").textContent.includes("Проценты"), "проценты видны в раскладке");
setVal(w,"rate","0");

// 6. НДФЛ вычет 250 тыс.: дешёвая машина
click(w,'#tax-seg button[data-tax="ndfl"]');
setVal(w,"buy","100 000"); setVal(w,"sale","200 000");
setVal(w,"repair","10000"); setVal(w,"detail","0"); setVal(w,"docs","0"); setVal(w,"ads","0");
// saleReal=194 000 < вычета 250 000 → налог 0 → net = 194000-100000-10000 = 84 000
ok(Math.abs(num(d.getElementById("profit")) - 71780) <= 5, "дешёвая машина: НДФЛ по документам = 12 220, навар 71 780");
// дорогая: закуп больше вычета → база = saleReal − закуп (старый эталон живёт)
setVal(w,"buy","450 000"); setVal(w,"sale","600 000");
setVal(w,"repair","35000"); setVal(w,"detail","8000"); setVal(w,"docs","2000"); setVal(w,"ads","3000");
ok(Math.abs(num(d.getElementById("maxbuy")) - 434874) <= 10, "потолок торга с НДФЛ = 434 874 (по документам)");
click(w,'#tax-seg button[data-tax="none"]');
ok(Math.abs(num(d.getElementById("profit")) - 84000) <= 5, "базовый эталон жив: 84 000");

console.log("\nИТОГ V2: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
