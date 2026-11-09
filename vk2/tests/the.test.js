// Kiểm thử logic Giai đoạn 4: thế giới sống, NPC, sư đồ, tông môn, gia tộc.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
require("../dao.js");
require("../khi.js");
require("../the.js");
const C = globalThis.VK2Core;
const H = globalThis.VK2The;
const G = globalThis.VK2Dao;

function mk(over = {}, acct) {
  const c = { age: 0, name: "Lý Tầm", lifeNo: 1, realm: 3, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: 321, path: "kiem", sect: null, focus: "tu_luyen", linhThach: 100000, pills: {}, lifespan: 500, stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 5, sucKhoe: 90 }, daoTam: 0, dead: false, log: [], ...over };
  const a = acct ?? C.newAcct();
  H.ensure(c, a);
  G.ensure(c, a);
  c.age = over.age ?? 40;
  c.vk2.the.year = c.age;
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
const someNpc = (a, f) => a.world.npcs.find(f);
const forceNpc = (a, o) => Object.assign(H.addNpc(a.world, {}), { b: a.world.year - 60, ...o });

test("NPC đủ thuộc tính yêu cầu", () => {
  const [, a] = mk();
  for (const n of a.world.npcs) {
    for (const k of ["n", "b", "r", "ro", "ta", "pa", "pe", "go", "lo", "mem"]) assert.ok(n[k] !== undefined, k);
    assert.ok(n.lo > a.world.year - n.b, `${n.n} sinh ra đã quá thọ`);
  }
});

test("NPC phát triển theo năm: tu tiến, đột phá, kết đôi, sinh con, già chết", () => {
  const [, a] = mk();
  const w = a.world;
  const start = Object.fromEntries(w.npcs.map((n) => [n.id, n.r]));
  const firstIds = new Set(w.npcs.map((n) => n.id));
  H.fastForward(w, 400);
  let up = 0;
  for (const n of w.npcs) if (start[n.id] !== undefined && n.r > start[n.id]) up++;
  assert.ok(up > 0, "có người đột phá");
  assert.ok([...firstIds].some((id) => !H.npcOf(w, id)), "có người chết");
  assert.ok(w.npcs.some((n) => !firstIds.has(n.id)), "có người mới");
  assert.ok(w.npcs.some((n) => n.par), "có con cái");
  assert.ok(w.npcs.some((n) => n.sp), "có đạo lữ");
  assert.ok(w.npcs.some((n) => n.s), "có người vào tông");
});

test("dân số có trần, dung lượng thế giới không lớn dần theo năm", () => {
  const [, a] = mk();
  for (let i = 0; i < 10; i++) {
    H.fastForward(a.world, 200);
    assert.ok(a.world.npcs.length <= H.NPC_CAP + 3, `${a.world.npcs.length}`);
    assert.ok(a.world.npcs.length >= H.NPC_MIN);
  }
  assert.ok(JSON.stringify(a.world).length < 60000, `${JSON.stringify(a.world).length}`);
});

test("thế giới xác định: cùng seed cho cùng lịch sử", () => {
  const run = () => {
    const [, a] = mk();
    H.fastForward(a.world, 150);
    return JSON.stringify(a.world);
  };
  assert.equal(run(), run());
});

test("tông môn thay đổi theo sự kiện: có chiến tranh, được mất lãnh thổ, có thể biến mất", () => {
  const [, a] = mk();
  const w = a.world;
  const before = Object.fromEntries(Object.values(w.sects).map((s) => [s.n, s.terr]));
  let wars = 0;
  for (let i = 0; i < 1500; i++) {
    H.step(w);
    if (w.lastWar && w.lastWar.y === w.year) wars++;
  }
  assert.ok(wars > 0, "có chiến tranh kết thúc");
  const changed = Object.values(w.sects).some((s) => before[s.n] !== undefined && before[s.n] !== s.terr) || (w.gone ?? []).length > 0;
  assert.ok(changed, "thế lực có biến động");
});

test("kết quả chiến tranh chịu ảnh hưởng của đóng góp", () => {
  let wonWithHelp = 0;
  let wonNoHelp = 0;
  for (let i = 0; i < 40; i++) {
    for (const help of [true, false]) {
      const [c, a] = mk({ lookSeed: 1000 + i, sect: "Thanh Hà Tông" });
      const w = a.world;
      const war = { id: 999, a: "Thanh Hà Tông", b: "Huyết Sát Môn", at: w.year, until: w.year, sa: help ? 200 : 0, sb: 0 };
      w.wars = [war];
      H.endWar(w, war);
      if (war.win === "Thanh Hà Tông") help ? wonWithHelp++ : wonNoHelp++;
    }
  }
  assert.ok(wonWithHelp > wonNoHelp, `${wonWithHelp} vs ${wonNoHelp}`);
});

