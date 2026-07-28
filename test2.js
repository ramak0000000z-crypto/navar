const { JSDOM } = require("jsdom");
const fs = require("fs");
let pass=0, fail=0;
function ok(c,n){ if(c){pass++;} else {fail++; console.log("  FAIL:",n);} }
function num(el){ return parseFloat(el.textContent.replace(/\u00A0/g,"").replace("−","-").replace(",",".")); }
function load(f){ return new JSDOM(fs.readFileSync(f,"utf8"),{runScripts:"dangerously",pretendToBeVisual:true}).window; }
function click(w,sel){ w.document.querySelector(sel).dispatchEvent(new w.MouseEvent("click",{bubbles:true})); }

async function importJson(w, json){
  const input = w.document.getElementById("import-file");
  const file = new w.File([json], "t.json", {type:"application/json"});
  Object.defineProperty(input, "files", {value:[file], configurable:true});
  input.dispatchEvent(new w.Event("change",{bubbles:true}));
  await new Promise(r=>setTimeout(r,150)); // FileReader асинхронный
}

(async () => {
  /* ===== НАВАР ===== */
  console.log("НАВАР — импорт и налоговая колонка:");
  let w = load("./navar.html"), d = w.document;
  w.alert = ()=>{};

  // сохранение с УСН6 → колонка налога
  click(w,'#tax-seg button[data-tax="usn6"]');
  d.getElementById("itemname").value = "Чехлы";
  click(w,"#save-item");
  ok(d.querySelector("#cmp-body tr").textContent.includes("УСН 6%"), "колонка налога показывает УСН 6%");

  // импорт с подделанным net: inputs дают ~553₽ (без налога), а в файле вписано 999999
  const fake = JSON.stringify({app:"navar",version:1,items:[
    {name:"Подделка", tax:"none", net:999999, margin:99, avitoShare:1, monthly:9999999,
     inputs:{cost:400,price:1200,pack:40,cancel:15,share:100,commission:6,minfee:150,delivery:300,drr:5,placement:0,volume:40,targetm:25,retdeliv:0}}
  ]});
  await importJson(w, fake);
  const rows = [...d.querySelectorAll("#cmp-body tr")];
  ok(rows.length === 2, "импортированный товар добавился");
  const imported = rows.find(r=>r.textContent.includes("Подделка"));
  ok(imported && !imported.textContent.includes("999"), "подделанный навар НЕ показан");
  ok(imported && imported.textContent.includes("543"), "навар пересчитан честно: 543₽");

  // импорт мусора не роняет
  await importJson(w, JSON.stringify({app:"navar",items:[null, 42, {"noinputs":true}, "str"]}));
  ok(d.querySelectorAll("#cmp-body tr").length === 2, "битые элементы отброшены");
  await importJson(w, "{broken json");
  ok(d.querySelectorAll("#cmp-body tr").length === 2, "битый JSON не роняет приложение");

  // базовый расчёт не сломан рефактором
  click(w,'#tax-seg button[data-tax="none"]');
  ok(Math.abs(num(d.getElementById("profit")) - 543) <= 1, "основной расчёт жив: 543");

  /* ===== НАВАР.АВТО ===== */
  console.log("НАВАР.АВТО — импорт и налоговая колонка:");
  w = load("./navar-auto.html"); d = w.document;
  w.alert = ()=>{};

  click(w,'#tax-seg button[data-tax="ndfl"]');
  d.getElementById("itemname").value = "Солярис";
  click(w,"#save-item");
  ok(d.querySelector("#cmp-body tr").textContent.includes("НДФЛ"), "колонка налога: НДФЛ 13%");

  const fakeA = JSON.stringify({app:"navar-auto",version:1,items:[
    {name:"Фейк", tax:"none", net:5000000, perday:99999, roi:999,
     inputs:{buy:450000,sale:600000,haggle:3,repair:35000,detail:8000,docs:2000,ads:3000,days:21,parking:0,fee:0,goal:80000,gapdays:7}}
  ]});
  await importJson(w, fakeA);
  const rowsA = [...d.querySelectorAll("#cmp-body tr")];
  const imp = rowsA.find(r=>r.textContent.includes("Фейк"));
  ok(imp && imp.textContent.includes("84"), "навар сделки пересчитан: 84 000, фейк отброшен");
  ok(imp && !imp.textContent.includes("5 000 000".replace(/ /g,"\u00A0")), "5 млн из файла не показаны");

  // рефактор не сломал основное + потолок торга
  click(w,'#tax-seg button[data-tax="none"]');
  ok(Math.abs(num(d.getElementById("profit")) - 84000) <= 5, "основной расчёт жив: 84 000");
  ok(Math.abs(num(d.getElementById("maxbuy")) - 454000) <= 10, "потолок торга жив: 454 000");

  console.log("\nИТОГ ПРОХОДКИ 2: " + pass + " passed, " + fail + " failed");
  process.exit(fail?1:0);
})();
