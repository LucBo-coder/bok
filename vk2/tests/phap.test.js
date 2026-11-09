// Kiểm thử logic Giai đoạn 5: tâm ma, pháp tắc, đại sự kiện.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
require("../dao.js");
require("../khi.js");
require("../the.js");
require("../phap.js");
const C = globalThis.VK2Core;
const P = globalThis.VK2Phap;
const H = globalThis.VK2The;
const G = globalThis.VK2Dao;

function mk(over = {}) {
  const c = { age: 0, name: "A", lifeNo: 1, realm: 4, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 11, path: "kiem", sect: null, focus: "tu_luyen", linhThach: 50000, pills: {}, lifespan: 600, stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 5, sucKhoe: 90 }, daoTam: 0, dead: false, log: [], ...over };
  const a = C.newAcct();
  H.ensure(c, a);
  G.ensure(c, a);
  P.ensure(c, a);
  c.age = over.age ?? 60;
  c.vk2.the.year = c.age;
  c.vk2.dao.year = c.age;
  c.vk2.phap.year = c.age;
  return [c, a];
}
const year = (c, a, n = 1) => {
  for (let i = 0; i < n; i++) {
    c.age = Math.floor(c.age) + 1;
    C.onYear(c, a, {});
    C.tick(c, a, 0);
  }
};

test("đủ 7 nguồn tâm ma và có trần", () => {
  const [c, a] = mk();
  assert.equal(Object.keys(P.WOUNDS).length, 7);
  P.wound(c, a, "sat", 500);
  assert.equal(c.vk2.phap.wounds.sat, P.WOUND_MAX);
  P.wound(c, a, "khong_co", 5);
  assert.equal(c.vk2.phap.wounds.khong_co, undefined);
});

test("nguồn vết thương lấy từ dữ liệu thật: thất bại đột phá, mất đạo lữ, kẻ thù", () => {
  const [c, a] = mk();
  year(c, a);
  c.breakFail = { r: 4, n: 1 };
  year(c, a);
  assert.equal(c.vk2.phap.wounds.bai, 4);
  year(c, a);
  assert.equal(c.vk2.phap.wounds.bai, 4, "không tính lặp cùng một lần thất bại");
  c.partner = "Vân";
  year(c, a);
  assert.equal(c.vk2.phap.wounds.mat ?? 0, 0);
  c.partner = null;
  year(c, a);
  assert.equal(c.vk2.phap.wounds.mat, 10);
  c.enemy = "kẻ nào đó";
  year(c, a);
  assert.equal(c.vk2.phap.wounds.thu, 6);
});

test("tâm ma chỉ hiện khi đủ vết thương, không theo xác suất, và có khoảng cách", () => {
  const [c, a] = mk();
  assert.equal(P.nextEvent(c, a), null);
  P.wound(c, a, "sat", P.DEMON_AT);
  const ev = P.nextEvent(c, a);
  assert.equal(ev.id, "vk2_phap_demon");
  assert.equal(P.nextEvent(c, a), null, "có khoảng cách");
  assert.equal(c.vk2.phap.evKind, "sat");
});

test("đối mặt: kết quả xác định từ con số người chơi thấy được", () => {
  const [c, a] = mk();
  P.wound(c, a, "sat", 10);
  c.stats.tamCanh = 90;
  const p = c.vk2.phap;
  p.evKind = "sat";
  const score = P.faceScore(c, p, "sat");
  assert.ok(score >= P.FACE_NEED);
  P.demonDef(c, a).choices(c)[0].run(c);
  assert.equal(p.wounds.sat, 0);
  assert.equal(p.faced, 1);

  const [w, b] = mk();
  P.wound(w, b, "sat", 30);
  w.stats.tamCanh = 10;
  w.stats.tamMa = 40;
  const q = w.vk2.phap;
  q.evKind = "sat";
  assert.ok(P.faceScore(w, q, "sat") < P.FACE_NEED);
  const hp = w.stats.sucKhoe;
  P.demonDef(w, b).choices(w)[0].run(w);
  assert.equal(q.wounds.sat, 35, "thất bại thì nặng hơn");
  assert.ok(w.stats.sucKhoe < hp);
  assert.equal(q.faced, 0);
});

test("phong ấn là món nợ: giảm vết thương bây giờ, đột phá khó về sau", () => {
  const [c, a] = mk();
  P.wound(c, a, "mat", 30);
  c.vk2.phap.evKind = "mat";
  const b0 = C.breakBonus(c);
  P.demonDef(c, a).choices(c)[1].run(c);
  assert.equal(c.vk2.phap.wounds.mat, 15);
  assert.equal(c.vk2.phap.sealed, 15);
  assert.ok(C.breakBonus(c) < b0);
});

test("phong ấn bật lại khi đột phá thất bại", () => {
  const [c, a] = mk();
  c.vk2.phap.sealed = 30;
  const tm = c.stats.tamMa;
  year(c, a);
  c.breakFail = { r: 4, n: 2 };
  year(c, a);
  assert.ok(c.stats.tamMa > tm);
  assert.equal(c.vk2.phap.sealed, 18);
});

