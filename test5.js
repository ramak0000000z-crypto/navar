const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(s){ return parseFloat(s.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function load(f){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }
function click(w,s){ w.document.querySelector(s).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }

console.log("V3 — доля доставки, ДРР, НПД-предупреждение:");
let w = load("./navar.html"), d = w.document;

// доля доставки 0% → комиссии и обратки нет, упаковка по разу: net = 1200-400-40-60 = 700
setVal(w,"share","0");
ok(Math.abs(num(d.getElementById("profit").textContent) - 700) <= 1, "share 0%: продажа из рук в руки = 700₽");
ok(num(d.getElementById("avitoshare").textContent) <= 5, "share 0%: Авито забирает только ДРР (5%)");
// 50%: fee 75, packEff 40*(0.5·1.176+0.5)=43.53 → net = 1200-400-43.53-75-60 = 621.5
setVal(w,"share","50");
ok(Math.abs(num(d.getElementById("profit").textContent) - 621.5) <= 1.5, "share 50%: полукомиссия = 621,5₽");
setVal(w,"share","100");

// ДРР растёт с ценой: удвоение цены удваивает рублёвую рекламу
setVal(w,"price","2400"); // fee: (2700)*6%=162 (уже больше мин.150!)
// net = 2400-400-47.06-162-120 = 1670.94
ok(Math.abs(num(d.getElementById("profit").textContent) - 1671) <= 2, "ДРР масштабируется с ценой (1671₽)");
setVal(w,"price","1200");

// НПД-предупреждение
click(w,'#tax-seg button[data-tax="npd"]');
ok(d.getElementById("npd-warn").style.display === "block", "предупреждение НПД показано");
click(w,'#tax-seg button[data-tax="none"]');
ok(d.getElementById("npd-warn").style.display === "none", "предупреждение НПД скрыто");

console.log("V3 — Навар.Авто: НДФЛ за год, подписи:");
w = load("./navar-auto.html"); d = w.document;
click(w,'#tax-seg button[data-tax="ndfl"]');
// per-deal tax: (582000-450000)*0.13=17160; deals 13.036 → за год ≈223 700
const yt = num(d.getElementById("y-tax").textContent);
ok(Math.abs(yt - 17160*365/28) <= 300, "НДФЛ за год ≈ 223 700 (" + yt + ")");
ok(d.body.innerHTML.includes("перегон"), "перегон в подписи расходов");
ok(d.body.innerHTML.includes("Линейная оценка"), "честная оговорка у годового темпа");

console.log("\nV3: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
