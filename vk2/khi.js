// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 3 — nguyên liệu, luyện khí, phù lục, pháp bảo bản mệnh, động phủ.
// Logic thuần, trạng thái ở char.vk2.khi. Khi chết, động phủ được ghi lại và xử lý ở Giai đoạn 6 (kế thừa, bỏ hoang, di tích).
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, rnd, yearOf, tr, addStat } = C.kit;

  // ---------- Nguyên liệu ----------

  const MATS = {
    kim_thiet: { n: ["Tinh thiết", "Fine Iron"], el: "kim", price: 25 },
    moc_tinh: { n: ["Mộc tinh", "Wood Essence"], el: "moc", price: 25 },
    thuy_ngoc: { n: ["Thủy ngọc", "Water Jade"], el: "thuy", price: 35 },
    hoa_tinh: { n: ["Hỏa tinh", "Fire Crystal"], el: "hoa", price: 35 },
    tho_nguyen: { n: ["Thổ nguyên", "Earth Core"], el: "tho", price: 35 },
    yeu_dan: { n: ["Yêu đan", "Beast Core"], el: null, price: 60 },
    linh_thao: { n: ["Linh thảo", "Spirit Herb"], el: "moc", price: 15 },
  };
  const MAT_CAP = 99;

  // ---------- Pháp bảo ----------

  /* Năm loại, mỗi loại một vai trò và một đánh đổi. Hệ ngũ hành của nguyên liệu chính quyết định khí linh và bản mệnh. */
  const KINDS = {
    kiem: { n: ["Phi kiếm", "Flying Sword"], fx: { atk: 0.05 }, duel: { first: 0.1 }, need: { kim_thiet: 4, hoa_tinh: 1 }, realm: 1, stones: 150 },
    giap: { n: ["Linh giáp", "Spirit Armor"], fx: { def: 0.06, hp: 0.02 }, duel: { shield: 0.05 }, need: { tho_nguyen: 3, kim_thiet: 2 }, realm: 1, stones: 150 },
    an: { n: ["Trấn ấn", "Sealing Seal"], fx: { def: 0.03, atk: 0.03 }, duel: { pierce: 0.1 }, need: { tho_nguyen: 2, thuy_ngoc: 2 }, realm: 2, stones: 300 },
    linh: { n: ["Nhiếp hồn linh", "Soul Bell"], fx: { cult: 0.03, brk: 0.005 }, duel: {}, need: { thuy_ngoc: 3, moc_tinh: 2 }, realm: 2, stones: 300 },
    lo: { n: ["Đan lô", "Pill Furnace"], fx: { cult: 0.02 }, duel: {}, need: { hoa_tinh: 3, kim_thiet: 2, linh_thao: 2 }, realm: 2, stones: 300, mech: { pill: 0.2 } },
  };
  const QUAL = {
    1: { n: ["Pháp khí", "Magic Tool"], cls: "q1", mul: 0.7, dur: 40 },
    2: { n: ["Linh khí", "Spirit Tool"], cls: "q2", mul: 1, dur: 60 },
    3: { n: ["Bảo khí", "Treasure"], cls: "q3", mul: 1.35, dur: 90 },
    4: { n: ["Tiên khí", "Immortal Tool"], cls: "q4", mul: 1.7, dur: 130 },
  };
  const ENHANCE_MAX = 9;
  const SPIRIT_LV = 6;
  const NATAL_REALM = 3;
  const HELD_MAX = 6;

  // ---------- Phù lục ----------

  const TALISMANS = {
    ho_than: { n: ["Hộ Thân Phù", "Guardian Talisman"], d: ["Lần đột phá hoặc trận bí cảnh kế tiếp có thêm hộ thể.", "A shield for your next breakthrough or realm fight."], need: { thuy_ngoc: 1, linh_thao: 1 }, stones: 40, realm: 1, use: ["chiến đấu", "combat"] },
    hoa_cau: { n: ["Liệt Hỏa Phù", "Blazing Talisman"], d: ["Trận kế tiếp thiêu địch theo công của bạn.", "Your next fight burns the enemy, based on your attack."], need: { hoa_tinh: 1, linh_thao: 1 }, stones: 40, realm: 1, use: ["chiến đấu", "combat"] },
    don_tho: { n: ["Độn Thổ Phù", "Escape Talisman"], d: ["Rút khỏi bí cảnh tức thì, không bị thương.", "Leave a secret realm instantly, unharmed."], need: { tho_nguyen: 1 }, stones: 60, realm: 1, use: ["bí cảnh", "secret realm"] },
    pha_cam: { n: ["Phá Cấm Phù", "Seal-breaking Talisman"], d: ["Phá chắc chắn một bẫy hoặc cấm chế trong bí cảnh.", "Surely breaks one trap or seal in a realm."], need: { kim_thiet: 1, thuy_ngoc: 1 }, stones: 80, realm: 2, use: ["bí cảnh", "secret realm"] },
    tinh_tam: { n: ["Tĩnh Tâm Phù", "Calming Talisman"], d: ["Lần đột phá kế tiếp +4%, tâm ma -6.", "Next breakthrough +4%, inner demons -6."], need: { linh_thao: 2 }, stones: 100, realm: 1, use: ["đột phá", "breakthrough"] },
  };
  const TALISMAN_CAP = 9;

  // ---------- Động phủ ----------

  const SITES = {
    pham: { n: ["Sơn động bình thường", "Plain Cave"], stones: 300, realm: 2, qi: 1, upkeep: 8 },
    linh: { n: ["Linh sơn", "Spirit Mountain"], stones: 1500, realm: 3, qi: 1.3, upkeep: 20 },
    dia: { n: ["Địa mạch long huyệt", "Dragon Vein Lair"], stones: 6000, realm: 5, qi: 1.7, upkeep: 50 },
  };
  /* Công trình có 3 cấp. Hiệu ứng đều nhỏ và đi qua trần chung; phí duy trì tăng theo cấp, nên không xây hết ngay được. */
  const BUILDINGS = {
    tu_linh: { n: ["Tụ linh trận", "Qi Gathering Array"], d: ["Tăng tốc độ tu trong năm Tu luyện và bế quan.", "Faster cultivation during Cultivation years and seclusion."], cost: [400, 1500, 5000], upkeep: 6 },
    duoc_vien: { n: ["Dược viên", "Herb Garden"], d: ["Mỗi năm cho linh thảo, có lúc ra đan.", "Yields spirit herbs yearly, sometimes pills."], cost: [250, 900, 3000], upkeep: 3 },
    dan_phong: { n: ["Phòng luyện đan", "Alchemy Room"], d: ["Năm Luyện đan có thêm cơ hội ra đan, đào thải tạp chất nhanh hơn.", "Alchemy years may yield extra pills and purge impurity faster."], cost: [350, 1200, 4000], upkeep: 4 },
    khi_phong: { n: ["Phòng luyện khí", "Forge Room"], d: ["Pháp bảo luyện ra có phẩm cao hơn, cường hóa dễ hơn.", "Better crafted treasures and easier enhancement."], cost: [350, 1200, 4000], upkeep: 4 },
    thu_vien: { n: ["Linh thú viên", "Beast Garden"], d: ["Linh thú hồi sức cho chủ: sức khỏe hồi thêm mỗi năm.", "Your beast helps you recover: more health yearly."], cost: [300, 1000, 3500], upkeep: 4 },
    tang_kinh: { n: ["Tàng kinh các", "Scripture Hall"], d: ["Đạo niệm đang chuyên tâm lớn nhanh hơn. Có thể cất bí thuật để lại đời sau.", "The studied concept grows faster. Can store arts for later lives."], cost: [500, 1800, 6000], upkeep: 5 },
    phong_ngu: { n: ["Trận pháp phòng ngự", "Defensive Array"], d: ["Đẩy lùi kẻ xâm nhập, giảm thiệt hại khi động phủ bị tấn công.", "Repels intruders and reduces damage when the abode is attacked."], cost: [400, 1500, 5000], upkeep: 5 },
  };
  const BUILD_MAX = 3;
  const NEGLECT_YEARS = 5; // Không trả phí duy trì quá số năm này thì công trình xuống cấp

  const QUESTS = [
    { id: "k_mat", t: ["Thu thập 5 nguyên liệu", "Gather 5 materials"], goal: ["mat_total", 5], r: { stones: 60 }, go: { tab: "forge" } },
    { id: "k_craft", after: "k_mat", t: ["Luyện một pháp bảo", "Craft a treasure"], goal: ["craft_count", 1], r: { stones: 200 }, go: { tab: "forge" } },
    { id: "k_tali", t: ["Vẽ một lá phù", "Draw a talisman"], goal: ["tali_made", 1], r: { stones: 50 }, go: { tab: "forge" } },
    { id: "k_natal", after: "k_craft", t: ["Nhận một pháp bảo làm bản mệnh", "Bind a natal treasure"], goal: ["natal", 1], r: { stat: { tamCanh: 3 } }, go: { tab: "forge" } },
    { id: "k_cave", t: ["Khai phá động phủ", "Establish a cave abode"], goal: ["cave", 1], r: { stones: 200 }, go: { tab: "cave" } },
    { id: "k_build3", after: "k_cave", t: ["Xây 3 công trình trong động phủ", "Build 3 structures in your abode"], goal: ["build_count", 3], r: { stat: { ngoTinh: 2 } }, go: { tab: "cave" } },
  ];

  // ---------- Trạng thái ----------

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (v.khi) return v.khi;
    v.khi = { v: 1, year: yearOf(c), mats: {}, items: [], worn: [], natal: null, talismans: {}, armed: null, cave: null, made: 0, taliMade: 0, nextId: 1, neglected: 0, raidAt: -99 };
    if (yearOf(c) >= 1) for (const q of QUESTS) if (C.metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
    return v.khi;
  }
  const buildLv = (c, id) => c.vk2?.khi?.cave?.b?.[id] ?? 0;

  function metric(name, c) {
    const k = c.vk2?.khi;
    switch (name) {
      case "mat_total": return k ? Object.values(k.mats).reduce((s, n) => s + n, 0) + (k.spent ?? 0) : 0;
      case "craft_count": return k?.made ?? 0;
      case "tali_made": return k?.taliMade ?? 0;
      case "natal": return k?.natal ? 1 : 0;
      case "cave": return k?.cave ? 1 : 0;
      case "build_count": return k?.cave ? Object.values(k.cave.b).filter((n) => n > 0).length : 0;
      default: return undefined;
    }
  }

  function addMat(c, acct, id, n) {
    const k = ensure(c, acct);
    if (!MATS[id] || !(n > 0)) return 0;
    const before = k.mats[id] ?? 0;
    k.mats[id] = Math.min(MAT_CAP, before + n);
    return k.mats[id] - before;
  }
  /** Trừ nguyên liệu nếu đủ hết, nên không có trường hợp trừ dở dang. */
  function pay(k, need) {
    for (const [id, n] of Object.entries(need)) if ((k.mats[id] ?? 0) < n) return false;
    for (const [id, n] of Object.entries(need)) {
      k.mats[id] -= n;
      k.spent = (k.spent ?? 0) + n;
    }
    return true;
  }
  const hasMats = (k, need) => Object.entries(need).every(([id, n]) => (k.mats[id] ?? 0) >= n);

  // ---------- Luyện khí ----------

  /**
   * Điểm luyện: tay nghề đến từ phòng luyện khí, đạo lộ, ngộ tính, và việc nguyên liệu hợp linh căn. Phẩm được định bằng điểm và seed theo năm,
   * nên tải lại trang không đổi được kết quả.
   */
  function craftScore(c) {
    const info = C.rootInfo(c);
    const d = c.vk2?.dao;
    return 25 + buildLv(c, "khi_phong") * 12 + (c.stats?.ngoTinh ?? 50) * 0.3 + (c.path === "dan" ? 8 : c.path === "tran" ? 8 : 0) + (info.elements.includes("kim") ? 4 : 0) + (info.elements.includes("hoa") ? 4 : 0) + (d?.mastery?.kim_phap ?? 0) * 0.05 + (d?.mastery?.hoa_phap ?? 0) * 0.05;
  }
  function canCraft(c, acct, kind) {
    const k = ensure(c, acct);
    const def = KINDS[kind];
    if (!def) return { ok: false, reasons: [] };
    const reasons = [];
    if ((c.realm ?? 0) < def.realm) reasons.push(["Chưa đủ cảnh giới", "Realm too low"]);
    if (!hasMats(k, def.need)) reasons.push(["Thiếu nguyên liệu", "Missing materials"]);
    if ((c.linhThach ?? 0) < def.stones) reasons.push(["Thiếu linh thạch", "Not enough stones"]);
    if (k.items.length >= HELD_MAX) reasons.push([`Chỉ giữ được ${HELD_MAX} pháp bảo`, `You can hold only ${HELD_MAX}`]);
    return { ok: !reasons.length, reasons };
  }
  function craft(c, acct, kind) {
    if (!canCraft(c, acct, kind).ok) return null;
    const k = c.vk2.khi;
    const def = KINDS[kind];
    pay(k, def.need);
    c.linhThach -= def.stones;
    const roll = rnd(c, yearOf(c), 200 + k.nextId) * 100;
    const score = craftScore(c) + roll * 0.45;
    const q = score >= 88 ? 4 : score >= 68 ? 3 : score >= 42 ? 2 : 1;
    const mainMat = Object.keys(def.need)[0];
    const item = { id: `pb${k.nextId++}`, kind, q, lv: 0, dur: QUAL[q].dur, spirit: false, el: MATS[mainMat].el, life: c.lifeNo ?? 0, name: tr(def.n) };
    k.items.push(item);
    if (k.worn.length < wornSlots(c)) k.worn.push(item.id);
    k.made += 1;
    C.bump(c, acct, "crafted", 1);
    return item;
  }
  const wornSlots = (c) => ((c.realm ?? 0) >= 4 ? 3 : (c.realm ?? 0) >= 2 ? 2 : 1);
  const itemOf = (k, id) => k.items.find((x) => x.id === id);

  /** Sức mạnh theo phẩm và cường hóa. Hỏng hẳn thì không còn tác dụng. Bản mệnh lớn lên theo cảnh giới. */
  function itemPower(c, it) {
    if (it.dur <= 0) return 0;
    let p = QUAL[it.q].mul * (1 + it.lv * 0.08);
    if (it.spirit) p *= 1.15;
    if (c.vk2.khi.natal === it.id) p *= 1 + Math.min(0.6, (c.realm ?? 0) * 0.08);
    return p;
  }
  function fx(c) {
    const k = c.vk2?.khi;
    const out = [];
    if (!k) return out;
    for (const id of k.worn) {
      const it = itemOf(k, id);
      if (!it) continue;
      const pw = itemPower(c, it);
      const pro = {};
      for (const [s, x] of Object.entries(KINDS[it.kind].fx)) pro[s] = x * pw;
      out.push(pro);
    }
    if (k.cave && buildLv(c, "tu_linh") > 0 && (c.vk2?.can?.closed || c.focus === "tu_luyen")) out.push({ cult: buildLv(c, "tu_linh") * 0.025 * SITES[k.cave.site].qi });
    if (k.armed === "tinh_tam") out.push({ brk: 0.04 });
    return out;
  }
  function duel(c) {
    const k = c.vk2?.khi;
    const out = {};
    if (!k) return out;
    for (const id of k.worn) {
      const it = itemOf(k, id);
      if (!it) continue;
      const pw = itemPower(c, it);
      for (const [s, x] of Object.entries(KINDS[it.kind].duel)) out[s] = (out[s] ?? 0) + x * pw;
      if (it.spirit && it.el === "hoa") out.burn = (out.burn ?? 0) + 0.04;
      if (it.spirit && it.el === "kim") out.extra = (out.extra ?? 0) + 0.08;
      if (it.spirit && it.el === "thuy") out.dodge = (out.dodge ?? 0) + 0.04;
      if (it.spirit && it.el === "moc") out.leech = (out.leech ?? 0) + 0.05;
      if (it.spirit && it.el === "tho") out.shield = (out.shield ?? 0) + 0.05;
    }
    if (k.armed === "ho_than") out.shield = (out.shield ?? 0) + 0.2;
    if (k.armed === "hoa_cau") out.burn = (out.burn ?? 0) + 0.12;
    return out;
  }
  function toggleWorn(c, acct, id) {
    const k = ensure(c, acct);
    if (!itemOf(k, id)) return false;
    if (k.worn.includes(id)) {
      if (k.natal === id) return false; // Bản mệnh gắn với thân, không tháo ra được
      k.worn = k.worn.filter((x) => x !== id);
      return true;
    }
    if (k.worn.length >= wornSlots(c)) return false;
    k.worn.push(id);
    return true;
  }
  /** Cường hóa có thể thất bại, mất độ bền. Tầng càng cao càng khó. */
  function enhanceCost(it) {
    return { stones: 100 * (it.lv + 1) * it.q, mat: it.el ? Object.keys(MATS).find((m) => MATS[m].el === it.el) : "kim_thiet", n: 1 + Math.floor(it.lv / 3) };
  }
  function enhance(c, acct, id) {
    const k = ensure(c, acct);
    const it = itemOf(k, id);
    if (!it || it.lv >= ENHANCE_MAX || it.dur <= 0) return null;
    const cost = enhanceCost(it);
    if ((c.linhThach ?? 0) < cost.stones || (k.mats[cost.mat] ?? 0) < cost.n) return null;
    c.linhThach -= cost.stones;
    k.mats[cost.mat] -= cost.n;
    k.spent = (k.spent ?? 0) + cost.n;
    const chance = clamp(0.9 - it.lv * 0.09 + buildLv(c, "khi_phong") * 0.05, 0.15, 0.95);
    k.tries = (k.tries ?? 0) + 1;
    if (rnd(c, yearOf(c), 300 + k.tries) < chance) {
      it.lv += 1;
      let spirit = false;
      // Khí linh chỉ sinh ở pháp bảo được nuôi lâu: đủ tầng cường hóa và từ Linh khí trở lên.
      if (!it.spirit && it.lv >= SPIRIT_LV && it.q >= 2) {
        it.spirit = true;
        spirit = true;
      }
      return { ok: true, spirit, lv: it.lv };
    }
    it.dur = Math.max(0, it.dur - 8);
    return { ok: false, lv: it.lv };
  }
  function repair(c, acct, id) {
    const k = ensure(c, acct);
    const it = itemOf(k, id);
    if (!it) return false;
    const max = QUAL[it.q].dur;
    const need = 10 * it.q * (max - it.dur > 0 ? 1 : 0);
    if (it.dur >= max || (c.linhThach ?? 0) < need * 3 || (k.mats.kim_thiet ?? 0) < 1) return false;
    c.linhThach -= need * 3;
    k.mats.kim_thiet -= 1;
    k.spent = (k.spent ?? 0) + 1;
    it.dur = max;
    return true;
  }
  /** Bản mệnh: từ Kim Đan, chọn một pháp bảo gắn với thân. Mạnh lên theo cảnh giới, nhưng bị phá hỏng thì chủ nhân trọng thương. */
  function bindNatal(c, acct, id) {
    const k = ensure(c, acct);
    if (k.natal || (c.realm ?? 0) < NATAL_REALM || !itemOf(k, id)) return false;
    k.natal = id;
    if (!k.worn.includes(id)) {
      if (k.worn.length >= wornSlots(c)) k.worn.shift();
      k.worn.push(id);
    }
    return true;
  }

  // ---------- Phù lục ----------

  function canDraw(c, acct, id) {
    const k = ensure(c, acct);
    const def = TALISMANS[id];
    if (!def) return { ok: false, reasons: [] };
    const reasons = [];
    if ((c.realm ?? 0) < def.realm) reasons.push(["Chưa đủ cảnh giới", "Realm too low"]);
    if (!hasMats(k, def.need)) reasons.push(["Thiếu nguyên liệu", "Missing materials"]);
    if ((c.linhThach ?? 0) < def.stones) reasons.push(["Thiếu linh thạch", "Not enough stones"]);
    if ((k.talismans[id] ?? 0) >= TALISMAN_CAP) reasons.push(["Đã mang đủ", "You carry enough"]);
    return { ok: !reasons.length, reasons };
  }
  function draw(c, acct, id) {
    if (!canDraw(c, acct, id).ok) return false;
    const k = c.vk2.khi;
    pay(k, TALISMANS[id].need);
    c.linhThach -= TALISMANS[id].stones;
    k.talismans[id] = (k.talismans[id] ?? 0) + 1;
    k.taliMade += 1;
    return true;
  }
  const hasTalisman = (c, id) => (c.vk2?.khi?.talismans?.[id] ?? 0) > 0;
  function useTalisman(c, id) {
    const k = c.vk2?.khi;
    if (!k || !hasTalisman(c, id)) return false;
    k.talismans[id] -= 1;
    return true;
  }
  /** Chuẩn bị một lá phù cho trận hoặc lần đột phá kế tiếp. Dùng rồi là mất, không chồng nhiều lá. */
  function arm(c, acct, id) {
    const k = ensure(c, acct);
    if (!["ho_than", "hoa_cau", "tinh_tam"].includes(id) || k.armed || !useTalisman(c, id)) return false;
    k.armed = id;
    k.armedSeen = breakKey(c);
    if (id === "tinh_tam") addStat(c, "tamMa", -6);
    return true;
  }
  const breakKey = (c) => `${c.realm ?? 0}:${c.layer ?? 0}:${c.breakFail ? `${c.breakFail.r}:${c.breakFail.n}` : ""}`;

  // ---------- Động phủ ----------

  function canFound(c, acct, site) {
    const k = ensure(c, acct);
    const s = SITES[site];
    if (!s) return { ok: false, reasons: [] };
    const reasons = [];
    if (k.cave) reasons.push(["Đã có động phủ", "You already have an abode"]);
    if ((c.realm ?? 0) < s.realm) reasons.push(["Chưa đủ cảnh giới", "Realm too low"]);
    if ((c.linhThach ?? 0) < s.stones) reasons.push(["Thiếu linh thạch", "Not enough stones"]);
    return { ok: !reasons.length, reasons };
  }
  function found(c, acct, site) {
    if (!canFound(c, acct, site).ok) return false;
    const k = c.vk2.khi;
    c.linhThach -= SITES[site].stones;
    k.cave = { site, lv: 1, b: {}, at: yearOf(c), hurt: 0, stored: [] };
    return true;
  }
  const caveLvNeed = (cave) => Object.values(cave.b).reduce((s, n) => s + n, 0);
  function buildCost(c, id) {
    const lv = buildLv(c, id);
    return BUILDINGS[id]?.cost[lv] ?? null;
  }
  function build(c, acct, id) {
    const k = ensure(c, acct);
    const def = BUILDINGS[id];
    if (!k.cave || !def) return false;
    const lv = buildLv(c, id);
    const cost = def.cost[lv];
    // Cấp công trình không được vượt cảnh giới: tu sĩ thấp không giữ nổi một động phủ quá lớn.
    if (lv >= BUILD_MAX || cost === undefined || lv + 1 > Math.max(1, (c.realm ?? 0) - 1) || (c.linhThach ?? 0) < cost) return false;
    c.linhThach -= cost;
    k.cave.b[id] = lv + 1;
    k.cave.lv = 1 + Math.floor(caveLvNeed(k.cave) / 4);
    return true;
  }
  function upkeep(c) {
    const k = c.vk2?.khi;
    if (!k?.cave) return 0;
    return SITES[k.cave.site].upkeep + Object.entries(k.cave.b).reduce((s, [id, n]) => s + BUILDINGS[id].upkeep * n, 0);
  }
  /** Cất bí thuật vào tàng kinh các: chỉ khi đó mới có thể để lại trong động phủ cho đời sau. */
  function storeArt(c, acct, artId) {
    const k = ensure(c, acct);
    const d = c.vk2.dao;
    const art = d?.arts?.find((a) => a.id === artId);
    if (!k.cave || buildLv(c, "tang_kinh") < 1 || !art || k.cave.stored.includes(artId)) return false;
    k.cave.stored.push(artId);
    return true;
  }

  // ---------- Một năm ----------

  function onYear(c, acct, opts) {
    const k = ensure(c, acct);
    const year = yearOf(c);
    const notes = [];
    if (year <= k.year) return notes;
    k.year = year;
    if (year < 6) return notes;

    // Trang bị hao mòn dần khi mặc. Bản mệnh lớn theo chủ, hao chậm hơn.
    if (year % 4 === 0) {
      for (const id of k.worn) {
        const it = itemOf(k, id);
        if (!it || it.dur <= 0) continue;
        const metal = (root.VK2Phap?.lawTier?.(c.vk2?.phap, "kim") ?? 0) > 0 ? 0.5 : 1;
        it.dur = Math.max(0, it.dur - (k.natal === id ? 0.5 : 1) * metal);
        if (it.dur === 0) {
          notes.push({ kind: "bad", t: [`${it.name} đã hỏng, cần sửa ở Luyện khí.`, `${it.name} has broken; repair it at the forge.`] });
          if (k.natal === id) natalBroken(c, notes);
        }
      }
    }

    // Du ngoạn và kiếm tiền cũng có lúc gặp nguyên liệu; trừ yêu thì nhờ onBump theo từng trận.
    if (c.focus === "du_ngoan" && rnd(c, year, 201) < 0.35) {
      const ids = Object.keys(MATS);
      addMat(c, acct, ids[Math.floor(rnd(c, year, 202) * ids.length)], 1);
    }
    if (c.focus === "kiem_tien" && rnd(c, year, 203) < 0.2) addMat(c, acct, "kim_thiet", 1);
    if ((c.realm ?? 0) >= 1 && c.focus === "tu_luyen" && rnd(c, year, 204) < 0.08) addMat(c, acct, "linh_thao", 1);

    if (k.armed === "tinh_tam" || k.armed === "ho_than" || k.armed === "hoa_cau") {
      // Phù đã vẽ không giữ uy lực mãi: 10 năm thì tan.
      k.armedAge = (k.armedAge ?? 0) + 1;
      if (k.armedAge > 10) {
        k.armed = null;
        k.armedAge = 0;
      }
    } else k.armedAge = 0;

    if (k.cave) caveYear(c, acct, year, notes);
    return notes;
  }
  function natalBroken(c, notes) {
    if (c.vk2.can) c.vk2.can.injury = clamp(c.vk2.can.injury + 30, 0, 100);
    addStat(c, "sucKhoe", -20);
    notes.push({ kind: "bad", t: ["Pháp bảo bản mệnh hỏng, phản phệ lên thân. Trọng thương.", "Your natal treasure breaks and backlashes into your body. Grave wounds."] });
  }
  function caveYear(c, acct, year, notes) {
    const k = c.vk2.khi;
    const cave = k.cave;
    const fee = upkeep(c);
    if ((c.linhThach ?? 0) >= fee) {
      c.linhThach -= fee;
      k.neglected = 0;
    } else {
      k.neglected += 1;
      if (k.neglected === 1) notes.push({ kind: "bad", t: [`Không đủ ${fee} linh thạch duy trì động phủ. Bỏ bê lâu, công trình sẽ xuống cấp.`, `You lack the ${fee} stones of upkeep. Neglect will degrade your structures.`] });
      if (k.neglected >= NEGLECT_YEARS) {
        k.neglected = 0;
        const built = Object.keys(cave.b).filter((id) => cave.b[id] > 0);
        if (built.length) {
          const id = built[Math.floor(rnd(c, year, 205) * built.length)];
          cave.b[id] -= 1;
          notes.push({ kind: "bad", t: [`${BUILDINGS[id].n[0]} xuống cấp vì thiếu người chăm sóc.`, `${BUILDINGS[id].n[1]} falls into disrepair.`] });
        }
      }
      return; // Thiếu phí thì năm nay công trình không cho ra gì
    }
    const qi = SITES[cave.site].qi;
    const herb = buildLv(c, "duoc_vien");
    if (herb) {
      addMat(c, acct, "linh_thao", herb >= 2 ? 2 : 1);
      if (rnd(c, year, 206) < herb * 0.06) givePill(c, ["hoi_xuan", "thanh_tam"][Math.floor(rnd(c, year, 207) * 2)]);
    }
    const dan = buildLv(c, "dan_phong");
    if (dan && c.focus === "luyen_dan") {
      if (rnd(c, year, 208) < dan * 0.1) givePill(c, ["tu_khi", "hoi_xuan", "thanh_tam"][Math.floor(rnd(c, year, 209) * 3)]);
      if (c.vk2.can) c.vk2.can.impurity = Math.max(0, c.vk2.can.impurity - dan * 0.5);
    }
    if (buildLv(c, "thu_vien") && c.pet) addStat(c, "sucKhoe", buildLv(c, "thu_vien") * 0.5);
    const scrolls = buildLv(c, "tang_kinh");
    const d = c.vk2.dao;
    if (scrolls && d?.study) root.VK2Dao.addMastery(c, d.study, scrolls * 0.4 * qi);
  }
  function givePill(c, id) {
    c.pills = c.pills ?? {};
    c.pills[id] = (c.pills[id] ?? 0) + 1;
  }

  // ---------- Sự kiện: động phủ bị tấn công ----------

  const EV_RAID = "vk2_cave_raid";
  function raidDef(c, acct) {
    const k = c.vk2?.khi;
    if (!k?.cave) return null;
    const guard = buildLv(c, "phong_ngu");
    const loss = Math.round(upkeep(c) * 6);
    return {
      id: EV_RAID,
      title: tr(["Động phủ bị dòm ngó", "Intruders at your abode"]),
      text: () => tr([`Có kẻ đang dò tìm trận pháp quanh động phủ của bạn. Trận phòng ngự cấp ${guard}.`, `Someone is probing the arrays around your abode. Defensive array level ${guard}.`]),
      choices: () => [
        { label: tr(["Ra tay đuổi đi", "Drive them off"]), hint: tr(["giao đấu", "fight"]), lean: "trung", run: (n) => {
          const res = C.duel(n, C.combatLevel(n) - 2 - guard * 2, 1, (n.lookSeed ?? 0) + yearOf(n) * 3, 1);
          if (res.win) {
            root.VK2Khi.addMat(n, acct, "yeu_dan", 1);
            return tr(["Kẻ đột nhập bỏ chạy, để lại vài món đồ.", "The intruders flee, leaving a few things behind."]);
          }
          addStat(n, "sucKhoe", -15);
          n.linhThach = Math.max(0, (n.linhThach ?? 0) - loss);
          return tr([`Bạn thua, mất ${loss} linh thạch.`, `You lose, and ${loss} stones with it.`]);
        } },
        { label: tr(["Bật trận pháp, ẩn mình", "Raise the arrays and hide"]), hint: tr([guard ? "an toàn" : "chưa có trận, sẽ mất của", guard ? "safe" : "no array, you will lose stones"]), lean: "chinh", run: (n) => {
          if (guard) return tr(["Trận pháp sáng lên, kẻ lạ biết điều rút đi.", "The arrays light up, and the strangers think better of it."]);
          n.linhThach = Math.max(0, (n.linhThach ?? 0) - loss);
          return tr([`Không có trận, kẻ lạ vét đi ${loss} linh thạch.`, `With no array, they make off with ${loss} stones.`]);
        } },
      ],
    };
  }
  function nextEvent(c, acct) {
    const k = c.vk2?.khi;
    if (!k?.cave) return null;
    const year = yearOf(c);
    if (year - k.raidAt < 40 || year - k.cave.at < 10 || rnd(c, year, 210) > 0.04) return null;
    k.raidAt = year;
    return raidDef(c, acct);
  }
  function eventDef(c, acct, id) {
    return id === EV_RAID ? raidDef(c, acct) ?? { id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] } : null;
  }

  /** Chiến lợi phẩm từ trận thắng thật ở game gốc, có giới hạn trong năm để không cày vô hạn. */
  function onBump(c, acct, name, n) {
    if (name !== "kills") return;
    const k = c.vk2?.khi;
    if (!k) return;
    const year = yearOf(c);
    if (k.dropYear !== year) {
      k.dropYear = year;
      k.dropN = 0;
    }
    if (k.dropN >= 3) return;
    k.kills = (k.kills ?? 0) + n;
    if (rnd(c, year, 211 + k.kills) < 0.35) {
      k.dropN += 1;
      const ids = ["yeu_dan", "kim_thiet", "hoa_tinh", "thuy_ngoc", "tho_nguyen", "moc_tinh"];
      addMat(c, acct, ids[Math.floor(rnd(c, year, 212 + k.kills) * ids.length)], 1);
    }
  }
  /** Mua nguyên liệu bằng linh thạch: nối với kinh tế của game. Giá tăng khi mua nhiều trong năm. */
  function matPrice(c, id) {
    const k = c.vk2?.khi;
    const same = k?.buyYear === yearOf(c) ? k.buyN ?? 0 : 0;
    return Math.round(MATS[id].price * (1 + (c.realm ?? 0) * 0.3) * (1 + same * 0.15));
  }
  function buyMat(c, acct, id) {
    const k = ensure(c, acct);
    if (!MATS[id]) return false;
    const price = matPrice(c, id);
    if ((c.linhThach ?? 0) < price || (k.mats[id] ?? 0) >= MAT_CAP) return false;
    c.linhThach -= price;
    if (k.buyYear !== yearOf(c)) {
      k.buyYear = yearOf(c);
      k.buyN = 0;
    }
    k.buyN += 1;
    addMat(c, acct, id, 1);
    return true;
  }

  /** Phù và đột phá: lá Tĩnh Tâm và Hộ Thân tiêu hao khi có lần đột phá (thành hay bại), nhận biết qua đổi cảnh giới hoặc breakFail. */
  function tick(c) {
    const k = c.vk2?.khi;
    if (!k?.armed) return [];
    const key = breakKey(c);
    if (k.armedSeen !== key && (k.armed === "tinh_tam" || k.armed === "ho_than")) {
      k.armed = null;
      k.armedAge = 0;
    }
    return [];
  }

  /** Dùng trận chính thức của bí cảnh: lá phù chiến đấu đã chuẩn bị bị tiêu hao sau trận. */
  function afterFight(c) {
    const k = c.vk2?.khi;
    if (k?.armed === "ho_than" || k?.armed === "hoa_cau") {
      k.armed = null;
      k.armedAge = 0;
    }
  }
  function damageWorn(c, n) {
    const k = c.vk2?.khi;
    if (!k?.worn.length) return;
    for (const id of k.worn) {
      const it = itemOf(k, id);
      if (it && it.dur > 0) it.dur = Math.max(0, it.dur - n);
    }
  }

  function summary(c) {
    const k = c.vk2?.khi;
    if (!k) return null;
    const natal = k.natal ? itemOf(k, k.natal) : null;
    return { items: k.items.length, natal: natal ? { kind: natal.kind, q: natal.q, lv: natal.lv, el: natal.el, spirit: natal.spirit, name: natal.name } : null, cave: k.cave ? { site: k.cave.site, lv: k.cave.lv, b: k.cave.b, stored: k.cave.stored } : null };
  }

  const api = {
    kind: "khi", QUESTS, MATS, KINDS, QUAL, TALISMANS, SITES, BUILDINGS, ENHANCE_MAX, SPIRIT_LV, NATAL_REALM, HELD_MAX, BUILD_MAX, MAT_CAP, TALISMAN_CAP, NEGLECT_YEARS,
    ensure, metric, fx, duel, onYear, tick, nextEvent, eventDef, onBump, addMat, hasMats, craftScore, canCraft, craft, wornSlots, itemOf, itemPower, toggleWorn, enhanceCost, enhance, repair, bindNatal,
    canDraw, draw, hasTalisman, useTalisman, arm, canFound, found, build, buildLv, buildCost, upkeep, storeArt, matPrice, buyMat, afterFight, damageWorn, summary, raidDef,
  };
  root.VK2Khi = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
