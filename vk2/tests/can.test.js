// Logic căn cơ (Giai đoạn 1 của bản 3.0). Mô phỏng trên game thật nằm ở sim.js.
const test = require("node:test");
const assert = require("node:assert/strict");
require("../data.js");
require("../core.js");
require("../can.js");
const C = globalThis.VK2Core;
const D = globalThis.VK2Data;
const K = globalThis.VK2Can;
const NOW = new Date(2026, 10, 9, 12).getTime();

function mkChar(over = {}) {
  return {
    age: 0, lifeNo: 1, realm: 0, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2,
    element: "kim", lookSeed: 7, path: null, sect: null, focus: "tu_luyen", linhThach: 10, pills: {}, lifespan: 80,
    stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 5, sucKhoe: 80 }, daoTam: 0, dead: false, log: [],
    ...over,
  };
}
/** Tìm seed cho ra Phàm Thể, để kiểm thử số liệu không bị thể chất bẩm sinh làm lệch. */
function plain(over = {}) {
  for (let seed = 1; ; seed++) {
    const c = mkChar({ lookSeed: seed, ...over });
    if (K.birthBody(c) === "pham") return c;
  }
}
function live(c, a, years) {
  for (let i = 0; i < years; i++) {
    c.age = Math.floor(c.age) + 1;
    K.onYear(c, a);
    K.tick(c, a);
  }
}
/** Nhân vật được theo dõi từ lúc sinh, rồi mới đặt trạng thái. Tạo thẳng ở cảnh giới cao sẽ bị coi là save cũ. */
function fresh(over = {}) {
  const c = plain();
  const a = C.newAcct();
  K.ensure(c, a);
  Object.assign(c, over);
  c.vk2.can.year = Math.floor(c.age);
  return [c, a];
}
/** Nhân vật có duyên với thể chất này. */
function fated(id, over = {}) {
  const def = K.bodyDef.get(id);
  for (let seed = 1; ; seed++) {
    const c = mkChar({ lookSeed: seed, ...over });
    if (K.birthBody(c) === "pham" && K.hasFate(c, def)) return c;
  }
}
const grow = (method, years, over) => {
  const c = plain({ realm: 1, ...over });
  const a = C.newAcct();
  K.setMethod(c, a, method);
  live(c, a, years);
  return c;
};

test("nhân vật sinh ra có thể chất hợp lệ, phân bố hiếm và khớp linh căn", () => {
  const n = 20000;
  const count = {};
  for (let seed = 0; seed < n; seed++) {
    const element = ["kim", "moc", "thuy", "hoa", "tho"][seed % 5];
    const mul = [2, 1.7, 1.3, 1, 0.7][(seed >> 3) % 5];
    const c = mkChar({ lookSeed: seed * 2654435 + 1, element, linhCanMul: mul });
    const id = K.birthBody(c);
    assert.ok(K.bodyDef.has(id), id);
    count[id] = (count[id] ?? 0) + 1;
    const els = C.rootInfo(c).elements;
    if (id === "cuu_am") assert.ok(els.includes("thuy"));
    if (id === "chi_duong") assert.ok(els.includes("hoa"));
    if (id === "kiem_cot") assert.ok(els.includes("kim"));
    if (id === "hon_don") assert.equal(C.rootInfo(c).count, 5);
  }
  assert.ok(count.pham / n > 0.93, `Phàm Thể ${count.pham / n}`);
  assert.ok((count.tien_thien ?? 0) / n < 0.01, "Tiên Thiên Đạo Thể phải rất hiếm");
});

test("đủ 10 thể chất, mỗi thể chất có điều kiện, nhược điểm và cách phát triển", () => {
  assert.equal(K.BODIES.length, 10);
  for (const b of K.BODIES) {
    assert.ok(D.QUALITY[b.q], b.id);
    assert.ok(b.n[0] && b.how[0] && b.grow_d[0] && b.con_d[0], b.id);
    assert.ok(Object.keys(b.fx).length, `${b.id} thiếu ưu điểm`);
    const hasCon = Object.values(b.con).some((x) => x < 0) || Object.keys(b.mech).some((k) => k !== "healMul" && k !== "lifeOnce" && k !== "insight" && k !== "impMul") || b.id === "van_doc";
    assert.ok(hasCon || Object.keys(b.con).length, `${b.id} thiếu nhược điểm`);
    assert.ok(Object.keys(b.grow).length, `${b.id} thiếu cách phát triển`);
  }
});

