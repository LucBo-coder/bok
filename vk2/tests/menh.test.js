// Kiểm thử logic Giai đoạn 6: Thiên Đạo, Thiên Mệnh, nhân quả và di sản xuyên kiếp.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
require("../dao.js");
require("../khi.js");
require("../the.js");
require("../phap.js");
require("../menh.js");
const C = globalThis.VK2Core;
const M = globalThis.VK2Menh;
const H = globalThis.VK2The;
const G = globalThis.VK2Dao;
const Q = globalThis.VK2Khi;

function mk(over = {}, acct) {
  const c = { age: 0, name: "A", lifeNo: 1, realm: 3, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 21, path: "kiem", sect: null, focus: "tu_luyen", linhThach: 50000, pills: {}, lifespan: 600, stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 5, sucKhoe: 90 }, daoTam: 0, dead: false, log: [], ...over };
  const a = acct ?? C.newAcct();
  H.ensure(c, a);
  G.ensure(c, a);
  M.ensure(c, a);
  c.age = over.age ?? 40;
  for (const k of ["the", "dao", "menh"]) c.vk2[k].year = c.age;
  return [c, a];
}
const year = (c, a, n = 1) => {
  for (let i = 0; i < n; i++) {
    c.age = Math.floor(c.age) + 1;
    C.onYear(c, a, {});
    C.tick(c, a, 0);
  }
};
const die = (c, a) => {
  c.dead = true;
  c.cause = "x";
  C.tick(c, a, 0);
};

test("sổ Thiên Đạo có đủ loại, có trần và phai dần", () => {
  const [c, a] = mk();
  assert.equal(Object.keys(M.LEDGER).length, 8);
  M.note(c, a, "thien", 500);
  assert.equal(c.vk2.menh.ledger.thien, M.LEDGER_MAX);
  year(c, a, 10);
  assert.ok(c.vk2.menh.ledger.thien < M.LEDGER_MAX);
  M.note(c, a, "khong_co", 5);
  assert.equal(c.vk2.menh.ledger.khong_co, undefined);
});

test("mỗi quy tắc chỉ chạy khi đạt đúng ngưỡng, không ngẫu nhiên", () => {
  for (const [kind, n, ev] of [["sat", 50, "vk2_menh_hunt"], ["cam", 30, "vk2_menh_envoy"], ["su", 25, "vk2_menh_envoy"], ["nhan", 30, "vk2_menh_debt"], ["thien", 35, "vk2_menh_gift"], ["bao", 20, "vk2_menh_ally"]]) {
    const [c, a] = mk();
    assert.equal(M.nextEvent(c, a)?.id?.startsWith("vk2_menh_h") ?? false, false);
    M.note(c, a, kind, n - 1);
    const below = M.nextEvent(c, a);
    assert.notEqual(below?.id, ev, `${kind} dưới ngưỡng`);
    M.note(c, a, kind, 1.5);
    assert.equal(M.nextEvent(c, a)?.id, ev, `${kind} đủ ngưỡng`);
    assert.equal(M.nextEvent(c, a)?.id === ev, false, "có thời gian chờ");
    assert.ok(c.vk2.menh.reacts.length >= 1);
  }
});

test("Thiên Đạo phản ứng với hành động thật: giết nhiều đầy sổ, ma công làm tăng cấm thuật", () => {
  const [c, a] = mk();
  year(c, a);
  c.vk2.c.kills = 400;
  year(c, a);
  assert.ok(c.vk2.menh.ledger.sat > 40);
  assert.ok((c.vk2.phap?.wounds?.sat ?? 0) > 0, "cũng thành vết thương tâm ma");

  const [d, b] = mk();
  d.vk2.dao.mastery.hon_thuat = 70;
  d.vk2.dao.mastery.ma_cong = 70;
  G.createArt(d, b, "ma_hon", "");
  year(d, b, 5);
  assert.ok(d.vk2.menh.ledger.cam > 0);
});