test("bái sư: có điều kiện, trừ lễ, có tác dụng thật; sư phụ mất thì hết tác dụng", () => {
  const [c, a] = mk({ realm: 1 });
  const low = forceNpc(a, { r: 0 });
  assert.equal(H.apprentice(c, a, low.id), false, "phải cao hơn");
  const m = forceNpc(a, { r: 3, pa: "kiem", pe: "chinh", lo: 9999 });
  const before = C.cultMul(c);
  const stones = c.linhThach;
  assert.equal(H.apprentice(c, a, m.id), true);
  assert.equal(c.linhThach, stones - H.giftCost(m));
  assert.ok(C.cultMul(c) > before);
  H.die(a.world, m, ["x", "x"]);
  c.vk2.the.year = c.age;
  year(c, a);
  assert.equal(c.vk2.the.master, null);
  assert.ok(Math.abs(C.cultMul(c) - before) < 0.08);
});

test("học từ sư phụ: tăng đạo niệm thật, cùng đạo được dạy chiêu thật, có thời gian chờ", () => {
  const [c, a] = mk({ realm: 1 });
  const m = forceNpc(a, { r: 3, pa: "kiem", pe: "chinh", lo: 9999 });
  H.apprentice(c, a, m.id);
  const mast = c.vk2.dao.mastery.kiem_y ?? 0;
  const r = H.learnFromMaster(c, a);
  assert.ok(r);
  assert.ok(c.vk2.dao.mastery.kiem_y > mast);
  assert.ok(c.cp.own.some((t) => t.id === "liet_hoa"));
  assert.equal(H.learnFromMaster(c, a), null, "chưa hết thời gian chờ");
});

test("rời sư môn có cái giá và chặn bái sư mới một thời gian", () => {
  const [c, a] = mk({ realm: 1 });
  const m = forceNpc(a, { r: 3, pe: "chinh", lo: 9999 });
  const m2 = forceNpc(a, { r: 3, pe: "chinh", lo: 9999 });
  H.apprentice(c, a, m.id);
  const tm = c.stats.tamMa;
  assert.equal(H.leaveMaster(c, a), true);
  assert.ok(c.stats.tamMa > tm);
  assert.equal(H.apprentice(c, a, m2.id), false);
});

test("đồ đệ: cần Kim Đan, có giới hạn, có tiến trình riêng", () => {
  const [low, al] = mk({ realm: 2 });
  const y0 = forceNpc(al, { r: 0, b: al.world.year - 15, lo: 500 });
  assert.equal(H.takeDisciple(low, al, y0.id), false);

  const [c, a] = mk({ realm: 3 });
  const d1 = forceNpc(a, { r: 0, b: a.world.year - 15, lo: 900, ro: 1.5, ta: "co", p: 95 });
  const d2 = forceNpc(a, { r: 0, b: a.world.year - 15, lo: 900 });
  assert.equal(H.takeDisciple(c, a, d1.id), true);
  assert.equal(d1.disc, 1);
  assert.equal(H.takeDisciple(c, a, d2.id), false, "Kim Đan chỉ một đồ đệ");
  const realm0 = d1.r;
  year(c, a, 60);
  const now = H.npcOf(a.world, d1.id);
  assert.ok(now && now.r > realm0, "đồ đệ tự tu");
});

test("truyền công thay đổi tốc độ tu của đồ đệ; không truyền được bí thuật không có", () => {
  const [c, a] = mk({ realm: 3 });
  c.vk2.dao.mastery.kiem_y = 70;
  c.vk2.dao.mastery.loi_phap = 70;
  const art = G.createArt(c, a, "loi_kiem", "Kiếm Của Ta");
  const d = forceNpc(a, { r: 0, b: a.world.year - 15, lo: 900 });
  H.takeDisciple(c, a, d.id);
  assert.equal(H.teach(c, a, d.id, "khong_co"), false);
  assert.equal(H.teach(c, a, d.id, art.id), true);
  assert.ok(d.arts.includes("Kiếm Của Ta"));
  assert.equal(d.teach, 1);
  assert.equal(H.teach(c, a, d.id, art.id), false, "có thời gian chờ");
  assert.equal(C.metric("taught", c, a), 1);
});

