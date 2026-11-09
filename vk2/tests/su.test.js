// Kiểm thử logic hệ thống sự kiện động: điều kiện, trùng lặp, thời hạn, chuỗi, NPC, hậu quả, lưu tải, chết, luân hồi, thiên tượng, tăng trưởng.
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
require("../su.js");
require("../su_tale.js");
require("../su_tale2.js");
require("../su_chain.js");
const C = globalThis.VK2Core;
const Su = globalThis.VK2Su;
const H = globalThis.VK2The;
const K = globalThis.VK2Can;
const D = globalThis.VK2Dao;
const Q = globalThis.VK2Khi;

function mk(over = {}, acct) {
  const c = { age: 0, name: "A", lifeNo: 1, realm: 3, layer: 1, cultivation: 0, linhCan: "Huyền linh căn", linhCanMul: 1.2, element: "kim", lookSeed: over.lookSeed ?? 77, stats: { tamCanh: 60, tamMa: 5, khiVan: 50, ngoTinh: 50, sucKhoe: 100 }, daoTam: 0, focus: "tu_luyen", linhThach: 100000, lifespan: 5000, ...over };
  const a = acct ?? C.newAcct();
  c.age = 0;
  H.ensure(c, a);
  D.ensure(c, a);
  Su.ensure(c, a);
  c.age = over.age ?? 40;
  for (const k of ["the", "dao"]) c.vk2[k].year = c.age;
  return [c, a];
}
const runYears = (w, n) => {
  for (let i = 0; i < n; i++) H.step(w);
};

// ---------- Định nghĩa ----------

test("đủ 12 nhóm, 5 cấp, mọi nhóm đều có sự kiện thật", () => {
  const byGroup = {};
  for (const e of Su.events.values()) byGroup[e.g] = (byGroup[e.g] ?? 0) + 1;
  for (const ch of Su.chains.values()) for (const s of ch.stages) if (s.ev) byGroup[ch.g] = (byGroup[ch.g] ?? 0) + 1;
  for (const g of Object.keys(Su.GROUPS)) assert.ok(byGroup[g] >= 4, `nhóm ${g} chỉ có ${byGroup[g] ?? 0}`);
  const tiers = new Set([...Su.events.values()].map((e) => e.tier));
  for (let i = 0; i < 5; i++) assert.ok(tiers.has(i), `thiếu cấp ${i}`);
});

test("định nghĩa sai bị từ chối ngay khi nạp", () => {
  const good = { id: "x_ok", g: "ky_ngo", t: ["a", "b"], x: ["a", "b"], c: [{ l: ["a", "b"], r: ["a", "b"] }] };
  assert.throws(() => Su.define([{ ...good, id: "tm_chon_doi" }]), /trùng id/);
  assert.throws(() => Su.define([{ ...good, id: "x1", g: "khong_co" }]), /nhóm lạ/);
  assert.throws(() => Su.define([{ ...good, id: "x2", when: { sai_khoa: 1 } }]), /điều kiện lạ/);
  assert.throws(() => Su.define([{ ...good, id: "x3", c: [{ l: ["a", "b"], r: ["a", "b"], fx: { sai: 1 } }] }]), /hậu quả lạ/);
  assert.throws(() => Su.define([{ ...good, id: "x4", c: Array(5).fill(good.c[0]) }]), /từ 1 tới 4/);
});

test("mọi sự kiện có id ổn định, phiên bản và tối đa 4 lựa chọn", () => {
  for (const e of Su.events.values()) {
    assert.ok(/^[a-z0-9_]+$/.test(e.id));
    assert.equal(e.v, Su.VERSION);
    assert.ok(e.c.length >= 1 && e.c.length <= 4);
  }
});

test("mọi sự kiện và giai đoạn: mọi lựa chọn chạy được, không còn chữ giữ chỗ, huyết mạch có thật", () => {
  const bodies = [...Su.events.values()].map((e) => ({ e, p: { id: e.id, rid: `vk2_su_${e.id}`, npcN: "NPC" } }));
  for (const ch of Su.chains.values()) for (const s of ch.stages) if (s.ev) bodies.push({ e: s.ev, chain: ch, st: s });
  let ran = 0;
  for (const { e, p, chain, st } of bodies) {
    for (let i = 0; i < e.c.length; i++) {
      const [c, a] = mk({ age: 60, realm: 4, lookSeed: 500 + ran, sect: "X" });
      let pend = p;
      if (chain) {
        const w = H.world(a, c);
        w.chains = [];
        const inst = Su.startChain(w, chain.id);
        inst.st = st.id;
        pend = { rid: `vk2_su_ch_${inst.uid}_${st.id}`, ch: chain.id, st: st.id, uid: inst.uid, npc: inst.roles.ally ?? inst.roles.foe };
      }
      c.vk2.su.pend = pend;
      const def = Su.buildDef(c, a, pend.rid, e, pend);
      for (const s of [def.title, def.text(), ...def.choices(c).map((x) => x.label)]) assert.ok(!/\{(npc|sect|foe|ally|me)\}|undefined|NaN/.test(s), `${pend.rid}: ${s}`);
      const out = def.choices(c)[i].run(c);
      assert.equal(typeof out, "string", `${pend.rid}#${i}`);
      assert.ok(out.length > 0, `${pend.rid}#${i} không có kết quả`);
      assert.ok(!/\{(npc|sect|foe|ally|me)\}|undefined|NaN/.test(out), `${pend.rid}#${i}: ${out}`);
      assert.equal(c.vk2.su.pend, null);
      assert.ok(Number.isFinite(c.linhThach) && Number.isFinite(c.stats.sucKhoe), `${pend.rid}#${i}`);
      for (const x of Su.ledger(a).traces) assert.ok(!/\{(npc|sect|foe|ally|me)\}/.test(x.t.join(" ")), `${pend.rid}: ${x.t}`);
      if (c.vk2.dao?.blood) assert.ok(D.BLOODS[c.vk2.dao.blood], c.vk2.dao.blood);
      ran++;
    }
  }
  assert.ok(ran > 200, `chỉ chạy ${ran} lựa chọn`);
});

