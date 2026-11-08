// Kiểm thử end-to-end trong game thật. Cần server: `python serve_mod.py`, và Edge đã cài.
// Dùng: NODE_PATH=<thư mục có playwright-core> node vk2/tests/e2e.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const path = require("node:path");

const BASE = process.env.VK2_URL || "http://127.0.0.1:8766";
const OUT = process.argv[2] || ".";
const results = [];
function check(name, ok, extra = "") {
  results.push([name, !!ok, extra]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Giải quyết hướng dẫn và popup sự kiện đang chờ, giống người chơi bấm chọn. Tránh lựa chọn có ghi chú nguy hiểm thì tùy may rủi. */
async function clearBlockers(page) {
  return page.evaluate(() => {
    const visible = (b) => b && b.offsetParent !== null && !b.disabled;
    const comic = document.querySelector(".cn-wrap .cn-skip");
    if (visible(comic)) {
      comic.click();
      return "comic";
    }
    const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && visible(b));
    if (hint) {
      hint.click();
      return "hint";
    }
    const choice = [...document.querySelectorAll(".choices .choice")].find((b) => visible(b) && !b.classList.contains("off"));
    if (choice) {
      choice.click();
      return "choice";
    }
    const go = [...document.querySelectorAll("button")].find((b) => /^(Tiếp|Tiếp tục|Đóng)$|đi tiếp/.test(b.textContent.trim()) && visible(b) && !b.closest("#vk2-hud"));
    if (go) {
      go.click();
      return "next";
    }
    const dialog = [...document.querySelectorAll('[role="dialog"]')].find((d) => d.getClientRects().length > 0 && !d.closest("#vk2-modal"));
    if (dialog) {
      const btns = [...dialog.querySelectorAll("button")].filter(visible);
      const btn = btns.find((b) => /đi tiếp|Đóng|Bỏ qua|Né|Tránh|Từ chối/i.test(b.textContent)) ?? btns[btns.length - 1];
      if (btn) {
        btn.click();
        return "dialog";
      }
    }
    const play = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶" && visible(b));
    if (play) {
      play.click();
      return "play";
    }
    return null;
  });
}

async function calm(page) {
  const busy = () =>
    page.evaluate(() => {
      const dialog = [...document.querySelectorAll('[role="dialog"]')].some((d) => d.offsetParent !== null && !d.closest("#vk2-modal"));
      return dialog || !!document.querySelector(".game.has-event, .cn-wrap, .coach");
    });
  for (let i = 0; i < 60; i++) {
    if (!(await busy())) {
      await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());
      await sleep(350);
      if (!(await busy())) return;
    }
    await clearBlockers(page);
    await sleep(300);
  }
  throw new Error("Không dọn được popup của game");
}

async function setSpeed(page, label) {
  await page.evaluate((l) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === l && !x.disabled);
    if (b) b.click();
  }, label);
}

function acct2Check(raw) {
  const a = JSON.parse(raw);
  return a.history?.length >= 1 && typeof a.history[a.history.length - 1].name === "string";
}

/** Nếu nhân vật đã chết trong lúc thử thì dựng lại, để các kiểm thử sau có nhân vật sống. */
async function enterAfterDeath(page) {
  const dead = await page.evaluate(() => globalThis.__VK2._test.char()?.dead);
  if (!dead) return;
  console.log("  nhân vật đã chết trong lúc thử; dựng lại nhân vật mới");
  await page.evaluate(() => localStorage.removeItem("vkl.save"));
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
}