test("hỗ trợ đột phá và giao nhiệm vụ cho đồ đệ có kết quả thật", () => {
  const [c, a] = mk({ realm: 3 });
  const d = forceNpc(a, { r: 1, b: a.world.year - 25, lo: 900, p: 0 });
  H.takeDisciple(c, a, d.id);
  const s0 = c.linhThach;
  assert.equal(H.support(c, a, d.id), true);
  assert.equal(c.linhThach, s0 - H.supportCost(d));
  assert.equal(d.p, 30);
  assert.equal(H.sendTask(c, a, d.id), true);
  assert.equal(H.sendTask(c, a, d.id), false, "đang đi");
  const s1 = c.linhThach;
  year(c, a, H.TASK_YEARS + 1);
  const home = H.npcOf(a.world, d.id);
  if (home) {
    assert.equal(home.task, null);
    assert.ok(c.linhThach > s1, "mang đồ về");
  }
});

test("đồ đệ bị bỏ bê và có tính phản trắc có thể phản bội thành kẻ thù", () => {
  let betrayed = 0;
  for (let i = 0; i < 20; i++) {
    const [c, a] = mk({ realm: 3, lookSeed: 500 + i });
    const d = forceNpc(a, { r: 1, b: a.world.year - 25, lo: 9999, pe: "tham", aff: -10 });
    H.takeDisciple(c, a, d.id);
    d.aff = -50;
    year(c, a, 60);
    const n = H.npcOf(a.world, d.id);
    if (n?.foe) betrayed++;
  }
  assert.ok(betrayed > 0);
});

test("đồ đệ vẫn còn trong thế giới sau khi người chơi chết và sang kiếp sau", () => {
  const [c, a] = mk({ realm: 3 });
  const d = forceNpc(a, { r: 1, b: a.world.year - 25, lo: 99999 });
  H.takeDisciple(c, a, d.id);
  c.dead = true;
  c.cause = "x";
  C.tick(c, a, 0);
  assert.ok(a.history.at(-1).legacy.the.disciples.some((x) => x.id === d.id));
  const y0 = a.world.year;
  const [c2] = mk({ lifeNo: 2 }, a);
  assert.ok(a.world.year >= y0 + H.FF_MIN, "thế giới đã trôi");
  const still = H.npcOf(a.world, d.id);
  assert.ok(still);
  assert.equal(still.disc, 1);
  assert.equal(c2.vk2.the.disciples.length, 0, "kiếp mới không còn là đồ đệ trực tiếp");
});

test("cống hiến tăng theo năm trong tông, thăng chức ghi vào sectRank, có trần", () => {
  const [c, a] = mk({ sect: "Thanh Hà Tông", sectRank: 0 });
  year(c, a, 5);
  assert.ok(c.vk2.the.contrib >= 5);
  assert.equal(H.rankUp(c, a), false);
  c.vk2.the.contrib = 500;
  assert.equal(H.rankUp(c, a), true);
  assert.equal(c.sectRank, 1);
  H.rankUp(c, a);
  H.rankUp(c, a);
  assert.equal(c.sectRank, 3);
  assert.equal(H.rankUp(c, a), false);
});

test("đổi cống hiến trong kho: trừ đúng cả hai bên, đủ loại", () => {
  const [c, a] = mk({ sect: "Thanh Hà Tông", sectRank: 0 });
  c.vk2.the.contrib = 100;
  const sec = H.mySect(c, a);
  sec.store = 1000;
  assert.equal(H.exchange(c, a, "art"), true);
  assert.equal(c.vk2.the.contrib, 60);
  assert.equal(sec.store, 960);
  assert.ok(c.vk2.dao.mastery.kiem_y >= 8);
  sec.store = 1;
  assert.equal(H.exchange(c, a, "pill"), false, "kho cạn");
});

test("lập tông: không dễ khi mới tu luyện; ghi vào c.sect; người đi tiếp sau khi mất", () => {
  const [low, al] = mk({ realm: 1 });
  assert.equal(H.foundSect(low, al, "X"), null);
  const [c, a] = mk({ realm: 4, linhThach: 30000 });
  assert.equal(H.foundSect(c, a, "X"), null, "chưa có đồ đệ");
  const d = forceNpc(a, { r: 1, b: a.world.year - 25, lo: 9999 });
  H.takeDisciple(c, a, d.id);
  const sec = H.foundSect(c, a, "Vấn Đạo <Tông>");
  assert.ok(sec);
  assert.equal(c.sect, "Vấn Đạo Tông", "đã lọc ký tự");
  assert.equal(c.sectRank, 3);
  assert.equal(d.s, "Vấn Đạo Tông");
  assert.equal(c.linhThach, 30000 - H.OWN_SECT.stones - 100);
  c.dead = true;
  c.cause = "x";
  C.tick(c, a, 0);
  assert.equal(a.history.at(-1).legacy.the.ownSect, "Vấn Đạo Tông");
  assert.ok(a.world.sects["Vấn Đạo Tông"], "tông vẫn còn sau khi người lập mất");
});