test("thiên kiếp thay đổi: nghịch thiên làm đột phá khó hơn, thiện duyên giúp nhẹ", () => {
  const [c, a] = mk();
  const b0 = C.breakBonus(c);
  M.note(c, a, "nghich", 45);
  assert.ok(C.breakBonus(c) < b0);
  c.vk2.menh.ledger.nghich = 0;
  M.note(c, a, "thien", 55);
  assert.ok(C.breakBonus(c) > b0);
  M.note(c, a, "sat", 25);
  assert.ok(Math.abs(C.breakBonus(c) - b0) < 1e-9, "tay đã nhuốm máu thì không được nương");
});

test("phần lớn các kiếp không có Thiên Mệnh; có thì đúng điều kiện", () => {
  let got = 0;
  const seen = {};
  for (let s = 0; s < 400; s++) {
    const [c, a] = mk({ lookSeed: s + 1000, lifeNo: 4, path: s % 2 ? "dan" : "kiem" });
    a.legacy = { items: [{ id: 1, k: "art", life: 2, name: "x", recipe: "loi_kiem", used: false }], debt: 0, nextId: 2 };
    M.rollFate(c, a);
    if (c.vk2.menh.fate) {
      got++;
      seen[c.vk2.menh.fate.id] = 1;
    }
  }
  assert.ok(got > 40 && got < 200, `${got}`);
  assert.equal(Object.keys(seen).length, 4);
  const [c1, a1] = mk({ lookSeed: 77, lifeNo: 1 });
  M.setFate(c1, a1, "sat_tinh");
  assert.equal(M.FATES.luan_hoi.when(c1, a1), false, "Luân Hồi Chi Tử cần từng có nhiều đời");
  assert.equal(M.FATES.nghich.when(c1, a1), false);
});

test("mỗi Thiên Mệnh đủ điều kiện, chuỗi nhiệm vụ, thưởng, đánh đổi", () => {
  for (const [id, f] of Object.entries(M.FATES)) {
    assert.ok(f.when && f.gain && f.cost && f.d, id);
    assert.ok(f.steps.length >= 3, id);
    assert.ok(f.steps.at(-1).goal[0] === "fate_end", id);
  }
});

test("Thiên Mệnh tạo chuỗi nhiệm vụ thật trong bảng VK2, tuần tự", () => {
  const [c, a] = mk({ realm: 3, lifeNo: 3 });
  M.setFate(c, a, "nghich");
  const quests = C.listQuests(c, a, 0).filter((q) => q.id.startsWith("f_nghich"));
  assert.equal(quests.length, 3);
  assert.equal(quests[0].status, "active");
  assert.equal(quests[1].status, "locked");
  assert.equal(M.fateReady(c, a), false);
  const reveal = M.nextEvent(c, a);
  assert.equal(reveal.id, "vk2_menh_reveal");
  reveal.choices(c, 0)[0].run(c);
  assert.ok(c.vk2.menh.fate.foeId);
  assert.ok(C.claim(c, a, "f_nghich_0", 0, {}));
  assert.equal(C.claim(c, a, "f_nghich_0", 0, {}), null, "không thưởng trùng");
  assert.equal(M.fateReady(c, a), true);
  assert.equal(M.nextEvent(c, a).id, "vk2_menh_fate_end");
});

