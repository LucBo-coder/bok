// Lớp đồ họa trong game thật: có vẽ thật, không chắn thao tác, tắt được, lưu được, không tràn màn hình điện thoại.
// Dùng: VK2_URL=http://127.0.0.1:8766 NODE_PATH=<thư mục có playwright-core> node vk2/tests/gfx.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const path = require("node:path");

const BASE = (process.env.VK2_URL || "http://127.0.0.1:8766").replace(/\/$/, "");
const OUT = process.argv[2] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" ? `  [${extra}]` : ""}`);
};

async function enter(page) {
  for (let i = 0; i < 60; i++) {
    if (await page.locator("#vk2-hud").count()) break;
    await page.evaluate(() => {
      const w = /Lập bia và luân hồi|Đầu thai|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp|Hiểu rồi|Ngẫu nhiên|Đồng ý/i;
      [...document.querySelectorAll("button, a")].find((b) => w.test(b.textContent || "") && b.offsetParent)?.click();
    });
    await sleep(500);
  }
  for (let i = 0; i < 25; i++) {
    const done = await page.evaluate(() => {
      const vis = (b) => b && b.offsetParent !== null;
      const comic = document.querySelector(".cn-wrap .cn-skip");
      if (vis(comic)) return comic.click(), false;
      const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && vis(b));
      if (hint) return hint.click(), false;
      const list = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off"));
      if (list.length) return list[0].click(), false;
      return !document.querySelector(".cn-wrap, .coach");
    });
    if (done) break;
    await sleep(350);
  }
}
const inked = (page) =>
  page.evaluate(() => {
    let n = 0;
    for (const sel of [".vk2g-back", ".vk2g-front"]) {
      const c = document.querySelector(sel);
      if (!c) continue;
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    }
    return n;
  });
const play = (page) =>
  page.evaluate(() => {
    if (document.querySelector(".scene.paused")) [...document.querySelectorAll(".speeds button")].find((x) => x.classList.contains("play"))?.click();
  });
