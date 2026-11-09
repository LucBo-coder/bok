// Căn cơ trong game thật: bấm giao diện như người chơi, năm trôi bằng vòng lặp gốc, lưu và tải lại.
// Cần server: `python serve_mod.py`, Edge đã cài.
// Dùng: NODE_PATH=<thư mục có playwright-core> node vk2/tests/can_e2e.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const path = require("node:path");

const BASE = process.env.VK2_URL || "http://127.0.0.1:8766";
const OUT = process.argv[2] || ".";
const results = [];
function check(name, ok, extra = "") {
  results.push([name, !!ok]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" ? `  [${extra}]` : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function enterGame(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator("#vk2-hud").count()) return true;
    await page.evaluate(() => {
      const wanted = /Lập bia và luân hồi|Đầu thai|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp|Hiểu rồi|Ngẫu nhiên|Đồng ý/i;
      [...document.querySelectorAll("button, a")].find((b) => wanted.test(b.textContent || "") && b.offsetParent !== null)?.click();
    });
    await sleep(600);
  }
  return false;
}

/** Dọn một popup của game nếu có. Trả về true khi không còn gì chặn thời gian. */
async function clearOnce(page) {
  return page.evaluate(() => {
    const visible = (b) => b && b.offsetParent !== null && !b.disabled;
    const inMod = (b) => b.closest("#vk2-modal") || b.closest("#vk2-hud");
    const comic = document.querySelector(".cn-wrap .cn-skip");
    if (visible(comic)) return comic.click(), false;
    const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && visible(b));
    if (hint) return hint.click(), false;
    const choice = [...document.querySelectorAll(".choices .choice")].find((b) => visible(b) && !b.classList.contains("off"));
    if (choice) return choice.click(), false;
    const go = [...document.querySelectorAll("button")].find((b) => /^(Tiếp|Tiếp tục|Đóng)$|đi tiếp/.test(b.textContent.trim()) && visible(b) && !inMod(b));
    if (go) return go.click(), false;
    const dialog = [...document.querySelectorAll('[role="dialog"]')].find((d) => d.getClientRects().length > 0 && !d.closest("#vk2-modal"));
    if (dialog) {
      const btns = [...dialog.querySelectorAll("button")].filter(visible);
      (btns.find((b) => /đi tiếp|Đóng|Bỏ qua|Né|Tránh|Từ chối/i.test(b.textContent)) ?? btns[btns.length - 1])?.click();
      return false;
    }
    return !document.querySelector(".game.has-event, .cn-wrap, .coach");
  });
}

/** Dọn popup rồi dừng thời gian, để lần bấm kế tiếp không rơi vào nút khác. */
async function calm(page) {
  for (let i = 0; i < 80; i++) {
    if (await clearOnce(page)) {
      await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());
      return;
    }
    await sleep(250);
  }
  throw new Error("Không dọn được popup của game");
}

const play = (page) => page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());

const state = (page, fn, arg) => page.evaluate(fn, arg);
const can = (page) => state(page, () => JSON.parse(JSON.stringify(globalThis.__VK2._test.char().vk2.can)));

