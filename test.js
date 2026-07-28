const { JSDOM } = require("jsdom");
const fs = require("fs");

let pass = 0, fail = 0;
function ok(cond, name){ if(cond){pass++;} else {fail++; console.log("  FAIL:", name);} }
function approx(a,b,eps=1){ return Math.abs(a-b)<=eps; }
function num(el){ return parseFloat(el.textContent.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }

function load(file){
  const html = fs.readFileSync(file,"utf8");
  const dom = new JSDOM(html, {runScripts:"dangerously", pretendToBeVisual:true});
  return dom.window;
}
function setVal(w,id,v){
  const el = w.document.getElementById(id);
  el.value = String(v);
  el.dispatchEvent(new w.Event("input",{bubbles:true}));
}
function click(w,sel){ w.document.querySelector(sel).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }

/* ============ НАВАР (Авито) ============ */
console.log("НАВАР (Авито):");
let w = load("./navar.html");
let d = w.document;

// базовый сценарий (эталон из аналитической проверки: net 552.9, be 647.06, eff 12.5%)
ok(approx(num(d.getElementById("profit")), 543), "базовый навар = 543 (ДРР 5%)");
ok(d.getElementById("effcomm").textContent.includes("12,5"), "эффективная комиссия 12,5% (мин.удержание)");
ok(approx(num(d.getElementById("breakeven")), 628), "безубыточность = 628,5");

// налоги переключаются
click(w, '#tax-seg button[data-tax="usn6"]');
ok(approx(num(d.getElementById("profit")), 543 - 1200*0.06), "УСН6 вычитает 72₽");
click(w, '#tax-seg button[data-tax="none"]');

// крайние: цена 0
setVal(w,"price",0);
ok(num(d.getElementById("profit")) < 0, "цена 0 → честный минус, без NaN");
ok(!d.getElementById("margin").textContent.includes("NaN"), "маржа при цене 0 не NaN");
setVal(w,"price",1200);

// крайние: невыкуп 90 (макс клампа)
setVal(w,"cancel",200);
ok(!isNaN(num(d.getElementById("profit"))), "невыкуп 200% клампится, расчёт жив");
setVal(w,"cancel",15);

// дешёвый товар: eff 50%
setVal(w,"price",300);
ok(d.getElementById("effcomm").textContent.includes("50"), "товар 300₽ → эфф. комиссия 50%");
setVal(w,"price",1200);

// сохранение + XSS в имени
d.getElementById("itemname").value = '<img src=x onerror="w.hacked=1">';
click(w,"#save-item");
ok(d.querySelectorAll("#cmp-body tr").length === 1, "товар сохранился в таблицу");
ok(!d.getElementById("cmp-body").innerHTML.includes("<img"), "XSS в имени экранирован");
click(w,"#save-item"); // второй товар
ok(d.querySelector("#cmp-body tr.best") !== null || d.querySelectorAll("#cmp-body tr").length===2, "два товара, сравнение работает");
// удаление
d.querySelector("#cmp-body .del[data-ix]").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
ok(d.querySelectorAll("#cmp-body tr").length === 1, "удаление строки работает");

/* ============ НАВАР.АВТО ============ */
console.log("НАВАР.АВТО:");
w = load("./navar-auto.html");
d = w.document;

// эталон: net 84000, perday 4000, maxbuy 454000
ok(approx(num(d.getElementById("profit")), 84000, 5), "базовый навар = 84 000");
ok(approx(num(d.getElementById("perday")), 4000, 5), "навар в день = 4 000");
ok(approx(num(d.getElementById("maxbuy")), 454000, 10), "потолок торга = 454 000");

// НДФЛ: maxbuy 434 874
click(w, '#tax-seg button[data-tax="ndfl"]');
ok(approx(num(d.getElementById("maxbuy")), 434874, 10), "потолок торга с НДФЛ = 434 874");
click(w, '#tax-seg button[data-tax="none"]');

// годовой темп: 13.0 сделок, 1 095 000
ok(d.getElementById("y-deals").textContent.replace(",",".").startsWith("13"), "13 сделок в год");
ok(approx(num(d.getElementById("y-profit")), 1095000, 500), "годовой навар ≈ 1 095 000");

// недостижимая цель
setVal(w,"goal",900000);
ok(d.getElementById("maxbuy").textContent.includes("недостижима"), "недостижимая цель — словами, не NaN");
setVal(w,"goal",80000);

// переплата → минус
setVal(w,"buy",590000);
ok(num(d.getElementById("profit")) < 0 && d.getElementById("status-txt").textContent.includes("минус"), "переплата → минус и статус");
setVal(w,"buy",450000);

// продажа 0
setVal(w,"sale",0);
ok(!d.getElementById("margin").textContent.includes("NaN"), "продажа 0 → без NaN");
setVal(w,"sale",600000);

// сохранение сделок + экспорт-структура
d.getElementById("itemname").value = "Королла 2012";
click(w,"#save-item");
ok(d.querySelectorAll("#cmp-body tr").length === 1, "сделка сохранилась");

console.log("\nИТОГ: " + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
