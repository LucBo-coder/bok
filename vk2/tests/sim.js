// Mô phỏng nhiều kiếp bằng logic thật của game: hàm một năm (O.f), hàm áp lựa chọn (O.x), hàm tạo nhân vật (O.n).
// Có đối chứng: cùng số kiếp nhưng tắt căn cơ, để đo căn cơ làm lệch nhịp game bao nhiêu.
//
// Cần server: `python serve_mod.py`, Edge đã cài.
// Dùng: NODE_PATH=<thư mục có playwright-core> node vk2/tests/sim.js [số kiếp mỗi cấu hình]
//
// Không mô phỏng: trận đấu thời gian thực trong component (săn quái, phục kích), mini-game đỡ lôi, phúc duyên mua lúc đầu thai.
// Số trận thắng vì vậy thấp hơn chơi thật, nên các thể chất cần nhiều trận gần như không thức tỉnh ở đây.
const { chromium } = require("playwright-core");

const BASE = process.env.VK2_URL || "http://127.0.0.1:8766";
const LIVES = Number(process.argv[2] || 100);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONFIGS = [
  { name: "tu Cân bằng", method: "can", focus: "tu_luyen", choice: "safe" },
  { name: "tu Ổn định", method: "on", focus: "tu_luyen", choice: "safe" },
  { name: "tu Cưỡng ép", method: "cuong", focus: "tu_luyen", choice: "safe" },
  { name: "xoay trọng tâm", method: "can", focus: "rotate", choice: "random" },
  { name: "tà đạo liều lĩnh", method: "cuong", focus: "tu_luyen", choice: "evil" },
  { name: "luyện đan", method: "on", focus: "luyen_dan", choice: "safe" },
];

