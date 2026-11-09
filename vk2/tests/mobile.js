// Kiểm thử giả lập điện thoại qua địa chỉ LAN thật (HTTP, không phải secure context như localhost).
// Dùng: VK2_URL=http://<ip>:8766 NODE_PATH=<...> node vk2/tests/mobile.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const { guard } = require("./popups");
const path = require("node:path");

const BASE = process.env.VK2_URL;
const OUT = process.argv[2] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`);
};

async function clearBlockers(page) {
  return page.evaluate(() => {
    const vis = (b) => b && b.offsetParent !== null && !b.disabled;
    const pick = [
      document.querySelector(".cn-wrap .cn-skip"),
      [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && vis(b)),
      [...document.querySelectorAll(".choices .choice")].find((b) => vis(b) && !b.classList.contains("off")),
    ].find(vis);
    if (pick) pick.click();
    return !!pick;
  });
}

/** Đo khung cảnh và nút dưới cùng: "không tràn ngang" không phát hiện được cảnh bị bóp mất. */
function layout(page) {
  return page.evaluate(() => {
    const btns = [...document.querySelectorAll(".game-bottom button, .dock button")].filter((b) => b.offsetParent);
    return {
      vh: innerHeight,
      stage: Math.round(document.querySelector(".stage").getBoundingClientRect().height),
      lastBtn: Math.max(...btns.map((b) => Math.round(b.getBoundingClientRect().bottom))),
    };
  });
}

async function run(page, size) {
  await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
  for (let i = 0; i < 40 && !(await page.locator("#vk2-hud").count()); i++) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button, a")].find((x) => /Đầu thai|Bỏ qua|Ngẫu nhiên|Đã hiểu/.test(x.textContent) && x.offsetParent !== null);
      if (b) b.click();
    });
    await sleep(600);
  }
  check(`${size}: vào được game qua LAN`, (await page.locator("#vk2-hud").count()) === 1);

  // Popup sự kiện đầu đời: bảng thu gọn và lựa chọn phải chạm tới được
  for (let i = 0; i < 12 && !(await page.locator(".game.has-event .choices .choice").count()); i++) {
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && b.offsetParent)?.click());
    await sleep(400);
  }
  if (await page.locator(".game.has-event .choices .choice").count()) {
    await sleep(600);
    const ev = await page.evaluate(() => {
      const r = document.querySelector(".choices .choice").getBoundingClientRect();
      return { bottom: Math.round(r.bottom), vh: innerHeight, rows: document.querySelectorAll("#vk2-hud .vk2-q").length };
    });
    check(`${size}: có sự kiện thì lựa chọn đầu nằm trong màn hình`, ev.bottom <= ev.vh && ev.rows === 0, JSON.stringify(ev));
    await page.screenshot({ path: path.join(OUT, `m-${size}-event.png`) });
  }

  for (let i = 0; i < 40; i++) {
    if (!(await page.evaluate(() => !!document.querySelector(".game.has-event, .cn-wrap, .coach")))) break;
    await clearBlockers(page);
    await sleep(350);
  }
  await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());
  await sleep(700);

  const free = !(await page.locator(".game.has-event").count());
  check(`${size}: mặc định thu gọn`, (await page.locator("#vk2-hud .vk2-q").count()) === 0);
  check(`${size}: không tràn ngang`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  const small = await page.evaluate(() => [...document.querySelectorAll("#vk2-hud button")].filter((b) => b.getBoundingClientRect().height < 36).map((b) => b.textContent.trim()));
  check(`${size}: nút đủ lớn để chạm (≥ 36px)`, small.length === 0, small.join(","));

  const head = page.locator('#vk2-hud [data-act="collapse"]');
  if (free) {
    await head.tap();
    await sleep(300);
    const rows = await page.locator("#vk2-hud .vk2-q").count();
    check(`${size}: chạm để mở rộng`, rows >= 1 && rows <= 3, `rows=${rows}`);
    await page.screenshot({ path: path.join(OUT, `m-${size}-open.png`) });
    await head.tap();
    await sleep(300);
    check(`${size}: chạm để thu gọn`, (await page.locator("#vk2-hud .vk2-q").count()) === 0);
  } else check(`${size}: thử mở rộng`, false, "vẫn còn sự kiện");

  await page.screenshot({ path: path.join(OUT, `m-${size}-game.png`) });

  // Thanh hành động của game phải bấm được, không bị bảng che
  const dock = await page.evaluate(() => {
    const b = [...document.querySelectorAll(".dock button, .dock-actions button")].find((x) => x.offsetParent !== null);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { own: b === hit || b.contains(hit), bottom: r.bottom, vh: innerHeight };
  });
  check(`${size}: thanh hành động không bị che`, dock && dock.own && dock.bottom <= dock.vh, JSON.stringify(dock));
  const logRoom = await page.evaluate(() => Math.round(document.querySelector(".game-scroll").getBoundingClientRect().height));
  const noHudRoom = await page.evaluate(async () => {
    const hud = document.querySelector("#vk2-hud");
    hud.style.display = "none";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const h = Math.round(document.querySelector(".game-scroll").getBoundingClientRect().height);
    hud.style.display = "";
    return h;
  });
  check(`${size}: nhật ký gốc còn đủ chỗ đọc`, logRoom >= 90 && noHudRoom - logRoom <= 48, `có bảng ${logRoom}px, không bảng ${noHudRoom}px`);
  const port = await layout(page);
  check(`${size}: dọc vẫn thấy cảnh game và đủ nút`, port.stage >= 50 && port.lastBtn <= port.vh, JSON.stringify(port));

  await page.locator('#vk2-hud [data-tab="journey"]').tap();
  await sleep(300);
  const jr = await page.evaluate(() => {
    const b = document.querySelector(".vk2-sheet-body");
    return { w: b.scrollWidth <= b.clientWidth, font: parseFloat(getComputedStyle(document.querySelector(".vk2-log-item") ?? b).fontSize), text: b.innerText.includes("Hướng phát triển") };
  });
  check(`${size}: Hành trình đọc được trên điện thoại`, jr.w && jr.text && jr.font >= 15, JSON.stringify(jr));
  await page.screenshot({ path: path.join(OUT, `m-${size}-journey.png`) });
  await page.locator('#vk2-modal .vk2-tabs [data-tab="can"]').tap();
  await page.locator('#vk2-modal .vk2-subtabs [data-tab="talents"]').tap();
  await sleep(300);
  const sheet = await page.evaluate(() => {
    const body = document.querySelector(".vk2-sheet-body");
    const x = document.querySelector('[data-act="close"]').getBoundingClientRect();
    return { scrolls: body.scrollHeight > body.clientHeight, closeOk: x.top >= 0 && x.right <= innerWidth, w: document.documentElement.scrollWidth <= innerWidth };
  });
  check(`${size}: bảng thiên phú cuộn được, nút đóng trong màn hình`, sheet.scrolls && sheet.closeOk && sheet.w, JSON.stringify(sheet));
  await page.screenshot({ path: path.join(OUT, `m-${size}-talents.png`) });
  await page.locator('#vk2-modal [data-tab="quests"]').tap();
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, `m-${size}-journal.png`) });
  await page.locator('#vk2-modal [data-act="close"]').tap();
  await sleep(200);
  check(`${size}: chạm nút đóng`, (await page.locator("#vk2-modal").count()) === 0);

  // Xoay ngang
  await page.setViewportSize({ width: 844, height: 390 });
  await sleep(400);
  check(`${size}: xoay ngang không tràn`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const land = await layout(page);
  check(`${size}: xoay ngang vẫn thấy cảnh game và đủ nút`, land.stage >= 50 && land.lastBtn <= land.vh, JSON.stringify(land));
  const hudLand = await page.evaluate(() => {
    const hud = document.querySelector("#vk2-hud").getBoundingClientRect();
    const game = document.querySelector(".stage").getBoundingClientRect();
    return { noOverlap: hud.right <= game.left, tabs: document.querySelectorAll('#vk2-hud [data-act="tab"]').length };
  });
  check(`${size}: xoay ngang bảng nằm ở lề, không đè game`, hudLand.noOverlap && hudLand.tabs === 2, JSON.stringify(hudLand));
  await page.locator('#vk2-hud [data-tab="journey"]').tap();
  await sleep(300);
  check(`${size}: xoay ngang vẫn mở được nhật ký`, (await page.locator("#vk2-modal").count()) === 1);
  await page.locator('#vk2-modal [data-act="close"]').tap();
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, `m-${size}-landscape.png`) });

  // Điện thoại khóa màn hình và mở lại: tải lại vẫn còn nhân vật
  const name = await page.evaluate(() => globalThis.__VK2._test.char().name);
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
  });
  await sleep(300);
  await page.reload({ waitUntil: "load" });
  await sleep(2500);
  check(`${size}: mở lại vẫn còn nhân vật`, (await page.evaluate(() => globalThis.__VK2._test.char()?.name)) === name, name);
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const [size, w, h] of [["360x640", 360, 640], ["390x844", 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" });
    const page = await ctx.newPage();
    await guard(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "warning" && m.text().includes("[VK2]")) errors.push(m.text());
    });
    await run(page, size);
    check(`${size}: không có lỗi JS`, errors.length === 0, errors.slice(0, 3).join(" | ").slice(0, 300));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `${fails} lỗi` : "Tất cả đạt");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
