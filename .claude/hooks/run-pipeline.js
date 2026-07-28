// Хук Claude Code: после правки *.html прогоняет конвейер (node runner.js).
// Красный конвейер -> exit 2, вывод уходит модели, сломанный код не покидает сессию.
const { execSync } = require("child_process");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let file = "";
  try {
    const j = JSON.parse(raw);
    file = (j.tool_input && j.tool_input.file_path) || (j.tool_response && j.tool_response.filePath) || "";
  } catch (_) {}
  if (!/\.html?$/i.test(file)) process.exit(0);
  try {
    execSync("node runner.js", { cwd: ROOT, stdio: "pipe", timeout: 110000 });
    process.exit(0);
  } catch (e) {
    const out = (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "");
    process.stderr.write("КОНВЕЙЕР КРАСНЫЙ после правки " + file + ":\n" + out);
    process.exit(2);
  }
});
