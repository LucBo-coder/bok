// Kiểm thử logic Giai đoạn 2: ngộ đạo, sáng tạo công pháp, bí cảnh, truyền thừa.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
require("../dao.js");
const C = globalThis.VK2Core;
const G = globalThis.VK2Dao;

function mk(over = {}) {
  const c = { age: 0, lifeNo: 1, realm: 2, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 77, path: "kiem", sect: null, focus: "tu_luyen", linhThach: 5000, pills: {}, lifespan: 300, stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 5, sucKhoe: 90 }, daoTam: 0, dead: false, log: [], ...over };
  const a = C.newAcct();
  G.ensure(c, a);
  c.age = over.age ?? 30;
  c.vk2.dao.year = c.age;
  return [c, a];
}
const year = (c, a) => {
  c.age = Math.floor(c.age) + 1;
  C.onYear(c, a, {});
  C.tick(c, a, 0);
};
const ctx = { log() {}, rnd: () => 0.5, fx() {} };
const prime = (c, r) => {
  c.vk2.dao.mastery[r.a] = 70;
  c.vk2.dao.mastery[r.b] = 70;
};
const clearAll = (c, a, pick = 0) => {
  let def = G.chain(c, a);
  let guard = 0;
  while (def && guard++ < 30) {
    const list = def.choices(c, 0);
    const choice = list[pick] && !list[pick].off ? list[pick] : list.find((x) => !x.off);
    choice.run(c, ctx);
    if (c.dead) break;
    def = G.chain(c, a);
  }
};
function openRun(c, a, id, seed = 12345) {
  c.vk2.dao.open.push({ id, until: 999, seed });
  assert.equal(G.enter(c, a, id), true);
}

test("đạo niệm lớn theo đạo lộ và chuyên tâm, không vượt 100", () => {
  const [c, a] = mk();
  G.setStudy(c, a, "loi_phap");
  for (let i = 0; i < 300; i++) year(c, a);
  assert.ok(c.vk2.dao.mastery.kiem_y > 30, "kiếm ý lớn theo đạo lộ");
  assert.equal(c.vk2.dao.mastery.loi_phap, 100);
});

test("hai đạo niệm thành thục trong khoảng hợp lý, không cần hàng trăm năm", () => {
  const [c, a] = mk();
  G.setStudy(c, a, "loi_phap");
  let y = 0;
  const r = G.recipeDef.get("loi_kiem");
  while (y < 200 && !G.recipeReady(c.vk2.dao, r)) {
    year(c, a);
    y++;
    if (c.vk2.dao.mastery.loi_phap >= 60) G.setStudy(c, a, "kiem_y");
  }
  assert.ok(y < 60, `mất ${y} năm`);
});

test("công thức có quy tắc: thiếu đạo niệm, cảnh giới, linh thạch thì không tạo được", () => {
  const [c, a] = mk({ realm: 1 });
  assert.equal(G.createArt(c, a, "loi_kiem", "x"), null);
  prime(c, G.recipeDef.get("loi_kiem"));
  assert.equal(G.createArt(c, a, "loi_kiem", "x"), null, "chưa đủ cảnh giới");
  c.realm = 2;
  c.linhThach = 1;
  assert.equal(G.createArt(c, a, "loi_kiem", "x"), null, "thiếu linh thạch");
  c.linhThach = 400;
  assert.ok(G.createArt(c, a, "loi_kiem", "x"));
  assert.equal(c.linhThach, 0);
});