test("thuận theo: cho sức mạnh thật, có giới hạn, tâm ma tăng", () => {
  const [c, a] = mk();
  P.wound(c, a, "thu", 20);
  c.vk2.phap.evKind = "thu";
  const atk = C.totals(c).atk;
  const tm = c.stats.tamMa;
  P.demonDef(c, a).choices(c)[2].run(c);
  assert.ok(C.totals(c).atk > atk);
  assert.ok(c.stats.tamMa > tm);
  c.vk2.phap.gaveIn = 100;
  assert.ok(P.fx(c).find((x) => x.atk).atk <= 0.1);
});

test("đủ 13 pháp tắc và 6 bậc; mở từ cảnh giới cao", () => {
  assert.equal(Object.keys(P.LAWS).length, 13);
  assert.equal(P.TIERS.length, 6);
  const [c, a] = mk({ realm: 3 });
  c.vk2.dao.mastery.kiem_y = 80;
  assert.equal(P.toggleLaw(c, a, "kiem"), false, "chưa đủ cảnh giới");
  c.realm = 4;
  assert.equal(P.toggleLaw(c, a, "kiem"), true);
  assert.equal(P.toggleLaw(c, a, "sinh_tu"), false, "chưa có đạo niệm nguồn");
});

test("chỉ tu được 2 pháp tắc cùng lúc", () => {
  const [c, a] = mk();
  for (const k of Object.keys(G.CONCEPTS)) c.vk2.dao.mastery[k] = 80;
  assert.equal(P.toggleLaw(c, a, "kiem"), true);
  assert.equal(P.toggleLaw(c, a, "hoa"), true);
  assert.equal(P.toggleLaw(c, a, "kim"), false);
  assert.equal(P.toggleLaw(c, a, "hoa"), true, "tắt được");
  assert.equal(P.toggleLaw(c, a, "kim"), true);
});

test("pháp tắc tiến theo năm tu, nhanh hơn với đạo niệm cao, không tiến khi không tu", () => {
  const prog = (src, focus) => {
    const [c, a] = mk();
    c.vk2.dao.mastery.kiem_y = src;
    P.toggleLaw(c, a, "kiem");
    c.focus = focus;
    year(c, a, 30);
    return c.vk2.phap.laws.kiem ?? 0;
  };
  assert.ok(prog(90, "tu_luyen") > prog(40, "tu_luyen"));
  assert.equal(prog(90, "du_ngoan"), 0);
});

test("mỗi pháp tắc đổi cơ chế: duel, cứu mạng, rút lui, thọ nguyên", () => {
  const [c, a] = mk();
  const atTier = (t) => P.TIER_XP.slice(0, t).reduce((s, x) => s + x, 0);
  const p = c.vk2.phap;
  p.laws.kiem = atTier(1);
  assert.equal(P.lawTier(p, "kiem"), 1);
  assert.ok(C.duelMods(c).extra >= 0.06);
  p.laws.tho = atTier(2);
  assert.ok(C.duelMods(c).shield >= 0.1);

  assert.equal(P.lawMech(c, "khongGian"), false);
  p.laws.khong_gian = atTier(2);
  assert.equal(P.lawMech(c, "khongGian"), true);

  const life0 = c.lifespan;
  p.laws.thoi_gian = atTier(1);
  const cult0 = C.cultMul(c);
  year(c, a);
  assert.equal(c.lifespan, life0 + 30);
  year(c, a);
  assert.equal(c.lifespan, life0 + 30, "không cộng mỗi năm");
  assert.ok(P.fx(c).some((x) => x.cult < 0), "thời gian có cái giá");
  assert.ok(Number.isFinite(cult0));

  p.laws.sinh_tu = atTier(1);
  c.stats.sucKhoe = 5;
  year(c, a);
  assert.ok(c.stats.sucKhoe > 5);
  const saved = p.lifeSaveAt;
  c.stats.sucKhoe = 5;
  year(c, a);
  assert.equal(p.lifeSaveAt, saved, "có thời gian hồi");
});

test("Không Gian: rút lui khỏi bí cảnh không mất máu kể cả không có phù", () => {
  const [c, a] = mk();
  c.vk2.phap.laws.khong_gian = P.TIER_XP[0] + P.TIER_XP[1];
  c.vk2.dao.open.push({ id: "dong_phu", until: 9999, seed: 3 });
  assert.equal(G.enter(c, a, "dong_phu"), true);
  c.vk2.dao.run.floor = 2;
  const hp = c.stats.sucKhoe;
  const def = G.chain(c, a);
  def.choices(c, 0).at(-1).run(c, { fx() {} });
  assert.ok(c.stats.sucKhoe >= hp);
});

