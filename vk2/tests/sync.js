// Hệ thống của mod có thật sự đi vào game gốc không: đo trên game thật, không gọi trực tiếp logic của mod để lấy kết quả.
// Dùng: VK2_URL=http://127.0.0.1:8766 NODE_PATH=<thư mục có playwright-core> node vk2/tests/sync.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const path = require("node:path");
const { guard } = require("./popups");

const BASE = (process.env.VK2_URL || "http://127.0.0.1:8766").replace(/\/$/, "");
const OUT = process.argv[2] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" ? `  [${extra}]` : ""}`);
};

/** Vào game và qua hết phần mở đầu. */
async function enter(page) {
  await page.goto(`${BASE}/choi/`, { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 60; i++) {
    if (await page.locator("#vk2-hud").count()) break;
    await page.evaluate(() => {
      const w = /Lập bia và luân hồi|Đầu thai|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp/;
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

/** Nhân vật đủ sống qua thử nghiệm, không bị quá độ và không bị sự kiện cướp lượt. */
const steady = (page) =>
  page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.age = Math.max(c.age, 40);
    c.lifespan = Math.max(c.lifespan, 400);
    c.realm = Math.max(c.realm, 4);
    c.streak = null;
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    globalThis.VK2Phap.ensure(c, globalThis.__VK2._test.acct());
    globalThis.VK2Khi.ensure(c, globalThis.__VK2._test.acct());
    globalThis.VK2The.ensure(c, globalThis.__VK2._test.acct());
    return { age: c.age, life: c.lifespan };
  });

/** Dọn mọi thứ che game, gồm cả sự kiện năm. */
const clear = (page) =>
  page.evaluate(() => {
    const vis = (b) => b && b.getClientRects().length > 0;
    // Gặp đồng đạo: chọn kết giao, vì trận với người lạ không phải thứ đang được đo ở đây
    const peer = [...document.querySelectorAll(".duel-warn button")].filter(vis);
    if (peer.length) return (peer.find((b) => /Kết giao|Befriend|Rời|Cáo từ/.test(b.textContent)) ?? peer[peer.length - 1]).click();
    const choice = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off")).pop();
    if (choice) return choice.click();
    const kiep = [...document.querySelectorAll(".kiep button")].filter(vis).pop();
    if (kiep) return kiep.classList.contains("kiep-skip") ? kiep.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })) : kiep.click();
    const close = [...document.querySelectorAll(".event-card button, .mc-stage button, .cn-wrap .cn-skip")].filter(vis).pop();
    close?.click();
  });

/** Sự kiện ngẫu nhiên có thể giết nhân vật thật. Khi đó không còn game để đo, nên chơi lại thay vì báo nhầm là lỗi. */
class Died extends Error {}
async function alive(page) {
  const ok = await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    return !!c && !c.dead;
  });
  if (!ok) throw new Died("nhân vật chết giữa chừng");
}

async function runYears(page, n) {
  const y0 = await page.evaluate(() => Math.floor(globalThis.__VK2._test.char().age));
  for (let i = 0; i < 700; i++) {
    await alive(page);
    const y = await page.evaluate(() => Math.floor(globalThis.__VK2._test.char().age));
    if (y - y0 >= n) return true;
    await page.evaluate(() => {
      const c = globalThis.__VK2._test.char();
      c.streak = null;
      c.stats.sucKhoe = 100;
      c.stats.tamMa = 0;
      const speed = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "8×");
      if (speed && !speed.classList.contains("on")) speed.click();
      const play = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶");
      play?.click();
    });
    await clear(page);
    await sleep(120);
  }
  return false;
}

/** Trận thật qua nút Trừ yêu: ghi lại mọi con số và nhãn game vẽ lên màn hình. */
async function realFight(page, ms) {
  await page.evaluate(() => {
    globalThis.__seen = [];
    globalThis.__seenIds = new Set();
    globalThis.__watch = setInterval(() => {
      for (const d of document.querySelectorAll(".dmg")) {
        if (globalThis.__seenIds.has(d)) continue;
        globalThis.__seenIds.add(d);
        globalThis.__seen.push({ side: d.classList.contains("m") ? "m" : "p", text: d.textContent });
      }
    }, 40);
  });
  const end = Date.now() + ms;
  let fought = false;
  while (Date.now() < end) {
    await alive(page);
    await clear(page);
    await page.evaluate(async () => {
      const c = globalThis.__VK2._test.char();
      c.streak = null;
      c.stats.sucKhoe = 100;
      if (document.querySelector(".scene .battle")) return;
      [...document.querySelectorAll("button")].find((b) => /Trừ yêu/.test(b.textContent) && b.offsetParent !== null)?.click();
      await new Promise((r) => setTimeout(r, 250));
      const it = document.querySelector(".hunt-item");
      if (it) (it.querySelector("button") ?? it).click();
      const play = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶");
      play?.click();
    });
    fought = fought || (await page.evaluate(() => !!document.querySelector(".scene .battle")));
    await sleep(220);
  }
  const seen = await page.evaluate(() => {
    clearInterval(globalThis.__watch);
    return globalThis.__seen;
  });
  return { fought, seen };
}

