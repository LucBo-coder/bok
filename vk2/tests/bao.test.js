// Kiểm thử logic Tuyệt phẩm và linh thú mới.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../gear.js");
require("../data.js");
require("../core.js");
require("../can.js");
require("../bao.js");
const C = globalThis.VK2Core;
const B = globalThis.VK2Bao;
const G = globalThis.VK2Gear;

const SUPREME = [
  { id: "cp_kiem_yeu", slot: "vu_khi", rare: 3, name: "Kiếm yếu", fx: { atk: 10 } },
  { id: "cp_kiem_manh", slot: "vu_khi", rare: 3, name: "Kiếm mạnh", fx: { atk: 40 } },
  { id: "hiem_kiem", slot: "vu_khi", rare: 2, name: "Kiếm hiếm", fx: { atk: 9 } },
  { id: "cp_ao", slot: "ao", rare: 3, name: "Áo", fx: { def: 9 } },
];
G.capture([...SUPREME, ...G.ITEMS]);

function mk(over = {}) {
  const c = { age: 100, lifeNo: 1, realm: 5, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 42, focus: "tu_luyen", linhThach: 99999, pills: {}, inventory: ["cp_kiem_yeu", "cp_kiem_manh", "hiem_kiem", "cp_ao"], equipped: { vu_khi: "cp_kiem_manh" }, stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 5, sucKhoe: 80 }, daoTam: 0, log: [], ...over };
  const a = C.newAcct();
  B.ensure(c, a);
  return [c, a];
}

test("dữ liệu: 9 đồ phẩm 4, không rơi từ quái, mỗi món có thần thông, chi phí có đủ mốc", () => {
  assert.equal(G.ITEMS.length, 9);
  for (const it of G.ITEMS) {
    assert.equal(it.rare, 4);
    assert.equal(it.src, "event");
    assert.ok(typeof it.name === "string" && it.name && typeof it.desc === "string" && it.desc);
    assert.ok(Object.keys(it.perk).length);
    assert.ok(B.COST[it.minRealm], it.id);
    assert.ok(["vu_khi", "ao", "phu_kien"].includes(it.slot));
  }
  assert.equal(new Set(G.ITEMS.map((x) => x.id)).size, 9);
});

test("dữ liệu: 8 linh thú đều có phẩm, ảnh và lời gặp; id không trùng thú của game", () => {
  const old = ["kim_si", "tat_phuong", "cuu_vi", "con_bang", "bach_ho", "thanh_giao", "cung_ky", "thanh_long", "ky_lan", "huyen_vu", "hoa_phuong", "bach_lang", "kim_thu"];
  const ids = Object.keys(G.PETS);
  assert.equal(ids.length, 8);
  assert.deepEqual(ids.sort(), Object.keys(G.PET_RANK).sort());
  for (const id of ids) {
    assert.ok(!old.includes(id), id);
    assert.ok(G.PETS[id].name && G.PETS[id].meet && G.PETS[id].look.sheet, id);
    assert.ok(B.BEAST[G.PET_RANK[id]], id);
  }
});

test("đúc: thiếu tinh hoa, cảnh giới hay đồ Cực phẩm thì không đúc được, và không mất gì", () => {
  const [c, a] = mk();
  assert.equal(B.forge(c, a, "tp_doan_nhac"), null);
  assert.equal(c.linhThach, 99999);
  B.addEssence(c, a, 3);
  const [low, al] = mk({ realm: 3 });
  B.addEssence(low, al, 3);
  assert.equal(B.canForge(low, al, "tp_doan_nhac").ok, false);
  const [none, an] = mk({ inventory: ["hiem_kiem"] });
  B.addEssence(none, an, 3);
  assert.equal(B.canForge(none, an, "tp_doan_nhac").ok, false, "đồ Hiếm không dùng thay Cực phẩm được");
  const [poor, ap] = mk({ linhThach: 10 });
  B.addEssence(poor, ap, 3);
  assert.equal(B.canForge(poor, ap, "tp_doan_nhac").ok, false);
});

test("đúc: tốn đúng chi phí, dùng món Cực phẩm yếu nhất chưa mặc, tự mặc đồ mới", () => {
  const [c, a] = mk();
  B.addEssence(c, a, 5);
  const it = B.forge(c, a, "tp_doan_nhac");
  assert.equal(it.id, "tp_doan_nhac");
  assert.equal(c.vk2.bao.essence, 2);
  assert.equal(c.linhThach, 99999 - 3000);
  assert.ok(!c.inventory.includes("cp_kiem_yeu"));
  assert.ok(c.inventory.includes("cp_kiem_manh"), "món đang mặc không bị dùng");
  assert.ok(c.inventory.includes("tp_doan_nhac"));
  assert.equal(c.equipped.vu_khi, "tp_doan_nhac");
  assert.equal(B.forge(c, a, "tp_doan_nhac"), null, "không đúc hai lần");
});