test("nhân vật mới chưa có căn cơ thì không làm đổi chỉ số của game", () => {
  const c = plain();
  const a = C.newAcct();
  const before = C.statMul(c, { hp: 100, atk: 100, def: 100 });
  K.ensure(c, a);
  assert.deepEqual(C.statMul(c, { hp: 100, atk: 100, def: 100 }), before);
  assert.equal(C.cultMul(c), Math.max(0.1, 1 + C.totals(c).cult) * 1);
});

test("ba phương pháp có đánh đổi thật: Cưỡng ép nhanh hơn nhưng căn cơ xấu đi", () => {
  const on = grow("on", 30);
  const can = grow("can", 30);
  const cuong = grow("cuong", 30);
  assert.ok(K.METHODS.cuong.cult > K.METHODS.can.cult && K.METHODS.can.cult > K.METHODS.on.cult);
  assert.ok(cuong.vk2.can.injury > can.vk2.can.injury, "Cưỡng ép phải bị thương nhiều hơn");
  assert.ok(cuong.vk2.can.impurity > can.vk2.can.impurity, "Cưỡng ép phải tích tạp chất");
  assert.ok(on.vk2.can.stability > can.vk2.can.stability && can.vk2.can.stability > cuong.vk2.can.stability);
  assert.ok(on.vk2.can.purity > cuong.vk2.can.purity);
});

test("tốc độ tu thay đổi đúng theo phương pháp, chỉ khi đang tu luyện", () => {
  const [c, a] = fresh({ age: 30, realm: 1 });
  const base = C.cultMul(c);
  K.setMethod(c, a, "cuong");
  assert.ok(Math.abs(C.cultMul(c) / base - 1.3) < 1e-9);
  c.focus = "du_ngoan";
  assert.ok(Math.abs(C.cultMul(c) / base - 1) < 1e-9);
  c.focus = "tu_luyen";
  c.realm = 0;
  assert.ok(Math.abs(C.cultMul(c) / base - 1) < 1e-9, "phàm nhân chưa vận công được");
});

test("nhập môn không tốn hàng trăm năm: 3 kinh mạch đầu xong trong khoảng 20 năm tu", () => {
  const c = grow("can", 26, { realm: 1 });
  assert.ok(c.vk2.can.open >= 3, `mở được ${c.vk2.can.open}`);
  assert.ok(c.vk2.can.tieuCount >= 1);
});

test("tuổi nhỏ chưa tu được, và năm không tu thì không tăng căn cơ mà được dưỡng thương", () => {
  const c = plain();
  const a = C.newAcct();
  live(c, a, 5);
  assert.equal(c.vk2.can.tieuCount, 0);
  assert.equal(c.vk2.can.purity, 0);
  c.age = 20;
  c.focus = "du_ngoan";
  c.vk2.can.injury = 30;
  live(c, a, 5);
  assert.equal(c.vk2.can.injury, 20);
  assert.equal(c.vk2.can.purity, 0);
});

test("gọi lặp trong cùng một năm không tính trùng", () => {
  const c = plain({ age: 20 });
  const a = C.newAcct();
  K.ensure(c, a);
  c.vk2.can.year = 20;
  c.age = 21;
  K.onYear(c, a);
  const snap = JSON.stringify(c.vk2.can);
  K.onYear(c, a);
  K.onYear(c, a);
  assert.equal(JSON.stringify(c.vk2.can), snap);
});

test("bế quan cũng được tính là tu luyện dù trọng tâm khác", () => {
  const c = plain({ age: 20, focus: "du_ngoan" });
  const a = C.newAcct();
  K.ensure(c, a);
  c.age = 21;
  K.onYear(c, a, { closed: true });
  assert.ok(c.vk2.can.tieu > 0);
});