test("công pháp tự sáng tạo có tên, nguồn gốc, thuộc tính, và hiệu ứng thật", () => {
  const [c, a] = mk();
  const r = G.recipeDef.get("loi_kiem");
  prime(c, r);
  const before = C.totals(c);
  const duelBefore = C.duelMods(c).extra;
  const art = G.createArt(c, a, "loi_kiem", "  Thiên <Lôi> Kiếm  ");
  assert.equal(art.name, "Thiên Lôi Kiếm", "tên được làm sạch");
  assert.deepEqual(art.from, ["kiem_y", "loi_phap"]);
  assert.equal(art.el, "kim");
  const after = C.totals(c);
  assert.ok(after.atk > before.atk, "tăng công thật");
  assert.ok(C.duelMods(c).extra > duelBefore, "đổi cơ chế trận thật");
  assert.ok(after.def < before.def, "có nhược điểm");
});

test("không tạo trùng, có khoảng nghỉ, và số ô vận hành có hạn", () => {
  const [c, a] = mk();
  prime(c, G.recipeDef.get("loi_kiem"));
  prime(c, G.recipeDef.get("thu_thuy"));
  const one = G.createArt(c, a, "loi_kiem", "");
  assert.ok(one);
  assert.equal(G.createArt(c, a, "loi_kiem", ""), null);
  assert.equal(G.createArt(c, a, "thu_thuy", ""), null, "còn trong thời gian tĩnh dưỡng");
  c.age += 26;
  const two = G.createArt(c, a, "thu_thuy", "");
  assert.ok(two);
  assert.equal(c.vk2.dao.active.length, 1, "Trúc Cơ chỉ một ô");
  assert.equal(G.toggleArt(c, a, two.id), false);
  c.realm = 4;
  assert.equal(G.toggleArt(c, a, two.id), true);
});

test("một đời chỉ sáng tạo được 3 môn", () => {
  const [c, a] = mk({ linhThach: 99999 });
  for (const k of Object.keys(G.CONCEPTS)) c.vk2.dao.mastery[k] = 80;
  let n = 0;
  for (const r of G.RECIPES) {
    c.realm = 5;
    c.age += 30;
    if (G.createArt(c, a, r.id, "")) n++;
  }
  assert.equal(n, 3);
});

test("uy lực bí thuật có trần", () => {
  const [c] = mk();
  const r = G.recipeDef.get("loi_kiem");
  c.vk2.dao.mastery[r.a] = 100;
  c.vk2.dao.mastery[r.b] = 100;
  c.stats.ngoTinh = 100;
  assert.ok(G.artPower(c, r) <= 1.25);
});

test("mỗi bí cảnh đều đủ thông số yêu cầu", () => {
  assert.equal(G.REALMS.length, 8);
  for (const r of G.REALMS) {
    assert.ok(r.realm >= 1 && r.danger >= 1 && r.floors >= 3, r.id);
    assert.ok(r.foes.length && r.trap && r.boss && r.rival && r.mats.length, r.id);
    assert.ok(r.hasInherit > 0, r.id);
  }
});

test("bí cảnh rút lui được ở tầng 1 và giữ chiến lợi phẩm, không phát thưởng hai lần", () => {
  const [c, a] = mk();
  openRun(c, a, "dong_phu");
  c.vk2.dao.run.loot.stones = 300;
  const stones = c.linhThach;
  G.chain(c, a).choices(c, 0).at(-1).run(c, ctx);
  assert.equal(c.vk2.dao.run, null);
  assert.equal(c.linhThach, stones + 300);
  assert.equal(G.finishRun(c, a, ctx, "retreat"), "", "gọi lại không phát thêm");
  assert.equal(c.linhThach, stones + 300);
});

test("bí cảnh luôn kết thúc: mạnh thì đi hết, yếu thì bị đẩy ra", () => {
  for (const r of G.REALMS) {
    for (let seed = 1; seed <= 25; seed++) {
      const [c, a] = mk({ realm: r.realm, sect: "x", lookSeed: seed });
      c.stats.sucKhoe = 100;
      openRun(c, a, r.id, seed * 991);
      clearAll(c, a);
      assert.equal(c.vk2.dao.run, null, `${r.id} seed ${seed} còn dang dở`);
    }
  }
});

