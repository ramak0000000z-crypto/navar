const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(s){ return parseFloat(s.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function load(f){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true}).window; }
function setVal(w,id,v){ const el=w.document.getElementById(id); el.value=String(v); el.dispatchEvent(new w.Event("input",{bubbles:true})); }

// НАВАР: перекладка комиссии. Эталон вручную: в зоне мин.удержания и без налога
// net(1200)=553, без комиссии было бы 703 → нужная цена 1350 (+150 ровно, т.к. fee=const)
let w = load("./navar.html"), d = w.document;
const pf = d.getElementById("passfee").textContent;
ok(Math.abs(num(pf) - 1365) <= 2, "перекладка комиссии: ≈1365 ₽ (0.95P−597.06=700, вручную)");
ok(num(pf.split("+")[1]) > 150, "прибавка больше комиссии — ДРР тоже растёт с ценой");

// при цене в процентной зоне (5000₽): fee=(5000+300)*6%=318, прибавка должна быть >318 (комиссия растёт с ценой)
setVal(w,"price","5000");
const pf2 = num(d.getElementById("passfee").textContent);
ok(pf2 > 5350 && pf2 < 5380, "процентная зона: прибавка больше самой комиссии (" + pf2 + ")");

// НАВАР.АВТО: стресс-тест. Эталон вручную: скидка 3%+5%, 51 день →
// 600000*0.92=552000; 552000-450000-48000=54000; 54000/51=1058.8
w = load("./navar-auto.html"); d = w.document;
ok(Math.abs(num(d.getElementById("st-net").textContent) - 31500) <= 5, "зависание, ремонт +5% закупа: 31 500");
ok(Math.abs(num(d.getElementById("st-perday").textContent) - 618) <= 2, "зависание: 618 ₽/день против 4 000");
// стресс реагирует на ввод
setVal(w,"st-disc","10");
ok(num(d.getElementById("st-net").textContent) < 31500, "рост скидки уменьшает навар");
// поле поиска переименовано
ok(d.body.innerHTML.includes("осмотры, бензин"), "поле расходов на поиск уточнено");

console.log("ФИШКИ: " + pass + " passed, " + fail + " failed");
process.exit(fail?1:0);