test("kết quả may rủi xác định theo seed: chơi lại cùng năm ra cùng kết quả", () => {
  const run = () => JSON.stringify(grow("cuong", 40).vk2.can);
  assert.equal(run(), run());
});

test("nội thương nặng đẩy tâm ma, nối vào luồng tẩu hỏa của game", () => {
  const c = plain({ age: 20 });
  const a = C.newAcct();
  K.ensure(c, a);
  c.vk2.can.injury = 90;
  const tm = c.stats.tamMa;
  const hp = c.stats.sucKhoe;
  c.age = 21;
  K.onYear(c, a);
  assert.ok(c.stats.tamMa > tm);
  assert.ok(c.stats.sucKhoe < hp);
});

test("đột phá thất bại gây nội thương đúng một lần cho mỗi lần thất bại", () => {
  const c = plain({ age: 30, realm: 1 });
  const a = C.newAcct();
  K.ensure(c, a);
  K.tick(c, a);
  const i0 = c.vk2.can.injury;
  c.breakFail = { r: 1, n: 1 };
  K.tick(c, a);
  K.tick(c, a);
  assert.equal(c.vk2.can.injury, i0 + 6);
  c.breakFail = { r: 1, n: 2 };
  K.tick(c, a);
  assert.equal(c.vk2.can.injury, i0 + 12);
});

test("đạo cơ mở khi vào Trúc Cơ, không mở sớm", () => {
  const [c, a] = fresh({ age: 30, realm: 1 });
  K.tick(c, a);
  assert.equal(c.vk2.can.pending, null);
  c.realm = 2;
  const notes = K.tick(c, a);
  assert.equal(c.vk2.can.pending.kind, "dao");
  assert.ok(notes.some((n) => n.pending === "dao"), "phải báo cho người chơi");
  assert.equal(K.tick(c, a).filter((n) => n.pending).length, 0, "không báo lặp");
});

test("phẩm chất đạo cơ phụ thuộc đầu vào, và tổn thương làm xấu đi", () => {
  const mk = (over) => {
    const c = plain({ age: 40, realm: 2 });
    const a = C.newAcct();
    K.ensure(c, a);
    Object.assign(c.vk2.can, over);
    return K.forgeBase(c, "dao");
  };
  assert.ok(mk({ purity: 70 }) > mk({ purity: 10 }));
  assert.ok(mk({ stability: 90 }) > mk({ stability: 20 }));
  assert.ok(mk({ injury: 60 }) < mk({ injury: 0 }));
  assert.ok(mk({ impurity: 60 }) < mk({ impurity: 0 }));
});

test("thiên tượng tác động lên điểm đúc, theo chính tà", () => {
  const c = plain({ age: 40, realm: 2 });
  const a = C.newAcct();
  K.ensure(c, a);
  K.captureOmen(null);
  const calm = K.forgeBase(c, "dao");
  K.captureOmen((id) => id === "linh_khi");
  assert.equal(K.forgeBase(c, "dao"), calm + 6);
  K.captureOmen((id) => id === "huyet_nguyet");
  assert.equal(K.forgeBase(c, "dao"), calm - 3);
  c.daoTam = -20;
  assert.equal(K.forgeBase(c, "dao"), calm + 6);
  K.captureOmen(null);
});

test("đúc tốn đúng tài nguyên, không đủ thì từ chối, đúc xong không đúc lại được", () => {
  const [c, a] = fresh({ age: 40, realm: 2, linhThach: 500, pills: { tu_khi: 1 } });
  K.tick(c, a);
  c.linhThach = 100;
  assert.equal(K.forge(c, "dao", "linh_thach"), null, "thiếu linh thạch");
  assert.equal(c.vk2.can.pending.kind, "dao");
  c.linhThach = 500;
  const r = K.forge(c, "dao", "linh_thach");
  assert.equal(c.linhThach, 200);
  assert.ok(r.grade >= 1);
  assert.equal(K.forge(c, "dao", "linh_thach"), null, "không đúc lần hai");
  assert.equal(c.linhThach, 200);
});