let browser = null;
async function attempt() {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await guard(page);

  // ---------- Thọ nguyên phải còn sau khi game tính lại trần mỗi năm ----------
  await enter(page);
  await steady(page);
  check("chạy được các năm thật", await runYears(page, 2));
  // Sau vài năm, thọ đã bị game kẹp về đúng trần của cảnh giới: đây là mốc để so
  const before = await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const p = c.vk2.phap;
    const base = { life: c.lifespan, extra: c.lifeExtra ?? 0 };
    p.timeApplied = 0;
    p.laws.thoi_gian = 110; // Bậc 1: thêm 30 năm thọ
    globalThis.VK2Su.apply(c, a, { life: 10 }); // Phần thưởng thọ của sự kiện
    return base;
  });
  check("chạy tiếp được các năm thật", await runYears(page, 5));
  const after = await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    return { life: c.lifespan, extra: c.lifeExtra ?? 0 };
  });
  check("thọ từ pháp tắc và sự kiện còn nguyên sau 5 năm", after.life >= before.life + 40, `${before.life} -> ${after.life}, lifeExtra ${before.extra} -> ${after.extra}`);

  // ---------- Tông môn dùng chung một thế giới với game ----------
  const sects = await page.evaluate(() => {
    const w = globalThis.__VK2._test.acct().world;
    return Object.values(w.sects).map((s) => ({ n: s.n, lean: s.lean, prot: !!s.prot }));
  });
  for (const [name, lean] of [["Thanh Vân Tông", "chinh"], ["Kiếm Cốc", "chinh"], ["Phổ Đà Sơn", "chinh"], ["Thiên Cơ Các", "trung"], ["Huyết Sát Môn", "ta"], ["Vạn Độc Môn", "ta"], ["Yêu Thần Điện", "ta"], ["Hợp Hoan Tông", "ta"]]) {
    const s = sects.find((x) => x.n === name);
    check(`bảng tông môn có ${name}, đúng phe`, !!s && s.lean === lean && s.prot, s ? `${s.lean}` : "không có");
  }
  // Danh xưng trên bảng thông tin là do game gốc tính theo phe. Tông trung lập của mod phải ra danh xưng trung lập.
  const title = await page.evaluate(async () => {
    const c = globalThis.__VK2._test.char();
    c.sect = "Vạn Thú Sơn";
    c.sectRank = 2;
    globalThis.__VK2._test.openPanel?.("info");
    await new Promise((r) => setTimeout(r, 900));
    const text = document.querySelector(".sheet")?.innerText ?? document.body.innerText;
    globalThis.__VK2._test.openPanel?.(null);
    return text;
  });
  check("tông trung lập của mod ra danh xưng trung lập của game", title.includes("Thân truyền"), (title.match(/.{0,30}Vạn Thú Sơn.{0,20}/) ?? [""])[0]);

  // ---------- Cơ chế trận trong trận thật ----------
  await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.sect = null;
    c.sectRank = undefined;
    const p = c.vk2.phap;
    // Bậc Chứng Đạo của các pháp tắc có cơ chế trận: né, hút máu, thiêu, hộ thể, đánh thêm
    for (const id of ["thuy", "moc", "hoa", "tho", "kiem", "kim"]) p.laws[id] = 4300;
    c.vk2.khi.talismans.hoa_cau = 1;
    globalThis.VK2Khi.arm(c, globalThis.__VK2._test.acct(), "hoa_cau");
  });
  const armed = await page.evaluate(() => globalThis.__VK2._test.char().vk2.khi.armed);
  check("chuẩn bị được phù cho trận", armed === "hoa_cau", armed);
  const { fought, seen } = await realFight(page, 16000);
  check("đánh được trận thật", fought);
  const has = (re, side) => seen.some((d) => (!side || d.side === side) && re.test(d.text));
  const tags = [...new Set(seen.map((d) => d.text.replace(/[-+]?\d[\d.,]*/g, "#")))].slice(0, 16).join(" | ");
  console.log(`      ${seen.length} đòn, nhãn: ${tags}`);
  check("né đòn có tác dụng trong trận thật", has(/Né/, "m"));
  check("thiêu đốt có tác dụng trong trận thật", has(/Thiêu/, "p"));
  check("đánh thêm có tác dụng trong trận thật", has(/Đánh thêm/, "p"));
  check("hộ thể đỡ đòn trong trận thật", has(/Hộ thể/, "m"));
  check("lá phù bị tiêu hao bởi trận thật", (await page.evaluate(() => globalThis.__VK2._test.char().vk2.khi.armed)) === null);
  await page.screenshot({ path: path.join(OUT, "sync_battle.png") });
  // Hộ thể và né giữ máu luôn đầy, mà đầy máu thì không có gì để hút. Đo hút máu riêng, không có hai cơ chế đó.
  await page.evaluate(() => {
    const p = globalThis.__VK2._test.char().vk2.phap;
    for (const id of ["thuy", "hoa", "tho", "kiem", "kim"]) p.laws[id] = 0;
  });
  const second = await realFight(page, 14000);
  check("hút máu có tác dụng trong trận thật", second.seen.some((d) => d.side === "p" && /Hút/.test(d.text)), `${second.seen.length} đòn`);
  check("bỏ pháp tắc thì cơ chế trận mất theo", !second.seen.slice(-60).some((d) => /Né|Thiêu|Đánh thêm|Hộ thể/.test(d.text)));

  // ---------- Bảng của game dẫn tới hệ thống của mod ----------
  await page.evaluate(() => {
    for (const b of document.querySelectorAll("button")) if (/Dừng|Về nghỉ|Rút lui/.test(b.textContent) && b.offsetParent) b.click();
  });
  await alive(page);
  for (const [panel, tab, want] of [["hunt", "forge", /Trong trận: Hút máu/], ["info", "journey", /Công|Trận/], ["congphap", "art", /Bí thuật/], ["bag", "forge", /Pháp bảo/], ["bequan", "can", /Căn cơ|Căn Cơ/], ["thu", "cave", /Linh thú viên/]]) {
    await clear(page);
    const r = await page.evaluate(async ([panel]) => {
      globalThis.__VK2._test.openPanel?.(panel);
      await new Promise((r) => setTimeout(r, 900));
      const box = document.querySelector("#vk2-native");
      return { text: box?.textContent ?? "", btn: !!box?.querySelector("button") };
    }, [panel]);
    check(`bảng ${panel} của game có mục nối sang hệ thống của mod`, want.test(r.text) && r.btn, r.text.slice(0, 90));
    if (panel === "hunt" || panel === "congphap" || panel === "thu") await page.screenshot({ path: path.join(OUT, `sync_${panel}.png`) });
    const opened = await page.evaluate(async () => {
      document.querySelector("#vk2-native button")?.click();
      await new Promise((r) => setTimeout(r, 250));
      const m = document.querySelector("#vk2-modal");
      const on = m?.querySelector('[aria-selected="true"]')?.textContent ?? "";
      document.querySelector('#vk2-modal [data-act="close"]')?.click();
      await new Promise((r) => setTimeout(r, 150));
      globalThis.__VK2._test.openPanel?.(null);
      await new Promise((r) => setTimeout(r, 400));
      return { modal: !!m, on, left: !!document.querySelector(".vk2-native") };
    });
    check(`nút trong bảng ${panel} mở đúng bảng ${tab}`, opened.modal && !opened.left, opened.on);
  }

  // ---------- Điện thoại ----------
  await alive(page);
  await page.setViewportSize({ width: 390, height: 780 });
  await clear(page);
  for (const panel of ["hunt", "congphap"]) {
    const fit = await page.evaluate(async (panel) => {
      globalThis.__VK2._test.openPanel(panel);
      await new Promise((r) => setTimeout(r, 900));
      const box = document.querySelector("#vk2-native");
      const r = box?.getBoundingClientRect();
      return { ok: !!box && r.left >= 0 && r.right <= innerWidth && box.scrollWidth <= box.clientWidth + 1, w: r?.width };
    }, panel);
    check(`mục nối trong bảng ${panel} vừa màn hình điện thoại`, fit.ok, fit.w);
    await page.screenshot({ path: path.join(OUT, `sync_${panel}_mobile.png`) });
    await page.evaluate(async () => {
      globalThis.__VK2._test.openPanel(null);
      await new Promise((r) => setTimeout(r, 300));
    });
  }

  check("không có lỗi trang", errors.length === 0, errors.slice(0, 3).join(" ; "));
  await browser.close();
}

(async () => {
  for (let i = 1; i <= 5; i++) {
    fails = 0;
    try {
      await attempt();
      break;
    } catch (e) {
      await browser?.close().catch(() => {});
      if (!(e instanceof Died) || i === 5) throw e;
      console.log(`\n--- Lượt ${i} dừng vì nhân vật chết giữa chừng, chơi lại. Chỉ tính kết quả của lượt cuối.\n`);
    }
  }
  console.log(fails ? `\n${fails} kiểm tra hỏng` : "\nĐạt hết");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  console.log("\nTest dừng giữa chừng, KHÔNG có kết quả.");
  process.exit(2);
});
