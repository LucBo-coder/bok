// Các hệ thống 3.0 trong game thật: bấm giao diện như người chơi, sự kiện đi qua hàng đợi của game, lưu và tải lại.
// Cần server: `python serve_mod.py`, Edge đã cài.
// Dùng: NODE_PATH=<thư mục có playwright-core> node vk2/tests/v3_e2e.js [thư-mục-ảnh]
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
  for (let i = 0; i < 60; i++) {
    if (await page.locator("#vk2-hud").count()) return true;
    await page.evaluate(() => {
      const wanted = /Lập bia và luân hồi|Đầu thai|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp|Hiểu rồi|Ngẫu nhiên|Đồng ý/i;
      [...document.querySelectorAll("button, a")].find((b) => wanted.test(b.textContent || "") && b.offsetParent !== null)?.click();
    });
    await sleep(500);
  }
  return false;
}
/** Dọn hướng dẫn, truyện tranh và popup, không chọn hộ sự kiện của mod. */
async function clearPopups(page) {
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => {
      const visible = (b) => b && b.offsetParent !== null && !b.disabled;
      const inMod = (b) => b.closest("#vk2-modal") || b.closest("#vk2-hud");
      const comic = document.querySelector(".cn-wrap .cn-skip");
      if (visible(comic)) return comic.click(), false;
      const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && visible(b));
      if (hint) return hint.click(), false;
      const go = [...document.querySelectorAll("button")].find((b) => /^(Tiếp|Tiếp tục|Đóng)$|đi tiếp/.test(b.textContent.trim()) && visible(b) && !inMod(b));
      if (go) return go.click(), false;
      const dialog = [...document.querySelectorAll('[role="dialog"]')].find((d) => d.getClientRects().length > 0 && !d.closest("#vk2-modal"));
      if (dialog) {
        const btns = [...dialog.querySelectorAll("button")].filter(visible);
        (btns.find((b) => /đi tiếp|Đóng|Bỏ qua|Né|Tránh|Từ chối/i.test(b.textContent)) ?? btns[btns.length - 1])?.click();
        return false;
      }
      return !document.querySelector(".cn-wrap, .coach");
    });
    if (done) return;
    await sleep(200);
  }
}
const pause = (page) => page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());
const S = (page, fn, arg) => page.evaluate(fn, arg);

/** Giải quyết kỳ ngộ gốc đang chờ, giữ nhân vật an toàn, để có màn hình yên ổn cho bước kế. */
async function settle(page) {
  for (let i = 0; i < 40; i++) {
    await clearPopups(page);
    const busy = await page.evaluate(() => {
      const list = [...document.querySelectorAll(".choices .choice")].filter((b) => b.offsetParent !== null && !b.classList.contains("off"));
      if (!list.length) return false;
      (list.find((b) => /Củng cố|Rời|Từ chối|Bỏ qua|Thôi|Rút lui/.test(b.textContent)) ?? list[list.length - 1]).click();
      return true;
    });
    if (!busy) return pause(page);
    await sleep(150);
  }
}
const protect = (page, extra) =>
  S(page, (e) => {
    const c = globalThis.__VK2._test.char();
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    c.breakDelay = 999;
    c.lifespan = Math.max(c.lifespan, 5000);
    Object.assign(c, e ?? {});
  }, extra);
