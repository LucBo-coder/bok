// Đổi ngôn ngữ trên site tĩnh: trang không được tải lại liên tục, chữ phải đổi, game vẫn chơi được.
// Dùng: VK2_URL=http://127.0.0.1:8766 NODE_PATH=<thư mục có playwright-core> node vk2/tests/lang.js
const { chromium } = require("playwright-core");

const BASE = (process.env.VK2_URL || "http://127.0.0.1:8766").replace(/\/$/, "");
const SETTLE_MS = 3000;
const MAX_LOADS = 3; // Mở trang, cộng lần tải lại do chính cú bấm đổi ngôn ngữ
const VI_CHARS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" ? `  [${extra}]` : ""}`);
};
/** Lỗi hydrate #418 là cái giá đã biết: HTML tĩnh là tiếng Việt, client vẽ lại bằng tiếng Anh. */
const realErrors = (errs) => errs.filter((e) => !/Minified React error #418/.test(e));

async function open(browser, url, lang) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const track = { loads: 0, errs: [] };
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) track.loads++;
  });
  page.on("pageerror", (e) => track.errs.push(e.message));
  if (lang) await ctx.addInitScript((l) => localStorage.getItem("vkl.lang") ?? localStorage.setItem("vkl.lang", l), lang);
  await page.goto(url, { waitUntil: "load" });
  await sleep(SETTLE_MS);
  return { ctx, page, track };
}
const text = (page) => page.evaluate(() => document.body.innerText);

async function enterGame(page) {
  for (let i = 0; i < 60; i++) {
    if (await page.locator("#vk2-hud").count()) return true;
    await page.evaluate(() => {
      const wanted = /^Be reborn|^(Skip|Close|Next|Continue|Got it|Later)$/i;
      [...document.querySelectorAll("button, a")].find((b) => wanted.test((b.textContent || "").trim()) && b.offsetParent !== null)?.click();
    });
    await sleep(500);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  // Bấm đúng nút trên trang chủ
  {
    const { ctx, page, track } = await open(browser, `${BASE}/`);
    check("trang chủ mặc định là tiếng Việt", /Cách chơi/.test(await text(page)));
    await page.click(`.lang-seg button[title="English"]`);
    await sleep(SETTLE_MS);
    const t = await text(page);
    check("bấm EN thì trang sang tiếng Anh", /How to play/.test(t));
    check("lời giới thiệu mới hiện bằng tiếng Anh", /What you built stays in the world/.test(t));
    const before = track.loads;
    await sleep(SETTLE_MS);
    check("không tải lại liên tục sau khi bấm EN", track.loads === before && track.loads <= MAX_LOADS + 1, `${track.loads} lượt`);
    check("không có lỗi JS ngoài hydrate", realErrors(track.errs).length === 0, realErrors(track.errs)[0] ?? "");
    await page.click(`.lang-seg button[title="Tiếng Việt"]`);
    await sleep(SETTLE_MS);
    check("bấm VI thì về tiếng Việt", /Cách chơi/.test(await text(page)));
    const again = track.loads;
    await sleep(SETTLE_MS);
    check("không tải lại liên tục sau khi về VI", track.loads === again, `${track.loads} lượt`);
    await ctx.close();
  }

  // Mở thẳng từng trang khi đã chọn tiếng Anh
  for (const route of ["/", "/choi/", "/cap-nhat/", "/nghia-trang/", "/so-sinh-tu/"]) {
    const { ctx, page, track } = await open(browser, `${BASE}${route}`, "en");
    const first = track.loads;
    await sleep(SETTLE_MS);
    check(`${route} không tải lại liên tục`, track.loads === first && first <= MAX_LOADS, `${first} → ${track.loads}`);
    check(`${route} không có lỗi JS ngoài hydrate`, realErrors(track.errs).length === 0, realErrors(track.errs)[0] ?? "");
    await ctx.close();
  }

  // Liên kết ?lang=en
  {
    const { ctx, page, track } = await open(browser, `${BASE}/?lang=en`);
    const first = track.loads;
    await sleep(SETTLE_MS);
    check("?lang=en chuyển một lần rồi dừng", track.loads === first && first <= MAX_LOADS + 1, `${first} → ${track.loads}`);
    check("?lang=en cho trang tiếng Anh, bỏ tham số khỏi địa chỉ", /How to play/.test(await text(page)) && !page.url().includes("lang="), page.url());
    await ctx.close();
  }

  // Chơi được bằng tiếng Anh, kể cả tải lại trang
  {
    const { ctx, page, track } = await open(browser, `${BASE}/choi/`, "en");
    check("vào được game bằng tiếng Anh", await enterGame(page));
    const age = () => page.evaluate(() => globalThis.__VK2?._test?.char()?.age ?? -1);
    const a0 = await age();
    let a1 = a0;
    for (let i = 0; i < 80 && a1 < a0 + 2; i++) {
      // Dọn hướng dẫn và kỳ ngộ gốc như người chơi, rồi bấm chạy và tăng tốc
      await page.evaluate(() => {
        const vis = (b) => b.offsetParent !== null && !b.disabled;
        const btns = [...document.querySelectorAll("button")].filter(vis);
        const dismiss = btns.find((b) => /^(Got it|Continue|Next|Close|Skip)$/i.test(b.textContent.trim()));
        if (dismiss) return dismiss.click();
        const pick = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off")).pop();
        if (pick) return pick.click();
        btns.find((b) => b.textContent.trim() === "16×")?.click();
        btns.find((b) => b.textContent.trim() === "▶")?.click();
      });
      await sleep(400);
      a1 = await age();
    }
    check("thời gian trôi được bằng tiếng Anh", a0 >= 0 && a1 >= a0 + 2, `tuổi ${a0} → ${a1}`);
    await page.reload({ waitUntil: "load" });
    await sleep(SETTLE_MS);
    check("tải lại vẫn vào được game", await enterGame(page));

    // Chữ của mod: báo lại phần còn tiếng Việt, không tính là lỗi của lần sửa này
    await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());
    await page.click('#vk2-hud [data-tab="journey"]');
    await sleep(200);
    const groups = await page.$$eval("#vk2-modal .vk2-tabs [data-tab]", (l) => l.map((b) => b.dataset.tab));
    const left = [];
    for (const g of groups) {
      await page.click(`#vk2-modal .vk2-tabs [data-tab="${g}"]`);
      await sleep(80);
      const subs = await page.$$eval("#vk2-modal .vk2-subtabs [data-tab]", (l) => l.map((b) => b.dataset.tab));
      for (const s of subs.length ? subs : [g]) {
        if (subs.length) await page.click(`#vk2-modal .vk2-subtabs [data-tab="${s}"]`);
        await sleep(80);
        const lines = (await page.evaluate(() => document.querySelector("#vk2-modal")?.innerText ?? "")).split("\n");
        const vi = lines.filter((l) => VI_CHARS.test(l));
        if (vi.length) left.push(`${s}: ${vi.length} (${vi.slice(0, 5).map((l) => l.slice(0, 70)).join(" / ")})`);
      }
    }
    console.log(`INFO  chữ còn tiếng Việt trong bảng của mod: ${left.length ? left.join(" | ") : "không có"}`);
    check("không có lỗi JS ngoài hydrate khi chơi", realErrors(track.errs).length === 0, realErrors(track.errs)[0] ?? "");
    await ctx.close();
  }

  await browser.close();
  console.log(fails ? `${fails} lỗi` : "Tất cả đạt");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