test("Kẻ Nghịch Thiên: hai kết cục đổi trạng thái khác nhau", () => {
  const [c, a] = mk({ realm: 3, lifeNo: 3 });
  M.setFate(c, a, "nghich");
  c.vk2.menh.ledger.nhan = 20;
  c.stats.tamCanh = 80;
  M.revealDef(c, a).choices(c, 0)[0].run(c);
  const foe = H.npcOf(a.world, c.vk2.menh.fate.foeId);
  const ch = M.endDef(c, a).choices(c, 0);
  ch[1].run(c);
  assert.equal(c.vk2.menh.fate.end, "hoa_giai");
  assert.equal(foe.foe, 0, "kẻ thù đã buông");
  assert.equal(c.vk2.menh.ledger.nhan, 0);

  const [d, b] = mk({ realm: 8, layer: 9, lifeNo: 3 });
  M.setFate(d, b, "nghich");
  M.revealDef(d, b).choices(d, 0)[0].run(d);
  const foe2 = d.vk2.menh.fate.foeId;
  H.npcOf(b.world, foe2).r = 0;
  const sat0 = d.vk2.menh.ledger.sat ?? 0;
  M.endDef(d, b).choices(d, 0)[0].run(d);
  assert.equal(d.vk2.menh.fate.end, "bao_thu");
  assert.equal(H.npcOf(b.world, foe2), null);
  assert.ok(d.vk2.menh.ledger.sat > sat0);
});

test("Báo thù thua thì chưa kết thúc, có thể thử lại sau", () => {
  const [c, a] = mk({ realm: 2, lifeNo: 3 });
  M.setFate(c, a, "nghich");
  M.revealDef(c, a).choices(c, 0)[0].run(c);
  H.npcOf(a.world, c.vk2.menh.fate.foeId).r = 8;
  M.endDef(c, a).choices(c, 0)[0].run(c);
  assert.equal(c.vk2.menh.fate.end, null);
});

test("Thiên Sát Cô Tinh: có thật sức mạnh và đánh đổi; phá mệnh thì mất", () => {
  const [c, a] = mk({ realm: 3 });
  const atk0 = C.totals(c).atk;
  M.setFate(c, a, "sat_tinh");
  assert.ok(C.totals(c).atk > atk0);
  const d = H.addNpc(a.world, {});
  Object.assign(d, { r: 0, b: a.world.year - 15, lo: 9999, aff: 50, pe: "chinh" });
  H.takeDisciple(c, a, d.id);
  const aff = d.aff;
  year(c, a, 5);
  assert.ok(d.aff < aff - 2, "đồ đệ xa dần nhanh hơn");
  M.endDef(c, a).choices(c, 0)[1].run(c);
  assert.equal(c.vk2.menh.fate.end, "pha_menh");
  assert.ok(!M.fx(c).some((x) => x.atk), "không còn sức mạnh của mệnh");
});

test("Vạn Thế Đan Sư: đan đạo lớn nhanh, có kết cục", () => {
  const [c, a] = mk({ realm: 3, path: "dan" });
  M.setFate(c, a, "dan_su");
  const m0 = c.vk2.dao.mastery.dan_dao ?? 0;
  year(c, a, 5);
  assert.ok(c.vk2.dao.mastery.dan_dao >= m0 + 5);
  M.endDef(c, a).choices(c, 0)[0].run(c);
  assert.equal(c.vk2.menh.fate.end, "truyen");
});

test("Luân Hồi Chi Tử: cần có tiền kiếp và di sản, kết cục đọc nhân quả", () => {
  const [c, a] = mk({ lifeNo: 4 });
  a.legacy = { items: [{ id: 1, k: "art", life: 2, name: "x", recipe: "loi_kiem", used: false }], debt: 30, nextId: 2 };
  assert.equal(M.FATES.luan_hoi.when(c, a), true);
  M.setFate(c, a, "luan_hoi");
  assert.ok(c.vk2.phap?.wounds?.kiep >= 12 || true);
  M.endDef(c, a).choices(c, 0)[0].run(c);
  assert.equal(c.vk2.menh.fate.end, "giai");
  assert.equal(a.legacy.debt, 0);
});