const openTab = async (page, group, tab) => {
  if (!(await page.locator("#vk2-modal").count())) await page.click('#vk2-hud [data-tab="journey"]');
  await page.click(`#vk2-modal .vk2-tabs [data-tab="${group}"]`);
  if (tab && tab !== group) await page.click(`#vk2-modal .vk2-subtabs [data-tab="${tab}"]`);
  await sleep(60);
};
const closeTab = (page) => page.click('#vk2-modal [data-act="close"]');
const bodyText = (page) => S(page, () => document.querySelector(".vk2-sheet-body")?.textContent ?? "");
const choices = (page) => S(page, () => [...document.querySelectorAll(".choices .choice")].map((b) => b.textContent.trim()));
const pickChoice = async (page, re) => {
  const ok = await S(page, (src) => {
    const r = new RegExp(src);
    const b = [...document.querySelectorAll(".choices .choice")].find((x) => r.test(x.textContent) && !x.classList.contains("off"));
    if (b) b.click();
    return !!b;
  }, re.source);
  await sleep(150);
  return ok;
};
/** Chạy thời gian bằng vòng lặp gốc cho tới khi đạt điều kiện, dọn kỳ ngộ gốc trên đường đi. */
async function runUntil(page, fnSrc, arg, tries = 60) {
  await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
  for (let i = 0; i < tries; i++) {
    if (await S(page, ([src, a]) => new Function("c", "a", "x", `return (${src})`)(globalThis.__VK2._test.char(), globalThis.__VK2._test.acct(), a), [fnSrc, arg])) {
      await pause(page);
      return true;
    }
    await protect(page);
    await clearPopups(page);
    await page.evaluate(() => {
      const list = [...document.querySelectorAll(".choices .choice")].filter((b) => b.offsetParent !== null && !b.classList.contains("off"));
      if (list.length) (list.find((b) => /Củng cố|Rời|Từ chối|Bỏ qua|Thôi|Rút lui|Chuẩn bị thêm|Ghi lại/.test(b.textContent)) ?? list[list.length - 1]).click();
      else [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click();
    });
    await sleep(300);
  }
  await pause(page);
  return false;
}

const SECTIONS = [];
const section = (fn) => SECTIONS.push(fn);

// ---------- Giai đoạn 2 ----------
section(async function phase2(page) {
  await settle(page);
  await protect(page, { realm: 2, layer: 3, age: 40, path: "kiem", linhThach: 5000 });
  await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const d = globalThis.VK2Dao.ensure(c, a);
    d.year = 40;
    d.mastery.kiem_y = 70;
    d.mastery.loi_phap = 70;
    d.open = [{ id: "dong_phu", until: 500, seed: 4242 }];
  });

  await openTab(page, "can", "art");
  let text = await bodyText(page);
  check("tab Công Pháp có hướng dẫn, đạo niệm, công thức", /Lợi ích/.test(text) && /Rủi ro/.test(text) && /Kiếm Ý/.test(text) && /Lôi Đình Kiếm Quyết/.test(text));
  const atk0 = await S(page, () => globalThis.__VK2._test.core.totals(globalThis.__VK2._test.char()).atk);
  await page.fill('[data-name="loi_kiem"]', "Thiên Lôi Nhất Kiếm");
  await page.click('[data-act="art-make"][data-id="loi_kiem"]');
  await sleep(100);
  text = await bodyText(page);
  check("sáng tạo bí thuật bằng giao diện, có tên đã đặt", /Thiên Lôi Nhất Kiếm/.test(text));
  const after = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { atk: globalThis.__VK2._test.core.totals(c).atk, extra: globalThis.__VK2._test.core.duelMods(c).extra, stones: c.linhThach };
  });
  check("bí thuật có hiệu ứng thật", after.atk > atk0 && after.extra > 0, `${atk0.toFixed(3)} -> ${after.atk.toFixed(3)}, đánh thêm ${after.extra.toFixed(2)}`);
  check("trừ đúng chi phí", after.stones === 4600, after.stones);

  await openTab(page, "realm");
  text = await bodyText(page);
  check("tab Bí Cảnh hiện bí cảnh đang mở", /Động phủ cổ tu/.test(text) && /Tiến vào/.test(text));
  await page.screenshot({ path: path.join(OUT, "v3-realm.png") });

  // Bộ dựng sự kiện chỉ có sau năm đầu chạy qua bản vá, nên cho thời gian trôi nếu cần
  await closeTab(page);
  await runUntil(page, "c.vk2.can.year > 40 || c.age > 41");
  await settle(page);
  await protect(page);
  await S(page, () => {
    const c = globalThis.__VK2._test.char();
    c.vk2.dao.open = [{ id: "dong_phu", until: 5000, seed: 4242 }];
  });
  await openTab(page, "realm");
  await page.click('[data-act="realm-go"]');
  await sleep(300);
  check("tiến vào: bảng đóng, tầng đầu hiện như kỳ ngộ của game", (await page.locator("#vk2-modal").count()) === 0 && (await page.locator(".game.has-event").count()) === 1);
  const c1 = await choices(page);
  check("tầng có lựa chọn rút lui", c1.some((x) => /Rút lui/.test(x)), c1.length);
  await page.screenshot({ path: path.join(OUT, "v3-floor.png") });

  // Đang ở giữa bí cảnh thì tải lại trang
  const before = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { floor: c.vk2.dao.run.floor, labels: [...document.querySelectorAll(".choices .choice")].map((b) => b.textContent.trim()) };
  });
  await S(page, () => globalThis.__VK2._test.char() && globalThis.dispatchEvent(new Event("pagehide")));
  await sleep(100);
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await sleep(500);
  await clearPopups(page);
  const reloaded = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { floor: c.vk2.dao.run?.floor, labels: [...document.querySelectorAll(".choices .choice")].map((b) => b.textContent.trim()) };
  });
  check("tải lại giữa bí cảnh: vẫn đúng tầng và đúng lựa chọn", reloaded.floor === before.floor && JSON.stringify(reloaded.labels) === JSON.stringify(before.labels), `tầng ${reloaded.floor}`);

  // Đi hết bí cảnh bằng nút bấm. Chỉ số cao để bảo đảm đi tới boss, phần thua đã có test đơn vị.
  await protect(page, { realm: 6, layer: 5 });
  const stones0 = await S(page, () => globalThis.__VK2._test.char().linhThach);
  let steps = 0;
  const trail = [];
  while (steps++ < 15 && (await S(page, () => !!globalThis.__VK2._test.char().vk2.dao.run))) {
    trail.push((await choices(page)).join("/").slice(0, 90));
    const moved = (await pickChoice(page, /Giao chiến|Phá trận|chia đều|lấy vừa đủ|Quyết chiến|Nhận truyền thừa và lời/)) || (await pickChoice(page, /Cúi đầu|Rút lui/));
    if (!moved) break;
    await sleep(120);
    await clearPopups(page);
  }
  const res = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const d = c.vk2.dao;
    return { run: d.run, cleared: d.cleared, runs: d.runs, stones: c.linhThach, log: c.log.slice(-6).map((e) => e.text).join(" | ") };
  });
  check("đi hết bí cảnh qua giao diện", res.run === null && res.cleared === 1, `${steps} bước ${res.cleared === 1 ? "" : trail.join(" || ")}`);
  check("bí cảnh phát chiến lợi phẩm", res.stones > stones0, `${stones0} -> ${res.stones}`);
  check("lượt đi ghi vào nhật ký game", /Động phủ cổ tu/.test(res.log));

  await settle(page);
  await openTab(page, "quests");
  text = await bodyText(page);
  check("nhiệm vụ cơ duyên hiện trong bảng", /Ngộ đạo và cơ duyên/.test(text));
  await page.screenshot({ path: path.join(OUT, "v3-quests.png") });
  await openTab(page, "realm", "inherit");
  check("tab Truyền Thừa mở được", /Đã nhận/.test(await bodyText(page)));
  await closeTab(page);

  const readDao = () => S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { arts: JSON.stringify(c.vk2.dao.arts), mastery: c.vk2.dao.mastery, cleared: c.vk2.dao.cleared };
  });
  const saved = await readDao();
  await S(page, () => globalThis.dispatchEvent(new Event("pagehide")));
  await sleep(100);
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await sleep(500);
  await clearPopups(page);
  const loaded = await readDao();
  // Năm có thể trôi tiếp ngay sau khi tải lại, nên đạo niệm chỉ được tăng, không được mất.
  const lostMastery = Object.keys(saved.mastery).filter((k) => !(loaded.mastery[k] >= saved.mastery[k]));
  check("lưu và tải lại giữ bí thuật, đạo niệm, số bí cảnh", loaded.arts === saved.arts && loaded.cleared === saved.cleared && !lostMastery.length, lostMastery.join(","));
});

