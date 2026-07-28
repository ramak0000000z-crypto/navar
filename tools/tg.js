// Публикация в Telegram-канал «Навар» через бота. Без зависимостей (fetch из Node).
//
//   node tools/tg.js check            — проверить бота и доступ к каналу
//   node tools/tg.js next [--dry]     — опубликовать следующий неопубликованный пост
//   node tools/tg.js post 3 [--dry]   — опубликовать конкретный пост
//   node tools/tg.js list             — что опубликовано, что в очереди
//   node tools/tg.js signals          — считать нажатия «хочу PRO» (кто написал боту)
//
// Токен НЕ хранится в репозитории и не передаётся в переписке:
//   положи его в .claude/telegram.token (файл в .gitignore) или в переменную
//   окружения NAVAR_TG_TOKEN. Адрес канала — в launch/channel.txt (например @navar_calc).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS = path.join(ROOT, "launch", "posts-telegram.md");
const STATE = path.join(ROOT, "launch", "published.json");
const TOKEN_FILE = path.join(ROOT, ".claude", "telegram.token");
const CHANNEL_FILE = path.join(ROOT, "launch", "channel.txt");

function token() {
  const t = process.env.NAVAR_TG_TOKEN ||
    (fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, "utf8").trim() : "");
  if (!t) die("Нет токена бота. Создай бота у @BotFather и положи токен в .claude/telegram.token\n" +
              "(файл в .gitignore) или в переменную окружения NAVAR_TG_TOKEN.");
  return t;
}
function channel() {
  const c = process.env.NAVAR_TG_CHAT ||
    (fs.existsSync(CHANNEL_FILE) ? fs.readFileSync(CHANNEL_FILE, "utf8").trim() : "");
  if (!c) die("Нет адреса канала. Впиши его в launch/channel.txt, например: @navar_calc");
  return c;
}
function die(msg) { console.error("ОШИБКА: " + msg); process.exit(1); }

async function api(method, params) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  const data = await res.json();
  if (!data.ok) die(`Telegram отказал (${method}): ${data.description}`);
  return data.result;
}

/* ---------- посты ---------- */
function readPosts() {
  if (!fs.existsSync(POSTS)) die("Не найден файл с постами: " + POSTS);
  const src = fs.readFileSync(POSTS, "utf8");
  const parts = src.split(/^## Пост /m).slice(1);
  return parts.map((chunk) => {
    const nl = chunk.indexOf("\n");
    const heading = chunk.slice(0, nl).trim();          // "1. Почему «6%» — это 12,5%"
    const num = parseInt(heading, 10);
    // "6 (когда будет повод). Изменения-2026" -> "Изменения-2026"
    const title = heading.replace(/^\d+/, "").replace(/^\s*\([^)]*\)/, "").replace(/^[.\s]+/, "").trim();
    let body = chunk.slice(nl + 1).split(/^---\s*$/m)[0].trim();
    return { num, title, body, draft: /когда будет повод/i.test(heading) };
  }).filter((p) => !isNaN(p.num));
}

