// Kiểm thử save của chế độ khách khi tắt hẳn trình duyệt rồi mở lại, dùng hồ sơ trình duyệt thật trên đĩa.
// Dùng: VK2_URL=http://127.0.0.1:8766 NODE_PATH=<...> node vk2/tests/restart.js <thư-mục-hồ-sơ-tạm>
const { chromium } = require("playwright-core");
const fs = require("node:fs");

const ROOT = process.env.VK2_URL || "http://127.0.0.1:8766";
const DIR = process.argv[2];
if (!DIR) throw new Error("Thiếu thư mục hồ sơ tạm");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`);
};

async function open() {
  const ctx = await chromium.launchPersistentContext(DIR, { channel: "msedge", headless: true, viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    globalThis.__persistCalls = 0;
    const s = navigator.storage;
    if (s?.persist) {
      const real = s.persist.bind(s);
      s.persist = () => {
        globalThis.__persistCalls++;
        return real();
      };
    }
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(`${ROOT}/choi/`, { waitUntil: "load" });
  return { ctx, page };
}

async function enter(page) {
  for (let i = 0; i < 40 && !(await page.locator("#vk2-hud").count()); i++) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button, a")].find((x) => /Đầu thai|Bỏ qua|Ngẫu nhiên|Đã hiểu/.test(x.textContent) && x.offsetParent);
      if (b) b.click();
    });
    await sleep(600);
  }
}

const play = async (page, rounds) => {
  for (let i = 0; i < rounds; i++) {
    await page.evaluate(() => {
      const all = [...document.querySelectorAll("button, .choices .choice")].filter((b) => b.offsetParent && !b.disabled);
      const b = all.find((x) => x.matches(".choice, .cn-skip") || /Đã hiểu/.test(x.textContent)) ?? all.find((x) => x.textContent.trim() === "▶");
      if (b) b.click();
    });
    await sleep(500);
  }
};

const snap = (page) =>
  page.evaluate(() => {
    const c = globalThis.__VK2?._test?.char();
    if (!c) return null;
    const a = JSON.parse(localStorage.getItem("vk2.acct.guest") ?? "null");
    return { name: c.name, age: Math.floor(c.age), log: c.log.length, vk2: JSON.stringify(c.vk2?.c ?? {}), acct: !!a };
  });

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  let { ctx, page } = await open();
  await enter(page);
  await play(page, 40);
  check("mod có xin lưu trữ bền vững", await page.evaluate(() => globalThis.__persistCalls >= 1 || !navigator.storage?.persist));
  const first = await snap(page);
  check("đã có nhân vật để thử", !!first?.name && first.acct, JSON.stringify(first));

  // Đóng trang bình thường: giống vuốt tắt app, trình duyệt gửi pagehide nên game lưu ngay.
  await page.close({ runBeforeUnload: true });
  await sleep(800);
  await ctx.close();
  await sleep(1000);

  ({ ctx, page } = await open());
  await sleep(2500);
  check("mở lại vào thẳng nhân vật cũ, không phải tạo mới", (await page.locator("#vk2-hud").count()) === 1);
  const second = await snap(page);
  check("giữ tên và tiến trình nhiệm vụ", second?.name === first.name && second.acct && second.vk2.length >= 2, `${first.name} → ${second?.name}`);
  check("đóng trang bình thường không mất tuổi", second && second.age >= first.age, `${first.age} → ${second?.age}`);
  check("giữ nhật ký", second && second.log >= first.log, `${first.log} → ${second?.log}`);

  // Sập đột ngột: chỉ mất phần sau lần tự lưu gần nhất, nhân vật vẫn còn.
  await play(page, 12);
  const third = await snap(page);
  await ctx.close();
  await sleep(1000);
  ({ ctx, page } = await open());
  await sleep(2500);
  const fourth = await snap(page);
  check("tắt đột ngột vẫn còn nhân vật", fourth?.name === first.name, `tuổi ${third?.age} → ${fourth?.age}`);
  await ctx.close();
  console.log(fails ? `${fails} lỗi` : "Tất cả đạt");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