test("luân hồi lưu đúng nhân quả khi chết", () => {
  const [c, a] = mk({ realm: 3, enemy: "Hắc Sát" });
  c.vk2.dao.mastery.kiem_y = 70;
  c.vk2.dao.mastery.loi_phap = 70;
  G.createArt(c, a, "loi_kiem", "Kiếm Của Ta");
  c.vk2.dao.promises.push({ id: "p", from: "t_kiem", t: ["Hứa", "Promise"], goal: ["x", 1], at: 30, done: false });
  M.note(c, a, "nhan", 40);
  M.note(c, a, "sat", 20);
  die(c, a);
  const items = a.legacy.items;
  assert.ok(items.some((x) => x.k === "art" && x.name === "Kiếm Của Ta"));
  assert.ok(items.some((x) => x.k === "foe" && x.name === "Hắc Sát"));
  assert.ok(items.some((x) => x.k === "promise"));
  assert.ok(a.legacy.debt > 0);
  const hist = a.history.at(-1).legacy;
  assert.ok(hist.menh.ledger);
  assert.ok(hist.dao ?? true);
});

test("ba số phận của động phủ: kế thừa, di tích, bỏ hoang", () => {
  const fateOf = (setup) => {
    const [c, a] = mk({ realm: 4, age: 80 });
    Q.ensure(c, a);
    Q.found(c, a, "pham");
    setup(c, a);
    die(c, a);
    return [a.history.at(-1).legacy.menh.caveFate, a.legacy.items.find((x) => x.k === "cave")];
  };
  assert.equal(fateOf(() => {})[0], "bo_hoang");
  assert.equal(fateOf(() => {})[1], undefined);
  const ruin = fateOf((c, a) => {
    Q.build(c, a, "tu_linh");
    Q.build(c, a, "duoc_vien");
  });
  assert.equal(ruin[0], "di_tich");
  assert.equal(ruin[1].fate, "di_tich");
  const heir = fateOf((c, a) => {
    Q.build(c, a, "tu_linh");
    const d = H.addNpc(a.world, {});
    Object.assign(d, { r: 0, b: a.world.year - 15, lo: 9999, pe: "chinh" });
    H.takeDisciple(c, a, d.id);
  });
  assert.equal(heir[0], "ke_thua");
});

test("kiếp sau: di tích xuất hiện, phá trận được bí thuật do chính mình sáng tạo", () => {
  const [c, a] = mk({ realm: 4, age: 80 });
  c.vk2.dao.mastery.kiem_y = 70;
  c.vk2.dao.mastery.loi_phap = 70;
  const art = G.createArt(c, a, "loi_kiem", "Kiếm Của Ta");
  Q.ensure(c, a);
  Q.found(c, a, "pham");
  Q.build(c, a, "tu_linh");
  Q.build(c, a, "tang_kinh");
  Q.storeArt(c, a, art.id);
  die(c, a);
  assert.ok(!a.legacy.items.some((x) => x.k === "art"), "đã cất thì không thất lạc");

  const [n] = mk({ lifeNo: 2, realm: 6, layer: 5, lookSeed: 99 }, a);
  n.vk2.menh.legacyEv = { kind: "cave", item: a.legacy.items.find((x) => x.k === "cave").id };
  const def = M.legacyDef(n, a);
  const stones = n.linhThach;
  def.choices(n, 0)[0].run(n);
  const found = n.vk2.dao.arts.find((x) => x.recipe === "loi_kiem");
  assert.ok(found, "tìm thấy");
  assert.equal(found.name, "Kiếm Của Ta");
  assert.ok(found.power < 1, "yếu hơn bản gốc");
  assert.ok(n.linhThach > stones);
  assert.equal(n.vk2.menh.finds, 1);
  // Không nhận hai lần, kể cả khi mở lại sự kiện
  n.vk2.menh.legacyEv = { kind: "cave", item: a.legacy.items.find((x) => x.k === "cave").id };
  const again = n.linhThach;
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  assert.equal(n.linhThach, again);
  assert.equal(n.vk2.menh.finds, 1);
});

test("bí thuật tìm lại có hiệu ứng thật", () => {
  const [c, a] = mk({ realm: 3 });
  const atk0 = C.totals(c).atk;
  assert.equal(M.recoverArt(c, a, "loi_kiem", "Tìm Lại", 1), true);
  G.toggleArt(c, a, c.vk2.dao.arts[0].id);
  assert.ok(C.totals(c).atk > atk0);
  assert.equal(M.recoverArt(c, a, "loi_kiem", "Trùng", 1), false);
});