/** Bấm qua màn tạo nhân vật và hướng dẫn cho tới khi bảng theo dõi xuất hiện. */
async function enterGame(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator("#vk2-hud").count()) return true;
    const clicked = await page.evaluate(() => {
      const wanted = /Lập bia và luân hồi|Đầu thai|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp|Hiểu rồi|Ngẫu nhiên|Đồng ý/i;
      const btn = [...document.querySelectorAll("button, a")].find((b) => wanted.test(b.textContent || "") && b.offsetParent !== null);
      if (btn) {
        btn.click();
        return btn.textContent.trim().slice(0, 40);
      }
      return null;
    });
    if (clicked) console.log("  click:", clicked);
    await sleep(700);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  // Các kiểm thử nhận thưởng cần danh sách nhiệm vụ đang mở; trạng thái mặc định được kiểm ở phần mobile.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("vk2.test.open")) {
      sessionStorage.setItem("vk2.test.open", "1");
      localStorage.setItem("vk2.hudOpen", "1");
    }
  });
  const errors = [];
  const outbound = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" && m.text().includes("[VK2]")) errors.push(m.text());
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!/^(https?|wss?):$/.test(u.protocol)) return; // blob: và data: không ra mạng
    if (u.hostname.endsWith("supabase.co") || (u.hostname !== "127.0.0.1" && !/fonts\.(googleapis|gstatic)\.com/.test(u.hostname))) outbound.push(r.url());
  });

  await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
  check("nạp được 3 module VK2", await page.evaluate(() => !!(globalThis.__VK2 && globalThis.VK2Core && globalThis.VK2Data)));
  const entered = await enterGame(page);
  await page.screenshot({ path: path.join(OUT, "01-hud.png"), fullPage: true });
  check("vào được vòng chơi và thấy bảng theo dõi", entered);
  if (!entered) {
    console.log(await page.evaluate(() => document.body.innerText.slice(0, 800)));
    await browser.close();
    process.exit(1);
  }

  const S = (fn, arg) => page.evaluate(fn, arg);
  const snap = () => S(() => {
    const t = globalThis.__VK2._test;
    const c = t.char();
    return { age: c.age, realm: c.realm, layer: c.layer, cult: c.cultivation, stones: c.linhThach, focus: c.focus, v: c.vk2, dead: c.dead };
  });

  // Hook tốc độ tu luyện đi qua hàm gốc
  const rateProbe = await S(() => {
    const t = globalThis.__VK2._test;
    const c = t.char();
    return { mul: globalThis.__VK2.cultMul(c), expected: t.core.cultMul(c) };
  });
  check("hook cultMul trả đúng giá trị core", Math.abs(rateProbe.mul - rateProbe.expected) < 1e-9, `mul=${rateProbe.mul.toFixed(3)}`);

  // Sự kiện đang chờ thì bảng phải thu gọn, không đẩy lựa chọn khỏi màn hình
  await page.waitForSelector(".game.has-event", { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => [...document.querySelectorAll(".coach button")].find((b) => b.offsetParent)?.click());
  if (await page.locator(".game.has-event").count()) {
    await sleep(700);
    check("có sự kiện thì bảng theo dõi chỉ còn một dòng", (await page.locator("#vk2-hud .vk2-q").count()) === 0);
    const choiceBox = await page.locator(".choices .choice").first().boundingBox();
    check("lựa chọn sự kiện đầu tiên nằm trong màn hình", !!choiceBox && choiceBox.y + choiceBox.height <= 900, JSON.stringify(choiceBox));
    await page.screenshot({ path: path.join(OUT, "01b-event.png") });
  }

  // Năm trôi qua được đếm từ gameplay thật, không chỉnh tuổi bằng tay
  await setSpeed(page, "16×");
  const s0 = await snap();
  const target = Math.max(7, Math.floor(s0.age) + 3);
  for (let i = 0; i < 200; i++) {
    const s = await snap();
    if (Math.floor(s.age) >= target && (s.v.c.y_tu_luyen ?? 0) >= 1) break;
    await clearBlockers(page);
    await sleep(200);
  }
  await sleep(800);
  const s1 = await snap();
  check("thời gian thật trôi và bộ đếm năm tăng theo", (s1.v.c.y_tu_luyen ?? 0) >= 1 && Math.floor(s1.age) > Math.floor(s0.age), `age ${s0.age.toFixed(1)}→${s1.age.toFixed(1)}, y=${s1.v.c.y_tu_luyen}`);
  check("năm dưới 6 tuổi không được tính", (s1.v.c.y_tu_luyen ?? 0) <= Math.floor(s1.age) - 5, `y=${s1.v.c.y_tu_luyen}`);
  await calm(page);
  await sleep(700);
  const rows = await page.locator("#vk2-hud .vk2-q").count();
  check("tracker hiện từ 1 đến 3 nhiệm vụ khi không có sự kiện", rows >= 1 && rows <= 3, `rows=${rows}`);
  await page.screenshot({ path: path.join(OUT, "01c-playing.png"), fullPage: true });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶");
    if (b) b.click();
  });

  // Cầu nối tu luyện: hệ số của mod đổi tốc độ gốc (nM)
  const rateChange = await S(() => {
    const V = globalThis.__VK2;
    const t = V._test;
    const c = t.char();
    return new Promise((res) => {
      const a = c.vk2.talents;
      const baseMul = V.cultMul(c);
      a.lu_khach = { lv: 5, xp: 0, branch: null };
      const act = c.vk2.active.slice();
      c.vk2.active = ["lu_khach"];
      const buffed = V.cultMul(c);
      delete a.lu_khach;
      c.vk2.active = act;
      res({ baseMul, buffed });
    });
  });
  check("thiên phú đang vận hành tăng tốc độ tu", rateChange.buffed > rateChange.baseMul, `${rateChange.baseMul.toFixed(3)}→${rateChange.buffed.toFixed(3)}`);

  // Hook gốc tốc độ tu (nM) thực sự chạy
  const rate = await S(() => {
    const t = globalThis.__VK2._test;
    return t.rate(t.char());
  });
  check("hàm tốc độ tu gốc đã đi qua hook", rate !== null && rate > 0, `rate=${rate}`);

  // Đếm số lần game gốc gọi các hook, để biết bản vá nằm đúng luồng
  await S(() => {
    const V = globalThis.__VK2;
    V._calls = { stat: 0, brk: 0, kill: 0 };
    for (const [k, fn] of [["stat", "stat"], ["brk", "breakBonus"], ["kill", "onKill"]]) {
      const real = V[fn];
      V[fn] = (...a) => {
        V._calls[k]++;
        return real(...a);
      };
    }
  });

  // Chiến đấu thật qua bảng săn quái của game
  const killsBefore = (await snap()).v.c.kills ?? 0;
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.age = Math.max(c.age, 18);
    c.realm = Math.max(c.realm, 1);
    c.layer = Math.max(c.layer, 3);
    c.lifespan = Math.max(c.lifespan, 400);
    c.stats.sucKhoe = 100;
  });
  await sleep(600);
  for (let i = 0; i < 12 && (await page.locator(".game.has-event").count()); i++) {
    await clearBlockers(page);
    await sleep(300);
  }
  await S(() => globalThis.__VK2._test.char() && document.querySelector("#vk2-hud") && 1);
  await page.evaluate(() => {
    const go = [...document.querySelectorAll("button")].find((b) => /Trừ yêu|Săn/i.test(b.textContent) && b.offsetParent !== null);
    if (go) go.click();
  });
  await sleep(500);
  const hunted = await page.evaluate(() => {
    const it = document.querySelector(".hunt-item");
    if (!it) return false;
    (it.querySelector("button") ?? it).click();
    return true;
  });
  check("mở được bảng săn quái của game", hunted);
  let killsNow = killsBefore;
  for (let i = 0; i < 250 && killsNow < killsBefore + 3; i++) {
    await clearBlockers(page);
    await sleep(200);
    const st = await snap();
    killsNow = st.v.c.kills ?? 0;
    if (st.dead) break;
  }
  await calm(page);
  const atOnce = await S(() => ({ calls: globalThis.__VK2._calls, kills: globalThis.__VK2._test.char().vk2.c.kills ?? 0 }));
  const calls = atOnce.calls;
  killsNow = atOnce.kills;
  check("thắng quái thật làm tăng bộ đếm qua hook", killsNow > killsBefore, `${killsBefore}→${killsNow}, gọi hook=${calls.kill}`);
  check("mỗi trận thắng được đếm đúng một lần", killsNow - killsBefore === calls.kill, `${killsNow - killsBefore} vs ${calls.kill}`);
  check("trận đấu lấy chỉ số qua hook", calls.stat > 0, `stat=${calls.stat}`);
  await page.screenshot({ path: path.join(OUT, "01d-fight.png"), fullPage: true });

  // Đột phá thật: đủ tu vi thì game gốc mở sự kiện đột phá và tính tỷ lệ qua hook
  const before = await snap();
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.focus = "tu_luyen";
    c.cultivation += 1e7;
  });
  let moved = false;
  for (let i = 0; i < 150; i++) {
    await clearBlockers(page);
    await sleep(200);
    const st = await snap();
    if (st.dead || st.realm > before.realm || st.layer > before.layer) {
      moved = st.realm > before.realm || st.layer > before.layer;
      break;
    }
  }
  check("tiến cảnh thật khi đủ tu vi", moved);
  await S(() => {
    const c = globalThis.__VK2._test.char();
    if (!c.dead) {
      c.realm = Math.max(c.realm, 1);
      c.layer = 9;
      c.cultivation += 1e9;
    }
  });
  for (let i = 0; i < 80 && (await S(() => globalThis.__VK2._calls.brk)) === 0; i++) {
    await clearBlockers(page);
    await sleep(200);
  }
  const brkCalls = await S(() => globalThis.__VK2._calls.brk);
  check("tỷ lệ đột phá của game đi qua hook", brkCalls > 0, `brk=${brkCalls}`);
  await enterAfterDeath(page);

  // Nhận thưởng qua UI, kể cả bấm đúp
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.cultivation = Math.max(c.cultivation, 1);
  });
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.vk2.pins = ["m1_qi"];
    delete c.vk2.claimed.m1_qi;
  });
  await calm(page);
  await sleep(900);
  const claimBtn = page.locator('#vk2-hud [data-act="claim"][data-id="m1_qi"]');
  await claimBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  const beforeClaim = (await snap()).stones;
  const hadBtn = await claimBtn.count();
  check("nhiệm vụ hoàn thành hiện nút nhận thưởng", hadBtn === 1);
  if (hadBtn) {
    await page.evaluate(() => {
      const b = document.querySelector('#vk2-hud [data-act="claim"][data-id="m1_qi"]');
      b.click();
      b.click();
    });
    await sleep(300);
    const after = (await snap()).stones;
    check("nhận thưởng đúng một lần khi bấm đúp", after - beforeClaim === 20, `+${after - beforeClaim}`);
    const stillShown = await page.locator('#vk2-hud [data-id="m1_qi"]').count();
    check("nhiệm vụ đã nhận không còn trong tracker", stillShown === 0);
  }
  await page.screenshot({ path: path.join(OUT, "02-after-claim.png"), fullPage: true });

  // Nút "Đi đến" phải mở đúng bảng của game
  await calm(page);
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.vk2.pins = [];
    c.vk2.c.kills = 0;
    c.vk2.claimed = { m1_qi: 1 };
    c.vk2.pins = ["m1_kill"];
  });
  await sleep(800);
  await page.locator('#vk2-hud [data-act="go"][data-id="m1_kill"]').click();
  await sleep(400);
  check('nút "Đi đến" mở đúng bảng săn quái', (await page.locator(".hunt-item").count()) > 0);
  await page.evaluate(() => {
    const x = [...document.querySelectorAll("button")].find((b) => /^(Đóng|‹|✕|×)/.test(b.textContent.trim()) && b.offsetParent !== null && !b.closest("#vk2-hud"));
    if (x) x.click();
  });
  await sleep(300);
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.vk2.c.kills = 99;
    c.vk2.claimed.m1_kill = 1;
    c.vk2.pins = [];
  });

  // Bảng nhật ký dừng thời gian và có đủ 3 tab
  await calm(page);
  await page.waitForSelector('#vk2-hud [data-tab="quests"]', { timeout: 5000 });
  await page.locator('#vk2-hud [data-tab="quests"]').click();
  await sleep(1200);
  const a0 = (await snap()).age;
  await sleep(1500);
  const a1 = (await snap()).age;
  check("mở nhật ký thì thời gian game dừng", a1 === a0, `${a0}→${a1}`);
  await page.screenshot({ path: path.join(OUT, "03-journal.png") });
  const journal = await page.locator("#vk2-modal").innerText();
  await page.locator('#vk2-modal [data-tab="journey"]').click();
  await sleep(200);
  const journeyText = await page.locator("#vk2-modal").innerText();
  check("tab Hành trình có hướng phát triển, mục tiêu và nhật ký", ["Hướng phát triển", "Mục tiêu kế tiếp", "Nhật ký kiếp này", "Các kiếp trước"].every((x) => journeyText.includes(x)));
  const logCounts = await S(() => {
    const c = globalThis.__VK2._test.char();
    return { game: c.log.length, big: c.log.filter((e) => e.tone === "big").length, shown: document.querySelectorAll("#vk2-modal .vk2-log-item").length };
  });
  check("mặc định lọc đúng các cột mốc", logCounts.shown === Math.min(logCounts.big, 100), JSON.stringify(logCounts));
  await page.locator('#vk2-modal [data-filter="all"]').click();
  await sleep(200);
  const allShown = await page.locator("#vk2-modal .vk2-log-item").count();
  check("lọc Tất cả hiện đủ nhật ký của game", allShown === Math.min(logCounts.game, 100), `${allShown}/${logCounts.game}`);
  await page.screenshot({ path: path.join(OUT, "03b-journey.png") });
  await page.locator('#vk2-modal [data-tab="quests"]').click();
  await sleep(200);
  check("nhật ký có đủ các nhóm", ["Chính tuyến", "Chuẩn bị đột phá", "Hằng ngày", "Luân hồi"].every((x) => journal.includes(x)));

  // Thức tỉnh thiên phú từ hành vi, UI, thăng bậc và nhánh
  await S(() => {
    const V = globalThis.__VK2;
    const c = V._test.char();
    c.path = "kiem";
    for (let i = 0; i < 6; i++) V.onKill(c);
  });
  await sleep(900);
  await page.locator('#vk2-modal [data-tab="talents"]').click();
  await sleep(200);
  let st = await snap();
  check("Kiếm Tâm thức tỉnh từ số trận thắng thật", !!st.v.talents.kiem_tam, JSON.stringify(st.v.talents.kiem_tam ?? null));
  await page.screenshot({ path: path.join(OUT, "04-talents.png") });

  const atkOf = () => S(() => globalThis.__VK2._test.core.statMul(globalThis.__VK2._test.char(), { hp: 1000, atk: 1000, def: 1000 }).atk);
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.vk2.active = ["kiem_tam"];
  });
  const atk0 = await atkOf();
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.vk2.talents.kiem_tam.xp = 100000;
  });
  await sleep(700);
  const lvl = page.locator('#vk2-modal [data-act="level"][data-id="kiem_tam"]');
  check("đủ kinh nghiệm thì hiện nút Thăng bậc", (await lvl.count()) === 1);
  await lvl.click();
  await sleep(300);
  st = await snap();
  check("thăng bậc từ UI hoạt động", st.v.talents.kiem_tam.lv === 2, `lv=${st.v.talents.kiem_tam.lv}`);
  check("thăng bậc làm tăng chỉ số", (await atkOf()) > atk0);

  await page.locator('#vk2-modal [data-tab="root"]').click();
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, "05-root.png") });
  check("tab linh căn hiển thị hệ", (await page.locator("#vk2-modal .vk2-el.has").count()) >= 1);
  await page.locator('#vk2-modal [data-act="close"]').click();
  await sleep(300);
  check("đóng bảng thì bỏ modal", (await page.locator("#vk2-modal").count()) === 0);

  // Lưu và tải: tải lại trang, tiến trình phải còn nguyên
  const saved = await snap();
  await S(() => {
    const c = globalThis.__VK2._test.char();
    c.__marker = 1;
  });
  await sleep(3500);
  await page.reload({ waitUntil: "load" });
  const back = await enterGame(page);
  await sleep(700);
  check("tải lại trang vẫn vào được game", back);
  const reloaded = await snap();
  check("tải lại giữ tiến trình nhân vật", reloaded.v.claimed.m1_qi === 1 && reloaded.v.talents.kiem_tam?.lv === 2, JSON.stringify(reloaded.v.claimed));
  check("tải lại giữ bộ đếm", (reloaded.v.c.kills ?? 0) >= (saved.v.c.kills ?? 0));
  const acct = await S(() => localStorage.getItem("vk2.acct.guest"));
  check("trạng thái tài khoản được lưu riêng", !!acct && JSON.parse(acct).daily?.quests?.length === 3);

  // Nhận thưởng lại sau khi tải trang vẫn không được
  const dup = await S(() => {
    const t = globalThis.__VK2._test;
    return t.core.claim(t.char(), t.acct(), "m1_qi", Date.now(), {});
  });
  check("sau khi tải lại vẫn không nhận thưởng lặp được", dup === null);

  // Mobile
  await calm(page);
  await page.setViewportSize({ width: 360, height: 700 });
  await sleep(500);
  const overflow = await S(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("mobile 360px không tràn ngang", overflow <= 0, `overflow=${overflow}`);
  await page.screenshot({ path: path.join(OUT, "06-mobile.png"), fullPage: true });
  await S(() => localStorage.removeItem("vk2.hudOpen"));
  await sleep(700);
  check("mobile mặc định thu gọn bảng theo dõi", (await page.locator("#vk2-hud .vk2-q").count()) === 0);
  const collapse = page.locator('#vk2-hud [data-act="collapse"]');
  if (!(await page.locator(".game.has-event").count())) {
    await collapse.click();
    await sleep(200);
    check("mở rộng được bảng nhiệm vụ", (await page.locator("#vk2-hud .vk2-q").count()) >= 1);
    await collapse.click();
    await sleep(200);
    check("thu gọn lại được bảng nhiệm vụ", (await page.locator("#vk2-hud .vk2-q").count()) === 0);
  }
  await page.locator('#vk2-hud [data-tab="talents"]').click();
  await sleep(300);
  const mo = await S(() => {
    const s = document.querySelector(".vk2-sheet").getBoundingClientRect();
    return { w: s.width, right: s.right, vw: innerWidth };
  });
  check("bảng lớn vừa màn hình mobile", mo.right <= mo.vw && mo.w <= mo.vw, JSON.stringify(mo));
  await page.screenshot({ path: path.join(OUT, "07-mobile-talents.png") });
  await page.locator('#vk2-modal [data-act="close"]').click();

  await page.setViewportSize({ width: 1100, height: 900 });

  // Save cũ chưa có dữ liệu VK2: phải vào được, giữ nguyên nhân vật, không phát thưởng bù
  await sleep(3500);
  const legacy = await S(() => {
    const c = globalThis.__VK2._test.char();
    return { name: c.name, realm: c.realm, stones: c.linhThach, life: c.lifeNo };
  });
  await page.addInitScript(() => {
    if (sessionStorage.getItem("vk2.test.legacy")) return;
    sessionStorage.setItem("vk2.test.legacy", "1");
    const raw = localStorage.getItem("vkl.save");
    if (raw) {
      const save = JSON.parse(raw);
      delete save.char.vk2;
      localStorage.setItem("vkl.save", JSON.stringify(save));
    }
  });
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await sleep(1000);
  const migrated = await S(() => {
    const c = globalThis.__VK2._test.char();
    return { name: c.name, realm: c.realm, stones: c.linhThach, life: c.lifeNo, v: c.vk2, ready: document.querySelectorAll('#vk2-hud [data-act="claim"]').length };
  });
  check("save cũ giữ nguyên nhân vật", migrated.name === legacy.name && migrated.realm === legacy.realm && migrated.life === legacy.life, `${legacy.name} realm ${legacy.realm}`);
  check("save cũ được ghi nhận nhiệm vụ đã qua, không phát thưởng", migrated.v?.claimed?.m1_qi === "legacy", JSON.stringify(migrated.v?.claimed ?? {}).slice(0, 120));
  await page.screenshot({ path: path.join(OUT, "08-legacy.png"), fullPage: true });

  // Chết thật rồi đầu thai: vòng luân hồi của game phải chạy nguyên vẹn
  await S(() => {
    const t = globalThis.__VK2._test;
    const c = t.char();
    c.vk2.talents.kiem_tam = { lv: 4, xp: 0, branch: "ba" };
    c.lifespan = Math.floor(c.age) + 1;
    c.focus = "tu_luyen";
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶");
    if (b) b.click();
  });
  await setSpeed(page, "16×");
  let isDead = false;
  for (let i = 0; i < 120 && !isDead; i++) {
    await clearBlockers(page);
    await S(() => {
      const c = globalThis.__VK2._test.char();
      if (c && !c.dead) c.lifespan = Math.min(c.lifespan, Math.floor(c.age) + 1);
    });
    await sleep(250);
    isDead = await S(() => !!globalThis.__VK2._test.char()?.dead);
  }
  check("nhân vật chết theo luồng gốc của game", isDead);
  await sleep(800);
  check("bảng VK2 ẩn ở màn hình chết", (await page.locator("#vk2-hud").count()) === 0);
  await page.screenshot({ path: path.join(OUT, "09-death.png"), fullPage: true });
  const book = JSON.parse(await S(() => localStorage.getItem("vk2.acct.guest")));
  check("cái chết được ghi vào sổ thiên phú", book.deaths >= 1 && book.book.kiem_tam === 4, JSON.stringify({ d: book.deaths, b: book.book }));
  const reborn = await enterGame(page);
  await sleep(900);
  const next = await S(() => {
    const c = globalThis.__VK2._test.char();
    return { life: c?.lifeNo, age: c?.age, v: c?.vk2, dead: c?.dead };
  });
  check("kiếp vừa chết vào sổ các kiếp trước", acct2Check(await S(() => localStorage.getItem("vk2.acct.guest"))), "");
  check("đầu thai vào kiếp mới", reborn && next.life === legacy.life + 1 && !next.dead, `kiếp ${legacy.life}→${next.life}`);
  check("kiếp mới có tiến trình nhiệm vụ riêng", next.v && !next.v.claimed.m1_kill && !next.v.talents.kiem_tam, JSON.stringify(next.v?.claimed ?? null));
  const acct2 = JSON.parse(await S(() => localStorage.getItem("vk2.acct.guest")));
  check("tài khoản giữ sổ thiên phú sang kiếp mới", acct2.book.kiem_tam === 4);
  await page.screenshot({ path: path.join(OUT, "10-reborn.png"), fullPage: true });

  // An toàn
  const blocked = await S(() => globalThis.__VK2_BLOCKED.length);
  check("không có request nào đi ra backend thật", outbound.length === 0, outbound.slice(0, 3).join(" "));
  console.log(`  guard đã chặn ${blocked} lệnh gọi trước khi ra mạng`);
  check("không có lỗi JS và cảnh báo VK2", errors.length === 0, errors.slice(0, 3).join(" | ").slice(0, 300));

  await browser.close();
  const failed = results.filter((r) => !r[1]);
  console.log(`\n${results.length - failed.length}/${results.length} đạt`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