test("sức mạnh quyết định kết quả: người mạnh đi hết nhiều hơn người yếu", () => {
  const results = { weak: 0, strong: 0 };
  for (let seed = 1; seed <= 30; seed++) {
    const [w, aw] = mk({ realm: 2, layer: 1, lookSeed: seed });
    openRun(w, aw, "chien_truong", seed * 7);
    clearAll(w, aw);
    results.weak += w.vk2.dao.cleared;
    const [s, as] = mk({ realm: 6, layer: 1, lookSeed: seed });
    openRun(s, as, "chien_truong", seed * 7);
    clearAll(s, as);
    results.strong += s.vk2.dao.cleared;
  }
  assert.ok(results.strong > results.weak, JSON.stringify(results));
});

test("thua trận thì mất phần lớn chiến lợi phẩm và trọng thương", () => {
  const [c, a] = mk();
  openRun(c, a, "dong_phu");
  c.vk2.dao.run.loot.stones = 1000;
  const stones = c.linhThach;
  const hp = c.stats.sucKhoe;
  G.finishRun(c, a, ctx, "lost");
  assert.equal(c.linhThach, stones + 400);
  assert.ok(c.stats.sucKhoe < hp);
  assert.ok(c.vk2.can === undefined || c.vk2.can.injury > 0);
});

test("trận dùng hệ số quái đúng công thức và xác định theo seed", () => {
  const [c] = mk();
  assert.deepEqual(C.duel(c, 18, 1, 42, 1), C.duel(c, 18, 1, 42, 1));
  assert.equal(C.duel(c, 2, 1, 42, 1).win, true);
  assert.equal(C.duel(c, 60, 1, 42, 1).win, false);
});

test("cơ chế bí thuật đổi kết quả trận thật: hộ thể giữ được nhiều máu hơn", () => {
  const [c, a] = mk();
  const r = G.recipeDef.get("bat_diet");
  const lv = C.combatLevel(c);
  const before = C.duel(c, lv, 1, 9, 1);
  prime(c, r);
  G.createArt(c, a, "bat_diet", "");
  const after = C.duel(c, lv, 1, 9, 1);
  assert.ok(after.hp > before.hp, `${before.hp} -> ${after.hp}`);
});

test("truyền thừa có điều kiện tâm cảnh; không đạt thì không nhận được nhưng vẫn rời đi được", () => {
  const [c, a] = mk({ path: "phat" });
  c.stats.tamCanh = 30;
  openRun(c, a, "truyen_thua");
  c.vk2.dao.run.inherit = "t_phat";
  c.vk2.dao.run.floor = 99;
  const list = G.trialDef(c, a).choices(c, 0);
  assert.equal(list[0].off, true);
  assert.equal(list[1].off, true);
  list[2].run(c, ctx);
  assert.equal(c.vk2.dao.inherits.length, 0);
  assert.equal(c.vk2.dao.run, null);
});

test("truyền thừa học được và dùng được: đúng đạo có chiêu thật của game, huyết mạch, lời hứa", () => {
  const [c, a] = mk({ path: "yeu" });
  c.stats.tamCanh = 80;
  openRun(c, a, "yeu_cam");
  c.vk2.dao.run.inherit = "t_yeu";
  c.vk2.dao.run.floor = 99;
  const hpBefore = C.totals(c).hp;
  G.trialDef(c, a).choices(c, 0)[0].run(c, ctx);
  assert.equal(c.vk2.dao.inherits[0].id, "t_yeu");
  assert.ok(c.cp.own.some((t) => t.id === "hoa_hinh"));
  assert.equal(c.vk2.dao.blood, "yeu_de");
  assert.equal(c.vk2.dao.promises.length, 1);
  assert.ok(C.totals(c).hp > hpBefore);
  assert.ok(c.vk2.dao.mastery.yeu_huyet >= 35);
});