/** Chạy trong trang: không dùng dữ liệu nào ngoài API thật của bundle và mod. */
async function runInPage({ cfg, lives, baseline, seed }) {
  const T = globalThis.__VK2._test;
  const O = T.game();
  const K = T.can;
  const C = T.core;
  const hook = globalThis.__VK2;
  if (baseline) {
    // Tắt riêng phần căn cơ: thay các hàm tính bằng giá trị trung tính, giữ nguyên VK2 2.0.
    K.__off = { fx: K.fx, cultFactor: K.cultFactor, insight: K.insight, onYear: K.onYear, tick: K.tick };
    K.fx = () => [];
    K.cultFactor = () => 1;
    K.insight = () => 1;
    K.onYear = () => [];
    K.tick = () => [];
  }
  let s = seed >>> 0;
  const rng = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const meta = { lives: 0, talents: [], nghiep: 0, huyetMach: [], phucDuyen: 0 };
  const acct = C.newAcct();
  const out = { lives: 0, realms: {}, ages: [], lifespans: [], stuck: 0, errors: [], bad: [], causes: {}, bodies: {}, dao: {}, dan: {}, method: cfg.method, chosenForge: 0, firstOpen3: [], ageR2: [], ageR3: [], ageR4: [], ageR5: [], maxYears: 0, breakFails: 0 };
  const focuses = ["tu_luyen", "du_ngoan", "kiem_tien", "luyen_dan", "tu_luyen", "ket_duyen"];

  const pick = (ev, c) => {
    const list = typeof ev.choices === "function" ? ev.choices(c) : ev.choices;
    if (!list?.length) return -1;
    const idx = list.map((x, i) => [x, i]).filter(([x]) => !x.when || x.when(c));
    const by = (lean) => idx.find(([x]) => x.lean === lean);
    // Người chơi tới được bước đột phá thì thường sẽ thử. "Củng cố" chỉ hoãn, chọn mãi sẽ kẹt nhân vật ở một cảnh giới.
    if (ev.id === "__dot_pha" && cfg.choice !== "random") {
      const tryIt = idx.filter(([x]) => !/Củng cố|Consolidate|Chưa|Thôi/i.test(String(x.label)));
      if (tryIt.length) return (cfg.choice === "evil" ? (tryIt.find(([x]) => x.lean === "ta") ?? tryIt[0]) : tryIt[0])[1];
    }
    if (ev.id !== "__dot_pha" && /con đường tu tập|cultivation path/i.test(String(ev.title))) return idx[Math.floor(rng() * idx.length)][1];
    if (cfg.choice === "evil") return (by("ta") ?? idx[0])[1];
    if (cfg.choice === "random") return idx[Math.floor(rng() * idx.length)][1];
    return (by("chinh") ?? idx.find(([x]) => x.lean !== "ta") ?? idx[0])[1];
  };

  for (let life = 0; life < lives; life++) {
    meta.lives = life;
    acct.lives = life;
    const c = O.n(meta, [], undefined);
    K.ensure?.(c, acct);
    if (!baseline) K.setMethod(c, acct, cfg.method);
    const ctxLog = [];
    let safety = 0;
    let lastFail = "";
    const seenRealm = {};
    let yearsThisLife = 0;
    let done = false;
    try {
      while (!c.dead && safety < 8000) {
        safety++;
        c.age = Math.floor(c.age) + 1;
        yearsThisLife++;
        const age = c.age;
        if (cfg.focus === "rotate") c.focus = focuses[Math.floor(age / 7) % focuses.length];
        else c.focus = age >= 12 || cfg.focus === "tu_luyen" ? cfg.focus : "tu_luyen";
        const ctx = O.v(c, ctxLog);
        let ev = O.f(c, ctx, { talents: [] });
        K.tick(c, acct);
        let chain = 0;
        while (ev && !c.dead) {
          if (++chain > 40) {
            out.stuck++;
            out.bad.push(`chuỗi sự kiện không dứt: ${ev.id}`);
            break;
          }
          const i = pick(ev, c);
          if (i < 0) break;
          ev = O.x(c, ev, i, O.v(c, ctxLog), []);
          K.tick(c, acct);
        }
        // Người chơi có chủ đích thì chọn cách đúc; cấu hình "random" để mặc cho quá hạn.
        if (!baseline && c.vk2?.can?.pending) {
          const kind = c.vk2.can.pending.kind;
          if (cfg.choice !== "random") {
            const opt = K.forgeOptions(c, kind).find((o) => o.ok && o.id === "linh_thach") ? "linh_thach" : "tu_nhien";
            if (K.forge(c, kind, opt)) out.chosenForge++;
          }
        }
        for (const [r, list] of [[2, out.ageR2], [3, out.ageR3], [4, out.ageR4], [5, out.ageR5]]) {
          if ((c.realm ?? 0) >= r && !seenRealm[r]) {
            seenRealm[r] = 1;
            list.push(age);
          }
        }
        if (!baseline && (c.vk2?.can?.open ?? 0) >= 3 && !c.__o3) {
          c.__o3 = 1;
          out.firstOpen3.push(age);
        }
        const f = c.breakFail ? `${c.breakFail.r}:${c.breakFail.n}` : "";
        if (f && f !== lastFail) out.breakFails++;
        lastFail = f;
        ctxLog.length = 0;
        // Bất biến: mod không được đẩy giá trị ra ngoài miền hợp lệ.
        if (!baseline) {
          const can = c.vk2.can;
          for (const k of ["purity", "stability", "injury", "impurity"]) {
            if (!(can[k] >= 0 && can[k] <= 100)) out.bad.push(`${k}=${can[k]} tuổi ${age}`);
          }
          if (!(can.open >= 0 && can.open <= K.MERIDIANS.total)) out.bad.push(`open=${can.open}`);
          if (!Number.isFinite(C.cultMul(c))) out.bad.push(`cultMul không hợp lệ tuổi ${age}`);
          if (!K.bodyDef.has(can.body.id)) out.bad.push(`thể chất lạ ${can.body.id}`);
          if (can.pending && age - can.pending.at > K.PENDING_YEARS + 1) out.bad.push(`việc đúc bị kẹt tuổi ${age}`);
          if ((c.realm ?? 0) >= 4 && !can.daoCo) out.bad.push("Nguyên Anh mà chưa có đạo cơ");
        }
      }
      done = !!c.dead;
    } catch (err) {
      out.errors.push(`${err.message} @ tuổi ${c.age}`);
    }
    if (!done && safety >= 8000) {
      out.stuck++;
      out.bad.push(`không kết thúc sau ${safety} năm`);
    }
    out.lives++;
    const r = c.realm ?? 0;
    out.realms[r] = (out.realms[r] ?? 0) + 1;
    out.ages.push(Math.floor(c.age));
    out.lifespans.push(c.lifespan);
    out.maxYears = Math.max(out.maxYears, yearsThisLife);
    const cause = String(c.cause ?? "?").slice(0, 48);
    out.causes[cause] = (out.causes[cause] ?? 0) + 1;
    if (!baseline) {
      const can = c.vk2.can;
      out.bodies[can.body.id] = (out.bodies[can.body.id] ?? 0) + 1;
      if (can.daoCo) out.dao[can.daoCo.grade] = (out.dao[can.daoCo.grade] ?? 0) + 1;
      if (can.kimDan) out.dan[can.kimDan.grade] = (out.dan[can.kimDan.grade] ?? 0) + 1;
    }
  }
  if (baseline) Object.assign(K, K.__off);
  out.bad = [...new Set(out.bad)].slice(0, 12);
  out.errors = [...new Set(out.errors)].slice(0, 12);
  return out;
}

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const pct = (obj, n) => Object.entries(obj).sort((a, b) => a[0] - b[0]).map(([k, x]) => `${k}:${Math.round((x / n) * 100)}%`).join(" ");
const high = (r, min) => Math.round((Object.entries(r.realms).filter(([k]) => Number(k) >= min).reduce((s, [, x]) => s + x, 0) / r.lives) * 100);

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(`${BASE}/choi/`, { waitUntil: "load" });
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => !!globalThis.__VK2?._test?.game?.())) break;
    await page.evaluate(() => {
      const wanted = /Đầu thai|Bắt đầu|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp|Hiểu rồi|Ngẫu nhiên|Đồng ý/i;
      [...document.querySelectorAll("button, a")].find((b) => wanted.test(b.textContent || "") && b.offsetParent !== null)?.click();
    });
    await sleep(600);
  }
  if (!(await page.evaluate(() => !!globalThis.__VK2?._test?.game?.()))) throw new Error("Không vào được game");
  await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "❚❚")?.click());

  let totalBad = 0;
  let totalLives = 0;
  for (const [i, cfg] of CONFIGS.entries()) {
    const seed = 1000 + i * 77;
    const r = await page.evaluate(runInPage, { cfg, lives: LIVES, baseline: false, seed });
    const b = await page.evaluate(runInPage, { cfg, lives: LIVES, baseline: true, seed });
    totalBad += r.bad.length + r.errors.length + r.stuck;
    totalLives += r.lives + b.lives;
    console.log(`\n=== ${cfg.name} (${r.lives} kiếp, đối chứng ${b.lives})`);
    console.log(`  cảnh giới      : ${pct(r.realms, r.lives)}`);
    console.log(`  đối chứng      : ${pct(b.realms, b.lives)}`);
    console.log(`  ≥Trúc Cơ/≥Kim Đan/≥Nguyên Anh/≥Hóa Thần: ${high(r, 2)}/${high(r, 3)}/${high(r, 4)}/${high(r, 5)}%   đối chứng ${high(b, 2)}/${high(b, 3)}/${high(b, 4)}/${high(b, 5)}%`);
    console.log(`  tuổi thọ TB    : ${avg(r.ages)} (đối chứng ${avg(b.ages)}), thất bại đột phá ${r.breakFails} (đối chứng ${b.breakFails})`);
    console.log(`  tuổi vào Trúc Cơ/Kim Đan/Nguyên Anh/Hóa Thần: ${avg(r.ageR2)}/${avg(r.ageR3)}/${avg(r.ageR4)}/${avg(r.ageR5)} (đối chứng ${avg(b.ageR2)}/${avg(b.ageR3)}/${avg(b.ageR4)}/${avg(b.ageR5)})`);
    console.log(`  3 kinh mạch đầu: TB tuổi ${avg(r.firstOpen3)} (${r.firstOpen3.length} kiếp đạt)`);
    console.log(`  thể chất       : ${JSON.stringify(r.bodies)}`);
    console.log(`  đạo cơ/Kim Đan : ${pct(r.dao, r.lives)} | ${pct(r.dan, r.lives)} (chủ động đúc ${r.chosenForge})`);
    console.log(`  chết nhiều nhất: ${Object.entries(r.causes).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, x]) => `${x}× ${k}`).join(" | ")}`);
    if (r.errors.length) console.log(`  LỖI: ${r.errors.join(" || ")}`);
    if (b.errors.length) console.log(`  LỖI đối chứng: ${b.errors.join(" || ")}`);
    if (r.bad.length) console.log(`  VI PHẠM: ${r.bad.join(" || ")}`);
    if (r.stuck) console.log(`  KẸT: ${r.stuck}`);
  }
  console.log(`\nTổng: ${totalLives} kiếp, ${totalBad} lỗi hoặc vi phạm bất biến, ${pageErrors.length} lỗi trang`);
  if (pageErrors.length) console.log([...new Set(pageErrors)].slice(0, 8).join("\n"));
  await browser.close();
  process.exit(totalBad || pageErrors.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