test("tông bị diệt thì người chơi mất chốn về; tông của game gốc không bị xóa", () => {
  const [c, a] = mk({ sect: "Thanh Hà Tông", sectRank: 2 });
  const w = a.world;
  const sec = w.sects["Thanh Hà Tông"];
  sec.terr = 1;
  const war = { id: 1, a: sec.n, b: "Huyết Sát Môn", at: w.year, until: w.year, sa: -9999, sb: 0 };
  w.wars = [war];
  H.endWar(w, war);
  assert.equal(w.sects["Thanh Hà Tông"], undefined);
  year(c, a);
  assert.equal(c.sect, null);

  const [c2, a2] = mk({ sect: "Kiếm Cốc", sectRank: 1 });
  const s2 = H.mySect(c2, a2);
  s2.terr = 1;
  const w2 = a2.world;
  const war2 = { id: 2, a: "Kiếm Cốc", b: "Huyết Sát Môn", at: w2.year, until: w2.year, sa: -9999, sb: 0 };
  w2.wars = [war2];
  H.endWar(w2, war2);
  assert.ok(w2.sects["Kiếm Cốc"], "tông của cốt truyện gốc còn nguyên");
});

test("sự kiện chiến tranh: hiện đúng tông, đóng góp tính vào kết quả, chỉ hỏi một lần", () => {
  const [c, a] = mk({ sect: "Thanh Hà Tông", sectRank: 0, realm: 5 });
  const w = a.world;
  w.wars = [{ id: 7, a: "Thanh Hà Tông", b: "Huyết Sát Môn", at: w.year, until: w.year + 50, sa: 0, sb: 0 }];
  const def = H.nextEvent(c, a);
  assert.equal(def.id, "vk2_the_war");
  assert.equal(H.nextEvent(c, a)?.id === "vk2_the_war", false);
  assert.equal(def.choices(c, 0).length, 3);
  def.choices(c, 0)[1].run(c);
  assert.equal(w.wars[0].sa, 4);
  assert.equal(c.vk2.the.contrib, 6);
});

test("gia tộc: lập có điều kiện, góp của, mở lãnh địa cho thu nhập thật", () => {
  const [low, al] = mk({ realm: 1 });
  assert.equal(H.foundFam(low, al, "X gia"), null);
  const [c, a] = mk({ realm: 2 });
  const f = H.foundFam(c, a, "Lý gia");
  assert.ok(f);
  assert.equal(H.foundFam(c, a, "Khác"), null);
  assert.equal(H.famLand(c, a), false, "chưa đủ gia sản");
  assert.equal(H.famGive(c, a, 1000), true);
  assert.equal(H.famLand(c, a), true);
  assert.equal(f.land, 1);
  const s = c.linhThach;
  year(c, a);
  assert.equal(c.linhThach, s + 4);
});

test("hậu duệ là NPC thật: cần đạo lữ, mang huyết mạch, kiếp sau vẫn còn", () => {
  const [c, a] = mk({ realm: 3 });
  H.foundFam(c, a, "Lý gia");
  assert.equal(H.haveChild(c, a), null, "chưa có đạo lữ");
  c.partner = "Vân";
  c.vk2.dao.blood = Object.keys(G.BLOODS)[0];
  const kid = H.haveChild(c, a);
  assert.ok(kid);
  assert.equal(kid.kin, 1);
  assert.equal(kid.bl, c.vk2.dao.blood);
  assert.equal(kid.fam, "Lý gia");
  assert.equal(H.haveChild(c, a), null, "cần thời gian");
  kid.lo = 99999;
  c.dead = true;
  c.cause = "x";
  C.tick(c, a, 0);
  mk({ lifeNo: 2 }, a);
  assert.ok(H.npcOf(a.world, kid.id));
  assert.ok(a.world.fams["Lý gia"]);
});

test("con của hậu duệ cũng là hậu duệ", () => {
  const [, a] = mk();
  const w = a.world;
  const p = forceNpc(a, { kin: 3, lo: 9999, b: w.year - 40 });
  const q = forceNpc(a, { lo: 9999, b: w.year - 40 });
  p.sp = q.id;
  q.sp = p.id;
  let kid = null;
  for (let i = 0; i < 3000 && !kid; i++) {
    H.step(w);
    kid = w.npcs.find((n) => n.par === p.id || n.par === q.id);
    if (!H.npcOf(w, p.id)) break;
  }
  if (kid) assert.equal(kid.kin, 3);
});

