// Kiểm thử logic Giai đoạn 3: nguyên liệu, luyện khí, phù lục, bản mệnh, động phủ.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
require("../dao.js");
require("../khi.js");
const C = globalThis.VK2Core;
const Q = globalThis.VK2Khi;
const G = globalThis.VK2Dao;

function mk(over = {}) {
  const c = { age: 0, lifeNo: 1, realm: 3, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 77, path: "kiem", sect: null, focus: "tu_luyen", linhThach: 50000, pills: {}, lifespan: 300, stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 5, sucKhoe: 90 }, daoTam: 0, dead: false, log: [], ...over };
  const a = C.newAcct();
  Q.ensure(c, a);
  G.ensure(c, a);
  c.age = over.age ?? 30;
  c.vk2.khi.year = c.age;
  c.vk2.dao.year = c.age;
  return [c, a];
}
const year = (c, a, n = 1) => {
  for (let i = 0; i < n; i++) {
    c.age = Math.floor(c.age) + 1;
    C.onYear(c, a, {});
    C.tick(c, a, 0);
  }
};
const stock = (c, a, n = 50) => {
  for (const id of Object.keys(Q.MATS)) Q.addMat(c, a, id, n);
};

test("nguyên liệu có trần và không nhận giá trị bất thường", () => {
  const [c, a] = mk();
  Q.addMat(c, a, "kim_thiet", 500);
  assert.equal(c.vk2.khi.mats.kim_thiet, Q.MAT_CAP);
  assert.equal(Q.addMat(c, a, "khong_co", 5), 0);
  assert.equal(Q.addMat(c, a, "moc_tinh", -5), 0);
});

test("mua nguyên liệu trừ linh thạch, giá tăng khi mua nhiều trong năm", () => {
  const [c, a] = mk({ linhThach: 1000 });
  const p1 = Q.matPrice(c, "kim_thiet");
  assert.equal(Q.buyMat(c, a, "kim_thiet"), true);
  assert.equal(c.linhThach, 1000 - p1);
  assert.ok(Q.matPrice(c, "kim_thiet") > p1);
  year(c, a);
  assert.equal(Q.matPrice(c, "kim_thiet"), p1);
  c.linhThach = 0;
  assert.equal(Q.buyMat(c, a, "kim_thiet"), false);
});

test("luyện khí trừ đúng nguyên liệu và linh thạch; thiếu thì không trừ gì", () => {
  const [c, a] = mk({ linhThach: 1000 });
  assert.equal(Q.craft(c, a, "kiem"), null);
  assert.equal(c.linhThach, 1000);
  Q.addMat(c, a, "kim_thiet", 4);
  assert.equal(Q.craft(c, a, "kiem"), null, "thiếu một loại thì không trừ loại kia");
  assert.equal(c.vk2.khi.mats.kim_thiet, 4);
  Q.addMat(c, a, "hoa_tinh", 1);
  const it = Q.craft(c, a, "kiem");
  assert.ok(it);
  assert.equal(c.vk2.khi.mats.kim_thiet, 0);
  assert.equal(c.linhThach, 850);
});

test("pháp bảo đủ thông số yêu cầu và có hiệu ứng thật", () => {
  const [c, a] = mk();
  stock(c, a);
  const before = C.totals(c).atk;
  const it = Q.craft(c, a, "kiem");
  for (const k of ["q", "el", "dur", "lv", "spirit"]) assert.ok(k in it, k);
  assert.ok(C.totals(c).atk > before);
  assert.ok(C.duelMods(c).first > 0, "có cơ chế trận");
});

test("phẩm pháp bảo phụ thuộc tay nghề: phòng luyện khí cho phẩm cao hơn trung bình", () => {
  const avg = (lv) => {
    let s = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const [c, a] = mk({ lookSeed: seed });
      stock(c, a);
      if (lv) {
        Q.found(c, a, "pham");
        c.vk2.khi.cave.b.khi_phong = lv;
      }
      s += Q.craft(c, a, "kiem").q;
    }
    return s / 120;
  };
  assert.ok(avg(3) > avg(0) + 0.3, `${avg(0)} vs ${avg(3)}`);
});

