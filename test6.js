const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(s){ return parseFloat(s.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function load(f){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }

const P = p => (process.env.NAVAR_DIR||".") + "/" + p;
console.log("V3.0 — фиксы критики р2:");
let w = load(P("navar.html")), d = w.document;
ok(d.getElementById("sb-profit").textContent.includes("543"), "липкая строка показывает навар");
ok(d.body.innerHTML.includes("только по заказам с доставкой"), "подпись отмен уточнена");
ok(d.getElementById("drr-rub").textContent.includes("60"), "ДРР-хелпер: ≈60 ₽ с продажи");
ok(d.getElementById("drr-rub").textContent.includes("2 980".replace(" ","\u00A0")), "поднятие 149₽ окупается от 2 980 ₽ (149/0.05)");
setVal(w,"price","2400");
ok(d.getElementById("sb-profit").textContent === d.getElementById("profit").textContent + " ₽" || num(d.getElementById("sb-profit").textContent) === num(d.getElementById("profit").textContent), "липкая строка синхронна с вердиктом");

w = load(P("navar-auto.html")); d = w.document;
ok(num(d.getElementById("st-net").textContent) === 31500 || Math.abs(num(d.getElementById("st-net").textContent)-31500)<=5, "стресс: ремонт 5% закупа = 31 500");
// цена выезда: 454 000 / 0.95 = 477 894.7
ok(Math.abs(num(d.getElementById("adprice").textContent) - 477895) <= 10, "выезжать на объявления до ≈477 895 ₽");
setVal(w,"buy-haggle","10");
ok(Math.abs(num(d.getElementById("adprice").textContent) - 454000/0.9) <= 10, "торг продавца 10% → потолок объявления 504 444");
ok(num(d.getElementById("sb-profit").textContent) === 84000 || Math.abs(num(d.getElementById("sb-profit").textContent)-84000)<=5, "липкая строка авто: 84 000");
console.log("V3.0: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
