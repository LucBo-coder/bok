const test = require("node:test");
const assert = require("node:assert");
require("../tui.js");
const U = globalThis.VK2Tui;

const ITEMS = [
  { id: "kiem_go", slot: "vu_khi", minRealm: 0, fx: { atk: 5 } },
  { id: "kiem_sat", slot: "vu_khi", minRealm: 3, fx: { atk: 30 } },
  { id: "kiem_tien", slot: "vu_khi", minRealm: 9, fx: { atk: 90 } },
  { id: "ao_vai", slot: "ao", minRealm: 0, fx: { def: 2 } },
  { id: "ao_tien", slot: "ao", minRealm: 8, fx: { def: 60, hp: 40 } },
  { id: "ngoc", slot: "phu_kien", minRealm: 2, fx: { cult: 20 } },
];
/** Hàm chỉ số giả có cùng dạng với game: phần trăm của đồ nhân vào chỉ số gốc. */
const stats = (c) => {
  const sum = { atk: 0, def: 0, hp: 0 };
  for (const id of Object.values(c.equipped)) for (const [k, x] of Object.entries(ITEMS.find((i) => i.id === id)?.fx ?? {})) if (k in sum) sum[k] += x;
  return { atk: 100 * (1 + sum.atk / 100), def: 30 * (1 + sum.def / 100), hp: 900 * (1 + sum.hp / 100) };
};
const char = (inv, eq) => ({ inventory: inv, equipped: { ...eq } });

test("Thiên giới bắt đầu từ Chân Tiên", () => {
  assert.equal(U.worldOf({ minRealm: 7 }), "pham");
  assert.equal(U.worldOf({ minRealm: 8 }), "thien");
  assert.equal(U.worldOf({}), "pham");
});

test("trang bị nhanh chọn món mạnh nhất cho mỗi ô và không đổi c.equipped", () => {
  const c = char(["kiem_go", "kiem_sat", "kiem_tien", "ao_vai", "ao_tien", "ngoc"], { ao: "ao_vai", vu_khi: "kiem_go" });
  const best = U.bestGear(c, ITEMS, stats);
  assert.deepEqual(best, { vu_khi: "kiem_tien", ao: "ao_tien", phu_kien: "ngoc" });
  assert.deepEqual(c.equipped, { ao: "ao_vai", vu_khi: "kiem_go" });
});

test("lọc theo giới chỉ chọn đồ của giới đó", () => {
  const c = char(["kiem_go", "kiem_sat", "kiem_tien", "ao_vai", "ao_tien"], { ao: "ao_vai" });
  assert.deepEqual(U.bestGear(c, ITEMS, stats, "pham"), { vu_khi: "kiem_sat" });
  assert.deepEqual(U.bestGear(c, ITEMS, stats, "thien"), { vu_khi: "kiem_tien", ao: "ao_tien" });
});

test("không đổi khi đồ đang mặc đã tốt nhất, và bỏ qua đồ không có trong túi", () => {
  const c = char(["kiem_tien", "ao_tien"], { ao: "ao_tien", vu_khi: "kiem_tien" });
  assert.deepEqual(U.bestGear(c, ITEMS, stats), {});
  const d = char(["kiem_go"], {});
  assert.deepEqual(U.bestGear(d, ITEMS, stats), { vu_khi: "kiem_go" });
});
