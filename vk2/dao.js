// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 2 — ngộ đạo, sáng tạo công pháp, bí cảnh nhiều tầng, truyền thừa cổ tu.
// Logic thuần, trạng thái ở char.vk2.dao. Trận trong bí cảnh dùng VK2Core.duel với chỉ số thật của game.
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, rnd, yearOf, tr, addStat, hash32 } = C.kit;

  // ---------- Đạo niệm: nền của ngộ đạo ----------

  const CONCEPTS = {
    kiem_y: ["Kiếm Ý", "Sword Intent"], loi_phap: ["Lôi Pháp", "Thunder Arts"], hoa_phap: ["Hỏa Pháp", "Fire Arts"], thuy_phap: ["Thủy Pháp", "Water Arts"],
    moc_phap: ["Mộc Pháp", "Wood Arts"], tho_phap: ["Thổ Pháp", "Earth Arts"], kim_phap: ["Kim Pháp", "Metal Arts"], dan_dao: ["Đan Đạo", "Alchemy"],
    tran_dao: ["Trận Đạo", "Formations"], the_tu: ["Thể Tu", "Body Refining"], kim_cuong: ["Kim Cương Pháp", "Vajra Arts"], hon_thuat: ["Hồn Thuật", "Soul Arts"],
    ma_cong: ["Ma Công", "Demonic Arts"], yeu_huyet: ["Yêu Huyết", "Beast Blood"], phat_phap: ["Phật Pháp", "Buddhist Arts"],
  };
  const MASTERY_NAMES = [[0, ["Sơ kiến", "Glimpsed"]], [30, ["Lĩnh ngộ", "Understood"]], [60, ["Thuần thục", "Practised"]], [90, ["Viên mãn", "Perfected"]]];
  const COMBINE_AT = 60;
  const PATH_RATE = { kiem: { kiem_y: 2 }, dan: { dan_dao: 2, hoa_phap: 0.5 }, tran: { tran_dao: 2 }, phat: { phat_phap: 2, kim_cuong: 1 }, ma: { ma_cong: 2, hon_thuat: 0.7 }, yeu: { yeu_huyet: 2, the_tu: 0.8 } };
  const ELEMENT_RATE = { kim: "kim_phap", moc: "moc_phap", thuy: "thuy_phap", hoa: "hoa_phap", tho: "tho_phap" };
  const FOCUS_RATE = { tru_yeu: { the_tu: 1 }, luyen_dan: { dan_dao: 1.2, hoa_phap: 0.4 }, du_ngoan: { loi_phap: 0.3, moc_phap: 0.3, thuy_phap: 0.3 } };
  const STUDY_RATE = 2.5; // Đạo niệm đang chuyên tâm, trong năm Tu luyện

  /*
   * Công thức có quy tắc: hai đạo niệm từ Thuần thục mới kết hợp được, và chỉ những cặp tương thích ở đây.
   * fx/con như thể chất. mech là cơ chế thật trong trận hoặc trong năm. year là cái giá phải trả mỗi năm khi vận hành.
   */
  const RECIPES = [
    { id: "loi_kiem", a: "kiem_y", b: "loi_phap", el: "kim", n: ["Lôi Đình Kiếm Quyết", "Thunderclap Sword Art"], realm: 2, stones: 400, fx: { atk: 0.12 }, con: { def: -0.03 }, duel: { extra: 0.25 }, d: ["Kiếm nhanh như sét: 25% đánh thêm một đòn mỗi lượt.", "Swords like lightning: 25% for an extra strike each turn."] },
    { id: "chan_hoa", a: "hoa_phap", b: "dan_dao", el: "hoa", n: ["Chân Hỏa Luyện Đan", "True Fire Alchemy"], realm: 2, stones: 400, fx: { cult: 0.03 }, con: { def: -0.02 }, mech: { pill: 0.25 }, d: ["Năm Luyện đan có thêm 25% ra đan, và đào thải tạp chất nhanh gấp đôi.", "Alchemy years gain 25% for an extra pill and purge impurity twice as fast."] },
    { id: "bat_diet", a: "the_tu", b: "kim_cuong", el: "tho", n: ["Bất Diệt Kim Thân", "Undying Golden Body"], realm: 2, stones: 500, fx: { hp: 0.12, def: 0.08 }, con: { cult: -0.05 }, duel: { shield: 0.15 }, d: ["Vào trận có lớp hộ thể bằng 15% sinh lực, nhưng tu chậm hơn.", "Enter fights with a shield of 15% HP, at the cost of slower cultivation."] },
    { id: "ma_hon", a: "hon_thuat", b: "ma_cong", el: "thuy", n: ["Ma Hồn Bí Thuật", "Demon Soul Art"], realm: 2, stones: 400, fx: { atk: 0.1 }, con: {}, duel: { leech: 0.15 }, year: { tamMa: 0.3 }, d: ["Hút 15% sát thương thành máu. Mỗi năm tâm ma +0,3.", "Drains 15% of damage as HP. Inner demons +0.3 yearly."] },
    { id: "thu_thuy", a: "kiem_y", b: "thuy_phap", el: "thuy", n: ["Thu Thủy Kiếm Ý", "Autumn Water Sword"], realm: 2, stones: 350, fx: { atk: 0.06, def: 0.05 }, con: {}, duel: { dodge: 0.1 }, d: ["Kiếm thế như nước: né 10% đòn đánh.", "Sword flows like water: dodge 10% of attacks."] },
    { id: "hoi_xuan", a: "moc_phap", b: "dan_dao", el: "moc", n: ["Thanh Mộc Hồi Xuân", "Verdant Revival"], realm: 2, stones: 350, fx: { hp: 0.06 }, con: { atk: -0.03 }, mech: { heal: 2 }, d: ["Nội thương hồi thêm 2 mỗi năm, nhưng đánh yếu đi.", "Inner wounds heal 2 more yearly, but attacks weaken."] },
    { id: "hau_tho", a: "tran_dao", b: "tho_phap", el: "tho", n: ["Hậu Thổ Đại Trận", "Great Earth Formation"], realm: 2, stones: 450, fx: { def: 0.12 }, con: { atk: -0.03 }, mech: { trap: 25 }, d: ["Bẫy và cấm chế trong bí cảnh dễ phá hơn 25 điểm.", "Traps and seals in secret realms are 25 points easier."] },
    { id: "kim_thien", a: "phat_phap", b: "kim_cuong", el: "kim", n: ["Kim Cang Bất Hoại Thiền", "Vajra Dhyana"], realm: 2, stones: 450, fx: { def: 0.1 }, con: { atk: -0.05 }, year: { tamMa: -0.2 }, d: ["Tâm ma giảm 0,2 mỗi năm, nhưng đánh yếu đi.", "Inner demons fall 0.2 yearly, but attacks weaken."] },
    { id: "yeu_than", a: "yeu_huyet", b: "the_tu", el: "tho", n: ["Thái Cổ Yêu Thân", "Primordial Beast Form"], realm: 2, stones: 400, fx: { hp: 0.1, atk: 0.06 }, con: { brk: -0.01 }, duel: { first: 0.3 }, d: ["30% ra đòn trước khi trận bắt đầu, nhưng đột phá khó hơn.", "30% for a first strike, but breakthroughs get harder."] },
    { id: "u_minh", a: "hoa_phap", b: "ma_cong", el: "hoa", n: ["U Minh Ma Diễm", "Netherflame"], realm: 3, stones: 700, fx: { atk: 0.14 }, con: {}, duel: { burn: 0.08 }, year: { tamMa: 0.4 }, d: ["Mỗi đòn thiêu thêm 8% công. Mỗi năm tâm ma +0,4.", "Each strike burns for 8% attack. Inner demons +0.4 yearly."] },
    { id: "ngu_loi", a: "tran_dao", b: "loi_phap", el: "kim", n: ["Ngũ Lôi Trận Quyết", "Five Thunder Array"], realm: 2, stones: 500, fx: { atk: 0.08 }, con: { hp: -0.02 }, duel: { first: 0.2 }, mech: { trap: 15 }, d: ["20% ra đòn trước, bẫy dễ phá hơn 15 điểm.", "20% first strike, traps 15 points easier."] },
    { id: "canh_kim", a: "kim_phap", b: "kiem_y", el: "kim", n: ["Canh Kim Phá Giáp", "Sharp Metal Sunder"], realm: 2, stones: 400, fx: { atk: 0.1 }, con: { def: -0.02 }, duel: { pierce: 0.3 }, d: ["Bỏ qua 30% phòng thủ của địch.", "Ignores 30% of enemy defence."] },
  ];
  const recipeDef = new Map(RECIPES.map((r) => [r.id, r]));
  const ART_SLOTS = (realm) => (realm >= 4 ? 2 : 1);
  const ART_GAP = 25; // Số năm tối thiểu giữa hai lần sáng tạo
  const ART_MAX = 3; // Mỗi kiếp sáng tạo được tối đa số môn này

  // ---------- Truyền thừa ----------

  /*
   * tech: chiêu thật của game, chỉ học được khi cùng đạo lộ. Khác đạo thì vẫn nhận ký ức và đạo niệm.
   * trial: điều kiện tâm cảnh, xác định chứ không may rủi. promise: nhân quả của người để lại, đi vào hệ tâm ma và kiếp sau.
   */
  const INHERITS = [
    { id: "t_kiem", path: "kiem", n: ["Di Kiếm của Vô Danh Kiếm Tiên", "Sword of the Nameless Immortal"], mem: ["Một đời chỉ cầm một thanh kiếm, và thanh kiếm ấy chưa từng chém người vô tội.", "A whole life holding one sword, and it never cut an innocent."], concept: "kiem_y", gain: 35, tech: "thai_cuc_kiem", fx: { atk: 0.05 }, trial: { tam: 45 }, promise: { goal: ["kills", 30], t: ["Trảm 30 yêu tà thay Vô Danh Kiếm Tiên", "Slay 30 evils for the Nameless Immortal"] } },
    { id: "t_dan", path: "dan", n: ["Đan Kinh của Dược Vương", "The Medicine King's Canon"], mem: ["Dược Vương cứu cả một châu, rồi chết vì không cứu nổi chính con mình.", "He saved a whole province, then died unable to save his own child."], concept: "dan_dao", gain: 35, tech: "van_doc", fx: { cult: 0.03 }, trial: { tam: 40 }, promise: { goal: ["y_luyen_dan", 15], t: ["Luyện đan 15 năm để cứu đời như Dược Vương", "Refine pills for 15 years, as the Medicine King did"] } },
    { id: "t_tran", path: "tran", n: ["Tinh Đồ của Trận Thánh", "The Array Saint's Star Chart"], mem: ["Trận Thánh giam một ma đầu bằng cả mạng sống của mình, và trận ấy đang yếu dần.", "The Saint sealed a demon lord with his own life, and the seal is weakening."], concept: "tran_dao", gain: 35, tech: "me_tung", fx: { def: 0.05 }, trial: { tam: 50 }, promise: { goal: ["bc_clear", 2], t: ["Vào thêm các cấm địa để gia cố trận của Trận Thánh", "Enter more forbidden lands to reinforce the Saint's array"] } },
    { id: "t_phat", path: "phat", n: ["Xá Lợi của Vô Ngã Thiền Sư", "Relic of Master No-Self"], mem: ["Thiền sư ngồi giữa chiến trường ba năm, cho đến khi cả hai bên buông đao.", "The master sat on the battlefield for three years, until both armies laid down their blades."], concept: "phat_phap", gain: 35, tech: "kim_chung", fx: { hp: 0.05 }, trial: { tam: 55, good: 1 }, promise: { goal: ["tamCanh", 75], t: ["Tu tâm cảnh tới 75 như lời Thiền sư", "Raise Mind State to 75, as the master asked"] } },
    { id: "t_ma", path: "ma", n: ["Huyết Thư của Thiên Ma", "The Heavenly Demon's Blood Book"], mem: ["Thiên Ma từng là thánh nhân. Người đời không tha cho hắn, nên hắn không tha cho người đời.", "The Demon was once a saint. The world would not forgive him, so he forgave nothing."], concept: "ma_cong", gain: 35, tech: "thon_phe", fx: { atk: 0.05 }, trial: { tam: 30, evil: 1 }, promise: { goal: ["kills", 50], t: ["Lấy 50 sinh mạng tế Thiên Ma", "Offer 50 lives to the Heavenly Demon"] }, evil: 1 },
    { id: "t_yeu", path: "yeu", n: ["Tổ Huyết của Yêu Đế", "Ancestral Blood of the Beast Emperor"], mem: ["Yêu Đế bị người tộc săn đến con cuối cùng, và trước khi chết đã ký thác giọt máu này.", "Humans hunted his kin to the last, and he entrusted this drop of blood before dying."], concept: "yeu_huyet", gain: 35, tech: "hoa_hinh", fx: { hp: 0.05 }, trial: { tam: 40 }, blood: "yeu_de", promise: { goal: ["pet", 1], t: ["Kết duyên cùng một linh thú, nối lại tình người và yêu", "Bond with a spirit beast, to mend man and beast"] } },
  ];
  const inheritDef = new Map(INHERITS.map((t) => [t.id, t]));
  /** Huyết mạch: thức tỉnh qua truyền thừa, cơ duyên hoặc gia tộc. Khác thể chất: có thể cùng tồn tại, chỉ một huyết mạch mỗi kiếp. */
  const BLOODS = {
    yeu_de: { n: ["Huyết mạch Yêu Đế", "Beast Emperor Blood"], fx: { hp: 0.06, atk: 0.03 }, con: { brk: -0.01 } },
    co_than: { n: ["Huyết mạch Cổ Thần", "Ancient God Blood"], fx: { def: 0.05, hp: 0.04 }, con: { cult: -0.03 } },
    tien_toc: { n: ["Huyết mạch Tiên Tộc", "Immortal Clan Blood"], fx: { cult: 0.04 }, con: { hp: -0.03 } },
  };

  // ---------- Bí cảnh ----------

  const DANGER = ["", "Thấp", "Vừa", "Cao", "Rất cao", "Tử địa"];
  const DANGER_EN = ["", "Low", "Moderate", "High", "Very high", "Lethal"];
  const REALMS = [
    { id: "dong_phu", n: ["Động phủ cổ tu", "Ancient Cave Abode"], realm: 1, danger: 1, floors: 3, foeAdd: 0, foes: [["Khôi lỗi giữ cửa", "Guardian Puppet"], ["Rết đá", "Stone Centipede"]], trap: ["Cấm chế đã mục", "Rotting Seal"], boss: ["Tàn hồn chủ động phủ", "Remnant Soul of the Master"], mats: ["kim_thiet", "linh_thao"], rival: ["Tán tu", "Rogue Cultivator"], hasInherit: 0.25, w: 10 },
    { id: "chien_truong", n: ["Thượng cổ chiến trường", "Ancient Battlefield"], realm: 2, danger: 3, floors: 4, foeAdd: 2, foes: [["Âm binh", "Ghost Soldier"], ["Tướng quân xương", "Bone General"]], trap: ["Sát trận còn sót", "Lingering Kill Array"], boss: ["Chiến hồn vô danh", "Nameless War Spirit"], mats: ["kim_thiet", "hoa_tinh"], rival: ["Đoàn săn báu", "Treasure Hunters"], hasInherit: 0.3, w: 7 },
    { id: "tong_mon", n: ["Bí cảnh tông môn", "Sect Trial Realm"], realm: 1, danger: 1, floors: 3, foeAdd: 0, foes: [["Yêu thú nuôi", "Tame Beast"], ["Đồng môn thí luyện", "Fellow Disciple"]], trap: ["Trận khảo hạch", "Trial Array"], boss: ["Trưởng lão hóa thân", "Elder's Projection"], mats: ["linh_thao", "moc_tinh"], rival: ["Đệ tử phái khác", "Rival Disciple"], hasInherit: 0.1, needSect: 1, w: 10 },
    { id: "yeu_cam", n: ["Cấm địa yêu tộc", "Beast Forbidden Land"], realm: 2, danger: 3, floors: 4, foeAdd: 2, foes: [["Yêu lang", "Demon Wolf"], ["Mãng xà", "Great Serpent"]], trap: ["Độc chướng", "Miasma"], boss: ["Yêu vương", "Beast King"], mats: ["yeu_dan", "moc_tinh"], rival: ["Yêu tu", "Beast Cultivator"], hasInherit: 0.35, inheritPath: "yeu", w: 7 },
    { id: "ma_vuc", n: ["Ma vực", "Demon Domain"], realm: 3, danger: 4, floors: 4, foeAdd: 3, foes: [["Ma binh", "Demon Soldier"], ["Huyết nô", "Blood Thrall"]], trap: ["Huyết trận", "Blood Array"], boss: ["Ma tướng", "Demon General"], mats: ["hoa_tinh", "yeu_dan"], rival: ["Ma tu", "Demon Cultivator"], hasInherit: 0.4, inheritPath: "ma", w: 5 },
    { id: "tien_tich", n: ["Di tích tiên nhân", "Immortal Ruins"], realm: 4, danger: 4, floors: 5, foeAdd: 3, foes: [["Tiên khôi", "Immortal Puppet"], ["Linh thú canh giữ", "Warden Beast"]], trap: ["Tiên cấm", "Immortal Seal"], boss: ["Linh hồn di tích", "Spirit of the Ruins"], mats: ["kim_thiet", "thuy_ngoc", "tho_nguyen"], rival: ["Đại năng", "Great Power"], hasInherit: 0.5, w: 4 },
    { id: "truyen_thua", n: ["Không gian truyền thừa", "Inheritance Space"], realm: 2, danger: 2, floors: 3, foeAdd: 1, foes: [["Bóng của người xưa", "Shadow of the Ancient"], ["Hình nhân thử lòng", "Heart-testing Effigy"]], trap: ["Ảo cảnh vấn tâm", "Heart-questioning Illusion"], boss: ["Hóa thân người truyền đạo", "Avatar of the Teacher"], mats: ["thuy_ngoc", "linh_thao"], rival: ["Kẻ cùng được chọn", "Fellow Chosen"], hasInherit: 1, w: 5 },
    { id: "luan_hoi", n: ["Bí cảnh luân hồi", "Samsara Realm"], realm: 3, danger: 5, floors: 5, foeAdd: 4, foes: [["Bóng của kiếp trước", "Shadow of a Past Life"], ["Âm sai lạc đường", "Lost Underworld Bailiff"]], trap: ["Cầu Nại Hà gãy", "Broken Naihe Bridge"], boss: ["Chính bạn của tiền kiếp", "Your Former Self"], mats: ["tho_nguyen", "thuy_ngoc"], rival: ["Hồn phách đồng cảnh", "Fellow Lost Soul"], hasInherit: 0.5, needLives: 5, w: 3 },
  ];
  const realmDef = new Map(REALMS.map((r) => [r.id, r]));
  const REALM_CHANCE = 0.022;
  const OPEN_YEARS = 8;

  const QUESTS = [
    { id: "d_concept", t: ["Đưa một đạo niệm lên Lĩnh ngộ", "Raise a concept to Understood"], goal: ["ngo_best", 30], r: { stones: 80 }, go: { tab: "art" } },
    { id: "d_master2", after: "d_concept", t: ["Có hai đạo niệm Thuần thục", "Hold two Practised concepts"], goal: ["ngo_ready", 2], r: { stat: { ngoTinh: 2 } }, go: { tab: "art" } },
    { id: "d_art", after: "d_master2", t: ["Sáng tạo một môn bí thuật", "Create a secret art"], goal: ["art_count", 1], r: { stones: 500 }, go: { tab: "art" } },
    { id: "d_enter", t: ["Bước vào một bí cảnh", "Enter a secret realm"], goal: ["bc_enter", 1], r: { stones: 100 }, go: { tab: "realm" } },
    { id: "d_clear", after: "d_enter", t: ["Vượt qua toàn bộ một bí cảnh", "Clear a whole secret realm"], goal: ["bc_clear", 1], r: { stones: 400 }, go: { tab: "realm" } },
    { id: "d_inherit", t: ["Nhận một truyền thừa cổ tu", "Receive an ancient inheritance"], goal: ["inherit_count", 1], r: { stat: { tamCanh: 3 } }, go: { tab: "inherit" } },
  ];

  // ---------- Trạng thái ----------

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (v.dao) return v.dao;
    v.dao = { v: 1, year: yearOf(c), mastery: {}, study: null, arts: [], active: [], artAt: -99, open: [], run: null, inherits: [], promises: [], blood: null, runs: 0, cleared: 0, seen: {} };
    if (yearOf(c) >= 1) seedOldSave(c, acct, v);
    return v.dao;
  }
  /** Save cũ: đạo niệm ước lượng theo số năm và đạo lộ. Nhiệm vụ đã đạt được đánh dấu, không phát thưởng bù. */
  function seedOldSave(c, acct, v) {
    const d = v.dao;
    const y = v.c?.y_tu_luyen ?? 0;
    for (const [k, rate] of Object.entries(PATH_RATE[c.path] ?? {})) d.mastery[k] = clamp(y * rate * 0.4, 0, 55);
    for (const q of QUESTS) if (C.metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
  }

  const artDefOf = (art) => recipeDef.get(art.recipe);
  const activeArts = (c) => {
    const d = c.vk2?.dao;
    return d ? d.arts.filter((a) => d.active.includes(a.id)) : [];
  };
  const hasArtMech = (c, key) => activeArts(c).reduce((s, a) => s + (artDefOf(a)?.mech?.[key] ?? 0) * a.power, 0);
  const masteryName = (x) => MASTERY_NAMES.reduce((best, [at, n]) => (x >= at ? n : best), MASTERY_NAMES[0][1]);
  const readyCount = (d) => Object.values(d.mastery).filter((x) => x >= COMBINE_AT).length;
  const recipeReady = (d, r) => (d.mastery[r.a] ?? 0) >= COMBINE_AT && (d.mastery[r.b] ?? 0) >= COMBINE_AT;

  function metric(name, c) {
    const d = c.vk2?.dao;
    switch (name) {
      case "ngo_best": return d ? Math.floor(Math.max(0, ...Object.values(d.mastery))) : 0;
      case "ngo_ready": return d ? readyCount(d) : 0;
      case "art_count": return d?.arts.length ?? 0;
      case "bc_enter": return d?.runs ?? 0;
      case "bc_clear": return d?.cleared ?? 0;
      case "inherit_count": return d?.inherits.length ?? 0;
      default: return undefined;
    }
  }

  function fx(c) {
    const out = [];
    const d = c.vk2?.dao;
    if (!d) return out;
    for (const a of activeArts(c)) {
      const def = artDefOf(a);
      if (!def) continue;
      const pro = {};
      for (const [k, x] of Object.entries(def.fx)) pro[k] = x * a.power;
      out.push(pro, def.con);
    }
    for (const i of d.inherits) {
      const def = inheritDef.get(i.id);
      if (def) out.push(def.fx);
    }
    if (d.blood && BLOODS[d.blood]) out.push(BLOODS[d.blood].fx, BLOODS[d.blood].con);
    return out;
  }
  function duel(c) {
    const out = {};
    for (const a of activeArts(c)) for (const [k, x] of Object.entries(artDefOf(a)?.duel ?? {})) out[k] = (out[k] ?? 0) + x * a.power;
    return out;
  }

  // ---------- Một năm ----------

  function learnRate(c) {
    const ngo = c.stats?.ngoTinh ?? 50;
    return (0.6 + ngo / 100) * clamp((root.VK2Can?.insight(c) ?? 1), 0.8, 1.5);
  }
  function addMastery(c, id, n) {
    const d = c.vk2.dao;
    d.mastery[id] = clamp((d.mastery[id] ?? 0) + n, 0, 100);
    return d.mastery[id];
  }
  function onYear(c, acct, opts) {
    const d = ensure(c, acct);
    const year = yearOf(c);
    const notes = [];
    if (year <= d.year) return notes;
    d.year = year;
    if (year < 6) return notes;
    const learn = learnRate(c);
    const crossed = (id, before) => {
      const after = d.mastery[id];
      for (const at of [30, 60, 90]) if (before < at && after >= at) notes.push({ kind: at >= 60 ? "big" : "good", t: [`Đạo niệm ${CONCEPTS[id][0]} đạt ${masteryName(after)[0]}.`, `${CONCEPTS[id][1]} is now ${masteryName(after)[1]}.`] });
    };
    const gain = (id, rate) => {
      const before = d.mastery[id] ?? 0;
      addMastery(c, id, rate * learn);
      crossed(id, before);
    };
    const practising = opts?.closed || c.focus === "tu_luyen";
    for (const [id, rate] of Object.entries(PATH_RATE[c.path] ?? {})) if (practising || rate >= 2) gain(id, rate * 0.5);
    const info = C.rootInfo(c);
    if (practising) for (const e of info.elements.slice(0, 2)) gain(ELEMENT_RATE[e], 0.5);
    if (info.variant === "loi" && practising) gain("loi_phap", 0.8);
    for (const [id, rate] of Object.entries(FOCUS_RATE[c.focus] ?? {})) gain(id, rate);
    if (practising && d.study && CONCEPTS[d.study]) gain(d.study, STUDY_RATE);

    for (const a of activeArts(c)) {
      const def = artDefOf(a);
      if (def?.year?.tamMa) addStat(c, "tamMa", def.year.tamMa);
      if (def?.mech?.heal && c.vk2.can) c.vk2.can.injury = Math.max(0, c.vk2.can.injury - def.mech.heal * a.power);
      if (def?.mech?.pill && c.focus === "luyen_dan") {
        if (rnd(c, year, 61) < def.mech.pill * a.power) {
          c.pills = c.pills ?? {};
          const id = ["tu_khi", "hoi_xuan", "thanh_tam"][Math.floor(rnd(c, year, 62) * 3)];
          c.pills[id] = (c.pills[id] ?? 0) + 1;
          notes.push({ kind: "good", t: ["Chân hỏa luyện thêm được một viên đan.", "True fire refines one extra pill."] });
        }
        if (c.vk2.can) c.vk2.can.impurity = Math.max(0, c.vk2.can.impurity - 1);
      }
    }

    // Bí cảnh mở theo thời gian. Mở rồi thì có hạn, nên có lúc phải chọn giữa đi ngay và chuẩn bị thêm.
    d.open = d.open.filter((o) => o.until >= year);
    if ((c.realm ?? 0) >= 1 && d.open.length < 2 && rnd(c, year, 63) < REALM_CHANCE + (root.VK2Phap?.realmChance?.(acct) ?? 0)) {
      const pool = REALMS.filter((r) => realmAllowed(r, c, acct) && !d.open.some((o) => o.id === r.id));
      if (pool.length) {
        let roll = rnd(c, year, 64) * pool.reduce((s, r) => s + r.w, 0);
        const pick = pool.find((r) => (roll -= r.w) < 0) ?? pool[0];
        d.open.push({ id: pick.id, until: year + OPEN_YEARS, seed: hash32(year + (c.lookSeed ?? 0)) });
        notes.push({ kind: "big", t: [`${pick.n[0]} vừa mở cửa, còn ${OPEN_YEARS} năm. Xem ở Cơ duyên.`, `${pick.n[1]} has opened for ${OPEN_YEARS} years. See Fortunes.`] });
      }
    }
    return notes;
  }
  function realmAllowed(r, c, acct) {
    if (r.needSect && !c.sect) return false;
    if (r.needLives && (acct?.lives ?? 0) < r.needLives) return false;
    return true;
  }

  // ---------- Thao tác ----------

  function setStudy(c, acct, id) {
    const d = ensure(c, acct);
    if (id !== null && !CONCEPTS[id]) return false;
    d.study = id;
    return true;
  }
  function canCreate(c, acct, recipeId) {
    const d = ensure(c, acct);
    const r = recipeDef.get(recipeId);
    if (!r) return { ok: false };
    const reasons = [];
    if (!recipeReady(d, r)) reasons.push(["Cả hai đạo niệm phải Thuần thục", "Both concepts must be Practised"]);
    if ((c.realm ?? 0) < r.realm) reasons.push(["Chưa đủ cảnh giới", "Realm too low"]);
    if ((c.linhThach ?? 0) < r.stones) reasons.push(["Thiếu linh thạch", "Not enough stones"]);
    if (yearOf(c) - d.artAt < ART_GAP) reasons.push([`Cần tĩnh dưỡng ${ART_GAP - (yearOf(c) - d.artAt)} năm nữa`, `Must rest ${ART_GAP - (yearOf(c) - d.artAt)} more years`]);
    if (d.arts.some((a) => a.recipe === recipeId)) reasons.push(["Đã sáng tạo môn này", "Already created"]);
    if (d.arts.filter((a) => !a.found).length >= ART_MAX) reasons.push([`Một đời chỉ đủ sáng tạo ${ART_MAX} môn`, `A life has room for only ${ART_MAX} arts`]);
    return { ok: !reasons.length, reasons };
  }
  const slotsOf = (c) => ART_SLOTS(c.realm ?? 0) + (root.VK2Phap?.extraArtSlots?.(c) ?? 0);
  const cleanName = (s) => String(s ?? "").replace(/[<>&"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 28);
  /** Sức mạnh theo độ thuần thục và ngộ tính, có trần, nên không thể cày một môn lên vô hạn. */
  function artPower(c, r) {
    const d = c.vk2.dao;
    const m = ((d.mastery[r.a] ?? 0) + (d.mastery[r.b] ?? 0)) / 200;
    return Math.round(clamp(0.5 + m * 0.5 + (c.stats?.ngoTinh ?? 50) / 400, 0.7, 1.25) * 100) / 100;
  }
  function createArt(c, acct, recipeId, name) {
    if (!canCreate(c, acct, recipeId).ok) return null;
    const d = c.vk2.dao;
    const r = recipeDef.get(recipeId);
    c.linhThach -= r.stones;
    const nm = cleanName(name) || tr(r.n);
    const art = { id: `${recipeId}_${c.lifeNo ?? 0}`, recipe: recipeId, name: nm, power: artPower(c, r), age: yearOf(c), life: c.lifeNo ?? 0, from: [r.a, r.b], el: r.el };
    d.arts.push(art);
    d.artAt = yearOf(c);
    if (d.active.length < slotsOf(c)) d.active.push(art.id);
    return art;
  }
  function toggleArt(c, acct, id) {
    const d = ensure(c, acct);
    if (!d.arts.some((a) => a.id === id)) return false;
    if (d.active.includes(id)) {
      d.active = d.active.filter((x) => x !== id);
      return true;
    }
    if (d.active.length >= slotsOf(c)) return false;
    d.active.push(id);
    return true;
  }

  // ---------- Bí cảnh: mỗi tầng là một sự kiện của game ----------

  const EV_FLOOR = "vk2_bc_floor";
  const EV_INVITE = "vk2_bc_invite";
  const EV_TRIAL = "vk2_bc_trial";
  const EV_NGO = "vk2_ngo";

  function enter(c, acct, id) {
    const d = ensure(c, acct);
    if (d.run || c.dead) return false;
    const o = d.open.find((x) => x.id === id);
    const r = realmDef.get(id);
    if (!o || !r || (c.realm ?? 0) < r.realm) return false;
    const inherit = pickInherit(c, r, o.seed);
    d.run = { id, floor: 1, hp: 1, seed: o.seed, loot: { stones: 0, cult: 0, mats: {}, pills: 0 }, inherit, ended: false };
    d.open = d.open.filter((x) => x !== o);
    d.runs += 1;
    C.bump(c, acct, "bc_runs", 1);
    return true;
  }
  /** Có truyền thừa hay không được định khi bí cảnh mở. Ưu tiên đạo của bí cảnh, kế đến đạo của người chơi. */
  function pickInherit(c, r, seed) {
    if (hash32(seed + 5) / 4294967296 >= r.hasInherit) return null;
    const d = c.vk2.dao;
    const owned = new Set(d.inherits.map((i) => i.id));
    const pool = INHERITS.filter((t) => !owned.has(t.id));
    if (!pool.length) return null;
    const sure = r.inheritPath && pool.find((t) => t.path === r.inheritPath);
    const mine = pool.find((t) => t.path === c.path);
    return (sure ?? mine ?? pool[hash32(seed + 6) % pool.length]).id;
  }
  /** Tầng cuối luôn là boss. Các tầng khác theo seed, nên mỗi lần đi khác nhau mà tải lại không đổi. */
  function floorKind(run, r) {
    if (run.floor >= r.floors) return "boss";
    return ["foe", "trap", "rival", "treasure"][hash32(run.seed + run.floor * 17) % 4];
  }
  const foeOffset = (r, floor, boss) => r.foeAdd + floor - 2 + (boss ? 2 : 0);

  function lootFloor(c, run, r, mult) {
    const k = (c.realm ?? 0) + 1;
    run.loot.stones += Math.round(35 * k * r.danger * mult);
    const mat = r.mats[hash32(run.seed + run.floor) % r.mats.length];
    run.loot.mats[mat] = (run.loot.mats[mat] ?? 0) + Math.max(1, Math.round(r.danger * mult));
    run.loot.cult += 0.12 * r.danger * mult;
  }
  /** Trận trong bí cảnh: máu đi tiếp sang trận sau. Thua thì bị đẩy khỏi bí cảnh ngay. */
  function fight(c, acct, ctx, run, r, boss, name) {
    // Cấp quái theo chính bí cảnh, không theo người chơi: tu vi cao hơn thì thật sự đi dễ hơn.
    // Có sàn theo tu vi người vào: đại năng vào bí cảnh thấp vẫn dễ hơn, nhưng không phải dạo chơi.
    const off = foeOffset(r, run.floor, boss);
    // Chênh một cấp đổi kết quả rất nhiều (xem duel), nên sàn chỉ tăng nhẹ theo tầng.
    const lv = Math.max(C.combatLevel({ realm: r.realm, layer: 1 }) + off, C.combatLevel(c) - 6 + Math.min(3, run.floor - 1) + (boss ? 1 : 0));
    const res = C.duel(c, lv, boss ? 1.25 : 1, run.seed + run.floor * 31, run.hp);
    run.hp = res.hp;
    C.bump(c, acct, "bc_fights", 1);
    root.VK2Khi?.afterFight?.(c);
    root.VK2Khi?.damageWorn?.(c, boss ? 3 : 1);
    if (res.win) return { win: true, text: tr([`Sau ${res.turns} lượt, ${tr(name)} gục xuống. Bạn còn ${Math.round(res.hp * 100)}% sức.`, `After ${res.turns} turns, ${tr(name)} falls. You have ${Math.round(res.hp * 100)}% strength left.`]) };
    return { win: false, text: tr([`${tr(name)} đánh bạn ngã sau ${res.turns} lượt.`, `${tr(name)} floors you after ${res.turns} turns.`]) };
  }

  /** Kết thúc lượt đi: chỉ ở đây mới phát chiến lợi phẩm, và chỉ một lần vì run bị xóa trước khi phát. */
  function finishRun(c, acct, ctx, how) {
    const d = c.vk2.dao;
    const run = d.run;
    if (!run) return "";
    const r = realmDef.get(run.id);
    d.run = null;
    const keep = how === "lost" ? 0.4 : 1;
    const stones = Math.round(run.loot.stones * keep);
    c.linhThach = (c.linhThach ?? 0) + stones;
    const rate = root.__VK2?._test?.rate?.(c) ?? 0;
    if (rate > 0 && run.loot.cult > 0) c.cultivation = (c.cultivation ?? 0) + Math.round(rate * run.loot.cult * keep * 2);
    for (const [m, n] of Object.entries(run.loot.mats)) root.VK2Khi?.addMat?.(c, acct, m, Math.max(how === "lost" ? 0 : 1, Math.round(n * keep)));
    for (let i = 0; i < Math.round(run.loot.pills * keep); i++) {
      c.pills = c.pills ?? {};
      const id = ["tu_khi", "hoi_xuan", "thanh_tam"][hash32(run.seed + i) % 3];
      c.pills[id] = (c.pills[id] ?? 0) + 1;
    }
    let text = "";
    if (how === "lost") {
      // Rủi ro theo độ nguy hiểm, nhưng đủ khỏe thì không chết: sức mạnh và sự chuẩn bị quyết định, không chỉ xúc xắc.
      addStat(c, "sucKhoe", -(10 + r.danger * 8));
      if (c.vk2.can) c.vk2.can.injury = clamp(c.vk2.can.injury + 8 + r.danger * 4, 0, 100);
      if ((c.stats?.sucKhoe ?? 0) <= 0) {
        c.dead = true;
        c.cause = tr([`Bạn gục lại trong ${tr(r.n)}, không ai tìm thấy xác.`, `You fell in the ${tr(r.n)}, and no one ever found your body.`]);
        ctx?.fx?.("death");
        return c.cause;
      }
      text = tr([` Bạn lết ra khỏi ${tr(r.n)}, trọng thương, đánh rơi phần lớn chiến lợi phẩm.`, ` You crawl out of the ${tr(r.n)}, badly hurt, having lost most of the spoils.`]);
    } else if (how === "retreat") {
      text = tr([` Bạn rời ${tr(r.n)} an toàn.`, ` You leave the ${tr(r.n)} safely.`]);
    } else {
      d.cleared += 1;
      C.bump(c, acct, "bc_clear_n", 1);
      text = tr([` Bạn đã đi hết ${tr(r.n)}.`, ` You have conquered the ${tr(r.n)}.`]);
      for (const m of [root.VK2Phap, root.VK2Menh, root.VK2Bao]) m?.onRealmCleared?.(c, acct, r);
    }
    return `${text} ${tr(["Thu về", "Gained"])} ${stones} ${tr(["linh thạch", "stones"])}.`;
  }

  function trapScore(c) {
    const d = c.vk2.dao;
    return (d.mastery.tran_dao ?? 0) * 0.6 + (c.path === "tran" ? 25 : 0) + (c.stats?.ngoTinh ?? 50) * 0.4 + hasArtMech(c, "trap");
  }
  const canTalisman = (c, id) => root.VK2Khi?.hasTalisman?.(c, id) ?? false;
  const useTalisman = (c, id) => root.VK2Khi?.useTalisman?.(c, id) ?? false;

  /** Bước đi thoát chắc chắn khi có phù độn thổ hoặc pháp tắc không gian. Không có thì rút lui mất một ít máu ở tầng sâu. */
  function retreat(c, acct, ctx) {
    const run = c.vk2.dao.run;
    const r = realmDef.get(run.id);
    let pre = "";
    if (root.VK2Phap?.lawMech?.(c, "khongGian")) pre = tr(["Không gian gấp lại, bạn bước một bước ra ngoài.", "Space folds, and you step straight out."]);
    else if (useTalisman(c, "don_tho")) pre = tr(["Phù độn thổ đưa bạn đi tức thì.", "An escape talisman whisks you away."]);
    else if (run.floor >= 2 && r.danger >= 3) {
      addStat(c, "sucKhoe", -(run.floor * 2));
      pre = tr(["Đường lui không dễ, bạn phải trả giá bằng vài vết thương.", "The way back costs you a few wounds."]);
    }
    return pre + finishRun(c, acct, ctx, "retreat");
  }
  function advance(c, acct, ctx, text) {
    const run = c.vk2.dao.run;
    if (!run) return text;
    run.floor += 1;
    return text;
  }

  function floorDef(c, acct) {
    const d = c.vk2?.dao;
    const run = d?.run;
    if (!run) return null;
    const r = realmDef.get(run.id);
    const kind = floorKind(run, r);
    const foe = kind === "boss" ? r.boss : r.foes[hash32(run.seed + run.floor) % r.foes.length];
    const leave = { label: tr(["Rút lui, giữ những gì đã có", "Retreat with what you have"]), hint: tr(["an toàn", "safe"]), lean: "chinh", run: (n, e) => retreat(n, acct, e) };
    const head = tr([`${tr(r.n)}, tầng ${run.floor}/${r.floors}. Sức còn ${Math.round(run.hp * 100)}%.`, `${tr(r.n)}, level ${run.floor}/${r.floors}. Strength ${Math.round(run.hp * 100)}%.`]);
    const resolve = (n, e, res, mult) => {
      if (!res.win) return res.text + finishRun(n, acct, e, "lost");
      lootFloor(n, run, r, mult);
      return advance(n, acct, e, res.text);
    };
    const texts = {
      foe: [`${foe[0]} chặn đường phía trước.`, `${foe[1]} blocks the way ahead.`],
      trap: [`${r.trap[0]} giăng kín lối đi.`, `A ${r.trap[1]} seals the passage.`],
      rival: [`${r.rival[0]} cũng tìm tới đây và đang nhìn cùng một kho báu với bạn.`, `A ${r.rival[1]} has also arrived, eyeing the same treasure.`],
      treasure: ["Một gian phòng đầy tài nguyên, không thấy ai canh giữ. Quá dễ dàng.", "A chamber full of treasure, unguarded. Too easy."],
      boss: [`${foe[0]} đang đợi ở tầng cuối.`, `${foe[1]} waits on the final level.`],
    };
    const choices = {
      foe: () => {
        const need = 45 + r.danger * 8;
        const sneak = (c.stats?.ngoTinh ?? 50) * 0.6 + (c.pet ? 25 : 0) + (c.stats?.khiVan ?? 50) * 0.2;
        return [
          { label: tr(["Giao chiến", "Fight"]), hint: tr(["có chiến lợi phẩm", "yields spoils"]), lean: "trung", run: (n, e) => resolve(n, e, fight(n, acct, e, run, r, false, foe), 1) },
          { label: tr(["Tìm đường khác", "Find another way"]), hint: tr([`cần ngộ tính, khí vận hoặc linh thú: ${Math.round(sneak)}/${need}`, `Insight, Luck or a pet: ${Math.round(sneak)}/${need}`]), lean: "trung", off: sneak < need, run: (n, e) => advance(n, acct, e, tr(["Bạn lách qua một khe nứt mà không ai để ý.", "You slip through a crack nobody noticed."])) },
          leave,
        ];
      },
      trap: () => {
        const need = 40 + r.danger * 10;
        const score = trapScore(c);
        const have = canTalisman(c, "pha_cam");
        return [
          { label: tr(["Phá trận", "Break the array"]), hint: tr([`trận đạo và ngộ tính: ${Math.round(score)}/${need}`, `Formations and Insight: ${Math.round(score)}/${need}`]), lean: "trung", run: (n, e) => {
            if (score >= need) {
              lootFloor(n, run, r, 1);
              return advance(n, acct, e, tr(["Bạn tìm ra mắt trận, cả trận tắt lịm. Sau trận còn sót ít tài nguyên.", "You find the array's eye and it dies. Some spoils remain behind it."]));
            }
            run.hp = clamp(run.hp - 0.15 - r.danger * 0.05, 0, 1);
            if (run.hp <= 0) return tr(["Cấm chế bộc phát.", "The seal erupts."]) + finishRun(n, acct, e, "lost");
            return advance(n, acct, e, tr(["Bạn đoán sai mắt trận, cấm chế bộc phát nhưng vẫn qua được.", "You guess wrong; the seal erupts, but you get through."]));
          } },
          ...(have ? [{ label: tr(["Dùng Phá Cấm Phù", "Use a Seal-breaking Talisman"]), hint: tr(["chắc chắn thành công", "guaranteed"]), lean: "trung", run: (n, e) => {
            useTalisman(n, "pha_cam");
            lootFloor(n, run, r, 1);
            return advance(n, acct, e, tr(["Lá phù cháy rụi cùng cấm chế.", "The talisman burns away with the seal."]));
          } }] : []),
          leave,
        ];
      },
      rival: () => [
        { label: tr(["Đề nghị chia đều", "Offer to split it"]), hint: tr(["thu ít hơn, đạo tâm tốt lên", "less loot, better heart"]), lean: "chinh", run: (n, e) => {
          n.daoTam = clamp((n.daoTam ?? 0) + 3, -100, 100);
          lootFloor(n, run, r, 0.5);
          root.VK2Menh?.note?.(n, acct, "thien", 2);
          return advance(n, acct, e, tr(["Hai bên chia phần rồi đi. Không ai đổ máu, và người ấy sẽ nhớ chuyện này.", "You split it and part ways. No blood is spilled, and they will remember."]));
        } },
        { label: tr(["Tranh đoạt", "Take it by force"]), hint: tr(["thu gấp rưỡi, phải giao đấu", "1.5× loot, must fight"]), lean: "ta", run: (n, e) => {
          const res = fight(n, acct, e, run, r, false, r.rival);
          n.daoTam = clamp((n.daoTam ?? 0) - 4, -100, 100);
          root.VK2Menh?.note?.(n, acct, "sat", 2);
          root.VK2The?.grudge?.(n, acct, r.rival);
          return resolve(n, e, res, 1.5);
        } },
        { label: tr(["Nhường lại, đi tiếp", "Let them have it and move on"]), hint: tr(["không thu gì", "no loot"]), lean: "trung", run: (n, e) => advance(n, acct, e, tr(["Bạn không muốn dây dưa, đi thẳng xuống tầng sau.", "You want no trouble and head straight down."])) },
        leave,
      ],
      treasure: () => [
        { label: tr(["Lấy hết", "Take everything"]), hint: tr(["thu gấp đôi, có thể có bẫy", "2× loot, may be trapped"]), lean: "trung", run: (n, e) => {
          lootFloor(n, run, r, 2);
          run.loot.pills += 1;
          if (hash32(run.seed + run.floor * 7) % 100 < 20 + r.danger * 10) {
            run.hp = clamp(run.hp - 0.2 - r.danger * 0.05, 0, 1);
            if (run.hp <= 0) return tr(["Cả gian phòng sập xuống.", "The whole chamber collapses."]) + finishRun(n, acct, e, "lost");
            return advance(n, acct, e, tr(["Đúng là bẫy. Bạn ôm được đồ nhưng bị thương.", "A trap indeed. You keep the spoils but get hurt."]));
          }
          return advance(n, acct, e, tr(["Không có gì xảy ra. Hôm nay trời thương bạn.", "Nothing happens. Heaven smiles on you today."]));
        } },
        { label: tr(["Chỉ lấy vừa đủ", "Take only what you need"]), hint: tr(["an toàn", "safe"]), lean: "chinh", run: (n, e) => {
          lootFloor(n, run, r, 1);
          return advance(n, acct, e, tr(["Bạn nhặt vài món rồi đi ngay.", "You pick a few things and move on."]));
        } },
        leave,
      ],
      boss: () => [
        { label: tr(["Quyết chiến", "Fight to the end"]), hint: tr(["trận cuối", "the final battle"]), lean: "trung", run: (n, e) => {
          const res = fight(n, acct, e, run, r, true, foe);
          if (!res.win) return res.text + finishRun(n, acct, e, "lost");
          lootFloor(n, run, r, 3);
          run.loot.pills += 1;
          run.boss = true;
          if (run.inherit) {
            run.floor = r.floors + 1;
            return res.text;
          }
          return res.text + finishRun(n, acct, e, "clear");
        } },
        ...(c.pet ? [{ label: tr(["Cùng linh thú hợp kích", "Strike together with your beast"]), hint: tr(["thắng dễ hơn, linh thú có thể bị thương", "easier, but the beast may be hurt"]), lean: "trung", run: (n, e) => {
          run.hp = clamp(run.hp + 0.25, 0, 1);
          const res = fight(n, acct, e, run, r, true, foe);
          if (!res.win) return res.text + finishRun(n, acct, e, "lost");
          lootFloor(n, run, r, 3);
          run.boss = true;
          if (run.inherit) {
            run.floor = r.floors + 1;
            return res.text;
          }
          return res.text + finishRun(n, acct, e, "clear");
        } }] : []),
        leave,
      ],
    };
    return { id: EV_FLOOR, title: tr(r.n), text: () => `${head} ${tr(texts[kind])}`, choices: () => choices[kind]() };
  }

  function trialDef(c, acct) {
    const d = c.vk2?.dao;
    const run = d?.run;
    const def = run?.inherit && inheritDef.get(run.inherit);
    if (!def) return null;
    const r = realmDef.get(run.id);
    const tam = c.stats?.tamCanh ?? 50;
    const trial = def.trial;
    const lean = c.daoTam ?? 0;
    const passTam = tam >= trial.tam;
    const passLean = (!trial.good || lean >= 0) && (!trial.evil || lean <= 0);
    const take = (n, e, withPromise) => {
      const text = learnInherit(n, acct, def, withPromise);
      return text + finishRun(n, acct, e, "clear");
    };
    return {
      id: EV_TRIAL,
      title: tr(def.n),
      text: () => `${tr(def.mem)} ${tr([`Thử thách: tâm cảnh từ ${trial.tam}${trial.good ? ", đạo tâm không tà" : ""}${trial.evil ? ", đạo tâm không chính" : ""}. Hiện tâm cảnh ${Math.floor(tam)}.`, `Trial: Mind State ${trial.tam}+${trial.good ? ", heart not evil" : ""}${trial.evil ? ", heart not righteous" : ""}. Mind State now ${Math.floor(tam)}.`])}`,
      choices: () => [
        { label: tr(["Nhận truyền thừa và lời trăn trối", "Accept the legacy and the last wish"]), hint: tr(["có nhân quả: phải giữ lời", "brings karma: a promise to keep"]), lean: "chinh", off: !(passTam && passLean), run: (n, e) => take(n, e, true) },
        { label: tr(["Nhận truyền thừa, gạt nhân quả", "Take the legacy, reject the burden"]), hint: tr(["mất nửa đạo niệm, tâm ma +8", "half the insight, demons +8"]), lean: "ta", off: !(passTam && passLean), run: (n, e) => {
          addStat(n, "tamMa", 8);
          return take(n, e, false);
        } },
        { label: tr(["Cúi đầu rời đi", "Bow and leave"]), hint: tr(["tâm cảnh +3", "Mind State +3"]), lean: "trung", run: (n, e) => {
          addStat(n, "tamCanh", 3);
          return tr(["Bạn biết mình chưa xứng, và điều đó cũng là một bài học.", "You know you are not yet worthy, and that too is a lesson."]) + finishRun(n, acct, e, "clear");
        } },
      ],
    };
  }

  /** Học truyền thừa: đạo niệm, chiêu thật của game nếu đúng đạo, huyết mạch nếu có, và lời hứa. */
  function learnInherit(c, acct, def, withPromise) {
    const d = c.vk2.dao;
    if (d.inherits.some((i) => i.id === def.id)) return "";
    addMastery(c, def.concept, withPromise ? def.gain : def.gain / 2);
    d.inherits.push({ id: def.id, at: yearOf(c), bound: !!withPromise });
    let extra = "";
    if (c.path === def.path && def.tech) {
      c.cp = c.cp ?? { own: [], eq: [] };
      if (!c.cp.own.some((t) => t.id === def.tech)) {
        c.cp.own.push({ id: def.tech, tang: 1, exp: 0 });
        extra = tr([" Bạn học được một chiêu của người xưa.", " You learn one of the ancient's techniques."]);
      }
    }
    if (def.blood && !d.blood) {
      d.blood = def.blood;
      extra += tr([` ${tr(BLOODS[def.blood].n)} thức tỉnh trong người bạn.`, ` ${tr(BLOODS[def.blood].n)} awakens in you.`]);
    }
    if (withPromise && def.promise) d.promises.push({ id: `${def.id}_p`, from: def.id, t: def.promise.t, goal: def.promise.goal, at: yearOf(c), done: false });
    root.VK2Menh?.note?.(c, acct, "thien", 1);
    return tr([`Ký ức của ${tr(def.n)} tràn vào đầu bạn.`, `The memories of ${tr(def.n)} flood your mind.`]) + extra;
  }

  // ---------- Sự kiện năm ----------

  function inviteDef(c, acct, only) {
    const d = c.vk2?.dao;
    const o = d?.open.find((x) => (only ? x.id === only : !d.seen[`i_${x.id}_${x.until}`]) && (c.realm ?? 0) >= realmDef.get(x.id).realm);
    if (!o) return null;
    const r = realmDef.get(o.id);
    return {
      id: `${EV_INVITE}:${o.id}`,
      title: tr(r.n),
      text: () => tr([`Có tin ${tr(r.n)} mở cửa. Độ nguy hiểm: ${DANGER[r.danger]}, ${r.floors} tầng, còn ${o.until - yearOf(c)} năm.`, `Word spreads that the ${tr(r.n)} has opened. Danger: ${DANGER_EN[r.danger]}, ${r.floors} levels, ${o.until - yearOf(c)} years left.`]),
      choices: () => [
        { label: tr(["Đi ngay", "Go now"]), hint: tr(["vào bí cảnh", "enter"]), lean: "trung", run: (n) => {
          n.vk2.dao.seen[`i_${o.id}_${o.until}`] = 1;
          enter(n, acct, o.id);
          return tr(["Bạn thu xếp hành trang lên đường.", "You pack and set out."]);
        } },
        { label: tr(["Chuẩn bị thêm", "Prepare first"]), hint: tr(["vào sau ở mục Cơ duyên", "enter later from Fortunes"]), lean: "chinh", run: (n) => {
          n.vk2.dao.seen[`i_${o.id}_${o.until}`] = 1;
          return tr(["Bạn ghi nhớ đường đi, chờ lúc sẵn sàng.", "You note the way and wait until you are ready."]);
        } },
      ],
    };
  }
  /** Khoảnh khắc ngộ đạo: một đạo niệm đang lên, người chơi chọn cách nắm bắt. Điều kiện rõ ràng, không may rủi. */
  function ngoDef(c, acct) {
    const d = c.vk2?.dao;
    const top = Object.entries(d?.mastery ?? {}).filter(([k, x]) => x >= 15 && x < 90).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const id = top[0];
    const concept = CONCEPTS[id];
    const tam = c.stats?.tamCanh ?? 50;
    return {
      id: EV_NGO,
      title: tr(["Ngộ đạo", "Enlightenment"]),
      text: () => tr([`Đang đêm, bạn chợt thấy ${concept[0]} có chỗ chưa từng hiểu.`, `Deep in the night, you glimpse something in ${concept[1]} you never understood.`]),
      choices: () => [
        { label: tr(["Nhập định tới cùng", "Meditate to the end"]), hint: tr([`cần tâm cảnh 55, đang ${Math.floor(tam)}`, `Mind State 55, now ${Math.floor(tam)}`]), lean: "trung", off: tam < 55, run: (n) => {
          addMastery(n, id, 14);
          return tr([`${concept[0]} tiến một bước dài.`, `${concept[1]} takes a great step forward.`]);
        } },
        { label: tr(["Ghi lại rồi ngủ", "Write it down and sleep"]), hint: tr(["chắc chắn, thu ít", "certain, small gain"]), lean: "chinh", run: (n) => {
          addMastery(n, id, 6);
          return tr(["Sáng hôm sau đọc lại, vẫn còn hiểu được một nửa.", "Reading it next morning, you still understand half."]);
        } },
        { label: tr(["Cưỡng ép nghịch luyện", "Force it in reverse"]), hint: tr(["thu nhiều, nội thương +12", "large gain, wounds +12"]), lean: "ta", run: (n) => {
          addMastery(n, id, 20);
          if (n.vk2.can) n.vk2.can.injury = clamp(n.vk2.can.injury + 12, 0, 100);
          return tr(["Đạo niệm bật mở, máu cũng trào ra khóe miệng.", "Insight bursts open, and so does the blood at your lips."]);
        } },
      ],
    };
  }

  function nextEvent(c, acct) {
    ensure(c, acct);
    const d = c.vk2.dao;
    const year = yearOf(c);
    const invite = inviteDef(c, acct);
    if (invite) return invite;
    if (year >= 12 && rnd(c, year, 65) < 0.08) return ngoDef(c, acct);
    return null;
  }
  /** Các tầng bí cảnh đi liền nhau trong cùng một năm. */
  function chain(c, acct) {
    const d = c.vk2?.dao;
    if (!d?.run) return null;
    const r = realmDef.get(d.run.id);
    return d.run.floor > r.floors ? trialDef(c, acct) : floorDef(c, acct);
  }
  function eventDef(c, acct, id) {
    const d = c.vk2?.dao;
    if (id === EV_FLOOR) return floorDef(c, acct);
    if (id === EV_TRIAL) return trialDef(c, acct);
    if (id === EV_NGO) return ngoDef(c, acct);
    if (id.startsWith(`${EV_INVITE}:`)) {
      const oid = id.slice(EV_INVITE.length + 1);
      const r = realmDef.get(oid);
      if (!r) return null;
      return inviteDef(c, acct, oid) ?? { id, title: tr(r.n), text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] };
    }
    return null;
  }

  /** Lời hứa chưa giữ được ghi lại khi chết, thành nhân quả cho kiếp sau. */
  function tick(c, acct) {
    const d = ensure(c, acct);
    const notes = [];
    if (c.dead) return notes;
    for (const p of d.promises) {
      if (!p.done && C.metric(p.goal[0], c, acct) >= p.goal[1]) {
        p.done = true;
        addStat(c, "tamCanh", 4);
        addStat(c, "tamMa", -6);
        root.VK2Menh?.note?.(c, acct, "thien", 3);
        notes.push({ kind: "big", t: [`Đã giữ lời hứa: ${p.t[0]}.`, `Promise kept: ${p.t[1]}.`] });
      }
    }
    return notes;
  }

  const startRun = (c, acct, id) => enter(c, acct, id);

  const api = {
    kind: "dao", slotsOf, QUESTS, CONCEPTS, RECIPES, INHERITS, REALMS, BLOODS, COMBINE_AT, ART_SLOTS, DANGER, DANGER_EN, OPEN_YEARS, STUDY_RATE,
    recipeDef, inheritDef, realmDef, ensure, metric, fx, duel, onYear, tick, nextEvent, chain, eventDef,
    masteryName, recipeReady, readyCount, setStudy, canCreate, createArt, toggleArt, artPower, activeArts, hasArtMech, addMastery, enter, startRun, floorDef, trialDef, finishRun, learnInherit, realmAllowed, cleanName, floorKind,
  };
  root.VK2Dao = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