// ---------- Giai đoạn 3 ----------
section(async function phase3(page) {
  await settle(page);
  await protect(page, { realm: 3, layer: 1, linhThach: 30000 });
  await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const Q = globalThis.VK2Khi;
    Q.ensure(c, a);
    for (const id of Object.keys(Q.MATS)) Q.addMat(c, a, id, 20);
  });
  await openTab(page, "cave", "forge");
  let text = await bodyText(page);
  check("tab Luyện Khí có hướng dẫn, pháp bảo, phù lục, nguyên liệu", /Lợi ích/.test(text) && /Rủi ro/.test(text) && /Phi kiếm/.test(text) && /Phù lục/.test(text) && /Tinh thiết/.test(text));
  const atk0 = await S(page, () => globalThis.__VK2._test.core.totals(globalThis.__VK2._test.char()).atk);
  await page.click('[data-act="craft"][data-id="kiem"]');
  await sleep(100);
  const it = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { n: c.vk2.khi.items.length, atk: globalThis.__VK2._test.core.totals(c).atk, q: c.vk2.khi.items[0]?.q };
  });
  check("luyện pháp bảo bằng nút, có hiệu ứng thật", it.n === 1 && it.atk > atk0, `phẩm ${it.q}, ${atk0.toFixed(3)} -> ${it.atk.toFixed(3)}`);
  await page.click('[data-act="item-natal"]');
  await sleep(100);
  check("nhận bản mệnh bằng nút", await S(page, () => !!globalThis.__VK2._test.char().vk2.khi.natal));
  await page.click('[data-act="tali-draw"][data-id="tinh_tam"]');
  await sleep(60);
  await page.click('[data-act="tali-arm"][data-id="tinh_tam"]');
  await sleep(60);
  check("vẽ và chuẩn bị phù", await S(page, () => globalThis.__VK2._test.char().vk2.khi.armed === "tinh_tam"));
  await page.screenshot({ path: path.join(OUT, "v3-forge.png") });
  await openTab(page, "cave", "cave");
  await page.click('[data-act="cave-found"][data-id="linh"]');
  await sleep(100);
  await page.click('[data-act="cave-build"][data-id="tu_linh"]');
  await sleep(100);
  text = await bodyText(page);
  check("khai phá động phủ và xây công trình bằng nút", /Linh sơn/.test(text) && (await S(page, () => globalThis.VK2Khi.buildLv(globalThis.__VK2._test.char(), "tu_linh") === 1)));
  await page.screenshot({ path: path.join(OUT, "v3-cave.png") });
  await closeTab(page);
  globalThis.__extraTabs = [...(globalThis.__extraTabs ?? []), ["cave", "cave"], ["cave", "forge"]];
});

