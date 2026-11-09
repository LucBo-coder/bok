// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 1 — căn cơ: kinh mạch, đan điền, chu thiên, thể chất, đạo cơ, Kim Đan.
// Logic thuần: không chạm DOM, kiểm thử được bằng Node. Toàn bộ trạng thái nằm ở char.vk2.can, đi theo save của game.
//
// Mọi may rủi lấy từ hash của (lookSeed, năm, loại việc), nên tải lại trang không đổi được kết quả.
(function (root) {
  "use strict";

  // ---------- Dữ liệu ----------

  const METHODS = {
    on: {
      n: ["Ổn định", "Steady"],
      d: ["Tu chậm hơn, gần như không rủi ro, củng cố căn cơ và tự chữa thương.", "Slower, almost riskless. Strengthens your base and heals inner wounds."],
      risk: ["Rủi ro: rất thấp", "Risk: very low"],
      cult: 0.83, tieu: 34, dai: 16, open: 11, openSafe: 0.2, purity: 0.5, stab: 0.5, imp: -0.5, inj: -1.5, incident: 0,
    },
    can: {
      n: ["Cân bằng", "Balanced"],
      d: ["Tốc độ và rủi ro ở mức trung bình.", "Moderate speed and moderate risk."],
      risk: ["Rủi ro: trung bình", "Risk: moderate"],
      cult: 1, tieu: 28, dai: 13, open: 14, openSafe: 0, purity: 0.3, stab: 0.1, imp: 0.1, inj: -0.8, incident: 0,
    },
    cuong: {
      n: ["Cưỡng ép", "Forced"],
      d: ["Tu vi tăng nhanh, nhưng tổn thương kinh mạch, tích tạp chất và dễ tẩu hỏa nhập ma.", "Fast gains, but it wounds the meridians, builds impurity and invites qi deviation."],
      risk: ["Rủi ro: cao", "Risk: high"],
      cult: 1.3, tieu: 22, dai: 10, open: 20, openSafe: -0.15, purity: 0.1, stab: -0.4, imp: 0.5, inj: 0.45, incident: 0.03,
    },
  };

  const MERIDIANS = { regular: 12, extra: 8, total: 20 };
  const GRADES = {
    1: { n: ["Hạ phẩm", "Low grade"], cls: "q1" },
    2: { n: ["Trung phẩm", "Mid grade"], cls: "q2" },
    3: { n: ["Thượng phẩm", "High grade"], cls: "q3" },
    4: { n: ["Tuyệt phẩm", "Peerless"], cls: "q4" },
  };
  // insight nhân kinh nghiệm thiên phú; potential cộng vào trần kinh mạch và đan điền.
  const DAO_CO = {
    name: ["Đạo cơ", "Dao Foundation"], cut: [30, 52, 72],
    fx: { 1: { hp: -0.03, brk: -0.01 }, 2: {}, 3: { hp: 0.05, brk: 0.01 }, 4: { hp: 0.08, def: 0.03, brk: 0.02 } },
    insight: { 1: 0.9, 2: 1, 3: 1.05, 4: 1.1 }, potential: { 1: -4, 2: 0, 3: 2, 4: 4 },
  };
  const KIM_DAN = {
    name: ["Kim Đan", "Golden Core"], cut: [35, 55, 75],
    fx: { 1: { atk: -0.03, cult: -0.02 }, 2: {}, 3: { atk: 0.06, cult: 0.03 }, 4: { atk: 0.1, cult: 0.05, brk: 0.01 } },
    insight: { 1: 0.9, 2: 1, 3: 1.1, 4: 1.2 }, potential: { 1: -2, 2: 0, 3: 1, 4: 2 },
  };
  const FORGE_KINDS = { dao: { def: DAO_CO, field: "daoCo", realm: 2, remoldRealm: 4, remoldCost: 3000 }, dan: { def: KIM_DAN, field: "kimDan", realm: 3, remoldRealm: 5, remoldCost: 8000 } };

  // Cách đúc: dùng chung cho đạo cơ và Kim Đan. Kim Đan đắt hơn vì nằm ở cảnh giới cao hơn.
  const FORGE_OPTS = [
    { id: "tu_nhien", n: ["Thuận theo tự nhiên", "Let it form"], d: ["Không tốn gì. Phẩm chất dựa hoàn toàn vào căn cơ hiện có.", "Free. Grade depends only on your current base."] },
    { id: "linh_thach", n: ["Bày trận linh thạch", "Spirit stone array"], d: ["Điểm đúc +12.", "Forge score +12."], stones: { dao: 300, dan: 1200 }, bonus: 12 },
    { id: "dan_duoc", n: ["Dùng một viên đan", "Use a pill"], d: ["Tiêu hao một viên đan bất kỳ. Điểm đúc +8.", "Consumes any one pill. Forge score +8."], pill: 1, bonus: 8 },
    { id: "mao_hiem", n: ["Cưỡng đúc", "Force it"], d: ["Không tốn tài nguyên. Điểm đúc thay đổi từ -10 tới +20, kinh mạch bị thương.", "No resources. Forge score shifts from -10 to +20, and the meridians are wounded."], gamble: 1, wound: 14 },
  ];
  const PENDING_YEARS = 3; // Để quá số năm này thì căn cơ tự thành theo cách tự nhiên, game không bao giờ bị chặn
  const OMEN_FORGE = { linh_khi: 6, loi_van: 4, cat_tinh: 3, phat_quang: 3 };

  /*
   * Thể chất. fx ở stage cao nhất; ưu điểm nhân theo STAGE_SCALE, nhược điểm giữ nguyên từ đầu.
   * mech là hiệu ứng cơ chế, không chỉ là chỉ số. grow: việc nào làm thể chất phát triển.
   * fate: tỷ lệ kiếp này "có duyên". Đủ điều kiện mà không có duyên thì không thức tỉnh, nên thể chất vẫn hiếm.
   */
  const BODIES = [
    {
      id: "tien_thien", q: 4, n: ["Tiên Thiên Đạo Thể", "Innate Dao Body"],
      d: ["Sinh ra đã gần đạo, tu rất nhanh. Nhưng thân quá thuần nên chịu tạp chất và tổn thương rất kém.", "Born close to the Dao and quick to cultivate, but too pure to bear impurity or wounds."],
      how: ["Bẩm sinh, không thể thức tỉnh sau này", "Innate only"], grow_d: ["Tu luyện theo cách Ổn định", "Cultivate Steadily"],
      awake: null, fx: { cult: 0.12, brk: 0.03 }, con: {}, mech: { injuryMul: 2, impMul: 1.5 },
      con_d: ["Tổn thương ×2, tạp chất ×1,5", "Wounds ×2, impurity ×1.5"], grow: { y_m_on: 1 },
    },
    {
      id: "hon_don", q: 4, n: ["Hỗn Độn Thể", "Chaos Body"],
      d: ["Dung nạp đủ năm hệ, mạnh đều mọi mặt. Kinh mạch dày nên rất khó khai mở.", "Holds all five elements and is strong all round, but its thick meridians open slowly."],
      how: ["Ngũ hành tạp căn, đạt Kim Đan", "A five-element root, and reach Golden Core"], grow_d: ["Tu luyện và chiến đấu", "Cultivate and fight"],
      awake: [["root_count", 5], ["realm", 3]], fate: 0.3, fx: { atk: 0.06, def: 0.06, hp: 0.06 }, con: { cult: -0.08 }, mech: { openCost: 1.4 },
      con_d: ["Tốc độ tu -8%, khai mạch tốn gấp 1,4 lần", "Cultivation -8%, meridians cost ×1.4"], grow: { y_tu_luyen: 1, kills: 1 },
    },
    {
      id: "cuu_am", q: 3, n: ["Cửu Âm Huyền Thể", "Nine Yin Body"],
      d: ["Hàn khí thuần âm giúp tâm tĩnh và đột phá vững, nhưng thân thể lạnh yếu.", "Pure yin cold calms the mind and steadies breakthroughs, but the body runs frail."],
      how: ["Linh căn có hệ Thủy, tu Ổn định 20 năm", "A Water root, and 20 years of Steady cultivation"], grow_d: ["Tu luyện theo cách Ổn định", "Cultivate Steadily"],
      awake: [["root_thuy", 1], ["y_m_on", 20]], fate: 0.2, fx: { cult: 0.06, def: 0.03, brk: 0.02 }, con: { hp: -0.07 }, mech: {},
      con_d: ["Sinh lực -7%", "HP -7%"], grow: { y_m_on: 1 },
    },
    {
      id: "chi_duong", q: 3, n: ["Chí Dương Thần Thể", "Supreme Yang Body"],
      d: ["Dương hỏa bừng bừng, đánh mạnh và hợp lò đan, nhưng tính nóng khiến tâm ma dễ dày.", "Blazing yang hits hard and suits the furnace, but the temper feeds inner demons."],
      how: ["Linh căn có hệ Hỏa, luyện đan 8 năm", "A Fire root, and 8 years of alchemy"], grow_d: ["Luyện đan và chiến đấu", "Alchemy and combat"],
      awake: [["root_hoa", 1], ["y_luyen_dan", 8]], fate: 0.25, fx: { atk: 0.1, cult: 0.03 }, con: { def: -0.03 }, mech: { tamMaYear: 0.2 },
      con_d: ["Phòng -3%, tâm ma +0,2 mỗi năm", "Defence -3%, inner demons +0.2 yearly"], grow: { y_luyen_dan: 1, kills: 1 },
    },
    {
      id: "hoang_co", q: 4, n: ["Hoang Cổ Thánh Thể", "Primeval Holy Body"],
      d: ["Khí huyết như lò, càng đánh càng cứng. Đổi lại, tu luyện chậm hẳn.", "Blood like a furnace that hardens with every fight, at the cost of far slower cultivation."],
      how: ["Thắng 40 trận, đạt Trúc Cơ", "Win 40 fights, and reach Foundation"], grow_d: ["Chiến đấu", "Combat"],
      awake: [["kills", 40], ["realm", 2]], fate: 0.4, fx: { hp: 0.16, def: 0.12 }, con: { cult: -0.12 }, mech: {},
      con_d: ["Tốc độ tu -12%", "Cultivation -12%"], grow: { kills: 2 },
    },
    {
      id: "bat_diet", q: 4, n: ["Bất Diệt Ma Thể", "Undying Demon Body"],
      d: ["Thương tích tự lành rất nhanh. Nhưng ma khí bám thân, thiên kiếp ghét và tâm ma không ngừng lớn.", "Wounds close by themselves, but demonic qi clings on; tribulations hate it and inner demons keep growing."],
      how: ["Đạo tâm ≤ -30, thắng 30 trận, đạt Kim Đan", "Dao Heart ≤ -30, win 30 fights, and reach Golden Core"], grow_d: ["Chiến đấu và tu Cưỡng ép", "Combat and Forced cultivation"],
      awake: [["evil", 1], ["kills", 30], ["realm", 3]], fate: 0.4, fx: { hp: 0.14, atk: 0.06 }, con: { brk: -0.03 }, mech: { healMul: 2, tamMaYear: 0.3 },
      con_d: ["Đột phá -3%, tâm ma +0,3 mỗi năm", "Breakthrough -3%, inner demons +0.3 yearly"], grow: { kills: 1, y_m_cuong: 2 },
    },
    {
      id: "kiem_cot", q: 3, n: ["Kiếm Cốt", "Sword Bone"],
      d: ["Xương cốt sinh ra để cầm kiếm: tấn công sắc bén, nhưng quên mất việc tự vệ.", "Bones made to hold a blade: a keen offence that forgets to guard itself."],
      how: ["Theo Kiếm đạo, thắng 15 trận bằng kiếm", "Follow the Sword path and win 15 sword fights"], grow_d: ["Chiến đấu bằng kiếm", "Sword fights"],
      awake: [["path_kiem", 1], ["kills_kiem", 15]], fate: 0.4, fx: { atk: 0.12 }, con: { def: -0.05 }, mech: {},
      con_d: ["Phòng -5%", "Defence -5%"], grow: { kills_kiem: 2 },
    },
    {
      id: "van_doc", q: 3, n: ["Vạn Độc Chi Thể", "Myriad Poison Body"],
      d: ["Đan độc ngấm thành sức mạnh, không còn tích tạp chất. Thân thể mang độc nên sinh lực kém.", "Pill toxin becomes strength and impurity no longer builds, but the poisoned body has less vitality."],
      how: ["Luyện đan 15 năm", "15 years of alchemy"], grow_d: ["Luyện đan", "Alchemy"],
      awake: [["y_luyen_dan", 15]], fate: 0.3, fx: { atk: 0.05, def: 0.05 }, con: { hp: -0.08 }, mech: { impMul: 0 },
      con_d: ["Sinh lực -8%", "HP -8%"], grow: { y_luyen_dan: 2 },
    },
    {
      id: "truong_sinh", q: 3, n: ["Trường Sinh Thể", "Longevity Body"],
      d: ["Thọ nguyên dài hơn người thường, nhưng khí huyết bình hòa nên đánh yếu và tu chậm.", "A longer life than most, but such mild blood fights weakly and cultivates slowly."],
      how: ["Sống tới 120 tuổi khi tâm ma ≤ 30", "Live to 120 with inner demons ≤ 30"], grow_d: ["Tu luyện theo cách Ổn định", "Cultivate Steadily"],
      awake: [["age", 120], ["tamma_ok", 1]], fate: 0.12, fx: { hp: 0.06 }, con: { atk: -0.08, cult: -0.05 }, mech: { lifeOnce: 0.15 },
      con_d: ["Công -8%, tốc độ tu -5%", "Attack -8%, cultivation -5%"], grow: { y_m_on: 1 },
    },
    {
      id: "luan_hoi", q: 4, n: ["Luân Hồi Đạo Thể", "Samsara Dao Body"],
      d: ["Trải nhiều kiếp nên lĩnh ngộ nhanh, nhưng hồn nặng làm thân xác yếu đi.", "So many lives bring quick insight, but the heavy soul weakens the flesh."],
      how: ["Trải qua 20 kiếp, kiếp này sống tới 40 tuổi", "Live through 20 lives, and reach age 40 in this one"], grow_d: ["Du ngoạn và tu luyện", "Roaming and cultivating"],
      awake: [["lives", 20], ["age", 40]], fate: 0.15, fx: { cult: 0.05 }, con: { hp: -0.08 }, mech: { insight: 1.25 },
      con_d: ["Sinh lực -8%", "HP -8%"], grow: { y_du_ngoan: 1, y_tu_luyen: 1 },
    },
  ];
  const BODY_PHAM = { id: "pham", q: 1, n: ["Phàm Thể", "Mortal Body"], d: ["Không có gì đặc biệt, cũng không có gánh nặng gì. Có thể thức tỉnh thể chất khác sau này.", "Nothing special and no burdens. Another body can still awaken later."], fx: {}, con: {}, mech: {}, grow: {} };
  const STAGES = { names: [["Sơ thành", "Initial"], ["Đại thành", "Greater"], ["Viên mãn", "Perfected"]], scale: [0.6, 0.8, 1], xp: [60, 180] };
  const bodyDef = new Map([BODY_PHAM, ...BODIES].map((b) => [b.id, b]));

  // Nhiệm vụ căn cơ: một lần mỗi kiếp, hiện trong nhật ký VK2 cùng các nhóm khác.
  const QUESTS = [
    { id: "c_tieu", t: ["Vận hành trọn một tiểu chu thiên", "Complete a Lesser Circulation"], goal: ["can_tieu", 1], r: { stones: 20 }, go: { focus: "tu_luyen" } },
    { id: "c_open3", after: "c_tieu", t: ["Khai mở 3 kinh mạch", "Open 3 meridians"], goal: ["can_open", 3], r: { stones: 50, stat: { ngoTinh: 1 } }, go: { tab: "can" } },
    { id: "c_open6", after: "c_open3", t: ["Khai mở 6 kinh mạch để thông đại chu thiên", "Open 6 meridians to reach the Greater Circulation"], goal: ["can_open", 6], r: { stones: 150 }, go: { tab: "can" } },
    { id: "c_dai", after: "c_open6", t: ["Vận hành trọn một đại chu thiên", "Complete a Greater Circulation"], goal: ["can_dai", 1], r: { stones: 300, stat: { tamCanh: 2 } }, go: { focus: "tu_luyen" } },
    { id: "c_dao", t: ["Đúc xong đạo cơ", "Forge your Dao Foundation"], goal: ["dao_grade", 1], r: { stones: 200 }, go: { tab: "can" } },
    { id: "c_dao3", after: "c_dao", t: ["Có đạo cơ từ Thượng phẩm", "Hold a High-grade Dao Foundation"], goal: ["dao_grade", 3], r: { stat: { tamCanh: 3 } }, go: { tab: "can" } },
    { id: "c_dan", t: ["Ngưng tụ xong Kim Đan", "Condense your Golden Core"], goal: ["dan_grade", 1], r: { stones: 600 }, go: { tab: "can" } },
    { id: "c_body", t: ["Thức tỉnh một thể chất đặc biệt", "Awaken a special body"], goal: ["has_body", 1], r: { stat: { khiVan: 2 } }, go: { tab: "can" } },
  ];

  // ---------- Tiện ích ----------

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  function hash32(n) {
    let x = (n | 0) ^ 0x9e3779b9;
    x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
  }
  /** Số trong [0,1) xác định theo nhân vật, năm và loại việc. */
  const rnd = (c, year, salt) => hash32(hash32((c.lookSeed ?? 0) + Math.imul(year + 1, 73856093)) + Math.imul(salt, 19349663)) / 4294967296;

  const stageOf = (xp) => (xp >= STAGES.xp[1] ? 2 : xp >= STAGES.xp[0] ? 1 : 0);
  const bodyOf = (c) => bodyDef.get(c.vk2?.can?.body?.id) ?? BODY_PHAM;
  const mech = (c, key, fallback) => bodyOf(c).mech[key] ?? fallback;

  /** Trần kinh mạch theo cảnh giới và tiềm năng căn cơ. Phân biệt sức mạnh hiện tại với tiềm năng. */
  function meridianCap(c) {
    const can = c.vk2?.can;
    const realm = c.realm ?? 0;
    const byRealm = realm <= 0 ? 3 : realm === 1 ? 8 : realm === 2 ? 12 : 12 + (realm - 2) * 2;
    const potential = (can?.daoCo ? DAO_CO.potential[can.daoCo.grade] : 0) + (can?.kimDan ? KIM_DAN.potential[can.kimDan.grade] : 0);
    return clamp(realm >= 3 ? byRealm + potential : byRealm, 0, MERIDIANS.total);
  }
  function dantianCap(c) {
    const can = c.vk2?.can;
    const potential = (can?.daoCo ? DAO_CO.potential[can.daoCo.grade] : 0) + (can?.kimDan ? KIM_DAN.potential[can.kimDan.grade] : 0);
    return clamp(30 + (c.realm ?? 0) * 12 + potential * 2, 20, 100);
  }
  const openCost = (c, open) => (40 + 15 * open) * mech(c, "openCost", 1);

  // ---------- Khởi tạo và save cũ ----------

  /** Thể chất lúc sinh: đa số là Phàm Thể. Xác định theo seed, nên chơi lại không đổi được. */
  function birthBody(c) {
    const core = root.VK2Core;
    const r = hash32((c.lookSeed ?? 0) ^ 0x3c6ef372) % 1000;
    const info = core.rootInfo(c);
    const has = (e) => info.elements.includes(e);
    if (r < 5) return "tien_thien";
    if (r < 15) return "truong_sinh";
    if (r < 30) {
      if (has("thuy")) return "cuu_am";
      if (has("hoa")) return "chi_duong";
      if (has("kim")) return "kiem_cot";
    }
    if (r < 50 && info.count === 5) return "hon_don";
    return "pham";
  }

  function newCan(c) {
    return {
      v: 1, method: "can", year: Math.floor(c.age ?? 0), purity: 0, stability: 50, dantian: 10, open: 0, openProg: 0,
      tieu: 0, tieuCount: 0, dai: 0, daiCount: 0, injury: 0, impurity: 0,
      body: { id: "pham", xp: 0, innate: false }, daoCo: null, kimDan: null, pending: null,
      failSeen: "", warned: 0, closed: false,
    };
  }

  /** Thành quả căn cơ được đánh dấu "legacy" thay vì phát thưởng, và save cũ không bao giờ bị phạt phẩm chất. */
  function ensure(c, acct) {
    const core = root.VK2Core;
    const v = core.ensure(c, acct);
    if (v.can) return v.can;
    const started = (c.age ?? 0) >= 1;
    const can = (v.can = newCan(c));
    const bid = birthBody(c);
    if (bid !== "pham") grantBody(c, bid, true);
    if (started) {
      // Nhân vật đang chơi dở: ước lượng căn cơ theo số năm đã tu, không vượt trần hiện tại.
      const y = v.c?.y_tu_luyen ?? 0;
      can.purity = clamp(y * 0.3, 0, 70);
      can.dantian = clamp(10 + y * 0.2, 10, dantianCap(c));
      can.open = Math.min(Math.floor(y / 6), meridianCap(c));
      can.tieuCount = Math.floor(y / 4);
      can.daiCount = can.open >= 6 ? Math.floor(y / 12) : 0;
      if (c.breakFail) can.failSeen = `${c.breakFail.r}:${c.breakFail.n}`; // Lần thất bại cũ không tính lại
      if ((c.realm ?? 0) >= 2) can.daoCo = { grade: 2, score: 40, how: "legacy", remolded: false };
      if ((c.realm ?? 0) >= 3) can.kimDan = { grade: 2, score: 45, how: "legacy", remolded: false };
      for (const q of QUESTS) if (core.metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
    }
    return can;
  }

  function grantBody(c, id, innate) {
    const can = c.vk2.can;
    const def = bodyDef.get(id);
    can.body = { id, xp: 0, innate: !!innate };
    if (def.mech.lifeOnce && (c.lifespan ?? 0) > 0) {
      const add = Math.round(c.lifespan * def.mech.lifeOnce);
      c.lifespan += add;
      c.lifeExtra = (c.lifeExtra ?? 0) + add; // Trường game dùng để giữ phần thọ thêm khi đột phá
    }
  }

  /** Có duyên hay không được định từ lúc sinh, nên chờ thêm hay tải lại trang cũng không đổi được. */
  const hasFate = (c, def) => rnd(c, 0, 100 + BODIES.indexOf(def)) < (def.fate ?? 1);

  function canAwakenBody(def, c, acct) {
    const core = root.VK2Core;
    return !!def.awake && hasFate(c, def) && def.awake.every(([m, n]) => core.metric(m, c, acct) >= n);
  }

  /** Mỗi kiếp một thể chất. Có rồi thì không thức tỉnh thêm, kể cả thể chất mạnh hơn. */
  function checkBody(c, acct) {
    const can = ensure(c, acct);
    if (can.body.id !== "pham") return null;
    for (const def of BODIES) {
      if (canAwakenBody(def, c, acct)) {
        grantBody(c, def.id, false);
        return def.id;
      }
    }
    return null;
  }

  function metric(name, c) {
    const can = c.vk2?.can;
    switch (name) {
      case "can_open": return can?.open ?? 0;
      case "can_tieu": return can?.tieuCount ?? 0;
      case "can_dai": return can?.daiCount ?? 0;
      case "dao_grade": return can?.daoCo?.grade ?? 0;
      case "dan_grade": return can?.kimDan?.grade ?? 0;
      case "has_body": return can && can.body.id !== "pham" ? 1 : 0;
      case "root_thuy": return root.VK2Core.rootInfo(c).elements.includes("thuy") ? 1 : 0;
      case "root_hoa": return root.VK2Core.rootInfo(c).elements.includes("hoa") ? 1 : 0;
      default: return undefined;
    }
  }

  // ---------- Hiệu ứng ----------

  /** Hiệu ứng căn cơ, cộng chung với thiên phú và đi qua cùng trần giảm dần trong core.js. */
  function fx(c) {
    const can = c.vk2?.can;
    if (!can) return [];
    const out = [{
      cult: can.open * 0.012,
      def: can.open * 0.002,
      atk: (can.purity / 100) * 0.06,
      hp: ((can.dantian - 10) / 90) * 0.1,
    }];
    const stab = ((can.stability - 50) / 50) * 0.03;
    out.push({ brk: stab - can.injury * 0.001 - can.impurity * 0.0005 });
    if (can.purity > 0) out.push({ brk: (can.purity / 100) * 0.03 });
    if (can.daoCo) out.push(DAO_CO.fx[can.daoCo.grade]);
    if (can.kimDan) out.push(KIM_DAN.fx[can.kimDan.grade]);
    const body = bodyOf(c);
    const scale = STAGES.scale[stageOf(can.body.xp)];
    const pro = {};
    for (const [k, x] of Object.entries(body.fx)) pro[k] = x * scale;
    out.push(pro, body.con);
    return out;
  }

  /** Hệ số tốc độ tu không qua trần: phương pháp đang dùng, trừ đi nội thương và tạp chất. */
  function cultFactor(c) {
    const can = c.vk2?.can;
    if (!can) return 1;
    const practising = (can.closed || c.focus === "tu_luyen") && (c.realm ?? 0) >= 1; // Phàm nhân chưa có chân khí để vận công
    const m = practising ? (METHODS[can.method] ?? METHODS.can).cult : 1;
    return m * Math.max(0.7, 1 - can.injury * 0.003) * Math.max(0.85, 1 - can.impurity * 0.0015);
  }

  /** Khả năng lĩnh ngộ: nhân kinh nghiệm thiên phú. */
  function insight(c) {
    const can = c.vk2?.can;
    if (!can) return 1;
    return (can.daoCo ? DAO_CO.insight[can.daoCo.grade] : 1) * (can.kimDan ? KIM_DAN.insight[can.kimDan.grade] : 1) * mech(c, "insight", 1);
  }

  function onBump(c, name, n) {
    const can = c.vk2?.can;
    if (!can) return;
    const w = bodyOf(c).grow?.[name];
    if (w) can.body.xp += w * n;
  }

  // ---------- Một năm ----------

  function addStat(c, key, n) {
    if (c.stats) c.stats[key] = clamp((c.stats[key] ?? 0) + n, 0, 100);
  }

  /**
   * Gọi đúng một lần mỗi năm từ vòng lặp gốc (bản vá nP). Trả về các ghi chú cho giao diện.
   * Năm đã xử lý được lưu lại, nên gọi lặp không tính trùng.
   */
  function onYear(c, acct, opts) {
    const can = ensure(c, acct);
    const core = root.VK2Core;
    const year = Math.floor(c.age ?? 0);
    const notes = [];
    if (year <= can.year) return notes;
    can.year = year;
    can.closed = !!opts?.closed;
    const practising = year >= 6 && (can.closed || c.focus === "tu_luyen");
    const injMul = mech(c, "injuryMul", 1);
    const impMul = mech(c, "impMul", 1);
    const healMul = mech(c, "healMul", 1);
    const m = (c.realm ?? 0) >= 1 ? (METHODS[can.method] ?? METHODS.can) : METHODS.can;

    if (practising) {
      const ngo = c.stats?.ngoTinh ?? 50;
      const learn = 0.7 + (ngo / 100) * 0.6;
      core.bump(c, acct, m === METHODS.on ? "y_m_on" : m === METHODS.cuong ? "y_m_cuong" : "y_m_can", 1);

      can.tieu += m.tieu * learn;
      while (can.tieu >= 100) {
        can.tieu -= 100;
        can.tieuCount += 1;
        can.purity += 1.2;
        can.dantian += 0.6;
        if (can.tieuCount === 1) notes.push({ kind: "big", t: ["Lần đầu vận hành trọn tiểu chu thiên.", "First Lesser Circulation complete."] });
      }
      if (can.open >= 6) {
        can.dai += m.dai * learn;
        while (can.dai >= 100) {
          can.dai -= 100;
          can.daiCount += 1;
          can.purity += 3;
          can.dantian += 2;
          can.stability += 2;
          if (can.daiCount === 1) notes.push({ kind: "big", t: ["Đại chu thiên đã thông, chân khí chạy khắp toàn thân.", "The Greater Circulation flows; true qi fills your whole body."] });
        }
      }

      if (can.open < meridianCap(c)) {
        can.openProg += m.open * learn * (1 - can.injury / 200);
        const cost = openCost(c, can.open);
        if (can.openProg >= cost) {
          const chance = clamp(0.55 + (can.stability - 50) / 100 + m.openSafe, 0.2, 0.97);
          if (rnd(c, year, 11) < chance) {
            can.open += 1;
            can.openProg -= cost;
            notes.push({ kind: "good", t: [`Khai mở kinh mạch thứ ${can.open}.`, `Meridian ${can.open} opened.`] });
          } else {
            can.openProg *= 0.5;
            can.injury += 8 * injMul;
            notes.push({ kind: "bad", t: ["Xung mạch thất bại, kinh mạch bị thương.", "Failed to open a meridian, and it was wounded."] });
          }
        }
      }

      can.purity += m.purity * (1 - can.impurity / 150);
      can.stability += m.stab;
      can.impurity += m.imp >= 0 ? m.imp * impMul : m.imp;
      can.injury += m.inj >= 0 ? m.inj * injMul : m.inj * healMul;

      if (m.incident > 0) {
        const risk = m.incident + can.injury / 800 - can.stability / 2000;
        if (rnd(c, year, 23) < risk) {
          can.injury += 6 * injMul;
          can.impurity += 2 * impMul;
          addStat(c, "tamMa", 2);
          notes.push({ kind: "bad", t: ["Vận công quá gấp, chân khí chạy loạn. Nội thương nặng thêm, tâm ma trỗi dậy.", "Forcing your qi sends it astray: inner wounds worsen and demons stir."] });
        }
      }
    } else {
      // Không tu luyện thì thân thể được nghỉ. Luyện đan giúp đào thải tạp chất.
      can.injury -= 2 * healMul;
      if (c.focus === "luyen_dan") can.impurity -= 1;
    }

    // Nội thương nặng nuôi tâm ma của game, và tâm ma cao sẽ đi vào luồng tẩu hỏa nhập ma có sẵn.
    if (can.injury >= 70) {
      addStat(c, "tamMa", 1);
      addStat(c, "sucKhoe", -2);
    } else if (can.injury >= 40) {
      addStat(c, "tamMa", 0.25);
    }
    if (can.injury >= 50 && can.warned < year - 10) {
      can.warned = year;
      notes.push({ kind: "bad", t: ["Nội thương đã nặng. Nên đổi sang cách Ổn định, hoặc dừng tu vài năm để dưỡng thương.", "Your inner wounds are serious. Switch to Steady, or stop practising for a few years."] });
    }

    const body = bodyOf(c);
    if (body.mech.tamMaYear) addStat(c, "tamMa", body.mech.tamMaYear);

    normalize(c);

    if (can.pending && year - can.pending.at >= PENDING_YEARS) {
      const done = forge(c, can.pending.kind, "tu_nhien");
      if (done) notes.push(forgeNote(done.kind, done));
    }
    return notes;
  }

  function normalize(c) {
    const can = c.vk2.can;
    can.purity = clamp(can.purity, 0, 100);
    can.stability = clamp(can.stability, 0, 100);
    can.dantian = clamp(can.dantian, 0, dantianCap(c));
    can.injury = clamp(can.injury, 0, 100);
    can.impurity = clamp(can.impurity, 0, 100);
  }

  // ---------- Đúc đạo cơ và Kim Đan ----------

  function techScore(c) {
    return Math.min(1, (c.cp?.own?.length ?? 0) / 2) * 100;
  }

  let omen = null; // Hàm kiểm tra thiên tượng của bundle. Chưa có thì coi như trời yên.
  const captureOmen = (fn) => {
    omen = fn;
  };
  const omenIs = (id) => !!omen?.(id);

  /** Thiên tượng hôm nay giúp hay cản việc đúc. */
  function skyBonus(c) {
    if (!omen) return 0;
    let sky = 0;
    for (const [id, n] of Object.entries(OMEN_FORGE)) if (omen(id)) sky += n;
    if (omen("huyet_nguyet")) sky += (c.daoTam ?? 0) < 0 ? 6 : -3;
    return sky;
  }

  /** Điểm đúc trước khi tính tài nguyên. Giao diện dùng để cho người chơi xem trước. */
  function forgeBase(c, kind) {
    const can = c.vk2.can;
    const tam = c.stats?.tamCanh ?? 50;
    const penalty = can.injury * 0.12 + can.impurity * 0.1;
    const sky = skyBonus(c);
    if (kind === "dao") return clamp(can.purity * 0.6 + can.stability * 0.25 + techScore(c) * 0.15 + tam * 0.2 + sky - penalty, 0, 100);
    const dao = can.daoCo?.score ?? 40;
    return clamp(dao * 0.4 + can.purity * 0.2 + (100 - can.impurity) * 0.1 + tam * 0.1 + can.stability * 0.1 + techScore(c) * 0.1 + sky - penalty, 0, 100);
  }

  function gradeOf(kind, score) {
    const cut = FORGE_KINDS[kind].def.cut;
    return score >= cut[2] ? 4 : score >= cut[1] ? 3 : score >= cut[0] ? 2 : 1;
  }

  function firstPill(c) {
    return Object.keys(c.pills ?? {}).find((id) => c.pills[id] > 0) ?? null;
  }

  function forgeOptions(c, kind) {
    return FORGE_OPTS.map((o) => {
      const stones = o.stones?.[kind] ?? 0;
      const ok = (!stones || (c.linhThach ?? 0) >= stones) && (!o.pill || !!firstPill(c));
      return { ...o, cost: stones, ok };
    });
  }

  /** Đúc xong thì xóa trạng thái chờ. Gọi lại khi không có việc chờ thì không làm gì, nên không phát thưởng trùng. */
  function forge(c, kind, optId) {
    const can = c.vk2?.can;
    if (!can || can.pending?.kind !== kind) return null;
    const conf = FORGE_KINDS[kind];
    const opt = forgeOptions(c, kind).find((o) => o.id === optId);
    if (!opt || !opt.ok) return null;
    if (opt.cost) c.linhThach -= opt.cost;
    if (opt.pill) c.pills[firstPill(c)] -= 1;
    let bonus = opt.bonus ?? 0;
    if (opt.gamble) bonus = Math.round(-10 + 30 * rnd(c, Math.floor(c.age ?? 0), kind === "dao" ? 41 : 43));
    if (opt.wound) can.injury = clamp(can.injury + opt.wound * mech(c, "injuryMul", 1), 0, 100);
    const score = clamp(forgeBase(c, kind) + bonus, 0, 100);
    const result = { grade: gradeOf(kind, score), score: Math.round(score), how: optId, remolded: false };
    can[conf.field] = result;
    can.pending = null; // Việc đúc kế tiếp (nếu có) được mở ở nhịp tick sau, kèm thông báo
    return { ...result, kind };
  }

  function forgeNote(kind, done) {
    const def = FORGE_KINDS[kind].def;
    const g = GRADES[done.grade].n;
    return { kind: done.grade >= 3 ? "big" : "good", t: [`${def.name[0]} đã thành: ${g[0]}.`, `${def.name[1]} complete: ${g[1]}.`] };
  }

  /** Vừa qua cảnh giới mà chưa đúc thì mở việc chờ. Nhảy cóc qua cảnh giới thì việc cũ tự thành để không mất lượt. */
  function syncPending(c) {
    const can = c.vk2.can;
    const realm = c.realm ?? 0;
    if (can.pending) return;
    const year = Math.floor(c.age ?? 0);
    if (realm >= 2 && !can.daoCo) can.pending = { kind: "dao", at: year };
    else if (realm >= 3 && !can.kimDan) can.pending = { kind: "dan", at: year };
  }

  /** Cải tạo căn cơ: mỗi loại một lần mỗi kiếp, đắt và gây thương tích, nên là cứu cánh chứ không phải đường tắt. */
  function canRemold(c, kind) {
    const can = c.vk2?.can;
    const conf = FORGE_KINDS[kind];
    const cur = can?.[conf.field];
    return !!cur && !cur.remolded && cur.grade < 4 && (c.realm ?? 0) >= conf.remoldRealm && (c.linhThach ?? 0) >= conf.remoldCost;
  }

  function remold(c, kind) {
    if (!canRemold(c, kind)) return false;
    const can = c.vk2.can;
    const conf = FORGE_KINDS[kind];
    c.linhThach -= conf.remoldCost;
    can[conf.field].grade += 1;
    can[conf.field].remolded = true;
    can.injury = clamp(can.injury + 15 * mech(c, "injuryMul", 1), 0, 100);
    addStat(c, "tamMa", 10);
    return true;
  }

  // ---------- Thao tác của người chơi ----------

  function setMethod(c, acct, id) {
    const can = ensure(c, acct);
    if (!METHODS[id]) return false;
    can.method = id;
    return true;
  }

  // Dùng đan của game để chữa căn cơ, nên đan dược và kinh tế có thêm chỗ tiêu dùng.
  const PILL_USES = {
    hoi_xuan: { n: ["Hồi Xuân Đan", "Spring Revival Pill"], d: ["Nội thương -25", "Inner wounds -25"], run: (can) => { can.injury -= 25; } },
    thanh_tam: { n: ["Thanh Tâm Đan", "Clear Heart Pill"], d: ["Tạp chất -15", "Impurity -15"], run: (can) => { can.impurity -= 15; } },
    tu_khi: { n: ["Tụ Khí Đan", "Qi Gathering Pill"], d: ["Tiến độ khai mạch +25", "Meridian progress +25"], run: (can) => { can.openProg += 25; } },
  };

  function usePill(c, acct, id) {
    const can = ensure(c, acct);
    const use = PILL_USES[id];
    if (!use || !((c.pills?.[id] ?? 0) > 0)) return false;
    c.pills[id] -= 1;
    use.run(can);
    normalize(c);
    return true;
  }

  // ---------- Theo dõi trạng thái mỗi nhịp ----------

  /** Gọi từ core.tick mỗi nhịp, kể cả khi không có năm mới: bắt đột phá, thất bại và thức tỉnh. */
  function tick(c, acct) {
    const can = ensure(c, acct);
    const notes = [];
    if (c.dead) return notes;
    const realm = c.realm ?? 0;
    const before = can.pending?.kind;
    syncPending(c);
    // Đã vượt qua Kim Đan mà đạo cơ còn chờ thì đúc ngay để không kẹt, rồi mở tiếp việc ngưng đan.
    if (can.pending?.kind === "dao" && realm >= 3) {
      const done = forge(c, "dao", "tu_nhien");
      if (done) notes.push(forgeNote("dao", done));
      syncPending(c);
    }
    if (can.pending && can.pending.kind !== before) {
      notes.push({ kind: "big", pending: can.pending.kind, t: can.pending.kind === "dao" ? ["Trúc Cơ đã thành. Hãy đúc đạo cơ trong tab Căn Cơ.", "Foundation reached. Forge your Dao Foundation in the Base tab."] : ["Kim Đan sắp thành. Hãy chọn cách ngưng đan trong tab Căn Cơ.", "A Golden Core is near. Choose how to condense it in the Base tab."] });
    }
    // Đột phá thất bại làm tổn thương kinh mạch. breakFail của game đổi mỗi lần thất bại.
    const f = c.breakFail;
    const key = f ? `${f.r}:${f.n}` : "";
    if (key !== can.failSeen) {
      if (f) {
        can.injury = clamp(can.injury + 6 * mech(c, "injuryMul", 1), 0, 100);
        can.stability = clamp(can.stability - 2, 0, 100);
      }
      can.failSeen = key;
    }
    const body = checkBody(c, acct);
    if (body) {
      const def = bodyDef.get(body);
      notes.push({ kind: "big", t: [`Thức tỉnh thể chất: ${def.n[0]}.`, `Body awakened: ${def.n[1]}.`] });
    }
    return notes;
  }

  function summary(c) {
    const can = c.vk2?.can;
    if (!can) return null;
    return { body: can.body.id, open: can.open, dao: can.daoCo?.grade ?? 0, dan: can.kimDan?.grade ?? 0 };
  }

  root.VK2Can = {
    METHODS, MERIDIANS, GRADES, DAO_CO, KIM_DAN, FORGE_KINDS, FORGE_OPTS, BODIES, BODY_PHAM, STAGES, QUESTS, PILL_USES, PENDING_YEARS,
    bodyDef, bodyOf, hasFate, stageOf, meridianCap, dantianCap, openCost, birthBody, ensure, checkBody, canAwakenBody, metric, fx, cultFactor, insight,
    onBump, onYear, tick, captureOmen, omenIs, forgeBase, forgeOptions, forge, forgeNote, gradeOf, canRemold, remold, setMethod, usePill, summary,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