test("dùng đan để đúc tiêu đúng một viên", () => {
  const [c, a] = fresh({ age: 40, realm: 2, pills: { tu_khi: 2 } });
  K.tick(c, a);
  assert.ok(K.forge(c, "dao", "dan_duoc"));
  assert.equal(c.pills.tu_khi, 1);
});

test("để quá hạn thì căn cơ tự thành theo tự nhiên, không bao giờ chặn game", () => {
  const [c, a] = fresh({ age: 40, realm: 2 });
  K.tick(c, a);
  live(c, a, K.PENDING_YEARS + 1);
  assert.equal(c.vk2.can.pending, null);
  assert.equal(c.vk2.can.daoCo.how, "tu_nhien");
});

test("nhảy cóc qua Kim Đan vẫn có đủ đạo cơ và Kim Đan", () => {
  const [c, a] = fresh({ age: 40, realm: 1 });
  K.tick(c, a);
  c.realm = 3;
  K.tick(c, a);
  assert.ok(c.vk2.can.daoCo);
  assert.equal(c.vk2.can.pending.kind, "dan");
  K.forge(c, "dan", "tu_nhien");
  assert.ok(c.vk2.can.kimDan);
});

test("Kim Đan kế thừa đạo cơ, và phẩm chất đổi thật sức mạnh, lĩnh ngộ, tiềm năng", () => {
  const mk = (daoGrade, score) => {
    const c = plain({ age: 60, realm: 3 });
    const a = C.newAcct();
    K.ensure(c, a);
    c.vk2.can.daoCo = { grade: daoGrade, score, how: "tu_nhien", remolded: false };
    return c;
  };
  assert.ok(K.forgeBase(mk(4, 90), "dan") > K.forgeBase(mk(1, 10), "dan"));
  const low = mk(1, 10);
  const high = mk(4, 90);
  assert.ok(K.insight(high) > K.insight(low));
  assert.ok(K.meridianCap(high) > K.meridianCap(low));
  assert.ok(C.totals(high).hp > C.totals(low).hp);
});

test("căn cơ kém có đường cải tạo, một lần mỗi kiếp và phải trả giá", () => {
  const c = plain({ age: 100, realm: 3, linhThach: 10000 });
  const a = C.newAcct();
  K.ensure(c, a);
  c.vk2.can.daoCo = { grade: 1, score: 10, how: "tu_nhien", remolded: false };
  assert.equal(K.remold(c, "dao"), false, "chưa tới Nguyên Anh");
  c.realm = 4;
  const tm = c.stats.tamMa;
  assert.equal(K.remold(c, "dao"), true);
  assert.equal(c.vk2.can.daoCo.grade, 2);
  assert.equal(c.linhThach, 7000);
  assert.ok(c.vk2.can.injury > 0 && c.stats.tamMa > tm);
  assert.equal(K.remold(c, "dao"), false, "không cải tạo lần hai");
});

test("thể chất thức tỉnh đúng điều kiện, mỗi kiếp chỉ một", () => {
  const c = fated("kiem_cot", { age: 40, path: "kiem" });
  const a = C.newAcct();
  K.ensure(c, a);
  c.vk2.c.kills_kiem = 14;
  assert.equal(K.checkBody(c, a), null);
  c.vk2.c.kills_kiem = 15;
  assert.equal(K.checkBody(c, a), "kiem_cot");
  c.vk2.c.kills = 100;
  c.realm = 2;
  assert.equal(K.checkBody(c, a), null, "đã có thể chất");
  assert.equal(c.vk2.can.body.id, "kiem_cot");
});

test("đủ điều kiện mà không có duyên thì không thức tỉnh, và duyên cố định theo kiếp", () => {
  const def = K.bodyDef.get("kiem_cot");
  let withFate = 0;
  const n = 4000;
  for (let seed = 1; seed <= n; seed++) {
    const c = mkChar({ lookSeed: seed * 7919 });
    const first = K.hasFate(c, def);
    assert.equal(K.hasFate(c, def), first);
    if (first) withFate++;
  }
  assert.ok(Math.abs(withFate / n - def.fate) < 0.05, `tỷ lệ ${withFate / n}`);
});