/** Đưa nhân vật về trạng thái sống yên ổn để bài test không phụ thuộc may rủi của game. */
const shield = (page, extra) =>
  state(page, (e) => {
    const c = globalThis.__VK2._test.char();
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    c.breakDelay = 999;
    c.lifespan = Math.max(c.lifespan, 5000);
    Object.assign(c, e ?? {});
  }, extra);

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  globalThis.__page = page;
  const errors = [];
  const outbound = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" && m.text().includes("[VK2]")) errors.push(m.text());
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (/^(https?|wss?):$/.test(u.protocol) && u.hostname !== new URL(BASE).hostname && !/fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) outbound.push(r.url());
  });

  // Giữ dấu vết nhân vật gần nhất, để khi test mất nhân vật còn biết vì sao.
  await page.addInitScript(() => {
    setInterval(() => {
      const c = globalThis.__VK2?._test?.char?.();
      if (c) globalThis.__trace = { age: c.age, dead: c.dead, cause: c.cause, hp: c.stats?.sucKhoe, tamMa: c.stats?.tamMa, inj: c.vk2?.can?.injury, last: (c.log ?? []).slice(-3).map((e) => e.text) };
    }, 100);
  });
  await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
  check("nạp module căn cơ", await state(page, () => !!globalThis.VK2Can));
  check("vào được game", await enterGame(page));
  await calm(page);

  const birth = await can(page);
  check("nhân vật mới có căn cơ hợp lệ", birth.open === 0 && birth.method === "can" && birth.pending === null);
  check("thể chất lúc sinh có trong danh sách", await state(page, (id) => globalThis.VK2Can.bodyDef.has(id), birth.body.id), birth.body.id);
  check("bản vá thu được hàm năm của game", await state(page, () => typeof globalThis.__VK2._test.game()?.f === "function"));

  // Mở tab bằng cách bấm thật
  await page.click('#vk2-hud [data-tab="journey"]');
  await page.waitForSelector("#vk2-modal");
  check("tab Hành trình hiện thể chất và kinh mạch", await state(page, () => /Thể chất/.test(document.querySelector(".vk2-facts").textContent) && /Kinh mạch/.test(document.querySelector(".vk2-facts").textContent)));
  await page.click('#vk2-modal [role="tab"][data-tab="can"]');
  const text = await state(page, () => document.querySelector(".vk2-sheet-body").textContent);
  for (const part of ["Phương pháp tu luyện", "Dung lượng đan điền", "Độ tinh thuần", "Độ ổn định", "Kinh mạch đã khai mở", "Nội thương", "Tạp chất", "Tiểu chu thiên", "Thể chất", "Đạo cơ", "Kim Đan"]) {
    check(`tab Căn Cơ có mục: ${part}`, text.includes(part));
  }
  await page.screenshot({ path: path.join(OUT, "can_desktop.png") });

  // Đổi phương pháp đổi đúng tốc độ tu của game
  await shield(page, { realm: 1, layer: 1, focus: "tu_luyen", age: 20 });
  const rate = (m) => state(page, async (method) => {
    const t = globalThis.__VK2._test;
    document.querySelector(`#vk2-modal [data-act="method"][data-id="${method}"]`).click();
    return t.rate(t.char());
  }, m);
  await state(page, () => {
    const t = globalThis.__VK2._test;
    t.can.ensure(t.char(), t.acct());
  });
  // Hàm tốc độ tu chỉ được bắt khi game gọi nó, nên chạy qua một năm thật trước.
  await page.click('#vk2-modal [data-act="close"]');
  await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
  // Chờ từng nhịp ngắn và che chắn liên tục: chỉ cần một năm chạy qua hàm thật, không cần may rủi của game.
  for (let i = 0; i < 80; i++) {
    await shield(page);
    if (await state(page, () => globalThis.__VK2._test.rate(globalThis.__VK2._test.char()) !== null)) break;
    await clearOnce(page);
    await play(page);
    await sleep(200);
  }
  await calm(page);
  await shield(page, { realm: 1, focus: "tu_luyen" });
  await page.click('#vk2-hud [data-tab="journey"]');
  await page.click('#vk2-modal [role="tab"][data-tab="can"]');
  const rBal = await rate("can");
  const rFor = await rate("cuong");
  const rSte = await rate("on");
  check("Cưỡng ép tăng đúng ×1,3 trong hàm tốc độ của game", Math.abs(rFor / rBal - 1.3) < 1e-6, (rFor / rBal).toFixed(3));
  check("Ổn định giảm tốc đúng theo dữ liệu", Math.abs(rSte / rBal - (await state(page, () => globalThis.VK2Can.METHODS.on.cult))) < 1e-6, (rSte / rBal).toFixed(3));
  await rate("can");

  // Năm trôi bằng vòng lặp gốc, tu luyện thay đổi căn cơ
  const before = await can(page);
  await page.click('#vk2-modal [data-act="close"]');
  await shield(page, { focus: "tu_luyen" });
  await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
  await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    await shield(page);
    const a = await state(page, () => globalThis.__VK2._test.char()?.vk2?.can?.year ?? -1);
    if (a < 0) throw new Error("Nhân vật mất giữa chừng do sự kiện ngẫu nhiên, chạy lại test");
    if (a >= before.year + 6) break;
    if (await state(page, () => !!document.querySelector(".game.has-event, .cn-wrap, .coach") || [...document.querySelectorAll('[role="dialog"]')].some((d) => d.getClientRects().length > 0 && !d.closest("#vk2-modal")))) {
      await calm(page);
      await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
    }
  }
  await calm(page);
  const after = await can(page);
  check("hook năm chạy trong vòng lặp thật", after.year > before.year, `${before.year} -> ${after.year}`);
  const moved = after.tieu !== before.tieu || after.tieuCount !== before.tieuCount || after.openProg !== before.openProg || after.purity !== before.purity;
  check("tu luyện làm đổi căn cơ", moved, `tiến độ mạch ${before.openProg.toFixed(1)} -> ${after.openProg.toFixed(1)}`);
  // Vài sự kiện của game cộng thẳng 5–59 năm vào tuổi mà không qua hàm năm, nên căn cơ chỉ bắt kịp ở năm kế.
  const ageGap = () => state(page, () => {
    const c = globalThis.__VK2._test.char();
    return Math.floor(c.age) - c.vk2.can.year;
  });
  let ageVsYear = await ageGap();
  const firstGap = ageVsYear;
  for (let i = 0; i < 40 && ageVsYear !== 0; i++) {
    await play(page);
    await sleep(300);
    await shield(page);
    await calm(page);
    ageVsYear = await ageGap();
  }
  check("năm của căn cơ khớp tuổi nhân vật", ageVsYear === 0, firstGap === 0 ? 0 : `sự kiện nhảy ${firstGap} năm, bắt kịp còn ${ageVsYear}`);

  // Đạo cơ: vào Trúc Cơ bằng hàm đột phá thật là ngẫu nhiên, nên đặt cảnh giới rồi đi đúng luồng giao diện
  await shield(page, { realm: 2, layer: 1, linhThach: 1000 });
  await page.waitForSelector('#vk2-hud [data-tab="can"].vk2-claim', { timeout: 5000 });
  check("HUD báo việc đúc đạo cơ, vẫn giữ nút Thiên phú", await state(page, () => !!document.querySelector('#vk2-hud [aria-label="Đúc đạo cơ"]') && !!document.querySelector('#vk2-hud [data-tab="talents"]')));
  const hudWide = await state(page, () => {
    const h = document.querySelector("#vk2-hud");
    return h.scrollWidth <= h.clientWidth + 1;
  });
  check("HUD có thêm nút vẫn không tràn", hudWide);
  check("có thông báo trong nhật ký game", await state(page, () => globalThis.__VK2._test.char().log.some((e) => /đúc đạo cơ/i.test(e.text))));
  await page.click('#vk2-hud [data-tab="can"].vk2-claim');
  await page.waitForSelector('[data-act="forge"][data-opt="linh_thach"]');
  check("bốn cách đúc đều hiện", (await page.locator('[data-act="forge"]').count()) === 4);
  await page.screenshot({ path: path.join(OUT, "can_forge.png") });
  const stones0 = await state(page, () => globalThis.__VK2._test.char().linhThach);
  await page.click('[data-act="forge"][data-opt="linh_thach"]');
  const forged = await can(page);
  check("đúc xong có phẩm chất", forged.daoCo?.grade >= 1 && forged.pending === null, forged.daoCo?.grade);
  check("trừ đúng linh thạch", (await state(page, () => globalThis.__VK2._test.char().linhThach)) === stones0 - 300);
  check("nhiệm vụ đúc đạo cơ chuyển sang chờ nhận", await state(page, () => {
    const t = globalThis.__VK2._test;
    return t.core.listQuests(t.char(), t.acct(), Date.now()).find((q) => q.id === "c_dao").status === "complete";
  }));

  // Nhận thưởng bấm đúp chỉ tính một lần
  const claimed = await state(page, () => {
    const t = globalThis.__VK2._test;
    const c = t.char();
    const before = c.linhThach;
    t.core.claim(c, t.acct(), "c_dao", Date.now(), {});
    t.core.claim(c, t.acct(), "c_dao", Date.now(), {});
    return c.linhThach - before;
  });
  check("thưởng căn cơ không trùng", claimed === 200, claimed);

  // Lưu và tải lại
  await page.click('#vk2-modal [data-act="close"]');
  await calm(page);
  const saved = await can(page);
  await state(page, () => globalThis.__VK2._test.char() && globalThis.dispatchEvent(new Event("pagehide")));
  await sleep(300);
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await calm(page);
  const loaded = await can(page);
  check("tải lại giữ phẩm chất đạo cơ", loaded.daoCo?.grade === saved.daoCo.grade && loaded.daoCo.score === saved.daoCo.score);
  // Sau khi tải lại, game có thể tự chạy vài năm trước khi test dừng được thời gian, nên chỉ đòi không được mất tiến trình.
  check("tải lại giữ kinh mạch và phương pháp", loaded.open >= saved.open && loaded.method === saved.method && loaded.year >= saved.year, `mạch ${saved.open} -> ${loaded.open}, năm ${saved.year} -> ${loaded.year}`);
  check("tải lại giữ thể chất", loaded.body.id === saved.body.id);

  // Điện thoại
  await page.setViewportSize({ width: 360, height: 640 });
  await page.click('#vk2-hud [data-tab="journey"]');
  await page.click('#vk2-modal [role="tab"][data-tab="can"]');
  await sleep(200);
  const mobile = await state(page, () => {
    const sheet = document.querySelector(".vk2-sheet");
    const body = document.querySelector(".vk2-sheet-body");
    const wide = [...sheet.querySelectorAll("*")].filter((n) => n.getBoundingClientRect().right > innerWidth + 1).map((n) => n.className || n.tagName);
    return { over: document.documentElement.scrollWidth > innerWidth, wide: wide.slice(0, 4), scrolls: body.scrollHeight > body.clientHeight, tabsH: document.querySelector(".vk2-tabs").getBoundingClientRect().height };
  });
  check("360px không tràn ngang", !mobile.over && mobile.wide.length === 0, mobile.wide.join(","));
  check("360px tab Căn Cơ cuộn được", mobile.scrolls);
  await page.screenshot({ path: path.join(OUT, "can_360.png") });
  await page.evaluate(() => (document.querySelector(".vk2-sheet-body").scrollTop = 99999));
  await sleep(100);
  await page.screenshot({ path: path.join(OUT, "can_360_end.png") });
  await page.click('#vk2-modal [data-act="close"]');

  // Chết và đầu thai giữ đúng luồng gốc, kiếp mới căn cơ mới
  const lifeBefore = await state(page, () => globalThis.__VK2._test.char().lifeNo);
  await state(page, () => {
    const t = globalThis.__VK2._test;
    const c = t.char();
    c.lifespan = Math.floor(c.age) + 1;
  });
  await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
  await state(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
  let died = false;
  for (let i = 0; i < 300 && !died; i++) {
    await state(page, () => {
      const visible = (b) => b && b.offsetParent !== null && !b.disabled;
      const c = globalThis.__VK2._test.char();
      if (c && !c.dead) c.lifespan = Math.min(c.lifespan, Math.floor(c.age) + 1);
      const choice = [...document.querySelectorAll(".choices .choice")].find((b) => visible(b) && !b.classList.contains("off"));
      if (choice) return choice.click();
      const go = [...document.querySelectorAll("button")].find((b) => /Đã hiểu|^(Tiếp|Tiếp tục|Đóng)$|đi tiếp/.test(b.textContent.trim()) && visible(b) && !b.closest("#vk2-hud"));
      if (go) return go.click();
      const dialog = [...document.querySelectorAll('[role="dialog"]')].find((d) => d.getClientRects().length > 0 && !d.closest("#vk2-modal"));
      if (dialog) {
        const btns = [...dialog.querySelectorAll("button")].filter(visible);
        return (btns.find((b) => /đi tiếp|Đóng|Bỏ qua|Né|Tránh|Từ chối/i.test(b.textContent)) ?? btns[btns.length - 1])?.click();
      }
      [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click();
    });
    await sleep(250);
    // Bước dọn popup có thể bấm luôn nút đầu thai, nên sang kiếp mới cũng nghĩa là đã chết bằng luồng gốc.
    died = await state(page, (life) => {
      const c = globalThis.__VK2._test.char();
      return !!c?.dead || (c?.lifeNo ?? life) > life;
    }, lifeBefore);
  }
  check("chết bằng luồng gốc", died);
  await sleep(800);
  const hist = await state(page, () => {
    const h = globalThis.__VK2._test.acct().history;
    return h[h.length - 1];
  });
  check("sổ kiếp ghi tóm tắt căn cơ", !!hist?.can && hist.can.dao >= 1, JSON.stringify(hist?.can));
  await enterGame(page);
  await sleep(900);
  await calm(page);
  const lifeAfter = await state(page, () => globalThis.__VK2._test.char().lifeNo);
  const next = await can(page);
  check("đầu thai vào kiếp mới", lifeAfter === lifeBefore + 1, `${lifeBefore} -> ${lifeAfter}`);
  check("kiếp mới căn cơ về đầu, không giữ sức mạnh", next.open === 0 && next.daoCo === null);

  check("không gọi ra ngoài sandbox", outbound.length === 0, outbound.slice(0, 2).join(" "));
  check("không có lỗi JS hoặc lỗi mod", errors.length === 0, errors.slice(0, 3).join(" | "));

  await browser.close();
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} đạt`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(String(e.message).split("\n")[0]);
  const page = globalThis.__page;
  if (!page) process.exit(2);
  page.evaluate(() => globalThis.__trace)
    .catch(() => null)
    .then(async (t) => {
      console.error("Dấu vết:", JSON.stringify(t));
      await page.context().browser().close().catch(() => {});
      // Test tự chọn đáp án sự kiện, và có đáp án giết nhân vật thật. Đó là luật của game, không phải lỗi, nên chạy lại từ đầu.
      const attempt = Number(process.env.VK2_E2E_TRY || 1);
      if (t?.dead && attempt < 4) {
        console.log(`\nNhân vật chết vì sự kiện của game (lượt ${attempt}), chạy lại từ đầu.\n`);
        const again = require("node:child_process").spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, VK2_E2E_TRY: String(attempt + 1) } });
        process.exit(again.status ?? 2);
      }
      console.log("\nTest dừng giữa chừng, KHÔNG có kết quả.");
      process.exit(2);
    });
});