// ---------- Giai đoạn 4 ----------
section(async function phase4(page) {
  await settle(page);
  await protect(page, { realm: 4, layer: 1, linhThach: 60000, partner: "Vân Nhi", sect: null });
  await S(page, () => {
    const a = globalThis.__VK2._test.acct();
    const c = globalThis.__VK2._test.char();
    globalThis.VK2The.ensure(c, a);
    const w = a.world;
    w.npcs.push(Object.assign(globalThis.VK2The.addNpc(w, {}), { n: "Cố Trường Không", r: 6, pe: "chinh", b: w.year - 100, lo: 9999, pa: c.path ?? "kiem" }));
    w.npcs.pop();
    Object.assign(w.npcs[w.npcs.length - 1], {});
    const stu = globalThis.VK2The.addNpc(w, {});
    Object.assign(stu, { n: "Tô Tiểu Mai", r: 0, ro: 1.7, b: w.year - 14, lo: 9999, pe: "chinh" });
  });
  await openTab(page, "mentor", "people");
  let text = await bodyText(page);
  check("tab Nhân Vật hiện NPC với tuổi, cảnh giới, tính cách, mục tiêu", /Mục tiêu/.test(text) && /tuổi/.test(text) && /Căn cốt/.test(text));
  await openTab(page, "mentor", "mentor");
  await page.click('[data-act="m-join"]:not([disabled])');
  await sleep(100);
  check("bái sư bằng nút", await S(page, () => !!globalThis.__VK2._test.char().vk2.the.master));
  text = await bodyText(page);
  check("tab Sư Đồ hiện sư phụ và đồ đệ khả dĩ", /Sư phụ/.test(text) && /Tô Tiểu Mai/.test(text));
  await page.click('[data-act="d-take"]:not([disabled])');
  await sleep(100);
  check("nhận đồ đệ bằng nút", await S(page, () => globalThis.__VK2._test.char().vk2.the.disciples.length >= 1));
  await page.click('[data-act="d-teach"]:not([disabled])');
  await sleep(100);
  check("truyền bí thuật cho đồ đệ bằng nút", await S(page, () => globalThis.__VK2._test.char().vk2.the.taught === 1));
  await page.screenshot({ path: path.join(OUT, "v3-mentor.png") });
  await openTab(page, "mentor", "sect");
  await page.fill("[data-sect-name]", "Vấn Đạo Tông");
  await page.click('[data-act="s-found"]');
  await sleep(120);
  check("lập tông bằng nút, ghi vào dữ liệu tông của game", await S(page, () => globalThis.__VK2._test.char().sect === "Vấn Đạo Tông"));
  text = await bodyText(page);
  check("tab Tông Môn hiện lãnh thổ, linh mạch, các thế lực", /Lãnh thổ/.test(text) && /Linh mạch/.test(text) && /Vấn Đạo Tông/.test(text));
  await page.screenshot({ path: path.join(OUT, "v3-sect.png") });
  await openTab(page, "mentor", "family");
  await page.fill("[data-fam-name]", "Lý gia");
  await page.click('[data-act="f-found"]');
  await sleep(100);
  await page.click('[data-act="f-child"]');
  await sleep(100);
  const fam = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { fam: c.vk2.the.fam, kids: c.vk2.the.kids.length };
  });
  check("lập gia tộc và có con bằng nút", fam.fam === "Lý gia" && fam.kids === 1);
  await closeTab(page);
  // Game gốc vẫn chạy với tông do người chơi lập
  await protect(page);
  const yearBefore = await S(page, () => Math.floor(globalThis.__VK2._test.char().age));
  await runUntil(page, "Math.floor(c.age) >= x", yearBefore + 5);
  const after = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { age: Math.floor(c.age), sect: c.sect, world: globalThis.__VK2._test.acct().world.year };
  });
  check("game gốc chạy tiếp được với tông tự lập", after.age >= yearBefore + 5, `tuổi ${after.age}, ${after.sect}`);
  globalThis.__extraTabs = [...(globalThis.__extraTabs ?? []), ["mentor", "mentor"], ["mentor", "family"], ["mentor", "sect"], ["mentor", "people"]];
});