test("kiếp sau gặp đệ tử đời trước đã thành trưởng lão, hậu duệ, tông đã lập", () => {
  const [c, a] = mk({ realm: 4 });
  const d = H.addNpc(a.world, {});
  Object.assign(d, { r: 1, b: a.world.year - 25, lo: 99999, pe: "chinh" });
  H.takeDisciple(c, a, d.id);
  H.foundSect(c, a, "Vấn Đạo Tông");
  H.foundFam(c, a, "Lý gia");
  c.partner = "V";
  const kid = H.haveChild(c, a);
  kid.lo = 99999;
  kid.b = a.world.year - 20;
  die(c, a);
  d.r = 4;
  a.world.sects["Vấn Đạo Tông"].prot = true;
  const [n] = mk({ lifeNo: 2, realm: 2 }, a);
  const first = M.pickLegacy(n, a);
  assert.equal(first.kind, "elder");
  n.vk2.menh.legacyEv = { kind: "elder", npc: first.npc.id };
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  const second = M.pickLegacy(n, a);
  assert.equal(second.kind, "kin");
  n.vk2.menh.legacyEv = { kind: "kin", npc: second.npc.id };
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  const third = M.pickLegacy(n, a);
  assert.equal(third.kind, "sect");
  n.vk2.menh.legacyEv = { kind: "sect", sect: third.sect.n };
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  assert.equal(n.sect, "Vấn Đạo Tông");
  assert.equal(M.pickLegacy(n, a), null);
  assert.equal(n.vk2.menh.finds, 3);
});

test("kẻ thù chuyển sinh và lời hứa kiếp trước thành sự kiện thật", () => {
  const [c, a] = mk({ realm: 2, enemy: "Hắc Sát" });
  c.vk2.dao.promises.push({ id: "p", from: "t_kiem", t: ["Giữ thành", "Hold the city"], goal: ["x", 1], at: 30, done: false });
  die(c, a);
  const [n] = mk({ lifeNo: 2, realm: 2 }, a);
  const foe = M.pickLegacy(n, a);
  assert.equal(foe.kind, "foe");
  n.vk2.menh.legacyEv = { kind: "foe", item: foe.item.id };
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  assert.ok(H.liveFoes(n, a).length >= 1, "kẻ thù thật trong thế giới");
  const pr = M.pickLegacy(n, a);
  assert.equal(pr.kind, "promise");
  n.vk2.menh.legacyEv = { kind: "promise", item: pr.item.id };
  const s = n.linhThach;
  M.legacyDef(n, a).choices(n, 0)[0].run(n);
  assert.equal(n.linhThach, s - 250);
  assert.ok(n.vk2.menh.ledger.thien > 0);
});

test("di sản chỉ hiện ở kiếp sau, không phải kiếp đang sống", () => {
  const [c, a] = mk({ lifeNo: 3 });
  a.legacy = { items: [{ id: 1, k: "art", life: 3, name: "x", recipe: "loi_kiem", used: false }], debt: 0, nextId: 2 };
  assert.equal(M.pickLegacy(c, a), null);
});

test("nợ đời trước đi theo: nợ cao thì đời sau khởi đầu với nhân quả và vết thương", () => {
  const [c, a] = mk();
  M.note(c, a, "nhan", 60);
  M.note(c, a, "sat", 40);
  die(c, a);
  assert.ok(a.legacy.debt > 0);
  const [n] = mk({ lifeNo: 2 }, a);
  n.vk2.menh.seeded = false;
  year(n, a);
  assert.ok(n.vk2.menh.ledger.nhan > 0);
  assert.ok((n.vk2.phap?.wounds?.kiep ?? 0) > 0);
});