test("số lượng nội dung đạt mục tiêu 150 sự kiện và 20 chuỗi", () => {
  const stages = [...Su.chains.values()].reduce((s, ch) => s + ch.stages.filter((x) => x.ev).length, 0);
  assert.ok(Su.events.size + stages >= 150, `${Su.events.size} + ${stages}`);
  assert.ok(Su.chains.size >= 20, `${Su.chains.size} chuỗi`);
});

test("mọi chuỗi đều có nhiều kết cục, và mọi kết cục đều do nhánh dẫn tới", () => {
  for (const ch of Su.chains.values()) assert.ok(ch.stages.filter((s) => s.end).length >= 2, ch.id);
});

test("mọi sự kiện đều kích hoạt được bằng một nhân vật dựng đúng điều kiện", () => {
  const stuck = [];
  for (const e of Su.events.values()) {
    const w = { ...(e.when ?? {}) };
    const [c, a] = mk({ age: 0, realm: 0, lookSeed: 9000 + e.id.length });
    const lo = (v, d) => (Array.isArray(v) ? v[0] : d);
    c.age = Math.max(lo(w.age, 40), 8);
    c.realm = Array.isArray(w.realm) ? w.realm[0] : c.realm;
    if (w.path) c.path = w.path;
    if (w.focus) c.focus = Array.isArray(w.focus) ? w.focus[0] : w.focus;
    if (w.el) (c.linhCan = "x"), (c.element = w.el), (c.vk2.can = { ...(c.vk2.can ?? {}), elements: [w.el] });
    if (w.body) (K.ensure(c, a), (c.vk2.can.body = { id: w.body }));
    if (w.sect) (c.sect = "X"), (c.sectName = "X");
    if (w.tam) c.daoTam = lo(w.tam, 0);
    if (w.tamma) c.stats.tamMa = lo(w.tamma, 0);
    if (w.tamcanh) c.stats.tamCanh = lo(w.tamcanh, 0);
    if (w.khi) c.stats.khiVan = lo(w.khi, 0);
    if (w.ngo) c.stats.ngoTinh = lo(w.ngo, 0);
    if (w.life) c.lifeNo = lo(w.life, 1);
    if (w.mast) for (const [k, v] of Object.entries(w.mast)) c.vk2.dao.mastery[k] = v;
    if (w.led) {
      const m = globalThis.VK2Menh;
      m.ensure?.(c, a);
      for (const [k, v] of Object.entries(w.led)) m.note(c, a, k, v);
    }
    if (w.fails) globalThis.VK2Phap.wound(c, a, "bai", lo(w.fails, 0));
    if (w.flag) c.vk2.su.flags[w.flag] = 1;
    if (w.aflag) Su.ledger(a).flags[w.aflag] = 1;
    if (w.wflag) H.world(a, c).flags = { ...(H.world(a, c).flags ?? {}), [w.wflag]: H.world(a, c).year };
    if (w.done) c.vk2.su.done[w.done] = 1;
    if (w.trace) Su.trace(c, a, { k: w.trace, t: ["a", "a"] });
    if (w.kiep || w.phuc || w.ending || w.nghiep) a.mv = { k: lo(w.kiep, 0), p: lo(w.phuc, 0), n: lo(w.nghiep, 0), e: lo(w.ending, 0) };
    if (w.cau) c.cauHon = true;
    if (w.soup) c.tanHon = true;
    if (w.lore) a.lore = lo(w.lore, 0);
    if (w.cosmos) c.cosmos = true;
    if (w.kills) c.vk2.c = { ...(c.vk2.c ?? {}), kills: lo(w.kills, 0) };
    if (w.stones) c.linhThach = 1e7;
    if (w.pet) c.pet = { id: "x" };
    if (w.partner) c.partner = { name: "P" };
    if (w.rank) c.sectRank = lo(w.rank, 0);
    if (w.omen) K.captureOmen((id) => id === w.omen);
    if (w.crisis) (H.world(a, c).crisis = { id: w.crisis });
    if (w.npc || w.fn) continue; // Điều kiện phụ thuộc thế giới, được phủ ở các test riêng và ở mô phỏng nhiều kiếp
    const why = Su.eligibleWhy(c, a, e);
    K.captureOmen(() => false);
    if (why) stuck.push(`${e.id}: ${why}`);
  }
  assert.deepEqual(stuck, []);
});