test("kết quả luyện không đổi khi tải lại trang: cùng trạng thái cho cùng phẩm", () => {
  const run = () => {
    const [c, a] = mk({ lookSeed: 999 });
    stock(c, a);
    return Q.craft(c, a, "giap").q;
  };
  assert.equal(run(), run());
});

test("giới hạn giữ và trang bị: không cộng dồn vô hạn", () => {
  const [c, a] = mk({ realm: 1 });
  stock(c, a, 99);
  for (let i = 0; i < 20; i++) Q.craft(c, a, "kiem");
  assert.equal(c.vk2.khi.items.length, Q.HELD_MAX);
  assert.equal(c.vk2.khi.worn.length, 1);
  assert.equal(Q.toggleWorn(c, a, c.vk2.khi.items[3].id), false);
});

test("cường hóa có thể thất bại, có tầng tối đa, khí linh chỉ sinh ở tầng cao", () => {
  const [c, a] = mk();
  stock(c, a, 99);
  c.vk2.khi.mats.kim_thiet = 99;
  const it = Q.craft(c, a, "kiem");
  it.q = 2;
  let fails = 0;
  for (let i = 0; i < 300 && it.lv < Q.ENHANCE_MAX; i++) {
    c.vk2.khi.mats[Q.enhanceCost(it).mat] = 99;
    c.linhThach = 999999;
    it.dur = 100;
    const r = Q.enhance(c, a, it.id);
    if (r && !r.ok) fails++;
    if (it.lv < Q.SPIRIT_LV) assert.equal(it.spirit, false);
  }
  assert.equal(it.lv, Q.ENHANCE_MAX);
  assert.ok(fails > 0, "có lần thất bại");
  assert.equal(it.spirit, true);
  assert.equal(Q.enhance(c, a, it.id), null, "không vượt tầng tối đa");
});

test("khí linh theo hệ thêm cơ chế riêng", () => {
  const [c, a] = mk();
  stock(c, a);
  const it = Q.craft(c, a, "kiem");
  it.el = "hoa";
  const before = C.duelMods(c).burn;
  it.spirit = true;
  assert.ok(C.duelMods(c).burn > before);
});

test("độ bền giảm khi dùng, hỏng thì mất hiệu ứng, sửa được", () => {
  const [c, a] = mk();
  stock(c, a);
  const it = Q.craft(c, a, "kiem");
  const on = C.totals(c).atk;
  it.dur = 1;
  year(c, a, 8);
  assert.equal(it.dur, 0);
  assert.ok(C.totals(c).atk < on);
  assert.equal(Q.repair(c, a, it.id), true);
  assert.equal(it.dur, Q.QUAL[it.q].dur);
  assert.equal(Q.repair(c, a, it.id), false, "đầy độ bền thì không sửa");
});

test("bản mệnh: cần Kim Đan, chỉ một, lớn theo cảnh giới, không tháo được, hỏng thì trọng thương", () => {
  const [low, al] = mk({ realm: 2 });
  stock(low, al);
  const li = Q.craft(low, al, "kiem");
  assert.equal(Q.bindNatal(low, al, li.id), false);

  const [c, a] = mk({ realm: 3 });
  stock(c, a);
  const it = Q.craft(c, a, "kiem");
  const two = Q.craft(c, a, "giap");
  const p0 = Q.itemPower(c, it);
  assert.equal(Q.bindNatal(c, a, it.id), true);
  assert.equal(Q.bindNatal(c, a, two.id), false);
  assert.ok(Q.itemPower(c, it) > p0);
  const atRealm3 = Q.itemPower(c, it);
  c.realm = 6;
  assert.ok(Q.itemPower(c, it) > atRealm3);
  assert.equal(Q.toggleWorn(c, a, it.id), false);
  c.vk2.can = { injury: 0, impurity: 0, stability: 50, purity: 0, dantian: 10, open: 0, method: "can", body: { id: "pham", xp: 0 }, year: 999 };
  it.dur = 0.5;
  const hp = c.stats.sucKhoe;
  year(c, a, 8);
  assert.ok(c.stats.sucKhoe < hp, "phản phệ");
  assert.ok(c.vk2.can.injury >= 30);
});