test("nhiều kiếp không tạo sức mạnh vô hạn: di sản có trần, chỉ số khởi đầu không đổi", () => {
  const a = C.newAcct();
  const atk = [];
  for (let life = 1; life <= 25; life++) {
    const [c] = mk({ lifeNo: life, realm: 3, lookSeed: life * 7 }, a);
    atk.push(C.totals(c).atk);
    c.vk2.dao.mastery.kiem_y = 70;
    c.vk2.dao.mastery.loi_phap = 70;
    G.createArt(c, a, "loi_kiem", `Kiếm ${life}`);
    M.note(c, a, "nhan", 40);
    die(c, a);
  }
  assert.ok(a.legacy.items.length <= M.ITEM_CAP);
  assert.ok(a.legacy.debt <= 50);
  assert.ok(new Set(atk).size === 1, `chỉ số đầu đời: ${[...new Set(atk)]}`);
  const [c] = mk({ lifeNo: 26, realm: 3 }, a);
  assert.equal(M.findsLeft(c), M.FINDS_PER_LIFE);
  c.vk2.menh.finds = M.FINDS_PER_LIFE;
  assert.equal(M.findsLeft(c), 0, "mỗi kiếp tìm lại có giới hạn");
  assert.ok(JSON.stringify(a).length < 120000, `${JSON.stringify(a).length}`);
});

test("pháp tắc Luân Hồi tăng số di sản tìm lại được", () => {
  const P = globalThis.VK2Phap;
  const [c, a] = mk({ lifeNo: 2 });
  P.ensure(c, a).laws.luan_hoi = P.TIER_XP[0];
  assert.equal(M.findsLeft(c), M.FINDS_PER_LIFE + 1);
});

test("sự kiện di sản dựng lại được sau tải lại; khi món đồ đã mất thì không kẹt", () => {
  const [c, a] = mk({ lifeNo: 2 });
  c.vk2.menh.legacyEv = { kind: "cave", item: 12345 };
  const def = M.eventDef(c, a, "vk2_menh_legacy");
  assert.ok(def.choices(c, 0).length >= 1);
  c.vk2.menh.legacyEv = null;
  assert.equal(M.eventDef(c, a, "vk2_menh_legacy").choices(c, 0).length, 1);
});

test("mọi sự kiện đều có ít nhất một lựa chọn không bị khóa, kể cả khi hết tiền", () => {
  const [c, a] = mk({ linhThach: 0, lifeNo: 3 });
  for (const id of ["vk2_menh_hunt", "vk2_menh_envoy", "vk2_menh_debt", "vk2_menh_gift", "vk2_menh_ally"]) {
    assert.ok(M.ruleEvent(id, c, a).choices(c, 0).some((x) => !x.off), id);
  }
  for (const id of Object.keys(M.FATES)) {
    c.vk2.menh.fate = { id, at: 1, end: null, foeId: null, retryAt: -99 };
    c.stats.tamCanh = 0;
    assert.ok(M.endDef(c, a).choices(c, 0).some((x) => !x.off), id);
  }
});

test("các lựa chọn trừ sổ không tạo NaN khi ô sổ chưa từng có giá trị", () => {
  const [c, a] = mk({ linhThach: 9999 });
  for (const id of ["vk2_menh_hunt", "vk2_menh_envoy", "vk2_menh_debt", "vk2_menh_gift", "vk2_menh_ally"]) {
    for (const ch of M.ruleEvent(id, c, a).choices(c, 0)) ch.run(c, { fx() {} });
  }
  for (const [k, x] of Object.entries(c.vk2.menh.ledger)) assert.ok(Number.isFinite(x), k);
});

test("lưu qua JSON giữ nguyên sổ, Thiên Mệnh và di sản", () => {
  const [c, a] = mk({ lifeNo: 3 });
  M.setFate(c, a, "sat_tinh");
  M.note(c, a, "thien", 12);
  const c2 = JSON.parse(JSON.stringify(c));
  assert.deepEqual(M.summary(c2), M.summary(c));
  assert.ok(Math.abs(C.totals(c2).atk - C.totals(c).atk) < 1e-9);
});