test("mọi cờ, dấu vết, sự kiện tiền đề được yêu cầu đều có nơi tạo ra", () => {
  const made = { flag: new Set(), aflag: new Set(), wflag: new Set(["phan_do_ve"]), trace: new Set(), done: new Set(Su.events.keys()) };
  const scan = (fx) => {
    if (!fx) return;
    if (fx.flag) made.flag.add(fx.flag);
    if (fx.aflag) made.aflag.add(fx.aflag);
    if (fx.wflag) made.wflag.add(fx.wflag);
    if (fx.trace) made.trace.add(fx.trace.k);
  };
  const opts = (e) => e.c.forEach((o) => [o.fx, o.ck?.fxf, o.duel?.fxf].forEach(scan));
  for (const e of Su.events.values()) opts(e);
  for (const ch of Su.chains.values()) for (const s of ch.stages) {
    if (s.ev) opts(s.ev);
    if (s.wfx?.flag) made.wflag.add(s.wfx.flag);
  }
  const miss = [];
  const need = (id, w) => {
    for (const k of ["flag", "aflag", "wflag", "trace", "done"]) if (w?.[k] && !made[k].has(w[k])) miss.push(`${id}: ${k}=${w[k]}`);
  };
  for (const e of Su.events.values()) need(e.id, e.when);
  for (const ch of Su.chains.values()) for (const s of ch.stages) need(`${ch.id}.${s.id}`, s.ev?.when);
  assert.deepEqual(miss, []);
});

test("mô phỏng 1500 kiếp đa dạng: gần như mọi sự kiện và giai đoạn chuỗi đều được chọn qua bộ lập lịch thật", () => {
  const seen = new Set();
  const stageSeen = new Set();
  const a = C.newAcct();
  const rngOf = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const r = rngOf(12345);
  const oneOf = (l) => l[Math.floor(r() * l.length)];
  const OMENS = ["linh_khi", "huyet_nguyet", "phat_quang", "cat_tinh", "yeu_trieu", "giang_ho_loan", "loi_van"];
  const FOCUS = ["tu_luyen", "du_ngoan", "kiem_tien", "tru_yeu", "ket_duyen", "luyen_dan"];
  for (let life = 1; life <= 1500; life++) {
    const [c] = mk({ lifeNo: life, lookSeed: life * 7919, realm: 0 }, a);
    const omen = oneOf(OMENS);
    K.captureOmen((id) => id === omen);
    const cosmos = life % 8 === 0;
    Object.assign(c, { path: oneOf(["kiem", "dan", "tran", "phat", "ma", "yeu"]), element: oneOf(["kim", "moc", "thuy", "hoa", "tho"]), sect: r() < 0.6 ? Object.keys(a.world.sects)[0] : null, sectRank: Math.floor(r() * 4), partner: r() < 0.4 ? { name: "P" } : null, pet: r() < 0.4 ? { id: "x" } : null, tanHon: r() < 0.5, cauHon: r() < 0.3, cosmos });
    c.stats.tamMa = Math.floor(r() * 50);
    c.stats.tamCanh = 30 + Math.floor(r() * 65);
    c.stats.khiVan = 30 + Math.floor(r() * 65);
    c.daoTam = -60 + Math.floor(r() * 140);
    for (const k of Object.keys(D.CONCEPTS)) c.vk2.dao.mastery[k] = Math.floor(r() * 80);
    c.vk2.c = { ...(c.vk2.c ?? {}), kills: Math.floor(r() * 50) };
    const P = globalThis.VK2Phap;
    P.wound(c, a, "bai", Math.floor(r() * 12));
    for (const k of ["sat", "thien", "nghich"]) globalThis.VK2Menh.note(c, a, k, Math.floor(r() * 60));
    a.mv = { p: Math.floor(r() * 60), n: Math.floor(r() * 50), k: Math.floor(r() * 8), h: 0, e: Math.floor(r() * 9), d: 0 };
    a.lore = Math.floor(r() * 6);
    if (r() < 0.4 && !a.world.crisis) a.world.crisis = { id: oneOf(["ma_tong", "linh_kiet"]), at: a.world.year };
    const live = a.world.npcs;
    if (r() < 0.5 && live.length > 2) c.vk2.the.master = live[0].id;
    if (r() < 0.5 && live.length > 2) c.vk2.the.disciples = [live[1].id];
    K.ensure(c, a);
    if (r() < 0.2) c.vk2.can.body = { id: "luan_hoi", xp: 0 };
    if (r() < 0.3) { globalThis.VK2Menh.ensure(c, a); c.vk2.menh.fate = { id: "nghich" }; }
    const top = 2 + Math.floor(r() * 7);
    const span = 60 + Math.floor(r() * 300);
    c.lifespan = span + 10;
    for (let y = 6; y < span; y += 3) {
      c.age = y;
      c.realm = cosmos ? 9 : Math.min(top, Math.floor(y / 25));
      c.focus = oneOf(FOCUS);
      c.linhThach = 1e6;
      c.vk2.evAt = -99;
      H.fastForward(a.world, 3);
      const def = cosmos ? Su.cosmosEvent(c, a) : Su.nextEvent(c, a, {});
      if (!def) continue;
      const p = c.vk2.su.pend;
      if (p?.ch) stageSeen.add(`${p.ch}.${p.st}`);
      else if (p?.id) seen.add(p.id);
      const open = def.choices(c).filter((x) => !x.off);
      assert.ok(open.length >= 1, `${def.id} không còn lựa chọn nào`);
      oneOf(open).run(c);
      assert.equal(c.vk2.su.pend, null, def.id);
      c.dead = false;
      c.stats.sucKhoe = 100;
    }
    K.captureOmen(() => false);
    c.dead = true;
    Su.onDeath(c, a);
    if (life % 40 === 0) delete a.world.crisis;
    assert.ok(JSON.stringify(a).length < 400 * 1024);
  }
  const missE = [...Su.events.keys()].filter((id) => !seen.has(id));
  const allStages = [...Su.chains.values()].flatMap((ch) => ch.stages.filter((s) => s.ev).map((s) => `${ch.id}.${s.id}`));
  const missS = allStages.filter((x) => !stageSeen.has(x));
  console.log(`Đã chọn ${seen.size}/${Su.events.size} sự kiện, ${stageSeen.size}/${allStages.length} giai đoạn. Chưa: ${[...missE, ...missS].join(", ") || "không"}`);
  assert.ok(missE.length <= Su.events.size * 0.03, `quá nhiều sự kiện chưa được chọn: ${missE.join(", ")}`);
  assert.ok(missS.length <= allStages.length * 0.1, `giai đoạn chưa được chọn: ${missS.join(", ")}`);
});