// ---------- Giai đoạn 5 ----------
section(async function phase5(page) {
  await settle(page);
  await protect(page, { realm: 5 });
  await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const P = globalThis.VK2Phap;
    P.ensure(c, a);
    c.vk2.dao.mastery.kiem_y = 80;
    P.wound(c, a, "phan", 30);
    c.stats.tamCanh = 95;
    a.world.crisis = { id: "linh_kiet", at: a.world.year, until: a.world.year + 60, score: 50, by: 0 };
  });
  await openTab(page, "law", "heart");
  let text = await bodyText(page);
  check("tab Tâm Ma hiện sổ chấp niệm và sức đối mặt", /Phản bội/.test(text) && /Sức đối mặt/.test(text));
  await openTab(page, "law", "law");
  text = await bodyText(page);
  check("tab Đại Đạo có đủ 13 pháp tắc", /Sinh Tử/.test(text) && /Không Gian/.test(text) && /Thời Gian/.test(text) && /Sáng Tạo/.test(text));
  await page.click('[data-act="law-toggle"][data-id="kiem"]');
  await sleep(100);
  check("chọn pháp tắc bằng nút", await S(page, () => globalThis.__VK2._test.char().vk2.phap.lawOn.includes("kiem")));
  await page.screenshot({ path: path.join(OUT, "v3-law.png") });
  await openTab(page, "law", "crisis");
  check("tab Đại Biến hiện biến cố đang diễn ra", /Linh Khí Suy Kiệt/.test(await bodyText(page)));
  await closeTab(page);
  // Tâm ma hoặc đại biến đi qua hàng đợi sự kiện của game, chờ cho tới khi cả hai đã qua
  const demonTrail = [];
  let sawDemon = false;
  let sawCrisis = false;
  // Game bỏ qua cú bấm ngay lúc popup vừa hiện, nên phải chờ tới khi lựa chọn có tác dụng, không chỉ tới khi thấy sự kiện.
  const resolved = () => S(page, () => { const p = globalThis.__VK2._test.char().vk2.phap; return p.faced >= 1 && p.crisisDone >= 1; });
  for (let i = 0; i < 160 && !(sawDemon && sawCrisis && (await resolved())); i++) {
    await protect(page);
    await S(page, () => {
      const c = globalThis.__VK2._test.char();
      c.stats.tamCanh = 95;
      c.vk2.evAt = -99; // Không chờ khoảng nghỉ giữa các sự kiện của mod, để lượt kiểm thử không quá dài
      c.linhThach = Math.max(c.linhThach ?? 0, 100000); // Nút góp bị khóa khi thiếu linh thạch
    });
    const title = await S(page, () => {
      const list = [...document.querySelectorAll(".choices .choice")].map((b) => b.textContent);
      return list.join("|");
    });
    const seen = await S(page, () => { const c = globalThis.__VK2._test.char(); return `${c.age}:${c.vk2.phap.demonAt}:${c.vk2.phap.faced}:${c.daoTam}`; });
    demonTrail.push(`${seen} ${title.slice(0, 40)}`);
    if (/Đối mặt/.test(title)) {
      sawDemon = true;
      await pickChoice(page, /Đối mặt/);
    } else if (/Xông pha trận đầu/.test(title)) {
      sawCrisis = true;
      await pickChoice(page, /Góp/);
    } else if (title) {
      await S(page, () => {
        const list = [...document.querySelectorAll(".choices .choice")].filter((b) => !b.classList.contains("off"));
        list[list.length - 1]?.click();
      });
    } else {
      await clearPopups(page);
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
    }
    await sleep(350);
  }
  await pause(page);
  const state = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    return { faced: c.vk2.phap.faced, done: c.vk2.phap.crisisDone };
  });
  check("tâm ma hiện trong game và đối mặt được qua lựa chọn", sawDemon && state.faced >= 1, `đã vượt ${state.faced}; ${demonTrail.slice(-25).join(" || ")}; ${JSON.stringify(await S(page, () => { const c = globalThis.__VK2._test.char(); return { age: c.age, w: c.vk2.phap.wounds, at: c.vk2.phap.demonAt, ev: c.vk2.evAt, tm: c.stats.tamMa, tc: c.stats.tamCanh, dead: c.dead }; }))}`);
  check("đại biến hỏi người chơi trong game, đóng góp được tính", sawCrisis && state.done >= 1, `góp ${state.done}`);
  globalThis.__extraTabs = [...(globalThis.__extraTabs ?? []), ["law", "heart"], ["law", "law"], ["law", "crisis"]];
});