test("thể chất mang cả ưu và nhược: không có loại nào chỉ toàn tăng", () => {
  const c = plain({ age: 40 });
  const a = C.newAcct();
  K.ensure(c, a);
  const base = C.totals(c);
  for (const b of K.BODIES) {
    c.vk2.can.body = { id: b.id, xp: 1000, innate: false };
    const t = C.totals(c);
    const moved = Object.keys(t).map((k) => t[k] - base[k]);
    assert.ok(moved.some((x) => x > 0), `${b.id} phải có lợi`);
    const worse = moved.some((x) => x < 0) || Object.keys(b.mech).length > 0;
    assert.ok(worse, `${b.id} phải có hại`);
  }
});

test("thể chất phát triển theo đúng hoạt động và tăng hiệu ứng theo giai đoạn", () => {
  const c = plain({ age: 40 });
  const a = C.newAcct();
  K.ensure(c, a);
  c.vk2.can.body = { id: "hoang_co", xp: 0, innate: false };
  const t0 = C.totals(c).hp;
  C.bump(c, a, "y_tu_luyen", 50);
  assert.equal(c.vk2.can.body.xp, 0, "tu luyện không nuôi Hoang Cổ Thánh Thể");
  C.bump(c, a, "kills", 40);
  assert.equal(c.vk2.can.body.xp, 80);
  assert.equal(K.stageOf(c.vk2.can.body.xp), 1);
  assert.ok(C.totals(c).hp > t0);
});

test("Trường Sinh Thể tăng thọ qua lifeExtra để đột phá không nuốt mất, chỉ một lần", () => {
  const c = fated("truong_sinh", { age: 120, lifespan: 200 });
  const a = C.newAcct();
  K.ensure(c, a);
  c.stats.tamMa = 10;
  assert.equal(K.checkBody(c, a), "truong_sinh");
  assert.equal(c.lifespan, 230);
  assert.equal(c.lifeExtra, 30);
  K.checkBody(c, a);
  assert.equal(c.lifespan, 230);
});

test("Vạn Độc Chi Thể không tích tạp chất; Tiên Thiên Đạo Thể chịu thương gấp đôi", () => {
  const mk = (id) => {
    const c = plain({ realm: 1 });
    const a = C.newAcct();
    K.ensure(c, a);
    c.vk2.can.body = { id, xp: 0, innate: false };
    K.setMethod(c, a, "cuong");
    live(c, a, 30);
    return c.vk2.can;
  };
  assert.equal(mk("van_doc").impurity, 0);
  assert.ok(mk("tien_thien").injury > mk("pham").injury);
});

test("cộng dồn có trần: căn cơ tối đa cùng thể chất mạnh vẫn nằm dưới softcap", () => {
  const c = plain({ age: 500, realm: 7 });
  const a = C.newAcct();
  K.ensure(c, a);
  Object.assign(c.vk2.can, { purity: 100, stability: 100, dantian: 100, open: 20 });
  c.vk2.can.daoCo = { grade: 4, score: 100, how: "x", remolded: false };
  c.vk2.can.kimDan = { grade: 4, score: 100, how: "x", remolded: false };
  c.vk2.can.body = { id: "hoang_co", xp: 999, innate: false };
  const t = C.totals(c);
  for (const k of Object.keys(t)) assert.ok(t[k] <= D.SOFTCAP[k] + 1e-9, `${k}=${t[k]}`);
});

test("save cũ không bị reset, không bị phạt, và không nhận thưởng bù", () => {
  const c = plain({ age: 90, realm: 3 });
  const a = C.newAcct();
  const v = C.ensure(c, a);
  v.c.y_tu_luyen = 60;
  v.claimed.m1_qi = "legacy";
  const kept = { realm: c.realm, cultivation: c.cultivation, stones: c.linhThach };
  const can = K.ensure(c, a);
  assert.equal(can.daoCo.grade, 2);
  assert.equal(can.kimDan.grade, 2);
  assert.equal(can.pending, null);
  assert.ok(can.open > 0);
  assert.equal(v.claimed.c_dao, "legacy");
  assert.equal(v.claimed.m1_qi, "legacy");
  assert.deepEqual({ realm: c.realm, cultivation: c.cultivation, stones: c.linhThach }, kept);
  const q = C.listQuests(c, a, NOW).find((x) => x.id === "c_dao");
  assert.equal(q.status, "claimed");
  assert.equal(C.claim(c, a, "c_dao", NOW, {}), null, "không phát thưởng bù");
});