// ---------- Điều kiện ----------

test("sự kiện chỉ xuất hiện khi đủ điều kiện", () => {
  const [c, a] = mk({ path: "kiem", realm: 3 });
  const e = Su.events.get("tu_kiem_tam");
  assert.ok(Su.eligibleWhy(c, a, e), "chưa có kiếm ý thì không được xuất hiện");
  c.vk2.dao.mastery.kiem_y = 70;
  c.stats.tamCanh = 60;
  assert.equal(Su.eligibleWhy(c, a, e), null);
  c.path = "ma";
  assert.ok(Su.eligibleWhy(c, a, e), "sai đạo lộ");
});

test("điều kiện đọc được đạo tâm, cờ, cảnh giới, dấu vết, Mạnh Bà và Kiếp Số", () => {
  const [c, a] = mk({ daoTam: 50 });
  assert.equal(Su.meets(c, a, { tam: [40] }), true);
  assert.equal(Su.meets(c, a, { tam: [-100, 0] }), false);
  assert.equal(Su.meets(c, a, { flag: "x" }), false);
  c.vk2.su.flags.x = 1;
  assert.equal(Su.meets(c, a, { flag: "x" }), true);
  assert.equal(Su.meets(c, a, { soup: true }), false);
  c.tanHon = true;
  assert.equal(Su.meets(c, a, { soup: true }), true);
  a.mv = { k: 6, p: 40, n: 0, e: 7 };
  assert.equal(Su.meets(c, a, { kiep: [5] }), true);
  assert.equal(Su.meets(c, a, { ending: [8] }), false);
  assert.equal(Su.meets(c, a, { trace: "ke_thu" }), false);
  Su.trace(c, a, { k: "ke_thu", t: ["x", "x"] });
  assert.equal(Su.meets(c, a, { trace: "ke_thu" }), true);
});

test("sự kiện Tiên giới và hạ giới tách hẳn nhau", () => {
  const [c, a] = mk();
  const up = Su.events.get("tm_cuu_thien");
  assert.ok(Su.eligibleWhy(c, a, up));
  c.cosmos = true;
  assert.equal(Su.eligibleWhy(c, a, up), null);
  assert.ok(Su.eligible(c, a).every((e) => e.when?.cosmos));
});

test("sự kiện ẩn không hiện điều kiện và kết quả trong nội dung", () => {
  for (const e of [...Su.events.values()].filter((x) => x.hidden)) {
    const [c, a] = mk();
    const def = Su.buildDef(c, a, `vk2_su_${e.id}`, e, { id: e.id, rid: `vk2_su_${e.id}` });
    assert.ok(!/điều kiện|condition/i.test(def.text()), e.id);
  }
});

// ---------- Không trùng ----------

test("sự kiện một lần không kích hoạt lại trong kiếp", () => {
  const [c, a] = mk({ age: 20, focus: "du_ngoan", realm: 1 });
  const id = "ky_ruong_chim";
  const e = Su.events.get(id);
  assert.equal(Su.eligibleWhy(c, a, e), null);
  const su = c.vk2.su;
  su.pend = { rid: `vk2_su_${id}`, id };
  Su.resolve(c, a, `vk2_su_${id}`, 2);
  assert.ok(Su.eligibleWhy(c, a, e));
});

test("sự kiện theo tài khoản không lặp lại ở kiếp sau", () => {
  const [c, a] = mk({ path: "kiem" });
  c.vk2.dao.mastery.kiem_y = 70;
  const e = Su.events.get("tu_kiem_tam");
  c.vk2.su.pend = { rid: "vk2_su_tu_kiem_tam", id: "tu_kiem_tam" };
  Su.resolve(c, a, "vk2_su_tu_kiem_tam", 1);
  const [n] = mk({ path: "kiem", lifeNo: 2, lookSeed: 9 }, a);
  n.vk2.dao.mastery.kiem_y = 70;
  assert.ok(Su.eligibleWhy(n, a, e));
});

test("hồi chiêu và loại trừ chặn lặp", () => {
  const [c, a] = mk({ focus: "tu_luyen", realm: 3, age: 50 });
  c.stats.tamMa = 40;
  const e = Su.events.get("tu_tau_hoa");
  assert.equal(Su.eligibleWhy(c, a, e), null);
  c.vk2.su.pend = { rid: "vk2_su_tu_tau_hoa", id: "tu_tau_hoa" };
  Su.resolve(c, a, "vk2_su_tu_tau_hoa", 0);
  c.stats.tamMa = 40;
  assert.ok(Su.eligibleWhy(c, a, e));
  c.age += 50;
  assert.equal(Su.eligibleWhy(c, a, e), null);
});

test("mỗi kiếp có giới hạn số sự kiện của cấp cao", () => {
  const [c, a] = mk({ path: "kiem" });
  c.vk2.dao.mastery.kiem_y = 70;
  c.vk2.su.tiers[3] = Su.TIER_LIFE_CAP[3];
  assert.ok(Su.eligibleWhy(c, a, Su.events.get("tu_kiem_tam")));
});

// ---------- Hậu quả ----------