// Markdown -> HTML для Telegram (жирный, остальное — как есть; ссылки Telegram ловит сам)
function toHtml(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

function state() {
  return fs.existsSync(STATE)
    ? JSON.parse(fs.readFileSync(STATE, "utf8"))
    : { published: [], history: [] };
}
function saveState(s) { fs.writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n", "utf8"); }

async function publish(post, dry) {
  const text = "<b>" + toHtml(post.title) + "</b>\n\n" + toHtml(post.body);
  if (text.length > 4096) die(`Пост ${post.num} длиннее лимита Telegram (${text.length} > 4096).`);
  if (dry) {
    console.log("--- ЧЕРНОВИК, НИЧЕГО НЕ ОТПРАВЛЕНО (пост " + post.num + ") ---");
    console.log(text);
    return;
  }
  const msg = await api("sendMessage", {
    chat_id: channel(), text, parse_mode: "HTML", disable_web_page_preview: false,
  });
  const s = state();
  s.published.push(post.num);
  s.history.push({ num: post.num, title: post.title, at: new Date().toISOString(), messageId: msg.message_id });
  saveState(s);
  console.log(`Опубликован пост ${post.num}: «${post.title}» (сообщение ${msg.message_id})`);
}

/* ---------- команды ---------- */
async function main() {
  const cmd = process.argv[2] || "list";
  const dry = process.argv.includes("--dry");
  const posts = readPosts();

  if (cmd === "check") {
    const me = await api("getMe");
    console.log(`Бот: @${me.username} (${me.first_name})`);
    const chat = await api("getChat", { chat_id: channel() });
    console.log(`Канал: ${chat.title} (${chat.type}${chat.username ? ", @" + chat.username : ""})`);
    const admins = await api("getChatAdministrators", { chat_id: channel() });
    const isAdmin = admins.some((a) => a.user && a.user.id === me.id);
    console.log(isAdmin
      ? "Бот админ канала — публиковать можно."
      : "ВНИМАНИЕ: бот не админ канала. Добавь его админом с правом публикации.");
    console.log(`Постов в очереди: ${posts.filter((p) => !p.draft).length}, опубликовано: ${state().published.length}`);
    return;
  }

  if (cmd === "list") {
    const s = state();
    for (const p of posts) {
      const mark = s.published.includes(p.num) ? "опубликован" : p.draft ? "черновик (ждёт повода)" : "в очереди";
      console.log(`${p.num}. ${p.title} — ${mark}`);
    }
    return;
  }

  if (cmd === "post") {
    const num = parseInt(process.argv[3], 10);
    const p = posts.find((x) => x.num === num);
    if (!p) die("Нет поста с номером " + process.argv[3]);
    if (state().published.includes(num) && !dry) die(`Пост ${num} уже публиковался. Повтор — только руками.`);
    await publish(p, dry);
    return;
  }

  if (cmd === "next") {
    const s = state();
    const p = posts.find((x) => !x.draft && !s.published.includes(x.num));
    if (!p) { console.log("Очередь пуста — все готовые посты опубликованы. Нужны новые."); return; }
    await publish(p, dry);
    return;
  }

  if (cmd === "setup") {
    // Текст, который человек видит в пустом чате с ботом — ДО того, как нажмёт «Старт».
    await api("setMyShortDescription", {
      short_description: "Честные калькуляторы навара: Авито и авто-перекуп. Бесплатно, считают прямо в браузере.",
    });
    await api("setMyDescription", {
      description:
        "Бот проекта «Навар» — честные калькуляторы для тех, кто продаёт.\n\n" +
        "Нажми «Старт», если тебе нужен PRO: сохранение расчётов между сессиями, сравнение периодов, " +
        "выгрузка в таблицу, уведомления об изменении тарифов Авито.\n\n" +
        "Мы пока ничего не продаём — считаем, скольким это нужно, и сделаем в первую очередь то, что просят.\n\n" +
        "Сами калькуляторы бесплатны и работают без интернета: ramak0000000z-crypto.github.io/navar/",
    });
    console.log("Описание бота обновлено — видно в пустом чате до нажатия «Старт».");
    return;
  }

  if (cmd === "reply") {
    // Отвечаем тем, кто написал боту и ещё не получил ответа (сервера нет, отвечаем пачкой).
    const s = state();
    s.answered = s.answered || [];
    const ups = await api("getUpdates", { limit: 100, allowed_updates: ["message"] });
    const starts = ups.filter((u) => u.message && /^\/start/.test(u.message.text || ""));
    const fresh = starts.filter((u) => !s.answered.includes(u.message.from.id));
    if (!fresh.length) { console.log("Новых обращений нет — отвечать некому."); return; }
    for (const u of fresh) {
      const name = u.message.from.first_name || "";
      const text =
        (name ? name + ", с" : "С") + "пасибо — записал.\n\n" +
        "PRO пока в разработке, денег не берём. Как будет готов — напишу тебе первым, " +
        "и список возможностей соберём по таким заявкам.\n\n" +
        "Если хочешь повлиять на то, что войдёт в PRO — просто ответь сюда, чего не хватает.\n\n" +
        "Пока пользуйся бесплатными: https://ramak0000000z-crypto.github.io/navar/";
      if (dry) { console.log("--- ЧЕРНОВИК для " + (u.message.from.username || u.message.from.id) + " ---\n" + text); continue; }
      await api("sendMessage", { chat_id: u.message.chat.id, text });
      s.answered.push(u.message.from.id);
      console.log("Ответил: " + (u.message.from.username ? "@" + u.message.from.username : name || u.message.from.id));
    }
    if (!dry) saveState(s);
    return;
  }

  if (cmd === "signals") {
    // Нажатия «Хочу PRO» приходят боту как /start pro. getUpdates отдаёт последние сутки-двое.
    const ups = await api("getUpdates", { limit: 100, allowed_updates: ["message"] });
    const starts = ups.filter((u) => u.message && /^\/start/.test(u.message.text || ""));
    const pro = starts.filter((u) => /pro/i.test(u.message.text));
    const people = new Set(starts.map((u) => u.message.from.id));
    console.log(`Обращений к боту: ${starts.length}, из них «хочу PRO»: ${pro.length}, разных людей: ${people.size}`);
    for (const u of pro.slice(-10)) {
      const f = u.message.from;
      console.log(`  ${new Date(u.message.date * 1000).toLocaleString("ru-RU")} — ${f.first_name || ""} ${f.username ? "@" + f.username : "(без ника)"}`);
    }
    if (people.size === 0) console.log("Пока пусто. Порог решения — около 20 сигналов за 2–3 недели.");
    return;
  }

  die("Неизвестная команда. Доступно: check, list, next, post <номер>, setup, reply, signals. Флаг --dry — показать без отправки.");
}

main().catch((e) => die(e.message));
