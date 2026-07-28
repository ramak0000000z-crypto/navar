// Единый конвейер проверки линейки «Навар».
// Запуск: node runner.js   (путь к html — через NAVAR_DIR, по умолчанию текущая папка на ПК)
const { execSync } = require("child_process");
const suites = ["test.js","test2.js","test3.js","test4.js","test5.js","test6.js","test7.js","test8.js"];
let failed = [];
for (const s of suites) {
  try { execSync(`node ${s}`, {stdio:"pipe", env:process.env}); process.stdout.write("✓ " + s + "\n"); }
  catch(e){ failed.push(s); process.stdout.write("✗ " + s + "\n" + e.stdout + "\n"); }
}
console.log(failed.length ? "ПРОВАЛ: " + failed.join(", ") : "КОНВЕЙЕР ЗЕЛЁНЫЙ — можно поднимать версию и выкладывать");
process.exit(failed.length ? 1 : 0);