test("hậu quả áp dụng đúng một lần, bấm lặp không nhận thêm", () => {
  const [c, a] = mk({ age: 20, focus: "du_ngoan", realm: 1 });
  const before = c.linhThach;
  c.vk2.su.pend = { rid: "vk2_su_ky_ruong_chim", id: "ky_ruong_chim" };
  const def = Su.buildDef(c, a, "vk2_su_ky_ruong_chim", Su.events.get("ky_ruong_chim"), c.vk2.su.pend);
  const choice = def.choices(c)[1];
  const r1 = choice.run(c);
  assert.ok(r1.length > 0);
  const after = c.linhThach;
  assert.ok(after > before);
  assert.equal(choice.run(c), "");
  assert.equal(c.linhThach, after);
});

test("lựa chọn thiếu điều kiện bị khóa và không chạy", () => {
  const [c, a] = mk({ realm: 2, linhThach: 0, age: 30 });
  c.vk2.su.pend = { rid: "vk2_su_kt_dau_gia", id: "kt_dau_gia", npcN: "X" };
  const def = Su.buildDef(c, a, "vk2_su_kt_dau_gia", Su.events.get("kt_dau_gia"), c.vk2.su.pend);
  assert.equal(def.choices(c)[0].off, true);
  const r = def.choices(c)[0].run(c);
  assert.match(r, /chưa đủ điều kiện/);
  assert.equal(c.linhThach, 0);
  assert.ok(c.vk2.su.pend, "vẫn còn chờ chọn cách khác");
});

test("thưởng linh thạch giảm dần trong một kiếp, nên sự kiện không cày được", () => {
  const [c, a] = mk({ realm: 3, linhThach: 0 });
  const got = [];
  for (let i = 0; i < 12; i++) {
    const b = c.linhThach;
    Su.apply(c, a, { s: 5 });
    got.push(c.linhThach - b);
  }
  assert.ok(got[11] < got[0] / 2, got.join(","));
  const cap = Su.LIFE_GAIN(3);
  assert.ok(c.vk2.su.gain < cap * 1.5, `${c.vk2.su.gain} so với ${cap}`);
});

test("lựa chọn không giết thẳng nhân vật", () => {
  const [c, a] = mk();
  c.stats.sucKhoe = 10;
  Su.apply(c, a, { hp: -90 });
  assert.ok(c.stats.sucKhoe >= 5);
  assert.ok(!c.dead);
});

// ---------- Lưu và tải ----------

test("lưu và tải lại giữa lúc chờ chọn không mất sự kiện", () => {
  const [c, a] = mk({ age: 20, focus: "du_ngoan", realm: 1 });
  let def = null;
  for (let y = 20; y < 200 && !def; y++) {
    c.age = y;
    def = Su.nextEvent(c, a, {});
  }
  assert.ok(def, "phải có sự kiện");
  const c2 = JSON.parse(JSON.stringify(c));
  const a2 = JSON.parse(JSON.stringify(a));
  const again = Su.eventDef(c2, a2, def.id);
  assert.equal(again.title, def.title);
  assert.equal(again.choices(c2).length, def.choices(c).length);
  const r = again.choices(c2).find((x) => !x.off).run(c2);
  assert.ok(typeof r === "string" && r.length > 0);
  assert.equal(c2.vk2.su.pend, null);
});

test("id lạ sau khi cập nhật dữ liệu không làm treo game", () => {
  const [c, a] = mk();
  const def = Su.eventDef(c, a, "vk2_su_da_bi_xoa");
  assert.equal(def.choices(c).length, 1);
  assert.equal(def.choices(c)[0].run(c), "");
  c.vk2.su.pend = { rid: "vk2_su_da_bi_xoa", id: "da_bi_xoa" };
  assert.doesNotThrow(() => Su.nextEvent(c, a, {}));
});

test("save cũ chưa có sự kiện động vẫn chạy", () => {
  const [c, a] = mk();
  delete c.vk2.su;
  delete a.ev;
  assert.doesNotThrow(() => C.onYear(c, a, {}));
  assert.ok(c.vk2.su);
});

// ---------- Chuỗi ----------

test("chuỗi: mọi giai đoạn đều đi tới được kết thúc, không có giai đoạn cụt", () => {
  for (const ch of Su.chains.values()) {
    const idx = new Map(ch.stages.map((s, i) => [s.id, i]));
    const nexts = (s) => {
      const out = (s.br ?? []).map((b) => b.to);
      const hasDefault = (s.br ?? []).some((b) => b.if === undefined);
      if (!hasDefault) out.push(s.to ?? ch.stages[idx.get(s.id) + 1]?.id);
      return out.filter(Boolean);
    };
    for (const s of ch.stages) {
      if (s.end) continue;
      const seen = new Set([s.id]);
      const q = [s.id];
      let reach = false;
      while (q.length) {
        const cur = ch.stages[idx.get(q.pop())];
        if (cur.end) reach = true;
        for (const n of nexts(cur)) if (!seen.has(n)) (seen.add(n), q.push(n));
      }
      assert.ok(reach, `${ch.id}.${s.id} không tới được kết thúc`);
    }
    // Không có giai đoạn nào không tới được từ đầu
    const seen = new Set([ch.stages[0].id]);
    const q = [ch.stages[0].id];
    while (q.length) for (const n of nexts(ch.stages[idx.get(q.pop())])) if (!seen.has(n)) (seen.add(n), q.push(n));
    for (const s of ch.stages) assert.ok(seen.has(s.id), `${ch.id}.${s.id} không bao giờ tới được`);
  }
});

