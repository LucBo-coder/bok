const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
const C = globalThis.VK2Core;
const D = globalThis.VK2Data;

const NOW = new Date(2026, 10, 9, 12).getTime();
const NEXT_DAY = new Date(2026, 10, 10, 12).getTime();

function mkChar(over = {}) {
  return {
    age: 0, lifeNo: 1, realm: 0, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2,
    element: "kim", lookSeed: 12345, path: null, sect: null, focus: "tu_luyen", linhThach: 10, pills: {},
    stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 5, sucKhoe: 80 }, daoTam: 0, dead: false, log: [],
    ...over,
  };
}
const find = (c, a, id, now = NOW) => C.listQuests(c, a, now).find((q) => q.id === id);

test("không có id nhiệm vụ trùng lặp", () => {
  const ids = [...D.MAIN, ...D.REALM, ...D.LIFE, ...D.DAILY_POOL].map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("mọi điều kiện after đều trỏ tới nhiệm vụ có thật và không tự khóa vòng", () => {
  for (const list of [D.MAIN, D.LIFE]) {
    const ids = new Set(list.map((q) => q.id));
    for (const q of list) {
      const seen = new Set();
      let cur = q;
      while (cur?.after) {
        assert.ok(ids.has(cur.after), `${q.id} -> ${cur.after}`);
        assert.ok(!seen.has(cur.id), `vòng lặp ở ${q.id}`);
        seen.add(cur.id);
        cur = list.find((x) => x.id === cur.after);
      }
    }
  }
});

test("nhiệm vụ mở khóa theo chuỗi, chưa đủ thì không nhận được thưởng", () => {
  const c = mkChar();
  const a = C.newAcct();
  C.ensure(c, a);
  assert.equal(find(c, a, "m1_qi").status, "active");
  assert.equal(find(c, a, "m1_cult").status, "locked");
  assert.equal(C.claim(c, a, "m1_qi", NOW, {}), null);
  c.cultivation = 1;
  assert.equal(find(c, a, "m1_qi").status, "complete");
  assert.ok(C.claim(c, a, "m1_qi", NOW, {}));
  assert.equal(find(c, a, "m1_cult").status, "active");
});

test("không nhận thưởng lặp", () => {
  const c = mkChar({ cultivation: 1 });
  const a = C.newAcct();
  C.ensure(c, a);
  assert.ok(C.claim(c, a, "m1_qi", NOW, {}));
  assert.equal(c.linhThach, 30);
  assert.equal(C.claim(c, a, "m1_qi", NOW, {}), null);
  assert.equal(c.linhThach, 30);
  assert.equal(find(c, a, "m1_qi").status, "claimed");
});

test("gọi tick lặp lại không đếm trùng năm", () => {
  const c = mkChar({ age: 6 });
  const a = C.newAcct();
  C.tick(c, a, NOW);
  c.age = 8.4;
  for (let i = 0; i < 5; i++) C.tick(c, a, NOW);
  assert.equal(C.metric("y_tu_luyen", c, a), 2);
  c.age = 9.1;
  C.tick(c, a, NOW);
  assert.equal(C.metric("y_tu_luyen", c, a), 3);
});

test("năm tuổi nhỏ không tính là tu luyện", () => {
  const c = mkChar();
  const a = C.newAcct();
  C.tick(c, a, NOW);
  c.age = 5;
  C.tick(c, a, NOW);
  assert.equal(C.metric("y_tu_luyen", c, a), 0);
  c.age = 8; // Nhảy qua mốc 6 tuổi: chỉ tính các năm 6, 7, 8
  C.tick(c, a, NOW);
  assert.equal(C.metric("y_tu_luyen", c, a), 3);
});

test("save cũ: nhiệm vụ đã vượt qua không phát thưởng bù, dữ liệu gốc không bị đổi", () => {
  const c = mkChar({ age: 80, realm: 3, layer: 2, cultivation: 500, linhThach: 999, path: "kiem" });
  const a = C.newAcct();
  C.ensure(c, a);
  assert.equal(find(c, a, "m2_realm").status, "claimed");
  assert.equal(C.claim(c, a, "m2_realm", NOW, {}), null);
  assert.equal(c.linhThach, 999);
  assert.equal(c.realm, 3);
  assert.equal(c.cultivation, 500);
});

test("tracker tối đa 3, ưu tiên việc chờ nhận và không có việc đã xong", () => {
  const c = mkChar({ age: 40, realm: 1, layer: 2, cultivation: 5 });
  const a = C.newAcct();
  c.vk2 = undefined;
  C.ensure(c, a);
  c.vk2.claimed = {};
  const top = C.tracked(C.listQuests(c, a, NOW), c.vk2.pins);
  assert.ok(top.length <= 3);
  assert.equal(top[0].id, "m1_qi");
  C.claim(c, a, "m1_qi", NOW, {});
  const again = C.tracked(C.listQuests(c, a, NOW), c.vk2.pins);
  assert.ok(!again.some((q) => q.status === "claimed" || q.status === "locked"));
});

test("ghim tối đa 3 và nhiệm vụ ghim lên đầu", () => {
  const c = mkChar();
  const a = C.newAcct();
  C.ensure(c, a);
  for (const id of ["a", "b", "c"]) assert.ok(C.togglePin(c, a, id));
  assert.equal(C.togglePin(c, a, "d"), false);
  assert.ok(C.togglePin(c, a, "a"));
  assert.ok(C.togglePin(c, a, "d_cult"));
  const top = C.tracked(C.listQuests(c, a, NOW), c.vk2.pins);
  const dailies = C.ensureDaily(a, NOW).quests;
  if (dailies.includes("d_cult")) assert.equal(top[0].id, "d_cult");
});

test("hằng ngày: chọn 3 việc khác nhau, cố định trong ngày, đặt lại khi đổi ngày", () => {
  const a = C.newAcct();
  const d1 = C.ensureDaily(a, NOW);
  assert.equal(new Set(d1.quests).size, 3);
  a.daily.c.kills = 99;
  a.daily.claimed.d_kill = 1;
  assert.equal(C.ensureDaily(a, NOW + 1000).c.kills, 99);
  const d2 = C.ensureDaily(a, NEXT_DAY);
  assert.deepEqual(d2.c, {});
  assert.deepEqual(d2.claimed, {});
});

test("hằng ngày: nhận thưởng một lần mỗi ngày, ngày sau nhận lại được", () => {
  const c = mkChar({ age: 10 });
  const a = C.newAcct();
  C.tick(c, a, NOW);
  const id = a.daily.quests[0];
  const goal = D.DAILY_POOL.find((q) => q.id === id).goal;
  a.daily.c[goal[0]] = goal[1];
  const before = c.linhThach;
  assert.ok(C.claim(c, a, id, NOW, {}));
  assert.equal(c.linhThach, before + D.DAILY_REWARD.stonesPerRealm);
  assert.equal(C.claim(c, a, id, NOW, {}), null);
  assert.equal(c.linhThach, before + D.DAILY_REWARD.stonesPerRealm);
});

test("luân hồi: phúc duyên chỉ phát một lần trên toàn tài khoản, qua nhiều kiếp", () => {
  const a = C.newAcct();
  a.lives = 3;
  let phuc = 0;
  const ctx = { addPhuc: (n) => (phuc += n) };
  const life1 = mkChar();
  C.ensure(life1, a);
  assert.ok(C.claim(life1, a, "l_3", NOW, ctx));
  assert.equal(phuc, 15);
  const life2 = mkChar({ lifeNo: 2 });
  C.ensure(life2, a);
  assert.equal(C.claim(life2, a, "l_3", NOW, ctx), null);
  assert.equal(phuc, 15);
});

test("linh căn xác định, đúng số hệ theo phẩm, hệ chính là mệnh của nhân vật", () => {
  const cases = [[1.9, 1], [1.6, 2], [1.2, 3], [0.85, 4], [0.45, 5]];
  for (const [mul, count] of cases) {
    const c = mkChar({ linhCanMul: mul, element: "hoa" });
    const r = C.rootInfo(c);
    assert.equal(r.count, count);
    assert.equal(new Set(r.elements).size, count);
    assert.equal(r.elements[0], "hoa");
    assert.deepEqual(C.rootInfo(c), r);
  }
});

test("đơn linh căn không trội toàn diện: tạp căn bền hơn, đơn căn công cao hơn", () => {
  const single = C.totals(mkChar({ linhCanMul: 1.9, lookSeed: 1 }));
  const mixed = C.totals(mkChar({ linhCanMul: 0.85, lookSeed: 1 }));
  assert.ok(single.atk > mixed.atk);
  assert.ok(mixed.hp > single.hp);
  assert.ok(mixed.def > single.def);
  assert.ok(mixed.brk > single.brk);
});

test("đạo lộ hợp hệ được cộng tốc độ tu", () => {
  const off = C.cultMul(mkChar({ linhCanMul: 1.9, lookSeed: 1, element: "thuy", path: "kiem" }));
  const on = C.cultMul(mkChar({ linhCanMul: 1.9, lookSeed: 1, element: "kim", path: "kiem" }));
  assert.ok(on > off);
});

test("thức tỉnh theo hành vi, không có sẵn từ đầu", () => {
  const c = mkChar({ path: "kiem", age: 20 });
  const a = C.newAcct();
  C.tick(c, a, NOW);
  assert.ok(!c.vk2.talents.kiem_tam);
  for (let i = 0; i < 5; i++) C.onKill(c, a);
  const { woken } = C.tick(c, a, NOW);
  assert.ok(woken.includes("kiem_tam"));
  assert.equal(c.vk2.talents.kiem_tam.lv, 1);
  assert.ok(c.vk2.active.includes("kiem_tam"));
  assert.deepEqual(C.tick(c, a, NOW).woken, []);
});

test("thiên phú chỉ lên kinh nghiệm khi vận hành; hết ô thì không bật thêm được", () => {
  const c = mkChar({ path: "kiem", age: 20, linhCanMul: 0.85 });
  const a = C.newAcct();
  C.ensure(c, a);
  c.vk2.talents = { kiem_tam: { lv: 1, xp: 0, branch: null }, thiet_cot: { lv: 1, xp: 0, branch: null } };
  c.vk2.active = ["kiem_tam"];
  assert.equal(C.setActive(c, a, "thiet_cot", true), false);
  C.onKill(c, a);
  assert.equal(c.vk2.talents.thiet_cot.xp, 0);
  assert.ok(c.vk2.talents.kiem_tam.xp > 0);
  c.realm = 2;
  assert.equal(C.setActive(c, a, "thiet_cot", true), true);
  assert.equal(c.vk2.active.length, 2);
});

test("lên bậc tiêu hao kinh nghiệm, không lên khi chưa đủ, và dừng ở bậc 5", () => {
  const c = mkChar();
  const a = C.newAcct();
  C.ensure(c, a);
  c.vk2.talents.lu_khach = { lv: 1, xp: 0, branch: null };
  c.vk2.active = ["lu_khach"];
  assert.equal(C.levelUp(c, "lu_khach"), false);
  const def = C.talentDef.get("lu_khach");
  for (let lv = 1; lv < 5; lv++) {
    c.vk2.talents.lu_khach.xp = C.talentThreshold(def, lv);
    assert.ok(C.levelUp(c, "lu_khach"));
    assert.equal(c.vk2.talents.lu_khach.xp, 0);
  }
  assert.equal(c.vk2.talents.lu_khach.lv, 5);
  c.vk2.talents.lu_khach.xp = 99999;
  assert.equal(C.levelUp(c, "lu_khach"), false);
});

test("nhánh tiến hóa phải chọn trước khi lên tiếp, không đổi lại được, id sai bị từ chối", () => {
  const c = mkChar();
  const a = C.newAcct();
  C.ensure(c, a);
  c.vk2.talents.kiem_tam = { lv: 3, xp: 99999, branch: null };
  c.vk2.active = ["kiem_tam"];
  assert.equal(C.levelUp(c, "kiem_tam"), false);
  assert.equal(C.chooseBranch(c, "kiem_tam", "khong_co"), false);
  assert.equal(C.chooseBranch(c, "kiem_tam", "ba"), true);
  assert.equal(C.chooseBranch(c, "kiem_tam", "tinh"), false);
  assert.equal(c.vk2.talents.kiem_tam.branch, "ba");
  assert.ok(C.levelUp(c, "kiem_tam"));
  assert.ok(C.talentFx(C.talentDef.get("kiem_tam"), 4, "ba").def < 0);
});

test("softcap: cộng bao nhiêu cũng không vượt trần, và luôn đơn điệu", () => {
  const c = mkChar({ linhCanMul: 1.2 });
  const a = C.newAcct();
  C.ensure(c, a);
  for (const def of D.TALENTS) c.vk2.talents[def.id] = { lv: 5, xp: 0, branch: null };
  c.vk2.active = D.TALENTS.map((d) => d.id);
  const t = C.totals(c);
  for (const k of Object.keys(D.SOFTCAP)) assert.ok(t[k] <= D.SOFTCAP[k], `${k}=${t[k]}`);
  assert.ok(C.softcap(0.2, 0.45) < C.softcap(0.3, 0.45));
  assert.ok(C.softcap(0.3, 0.45) < 0.3);
});

test("hiệu ứng thật sự đổi chỉ số chiến đấu, tu vi và đột phá", () => {
  const c = mkChar({ linhCanMul: 1.2 });
  const a = C.newAcct();
  C.ensure(c, a);
  const base = C.statMul(c, { hp: 100, atk: 100, def: 100 }).atk;
  c.vk2.talents.kiem_tam = { lv: 5, xp: 0, branch: null };
  c.vk2.active = ["kiem_tam"];
  assert.ok(C.statMul(c, { hp: 100, atk: 100, def: 100 }).atk > base);
  assert.ok(C.cultMul(c) > 1);
});

test("đánh đổi: thiên phú Ma Tâm giảm đột phá và nuôi tâm ma mỗi năm", () => {
  const c = mkChar({ age: 20, daoTam: -50 });
  const a = C.newAcct();
  C.tick(c, a, NOW);
  const b0 = C.breakBonus(c);
  c.vk2.talents.ma_tam = { lv: 5, xp: 0, branch: null };
  c.vk2.active = ["ma_tam"];
  assert.ok(C.breakBonus(c) < b0);
  const m0 = c.stats.tamMa;
  c.age = 30;
  C.tick(c, a, NOW);
  assert.ok(c.stats.tamMa > m0);
});

test("chuẩn bị đột phá cộng tỷ lệ cho đúng cảnh giới kế tiếp, không cộng dồn sang cảnh giới sau", () => {
  const c = mkChar({ age: 30, realm: 1, layer: 9, linhThach: 1000, pills: { a: 1 } });
  const a = C.newAcct();
  c.vk2 = undefined;
  C.ensure(c, a);
  const b0 = C.breakBonus(c);
  assert.ok(C.claim(c, a, "p2_tam", NOW, {}));
  assert.ok(C.claim(c, a, "p2_pill", NOW, {}));
  assert.ok(Math.abs(C.breakBonus(c) - b0 - 2 * D.PREP_BONUS) < 1e-9);
  c.realm = 2;
  assert.equal(C.prepBonus(c), 0);
  assert.equal(find(c, a, "p2_tam"), undefined);
});

test("cái chết chỉ ghi sổ một lần, kiếp sau có lợi thế giới hạn", () => {
  const c = mkChar({ age: 40, lifeNo: 1, path: "kiem" });
  const a = C.newAcct();
  C.ensure(c, a);
  c.vk2.talents.kiem_tam = { lv: 4, xp: 0, branch: null };
  c.dead = true;
  assert.equal(C.tick(c, a, NOW).died, true);
  assert.equal(C.tick(c, a, NOW).died, false);
  assert.equal(a.deaths, 1);
  assert.equal(a.book.kiem_tam, 4);

  const next = mkChar({ age: 20, lifeNo: 2, path: "kiem" });
  C.tick(next, a, NOW);
  for (let i = 0; i < 5; i++) C.onKill(next, a);
  C.tick(next, a, NOW);
  const t = next.vk2.talents.kiem_tam;
  const need = C.talentThreshold(C.talentDef.get("kiem_tam"), 1);
  assert.equal(t.lv, 1);
  assert.equal(t.xp, Math.round(0.75 * need));
  assert.ok(t.xp < need);
});

test("giới hạn số thiên phú thức tỉnh mỗi kiếp", () => {
  const c = mkChar({ age: 50, realm: 3, path: "kiem", daoTam: -40, pet: true, linhCanMul: 0.85 });
  const a = C.newAcct();
  a.lives = 9;
  C.ensure(c, a);
  Object.assign(c.vk2.c, { kills: 99, kills_kiem: 99, y_luyen_dan: 99, y_calm: 99, y_du_ngoan: 99 });
  C.checkAwaken(c, a);
  assert.equal(Object.keys(c.vk2.talents).length, D.MAX_AWAKENED);
});

test("mọi thiên phú có đủ 5 bậc hiệu ứng, và mọi nhiệm vụ có mục tiêu dương", () => {
  for (const d of D.TALENTS) {
    assert.equal(d.fx.length, 5, d.id);
    for (const [, n] of d.awake) assert.ok(n > 0);
  }
  for (const q of [...D.MAIN, ...D.REALM, ...D.LIFE, ...D.DAILY_POOL]) assert.ok(q.goal[1] > 0, q.id);
});