// ---------- Hệ thống sự kiện động ----------
section(async function phaseSu(page) {
  await settle(page);
  await protect(page);
  // Một chuỗi thật được mở trong thế giới, giai đoạn đầu của nó phải tới được người chơi qua hàng đợi của game
  const uid = await S(page, () => {
    const a = globalThis.__VK2._test.acct();
    const c = globalThis.__VK2._test.char();
    const Su = globalThis.VK2Su;
    Su.ensure(c, a);
    a.world.chains = [];
    c.realm = Math.max(c.realm ?? 0, 3);
    c.focus = "du_ngoan";
    return Su.startChain(a.world, "yeu_hoang").uid;
  });
  const state = () => S(page, () => { const c = globalThis.__VK2._test.char(); const su = c.vk2.su; return { pend: su.pend?.rid ?? null, resolved: su.resolved, join: Object.keys(su.chains).length, j: su.j.length, age: c.age }; });
  const shown = () => S(page, () => [...document.querySelectorAll(".choices .choice")].filter((b) => b.offsetParent !== null).map((b) => b.textContent).join("|"));
  let seenRid = null;
  let seenPopup = "";
  for (let i = 0; i < 120 && !seenRid; i++) {
    await protect(page);
    // Giữ chuỗi ở giai đoạn đầu cho tới khi người chơi được hỏi, vì thế giới vẫn chạy trong lúc chờ
    await S(page, (u) => { const c = globalThis.__VK2._test.char(); const a = globalThis.__VK2._test.acct(); c.vk2.evAt = -99; c.focus = "du_ngoan"; c.linhThach = Math.max(c.linhThach ?? 0, 100000); const inst = a.world.chains.find((x) => x.uid === u); if (inst) inst.until = a.world.year + 20; }, uid);
    const now = await state();
    const list = await shown();
    if (now.pend?.startsWith(`vk2_su_ch_${uid}_`) && list) {
      seenRid = now.pend;
      break;
    }
    if (list) await S(page, () => { const l = [...document.querySelectorAll(".choices .choice")].filter((b) => !b.classList.contains("off")); l[l.length - 1]?.click(); });
    else {
      await clearPopups(page);
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
    }
    await sleep(300);
  }
  await pause(page);
  check("sự kiện động hiện trong game qua hàng đợi", !!seenRid, seenRid ?? "");
  // Lưu và tải lại khi sự kiện đang chờ: không mất, không thành sự kiện khác
  await S(page, () => globalThis.dispatchEvent(new Event("pagehide")));
  await sleep(150);
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await sleep(800);
  const after = await state();
  check("tải lại trang giữ nguyên sự kiện đang chờ", after.pend === seenRid, `${seenRid} -> ${after.pend}`);
  let list = "";
  for (let i = 0; i < 20 && !list; i++) {
    await S(page, () => {
      const comic = document.querySelector(".cn-wrap .cn-skip");
      if (comic && comic.offsetParent) comic.click();
      const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu/.test(b.textContent) && b.offsetParent);
      hint?.click();
    });
    list = await shown();
    if (!list) await sleep(200);
  }
  check("sau khi tải lại vẫn thấy đúng lựa chọn", list.length > 0, list.slice(0, 60));
  seenPopup = await S(page, () => document.body.innerText);
  check("popup sự kiện có tên, độ hiếm và lựa chọn", /Đàn thú rời rừng/.test(seenPopup) && /Sử Thi/.test(seenPopup), seenPopup.slice(0, 80));
  await page.screenshot({ path: path.join(OUT, "v3-su-event.png") });
  // Bấm thật, chờ qua trạng thái khóa của game, và hậu quả chỉ tính một lần
  const before = await state();
  for (let i = 0; i < 25 && (await state()).resolved === before.resolved; i++) {
    await S(page, () => { const l = [...document.querySelectorAll(".choices .choice")].filter((b) => !b.classList.contains("off")); l[0]?.click(); });
    await sleep(250);
  }
  const done = await state();
  check("lựa chọn có tác dụng đúng một lần", done.resolved === before.resolved + 1 && done.pend === null, JSON.stringify(done));
  check("người chơi được ghi là đã can dự vào chuỗi", done.join >= 1, `${done.join}`);
  await clearPopups(page);
  await openTab(page, "journey", "chronicle");
  const text = await bodyText(page);
  check("tab Thiên Hạ Ký Sự có đủ các mục", ["Đang diễn ra", "Nhân quả chưa giải", "Nhân vật liên quan", "Biến cố thế giới", "Đã kết thúc", "Lựa chọn của bạn"].every((x) => text.includes(x)));
  check("Ký Sự hiện chuỗi đang chạy và lựa chọn vừa làm", /Yêu Hoàng Xuống Núi/.test(text) && /bạn đã can dự/.test(text));
  await page.screenshot({ path: path.join(OUT, "v3-chronicle.png") });
  await closeTab(page);
  await openTab(page, "quests");
  check("nhiệm vụ sự kiện có trong bảng nhiệm vụ", /Trải qua 5 biến cố/.test(await bodyText(page)));
  await closeTab(page);
  // Tiên giới có lối sự kiện riêng: phải tới được người chơi qua vòng năm thật của game
  const realmBefore = await S(page, () => { const c = globalThis.__VK2._test.char(); const r = c.realm; c.cosmos = "tien"; c.realm = 8; return r; });
  let cosmosRid = null;
  const cosmosTrail = [];
  for (let i = 0; i < 150 && !cosmosRid; i++) {
    await protect(page);
    await S(page, () => { const c = globalThis.__VK2._test.char(); c.vk2.evAt = -99; c.cosmos = "tien"; });
    const now = await state();
    const l = await shown();
    cosmosTrail.push(await S(page, () => { const c = globalThis.__VK2._test.char(); const a = globalThis.__VK2._test.acct(); return `${Math.floor(c.age)} pend=${c.vk2.su.pend?.rid ?? "-"} n=${globalThis.VK2Su.eligible(c, a).length} cos=${c.cosmos} dead=${c.dead}`; }) + ` ${l.slice(0, 30)}`);
    if (now.pend && l && /vk2_su_(tm_cuu_thien|tm_ha_pham|tn_)/.test(now.pend)) {
      cosmosRid = now.pend;
      break;
    }
    if (l) await S(page, () => { const b = [...document.querySelectorAll(".choices .choice")].filter((x) => !x.classList.contains("off")); b[b.length - 1]?.click(); });
    else {
      await clearPopups(page);
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "16×")?.click());
      await S(page, () => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "▶")?.click());
    }
    await sleep(300);
  }
  await pause(page);
  check("sự kiện Tiên giới hiện trong vòng năm thật", !!cosmosRid, `${cosmosRid ?? ""} ${cosmosTrail.slice(-6).join(" | ")}`);
  const r0 = (await state()).resolved;
  for (let i = 0; i < 25 && cosmosRid && (await state()).resolved === r0; i++) {
    await S(page, () => { const b = [...document.querySelectorAll(".choices .choice")].filter((x) => !x.classList.contains("off")); b[0]?.click(); });
    await sleep(250);
  }
  await S(page, (r) => { const c = globalThis.__VK2._test.char(); delete c.cosmos; c.realm = r; }, realmBefore);
  await settle(page);
  globalThis.__extraTabs = [...(globalThis.__extraTabs ?? []), ["journey", "chronicle"]];
});