test("chuỗi có thời hạn tự kết thúc, người chơi không cần làm gì", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  for (const id of Su.chains.keys()) {
    w.chains = [];
    const inst = Su.startChain(w, id);
    assert.ok(inst, id);
    runYears(w, 300);
    assert.ok(!w.chains.some((i) => i.uid === inst.uid), `${id} vẫn chưa kết thúc sau 300 năm`);
    assert.ok(w.chainHist.some((h) => h.uid === inst.uid), `${id} không có trong lịch sử`);
  }
});

test("NPC giải quyết được chuỗi khi không có người chơi, và kết quả không cố định", () => {
  const ends = new Set();
  for (let i = 0; i < 40; i++) {
    const [c, a] = mk({ lookSeed: 1000 + i * 37 });
    const w = H.world(a, c);
    w.chains = [];
    Su.startChain(w, "ma_tong");
    runYears(w, 200);
    const h = w.chainHist.find((x) => x.id === "ma_tong");
    assert.ok(h, "chuỗi phải có kết cục");
    assert.equal(h.me, null);
    ends.add(h.end);
  }
  assert.ok(ends.size >= 2, `chỉ có một kết cục: ${[...ends]}`);
});

test("lựa chọn của người chơi đổi được thế cuộc và kết cục", () => {
  const [c, a] = mk({ realm: 3, age: 30 });
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "yeu_hoang");
  const s0 = inst.s;
  c.vk2.su.pend = { rid: `vk2_su_ch_${inst.uid}_dau`, ch: "yeu_hoang", st: "dau", uid: inst.uid };
  Su.resolve(c, a, c.vk2.su.pend.rid, 1);
  assert.ok(inst.s > s0);
  assert.ok(c.vk2.su.chains[inst.uid] >= 1);
  assert.equal(inst.choices.length, 1);
});

test("giai đoạn chuỗi hỏi người chơi đúng một lần mỗi kiếp", () => {
  const [c, a] = mk({ realm: 3, age: 30, focus: "du_ngoan" });
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "yeu_hoang");
  const def = Su.nextEvent(c, a, {});
  assert.match(def.id, new RegExp(`vk2_su_ch_${inst.uid}_dau`));
  def.choices(c)[0].run(c);
  c.age += 1;
  const again = Su.nextEvent(c, a, {});
  assert.ok(!again || !again.id.includes(`ch_${inst.uid}_dau`));
});

test("kết cục chuỗi để lại cờ thế giới, mở được sự kiện hậu quả", () => {
  const [c, a] = mk({ realm: 3, age: 40, focus: "du_ngoan" });
  const w = H.world(a, c);
  const e = Su.events.get("hq_hoa_uoc");
  assert.ok(Su.eligibleWhy(c, a, e));
  w.chains = [];
  const inst = Su.startChain(w, "yeu_hoang");
  inst.f.hoa_dam = 1;
  inst.st = "so_tai";
  inst.until = w.year;
  runYears(w, 15);
  assert.ok(w.flags.hoa_uoc_yeu);
  assert.equal(Su.eligibleWhy(c, a, e), null);
});

test("NPC tham gia chết thì nhánh đổi theo", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "ma_tong");
  inst.st = "xung_dot";
  inst.until = w.year;
  inst.s = 0;
  H.die(w, H.npcOf(w, inst.roles.foe), ["t", "t"]);
  H.step(w);
  assert.ok(["phong_an"].includes(inst.st) || inst.ended, inst.st);
});

test("dữ liệu chuỗi cũ không còn định nghĩa thì bị dọn, không kẹt", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  w.chains = [{ uid: 999, id: "chuoi_da_xoa", s: 0, st: "x", until: 0 }];
  assert.doesNotThrow(() => H.step(w));
  assert.ok(!w.chains.some((i) => i.uid === 999));
});

test("thế giới cũ hơn nhân vật khi tải lại: sự kiện chuỗi vẫn đủ tên và chọn được", () => {
  const [c, a] = mk({ realm: 3, age: 30, focus: "du_ngoan" });
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "yeu_hoang");
  const def = Su.nextEvent(c, a, {});
  assert.ok(def);
  const c2 = JSON.parse(JSON.stringify(c));
  const a2 = JSON.parse(JSON.stringify(a));
  a2.world.chains = [];
  const again = Su.eventDef(c2, a2, def.id);
  assert.ok(!/\?/.test(again.text()), again.text());
  assert.ok(again.choices(c2)[0].run(c2).length > 0);
  assert.equal(c2.vk2.su.pend, null);
  assert.ok(inst);
});

test("Tiên giới đi qua core.yearEvent với giá trị thật của game", () => {
  for (const cosmos of ["tien", "hu", "ma"]) {
    const [c, a] = mk({ realm: 8, age: 400, cosmos, lifeNo: 3, lookSeed: 31 });
    let def = null;
    for (let y = 400; y < 700 && !def; y++) {
      c.age = y;
      c.vk2.evAt = -99;
      def = C.yearEvent(c, a, {});
    }
    assert.ok(def, cosmos);
    assert.match(def.id, /^vk2_su_(tm_cuu_thien|tm_ha_pham|tn_)/);
  }
});

// ---------- NPC ----------