test("phù lục dùng được trong trận: Hộ Thân tăng hộ thể rồi tiêu hao sau trận", () => {
  const [c, a] = mk();
  stock(c, a);
  assert.equal(Q.draw(c, a, "ho_than"), true);
  assert.equal(C.duelMods(c).shield, 0);
  assert.equal(Q.arm(c, a, "ho_than"), true);
  assert.ok(C.duelMods(c).shield >= 0.2);
  assert.equal(c.vk2.khi.talismans.ho_than, 0);
  Q.afterFight(c);
  assert.equal(C.duelMods(c).shield, 0);
  assert.equal(c.vk2.khi.armed, null);
});

test("phù lục dùng trong đột phá: Tĩnh Tâm cộng tỷ lệ, hết tác dụng sau lần thử", () => {
  const [c, a] = mk();
  stock(c, a);
  Q.draw(c, a, "tinh_tam");
  const b0 = C.breakBonus(c);
  Q.arm(c, a, "tinh_tam");
  assert.ok(C.breakBonus(c) > b0);
  c.breakFail = { r: 3, n: 1 };
  C.tick(c, a, 0);
  assert.equal(c.vk2.khi.armed, null);
});

test("phù lục dùng trong bí cảnh: Phá Cấm hiện lựa chọn; Độn Thổ thoát không mất máu", () => {
  const [c, a] = mk();
  stock(c, a);
  Q.draw(c, a, "don_tho");
  c.vk2.dao.open.push({ id: "chien_truong", until: 999, seed: 1 });
  assert.equal(G.enter(c, a, "chien_truong"), true);
  c.vk2.dao.run.floor = 3;
  const hp = c.stats.sucKhoe;
  G.chain(c, a).choices(c, 0).at(-1).run(c, { fx() {} });
  assert.equal(c.stats.sucKhoe, hp);
  assert.equal(c.vk2.khi.talismans.don_tho, 0);
});

test("phù không chồng nhiều lá và tan sau 10 năm", () => {
  const [c, a] = mk();
  stock(c, a);
  Q.draw(c, a, "ho_than");
  Q.draw(c, a, "ho_than");
  Q.arm(c, a, "ho_than");
  assert.equal(Q.arm(c, a, "ho_than"), false);
  year(c, a, 12);
  assert.equal(c.vk2.khi.armed, null);
});

test("động phủ: có điều kiện cảnh giới, không dễ có khi mới tu", () => {
  const [c, a] = mk({ realm: 1 });
  assert.equal(Q.found(c, a, "pham"), false);
  c.realm = 2;
  assert.equal(Q.found(c, a, "dia"), false);
  c.linhThach = 100;
  assert.equal(Q.found(c, a, "pham"), false);
  c.linhThach = 300;
  assert.equal(Q.found(c, a, "pham"), true);
  assert.equal(c.linhThach, 0);
  assert.equal(Q.found(c, a, "pham"), false, "đã có");
});

test("đủ 7 công trình; cấp bị giới hạn theo cảnh giới và tối đa 3", () => {
  assert.equal(Object.keys(Q.BUILDINGS).length, 7);
  const [c, a] = mk({ realm: 2 });
  Q.found(c, a, "pham");
  assert.equal(Q.build(c, a, "tu_linh"), true);
  assert.equal(Q.build(c, a, "tu_linh"), false, "Trúc Cơ chỉ giữ được cấp 1");
  c.realm = 7;
  assert.equal(Q.build(c, a, "tu_linh"), true);
  assert.equal(Q.build(c, a, "tu_linh"), true);
  assert.equal(Q.build(c, a, "tu_linh"), false, "tối đa 3");
});