test("đúc: có bản dư thì chỉ trừ bản dư, không mất món gốc; đồ đã khóa không bị dùng", () => {
  const [c, a] = mk({ inventory: ["cp_kiem_manh"], dup: { cp_kiem_manh: 1 } });
  B.addEssence(c, a, 3);
  assert.ok(B.forge(c, a, "tp_doan_nhac"));
  assert.ok(c.inventory.includes("cp_kiem_manh"));
  assert.equal(c.dup.cp_kiem_manh, undefined);
  const [l, al] = mk({ inventory: ["cp_kiem_yeu"], equipped: {}, locked: ["cp_kiem_yeu"] });
  B.addEssence(l, al, 3);
  assert.equal(B.canForge(l, al, "tp_doan_nhac").ok, false);
});

test("thần thông chỉ tính khi đang mặc và đi vào cơ chế trận chung", () => {
  const [c, a] = mk();
  assert.equal(C.duelMods(c).pierce, 0);
  B.addEssence(c, a, 3);
  B.forge(c, a, "tp_doan_nhac");
  assert.equal(C.duelMods(c).pierce, 0.06);
  c.equipped.vu_khi = undefined;
  assert.equal(C.duelMods(c).pierce, 0);
});

test("tinh hoa: có trần, chưa tới Nguyên Anh thì chưa rơi, diệt quái bị giới hạn theo năm", () => {
  const [c, a] = mk();
  B.addEssence(c, a, 99);
  assert.equal(c.vk2.bao.essence, B.ESSENCE_CAP);
  const [low, al] = mk({ realm: 3 });
  B.onRealmCleared(low, al);
  for (let i = 0; i < 2000; i++) B.onBump(low, al, "kills", 1);
  assert.equal(low.vk2.bao.essence, 0);
  const [h, ah] = mk();
  for (let i = 0; i < 5000; i++) B.onBump(h, ah, "kills", 1);
  assert.ok(h.vk2.bao.essence <= 1, "cùng một năm không rơi quá 1");
  B.onRealmCleared(h, ah);
  assert.ok(h.vk2.bao.essence >= B.CLEAR_GAIN);
});

test("sự kiện thú: chọn đánh thì đặt trường beastFight của game, gặp một lần mỗi kiếp", () => {
  const [c, a] = mk({ realm: 7 });
  const def = B.beastDef(c, "ty_huu");
  assert.equal(def.pet(), "ty_huu");
  assert.equal(B.eventDef(c, a, def.id).id, def.id);
  def.choices()[0].run(c);
  assert.equal(c.beastFight.id, "ty_huu");
  assert.ok(c.beastFight.lv >= 13 && c.beastFight.lv <= 22);
  let saw = null;
  const b = c.vk2.bao;
  for (let y = 100; y < 4000 && !saw; y++) {
    c.age = y;
    saw = B.pickBeast(c, b);
  }
  assert.ok(saw, "qua đủ năm thì có gặp");
  for (const id of Object.keys(G.PET_RANK)) b.seen[id] = 1;
  c.age = 5000;
  assert.equal(B.pickBeast(c, b), null, "đã gặp hết thì thôi");
});

test("sự kiện thú: cảnh giới thấp không gặp thần thú", () => {
  const [c, a] = mk({ realm: 2 });
  const b = B.ensure(c, a);
  for (let y = 100; y < 6000; y++) {
    c.age = y;
    const id = B.pickBeast(c, b);
    assert.ok(!id || G.PET_RANK[id] === "SR", id);
  }
});

test("thợ rèn: đủ tiền thì có tinh hoa, thiếu tiền thì không mất gì", () => {
  const [c, a] = mk();
  const before = c.linhThach;
  B.smithDef(c, a).choices()[0].run(c);
  assert.equal(c.vk2.bao.essence, 1);
  assert.equal(c.linhThach, before - 7500);
  const [p, ap] = mk({ linhThach: 5 });
  B.smithDef(p, ap).choices()[0].run(p);
  assert.equal(p.vk2.bao.essence, 0);
  assert.equal(p.linhThach, 5);
});