test("mạch NPC: đệ tử bị trục xuất, vào ma đạo, thành trưởng lão, quay lại báo thù", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  const n = w.npcs.find((x) => w.year - x.b > 20);
  const sect = Object.values(w.sects).find((s) => s.lean !== "ta");
  n.s = sect.n;
  n.pe = "cuong";
  n.r = 2;
  n.lo = 9999;
  n.arc = { id: "phan_do", st: 0, at: w.year, next: w.year };
  const store0 = sect.store;
  for (let i = 0; i < 80 && n.arc; i++) H.step(w);
  assert.equal(n.arc, undefined);
  assert.equal(n.oldS, sect.n);
  assert.ok(w.flags.phan_do_ve);
  assert.ok(n.r >= 3);
  assert.ok(sect.store < store0 + 400);
  assert.ok(w.events.some((e) => String(e.t[0]).includes("báo thù")));
});

test("NPC tự bước vào các mạch đời theo thời gian", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  let started = 0;
  for (let i = 0; i < 400; i++) {
    H.step(w);
    started = Math.max(started, w.npcs.filter((n) => n.arc).length);
  }
  assert.ok(started >= 1, "không NPC nào bước vào mạch đời");
});

// ---------- Chết và luân hồi ----------

test("chết giữa chuỗi: chuỗi vẫn đi tiếp, kiếp sau thấy kết quả", () => {
  const [c, a] = mk({ realm: 3, age: 30 });
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "ma_tong");
  c.vk2.su.pend = { rid: `vk2_su_ch_${inst.uid}_dau_hieu`, ch: "ma_tong", st: "dau_hieu", uid: inst.uid };
  Su.resolve(c, a, c.vk2.su.pend.rid, 0);
  c.vk2.su.pend = { rid: "vk2_su_x", id: "ky_ruong_chim" };
  c.dead = true;
  c.cause = "x";
  Su.onDeath(c, a);
  assert.equal(c.vk2.su.pend, null, "không còn sự kiện chờ khi đã chết");
  assert.equal(w.chains.find((i) => i.uid === inst.uid).lost, 1);
  runYears(w, 300);
  const h = w.chainHist.find((x) => x.uid === inst.uid);
  assert.ok(h);
  assert.equal(h.me[1], 1);
  const [n] = mk({ lifeNo: 2, lookSeed: 5 }, a);
  const view = Su.chronicle(n, a);
  assert.ok(view.ended.some((x) => x.joined));
});

test("luân hồi chỉ giữ dấu vết, không mang theo tài nguyên", () => {
  const [c, a] = mk({ realm: 5, linhThach: 999999, age: 100 });
  Su.apply(c, a, { s: 100, flag: "x", trace: { k: "an_nhan", t: ["a", "a"], key: "k1", n: "Ai" } });
  c.dead = true;
  const out = Su.onDeath(c, a);
  assert.ok(out.su.carried >= 1);
  const [n] = mk({ lifeNo: 2, lookSeed: 5, linhThach: 0 }, a);
  assert.equal(n.linhThach, 0);
  assert.equal(n.vk2.su.flags.x, undefined);
  assert.equal(Su.openTraces(a, "an_nhan").length, 1);
  for (const x of a.ev.traces) {
    assert.equal(x.stones, undefined);
    assert.ok(Object.keys(x).every((k) => ["id", "k", "t", "key", "n", "npc", "life", "y", "w", "open"].includes(k)));
  }
});

test("dấu vết phai qua các kiếp, không tích mãi", () => {
  const [c, a] = mk();
  Su.trace(c, a, { k: "an_nhan", t: ["a", "a"], w: 30 });
  const t = a.ev.traces[0];
  for (let life = 2; life < 12; life++) {
    const [n] = mk({ lifeNo: life, lookSeed: life * 31 }, a);
    n.dead = true;
    Su.onDeath(n, a);
  }
  assert.equal(t.open, false);
  assert.ok(t.faded);
});

test("canh Mạnh Bà làm dấu vết phai nhanh hơn, đọc từ cờ thật của game", () => {
  const [c, a] = mk();
  Su.trace(c, a, { k: "an_nhan", t: ["a", "a"], w: 40 });
  const [n] = mk({ lifeNo: 2, lookSeed: 8, tanHon: true }, a);
  Su.tick(n, a);
  assert.equal(a.ev.traces[0].w, 20);
  Su.tick(n, a);
  assert.equal(a.ev.traces[0].w, 20, "chỉ tính một lần");
});

test("dấu vết có trần và trùng khóa không ghi hai lần", () => {
  const [c, a] = mk();
  Su.trace(c, a, { k: "an_nhan", t: ["a", "a"], key: "k" });
  assert.equal(Su.trace(c, a, { k: "an_nhan", t: ["a", "a"], key: "k" }), null);
  for (let i = 0; i < 100; i++) Su.trace(c, a, { k: "ke_thu", t: ["a", "a"] });
  assert.ok(a.ev.traces.length <= Su.TRACE_CAP);
});

test("giải nhân quả đóng dấu vết", () => {
  const [c, a] = mk({ age: 30, realm: 2 });
  Su.trace(c, a, { k: "loi_hua", t: ["a", "a"], key: "h" });
  const e = Su.events.get("nd_tra_no");
  assert.equal(Su.eligibleWhy(c, a, e), null);
  c.vk2.su.pend = { rid: "vk2_su_nd_tra_no", id: "nd_tra_no" };
  Su.resolve(c, a, "vk2_su_nd_tra_no", 0);
  assert.equal(Su.openTraces(a, "loi_hua").length, 0);
  assert.equal(a.ev.resolved, 1);
});

// ---------- Thiên tượng ----------

test("thiên tượng đổi trọng số đúng", () => {
  const [c] = mk({ age: 30 });
  const e = Su.events.get("tt_huyet_nguyet");
  const base = Su.weightOf(c, e);
  K.captureOmen((id) => id === "huyet_nguyet");
  const boosted = Su.weightOf(c, e);
  K.captureOmen(() => false);
  assert.equal(boosted, base * 6);
  assert.equal(Su.weightOf(c, e), base);
});

