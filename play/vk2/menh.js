// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 6 — Thiên Đạo ghi nhớ, Thiên Mệnh cá nhân, nhân quả và truyền thừa xuyên kiếp.
// Sổ Thiên Đạo và Thiên Mệnh ở char.vk2.menh, di sản ở acct.legacy. Di sản không giữ sức mạnh trực tiếp: mọi thứ phải đi tìm lại.
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, rnd, yearOf, tr, addStat } = C.kit;

  // ---------- Sổ Thiên Đạo ----------

  const LEDGER = {
    sat: ["Sát nghiệp", "Bloodshed"], thien: ["Thiện duyên", "Good Deeds"], nghich: ["Nghịch thiên", "Defiance"], su: ["Đổi lịch sử", "Rewritten History"],
    pha: ["Phá thế lực", "Powers Destroyed"], bao: ["Bảo vệ thế lực", "Powers Protected"], cam: ["Cấm thuật", "Forbidden Arts"], nhan: ["Nhân quả chưa giải", "Unresolved Karma"],
  };
  const LEDGER_MAX = 100;
  const DECAY = 0.993; // Mỗi năm phai đi một ít: Thiên Đạo nhớ lâu, nhưng không nhớ mãi
  const RULE_GAP = 30;

  /*
   * Bảng quy tắc rõ ràng, kiểm thử được. Mỗi quy tắc chỉ đọc sổ, có ngưỡng và thời gian chờ, và không dùng xác suất để quyết định có xảy ra hay không.
   * Quy tắc đầu tiên thỏa thì chạy, nên thứ tự cũng là độ ưu tiên.
   */
  const RULES = [
    { id: "truy_sat", when: (l) => l.sat >= 50, ev: "vk2_menh_hunt", d: ["Sát nghiệp từ 50: chính đạo cử người truy sát.", "Bloodshed 50+: the orthodox send hunters."] },
    { id: "su_gia", when: (l) => l.cam >= 30 || l.su >= 25, ev: "vk2_menh_envoy", d: ["Cấm thuật từ 30 hoặc đổi lịch sử từ 25: sứ giả Thiên Đạo xuất hiện.", "Forbidden arts 30+ or rewritten history 25+: Heaven's envoy appears."] },
    { id: "doi_no", when: (l) => l.nhan >= 30, ev: "vk2_menh_debt", d: ["Nhân quả chưa giải từ 30: người đòi nợ tìm tới, mở sự kiện ẩn.", "Unresolved karma 30+: a creditor arrives, opening a hidden event."] },
    { id: "co_duyen", when: (l) => l.thien >= 35, ev: "vk2_menh_gift", d: ["Thiện duyên từ 35: phát sinh cơ duyên.", "Good deeds 35+: a fortune appears."] },
    { id: "the_luc", when: (l) => l.bao >= 20, ev: "vk2_menh_ally", d: ["Bảo vệ thế lực từ 20: một thế lực mang ơn tìm đến.", "Protected powers 20+: a grateful power comes to you."] },
  ];
  /* Thiên kiếp thay đổi: quy tắc thụ động, tính thẳng vào tỷ lệ đột phá của game. */
  const PASSIVE = [
    { id: "kiep_nang", when: (l) => l.nghich >= 40, fx: { brk: -0.03 }, d: ["Nghịch thiên từ 40: thiên kiếp nặng hơn, đột phá -3%.", "Defiance 40+: heavier tribulations, breakthrough -3%."] },
    { id: "kiep_nhe", when: (l) => l.thien >= 50 && l.sat < 20, fx: { brk: 0.02 }, d: ["Thiện duyên từ 50, sát nghiệp dưới 20: trời nương tay, đột phá +2%.", "Good deeds 50+, bloodshed under 20: Heaven relents, breakthrough +2%."] },
  ];

  function note(c, acct, kind, n) {
    if (!c.vk2 || !LEDGER[kind]) return;
    const m = ensure(c, acct);
    m.ledger[kind] = clamp((m.ledger[kind] ?? 0) + n, 0, LEDGER_MAX);
    if (kind === "sat") root.VK2Phap?.wound?.(c, acct, "sat", n * 0.5);
    if (kind === "cam") root.VK2Phap?.wound?.(c, acct, "kiep", n * 0.3);
  }
  const ledgerOf = (m) => Object.fromEntries(Object.keys(LEDGER).map((k) => [k, m.ledger[k] ?? 0]));

  // ---------- Thiên Mệnh ----------

  /*
   * Mỗi Thiên Mệnh có điều kiện, chuỗi nhiệm vụ, biến cố, thưởng, đánh đổi và kết cục. Xác suất có Thiên Mệnh thấp hơn hẳn 100%, và không có cái nào bảo đảm thắng.
   * goal đọc từ dữ liệu thật của nhân vật qua metric bên dưới.
   */
  const FATES = {
    nghich: {
      n: ["Kẻ Nghịch Thiên", "The Defiant"], d: ["Gia tộc bạn bị diệt khi bạn còn nhỏ. Có một cái tên đứng sau chuyện đó.", "Your clan was destroyed when you were small. There is a name behind it."],
      gain: ["Công +8%, ngộ tính tốt hơn", "Attack +8%, sharper insight"], cost: ["Tâm ma tăng dần, và tâm cảnh khó yên", "Inner demons slowly grow, and your mind finds no peace"],
      when: (c) => (c.lifeNo ?? 0) >= 2, fx: { atk: 0.08 }, year: (c) => addStat(c, "tamMa", 0.1), w: 2,
      steps: [
        { t: ["Tìm ra kẻ chủ mưu", "Find the mastermind"], goal: ["fate_foe", 1], r: { stones: 100 } },
        { t: ["Tu luyện tới Kim Đan", "Reach Golden Core"], goal: ["fate_realm", 3], r: { stat: { tamCanh: 3 } } },
        { t: ["Đối diện kẻ chủ mưu: báo thù hoặc hóa giải", "Face the mastermind: revenge or peace"], goal: ["fate_end", 1], r: { phuc: 1 } },
      ],
    },
    sat_tinh: {
      n: ["Thiên Sát Cô Tinh", "The Lone Star"], d: ["Sức mạnh chảy trong máu bạn, và những người ở gần bạn đều gặp chuyện chẳng lành.", "Power runs in your blood, and those close to you meet with misfortune."],
      gain: ["Công +15%, sinh lực +5%", "Attack +15%, HP +5%"], cost: ["Đồ đệ khó ở lâu, đạo lữ dễ gặp nạn", "Disciples rarely stay, and partners meet with harm"],
      when: () => true, fx: { atk: 0.15, hp: 0.05 }, year: (c, acct) => {
        for (const n of root.VK2The?.myDisciples?.(c, acct) ?? []) n.aff = clamp(n.aff - 0.7, -100, 100);
        if (c.partner && rnd(c, yearOf(c), 600) < 0.01) {
          c.partner = null;
          addStat(c, "tamMa", 8);
        }
      }, w: 2,
      steps: [
        { t: ["Thắng 30 trận", "Win 30 fights"], goal: ["fate_fights", 30], r: { stones: 200 } },
        { t: ["Tu tới Trúc Cơ", "Reach Foundation"], goal: ["fate_realm", 2], r: { stat: { daoTam: 0 } } },
        { t: ["Chọn: giữ sức mạnh hay phá mệnh", "Choose: keep the power, or break the fate"], goal: ["fate_end", 1], r: { phuc: 1 } },
      ],
    },
    dan_su: {
      n: ["Vạn Thế Đan Sư", "Alchemist of Ages"], d: ["Lò đan như quen tay bạn từ bao đời trước.", "A furnace feels as if it has known your hand for lives."],
      gain: ["Đan Đạo lớn gấp đôi, tu vi +3%", "Alchemy grows twice as fast, cultivation +3%"], cost: ["Công -5%, không hợp giao chiến", "Attack -5%, unsuited to battle"],
      when: (c) => c.path === "dan" || c.focus === "luyen_dan" || C.rootInfo(c).elements?.includes("hoa"), fx: { cult: 0.03, atk: -0.05 }, year: (c) => root.VK2Dao?.addMastery(c, "dan_dao", 1), w: 3,
      steps: [
        { t: ["Đan Đạo đạt Lĩnh ngộ", "Reach Understood in Alchemy"], goal: ["fate_dan", 30], r: { stones: 150 } },
        { t: ["Tu tới Kim Đan", "Reach Golden Core"], goal: ["fate_realm", 3], r: { stat: { ngoTinh: 3 } } },
        { t: ["Chọn: truyền đan phương hay giữ làm của riêng", "Choose: share your formula or hoard it"], goal: ["fate_end", 1], r: { phuc: 1 } },
      ],
    },
    luan_hoi: {
      n: ["Luân Hồi Chi Tử", "Child of Samsara"], d: ["Bạn thường mơ thấy những cuộc đời không phải của mình.", "You often dream of lives that are not yours."],
      gain: ["Dễ gặp lại di sản tiền kiếp hơn", "Past-life legacies find you more easily"], cost: ["Nghiệp tiền kiếp đè nặng, tâm ma đầu đời cao", "Past karma weighs on you, with more inner demons early"],
      when: (c, acct) => (c.lifeNo ?? 0) >= 3 && (acct?.legacy?.items?.length ?? 0) >= 1, fx: {}, start: (c, acct) => root.VK2Phap?.wound?.(c, acct, "kiep", 12), w: 3,
      steps: [
        { t: ["Tìm lại một di sản tiền kiếp", "Recover a past-life legacy"], goal: ["fate_finds", 1], r: { stones: 150 } },
        { t: ["Tu tới Trúc Cơ", "Reach Foundation"], goal: ["fate_realm", 2], r: { stat: { tamCanh: 3 } } },
        { t: ["Chọn: hóa giải nhân quả hay mượn sức tiền kiếp", "Choose: resolve the karma, or borrow past-life power"], goal: ["fate_end", 1], r: { phuc: 1 } },
      ],
    },
  };
  const FATE_CHANCE = 0.28; // Phần lớn các kiếp không có Thiên Mệnh
  const FATE_AGE = 8;

  function rollFate(c, acct) {
    const m = c.vk2.menh;
    if (m.rolled) return;
    m.rolled = true;
    if (rnd(c, 1, 601) >= FATE_CHANCE) return;
    const options = Object.entries(FATES).filter(([, f]) => f.when(c, acct));
    if (!options.length) return;
    const total = options.reduce((s, [, f]) => s + f.w, 0);
    let x = rnd(c, 1, 602) * total;
    for (const [id, f] of options) {
      x -= f.w;
      if (x <= 0) return setFate(c, acct, id);
    }
  }
  function setFate(c, acct, id) {
    const m = ensure(c, acct);
    m.rolled = true;
    m.fate = { id, at: yearOf(c), end: null, foeId: null, retryAt: -99 };
    FATES[id].start?.(c, acct);
    if (id === "nghich") root.VK2Phap?.wound?.(c, acct, "thu", 10);
    return m.fate;
  }
  const fateDef = (c) => (c.vk2?.menh?.fate ? FATES[c.vk2.menh.fate.id] : null);
  function questsOf(c) {
    const m = c.vk2?.menh;
    if (!m?.fate) return [];
    const f = FATES[m.fate.id];
    return f.steps.map((s, i) => ({ id: `f_${m.fate.id}_${i}`, t: [`${f.n[0]}: ${s.t[0]}`, `${f.n[1]}: ${s.t[1]}`], goal: s.goal, r: s.r, after: i ? `f_${m.fate.id}_${i - 1}` : undefined, go: { tab: "destiny" } }));
  }
  function metric(name, c, acct) {
    const m = c.vk2?.menh;
    switch (name) {
      case "fate_foe": return m?.fate?.foeId ? 1 : 0;
      case "fate_realm": return c.realm ?? 0;
      case "fate_end": return m?.fate?.end ? 1 : 0;
      case "fate_fights": return (c.vk2?.c?.kills ?? 0) + (c.vk2?.c?.bc_fights ?? 0);
      case "fate_dan": return Math.floor(c.vk2?.dao?.mastery?.dan_dao ?? 0);
      case "fate_finds": return m?.finds ?? 0;
      case "finds": return m?.finds ?? 0;
      case "legacy_items": return acct?.legacy?.items?.length ?? 0;
      default: return undefined;
    }
  }
  /** Bước cuối của Thiên Mệnh mở ra khi các bước trước đã xong. */
  function fateReady(c, acct) {
    const m = c.vk2?.menh;
    const f = fateDef(c);
    if (!f || m.fate.end) return false;
    return f.steps.slice(0, -1).every((s) => C.metric(s.goal[0], c, acct) >= s.goal[1]);
  }

  const EV_REVEAL = "vk2_menh_reveal";
  const EV_END = "vk2_menh_fate_end";
  function revealDef(c, acct) {
    return {
      id: EV_REVEAL,
      title: tr(["Một cái tên", "A name"]),
      text: () => tr(["Một người già hấp hối dúi vào tay bạn tờ giấy cháy dở. Trên đó có cái tên bạn đã đi tìm từ khi biết nhớ.", "A dying old man presses a half-burnt note into your hand. On it is the name you have sought for as long as you can remember."]),
      choices: () => [{ label: tr(["Ghi nhớ cái tên đó", "Remember that name"]), lean: "trung", run: (n) => {
        const foe = root.VK2The?.grudge?.(n, acct, ["vụ diệt môn năm xưa", "the old massacre"]) ?? null;
        const mm = n.vk2.menh;
        if (foe) {
          foe.n = `${foe.n}`;
          foe.fate = true;
          mm.fate.foeId = foe.id;
          return tr([`Kẻ chủ mưu là ${foe.n}. Bây giờ bạn đã biết.`, `The mastermind is ${foe.n}. Now you know.`]);
        }
        mm.fate.foeId = -1;
        return tr(["Người trên giấy đã chết từ lâu, chỉ còn những kẻ thừa hưởng tội lỗi.", "The name belongs to someone long dead; only the heirs of the crime remain."]);
      } }],
    };
  }
  function endDef(c, acct) {
    const m = c.vk2?.menh;
    const id = m?.fate?.id;
    if (!id) return null;
    const finish = (n, how, text) => {
      n.vk2.menh.fate.end = how;
      return text;
    };
    if (id === "nghich") {
      const foe = root.VK2The?.npcOf?.(acct?.world, m.fate.foeId);
      const lv = foe ? C.combatLevel({ realm: foe.r, layer: 3 }) : C.combatLevel(c) - 3;
      return {
        id: EV_END, title: tr(FATES.nghich.n),
        text: () => tr([`Bạn đứng trước ${foe?.n ?? "hậu nhân của kẻ chủ mưu"}. Không còn ai ngăn được bạn, kể cả bạn.`, `You stand before ${foe?.n ?? "the mastermind's heir"}. No one can stop you now, not even yourself.`]),
        choices: () => [
          { label: tr(["Báo thù", "Take revenge"]), hint: tr(["giao đấu", "fight"]), lean: "ta", run: (n) => {
            const res = C.duel(n, lv, 1.1, (n.lookSeed ?? 0) + yearOf(n) * 19, 1);
            if (!res.win) {
              addStat(n, "sucKhoe", -30);
              n.vk2.menh.fate.retryAt = yearOf(n);
              return tr(["Bạn thua, và phải sống tiếp với điều đó. Sẽ còn một lần nữa.", "You lose, and must live with that. There will be another chance."]);
            }
            if (foe) root.VK2The.die(acct.world, foe, ["bị báo thù", "slain in revenge"]);
            note(n, acct, "sat", 15);
            root.VK2Phap?.wound?.(n, acct, "thu", -40);
            return finish(n, "bao_thu", tr(["Máu đã trả bằng máu. Lòng bạn trống hơn bạn tưởng.", "Blood is paid in blood. You feel emptier than you expected."]));
          } },
          { label: tr(["Hóa giải nhân quả", "Resolve the karma"]), hint: tr(["cần tâm cảnh từ 40", "needs state of mind 40"]), lean: "chinh", off: (c.stats?.tamCanh ?? 0) < 40, run: (n) => {
            if ((n.stats?.tamCanh ?? 0) < 40) return tr(["Bạn chưa làm nổi điều đó.", "You cannot do this yet."]);
            if (foe) foe.foe = 0;
            n.vk2.menh.ledger.nhan = 0;
            note(n, acct, "thien", 15);
            root.VK2Phap?.wound?.(n, acct, "thu", -40);
            addStat(n, "tamMa", -15);
            return finish(n, "hoa_giai", tr(["Bạn quay lưng bước đi. Lần đầu sau nhiều năm, bạn ngủ được.", "You turn and walk away. For the first time in years, you sleep."]));
          } },
        ],
      };
    }
    if (id === "sat_tinh") {
      return {
        id: EV_END, title: tr(FATES.sat_tinh.n),
        text: () => tr(["Một vị cao tăng nói có thể phá mệnh của bạn, đổi lại phần lớn sức mạnh.", "A high monk says he can break your fate, at the cost of most of your power."]),
        choices: () => [
          { label: tr(["Giữ sức mạnh, đi một mình", "Keep the power, walk alone"]), lean: "ta", run: (n) => finish(n, "co_doc", tr(["Bạn cảm ơn rồi đi tiếp. Con đường này vốn chỉ có một người.", "You thank him and walk on. This road was only ever for one."])) },
          { label: tr(["Phá mệnh", "Break the fate"]), hint: tr(["mất sức mạnh", "lose the power"]), lean: "chinh", run: (n) => {
            addStat(n, "tamCanh", 15);
            addStat(n, "tamMa", -15);
            n.vk2.menh.fxOff = true;
            return finish(n, "pha_menh", tr(["Có gì đó rời khỏi bạn. Bạn yếu đi, và lần đầu thấy nhẹ lòng.", "Something leaves you. You are weaker, and for the first time, at ease."]));
          } },
        ],
      };
    }
    if (id === "dan_su") {
      return {
        id: EV_END, title: tr(FATES.dan_su.n),
        text: () => tr(["Bạn đã hoàn thiện một đan phương đủ sức đổi vận cả một vùng.", "You have perfected a formula that could change a whole region's fortunes."]),
        choices: () => [
          { label: tr(["Truyền cho thiên hạ", "Share it with the world"]), lean: "chinh", run: (n) => {
            note(n, acct, "thien", 20);
            for (const s of Object.values(acct?.world?.sects ?? {})) s.store += 60;
            return finish(n, "truyen", tr(["Nhiều năm sau, người ta vẫn gọi tên đan phương theo tên bạn.", "Years later, the formula still bears your name."]));
          } },
          { label: tr(["Giữ làm của riêng", "Keep it to yourself"]), lean: "ta", run: (n) => {
            n.linhThach = (n.linhThach ?? 0) + 3000;
            n.pills = n.pills ?? {};
            n.pills.hoi_xuan = (n.pills.hoi_xuan ?? 0) + 3;
            return finish(n, "giu", tr(["Bạn giàu lên rất nhanh, và cũng cô độc rất nhanh.", "You grow rich very quickly, and lonely just as fast."]));
          } },
        ],
      };
    }
    return {
      id: EV_END, title: tr(FATES.luan_hoi.n),
      text: () => tr(["Mọi đời của bạn đứng thành một hàng dài sau lưng. Chúng đang chờ bạn quyết định.", "All your lives stand in a long line behind you, waiting for you to decide."]),
      choices: () => [
        { label: tr(["Hóa giải nhân quả", "Resolve the karma"]), lean: "chinh", run: (n) => {
          n.vk2.menh.ledger.nhan = 0;
          if (acct?.legacy) acct.legacy.debt = 0;
          root.VK2Phap?.wound?.(n, acct, "kiep", -40);
          return finish(n, "giai", tr(["Hàng người phía sau mờ dần. Từ nay bạn chỉ là bạn.", "The line behind you fades. From now on you are only yourself."]));
        } },
        { label: tr(["Mượn sức tiền kiếp", "Borrow past-life power"]), hint: tr(["mạnh lên, nợ thêm", "power, and more debt"]), lean: "ta", run: (n) => {
          note(n, acct, "cam", 15);
          n.vk2.menh.borrowed = true;
          for (const k of ["kiem_y", "hon_thuat"]) root.VK2Dao?.addMastery(n, k, 15);
          return finish(n, "muon", tr(["Một sức mạnh quen thuộc tràn vào tay bạn, kèm theo ký ức chẳng ai muốn nhớ.", "A familiar power fills your hands, along with memories no one would want."]));
        } },
      ],
    };
  }

  // ---------- Di sản ----------

  const ITEM_CAP = 30;
  const FINDS_PER_LIFE = 3; // Mỗi kiếp chỉ tìm lại tối đa bấy nhiêu món, cộng thêm theo pháp tắc Luân Hồi
  const LEGACY_GAP = 18;
  const legacyStore = (acct) => (acct.legacy = acct.legacy ?? { v: 1, items: [], debt: 0, nextId: 1 });
  function pushItem(lg, it) {
    lg.items.push({ id: lg.nextId++, ...it });
    while (lg.items.length > ITEM_CAP) {
      const i = lg.items.findIndex((x) => x.used);
      lg.items.splice(i >= 0 ? i : 0, 1);
    }
  }
  /** Ghi di sản khi chết. Động phủ có ba số phận: người thân kế thừa, thành di tích, hoặc bỏ hoang. */
  function onDeath(c, acct) {
    if (!acct) return {};
    const lg = legacyStore(acct);
    const life = c.lifeNo ?? 0;
    const m = c.vk2?.menh;
    const the = c.vk2?.the;
    const kh = c.vk2?.khi;
    const d = c.vk2?.dao;
    const w = acct.world;
    const heirs = [...(the?.kids ?? []), ...(the?.disciples ?? [])].some((id) => root.VK2The?.npcOf?.(w, id));
    let caveFate = null;
    if (kh?.cave) {
      const lv = kh.cave.lv ?? 1;
      const built = Object.values(kh.cave.b).reduce((s, n) => s + n, 0);
      caveFate = heirs ? "ke_thua" : built >= 2 || lv >= 2 ? "di_tich" : "bo_hoang";
      if (caveFate !== "bo_hoang") {
        const stored = (kh.cave.stored ?? []).map((id) => d?.arts?.find((a) => a.id === id)).filter(Boolean).map((a) => ({ name: a.name, recipe: a.recipe }));
        pushItem(lg, { k: "cave", life, fate: caveFate, site: kh.cave.site, built, stored, used: false });
      }
    }
    for (const art of d?.arts ?? []) {
      if (art.found) continue; // Món tìm lại không tự nhân bản qua đời sau
      const stored = kh?.cave?.stored?.includes(art.id);
      if (!stored) pushItem(lg, { k: "art", life, name: art.name, recipe: art.recipe, used: false });
    }
    if (c.enemy) pushItem(lg, { k: "foe", life, name: String(c.enemy).slice(0, 40), used: false });
    for (const p of d?.promises ?? []) if (!p.done) pushItem(lg, { k: "promise", life, t: p.t, from: p.from, used: false });
    const ledger = m ? ledgerOf(m) : {};
    lg.debt = clamp((lg.debt ?? 0) * 0.5 + (ledger.nhan ?? 0) * 0.5 + (ledger.sat ?? 0) * 0.2 + (ledger.cam ?? 0) * 0.2, 0, 50);
    return { menh: { ledger: Object.fromEntries(Object.entries(ledger).map(([k, x]) => [k, Math.round(x)])), fate: m?.fate ? { id: m.fate.id, end: m.fate.end } : null, caveFate, debt: Math.round(lg.debt) } };
  }
  const findsLeft = (c) => FINDS_PER_LIFE + (root.VK2Phap?.lawTier?.(c.vk2?.phap, "luan_hoi") ?? 0) - (c.vk2?.menh?.finds ?? 0);

  /** Thêm một bí thuật đã tìm lại: không vượt giới hạn sáng tạo của đời này, uy lực thấp hơn bản gốc, vẫn chiếm ô vận hành như bí thuật thường. */
  function recoverArt(c, acct, recipe, name, life) {
    const G = root.VK2Dao;
    const d = G?.ensure(c, acct);
    const r = G?.recipeDef.get(recipe);
    if (!d || !r || d.arts.some((a) => a.recipe === recipe)) {
      if (r) G.addMastery(c, r.a, 10);
      return false;
    }
    d.arts.push({ id: `${recipe}_f${c.lifeNo ?? 0}`, recipe, name: G.cleanName(name) || tr(r.n), power: 0.8, age: yearOf(c), life: c.lifeNo ?? 0, from: [r.a, r.b], el: r.el, found: life });
    G.addMastery(c, r.a, 8);
    G.addMastery(c, r.b, 8);
    return true;
  }

  // ---------- Sự kiện của Thiên Đạo ----------

  function ruleEvent(id, c, acct) {
    const base = (title, text, choices) => ({ id, title: tr(title), text: () => tr(text), choices });
    if (id === "vk2_menh_hunt") {
      return base(["Bị truy sát", "Hunted"], ["Người của chính đạo đã lần theo vết máu tới tận đây.", "The orthodox have followed the blood trail all the way here."], () => [
        { label: tr(["Đánh trả", "Fight back"]), hint: tr(["giao đấu", "fight"]), lean: "ta", run: (n) => {
          const res = C.duel(n, C.combatLevel(n) + 1, 1, (n.lookSeed ?? 0) + yearOf(n) * 23, 1);
          if (res.win) {
            note(n, acct, "sat", 5);
            return tr(["Bạn thoát được, thêm mấy mạng người trên tay.", "You get away, with a few more lives on your hands."]);
          }
          addStat(n, "sucKhoe", -25);
          n.vk2.menh.ledger.sat = Math.max(0, (n.vk2.menh.ledger.sat ?? 0) - 10);
          return tr(["Bạn bị đánh trọng thương, chỉ còn cái mạng.", "You are gravely wounded, with only your life left."]);
        } },
        { label: tr(["Sám hối, nộp của chuộc tội", "Repent and pay for your crimes"]), hint: tr(["mất một nửa linh thạch", "lose half your stones"]), lean: "chinh", run: (n) => {
          n.linhThach = Math.floor((n.linhThach ?? 0) / 2);
          n.vk2.menh.ledger.sat = Math.max(0, (n.vk2.menh.ledger.sat ?? 0) - 25);
          note(n, acct, "thien", 3);
          return tr(["Họ nhận của và để bạn đi, lần này.", "They take it and let you go, this time."]);
        } },
      ]);
    }
    if (id === "vk2_menh_envoy") {
      return base(["Sứ giả Thiên Đạo", "Heaven's Envoy"], ["Một người không có bóng đứng chờ bạn giữa đường. \"Ngươi đã làm những việc không nên làm.\"", "A figure with no shadow waits on the road. \"You have done what should not be done.\""], () => [
        { label: tr(["Từ bỏ cấm thuật", "Renounce the forbidden"]), hint: tr(["mất đạo niệm Ma Công", "lose Demonic Arts"]), lean: "chinh", run: (n) => {
          const mm = n.vk2.menh;
          mm.ledger.cam = 0;
          mm.ledger.su = Math.max(0, (mm.ledger.su ?? 0) - 15);
          if (n.vk2.dao) n.vk2.dao.mastery.ma_cong = Math.max(0, (n.vk2.dao.mastery.ma_cong ?? 0) - 25);
          return tr(["Người đó gật đầu rồi biến mất. Bạn chợt thấy bầu trời nhẹ đi.", "The figure nods and vanishes. The sky suddenly feels lighter."]);
        } },
        { label: tr(["Thách thức", "Defy it"]), hint: tr(["nghịch thiên tăng", "more defiance"]), lean: "ta", run: (n) => {
          note(n, acct, "nghich", 20);
          n.vk2.menh.ledger.cam = Math.max(0, (n.vk2.menh.ledger.cam ?? 0) - 10);
          return tr(["Bạn cười vào mặt trời. Trời không trả lời ngay.", "You laugh in Heaven's face. Heaven does not answer right away."]);
        } },
      ]);
    }
    if (id === "vk2_menh_debt") {
      const cost = 150 + (c.realm ?? 0) * 100;
      return base(["Người đòi nợ", "The Creditor"], ["Một người lạ biết rõ những món nợ bạn chưa trả, kể cả những món của đời trước.", "A stranger knows every debt you have left unpaid, even those from past lives."], () => [
        { label: tr([`Trả ${cost} linh thạch`, `Pay ${cost} stones`]), lean: "chinh", off: (c.linhThach ?? 0) < cost, run: (n) => {
          if ((n.linhThach ?? 0) < cost) return tr(["Bạn không trả nổi.", "You cannot pay."]);
          n.linhThach -= cost;
          n.vk2.menh.ledger.nhan = Math.max(0, (n.vk2.menh.ledger.nhan ?? 0) - 25);
          if (acct?.legacy) acct.legacy.debt = Math.max(0, (acct.legacy.debt ?? 0) - 10);
          return tr(["Người đó gạch đi một dòng trong sổ.", "The stranger crosses out a line in a ledger."]);
        } },
        { label: tr(["Làm việc thiện để trả", "Repay with good deeds"]), hint: tr(["mất vài năm", "costs a few years"]), lean: "trung", run: (n) => {
          n.age = (n.age ?? 0) + 3;
          n.vk2.menh.ledger.nhan = Math.max(0, (n.vk2.menh.ledger.nhan ?? 0) - 15);
          note(n, acct, "thien", 6);
          return tr(["Ba năm cứu người ở vùng đói kém. Không ai biết tên bạn.", "Three years saving lives in a famine, and no one learns your name."]);
        } },
        { label: tr(["Không trả", "Refuse"]), hint: tr(["tâm ma tăng", "inner demons rise"]), lean: "ta", run: (n) => {
          root.VK2Phap?.wound?.(n, acct, "kiep", 6);
          addStat(n, "tamMa", 6);
          return tr(["Người đó mỉm cười: \"Không sao. Đời sau cũng được.\"", "The stranger smiles. \"No matter. The next life will do.\""]);
        } },
      ]);
    }
    if (id === "vk2_menh_gift") {
      return base(["Cơ duyên", "A Fortune"], ["Một người bạn từng giúp năm xưa, hoặc con cháu họ, tìm tới báo đáp.", "Someone you once helped, or their descendants, comes to repay you."], () => [
        { label: tr(["Nhận chỉ đường tới một bí cảnh", "Accept a map to a secret realm"]), lean: "trung", run: (n) => {
          const d = n.vk2.dao;
          const G = root.VK2Dao;
          const ok = (G?.REALMS ?? []).filter((r) => (n.realm ?? 0) >= r.realm && !d.open.some((o) => o.id === r.id) && !r.needSect);
          n.vk2.menh.ledger.thien = Math.max(0, (n.vk2.menh.ledger.thien ?? 0) - 15);
          if (ok.length && d.open.length < 2) {
            d.open.push({ id: ok[yearOf(n) % ok.length].id, until: yearOf(n) + 8, seed: (n.lookSeed ?? 0) + yearOf(n) });
            return tr(["Bạn có trong tay một tấm bản đồ mới.", "You now hold a new map."]);
          }
          n.linhThach = (n.linhThach ?? 0) + 400;
          return tr(["Không có nơi nào hợp với bạn lúc này, người đó để lại ít linh thạch.", "No place suits you right now, so they leave some stones."]);
        } },
        { label: tr(["Nhận một lời chỉ giáo", "Accept a word of guidance"]), lean: "chinh", run: (n) => {
          const G = root.VK2Dao;
          const study = n.vk2.dao?.study;
          if (G && study) G.addMastery(n, study, 12);
          addStat(n, "tamCanh", 4);
          n.vk2.menh.ledger.thien = Math.max(0, (n.vk2.menh.ledger.thien ?? 0) - 15);
          return tr(["Một câu nói mở ra điều bạn vướng mắc đã lâu.", "A single sentence unties what had long held you up."]);
        } },
      ]);
    }
    if (id === "vk2_menh_ally") {
      return base(["Thế lực mang ơn", "A Grateful Power"], ["Một thế lực từng được bạn bảo vệ gửi người tới, mang theo quà và lời mời.", "A power you once protected sends word, with gifts and an invitation."], () => [
        { label: tr(["Nhận quà", "Accept the gift"]), lean: "trung", run: (n) => {
          n.linhThach = (n.linhThach ?? 0) + 500 + (n.realm ?? 0) * 200;
          n.vk2.menh.ledger.bao = Math.max(0, (n.vk2.menh.ledger.bao ?? 0) - 15);
          return tr(["Quà nặng hơn bạn nghĩ.", "The gift weighs more than you expected."]);
        } },
      ]);
    }
    return null;
  }

  // ---------- Sự kiện di sản ----------

  const EV_LEG = "vk2_menh_legacy";
  /** Một đời trước để lại gì thì đời này gặp nấy. Mọi món được đánh dấu đã dùng trước khi phát thưởng, nên không nhận hai lần. */
  function markSeen(acct, key) {
    const lg = legacyStore(acct);
    lg.seen = lg.seen ?? {};
    lg.seen[key] = 1;
    // Giữ gọn: chỉ nhớ những người còn trong thế giới
    const keys = Object.keys(lg.seen);
    if (keys.length > 60) for (const k of keys.slice(0, keys.length - 60)) delete lg.seen[k];
  }
  function pickLegacy(c, acct) {
    const lg = acct?.legacy;
    const w = acct?.world;
    const life = c.lifeNo ?? 0;
    const realm = c.realm ?? 0;
    const seen = (lg ?? legacyStore(acct)).seen ?? (legacyStore(acct).seen = {});
    const mine = (x) => x.life < life && !x.used;
    const cave = lg?.items.find((x) => mine(x) && x.k === "cave");
    if (cave && realm >= 1) return { kind: "cave", item: cave };
    const lost = lg?.items.find((x) => mine(x) && x.k === "art");
    if (lost && realm >= 2) return { kind: "art", item: lost };
    const elder = w?.npcs.find((n) => n.disc && n.disc < life && n.r >= 3 && !seen[`d${n.id}`]);
    if (elder) return { kind: "elder", npc: elder };
    const kin = w?.npcs.find((n) => n.kin && n.kin < life && !seen[`k${n.id}`]);
    if (kin && realm >= 1) return { kind: "kin", npc: kin };
    const sect = Object.values(w?.sects ?? {}).find((s) => s.own && s.own < life && !seen[`s${s.n}`]);
    if (sect) return { kind: "sect", sect };
    const foe = lg?.items.find((x) => mine(x) && x.k === "foe");
    if (foe && realm >= 1) return { kind: "foe", item: foe };
    const promise = lg?.items.find((x) => mine(x) && x.k === "promise");
    if (promise) return { kind: "promise", item: promise };
    return null;
  }
  function legacyDef(c, acct) {
    const m = c.vk2?.menh;
    const cur = m?.legacyEv;
    if (!cur) return null;
    const lg = acct?.legacy;
    const w = acct?.world;
    const base = (title, text, choices) => ({ id: EV_LEG, title: tr(title), text: () => tr(text), choices });
    const done = (n) => (n.vk2.menh.legacyEv = null);
    const found = (n) => (n.vk2.menh.finds = (n.vk2.menh.finds ?? 0) + 1);
    const item = cur.item ? lg?.items.find((x) => x.id === cur.item) : null;
    const npc = cur.npc ? root.VK2The?.npcOf?.(w, cur.npc) : null;
    const leave = (extra) => ({ label: tr(["Rời đi", "Leave"]), lean: "trung", run: (n) => {
      done(n);
      if (extra) extra(n);
      return tr(["Bạn đi tiếp. Có những điều không cần phải mở lại.", "You move on. Some things need not be reopened."]);
    } });
    const stale = () => base(["Dấu vết đã mất", "A trail gone cold"], ["Thứ bạn cảm thấy đã không còn ở đó.", "What you sensed is no longer there."], () => [leave()]);

    if (cur.kind === "cave") {
      if (!item) return stale();
      const site = root.VK2Khi?.SITES[item.site]?.n ?? ["Động phủ", "Abode"];
      const heir = item.fate === "ke_thua";
      const take = (n) => {
        const it = lg.items.find((x) => x.id === item.id);
        if (!it || it.used) return tr(["Bên trong không còn gì.", "Nothing remains inside."]);
        it.used = true;
        found(n);
        const stones = 100 * (1 + it.built) + (n.realm ?? 0) * 40;
        n.linhThach = (n.linhThach ?? 0) + stones;
        const learned = (it.stored ?? []).filter((s) => recoverArt(n, acct, s.recipe, s.name, it.life)).map((s) => s.name);
        return tr([`Tìm thấy ${stones} linh thạch${learned.length ? ` và bí thuật ${learned.join(", ")} do chính bạn viết ở một đời khác` : ""}.`, `You find ${stones} stones${learned.length ? ` and the art ${learned.join(", ")}, written by your own hand in another life` : ""}.`]);
      };
      if (heir) {
        return base(["Động phủ được giữ gìn", "A Tended Abode"], [`Một người lạ nhìn bạn rất lâu rồi mở cửa ${tr(site)}. Động phủ này đã được đời đời con cháu và đệ tử giữ gìn, theo lời dặn của chủ cũ ở kiếp ${item.life}.`, `A stranger looks at you for a long time, then opens ${tr(site)}. Generations have kept this abode, as its owner of life ${item.life} once asked.`], () => [
          { label: tr(["Bước vào", "Step inside"]), lean: "chinh", run: (n) => {
            done(n);
            return take(n);
          } },
          leave(),
        ]);
      }
      const lv = C.combatLevel({ realm: Math.max(1, c.realm ?? 1), layer: 1 }) + 1;
      return base(["Di tích", "A Ruin"], [`Một ${tr(site)} đổ nát nép trong núi. Bạn chưa từng tới đây, vậy mà biết rõ đường đi. Trận pháp cũ vẫn còn thức.`, `A ruined ${tr(site)} hides in the mountains. You have never been here, yet you know the way. The old arrays are still awake.`], () => [
        { label: tr(["Phá trận vào trong", "Break through the arrays"]), hint: tr(["giao đấu", "fight"]), lean: "trung", run: (n) => {
          const res = C.duel(n, lv, 1, (n.lookSeed ?? 0) + yearOf(n) * 29, 1);
          done(n);
          if (!res.win) {
            addStat(n, "sucKhoe", -20);
            return tr(["Trận pháp bạn dựng năm xưa, giờ đánh bạn văng ra ngoài.", "The arrays you raised long ago now throw you back out."]);
          }
          return take(n);
        } },
        leave(),
      ]);
    }
    if (cur.kind === "elder") {
      if (!npc) return stale();
      return base(["Đệ tử đời trước", "A Disciple of Another Life"], [`${npc.n}, nay là bậc ${tr(root.VK2The.REALM_N[npc.r])}${npc.s ? ` của ${npc.s}` : ""}, đứng sững khi thấy bạn. "Dáng đi này, ta chỉ thấy ở một người, đã mất từ lâu."`, `${npc.n}, now at ${tr(root.VK2The.REALM_N[npc.r])}${npc.s ? ` of ${npc.s}` : ""}, freezes at the sight of you. "That way of walking, I only knew in one person, long dead."`], () => [
        { label: tr(["Nhận chỉ giáo", "Accept their guidance"]), lean: "chinh", run: (n) => {
          const nn = root.VK2The.npcOf(acct.world, npc.id);
          markSeen(acct, `d${npc.id}`);
          done(n);
          found(n);
          root.VK2Dao?.addMastery(n, root.VK2The.PATH_CONCEPT[npc.pa], 10);
          const known = nn?.arts?.[0];
          const inLegacy = known && lg?.items.find((x) => x.k === "art" && x.name === known && !x.used);
          if (inLegacy) {
            inLegacy.used = true;
            recoverArt(n, acct, inLegacy.recipe, inLegacy.name, inLegacy.life);
            return tr([`${npc.n} dạy lại bạn ${known}, không biết đó vốn là do bạn truyền.`, `${npc.n} teaches you ${known}, not knowing you taught it first.`]);
          }
          return tr([`${npc.n} chỉ cho bạn vài điều, và không hiểu vì sao lại muốn giúp bạn.`, `${npc.n} shows you a few things, without knowing why they feel they should.`]);
        } },
        { label: tr(["Không nhận quen", "Pretend not to know"]), lean: "trung", run: (n) => {
          markSeen(acct, `d${npc.id}`);
          done(n);
          return tr(["Bạn cúi đầu đi qua, nghe tiếng thở dài sau lưng.", "You bow your head and pass, hearing a sigh behind you."]);
        } },
      ]);
    }
    if (cur.kind === "kin") {
      if (!npc) return stale();
      const cost = 150 + npc.r * 100;
      return base(["Hậu duệ", "A Descendant"], [`${npc.n} đang gặp khó. Bạn không hiểu vì sao gương mặt ấy lại quen đến thế. Họ là hậu duệ của bạn từ kiếp ${npc.kin}.`, `${npc.n} is in trouble. You cannot say why that face feels so familiar. They descend from you, from life ${npc.kin}.`], () => [
        { label: tr([`Giúp đỡ, tốn ${cost} linh thạch`, `Help them, for ${cost} stones`]), lean: "chinh", off: (c.linhThach ?? 0) < cost, run: (n) => {
          markSeen(acct, `k${npc.id}`);
          done(n);
          if ((n.linhThach ?? 0) < cost) return tr(["Bạn không đủ sức giúp.", "You cannot afford to help."]);
          n.linhThach -= cost;
          found(n);
          const nn = root.VK2The.npcOf(acct.world, npc.id);
          if (nn) {
            nn.p = Math.min(100, nn.p + 30);
            nn.aff = 40;
          }
          note(n, acct, "thien", 5);
          if (nn?.bl && n.vk2.dao && !n.vk2.dao.blood && (n.realm ?? 0) >= 1) {
            n.vk2.dao.blood = nn.bl;
            return tr(["Khi bàn tay hai người chạm nhau, huyết mạch cũ thức tỉnh trong bạn.", "As your hands touch, the old bloodline awakens in you."]);
          }
          return tr(["Bạn giúp họ qua cơn khốn khó, mà không nói tại sao.", "You help them through it, without saying why."]);
        } },
        { label: tr(["Đi qua", "Pass by"]), lean: "ta", run: (n) => {
          markSeen(acct, `k${npc.id}`);
          done(n);
          note(n, acct, "nhan", 3);
          return tr(["Bạn đi qua. Về sau bạn vẫn nghĩ về gương mặt đó.", "You walk on, and go on thinking of that face."]);
        } },
      ]);
    }
    if (cur.kind === "sect") {
      const s = w?.sects[cur.sect];
      if (!s) return stale();
      return base(["Tông môn bạn từng lập", "The Sect You Founded"], [`${s.n} giờ có ${s.terr} vùng đất. Trên vách đại điện khắc lời của tổ sư, và câu chữ ấy khiến bạn lạnh sống lưng: bạn đã từng nói đúng câu đó.`, `${s.n} now holds ${s.terr} lands. On the hall's wall are the founder's words, and they chill you: you once said exactly that.`], () => [
        ...(!c.sect && (c.realm ?? 0) >= 1 ? [{ label: tr(["Xin gia nhập", "Ask to join"]), lean: "chinh", run: (n) => {
          markSeen(acct, `s${s.n}`);
          done(n);
          found(n);
          root.VK2The.joinWorldSect(n, acct, s.n);
          n.sectRank = 1;
          return tr(["Chưởng môn nhìn bạn một lúc, rồi cho thẳng vào ngoại môn.", "The head looks at you a while, then lets you straight into the outer court."]);
        } }] : []),
        { label: tr(["Thắp một nén hương rồi đi", "Light incense and leave"]), lean: "trung", run: (n) => {
          markSeen(acct, `s${s.n}`);
          done(n);
          addStat(n, "tamCanh", 3);
          return tr(["Khói hương bay thẳng, không lay động.", "The smoke rises straight, unmoving."]);
        } },
      ]);
    }
    if (cur.kind === "art") {
      if (!item) return stale();
      return base(["Bí tịch cũ", "An Old Manual"], [`Trên sạp sách cũ có một cuốn tên là ${item.name}. Nét chữ này là của bạn, dù bạn chưa từng viết.`, `A secondhand stall sells a book called ${item.name}. The handwriting is yours, though you have never written it.`], () => [
        { label: tr(["Mua lại, 200 linh thạch", "Buy it, 200 stones"]), lean: "trung", off: (c.linhThach ?? 0) < 200, run: (n) => {
          done(n);
          const it = lg.items.find((x) => x.id === item.id);
          if (!it || it.used || (n.linhThach ?? 0) < 200) return tr(["Sạp đã dọn đi mất.", "The stall has gone."]);
          n.linhThach -= 200;
          it.used = true;
          found(n);
          recoverArt(n, acct, it.recipe, it.name, it.life);
          return tr([`Bạn tìm lại ${it.name}. Nó không còn mạnh như xưa, phải luyện lại từ đầu.`, `You recover ${it.name}. It is not as strong as it was, and must be trained again.`]);
        } },
        leave((n) => {
          const it = lg.items.find((x) => x.id === item.id);
          if (it) it.used = true;
        }),
      ]);
    }
    if (cur.kind === "foe") {
      if (!item) return stale();
      return base(["Kẻ thù chuyển sinh", "A Reborn Enemy"], [`Một người nhìn bạn đầy căm ghét mà không biết tại sao. Trong giấc mơ, bạn thấy họ là ${item.name} của đời trước.`, `Someone glares at you with hatred, not knowing why. In a dream, you see them as ${item.name} from your last life.`], () => [
        { label: tr(["Tránh mặt", "Avoid them"]), lean: "trung", run: (n) => {
          done(n);
          const it = lg.items.find((x) => x.id === item.id);
          if (it) it.used = true;
          const foe = root.VK2The?.grudge?.(n, acct, [item.name, item.name]);
          if (foe) foe.foeSince = yearOf(n) - 8;
          return tr(["Họ vẫn sẽ tìm đến. Nhân quả không biết mệt.", "They will still come. Karma does not tire."]);
        } },
        { label: tr(["Tới xin hóa giải, 300 linh thạch", "Ask for peace, 300 stones"]), lean: "chinh", off: (c.linhThach ?? 0) < 300, run: (n) => {
          done(n);
          const it = lg.items.find((x) => x.id === item.id);
          if (it) it.used = true;
          if ((n.linhThach ?? 0) < 300) return tr(["Bạn không đủ.", "You lack the funds."]);
          n.linhThach -= 300;
          note(n, acct, "thien", 6);
          n.vk2.menh.ledger.nhan = Math.max(0, (n.vk2.menh.ledger.nhan ?? 0) - 10);
          return tr(["Hai người uống với nhau một chén, không ai hiểu tại sao mình lại khóc.", "You share a cup, and neither understands why they weep."]);
        } },
      ]);
    }
    if (cur.kind === "promise") {
      if (!item) return stale();
      return base(["Lời hứa kiếp trước", "A Promise from Another Life"], [`Đêm nào bạn cũng mơ thấy một lời đã hứa: "${tr(item.t)}". Người nhận lời đã mất từ lâu.`, `Every night you dream of a promise: "${tr(item.t)}". The one who heard it died long ago.`], () => [
        { label: tr(["Thay đời trước làm trọn, 250 linh thạch", "Keep it, for 250 stones"]), lean: "chinh", off: (c.linhThach ?? 0) < 250, run: (n) => {
          done(n);
          const it = lg.items.find((x) => x.id === item.id);
          if (it) it.used = true;
          if ((n.linhThach ?? 0) < 250) return tr(["Bạn chưa đủ sức làm việc đó.", "You cannot do it yet."]);
          n.linhThach -= 250;
          found(n);
          note(n, acct, "thien", 8);
          addStat(n, "tamCanh", 5);
          return tr(["Bạn làm xong việc, và tối đó ngủ một giấc không mơ.", "You finish it, and that night you sleep without dreams."]);
        } },
        leave((n) => {
          const it = lg.items.find((x) => x.id === item.id);
          if (it) it.used = true;
          note(n, acct, "nhan", 6);
        }),
      ]);
    }
    return stale();
  }

  // ---------- Trạng thái, một năm ----------

  const QUESTS = (c) => [
    { id: "n_find", t: ["Tìm lại một di sản tiền kiếp", "Recover a past-life legacy"], goal: ["finds", 1], r: { phuc: 1 }, go: { tab: "karma" } },
    ...questsOf(c),
  ];

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (v.menh) return v.menh;
    v.menh = { v: 1, year: yearOf(c), ledger: {}, fate: null, rolled: false, ruleAt: {}, reacts: [], finds: 0, seen: {}, legacyAt: -99, legacyEv: null, kills: 0, seeded: false };
    return v.menh;
  }
  function fx(c) {
    const m = c.vk2?.menh;
    if (!m) return [];
    const out = [];
    const l = ledgerOf(m);
    for (const p of PASSIVE) if (p.when(l)) out.push(p.fx);
    const f = fateDef(c);
    if (f && !m.fxOff && f.fx && Object.keys(f.fx).length) out.push(f.fx);
    if (m.borrowed) out.push({ atk: 0.05 });
    return out;
  }
  const activePassives = (m) => PASSIVE.filter((p) => p.when(ledgerOf(m)));
  function onYear(c, acct) {
    const m = ensure(c, acct);
    const notes = [];
    const year = yearOf(c);
    if (year <= m.year) return notes;
    const delta = year - m.year;
    m.year = year;
    for (const k of Object.keys(m.ledger)) m.ledger[k] *= Math.pow(DECAY, delta);

    // Nhân quả đời trước đè lên đời này: Nghiệp của game gốc và nợ di sản đều được đọc, không bị đổi.
    if (!m.seeded && year >= 1) {
      m.seeded = true;
      const debt = acct?.legacy?.debt ?? 0;
      const nghiep = acct?.mv?.n ?? 0;
      if (debt > 0) note(c, acct, "nhan", debt * 0.5);
      const pain = Math.min(10, debt * 0.2 + Math.max(0, nghiep) * 0.1);
      if (pain > 0) root.VK2Phap?.seedKarma?.(c, acct, pain);
    }
    if (year < 6) return notes;

    // Thiên Đạo đọc từ dữ liệu thật của nhân vật
    const kills = c.vk2.c?.kills ?? 0;
    if (kills > m.kills) {
      note(c, acct, "sat", (kills - m.kills) * 0.15);
      m.kills = kills;
    }
    // daoTam là thước chính tà có sẵn của game: mọi lựa chọn trong sự kiện gốc đều đi qua đây.
    const dt = c.daoTam ?? 0;
    if (m.daoSeen !== undefined && dt !== m.daoSeen) note(c, acct, dt > m.daoSeen ? "thien" : "sat", Math.abs(dt - m.daoSeen) * 0.5);
    m.daoSeen = dt;
    if (c.vk2.can?.method === "cuong" && c.focus === "tu_luyen") note(c, acct, "nghich", 0.2);
    if ((c.realm ?? 0) > (m.realmSeen ?? 0)) {
      note(c, acct, "nghich", (c.realm - (m.realmSeen ?? 0)) * 1.5);
      m.realmSeen = c.realm;
    }
    if (c.enemy && !m.enemySeen) {
      m.enemySeen = true;
      note(c, acct, "nhan", 8);
    }
    const artMa = (c.vk2.dao?.active ?? []).some((id) => {
      const a = c.vk2.dao.arts.find((x) => x.id === id);
      return a && ["ma_hon", "u_minh"].includes(a.recipe);
    });
    if (artMa) note(c, acct, "cam", 0.3);

    if (year >= FATE_AGE) rollFate(c, acct);
    const f = fateDef(c);
    if (f && !m.fxOff && !m.fate.end) f.year?.(c, acct);
    return notes;
  }
  function nextEvent(c, acct) {
    const m = ensure(c, acct);
    const year = yearOf(c);
    if (year < 12) return null;
    // Thiên Mệnh: phần việc đến đúng lúc, xác định theo tiến trình
    if (m.fate && !m.fate.end) {
      if (m.fate.id === "nghich" && !m.fate.foeId && year >= 16) return revealDef(c, acct);
      if (fateReady(c, acct) && year - m.fate.retryAt >= 10) {
        m.fate.retryAt = year;
        return endDef(c, acct);
      }
    }
    // Quy tắc Thiên Đạo
    const l = ledgerOf(m);
    for (const r of RULES) {
      if (r.when(l) && year - (m.ruleAt[r.id] ?? -99) >= RULE_GAP) {
        m.ruleAt[r.id] = year;
        m.reacts.push({ y: year, id: r.id });
        if (m.reacts.length > 12) m.reacts.shift();
        return ruleEvent(r.ev, c, acct);
      }
    }
    // Di sản tiền kiếp
    const gap = m.fate?.id === "luan_hoi" ? LEGACY_GAP / 2 : LEGACY_GAP;
    if (acct && (c.lifeNo ?? 0) >= 1 && year >= 16 && findsLeft(c) > 0 && year - m.legacyAt >= gap) {
      const hit = pickLegacy(c, acct);
      if (hit && rnd(c, year, 603) < (m.fate?.id === "luan_hoi" ? 0.35 : 0.2)) {
        m.legacyAt = year;
        m.legacyEv = { kind: hit.kind, item: hit.item?.id, npc: hit.npc?.id, sect: hit.sect?.n };
        return legacyDef(c, acct);
      }
    }
    return null;
  }
  function eventDef(c, acct, id) {
    if (id === EV_REVEAL) return revealDef(c, acct);
    if (id === EV_END) return endDef(c, acct) ?? { id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] };
    if (id === EV_LEG) return legacyDef(c, acct) ?? { id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] };
    return ruleEvent(id, c, acct);
  }
  function onRealmCleared(c, acct, r) {
    note(c, acct, "nghich", r.danger >= 3 ? 2 : 0.5);
  }
  function summary(c) {
    const m = c.vk2?.menh;
    return m ? { ledger: ledgerOf(m), fate: m.fate, finds: m.finds } : null;
  }

  const api = {
    kind: "menh", QUESTS, LEDGER, LEDGER_MAX, DECAY, RULES, PASSIVE, RULE_GAP, FATES, FATE_CHANCE, FATE_AGE, FINDS_PER_LIFE, ITEM_CAP,
    ensure, metric, fx, onYear, nextEvent, eventDef, onDeath, onRealmCleared, summary, note, ledgerOf, setFate, fateDef, fateReady, rollFate, questsOf, endDef, revealDef, ruleEvent, pickLegacy, legacyDef, recoverArt, findsLeft, activePassives, legacyStore,
  };
  root.VK2Menh = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