test("khác đạo vẫn nhận ký ức nhưng không học chiêu; gạt nhân quả thì thu ít hơn, không có lời hứa", () => {
  const [c, a] = mk({ path: "kiem" });
  c.stats.tamCanh = 80;
  openRun(c, a, "truyen_thua");
  c.vk2.dao.run.inherit = "t_dan";
  c.vk2.dao.run.floor = 99;
  G.trialDef(c, a).choices(c, 0)[1].run(c, ctx);
  assert.equal(c.cp?.own?.length ?? 0, 0);
  assert.equal(c.vk2.dao.promises.length, 0);
  assert.equal(c.vk2.dao.mastery.dan_dao, 17.5);
});

test("giữ lời hứa thưởng đúng một lần", () => {
  const [c, a] = mk();
  c.vk2.dao.promises.push({ id: "p", t: ["a", "a"], goal: ["kills", 2], at: 1, done: false });
  const tam = c.stats.tamCanh;
  C.tick(c, a, 0);
  assert.equal(c.stats.tamCanh, tam);
  c.vk2.c.kills = 2;
  C.tick(c, a, 0);
  C.tick(c, a, 0);
  assert.equal(c.stats.tamCanh, tam + 4);
});

test("tầng bí cảnh tải lại được: eventDef dựng lại đúng từ save", () => {
  const [c, a] = mk();
  openRun(c, a, "dong_phu");
  const def = C.eventDef(c, a, "vk2_bc_floor");
  assert.ok(def.choices(c, 0).length >= 2);
  const saved = JSON.parse(JSON.stringify(c));
  const again = C.eventDef(saved, a, "vk2_bc_floor");
  assert.deepEqual(again.choices(saved, 0).map((x) => x.label), def.choices(c, 0).map((x) => x.label));
});

test("id lạ của mod không làm hỏng game: trả về null", () => {
  const [c, a] = mk();
  assert.equal(C.eventDef(c, a, "vk2_khong_co"), null);
  assert.equal(C.eventDef(c, a, "bi_canh"), null, "sự kiện gốc không bị chặn");
});

test("sự kiện mod không lấn kỳ ngộ gốc: hai sự kiện năm cách nhau tối thiểu 4 năm", () => {
  const [c, a] = mk();
  c.vk2.dao.open.push({ id: "dong_phu", until: 999, seed: 1 });
  c.vk2.dao.open.push({ id: "chien_truong", until: 999, seed: 2 });
  assert.ok(C.yearEvent(c, a, {}));
  assert.equal(C.yearEvent(c, a, {}), null);
  c.age += 4;
  assert.ok(C.yearEvent(c, a, {}));
});

test("save cũ không có dao: tạo được, nhiệm vụ đã đạt không phát thưởng", () => {
  const c = { age: 80, lifeNo: 3, realm: 3, layer: 1, linhCan: "x", linhCanMul: 1, element: "kim", lookSeed: 5, path: "kiem", focus: "tu_luyen", linhThach: 1, pills: {}, lifespan: 200, stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 5, sucKhoe: 80 }, log: [] };
  const a = C.newAcct();
  C.ensure(c, a);
  c.vk2.c.y_tu_luyen = 60;
  G.ensure(c, a);
  assert.ok(c.vk2.dao.mastery.kiem_y > 0);
  assert.equal(c.vk2.claimed.d_concept, "legacy");
  assert.equal(C.listQuests(c, a, 0).find((x) => x.id === "d_concept").status, "claimed");
});

test("nhiệm vụ Giai đoạn 2 chạy qua hệ VK2 và không nhận thưởng trùng", () => {
  const [c, a] = mk();
  c.vk2.dao.mastery.kiem_y = 40;
  const stones = c.linhThach;
  assert.ok(C.claim(c, a, "d_concept", 0, {}));
  assert.equal(C.claim(c, a, "d_concept", 0, {}), null);
  assert.equal(c.linhThach, stones + 80);
});