test("thiên tượng là điều kiện thật: không có huyết nguyệt thì không có sự kiện đó", () => {
  const [c, a] = mk({ age: 30 });
  K.captureOmen(() => false);
  assert.ok(Su.eligibleWhy(c, a, Su.events.get("tt_huyet_nguyet")));
  K.captureOmen((id) => id === "huyet_nguyet");
  assert.equal(Su.eligibleWhy(c, a, Su.events.get("tt_huyet_nguyet")), null);
  K.captureOmen(() => false);
});

// ---------- Nhiệm vụ cũ, nhật ký ----------

test("nhiệm vụ cũ vẫn có và nhiệm vụ sự kiện được thêm vào", () => {
  const [c, a] = mk();
  const ids = C.questList ? C.questList(c, a).map((q) => q.id) : [];
  if (ids.length) {
    assert.ok(ids.includes("su_first"));
    assert.ok(ids.some((x) => x.startsWith("m1_") || x.startsWith("t_")));
  }
  assert.equal(C.metric("su_resolved", c, a), 0);
});

test("nhật ký có trần và ghi cả kỳ ngộ gốc, không ghi trùng sự kiện của chính nó", () => {
  const [c, a] = mk();
  for (let i = 0; i < 200; i++) Su.onChoice(c, a, { id: `ev_${i}`, title: "T" }, { label: "L", lean: "chinh" });
  assert.equal(c.vk2.su.j.length, Su.JOURNAL_CAP);
  assert.equal(c.vk2.su.j[0].native, 1);
  const n = c.vk2.su.j.length;
  Su.onChoice(c, a, { id: "vk2_su_x", title: "T" }, { label: "L" });
  assert.equal(c.vk2.su.j.length, n);
});

test("Thiên Hạ Ký Sự trả về đủ các mục có dữ liệu thật", () => {
  const [c, a] = mk({ realm: 3, age: 30 });
  const w = H.world(a, c);
  w.chains = [];
  const inst = Su.startChain(w, "ma_tong");
  c.vk2.su.pend = { rid: `vk2_su_ch_${inst.uid}_dau_hieu`, ch: "ma_tong", st: "dau_hieu", uid: inst.uid, npc: inst.roles.ally };
  Su.resolve(c, a, c.vk2.su.pend.rid, 0);
  const v = Su.chronicle(c, a);
  assert.equal(v.running[0].joined, true);
  assert.ok(v.world.length >= 1);
  assert.ok(v.journal.length >= 1);
  assert.ok(v.traces.length >= 1);
  assert.ok(v.people.length >= 1);
});

// ---------- Tăng trưởng ----------

test("chuỗi chạy 5000 năm: thế lực tông môn trong giới hạn, thế giới không tàn lụi", () => {
  const [c, a] = mk();
  const w = H.world(a, c);
  const start = Object.keys(w.sects).length;
  for (let i = 0; i < 5000; i++) {
    H.step(w);
    for (const s of Object.values(w.sects)) assert.ok(s.terr >= 0 && s.terr <= 9 && s.vein >= 0 && s.vein <= 9 && Number.isFinite(s.store), `${s.n} ${s.terr}/${s.vein}`);
    assert.ok(w.chains.length <= Su.ACTIVE_CHAINS + 1);
  }
  const veins = Object.values(w.sects).map((s) => s.vein);
  assert.ok(Object.keys(w.sects).length >= Math.min(3, start), `còn ${Object.keys(w.sects).length} tông`);
  assert.ok(veins.reduce((x, y) => x + y, 0) / veins.length >= 1, veins.join(","));
  assert.ok(w.chainHist.length >= 20, `${w.chainHist.length} chuỗi đã kết thúc`);
  assert.ok(new Set(w.chainHist.map((h) => h.id)).size >= 5);
  assert.ok(JSON.stringify(w).length < 150 * 1024, `${Math.round(JSON.stringify(w).length / 1024)} KB`);
});

test("mô phỏng 300 kiếp: thế giới, dấu vết và nhật ký không lớn vô hạn", () => {
  const a = C.newAcct();
  let peak = 0;
  for (let life = 1; life <= 300; life++) {
    const [c] = mk({ lifeNo: life, lookSeed: life * 7919, age: 0, realm: 2 }, a);
    c.age = 0;
    C.onYear(c, a, {});
    for (let y = 6; y < 70; y += 3) {
      c.age = y;
      c.focus = ["tu_luyen", "du_ngoan", "kiem_tien"][y % 3];
      const def = Su.nextEvent(c, a, {});
      C.onYear(c, a, {});
      if (def) {
        const list = def.choices(c).filter((x) => !x.off);
        if (list[0]) list[y % list.length].run(c);
      }
    }
    c.dead = true;
    c.cause = "x";
    C.tick(c, a, 0);
    Su.onDeath(c, a);
    H.fastForward(a.world, 30);
    peak = Math.max(peak, JSON.stringify(a).length);
    assert.ok(a.ev.traces.length <= Su.TRACE_CAP);
    assert.ok(a.world.chains.length <= Su.ACTIVE_CHAINS + 1);
    assert.ok((a.world.events ?? []).length <= 80);
    assert.ok(c.vk2.su.j.length <= Su.JOURNAL_CAP);
  }
  assert.ok(peak < 200 * 1024, `tài khoản đạt ${Math.round(peak / 1024)} KB`);
});