test("công trình có tác dụng thật: tụ linh trận tăng tốc độ tu trong năm tu luyện", () => {
  const [c, a] = mk();
  Q.found(c, a, "linh");
  const m0 = C.cultMul(c);
  Q.build(c, a, "tu_linh");
  assert.ok(C.cultMul(c) > m0);
  c.focus = "du_ngoan";
  const off = C.cultMul(c);
  c.focus = "tu_luyen";
  assert.ok(C.cultMul(c) > off);
});

test("dược viên cho linh thảo mỗi năm, phí duy trì trừ thật", () => {
  const [c, a] = mk();
  Q.found(c, a, "pham");
  Q.build(c, a, "duoc_vien");
  const fee = Q.upkeep(c);
  const stones = c.linhThach;
  const herb = c.vk2.khi.mats.linh_thao ?? 0;
  year(c, a);
  assert.equal(c.linhThach, stones - fee);
  assert.ok((c.vk2.khi.mats.linh_thao ?? 0) > herb);
});

test("thiếu phí: không có thu hoạch, bỏ bê đủ lâu thì xuống cấp, không âm linh thạch", () => {
  const [c, a] = mk();
  Q.found(c, a, "pham");
  Q.build(c, a, "duoc_vien");
  c.linhThach = 0;
  const herb = c.vk2.khi.mats.linh_thao ?? 0;
  year(c, a, Q.NEGLECT_YEARS);
  assert.equal(c.vk2.khi.mats.linh_thao ?? 0, herb);
  assert.equal(c.vk2.khi.cave.b.duoc_vien, 0);
  assert.ok(c.linhThach >= 0);
});

test("cất bí thuật cần tàng kinh các", () => {
  const [c, a] = mk();
  c.vk2.dao.mastery.kiem_y = 70;
  c.vk2.dao.mastery.loi_phap = 70;
  const art = G.createArt(c, a, "loi_kiem", "");
  Q.found(c, a, "pham");
  assert.equal(Q.storeArt(c, a, art.id), false);
  Q.build(c, a, "tang_kinh");
  assert.equal(Q.storeArt(c, a, art.id), true);
  assert.equal(Q.storeArt(c, a, art.id), false, "không cất trùng");
});

test("trận thắng thật có thể rơi nguyên liệu nhưng có trần mỗi năm", () => {
  const [c, a] = mk();
  for (let i = 0; i < 200; i++) C.onKill(c, a);
  assert.ok(Q.metric("mat_total", c) <= 3);
  assert.ok(Q.metric("mat_total", c) >= 1);
});

test("sự kiện động phủ bị tấn công đi qua hàng đợi và có kết cục theo lựa chọn", () => {
  const [c, a] = mk();
  Q.found(c, a, "pham");
  const def = Q.raidDef(c, a);
  assert.equal(def.choices(c, 0).length, 2);
  const stones = c.linhThach;
  def.choices(c, 0)[1].run(c);
  assert.ok(c.linhThach < stones, "không có trận thì mất của");
  Q.build(c, a, "phong_ngu");
  const after = c.linhThach;
  Q.raidDef(c, a).choices(c, 0)[1].run(c);
  assert.equal(c.linhThach, after, "có trận thì an toàn");
});

test("thưởng nhiệm vụ không trùng, nhiệm vụ hiện trong VK2", () => {
  const [c, a] = mk();
  Q.found(c, a, "pham");
  const stones = c.linhThach;
  assert.ok(C.claim(c, a, "k_cave", 0, {}));
  assert.equal(C.claim(c, a, "k_cave", 0, {}), null);
  assert.equal(c.linhThach, stones + 200);
});

test("lưu qua JSON giữ nguyên trạng thái động phủ và pháp bảo", () => {
  const [c, a] = mk();
  stock(c, a);
  Q.craft(c, a, "kiem");
  Q.found(c, a, "pham");
  Q.build(c, a, "tu_linh");
  const copy = JSON.parse(JSON.stringify(c));
  assert.deepEqual(Q.summary(copy), Q.summary(c));
  assert.ok(Math.abs(C.cultMul(copy) - C.cultMul(c)) < 1e-9);
});
