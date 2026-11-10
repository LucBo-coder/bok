// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 4 — thế giới sống: NPC tự phát triển, sư đồ, tông môn động, gia tộc.
// Thế giới nằm ở acct.world nên sống qua các kiếp; phần riêng của nhân vật ở char.vk2.the.
// NPC cập nhật theo năm và theo sự kiện, có trần dân số, nên dung lượng save không lớn dần theo số kiếp.
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, hash32, rnd, yearOf, tr, addStat } = C.kit;

  const NPC_CAP = 60;
  const NPC_MIN = 34;
  const FALLEN_CAP = 24;
  const LOG_CAP = 40;
  const MEM_CAP = 4;
  const FF_MIN = 20; // Giữa hai kiếp, thế giới trôi từ 20 tới 80 năm
  const FF_SPAN = 60;
  const REALM_MAX = 8;
  const LIFESPAN = [70, 120, 200, 350, 600, 1000, 1800, 3000, 5000];
  const TRAIN_YEARS = [15, 30, 60, 120, 220, 400, 700, 1100, 1800]; // Số năm tu trung bình để đầy một cảnh giới

  const SURNAMES = ["Tạ", "Mộ Dung", "Hứa", "Lục", "Tô", "Bạch", "Liễu", "Thẩm", "Tiêu", "Vân", "Hàn", "Đoàn", "Phương", "Cố", "Kỷ", "Diệp"];
  const GIVEN = ["Thanh", "Vô Trần", "Minh", "Tuyết", "Hạo", "Ly", "Trường Không", "Nhược", "Quân", "Uyển", "Dao", "Tịch", "Phong", "Hàn Sương", "Ngọc", "Bất Hối", "Linh", "Vãn", "Thiên", "Mặc"];
  const PATHS = ["kiem", "dan", "tran", "phat", "ma", "yeu"];
  const PATH_NAME = { kiem: ["Kiếm", "Sword"], dan: ["Đan", "Alchemy"], tran: ["Trận", "Formation"], phat: ["Phật", "Buddhist"], ma: ["Ma", "Demonic"], yeu: ["Yêu", "Beast"] };
  const PATH_CONCEPT = { kiem: "kiem_y", dan: "dan_dao", tran: "tran_dao", phat: "phat_phap", ma: "ma_cong", yeu: "yeu_huyet" };
  const PATH_TECH = { kiem: "liet_hoa", dan: "dan_bao", tran: "kim_quang", phat: "kim_cang_chuong", ma: "huyet_anh_trao", yeu: "thien_ho" };
  const ELEMENTS = ["kim", "moc", "thuy", "hoa", "tho"];
  const PERSONAS = {
    chinh: { n: ["Chính trực", "Upright"], betray: 0, ambition: 0.8, trust: 1.2 },
    on: { n: ["Ôn hòa", "Gentle"], betray: 0, ambition: 0.7, trust: 1.1 },
    ngao: { n: ["Kiêu ngạo", "Proud"], betray: 0.01, ambition: 1.2, trust: 0.8 },
    tham: { n: ["Tham lam", "Greedy"], betray: 0.04, ambition: 1.2, trust: 0.6 },
    lanh: { n: ["Lạnh lùng", "Cold"], betray: 0.015, ambition: 1, trust: 0.8 },
    cuong: { n: ["Cuồng vọng", "Reckless"], betray: 0.03, ambition: 1.4, trust: 0.7 },
  };
  const TALENTS = { thuong: { n: ["Tư chất thường", "Plain"], rate: 1 }, ngo: { n: ["Ngộ tính cao", "Keen Insight"], rate: 1.2 }, ben: { n: ["Bền chí", "Tenacious"], rate: 1.1 }, co: { n: ["Cốt cách kỳ lạ", "Rare Bones"], rate: 1.3 } };
  const GOALS = { song: ["Sống lâu", "Long life"], manh: ["Mạnh hơn mọi người", "Be strongest"], tong: ["Chấp chưởng tông môn", "Lead a sect"], nha: ["Dựng gia tộc", "Build a clan"], thu: ["Báo một mối thù", "Settle a grudge"] };

  const SEED_SECTS = [
    { n: "Thanh Hà Tông", lean: "chinh", concept: "kiem_y" },
    { n: "Bách Thảo Cốc", lean: "chinh", concept: "dan_dao" },
    { n: "Huyền Cơ Các", lean: "trung", concept: "tran_dao" },
    { n: "Vạn Thú Sơn", lean: "trung", concept: "yeu_huyet" },
    { n: "Huyết Sát Môn", lean: "ta", concept: "ma_cong" },
    { n: "Vô Tướng Tự", lean: "chinh", concept: "phat_phap" },
  ];
  /* Tông môn có sẵn trong cốt truyện của game gốc. Chúng phải có mặt trong thế giới và không bị diệt, vì sự kiện gốc vẫn nhắc tới. */
  const GAME_SECTS = {
    "Thanh Vân Tông": { lean: "chinh", concept: "kiem_y" },
    "Kiếm Cốc": { lean: "chinh", concept: "kiem_y" },
    "Phổ Đà Sơn": { lean: "chinh", concept: "phat_phap" },
    "Thiên Cơ Các": { lean: "trung", concept: "tran_dao" },
    "Huyết Sát Môn": { lean: "ta", concept: "ma_cong" },
    "Vạn Độc Môn": { lean: "ta", concept: "dan_dao" },
    "Yêu Thần Điện": { lean: "ta", concept: "yeu_huyet" },
    "Hợp Hoan Tông": { lean: "ta", concept: "hon_thuat" },
  };
  const SEED_FAMS = ["Tạ gia", "Mộ Dung gia", "Hứa gia"];
  const RANK_NEED = [0, 30, 90, 200]; // Cống hiến cho từng chức, theo sectRank của game
  const RANK_NAME = [["Đệ tử ký danh", "Named Disciple"], ["Ngoại môn", "Outer Disciple"], ["Nội môn", "Inner Disciple"], ["Chân truyền", "True Disciple"]];
  const OWN_SECT = { realm: 4, stones: 20000, disciples: 1 };
  const OWN_FAM = { realm: 2, stones: 1500 };
  const SECT_SHOP = {
    mat: { n: ["Một phần nguyên liệu", "A bundle of material"], cost: 12 },
    pill: { n: ["Một viên đan", "One pill"], cost: 25 },
    art: { n: ["Học công pháp của tông", "Study the sect's art"], cost: 40 },
  };
  const LEARN_GAP = 15;
  const TEACH_GAP = 10;
  const TASK_YEARS = 6;

  const QUESTS = [
    { id: "t_master", t: ["Bái một vị sư phụ", "Find a master"], goal: ["has_master", 1], r: { stones: 80 }, go: { tab: "mentor" } },
    { id: "t_learn", after: "t_master", t: ["Học công pháp từ sư phụ", "Learn from your master"], goal: ["learned", 1], r: { stat: { ngoTinh: 2 } }, go: { tab: "mentor" } },
    { id: "t_contrib", t: ["Tích 30 cống hiến tông môn", "Earn 30 sect merit"], goal: ["contrib", 30], r: { stones: 150 }, go: { tab: "sect" } },
    { id: "t_disc", t: ["Nhận đồ đệ đầu tiên", "Take your first disciple"], goal: ["disciples", 1], r: { stat: { tamCanh: 2 } }, go: { tab: "mentor" } },
    { id: "t_teach", after: "t_disc", t: ["Truyền công cho đồ đệ", "Teach your disciple"], goal: ["taught", 1], r: { stones: 300 }, go: { tab: "mentor" } },
    { id: "t_fam", t: ["Có chỗ đứng trong một gia tộc", "Belong to a clan"], goal: ["in_fam", 1], r: { stones: 200 }, go: { tab: "family" } },
    { id: "t_sect", t: ["Tự lập tông môn", "Found your own sect"], goal: ["own_sect", 1], r: { stat: { tamCanh: 5 } }, go: { tab: "sect" } },
  ];

  // ---------- Thế giới ----------

  const wr = (w, a, b = 0) => hash32(hash32(w.seed + Math.imul(w.year + 1, 73856093)) + Math.imul(a + 1, 19349663) + Math.imul(b + 1, 83492791)) / 4294967296;
  const pickOf = (list, x) => list[Math.floor(x * list.length) % list.length];
  const ageOf = (w, n) => w.year - n.b;

  /** Chạy một lần cho mỗi thế giới, kể cả thế giới của save cũ. */
  function addGameSects(w) {
    if (w.gameSects) return w;
    w.gameSects = 1;
    for (const [name, def] of Object.entries(GAME_SECTS)) {
      if (!w.sects[name]) {
        if ((w.gone ?? []).some((g) => g.n === name)) continue;
        w.sects[name] = newSect(w, name, def.lean, def.concept, 3);
      }
      w.sects[name].lean = def.lean;
      w.sects[name].prot = true;
    }
    return w;
  }
  /** Phe của tông do mod tạo. Tông của game gốc để game tự quyết. */
  const sectLean = (acct, name) => {
    const s = acct?.world?.sects?.[name];
    return s && !s.prot && !GAME_SECTS[name] ? s.lean ?? null : null;
  };
  function world(acct, c) {
    if (acct.world) return addGameSects(acct.world);
    const w = (acct.world = { v: 1, seed: hash32((c?.lookSeed ?? 7) + 991), year: 1000, life: c?.lifeNo ?? 0, nextId: 1, npcs: [], fallen: [], sects: {}, fams: {}, wars: [], log: [] });
    for (const s of SEED_SECTS) w.sects[s.n] = newSect(w, s.n, s.lean, s.concept, 2 + Math.floor(wr(w, 1, hash32(s.n)) * 3));
    for (const n of SEED_FAMS) w.fams[n] = { n, rep: 5 + Math.floor(wr(w, 2, hash32(n)) * 20), wealth: 500, land: 1, tech: null, blood: null, life: 0, at: w.year };
    for (let i = 0; i < 44; i++) {
      const n = addNpc(w, { old: true });
      if (i % 3 === 0) n.s = pickOf(SEED_SECTS, wr(w, 3, i)).n;
      if (i % 5 === 0) n.fam = pickOf(SEED_FAMS, wr(w, 4, i));
    }
    return addGameSects(w);
  }
  function newSect(w, name, lean, concept, terr) {
    return { n: name, lean, concept, terr, vein: 1 + Math.floor(wr(w, 5, hash32(name)) * 3), store: 200, rel: {}, at: w.year, own: 0, prot: false };
  }
  /** Tông môn của game gốc được ghi nhận khi người chơi vào, và không bị xóa khỏi thế giới vì cốt truyện gốc vẫn cần chúng. */
  function sectOf(w, name) {
    if (!name) return null;
    if (!w.sects[name] && !(w.gone ?? []).some((g) => g.n === name)) {
      const sec = newSect(w, name, GAME_SECTS[name]?.lean ?? "trung", GAME_SECTS[name]?.concept ?? "kiem_y", 3);
      sec.prot = true;
      w.sects[name] = sec;
    }
    return w.sects[name];
  }
  function addNpc(w, o = {}) {
    const id = w.nextId++;
    const x = (k) => wr(w, 10 + k, id);
    const baseRoot = 0.6 + x(0) * 0.9;
    const r = o.old ? Math.floor(Math.pow(x(1), 2.4) * 6) : 0;
    const persona = pickOf(Object.keys(PERSONAS), x(2));
    const n = {
      id, n: o.n ?? `${pickOf(SURNAMES, x(3))} ${pickOf(GIVEN, x(4))}`, b: w.year - (o.old ? Math.floor(14 + x(5) * LIFESPAN[r] * 0.55) : 0),
      r, p: Math.floor(x(6) * 70), ro: o.ro ?? Math.round(baseRoot * 100) / 100, el: pickOf(ELEMENTS, x(7)), ta: pickOf(Object.keys(TALENTS), Math.pow(x(8), 1.8)), pa: pickOf(PATHS, x(9)), pe: persona, go: pickOf(Object.keys(GOALS), x(10)),
      s: null, sp: null, kids: 0, par: o.par ?? null, fam: o.fam ?? null, lo: Math.round(LIFESPAN[r] * (0.85 + x(11) * 0.3)), mem: [], aff: 0, teach: 0,
    };
    if (o.kin) n.kin = o.kin;
    if (o.bl) n.bl = o.bl;
    w.npcs.push(n);
    return n;
  }
  const npcOf = (w, id) => (id ? w?.npcs.find((n) => n.id === id) ?? null : null);
  const remember = (n, year, t) => {
    n.mem.push([year, t]);
    if (n.mem.length > MEM_CAP) n.mem.shift();
  };
  const logW = (w, t) => {
    w.log.push({ y: w.year, t });
    if (w.log.length > LOG_CAP) w.log.shift();
  };
  const notable = (n) => n.kin || n.disc || n.foe || n.r >= 4;

  function die(w, n, cause) {
    w.npcs = w.npcs.filter((x) => x !== n);
    for (const x of w.npcs) {
      if (x.sp === n.id) x.sp = null;
      if (x.foeN === n.id) x.foeN = null;
    }
    if (notable(n)) {
      w.fallen.push({ id: n.id, n: n.n, r: n.r, y: w.year, cause, s: n.s, kin: n.kin ?? 0, disc: n.disc ?? 0, foe: n.foe ?? 0, fam: n.fam });
      if (w.fallen.length > FALLEN_CAP) w.fallen.shift();
    }
    if (n.r >= 4) logW(w, [`${n.n} (${REALM_N[n.r][0]}) qua đời: ${cause[0]}.`, `${n.n} has died: ${cause[1]}.`]);
  }
  const REALM_N = [["Phàm nhân", "Mortal"], ["Luyện Khí", "Qi Refining"], ["Trúc Cơ", "Foundation"], ["Kim Đan", "Golden Core"], ["Nguyên Anh", "Nascent Soul"], ["Hóa Thần", "Soul Formation"], ["Luyện Hư", "Void Refining"], ["Hợp Thể", "Body Integration"], ["Đại Thừa", "Great Vehicle"]];

  /** Sức mạnh để so giữa các NPC, không phải chỉ số trận thật. */
  const npcPower = (n) => Math.pow(n.r + 1, 2) * n.ro * TALENTS[n.ta].rate;

  // ---------- Một năm của thế giới ----------

  function step(w) {
    w.year += 1;
    const y = w.year;
    for (const n of [...w.npcs]) {
      const age = ageOf(w, n);
      if (age >= n.lo) {
        die(w, n, ["thọ tận", "old age"]);
        continue;
      }
      if (age < 12) continue;
      const sec = n.s ? w.sects[n.s] : null;
      const rate = (100 / TRAIN_YEARS[n.r]) * n.ro * TALENTS[n.ta].rate * (1 + (sec?.vein ?? 0) * 0.03) * (1 + n.teach * 0.1);
      n.p += rate;
      if (n.p >= 100 && n.r < REALM_MAX) {
        const ok = wr(w, 20, n.id) < 0.5 - n.r * 0.04 + n.ro * 0.15;
        if (ok) {
          n.r += 1;
          n.p = 0;
          n.lo = Math.max(n.lo, Math.round(LIFESPAN[n.r] * (0.85 + wr(w, 21, n.id) * 0.3)));
          if (n.r >= 3 || n.kin || n.disc) remember(n, y, ["Đột phá " + REALM_N[n.r][0], "Reached " + REALM_N[n.r][1]]);
          if (n.r >= 5) logW(w, [`${n.n} đột phá ${REALM_N[n.r][0]}, thiên hạ chấn động.`, `${n.n} reaches ${REALM_N[n.r][1]}, and the world takes note.`]);
        } else n.p = 45;
      }
      n.p = Math.min(100, n.p);
    }
    // Mỗi năm chỉ vài NPC có biến cố, để chi phí và nhịp thế giới đều nhỏ
    for (let i = 0; i < 3; i++) {
      if (!w.npcs.length) break;
      const n = w.npcs[Math.floor(wr(w, 30, i) * w.npcs.length) % w.npcs.length];
      lifeEvent(w, n, i);
    }
    while (w.npcs.length < NPC_MIN) addNpc(w, { old: wr(w, 31, w.nextId) < 0.5 });
    if (y % 3 === 0) sectStep(w);
    root.VK2Su?.worldStep(w); // Chuỗi sự kiện và mạch đời NPC đi cùng năm của thế giới, kể cả lúc tua nhanh
  }
  function lifeEvent(w, n, i) {
    const age = ageOf(w, n);
    const y = w.year;
    const x = wr(w, 40 + i, n.id);
    const persona = PERSONAS[n.pe];
    if (age < 14) return;
    if (!n.s && x < 0.4) {
      const names = Object.keys(w.sects);
      if (names.length) {
        n.s = pickOf(names, wr(w, 41, n.id));
        remember(n, y, [`Gia nhập ${n.s}`, `Joined ${n.s}`]);
      }
      return;
    }
    if (age >= 18 && !n.sp && x < 0.3) {
      const other = w.npcs[Math.floor(wr(w, 42, n.id) * w.npcs.length) % w.npcs.length];
      if (other !== n && !other.sp && ageOf(w, other) >= 18 && other.par !== n.id && n.par !== other.id && !(n.par && n.par === other.par)) {
        n.sp = other.id;
        other.sp = n.id;
        other.fam = other.fam ?? n.fam;
        n.fam = n.fam ?? other.fam;
        remember(n, y, [`Kết làm đạo lữ với ${other.n}`, `Married ${other.n}`]);
        remember(other, y, [`Kết làm đạo lữ với ${n.n}`, `Married ${n.n}`]);
      }
      return;
    }
    if (n.sp && n.kids < 3 && w.npcs.length < NPC_CAP && x < 0.5 && age < n.lo * 0.7) {
      const other = npcOf(w, n.sp);
      const kid = addNpc(w, { par: n.id, fam: n.fam, ro: clamp(Math.round(((n.ro + (other?.ro ?? 1)) / 2 + (wr(w, 43, n.id) - 0.5) * 0.3) * 100) / 100, 0.5, 1.8), kin: n.kin ?? other?.kin, bl: n.bl ?? other?.bl, n: `${n.n.split(" ")[0]} ${pickOf(GIVEN, wr(w, 44, n.id))}` });
      n.kids += 1;
      if (other) other.kids += 1;
      kid.s = n.s;
      remember(n, y, [`Sinh ${kid.n}`, `Had a child, ${kid.n}`]);
      return;
    }
    if (n.r >= 1 && x > 0.93) {
      if (wr(w, 45, n.id) < 0.08 / persona.ambition) die(w, n, ["bỏ mạng khi tranh cơ duyên", "died chasing a fortune"]);
      else {
        n.p = Math.min(100, n.p + 35);
        remember(n, y, ["Giành được một cơ duyên", "Seized a fortune"]);
      }
      return;
    }
    if (n.s && x > 0.78 && wr(w, 46, n.id) < persona.betray * 8) {
      const left = n.s;
      n.s = null;
      const sec = w.sects[left];
      if (sec) sec.store = Math.max(0, sec.store - 40);
      remember(n, y, [`Phản bội ${left}`, `Betrayed ${left}`]);
      const inSect = w.npcs.filter((m) => m.s === left && m !== n);
      if (inSect.length) n.foeN = inSect[Math.floor(wr(w, 47, n.id) * inSect.length) % inSect.length].id;
      return;
    }
    if (n.foeN && x > 0.5) {
      const foe = npcOf(w, n.foeN);
      if (!foe) return (n.foeN = null), undefined;
      const mine = npcPower(n) * (0.6 + wr(w, 48, n.id) * 0.8);
      const theirs = npcPower(foe) * (0.6 + wr(w, 49, n.id) * 0.8);
      const lost = mine >= theirs ? foe : n;
      const won = mine >= theirs ? n : foe;
      remember(won, y, [`Báo thù xong với ${lost.n}`, `Settled the score with ${lost.n}`]);
      won.foeN = null;
      die(w, lost, [`chết dưới tay ${won.n}`, `killed by ${won.n}`]);
    }
  }

  function sectPower(w, name) {
    return w.npcs.reduce((s, n) => s + (n.s === name ? npcPower(n) : 0), 0);
  }
  function headOf(w, name) {
    let best = null;
    for (const n of w.npcs) if (n.s === name && ageOf(w, n) >= 18 && (!best || n.r > best.r)) best = n;
    return best;
  }
  function sectRel(a, b) {
    const base = (x, y) => (x.lean === "chinh" && y.lean === "ta") || (x.lean === "ta" && y.lean === "chinh") ? -30 : 0;
    return (a.rel[b.n] ?? 0) + base(a, b);
  }
  function setRel(a, b, d) {
    a.rel[b.n] = clamp((a.rel[b.n] ?? 0) + d, -80, 80);
    b.rel[a.n] = clamp((b.rel[a.n] ?? 0) + d, -80, 80);
  }
  function collapse(w, sec, why) {
    if (sec.prot) {
      sec.terr = 1;
      return;
    }
    delete w.sects[sec.n];
    for (const n of w.npcs) if (n.s === sec.n) n.s = null;
    for (const o of Object.values(w.sects)) delete o.rel[sec.n];
    w.wars = w.wars.filter((x) => x.a !== sec.n && x.b !== sec.n);
    w.gone = [...(w.gone ?? []), { n: sec.n, y: w.year, own: sec.own }].slice(-10);
    logW(w, [`${sec.n} ${why[0]}.`, `${sec.n} ${why[1]}.`]);
  }
  function sectStep(w) {
    const names = Object.keys(w.sects);
    for (const name of names) {
      const sec = w.sects[name];
      if (!sec) continue;
      const power = sectPower(w, name);
      sec.store = clamp(sec.store + sec.terr * sec.vein * 6 - sec.terr * 4, 0, 99999);
      // Hưng thịnh hoặc suy tàn: kho đầy và người mạnh thì mở rộng; kho cạn và không người thì lụi dần.
      if (sec.store >= 900 && power > 60 && sec.terr < 9) {
        sec.store -= 500;
        sec.terr = Math.min(9, sec.terr + 1);
        if (wr(w, 50, hash32(name)) < 0.3) sec.vein = Math.min(9, sec.vein + 1);
        logW(w, [`${name} mở rộng lãnh thổ.`, `${name} expands its territory.`]);
      } else if (power < 4 && wr(w, 51, hash32(name)) < 0.25) {
        sec.terr -= 1;
        if (sec.terr <= 0) collapse(w, sec, ["suy tàn và tan rã", "fades and scatters"]);
      }
    }
    // Ngoại giao trôi dần, và khi căng quá thì thành chiến tranh
    const alive = Object.values(w.sects);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        setRel(a, b, Math.round((wr(w, 52, hash32(a.n + b.n)) - 0.52) * 6));
        const fighting = w.wars.some((x) => x.a === a.n || x.b === a.n || x.a === b.n || x.b === b.n);
        if (!fighting && sectRel(a, b) <= -45 && wr(w, 53, hash32(a.n + b.n)) < 0.2) {
          w.wars.push({ a: a.n, b: b.n, at: w.year, until: w.year + 6 + Math.floor(wr(w, 54, i + j) * 8), sa: 0, sb: 0, id: w.nextId++ });
          logW(w, [`${a.n} và ${b.n} khai chiến.`, `${a.n} and ${b.n} go to war.`]);
        }
      }
    }
    for (const war of [...w.wars]) if (w.year >= war.until) endWar(w, war);
    if (Object.keys(w.sects).length < 5 && wr(w, 55) < 0.2) {
      const founder = w.npcs.find((n) => n.r >= 4 && !n.s);
      if (founder) {
        const name = `${founder.n.split(" ")[0]} Thị Tông`;
        if (!w.sects[name]) {
          w.sects[name] = newSect(w, name, "trung", PATH_CONCEPT[founder.pa], 1);
          founder.s = name;
          remember(founder, w.year, [`Lập ${name}`, `Founded ${name}`]);
          logW(w, [`${founder.n} lập ra ${name}.`, `${founder.n} founds ${name}.`]);
        }
      }
    }
  }
  function endWar(w, war) {
    w.wars = w.wars.filter((x) => x !== war);
    const a = w.sects[war.a];
    const b = w.sects[war.b];
    if (!a || !b) return;
    const pa = (sectPower(w, a.n) + 5) * (0.6 + wr(w, 56, war.id) * 0.8) + war.sa;
    const pb = (sectPower(w, b.n) + 5) * (0.6 + wr(w, 57, war.id) * 0.8) + war.sb;
    const win = pa >= pb ? a : b;
    const lose = pa >= pb ? b : a;
    war.win = win.n;
    win.terr = Math.min(9, win.terr + 1);
    win.store += Math.floor(lose.store * 0.3);
    lose.store = Math.floor(lose.store * 0.7);
    lose.terr -= 1;
    setRel(a, b, 25); // Đánh xong cũng mệt, căng thẳng hạ xuống
    const fallen = w.npcs.filter((n) => n.s === lose.n);
    if (fallen.length) die(w, fallen[Math.floor(wr(w, 58, war.id) * fallen.length) % fallen.length], [`tử trận khi ${lose.n} thua`, `fell in ${lose.n}'s defeat`]);
    logW(w, [`${win.n} thắng ${lose.n}.`, `${win.n} defeats ${lose.n}.`]);
    if (lose.terr <= 0) collapse(w, lose, ["bị diệt sau chiến tranh", "is destroyed in the war"]);
    w.lastWar = { a: a.n, b: b.n, win: win.n, y: w.year };
  }
  /** Tua nhanh giữa hai kiếp. Không sinh sự kiện cho người chơi, chỉ có lịch sử. */
  function fastForward(w, years) {
    for (let i = 0; i < years; i++) step(w);
  }
  function famStep(w) {
    for (const f of Object.values(w.fams)) {
      const members = w.npcs.filter((n) => n.fam === f.n);
      f.wealth = clamp(f.wealth + f.land * 6, 0, 99999);
      f.rep = clamp(f.rep + (members.some((n) => n.r >= 3) ? 1 : 0) - (members.length ? 0 : 1), 0, 100);
      if (!members.length && f.rep <= 0 && !f.live) {
        delete w.fams[f.n];
        logW(w, [`${f.n} không còn ai nối dõi.`, `${f.n} has died out.`]);
      }
    }
  }

  // ---------- Trạng thái nhân vật ----------

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (!v.the) {
      v.the = { v: 1, year: yearOf(c), master: null, disciples: [], kids: [], fam: null, contrib: 0, learnAt: -99, teachAt: -99, taught: 0, learned: 0, childAt: -99, ownSect: null, ownFam: false, foeAt: -99, taskAt: -99, warSeen: {}, leftMaster: 0, gifts: 0 };
      if (yearOf(c) >= 1) for (const q of QUESTS) if (C.metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
    }
    const w = acct ? world(acct, c) : null;
    if (w && (c.lifeNo ?? 0) > (w.life ?? 0)) {
      // Kiếp mới: thế giới đã trôi đi một quãng, người cũ đã già hoặc đã mất.
      w.life = c.lifeNo ?? 0;
      fastForward(w, FF_MIN + Math.floor(wr(w, 60) * FF_SPAN));
      for (const f of Object.values(w.fams)) f.live = false;
    }
    return v.the;
  }
  function metric(name, c, acct) {
    const h = c.vk2?.the;
    switch (name) {
      case "has_master": return h?.master || h?.hadMaster ? 1 : 0;
      case "learned": return h?.learned ?? 0;
      case "contrib": return Math.floor(h?.contrib ?? 0);
      case "disciples": return h?.disciples.length ?? 0;
      case "taught": return h?.taught ?? 0;
      case "in_fam": return h?.fam ? 1 : 0;
      case "own_sect": return h?.ownSect ? 1 : 0;
      case "kids": return h?.kids.length ?? 0;
      default: return undefined;
    }
  }
  const myMaster = (c, acct) => npcOf(acct?.world, c.vk2?.the?.master);
  const myDisciples = (c, acct) => (c.vk2?.the?.disciples ?? []).map((id) => npcOf(acct?.world, id)).filter(Boolean);

  // ---------- Sư phụ ----------

  function masterCandidates(c, acct, limit = 6) {
    ensure(c, acct);
    const realm = c.realm ?? 0;
    return acct.world.npcs.filter((n) => n.r > realm && n.r <= realm + 3 && !n.foe && ageOf(acct.world, n) >= 30).sort((a, b) => (b.pa === c.path) - (a.pa === c.path) || a.r - b.r || a.id - b.id).slice(0, limit);
  }
  const giftCost = (n) => 40 * Math.pow(n.r + 1, 2);
  function canApprentice(c, acct, id) {
    const h = ensure(c, acct);
    const n = npcOf(acct.world, id);
    const reasons = [];
    if (!n) return { ok: false, reasons: [["Người này không còn", "This person is gone"]] };
    if (h.master) reasons.push(["Đã có sư phụ", "You already have a master"]);
    if (n.r <= (c.realm ?? 0)) reasons.push(["Phải cao hơn bạn một cảnh giới", "Must be a realm above you"]);
    if ((c.stats?.tamCanh ?? 0) < 15 * PERSONAS[n.pe].trust) reasons.push(["Tâm cảnh chưa đủ để người này nhận", "Your state of mind does not yet impress them"]);
    if ((c.linhThach ?? 0) < giftCost(n)) reasons.push(["Thiếu lễ bái sư", "Not enough for the gift"]);
    if (yearOf(c) - (h.leftAt ?? -99) < 30) reasons.push(["Vừa rời sư môn, chưa ai dám nhận", "You left a master too recently"]);
    return { ok: !reasons.length, reasons };
  }
  function apprentice(c, acct, id) {
    if (!canApprentice(c, acct, id).ok) return false;
    const h = c.vk2.the;
    const n = npcOf(acct.world, id);
    c.linhThach -= giftCost(n);
    h.master = id;
    h.hadMaster = true;
    n.aff = 30;
    refresh(c, acct);
    remember(n, acct.world.year, [`Nhận ${c.name ?? "một người"} làm đồ đệ`, `Took ${c.name ?? "someone"} as a disciple`]);
    return true;
  }
  /** Rời sư môn có giá thật: tâm ma, và người xưa nhớ chuyện này. */
  function leaveMaster(c, acct) {
    const h = ensure(c, acct);
    const n = myMaster(c, acct);
    if (!h.master) return false;
    h.master = null;
    h.leftAt = yearOf(c);
    refresh(c, acct);
    addStat(c, "tamMa", 8);
    if (n) {
      n.aff = -30;
      remember(n, acct.world.year, ["Bị đồ đệ bỏ đi", "Abandoned by a disciple"]);
    }
    root.VK2Phap?.wound?.(c, acct, "phan", 6);
    return true;
  }
  const canLearn = (c, acct) => !!myMaster(c, acct) && yearOf(c) - c.vk2.the.learnAt >= LEARN_GAP;
  function learnFromMaster(c, acct) {
    if (!canLearn(c, acct)) return null;
    const h = c.vk2.the;
    const n = myMaster(c, acct);
    h.learnAt = yearOf(c);
    h.learned += 1;
    n.aff = clamp(n.aff + 5, -100, 100);
    root.VK2Dao?.addMastery(c, PATH_CONCEPT[n.pa], 12);
    let tech = false;
    if (c.path === n.pa && PATH_TECH[n.pa]) {
      c.cp = c.cp ?? { own: [], eq: [] };
      if (!c.cp.own.some((t) => t.id === PATH_TECH[n.pa])) {
        c.cp.own.push({ id: PATH_TECH[n.pa], tang: 1, exp: 0 });
        tech = true;
      }
    }
    return { concept: PATH_CONCEPT[n.pa], tech };
  }

  // ---------- Đồ đệ ----------

  const discSlots = (realm) => (realm >= 6 ? 4 : realm >= 5 ? 3 : realm >= 4 ? 2 : realm >= 3 ? 1 : 0);
  function discCandidates(c, acct, limit = 6) {
    const h = ensure(c, acct);
    const realm = c.realm ?? 0;
    return acct.world.npcs.filter((n) => n.r < realm && n.r <= realm - 2 && ageOf(acct.world, n) >= 8 && ageOf(acct.world, n) <= 60 && !n.foe && !h.disciples.includes(n.id) && n.id !== h.master).sort((a, b) => b.ro - a.ro || a.id - b.id).slice(0, limit);
  }
  function canTakeDisciple(c, acct, id) {
    const h = ensure(c, acct);
    const n = npcOf(acct.world, id);
    const reasons = [];
    if (!n) return { ok: false, reasons: [["Người này không còn", "This person is gone"]] };
    if (discSlots(c.realm ?? 0) === 0) reasons.push(["Từ Kim Đan mới nhận đồ đệ", "Disciples open at Golden Core"]);
    if (myDisciples(c, acct).length >= discSlots(c.realm ?? 0)) reasons.push(["Đã đủ đồ đệ theo tu vi hiện tại", "You have as many disciples as your realm allows"]);
    if (h.disciples.includes(id)) reasons.push(["Đã là đồ đệ", "Already your disciple"]);
    if ((c.linhThach ?? 0) < 100) reasons.push(["Thiếu lễ nhập môn", "Not enough for the rite"]);
    return { ok: !reasons.length, reasons };
  }
  function takeDisciple(c, acct, id) {
    if (!canTakeDisciple(c, acct, id).ok) return false;
    const h = c.vk2.the;
    const n = npcOf(acct.world, id);
    c.linhThach -= 100;
    h.disciples.push(id);
    n.disc = c.lifeNo ?? 0;
    n.aff = 40;
    if (c.sect) n.s = c.sect;
    remember(n, acct.world.year, [`Bái ${c.name ?? "một người"} làm sư phụ`, `Became a disciple of ${c.name ?? "someone"}`]);
    return true;
  }
  /** Truyền công: bí thuật của người chơi đi vào NPC, làm NPC tu nhanh hơn và được ghi vào di sản. */
  function teach(c, acct, id, artId) {
    const h = ensure(c, acct);
    const n = npcOf(acct.world, id);
    const art = c.vk2.dao?.arts?.find((x) => x.id === artId);
    if (!n || !h.disciples.includes(id) || !art || yearOf(c) - h.teachAt < TEACH_GAP) return false;
    n.arts = [...(n.arts ?? []), art.name].slice(-3);
    if ((n.arts ?? []).filter((x) => x === art.name).length > 1) n.arts = [...new Set(n.arts)];
    n.teach = Math.min(3, (n.teach ?? 0) + 1);
    n.aff = clamp(n.aff + 15, -100, 100);
    h.teachAt = yearOf(c);
    h.taught += 1;
    remember(n, acct.world.year, [`Được truyền ${art.name}`, `Was taught ${art.name}`]);
    return true;
  }
  const supportCost = (n) => 150 * (n.r + 1);
  function support(c, acct, id) {
    const h = ensure(c, acct);
    const n = npcOf(acct.world, id);
    if (!n || !h.disciples.includes(id) || (c.linhThach ?? 0) < supportCost(n)) return false;
    c.linhThach -= supportCost(n);
    n.p = Math.min(100, n.p + 30);
    n.aff = clamp(n.aff + 8, -100, 100);
    return true;
  }
  /** Giao nhiệm vụ: đồ đệ đi vài năm, về mang theo đồ, cũng có thể không về. */
  function sendTask(c, acct, id) {
    const h = ensure(c, acct);
    const n = npcOf(acct.world, id);
    if (!n || !h.disciples.includes(id) || n.task) return false;
    n.task = acct.world.year + TASK_YEARS;
    return true;
  }
  function resolveTasks(c, acct, notes) {
    const w = acct.world;
    for (const n of myDisciples(c, acct)) {
      if (!n.task || w.year < n.task) continue;
      n.task = null;
      const x = wr(w, 70, n.id);
      if (x < 0.05 / (n.r + 1)) {
        die(w, n, ["không trở về sau nhiệm vụ của sư phụ", "never returned from a master's errand"]);
        notes.push({ kind: "bad", t: [`${n.n} không trở về từ chuyến đi bạn giao.`, `${n.n} never came back from your errand.`] });
        root.VK2Phap?.wound?.(c, acct, "mat", 5);
        continue;
      }
      const stones = 40 * (n.r + 1);
      c.linhThach = (c.linhThach ?? 0) + stones;
      const ids = root.VK2Khi ? Object.keys(root.VK2Khi.MATS) : [];
      if (ids.length) root.VK2Khi.addMat(c, acct, ids[Math.floor(wr(w, 71, n.id) * ids.length) % ids.length], 1 + Math.floor(n.r / 2));
      n.aff = clamp(n.aff + 3, -100, 100);
      notes.push({ kind: "good", t: [`${n.n} trở về, mang theo ${stones} linh thạch và ít nguyên liệu.`, `${n.n} returns with ${stones} stones and some materials.`] });
    }
  }

  // ---------- Tông môn ----------

  const mySect = (c, acct) => (c.sect && acct?.world ? sectOf(acct.world, c.sect) : null);
  function joinWorldSect(c, acct, name) {
    ensure(c, acct);
    if (c.sect || !acct.world.sects[name] || (c.realm ?? 0) < 1) return false;
    c.sect = name;
    c.sectRank = 0;
    refresh(c, acct);
    c.daiBiAt = yearOf(c) + 4;
    c.sectSaved = false;
    c.sectHide = false;
    return true;
  }
  /** Cống hiến là thước đo riêng của mod, nhưng chức vị ghi thẳng vào sectRank để giao diện và sự kiện gốc đều thấy. */
  function donate(c, acct, stones) {
    const h = ensure(c, acct);
    const sec = mySect(c, acct);
    if (!sec || !(stones > 0) || (c.linhThach ?? 0) < stones) return false;
    c.linhThach -= stones;
    sec.store += stones;
    h.contrib += stones / 50;
    return true;
  }
  const canRankUp = (c, acct) => {
    const h = ensure(c, acct);
    const rank = c.sectRank ?? 0;
    return !!c.sect && rank < RANK_NEED.length - 1 && h.contrib >= RANK_NEED[rank + 1];
  };
  function rankUp(c, acct) {
    if (!canRankUp(c, acct)) return false;
    c.sectRank = (c.sectRank ?? 0) + 1;
    return true;
  }
  function exchange(c, acct, id) {
    const h = ensure(c, acct);
    const sec = mySect(c, acct);
    const item = SECT_SHOP[id];
    if (!sec || !item || h.contrib < item.cost || sec.store < item.cost) return false;
    h.contrib -= item.cost;
    sec.store -= item.cost;
    if (id === "mat") {
      const ids = root.VK2Khi ? Object.keys(root.VK2Khi.MATS) : [];
      if (ids.length) root.VK2Khi.addMat(c, acct, ids[yearOf(c) % ids.length], 2);
      else c.linhThach = (c.linhThach ?? 0) + 60;
    } else if (id === "pill") {
      const p = ["hoi_xuan", "tu_khi", "thanh_tam"][yearOf(c) % 3];
      c.pills = c.pills ?? {};
      c.pills[p] = (c.pills[p] ?? 0) + 1;
    } else root.VK2Dao?.addMastery(c, sec.concept, 8);
    return true;
  }
  function canFoundSect(c, acct) {
    const h = ensure(c, acct);
    const reasons = [];
    if ((c.realm ?? 0) < OWN_SECT.realm) reasons.push(["Từ Nguyên Anh mới đủ uy tín lập tông", "Founding a sect needs Nascent Soul"]);
    if ((c.linhThach ?? 0) < OWN_SECT.stones) reasons.push([`Cần ${OWN_SECT.stones} linh thạch`, `Needs ${OWN_SECT.stones} stones`]);
    if (myDisciples(c, acct).length < OWN_SECT.disciples) reasons.push(["Cần ít nhất một đồ đệ", "Needs at least one disciple"]);
    if (h.ownSect) reasons.push(["Bạn đã lập tông", "You already founded a sect"]);
    return { ok: !reasons.length, reasons };
  }
  function foundSect(c, acct, rawName) {
    if (!canFoundSect(c, acct).ok) return null;
    const w = acct.world;
    const name = (String(rawName ?? "").replace(/[<>&"'`]/g, "").trim().slice(0, 20) || `${c.name ?? "Vô Danh"} Tông`);
    if (w.sects[name]) return null;
    c.linhThach -= OWN_SECT.stones;
    const sec = newSect(w, name, "trung", PATH_CONCEPT[c.path] ?? "kiem_y", 1);
    sec.own = c.lifeNo ?? 0;
    sec.vein = 1;
    w.sects[name] = sec;
    c.sect = name;
    c.sectRank = 3;
    c.daiBiAt = yearOf(c) + 5;
    c.sectSaved = false;
    c.sectHide = false;
    c.vk2.the.ownSect = name;
    refresh(c, acct);
    for (const n of myDisciples(c, acct)) n.s = name;
    logW(w, [`${c.name ?? "Một tu sĩ"} lập ra ${name}.`, `${c.name ?? "A cultivator"} founds ${name}.`]);
    return sec;
  }
  /** Đầu tư cho tông của mình: lãnh thổ và linh mạch có giá tăng dần theo cấp. */
  const investCost = (sec, what) => (what === "terr" ? 1500 * sec.terr : 2500 * sec.vein);
  function invest(c, acct, what) {
    const h = ensure(c, acct);
    const sec = h.ownSect ? acct.world.sects[h.ownSect] : null;
    if (!sec || !["terr", "vein"].includes(what) || sec[what] >= 9) return false;
    const cost = investCost(sec, what);
    if ((c.linhThach ?? 0) < cost) return false;
    c.linhThach -= cost;
    sec[what] += 1;
    refresh(c, acct);
    return true;
  }

  // ---------- Gia tộc ----------

  function canFoundFam(c, acct) {
    const h = ensure(c, acct);
    const reasons = [];
    if ((c.realm ?? 0) < OWN_FAM.realm) reasons.push(["Từ Trúc Cơ mới đủ sức lập gia tộc", "A clan needs Foundation"]);
    if ((c.linhThach ?? 0) < OWN_FAM.stones) reasons.push([`Cần ${OWN_FAM.stones} linh thạch`, `Needs ${OWN_FAM.stones} stones`]);
    if (h.fam) reasons.push(["Bạn đã thuộc một gia tộc", "You already belong to a clan"]);
    return { ok: !reasons.length, reasons };
  }
  function foundFam(c, acct, rawName) {
    if (!canFoundFam(c, acct).ok) return null;
    const w = acct.world;
    const name = String(rawName ?? "").replace(/[<>&"'`]/g, "").trim().slice(0, 18) || `${String(c.name ?? "Vô Danh").split(" ")[0]} gia`;
    if (w.fams[name]) return null;
    c.linhThach -= OWN_FAM.stones;
    w.fams[name] = { n: name, rep: 5, wealth: 200, land: 0, tech: null, blood: c.vk2.dao?.blood ?? null, life: c.lifeNo ?? 0, at: w.year, live: true };
    c.vk2.the.fam = name;
    c.vk2.the.ownFam = true;
    return w.fams[name];
  }
  function joinFam(c, acct, name) {
    const h = ensure(c, acct);
    const f = acct.world.fams[name];
    if (h.fam || !f || (c.linhThach ?? 0) < 150) return false;
    c.linhThach -= 150;
    h.fam = name;
    f.live = true;
    refresh(c, acct);
    return true;
  }
  const myFam = (c, acct) => (c.vk2?.the?.fam ? acct?.world?.fams[c.vk2.the.fam] ?? null : null);
  function famGive(c, acct, stones) {
    const f = myFam(c, acct);
    if (!f || !(stones > 0) || (c.linhThach ?? 0) < stones) return false;
    c.linhThach -= stones;
    f.wealth += stones;
    f.rep = clamp(f.rep + Math.floor(stones / 500), 0, 100);
    return true;
  }
  const landCost = (f) => 800 * (f.land + 1);
  function famLand(c, acct) {
    const f = myFam(c, acct);
    if (!f || f.land >= 5 || f.wealth < landCost(f)) return false;
    f.wealth -= landCost(f);
    f.land += 1;
    f.rep = clamp(f.rep + 3, 0, 100);
    return true;
  }
  function famTech(c, acct, artId) {
    const f = myFam(c, acct);
    const art = c.vk2.dao?.arts?.find((x) => x.id === artId);
    if (!f || !art || f.tech?.name === art.name) return false;
    f.tech = { name: art.name, recipe: art.recipe, life: c.lifeNo ?? 0 };
    refresh(c, acct);
    return true;
  }
  const canHaveChild = (c, acct) => {
    const h = ensure(c, acct);
    return !!c.partner && !!h.fam && h.kids.length < 4 && yearOf(c) - h.childAt >= 20 && (c.linhThach ?? 0) >= 300 && acct.world.npcs.length < NPC_CAP;
  };
  /** Hậu duệ là NPC thật, có huyết mạch và căn cốt theo cha mẹ, sống tiếp sau khi người chơi mất. */
  function haveChild(c, acct) {
    if (!canHaveChild(c, acct)) return null;
    const h = c.vk2.the;
    const w = acct.world;
    c.linhThach -= 300;
    h.childAt = yearOf(c);
    const n = addNpc(w, { fam: h.fam, kin: c.lifeNo ?? 0, bl: c.vk2.dao?.blood ?? myFam(c, acct)?.blood ?? null, ro: clamp(Math.round(((c.linhCanMul ?? 1) * 0.7 + 0.3) * 100) / 100, 0.5, 1.8), n: `${String(c.name ?? "Vô Danh").split(" ")[0]} ${pickOf(GIVEN, wr(w, 72, h.kids.length))}` });
    h.kids.push(n.id);
    n.s = c.sect ?? null;
    return n;
  }

  // ---------- Kẻ thù ----------

  /** Một mối thù trong bí cảnh hoặc sự kiện thành NPC thật, có thể quay lại đòi nợ. Trần 3 kẻ còn sống mỗi lúc. */
  function grudge(c, acct, rival) {
    ensure(c, acct);
    const w = acct.world;
    if (w.npcs.filter((n) => n.foe).length >= 3) return null;
    const label = tr(rival) ?? "Tán tu";
    const n = addNpc(w, { old: false });
    n.r = clamp((c.realm ?? 1) - 1 + Math.floor(wr(w, 73, n.id) * 2), 0, REALM_MAX);
    n.b = w.year - 30 - n.r * 15;
    n.lo = Math.round(LIFESPAN[n.r] * 1.1);
    n.pe = "cuong";
    n.go = "thu";
    n.foe = c.lifeNo ?? 0;
    n.foeSince = yearOf(c);
    remember(n, w.year, [`Mối thù từ ${label}`, `A grudge from ${label}`]);
    return n;
  }
  const liveFoes = (c, acct) => acct?.world?.npcs.filter((n) => n.foe) ?? [];

  // ---------- Hiệu ứng ----------

  /* Hàm tính chỉ số không có acct, nên phần phụ thuộc thế giới được chép vào nhân vật mỗi khi có thay đổi. */
  function refresh(c, acct) {
    const h = c.vk2?.the;
    if (!h || !acct?.world) return;
    const m = npcOf(acct.world, h.master);
    const sec = c.sect ? acct.world.sects[c.sect] : null;
    const fam = h.fam ? acct.world.fams[h.fam] : null;
    h.fx = { master: !!(m && m.r > (c.realm ?? 0)), vein: sec?.vein ?? 0, tech: !!fam?.tech };
  }
  function fx(c) {
    const f = c.vk2?.the?.fx;
    if (!f) return [];
    const out = [];
    if (f.master) out.push({ cult: 0.04, brk: 0.01 });
    if (f.vein) out.push({ cult: Math.min(0.05, f.vein * 0.007) });
    if (f.tech) out.push({ atk: 0.02 });
    return out;
  }

  // ---------- Một năm của nhân vật ----------

  function onYear(c, acct, opts) {
    if (!acct) return [];
    const h = ensure(c, acct);
    const notes = [];
    const year = yearOf(c);
    if (year <= h.year) return notes;
    const w = acct.world;
    const delta = Math.min(60, year - h.year);
    h.year = year;
    for (let i = 0; i < delta; i++) {
      step(w);
      if (w.year % 3 === 0) famStep(w);
    }
    // Người thân tình đã mất trong những năm vừa rồi
    if (h.master && !npcOf(w, h.master)) {
      const f = w.fallen.find((x) => x.id === h.master);
      notes.push({ kind: "bad", t: [`Sư phụ ${f?.n ?? ""} đã qua đời.`, `Your master ${f?.n ?? ""} has passed away.`] });
      h.master = null;
      root.VK2Phap?.wound?.(c, acct, "mat", 6);
    }
    for (const id of [...h.disciples]) {
      if (!npcOf(w, id)) {
        const f = w.fallen.find((x) => x.id === id);
        h.disciples = h.disciples.filter((x) => x !== id);
        notes.push({ kind: "bad", t: [`Đồ đệ ${f?.n ?? ""} đã mất.`, `Your disciple ${f?.n ?? ""} is gone.`] });
        root.VK2Phap?.wound?.(c, acct, "mat", 4);
      }
    }
    refresh(c, acct);
    if (year < 6) return notes;

    resolveTasks(c, acct, notes);
    // Đồ đệ bị bỏ bê thì xa dần, kẻ có tính phản trắc có thể rời đi
    for (const n of myDisciples(c, acct)) {
      n.aff = clamp(n.aff - 0.3, -100, 100);
      if (n.aff < 0 && wr(w, 74, n.id) < PERSONAS[n.pe].betray) {
        h.disciples = h.disciples.filter((x) => x !== n.id);
        n.foe = c.lifeNo ?? 0;
        n.foeSince = year;
        remember(n, w.year, ["Phản bội sư môn", "Betrayed their master"]);
        notes.push({ kind: "bad", t: [`Đồ đệ ${n.n} phản bội bạn và bỏ đi.`, `Your disciple ${n.n} betrays you and leaves.`] });
        root.VK2Phap?.wound?.(c, acct, "phan", 12);
      }
    }
    // Tông môn của người chơi bị diệt
    if (c.sect && !w.sects[c.sect] && (w.gone ?? []).some((g) => g.n === c.sect)) {
      notes.push({ kind: "bad", t: [`${c.sect} đã bị diệt. Bạn không còn chốn về.`, `${c.sect} has fallen. You have nowhere to return to.`] });
      c.sect = null;
      c.sectRank = undefined;
      h.contrib = 0;
      addStat(c, "tamCanh", -6);
      refresh(c, acct);
    }
    if (c.sect) {
      sectOf(w, c.sect);
      if (c.focus === "tu_luyen" || c.focus === "tru_yeu") h.contrib += 1;
    }
    const fam = myFam(c, acct);
    if (fam) {
      fam.live = true;
      if (fam.land) c.linhThach = (c.linhThach ?? 0) + fam.land * 4;
      if (fam.blood && root.VK2Dao && !c.vk2.dao?.blood && (c.realm ?? 0) >= 2 && rnd(c, year, 75) < 0.015) {
        c.vk2.dao.blood = fam.blood;
        notes.push({ kind: "big", awake: true, t: ["Huyết mạch gia tộc thức tỉnh trong người bạn.", "Your clan's bloodline awakens in you."] });
      }
    }
    if (h.master) {
      const m = myMaster(c, acct);
      if (m) m.aff = clamp(m.aff + 0.1, -100, 100);
    }
    return notes;
  }

  // ---------- Sự kiện ----------

  const EV_TASK = "vk2_the_task";
  const EV_WAR = "vk2_the_war";
  const EV_FOE = "vk2_the_foe";

  function taskDef(c, acct) {
    const m = myMaster(c, acct);
    return {
      id: EV_TASK,
      title: tr(["Sư phụ giao việc", "Your master's errand"]),
      text: () => tr([`${m?.n ?? "Sư phụ"} gọi bạn tới: một lũ yêu thú đang quấy phá gần sơn môn, và kho dược liệu cũng sắp cạn.`, `${m?.n ?? "Your master"} calls you over: beasts prowl near the gate, and the herb store is running low.`]),
      choices: () => [
        { label: tr(["Đi trừ yêu", "Hunt the beasts"]), hint: tr(["giao đấu", "fight"]), lean: "chinh", run: (n) => {
          const res = C.duel(n, C.combatLevel(n) - 3, 1, (n.lookSeed ?? 0) + yearOf(n) * 5, 1);
          const mm = myMaster(n, acct);
          if (res.win) {
            if (mm) mm.aff = clamp(mm.aff + 8, -100, 100);
            n.linhThach = (n.linhThach ?? 0) + 60;
            return tr(["Yêu thú tan tác. Sư phụ gật đầu, thưởng ít linh thạch.", "The beasts scatter. Your master nods and hands over some stones."]);
          }
          addStat(n, "sucKhoe", -12);
          return tr(["Bạn phải rút về với vết thương trên người.", "You retreat with wounds to show for it."]);
        } },
        { label: tr(["Góp 100 linh thạch mua dược liệu", "Give 100 stones for herbs"]), hint: tr(["tốn linh thạch", "costs stones"]), lean: "trung", off: (c.linhThach ?? 0) < 100, run: (n) => {
          if ((n.linhThach ?? 0) < 100) return tr(["Bạn không đủ linh thạch, đành xin lỗi.", "You lack the stones and must apologise."]);
          n.linhThach -= 100;
          const mm = myMaster(n, acct);
          if (mm) mm.aff = clamp(mm.aff + 4, -100, 100);
          return tr(["Sư phụ nhận lấy, không nói gì nhiều.", "Your master takes it without much comment."]);
        } },
        { label: tr(["Xin bế quan, không đi", "Ask to stay in seclusion"]), hint: tr(["sư phụ phật ý", "displeases your master"]), lean: "ta", run: (n) => {
          const mm = myMaster(n, acct);
          if (mm) mm.aff = clamp(mm.aff - 12, -100, 100);
          return tr(["Sư phụ im lặng nhìn bạn một lúc lâu.", "Your master looks at you in long silence."]);
        } },
      ],
    };
  }
  function warDef(c, acct) {
    const w = acct?.world;
    const war = w?.wars.find((x) => x.a === c.sect || x.b === c.sect);
    if (!war) return null;
    const other = war.a === c.sect ? war.b : war.a;
    const add = (n, x) => {
      const wa = acct.world.wars.find((z) => z.id === war.id);
      if (!wa) return;
      if (wa.a === n.sect) wa.sa += x;
      else wa.sb += x;
    };
    return {
      id: EV_WAR,
      title: tr(["Tông môn khai chiến", "Your sect is at war"]),
      text: () => tr([`${c.sect} đang giao chiến với ${other}. Trưởng lão kêu gọi mọi đệ tử góp sức.`, `${c.sect} is fighting ${other}. The elders call on all disciples.`]),
      choices: () => [
        { label: tr(["Ra trận", "Go to the front"]), hint: tr(["giao đấu, có thể bị thương", "fight, may be hurt"]), lean: "chinh", run: (n) => {
          const res = C.duel(n, C.combatLevel(n) - 1, 1, (n.lookSeed ?? 0) + yearOf(n) * 7, 1);
          root.VK2Menh?.note?.(n, acct, "sat", 1);
          if (res.win) {
            add(n, 8 + (n.realm ?? 0) * 3);
            n.vk2.the.contrib += 15;
            return tr(["Bạn đánh lui một cánh quân địch, cả tông biết tên.", "You drive back an enemy wing, and the whole sect learns your name."]);
          }
          add(n, 2);
          n.vk2.the.contrib += 5;
          addStat(n, "sucKhoe", -18);
          return tr(["Bạn được khiêng về, nhưng đã làm hết sức.", "You are carried back, but you gave all you had."]);
        } },
        { label: tr(["Góp 300 linh thạch vào kho", "Give 300 stones to the war chest"]), hint: tr(["không phải ra trận", "no fighting"]), lean: "trung", off: (c.linhThach ?? 0) < 300, run: (n) => {
          if ((n.linhThach ?? 0) < 300) return tr(["Bạn không có đủ.", "You lack the funds."]);
          n.linhThach -= 300;
          add(n, 4);
          n.vk2.the.contrib += 6;
          return tr(["Kho chiến phí đầy thêm một chút.", "The war chest fills a little."]);
        } },
        { label: tr(["Đứng ngoài", "Stay out of it"]), hint: tr(["mất cống hiến", "lose merit"]), lean: "ta", run: (n) => {
          n.vk2.the.contrib = Math.max(0, n.vk2.the.contrib - 10);
          return tr(["Bạn đóng cửa tu luyện, nghe đồng môn xì xào ngoài kia.", "You shut your door and hear your peers muttering outside."]);
        } },
      ],
    };
  }
  function foeDef(c, acct) {
    const n = npcOf(acct?.world, c.vk2?.the?.evFoe);
    if (!n) return null;
    const lv = () => C.combatLevel({ realm: n.r, layer: 3 });
    const cost = 200 * (n.r + 1);
    return {
      id: EV_FOE,
      title: tr(["Kẻ thù tìm tới", "An enemy finds you"]),
      text: () => tr([`${n.n} chặn đường bạn. Món nợ cũ giờ tới hạn.`, `${n.n} blocks your way. An old debt has come due.`]),
      choices: () => [
        { label: tr(["Giao chiến", "Fight"]), hint: tr(["một mất một còn", "one of you falls"]), lean: "ta", run: (x, e) => {
          const res = C.duel(x, lv(), 1, (x.lookSeed ?? 0) + yearOf(x) * 11, 1);
          if (res.win) {
            die(acct.world, n, ["bại dưới tay kẻ thù cũ", "defeated by an old enemy"]);
            root.VK2Menh?.note?.(x, acct, "sat", 3);
            return tr([`${n.n} ngã xuống. Mối thù khép lại, bằng máu.`, `${n.n} falls. The feud ends, in blood.`]);
          }
          addStat(x, "sucKhoe", -30);
          if (x.vk2.can) x.vk2.can.injury = clamp(x.vk2.can.injury + 15, 0, 100);
          root.VK2Phap?.wound?.(x, acct, "thu", 6);
          return tr(["Bạn thua, thoát thân trong gang tấc.", "You lose and barely escape."]);
        } },
        { label: tr([`Bồi thường ${cost} linh thạch, hóa giải`, `Pay ${cost} stones to make peace`]), hint: tr(["hóa giải nhân quả", "resolves the karma"]), lean: "chinh", off: (c.linhThach ?? 0) < cost, run: (x) => {
          if ((x.linhThach ?? 0) < cost) return tr(["Bạn không đủ để bồi thường.", "You cannot afford it."]);
          x.linhThach -= cost;
          n.foe = 0;
          n.aff = 5;
          remember(n, acct.world.year, ["Hóa giải mối thù", "Made peace"]);
          root.VK2Menh?.note?.(x, acct, "thien", 3);
          return tr(["Hai bên nhìn nhau hồi lâu rồi quay đi. Từ nay không còn nợ.", "You look at each other for a long moment, then part. No debt remains."]);
        } },
        { label: tr(["Bỏ chạy", "Run"]), hint: tr(["họ sẽ quay lại", "they will return"]), lean: "trung", run: (x) => {
          x.linhThach = Math.max(0, (x.linhThach ?? 0) - 40 * (n.r + 1));
          return tr(["Bạn chạy thoát, đánh rơi ít linh thạch. Kẻ đó sẽ lại tìm tới.", "You escape, dropping a few stones. They will find you again."]);
        } },
      ],
    };
  }
  function nextEvent(c, acct) {
    if (!acct?.world) return null;
    const h = ensure(c, acct);
    const year = yearOf(c);
    const war = c.sect ? acct.world.wars.find((x) => x.a === c.sect || x.b === c.sect) : null;
    if (war && !h.warSeen[war.id] && (c.realm ?? 0) >= 2) {
      h.warSeen[war.id] = year;
      return warDef(c, acct);
    }
    if (year - h.foeAt >= 18) {
      const foe = liveFoes(c, acct).find((n) => year - (n.foeSince ?? 0) >= 12 || (n.foe && n.foe !== (c.lifeNo ?? 0)));
      if (foe && rnd(c, year, 76) < 0.25 / (1 + (root.VK2Phap?.lawTier?.(c.vk2?.phap, "nhan_qua") ?? 0))) {
        h.foeAt = year;
        h.evFoe = foe.id;
        return foeDef(c, acct);
      }
    }
    if (h.master && year - h.taskAt >= 12 && rnd(c, year, 77) < 0.2) {
      h.taskAt = year;
      return taskDef(c, acct);
    }
    return null;
  }
  const fallback = (id) => ({ id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] });
  function eventDef(c, acct, id) {
    if (id === EV_TASK) return taskDef(c, acct);
    if (id === EV_WAR) return warDef(c, acct) ?? fallback(id);
    if (id === EV_FOE) return foeDef(c, acct) ?? fallback(id);
    return null;
  }

  function onDeath(c, acct) {
    const h = c.vk2?.the;
    if (!h || !acct?.world) return {};
    const w = acct.world;
    const fam = h.fam ? w.fams[h.fam] : null;
    if (fam) fam.live = false;
    return {
      the: {
        disciples: myDisciples(c, acct).map((n) => ({ id: n.id, n: n.n })),
        kids: h.kids.map((id) => npcOf(w, id)).filter(Boolean).map((n) => ({ id: n.id, n: n.n })),
        ownSect: h.ownSect, ownFam: h.ownFam ? h.fam : null, master: myMaster(c, acct)?.n ?? null, y: w.year,
      },
    };
  }
  function summary(c, acct) {
    const h = c.vk2?.the;
    if (!h) return null;
    return { master: h.master, disciples: h.disciples.length, kids: h.kids.length, fam: h.fam, own: h.ownSect, contrib: Math.floor(h.contrib) };
  }

  const api = {
    kind: "the", QUESTS, NPC_CAP, NPC_MIN, REALM_MAX, LIFESPAN, PERSONAS, TALENTS, GOALS, PATH_NAME, PATH_CONCEPT, RANK_NEED, RANK_NAME, OWN_SECT, OWN_FAM, SECT_SHOP, LEARN_GAP, TEACH_GAP, TASK_YEARS, FF_MIN, REALM_N,
    ensure, world, sectLean, metric, fx, refresh, onYear, nextEvent, eventDef, onDeath, summary, step, famStep, fastForward, addNpc, npcOf, ageOf, sectOf, sectPower, headOf, npcPower,
    masterCandidates, giftCost, canApprentice, apprentice, leaveMaster, canLearn, learnFromMaster, myMaster, myDisciples,
    discSlots, discCandidates, canTakeDisciple, takeDisciple, teach, supportCost, support, sendTask,
    mySect, joinWorldSect, donate, canRankUp, rankUp, exchange, canFoundSect, foundSect, invest, investCost,
    canFoundFam, foundFam, joinFam, myFam, famGive, landCost, famLand, famTech, canHaveChild, haveChild, grudge, liveFoes, die, warDef, taskDef, foeDef, endWar,
  };
  root.VK2The = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