test("Hủy Diệt mạnh hơn nhưng tổn thương chính mình", () => {
  const [c, a] = mk();
  const p = c.vk2.phap;
  p.laws.huy_diet = P.TIER_XP[0];
  assert.ok(C.duelMods(c).pierce > 0);
  C.onYear(c, a, {});
  c.vk2.can = c.vk2.can ?? { injury: 0, impurity: 0, stability: 50, purity: 0, dantian: 10, open: 0, method: "can", body: { id: "pham", xp: 0 }, year: 999 };
  const inj = c.vk2.can.injury;
  year(c, a, 10);
  assert.ok(c.vk2.can.injury > inj);
});

test("đủ 8 đại sự kiện, mỗi cái kéo dài nhiều năm và có hai kết cục", () => {
  assert.equal(Object.keys(P.CRISES).length, 8);
  for (const d of Object.values(P.CRISES)) {
    assert.ok(d.years >= 15);
    assert.ok(d.good && d.bad);
  }
});

test("đại sự kiện tự xuất hiện theo thời gian, có khoảng cách, tự kết thúc", () => {
  const [, a] = mk();
  const w = a.world;
  let seen = 0;
  let last = null;
  for (let i = 0; i < 1500; i++) {
    H.step(w);
    P.crisisStep(w);
    if (w.crisis && w.crisis !== last) {
      seen++;
      last = w.crisis;
    }
  }
  assert.ok(seen >= 2, `${seen}`);
  assert.ok((w.crisisPast ?? []).length >= 1);
  for (let i = 1; i < w.crisisPast.length; i++) assert.ok(w.crisisPast[i].y - w.crisisPast[i - 1].y >= P.CRISIS_GAP);
});

test("hành động của người chơi đổi được kết cục", () => {
  const run = (help) => {
    const [c, a] = mk({ linhThach: 99999 });
    const w = a.world;
    w.crisis = { id: "linh_kiet", at: w.year, until: w.year + 4, score: 45, by: 0 };
    for (const s of Object.values(w.sects)) s.vein = 3;
    if (help) {
      const def = P.crisisDef(c, a);
      def.choices(c, 0)[1].run(c);
      def.choices(c, 0)[1].run(c);
    }
    for (let i = 0; i < 10; i++) {
      w.year++;
      P.crisisStep(w);
    }
    return { past: w.crisisPast[0], vein: Object.values(w.sects)[0].vein };
  };
  const yes = run(true);
  const no = run(false);
  assert.equal(yes.past.ok, true);
  assert.equal(no.past.ok, false);
  assert.ok(yes.vein > no.vein, "kết cục đổi thật thế giới");
});

test("đại sự kiện có hiệu ứng trong lúc diễn ra và hết sau đó", () => {
  const [c, a] = mk();
  const before = C.cultMul(c);
  a.world.crisis = { id: "linh_kiet", at: a.world.year, until: a.world.year + 50, score: 50, by: 0 };
  year(c, a);
  assert.ok(C.cultMul(c) < before);
  a.world.crisis = null;
  a.world.crisisAt = a.world.year;
  year(c, a);
  assert.equal(c.vk2.phap.crisisCult, 0);
});

test("sự kiện đại biến chỉ hỏi một lần cho mỗi biến cố", () => {
  const [c, a] = mk();
  a.world.crisis = { id: "yeu_toc", at: a.world.year, until: a.world.year + 50, score: 50, by: 0 };
  assert.equal(P.nextEvent(c, a).id, "vk2_phap_crisis");
  assert.equal(P.nextEvent(c, a)?.id === "vk2_phap_crisis", false);
});

test("sự kiện dựng lại được sau khi tải lại, kể cả khi đại biến đã xong", () => {
  const [c, a] = mk();
  a.world.crisis = null;
  assert.equal(P.eventDef(c, a, "vk2_phap_crisis").choices(c, 0).length, 1);
  c.vk2.phap.evKind = null;
  assert.equal(P.eventDef(c, a, "vk2_phap_demon").choices(c, 0).length, 1);
});

test("nhiệm vụ không phát thưởng trùng và lưu qua JSON", () => {
  const [c, a] = mk();
  c.vk2.dao.mastery.kiem_y = 80;
  P.toggleLaw(c, a, "kiem");
  const s = c.linhThach;
  assert.ok(C.claim(c, a, "p_law", 0, {}));
  assert.equal(C.claim(c, a, "p_law", 0, {}), null);
  assert.equal(c.linhThach, s + 500);
  const copy = JSON.parse(JSON.stringify(c));
  assert.deepEqual(P.summary(copy), P.summary(c));
});

test("thọ từ pháp tắc Thời Gian được ghi vào trường game giữ qua lần kẹp hằng năm", () => {
  const [c, a] = mk({ realm: 5, age: 100, lifespan: 300 });
  const p = P.ensure(c, a);
  p.laws.thoi_gian = 110;
  c.age = 101;
  P.onYear(c, a);
  assert.equal(c.lifespan, 330);
  assert.equal(c.lifeExtra, 30);
  c.age = 102;
  P.onYear(c, a);
  assert.equal(c.lifeExtra, 30, "không cộng lại lần hai");
});