const safe = (page) =>
  page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    c.lifespan = Math.max(c.lifespan, 5000);
  });

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  const watch = (page) => {
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => /\[VK2/.test(m.text()) && errors.push(m.text()));
  };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
    await enter(page);
    await sleep(1200);
    await play(page);
    await sleep(1500);

    const dom = await page.evaluate(() => {
      const s = document.querySelector(".scene");
      const kids = [...s.children].map((x) => x.className);
      return { back: kids.findIndex((k) => /vk2g-back/.test(k)), sprite: kids.findIndex((k) => /sprite-wrap/.test(k)), front: kids.findIndex((k) => /vk2g-front/.test(k)), events: getComputedStyle(document.querySelector(".vk2g-front")).pointerEvents };
    });
    check("canvas sau lưng và trước mặt nhân vật", dom.back >= 0 && dom.back < dom.sprite && dom.sprite < dom.front, JSON.stringify(dom));
    check("canvas không nhận thao tác", dom.events === "none");
    check("có vẽ thật lên canvas", (await inked(page)) > 0, `${await inked(page)} điểm`);
    check("độ phân giải thấp để giữ nét pixel", await page.evaluate(() => { const c = document.querySelector(".vk2g-front"); return c.width <= c.clientWidth / 2.5; }));
    const passes = await page.evaluate(() => {
      const r = document.querySelector(".scene").getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !/vk2g/.test(top?.className ?? "");
    });
    check("bấm vào cảnh không trúng lớp đồ họa", passes);

    // Thiên tượng thật được nạp từ vòng năm, không chờ tới lúc đúc đạo cơ
    await safe(page);
    await sleep(2500);
    const omenWired = await page.evaluate(() => ({ ready: globalThis.VK2Can.omenReady(), age: globalThis.__VK2._test.char().age, realm: globalThis.__VK2._test.char().realm }));
    check("vòng năm vẫn chạy khi có lớp đồ họa", omenWired.age > 0, omenWired.age);
    check("thiên tượng được nạp từ vòng năm, cả khi chưa tu luyện", omenWired.ready, JSON.stringify(omenWired));

    // Từng cảnh: ảnh để xem bằng mắt
    await page.evaluate(() => [...document.querySelectorAll(".speeds button")].find((x) => x.classList.contains("on") && !x.classList.contains("play")));
    const shots = [
      ["day", { hour: 11, omen: null, focus: "du_ngoan", realm: 2, path: "kiem" }],
      ["night", { hour: 22, omen: null, focus: "tu_luyen", realm: 4, path: "phat" }],
      ["blood", { hour: 22, omen: "huyet_nguyet", focus: "tru_yeu", realm: 5, path: "ma" }],
      ["storm", { hour: 15, omen: "loi_van", focus: "tu_luyen", realm: 7, path: "kiem" }],
      ["buddha", { hour: 9, omen: "phat_quang", focus: "tu_luyen", realm: 6, path: "phat" }],
      ["dan", { hour: 12, omen: null, focus: "luyen_dan", realm: 3, path: "dan" }],
      ["money", { hour: 12, omen: null, focus: "kiem_tien", realm: 1, path: "tran" }],
      ["love", { hour: 18, omen: null, focus: "ket_duyen", realm: 3, path: "yeu" }],
    ];
    for (const [name, d] of shots) {
      await safe(page);
      await page.evaluate((x) => {
        Object.assign(globalThis.VK2Fx.debug, x);
        globalThis.__VK2._test.char().focus = x.focus;
      }, d);
      await play(page);
      await sleep(2200);
      await page.locator(".scene").screenshot({ path: path.join(OUT, `gfx-${name}.png`) });
    }
    await page.evaluate(() => globalThis.VK2Fx.setLevel("off"));
    await sleep(500);
    await page.locator(".scene").screenshot({ path: path.join(OUT, "gfx-off.png") });
    await page.evaluate(() => globalThis.VK2Fx.setLevel("high"));
    await sleep(500);
        check("hào quang và thiên tượng vẽ không lỗi", (await page.evaluate(() => globalThis.VK2Fx.stats().errors)) === 0);

    // Đột phá
    await page.evaluate(() => Object.assign(globalThis.VK2Fx.debug, { realm: 1, omen: null, hour: 12, focus: "tu_luyen" }));
    await sleep(800);
    const s0 = await page.evaluate(() => globalThis.VK2Fx.stats().shocks);
    await page.evaluate(() => (globalThis.VK2Fx.debug.realm = 2));
    await sleep(160);
    await page.locator(".scene").screenshot({ path: path.join(OUT, "gfx-break.png") });
    check("đột phá có hiệu ứng", (await page.evaluate(() => globalThis.VK2Fx.stats().shocks)) === s0 + 1);

    // Ánh chớp phải tắt ngay cả khi game đang tạm dừng
    await page.evaluate(() => [...document.querySelectorAll(".speeds button")].find((x) => x.classList.contains("play"))?.click());
    await sleep(100);
    await page.evaluate(() => globalThis.VK2Fx.breakthrough(true));
    await sleep(1200);
    const lit = await page.evaluate(() => ({ flash: globalThis.VK2Fx.stats().flash, paused: !!document.querySelector(".scene.paused") }));
    check("ánh chớp tự tắt khi game tạm dừng", lit.paused && lit.flash === 0, JSON.stringify(lit));
    const order = await page.evaluate(() => {
      const s = document.querySelector(".scene");
      const bg = document.createElement("div");
      bg.className = "bg probe";
      s.insertBefore(bg, s.querySelector(".sprite-wrap"));
      return new Promise((res) => setTimeout(() => {
        const k = [...s.children];
        const ok = k.indexOf(s.querySelector(".vk2g-back")) > k.indexOf(bg) && k[k.length - 1].classList.contains("vk2g-front");
        bg.remove();
        res(ok);
      }, 300));
    });
    check("đổi cảnh không làm ảnh nền che mất lớp vẽ", order);
    await play(page);

    // Chỉnh chất lượng qua giao diện thật
    await page.click('#vk2-hud [data-tab="journey"]');
    await page.click('#vk2-modal .vk2-tabs [data-tab="journey"]');
    await page.click('#vk2-modal .vk2-subtabs [data-tab="gfx"]');
    await sleep(100);
    await page.screenshot({ path: path.join(OUT, "gfx-tab.png") });
    check("tab Đồ Họa có ba mức", (await page.locator('#vk2-modal [data-act="gfx-level"]').count()) === 3);
    await page.click('#vk2-modal [data-act="gfx-level"][data-id="off"]');
    await sleep(300);
    const off = await page.evaluate(() => ({ cv: document.querySelectorAll(".vk2g-layer, .vk2g-tint").length, on: document.documentElement.classList.contains("vk2g-on"), lv: globalThis.VK2Fx.level(), saved: localStorage.getItem("vk2.gfx") }));
    check("tắt đồ họa gỡ sạch lớp vẽ", off.cv === 0 && !off.on && off.lv === "off" && off.saved === "off", JSON.stringify(off));
    await page.evaluate(() => globalThis.dispatchEvent(new Event("pagehide")));
    await page.reload({ waitUntil: "load" });
    await enter(page);
    await sleep(1000);
    check("mức đồ họa còn sau khi tải lại", await page.evaluate(() => globalThis.VK2Fx.level() === "off" && !document.querySelector(".vk2g-layer")));
    await page.evaluate(() => globalThis.VK2Fx.setLevel("high"));
    await play(page);
    await sleep(1200);
    check("bật lại thì vẽ lại", (await inked(page)) > 0);

    // Tốc độ: đo trên máy này, không phải mọi máy
    await page.evaluate(() => Object.keys(globalThis.VK2Fx.debug).forEach((k) => delete globalThis.VK2Fx.debug[k]));
    await safe(page);
    const before = await page.evaluate(() => globalThis.VK2Fx.stats().frames);
    await sleep(4000);
    const stat = await page.evaluate(() => globalThis.VK2Fx.stats());
    const paused = await page.evaluate(() => !!document.querySelector(".scene.paused"));
    check("vẽ đủ khung hình khi game chạy", paused || stat.frames - before >= 40, `${stat.frames - before} khung/4 giây, ${stat.particles} hạt, auto ${stat.auto}`);
    check("số hạt có trần", stat.particles <= 140);
    await ctx.close();

    // Điện thoại
    const mob = await browser.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, isMobile: true });
    const mp = await mob.newPage();
    watch(mp);
    await mp.goto(`${BASE}/choi/`, { waitUntil: "load" });
    await enter(mp);
    await sleep(1200);
    await play(mp);
    await sleep(1000);
    const m = await mp.evaluate(() => ({ lv: globalThis.VK2Fx.level(), over: document.documentElement.scrollWidth > innerWidth + 1, cv: document.querySelectorAll(".vk2g-layer").length }));
    check("điện thoại mặc định mức Vừa và có vẽ", m.lv === "mid" && m.cv === 2 && (await inked(mp)) > 0, JSON.stringify(m));
    check("điện thoại không tràn ngang", !m.over);
    await mp.locator(".scene").screenshot({ path: path.join(OUT, "gfx-mobile.png") });
    await mob.close();

    // Giảm chuyển động
    const rm = await browser.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: "reduce" });
    const rp = await rm.newPage();
    watch(rp);
    await rp.goto(`${BASE}/choi/`, { waitUntil: "load" });
    await enter(rp);
    await play(rp);
    await sleep(1500);
    const rs = await rp.evaluate(() => globalThis.VK2Fx.stats());
    check("giảm chuyển động thì không có hạt bay", rs.particles === 0, `${rs.particles} hạt`);
    await rm.close();

    check("không có lỗi JS hoặc lỗi lớp đồ họa", errors.length === 0, errors[0] ?? "");
  } finally {
    await browser.close();
  }
  console.log(fails ? `\n${fails} lỗi` : "\nTất cả đạt");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  console.log("\nTest dừng giữa chừng, KHÔNG có kết quả.");
  process.exit(2);
});