test("mối thù từ bí cảnh thành kẻ thù thật, có trần; hóa giải được", () => {
  const [c, a] = mk({ realm: 3 });
  for (let i = 0; i < 6; i++) H.grudge(c, a, ["Tán tu", "Rogue"]);
  assert.equal(H.liveFoes(c, a).length, 3);
  const foe = H.liveFoes(c, a)[0];
  c.vk2.the.evFoe = foe.id;
  const def = H.foeDef(c, a);
  def.choices(c, 0)[1].run(c);
  assert.equal(foe.foe, 0);
  assert.equal(H.liveFoes(c, a).length, 2);
});

test("sự kiện kẻ thù vẫn dựng lại được khi đối thủ đã mất (tải lại trang)", () => {
  const [c, a] = mk();
  c.vk2.the.evFoe = 99999;
  const def = H.eventDef(c, a, "vk2_the_foe");
  assert.ok(def);
  assert.equal(def.choices(c, 0).length, 1);
});

test("nhiệm vụ không phát thưởng trùng", () => {
  const [c, a] = mk({ realm: 2 });
  H.foundFam(c, a, "Lý gia");
  const s = c.linhThach;
  assert.ok(C.claim(c, a, "t_fam", 0, {}));
  assert.equal(C.claim(c, a, "t_fam", 0, {}), null);
  assert.equal(c.linhThach, s + 200);
});

test("lưu qua JSON giữ nguyên thế giới và quan hệ", () => {
  const [c, a] = mk({ realm: 3 });
  const d = forceNpc(a, { r: 1, b: a.world.year - 25, lo: 9999 });
  H.takeDisciple(c, a, d.id);
  H.fastForward(a.world, 30);
  const a2 = JSON.parse(JSON.stringify(a));
  const c2 = JSON.parse(JSON.stringify(c));
  assert.equal(H.myDisciples(c2, a2)[0].id, d.id);
  H.fastForward(a.world, 50);
  H.fastForward(a2.world, 50);
  assert.equal(JSON.stringify(a.world), JSON.stringify(a2.world));
});

// ---------- Đồng bộ tông môn với game gốc ----------

test("thế giới mới có đủ tông môn của game, đúng phe và không bị diệt", () => {
  const a = C.newAcct();
  const w = H.world(a, { lookSeed: 5, lifeNo: 1 });
  for (const [n, lean] of [["Thanh Vân Tông", "chinh"], ["Thiên Cơ Các", "trung"], ["Huyết Sát Môn", "ta"], ["Hợp Hoan Tông", "ta"]]) {
    assert.equal(w.sects[n]?.lean, lean, n);
    assert.equal(w.sects[n].prot, true, n);
  }
});

test("thế giới của save cũ được bổ sung một lần, không ghi đè tông đã có", () => {
  const a = C.newAcct();
  const w = H.world(a, { lookSeed: 5, lifeNo: 1 });
  delete w.gameSects;
  delete w.sects["Kiếm Cốc"];
  w.sects["Thanh Vân Tông"].terr = 9;
  w.sects["Thanh Vân Tông"].lean = "trung"; // Save cũ ghi sai phe khi người chơi vào tông
  w.gone = [{ n: "Phổ Đà Sơn" }];
  delete w.sects["Phổ Đà Sơn"];
  H.world(a);
  assert.ok(w.sects["Kiếm Cốc"]);
  assert.equal(w.sects["Thanh Vân Tông"].terr, 9);
  assert.equal(w.sects["Thanh Vân Tông"].lean, "chinh");
  assert.equal(w.sects["Phổ Đà Sơn"], undefined, "tông đã diệt trong thế giới này không sống lại");
});

test("phe trả cho game: tông của mod theo mod, tông của game để game tự quyết", () => {
  const a = C.newAcct();
  H.world(a, { lookSeed: 5, lifeNo: 1 });
  assert.equal(H.sectLean(a, "Vạn Thú Sơn"), "trung");
  assert.equal(H.sectLean(a, "Thanh Hà Tông"), "chinh");
  assert.equal(H.sectLean(a, "Thanh Vân Tông"), null);
  assert.equal(H.sectLean(a, "Không có tông này"), null);
  assert.equal(H.sectLean(C.newAcct(), "Vạn Thú Sơn"), null);
});