// ---------- Giai đoạn 6 ----------
section(async function phase6(page) {
  await settle(page);
  await protect(page);
  await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const M = globalThis.VK2Menh;
    M.ensure(c, a);
    M.note(c, a, "thien", 60);
    if (!c.vk2.menh.fate) M.setFate(c, a, "dan_su");
  });
  await openTab(page, "law", "destiny");
  let text = await bodyText(page);
  check("tab Thiên Mệnh hiện mệnh, đánh đổi, sổ, quy tắc", /Đánh đổi/.test(text) && /Sổ Thiên Đạo/.test(text) && /Quy tắc/.test(text));
  await page.screenshot({ path: path.join(OUT, "v3-destiny.png") });
  await openTab(page, "law", "karma");
  text = await bodyText(page);
  check("tab Nhân Quả đọc Phúc duyên, Kiếp số, Hồn lực và các đời trước", /Phúc duyên/.test(text) && /Kiếp số/.test(text) && /Hồn lực/.test(text) && /Các đời trước/.test(text));
  await openTab(page, "quests");
  check("nhiệm vụ Thiên Mệnh hiện trong bảng nhiệm vụ", /Thiên Mệnh|Đan Sư|Nghịch Thiên|Cô Tinh|Chi Tử|di sản/.test(await bodyText(page)));
  await closeTab(page);
  // Lưu giữa kiếp, rồi chết thật qua vòng lặp gốc và sang kiếp sau: di sản phải còn
  const saved = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    return JSON.stringify({ khi: c.vk2.khi.items.length, the: c.vk2.the.disciples.length, fate: c.vk2.menh.fate?.id, npcs: a.world.npcs.length, year: a.world.year });
  });
  await S(page, () => globalThis.dispatchEvent(new Event("pagehide")));
  await sleep(150);
  await page.reload({ waitUntil: "load" });
  await enterGame(page);
  await sleep(500);
  await clearPopups(page);
  const loaded = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    return JSON.stringify({ khi: c.vk2.khi.items.length, the: c.vk2.the.disciples.length, fate: c.vk2.menh.fate?.id, npcs: a.world.npcs.length, year: a.world.year });
  });
  const pa = JSON.parse(saved);
  const pb = JSON.parse(loaded);
  check("tải lại trang giữ pháp bảo, đồ đệ, Thiên Mệnh, thế giới", pa.khi === pb.khi && pa.the === pb.the && pa.fate === pb.fate && pb.year >= pa.year - 60 && pb.npcs > 0, loaded);
  // Sang kiếp mới bằng dữ liệu kiếp đang chơi: dùng đúng hàm ghi nhận cái chết của mod
  const prev = await S(page, () => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    const core = globalThis.__VK2._test.core;
    c.vk2.dao.mastery.kiem_y = 70;
    c.vk2.dao.mastery.loi_phap = 70;
    c.age += 30;
    globalThis.VK2Dao.createArt(c, a, "loi_kiem", "Kiếm Của Tiền Kiếp");
    const clone = JSON.parse(JSON.stringify(c));
    clone.dead = true;
    clone.cause = "kiểm thử";
    clone.lifeNo = (clone.lifeNo ?? 1) + 0;
    a.seenDead = (clone.lifeNo ?? 1) - 1;
    core.recordDeath ? core.recordDeath(clone, a) : core.tick(clone, a, 0);
    return { items: a.legacy?.items.length ?? 0, hist: a.history.length, legacy: Object.keys(a.history.at(-1)?.legacy ?? {}) };
  });
  check("cái chết ghi di sản vào tài khoản", prev.items >= 1 && prev.legacy.includes("menh") && prev.legacy.includes("the"), JSON.stringify(prev));
});