test("lưu và tải lại giữ nguyên toàn bộ căn cơ, tiến trình tiếp tục đúng", () => {
  const c = grow("on", 25);
  const a = C.newAcct();
  const loaded = JSON.parse(JSON.stringify(c));
  assert.deepEqual(loaded.vk2.can, c.vk2.can);
  live(c, a, 5);
  live(loaded, a, 5);
  assert.deepEqual(loaded.vk2.can, c.vk2.can);
});

test("nhiệm vụ căn cơ hoàn thành bằng hành vi thật, nhận thưởng một lần", () => {
  const c = grow("can", 15);
  const a = C.newAcct();
  const stones = c.linhThach;
  const q = C.listQuests(c, a, NOW).find((x) => x.id === "c_tieu");
  assert.equal(q.status, "complete");
  assert.ok(C.claim(c, a, "c_tieu", NOW, {}));
  assert.equal(c.linhThach, stones + 20);
  assert.equal(C.claim(c, a, "c_tieu", NOW, {}), null);
  assert.equal(c.linhThach, stones + 20);
});

test("nhiệm vụ căn cơ có id không trùng và đủ dữ liệu", () => {
  const all = [...D.MAIN, ...D.REALM, ...D.LIFE, ...D.DAILY_POOL, ...K.QUESTS].map((q) => q.id);
  assert.equal(new Set(all).size, all.length);
  for (const q of K.QUESTS) {
    if (q.after) assert.ok(K.QUESTS.some((x) => x.id === q.after), q.id);
    assert.ok(q.goal[1] > 0 && q.t[0] && q.t[1], q.id);
  }
});

test("kiếp sau bắt đầu căn cơ mới, sổ kiếp ghi lại tóm tắt, không giữ sức mạnh", () => {
  const c = grow("on", 30, { realm: 1 });
  const a = C.newAcct();
  c.dead = true;
  C.tick(c, a, NOW);
  const last = a.history[a.history.length - 1];
  assert.equal(last.can.open, c.vk2.can.open);
  const next = plain({ lifeNo: 2 });
  assert.equal(K.ensure(next, a).open, 0);
  assert.equal(next.vk2.can.purity, 0);
});

test("sự kiện cộng thẳng tuổi: năm kế bắt kịp, chỉ tính một năm tu luyện", () => {
  const [c, a] = fresh({ age: 21, realm: 1 });
  K.onYear(c, a);
  const tieuBefore = c.vk2.can.tieu + c.vk2.can.tieuCount * 100;
  c.age += 41; // Sự kiện của game, không đi qua hàm năm
  assert.equal(Math.floor(c.age) - c.vk2.can.year, 41);
  live(c, a, 1);
  assert.equal(c.vk2.can.year, 63);
  const learn = 0.7 + (c.stats.ngoTinh / 100) * 0.6;
  const gained = c.vk2.can.tieu + c.vk2.can.tieuCount * 100 - tieuBefore;
  assert.ok(Math.abs(gained - K.METHODS.can.tieu * learn) < 1e-9, `tiến độ ${gained}`);
  K.onYear(c, a); // Gọi lặp trong cùng năm không tính trùng
  assert.equal(c.vk2.can.tieu + c.vk2.can.tieuCount * 100 - tieuBefore, gained);
});

test("trần kinh mạch và đan điền luôn đúng, kể cả khi cảnh giới rơi", () => {
  const c = grow("cuong", 400, { realm: 7 });
  assert.ok(c.vk2.can.open <= K.MERIDIANS.total);
  c.realm = 0;
  const a = C.newAcct();
  live(c, a, 2);
  assert.ok(c.vk2.can.dantian <= K.dantianCap(c));
});