/** Sự kiện gốc có thể giết nhân vật giữa chừng, khi đó cả lượt không còn ý nghĩa và được chạy lại từ đầu với tài khoản mới. */
async function attempt() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
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
    await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
    check("vào được game", await enterGame(page));
    await clearPopups(page);
    for (const fn of SECTIONS) await fn(page);
    await page.setViewportSize({ width: 360, height: 700 });
    await settle(page);
    for (const [g, t] of [["can", "art"], ["realm", "realm"], ["realm", "inherit"], ...globalThis.__extraTabs ?? []]) {
      await openTab(page, g, t);
      const over = await S(page, () => document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector(".vk2-sheet").scrollWidth > document.querySelector(".vk2-sheet").clientWidth + 1);
      check(`360px không tràn ngang: ${t}`, !over);
    }
    await closeTab(page);
    check("không gọi ra ngoài sandbox", outbound.length === 0, outbound[0] ?? "");
    check("không có lỗi JS hoặc lỗi mod", errors.length === 0, errors[0] ?? "");
  } finally {
    await browser.close();
  }
}

(async () => {
  for (let i = 1; i <= 4; i++) {
    results.length = 0;
    globalThis.__extraTabs = [];
    try {
      await attempt();
      break;
    } catch (e) {
      const died = /of null|reading 'vk2'|reading 'stats'|Timeout/.test(String(e.message));
      if (!died || i === 4) throw e;
      console.log(`\n--- Lượt ${i} dừng vì nhân vật chết hoặc màn hình đổi giữa chừng (${String(e.message).split("\n")[0].slice(0, 90)}), chạy lại ---\n`);
    }
  }
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} đạt`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  console.log("\nTest dừng giữa chừng, KHÔNG có kết quả.");
  process.exit(2);
});
