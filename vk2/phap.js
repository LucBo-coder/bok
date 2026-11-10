// Vạn Kiếp Luân Hồi 3.0, Giai đoạn 5 — tâm ma và chấp niệm, pháp tắc và Đại Đạo, đại sự kiện thế giới.
// Trạng thái nhân vật ở char.vk2.phap; đại sự kiện nằm trong acct.world.crisis vì nó thuộc về thế giới, không thuộc về một đời người.
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, hash32, rnd, yearOf, tr, addStat } = C.kit;

  // ---------- Tâm ma ----------

  /* Sổ vết thương: mỗi loại là một chấp niệm thật, ghi từ hành động của nhân vật. Tâm ma không gieo xúc xắc, mà nhìn vào đây. */
  const WOUNDS = {
    phan: { n: ["Phản bội", "Betrayal"], q: ["Người từng tin bạn đứng đó, không nói gì.", "The one who trusted you stands there, silent."] },
    sat: { n: ["Sát nghiệp", "Bloodshed"], q: ["Những gương mặt đã chết đứng thành hàng trước mặt bạn.", "The faces of the dead stand in rows before you."] },
    mat: { n: ["Mất mát", "Loss"], q: ["Người đã mất gọi tên bạn từ một căn phòng không có cửa.", "Someone lost calls your name from a room with no door."] },
    bai: { n: ["Thất bại đột phá", "Failed Breakthrough"], q: ["Bạn thấy lại khoảnh khắc linh lực vỡ tan, lần này không dừng lại.", "You see the moment your power shattered again, and this time it does not stop."] },
    thu: { n: ["Cừu hận", "Hatred"], q: ["Kẻ thù cười ở nơi bạn không với tới.", "Your enemy laughs just out of reach."] },
    hua: { n: ["Lời hứa chưa giữ", "Broken Promise"], q: ["Một giọng nói già nua nhắc lại đúng từng chữ bạn đã hứa.", "An old voice repeats, word for word, what you promised."] },
    kiep: { n: ["Nghiệp tiền kiếp", "Past-life Karma"], q: ["Một người mang gương mặt của bạn, từ một đời khác, chỉ tay vào bạn.", "Someone with your face, from another life, points at you."] },
  };
  const WOUND_MAX = 40;
  const DEMON_AT = 25; // Tổng vết thương từ mức này thì tâm ma có thể hiện hình
  const DEMON_GAP = 25;

  function wound(c, acct, kind, n) {
    if (!c.vk2 || !WOUNDS[kind]) return;
    const p = ensure(c, acct);
    p.wounds[kind] = clamp((p.wounds[kind] ?? 0) + n, 0, WOUND_MAX);
  }
  const totalWounds = (p) => Object.values(p.wounds).reduce((s, x) => s + x, 0);
  const worstWound = (p) => Object.entries(p.wounds).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  /**
   * Điểm đối mặt tính từ các con số người chơi nhìn thấy được: tâm cảnh, đạo tâm, đạo niệm Phật Pháp, Nhân Quả, trừ độ nặng của vết thương.
   * Không có xác suất, nên người chơi biết trước được mình có đủ sức hay chưa.
   */
  function faceScore(c, p, kind) {
    const dao = c.vk2?.dao?.mastery?.phat_phap ?? 0;
    return Math.round((c.stats?.tamCanh ?? 0) + (c.daoTam ?? 0) * 0.5 + dao * 0.2 + lawTier(p, "nhan_qua") * 5 - (p.wounds[kind] ?? 0) * 1.2 - (c.stats?.tamMa ?? 0) * 0.5);
  }
  const FACE_NEED = 40;

  const EV_DEMON = "vk2_phap_demon";
  function demonDef(c, acct) {
    const p = c.vk2?.phap;
    const kind = p?.evKind;
    const w = WOUNDS[kind];
    if (!w) return null;
    return {
      id: EV_DEMON,
      title: tr(["Tâm ma hiện hình", "Inner demon"]),
      text: () => tr([`${tr(w.q)} Chấp niệm: ${tr(w.n)}.`, `${tr(w.q)} Attachment: ${tr(w.n)}.`]),
      choices: (n) => {
        const score = faceScore(n, n.vk2.phap, kind);
        return [
          { label: tr(["Đối mặt", "Face it"]), hint: tr([`sức đối mặt ${score}/${FACE_NEED}`, `resolve ${score}/${FACE_NEED}`]), lean: "chinh", run: (x) => {
            const q = x.vk2.phap;
            if (faceScore(x, q, kind) >= FACE_NEED) {
              q.wounds[kind] = 0;
              q.faced = (q.faced ?? 0) + 1;
              addStat(x, "tamMa", -12);
              addStat(x, "tamCanh", 4);
              root.VK2Dao?.addMastery(x, "phat_phap", 3);
              return tr(["Bạn đứng yên, nhìn thẳng vào nó cho tới khi nó chỉ còn là một ký ức.", "You stand firm and look at it until it is only a memory."]);
            }
            q.wounds[kind] = clamp(q.wounds[kind] + 5, 0, WOUND_MAX);
            addStat(x, "tamMa", 8);
            addStat(x, "sucKhoe", -15);
            return tr(["Bạn chưa đủ sức. Nó tràn qua bạn, để lại một vết sâu hơn.", "You are not ready. It washes over you and leaves a deeper mark."]);
          } },
          { label: tr(["Phong ấn", "Seal it"]), hint: tr(["an toàn bây giờ, trả giá sau", "safe now, costly later"]), lean: "trung", run: (x) => {
            const q = x.vk2.phap;
            const moved = Math.floor((q.wounds[kind] ?? 0) * 0.5);
            q.wounds[kind] -= moved;
            q.sealed = clamp((q.sealed ?? 0) + moved, 0, 100);
            addStat(x, "tamMa", -4);
            return tr(["Bạn khóa nó lại. Yên ổn thật, nhưng thứ bị khóa vẫn nằm đó, chờ một lần đột phá.", "You lock it away. It is quiet, but what is locked still waits for a breakthrough."]);
          } },
          { label: tr(["Thuận theo", "Give in"]), hint: tr(["mạnh lên, sa vào tà", "power, at a price"]), lean: "ta", run: (x) => {
            const q = x.vk2.phap;
            q.gaveIn = (q.gaveIn ?? 0) + 1;
            q.wounds[kind] = Math.floor(q.wounds[kind] * 0.5);
            // Ma tu sống chung với tâm ma: cái giá nằm ở sổ nghiệp và tâm ma nhích dần, không phải bị nó quật ngã như khi đối mặt thất bại.
            addStat(x, "tamMa", 3);
            root.VK2Dao?.addMastery(x, "ma_cong", 10);
            root.VK2Menh?.note?.(x, acct, "cam", 3);
            return tr(["Bạn để nó ở lại trong người, và thấy sức mạnh dâng lên. Cảm giác đó không hề xấu, và đó mới là điều đáng sợ.", "You let it stay, and feel power rise. It does not feel bad, and that is the frightening part."]);
          } },
        ];
      },
    };
  }

  // ---------- Pháp tắc ----------

  const TIERS = [["Cảm ngộ", "Sensing"], ["Lĩnh ngộ", "Comprehension"], ["Đạo Ý", "Dao Intent"], ["Lĩnh Vực", "Domain"], ["Pháp Tắc", "Law"], ["Chứng Đạo", "Dao Proof"]];
  const TIER_XP = [100, 220, 420, 700, 1100, 1700];
  const LAW_REALM = 4; // Mở từ Nguyên Anh
  const LAW_MAX_ACTIVE = 2; // Tối đa hai pháp tắc cùng lúc được tu, buộc phải chọn
  /*
   * Mỗi pháp tắc đổi cơ chế chứ không chỉ cộng chỉ số. tier là bậc đã đạt: bậc 0 chưa có hiệu lực.
   * "Chứng Đạo" ở đây là đỉnh tiến trình pháp tắc, độc lập với kết cục Chứng Đạo của game gốc.
   */
  const LAWS = {
    kim: { n: ["Kim", "Metal"], d: ["Xuyên giáp, và pháp bảo hao mòn chậm hơn.", "Pierces armor, and treasures wear more slowly."], src: "kim_phap", duel: (t) => ({ pierce: 0.06 * t }) },
    moc: { n: ["Mộc", "Wood"], d: ["Hút máu trong trận, nội thương tự lành mỗi năm.", "Drains HP in fights, and inner wounds heal each year."], src: "moc_phap", duel: (t) => ({ leech: 0.04 * t }), year: (c, t) => { if (c.vk2.can) c.vk2.can.injury = Math.max(0, c.vk2.can.injury - t * 0.5); } },
    thuy: { n: ["Thủy", "Water"], d: ["Né đòn trong trận, tâm ma lắng dần.", "Dodge attacks, and inner demons settle."], src: "thuy_phap", duel: (t) => ({ dodge: 0.03 * t }), year: (c, t) => addStat(c, "tamMa", -t * 0.1) },
    hoa: { n: ["Hỏa", "Fire"], d: ["Mỗi đòn thiêu đốt thêm.", "Each strike burns further."], src: "hoa_phap", duel: (t) => ({ burn: 0.03 * t }) },
    tho: { n: ["Thổ", "Earth"], d: ["Vào trận có sẵn hộ thể.", "Enter fights with a shield."], src: "tho_phap", duel: (t) => ({ shield: 0.05 * t }) },
    kiem: { n: ["Kiếm Đạo", "Sword Dao"], d: ["Có cơ hội đánh thêm đòn mỗi lượt.", "A chance for an extra strike each turn."], src: "kiem_y", duel: (t) => ({ extra: 0.06 * t }) },
    sinh_tu: { n: ["Sinh Tử", "Life and Death"], d: ["Khi sức khỏe sắp cạn, tự hồi một lần mỗi 30 năm.", "When your health nears zero, recover once every 30 years."], src: "hon_thuat" },
    khong_gian: { n: ["Không Gian", "Space"], d: ["Từ Lĩnh Ngộ: luôn rút khỏi bí cảnh an toàn, và thấy thêm bí cảnh.", "From Comprehension: always leave secret realms safely, and find more of them."], src: "tran_dao" },
    thoi_gian: { n: ["Thời Gian", "Time"], d: ["Thọ nguyên tăng theo bậc, nhưng tốc độ tu giảm nhẹ.", "Lifespan grows with each tier, at a small cost to cultivation speed."], src: "dan_dao" },
    nhan_qua: { n: ["Nhân Quả", "Karma"], d: ["Đối mặt tâm ma dễ hơn, kẻ thù khó tìm thấy bạn hơn.", "Inner demons are easier to face, and enemies find you less often."], src: "phat_phap" },
    luan_hoi: { n: ["Luân Hồi", "Samsara"], d: ["Để lại nhiều di sản hơn cho kiếp sau.", "Leave more legacy to the next life."], src: "hon_thuat" },
    huy_diet: { n: ["Hủy Diệt", "Destruction"], d: ["Đánh mạnh hơn, nhưng thân thể tự tổn thương mỗi năm.", "Hit harder, but your body takes damage each year."], src: "ma_cong", duel: (t) => ({ extra: 0.04 * t, pierce: 0.04 * t }), year: (c, t) => { if (c.vk2.can) c.vk2.can.injury = clamp(c.vk2.can.injury + t * 0.3, 0, 100); } },
    sang_tao: { n: ["Sáng Tạo", "Creation"], d: ["Từ bậc Đạo Ý: có thêm một ô vận hành bí thuật.", "From Dao Intent: one more active art slot."], src: "kim_cuong" },
  };
  const lawTier = (p, id) => {
    const xp = p?.laws?.[id] ?? 0;
    let t = 0;
    let need = 0;
    for (const n of TIER_XP) {
      need += n;
      if (xp >= need) t++;
      else break;
    }
    return t;
  };
  const lawProgress = (p, id) => {
    const xp = p?.laws?.[id] ?? 0;
    let spent = 0;
    for (const n of TIER_XP) {
      if (xp < spent + n) return { cur: xp - spent, need: n };
      spent += n;
    }
    return { cur: 1, need: 1 };
  };
  function canLaw(c, acct, id) {
    const p = ensure(c, acct);
    const def = LAWS[id];
    const reasons = [];
    if (!def) return { ok: false, reasons };
    if ((c.realm ?? 0) < LAW_REALM) reasons.push(["Từ Nguyên Anh mới cảm được pháp tắc", "Laws open at Nascent Soul"]);
    if ((c.vk2.dao?.mastery?.[def.src] ?? 0) < 30) reasons.push([`Cần ${tr(root.VK2Dao?.CONCEPTS[def.src] ?? ["đạo niệm", "concept"])} từ Lĩnh ngộ`, `Needs ${tr(root.VK2Dao?.CONCEPTS[def.src] ?? ["concept", "concept"])} at Understood`]);
    if (p.lawOn.length >= LAW_MAX_ACTIVE && !p.lawOn.includes(id)) reasons.push([`Chỉ tu được ${LAW_MAX_ACTIVE} pháp tắc cùng lúc`, `You can pursue only ${LAW_MAX_ACTIVE} laws at once`]);
    return { ok: !reasons.length, reasons };
  }
  function toggleLaw(c, acct, id) {
    const p = ensure(c, acct);
    if (p.lawOn.includes(id)) {
      p.lawOn = p.lawOn.filter((x) => x !== id);
      return true;
    }
    if (!canLaw(c, acct, id).ok) return false;
    p.lawOn.push(id);
    return true;
  }
  /** Cơ chế theo pháp tắc, các hệ thống khác hỏi qua đây. */
  function lawMech(c, name) {
    const p = c.vk2?.phap;
    if (!p) return false;
    if (name === "khongGian") return lawTier(p, "khong_gian") >= 2;
    return false;
  }
  /** Không Gian làm bí cảnh dễ tìm hơn, ghi ở tài khoản để hàm của Giai đoạn 2 đọc được. Có đại sự kiện thì cũng tăng. */
  function realmChance(acct) {
    const crisis = acct?.world?.crisis;
    return crisis?.id === "bi_canh" ? 0.02 : 0;
  }

  // ---------- Đại sự kiện ----------

  /*
   * Mỗi đại sự kiện kéo dài nhiều năm, có hiệu ứng trong lúc diễn ra, và một thanh tiến trình tốt/xấu.
   * Thế giới tự đẩy nó theo một hướng; đóng góp của người chơi có thể đảo ngược. Kết cục để lại dấu vết thật lên thế giới.
   */
  const CRISES = {
    ma_tong: { n: ["Ma Tông Phục Sinh", "Demon Sect Reborn"], d: ["Một ma tông cổ trỗi dậy, các tông chính đạo mất người.", "An ancient demon sect rises, and orthodox sects lose people."], years: 30, drift: -1, fx: { tamMa: 0.15 }, join: "chinh", good: ["Ma tông bị đánh tan, chính đạo thở phào.", "The demon sect is crushed, and the orthodox breathe again."], bad: ["Ma tông chiếm lấy nửa thiên hạ.", "The demon sect takes half the world."], apply: (w, ok) => { for (const s of Object.values(w.sects)) if ((s.lean === "ta") !== !ok && s.terr > 1) s.terr -= 1; } },
    linh_kiet: { n: ["Linh Khí Suy Kiệt", "Qi Depletion"], d: ["Linh khí mỏng đi, ai cũng tu chậm lại.", "Spiritual qi thins, and everyone cultivates more slowly."], years: 40, drift: -0.5, cult: -0.12, join: "trung", good: ["Linh mạch hồi sinh, thiên địa tràn đầy trở lại.", "The veins revive, and the world brims once more."], bad: ["Nhiều linh mạch đã cạn hẳn.", "Many veins have run dry for good."], apply: (w, ok) => { for (const s of Object.values(w.sects)) s.vein = clamp(s.vein + (ok ? 1 : -1), 1, 9); } },
    thien_tai: { n: ["Thiên Tài Xuất Thế", "A Prodigy Appears"], d: ["Một thiên tài trăm năm hiếm gặp xuất hiện, thiên hạ tranh nhau chiêu mộ.", "A once-in-a-century prodigy appears, and every sect wants them."], years: 20, drift: 0, join: "trung", good: ["Thiên tài kết giao với những người đã giúp mình.", "The prodigy befriends those who helped."], bad: ["Thiên tài trở thành đối thủ của bạn.", "The prodigy becomes your rival."], apply: (w, ok, H) => { if (!H) return; const n = H.addNpc(w, { n: "Lăng Vô Song", ro: 1.8 }); n.ta = "co"; n.b = w.year - 18; n.r = 3; n.lo = 1500; if (ok) n.aff = 40; else { n.pe = "cuong"; n.foe = w.life ?? 1; n.foeSince = -999; } } },
    yeu_toc: { n: ["Yêu Tộc Xâm Lấn", "Beast Invasion"], d: ["Yêu tộc tràn xuống: trừ yêu rơi thêm yêu đan, nhưng các tông có thể mất đất.", "Beasts swarm down: hunts yield more beast cores, but sects may lose land."], years: 25, drift: -1, kills: 2, join: "chinh", good: ["Yêu tộc rút về rừng sâu.", "The beasts retreat to the deep forest."], bad: ["Nhiều vùng đất thành lãnh địa yêu tộc.", "Many lands become beast territory."], apply: (w, ok) => { for (const s of Object.values(w.sects)) if (!ok && s.terr > 1) s.terr -= 1; } },
    dai_chien: { n: ["Tông Môn Đại Chiến", "The Great Sect War"], d: ["Mọi tông môn cuốn vào một cuộc chiến lớn.", "All sects are drawn into a great war."], years: 18, drift: -0.5, join: "ta", good: ["Một hòa ước được ký, thiên hạ yên một thời gian.", "A treaty is signed, and peace holds for a time."], bad: ["Chiến tranh kết thúc khi nhiều tông đã thành tro.", "The war ends only when many sects are ash."], apply: (w, ok) => { for (const s of Object.values(w.sects)) { s.store = Math.floor(s.store * (ok ? 0.8 : 0.4)); for (const k of Object.keys(s.rel)) s.rel[k] = ok ? 10 : -30; } } },
    bi_canh: { n: ["Thượng Cổ Bí Cảnh Mở Cửa", "An Ancient Realm Opens"], d: ["Khe nứt thượng cổ mở ra, bí cảnh hiện nhiều hơn hẳn.", "Ancient rifts open, and secret realms appear far more often."], years: 15, drift: 0.5, join: "trung", good: ["Bạn và đồng đạo chia nhau cơ duyên, nhiều người đột phá.", "You and others share the fortune, and many break through."], bad: ["Kẻ mạnh vơ hết, kẻ yếu bỏ mạng trong khe nứt.", "The strong take everything, and the weak die in the rifts."], apply: (w, ok) => { for (const n of w.npcs) if (ok) n.p = Math.min(100, n.p + 25); } },
    tien_mon: { n: ["Tiên Môn Giáng Thế", "An Immortal Gate Descends"], d: ["Một tiên môn từ thượng giới hạ xuống, chọn đệ tử và đòi cống phẩm.", "A gate from the upper realm descends, choosing disciples and demanding tribute."], years: 25, drift: -0.5, join: "trung", good: ["Tiên môn rút đi, để lại truyền thừa.", "The gate withdraws and leaves its teachings behind."], bad: ["Thiên hạ thành thuộc địa của tiên môn trong một thế hệ.", "The world is the gate's vassal for a generation."], apply: (w, ok) => { for (const s of Object.values(w.sects)) s.store = Math.floor(s.store * (ok ? 1.2 : 0.6)); } },
    di_bien: { n: ["Thiên Địa Dị Biến", "Heaven's Upheaval"], d: ["Trời đất đổi khác, đột phá khó hơn với mọi người.", "The world changes, and breakthroughs grow harder for everyone."], years: 20, drift: 0, brk: -0.02, join: "trung", good: ["Dị biến lắng lại, để lại thiên địa mới.", "The upheaval settles, leaving a new world."], bad: ["Dị biến cướp đi nhiều sinh mạng trước khi dứt.", "The upheaval takes many lives before it ends."], apply: (w, ok) => { if (!ok) for (const n of [...w.npcs].slice(0, 5)) n.p = 0; } },
  };
  const CRISIS_GAP = 70; // Giữa hai đại sự kiện có khoảng thở

  function crisisStep(w) {
    const hist = w.crisisAt ?? -CRISIS_GAP;
    const cr = w.crisis;
    if (!cr) {
      if (w.year - hist < CRISIS_GAP) return;
      const x = hash32(w.seed + Math.imul(w.year, 31)) / 4294967296;
      if (x > 0.05) return;
      const ids = Object.keys(CRISES);
      const id = ids[hash32(w.seed + w.year * 7) % ids.length];
      w.crisis = { id, at: w.year, until: w.year + CRISES[id].years, score: 50, by: 0 };
      w.log.push({ y: w.year, t: [`Đại biến: ${CRISES[id].n[0]}.`, `Upheaval: ${CRISES[id].n[1]}.`] });
      if (w.log.length > 40) w.log.shift();
      return;
    }
    cr.score = clamp(cr.score + CRISES[cr.id].drift * 0.5, 0, 100);
    if (w.year >= cr.until) endCrisis(w);
  }
  function endCrisis(w) {
    const cr = w.crisis;
    const def = CRISES[cr.id];
    const ok = cr.score >= 50;
    def.apply?.(w, ok, root.VK2The);
    w.crisis = null;
    w.crisisAt = w.year;
    w.crisisPast = [...(w.crisisPast ?? []), { id: cr.id, ok, y: w.year, by: cr.by }].slice(-8);
    w.log.push({ y: w.year, t: ok ? def.good : def.bad });
    if (w.log.length > 40) w.log.shift();
  }
  const EV_CRISIS = "vk2_phap_crisis";
  function crisisDef(c, acct) {
    const cr = acct?.world?.crisis;
    if (!cr) return null;
    const def = CRISES[cr.id];
    const cost = 300 + (c.realm ?? 0) * 200;
    const give = (n, x) => {
      const q = acct.world.crisis;
      if (!q) return;
      q.score = clamp(q.score + x, 0, 100);
      q.by = (q.by ?? 0) + Math.max(0, x);
      n.vk2.phap.crisisDone = (n.vk2.phap.crisisDone ?? 0) + (x > 0 ? 1 : 0);
    };
    return {
      id: EV_CRISIS,
      title: tr(def.n),
      text: () => tr([`${tr(def.d)} Thế cuộc hiện tại: ${Math.round(cr.score)}/100.`, `${tr(def.d)} State of affairs: ${Math.round(cr.score)}/100.`]),
      choices: () => [
        { label: tr(["Xông pha trận đầu", "Take the front line"]), hint: tr(["giao đấu, góp nhiều nhất", "fight, helps the most"]), lean: "chinh", run: (n) => {
          const res = C.duel(n, C.combatLevel(n), 1.1, (n.lookSeed ?? 0) + yearOf(n) * 17, 1);
          if (res.win) {
            give(n, 10 + (n.realm ?? 0));
            root.VK2Menh?.note?.(n, acct, "thien", 3);
            return tr(["Bạn đứng ở nơi nguy hiểm nhất và không lùi. Nhiều người nhớ tên bạn.", "You stand at the most dangerous place and do not retreat. Many remember your name."]);
          }
          give(n, 3);
          addStat(n, "sucKhoe", -25);
          return tr(["Bạn ngã xuống rồi được kéo về. Vẫn có người sống nhờ bạn.", "You fall and are dragged back. Still, some live because of you."]);
        } },
        { label: tr([`Góp ${cost} linh thạch`, `Give ${cost} stones`]), hint: tr(["giúp ở hậu phương", "help from the rear"]), lean: "trung", off: (c.linhThach ?? 0) < cost, run: (n) => {
          if ((n.linhThach ?? 0) < cost) return tr(["Bạn không có đủ.", "You lack the funds."]);
          n.linhThach -= cost;
          give(n, 5);
          return tr(["Lương thảo và đan dược tới được nơi cần.", "Supplies and pills reach those in need."]);
        } },
        { label: tr(["Lợi dụng thời loạn", "Profit from the chaos"]), hint: tr(["được của, tệ cho thiên hạ", "wealth now, worse for everyone"]), lean: "ta", run: (n) => {
          const stones = 200 + (n.realm ?? 0) * 150;
          n.linhThach = (n.linhThach ?? 0) + stones;
          const q = acct.world.crisis;
          if (q) q.score = clamp(q.score - 8, 0, 100);
          root.VK2Menh?.note?.(n, acct, "sat", 2);
          return tr([`Bạn vét được ${stones} linh thạch trong khi người khác đổ máu.`, `You collect ${stones} stones while others bleed.`]);
        } },
      ],
    };
  }
  function crisisEffects(acct) {
    const cr = acct?.world?.crisis;
    return cr ? CRISES[cr.id] : null;
  }

  // ---------- Trạng thái ----------

  const QUESTS = [
    { id: "p_face", t: ["Vượt qua một lần tâm ma", "Overcome an inner demon"], goal: ["demon_faced", 1], r: { stat: { tamCanh: 3 } }, go: { tab: "heart" } },
    { id: "p_law", t: ["Bắt đầu tu một pháp tắc", "Begin pursuing a law"], goal: ["law_on", 1], r: { stones: 500 }, go: { tab: "law" } },
    { id: "p_tier2", after: "p_law", t: ["Lĩnh ngộ một pháp tắc", "Comprehend a law"], goal: ["law_tier", 2], r: { stat: { ngoTinh: 3 } }, go: { tab: "law" } },
    { id: "p_crisis", t: ["Góp sức trong một đại sự kiện", "Help during a great upheaval"], goal: ["crisis_done", 1], r: { stones: 300 }, go: { tab: "crisis" } },
  ];

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (v.phap) return v.phap;
    v.phap = { v: 1, year: yearOf(c), wounds: {}, laws: {}, lawOn: [], demonAt: -99, evKind: null, faced: 0, sealed: 0, gaveIn: 0, lifeSaveAt: -99, crisisDone: 0, crisisSeen: {}, seenFail: "" };
    if (yearOf(c) >= 1) for (const q of QUESTS) if (C.metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
    return v.phap;
  }
  function metric(name, c) {
    const p = c.vk2?.phap;
    switch (name) {
      case "demon_faced": return p?.faced ?? 0;
      case "law_on": return p?.lawOn.length ? 1 : Object.keys(p?.laws ?? {}).length ? 1 : 0;
      case "law_tier": return p ? Math.max(0, ...Object.keys(p.laws).map((id) => lawTier(p, id))) : 0;
      case "crisis_done": return p?.crisisDone ?? 0;
      default: return undefined;
    }
  }

  // ---------- Hiệu ứng ----------

  function fx(c) {
    const p = c.vk2?.phap;
    if (!p) return [];
    const out = [];
    if (p.gaveIn) out.push({ atk: Math.min(0.1, p.gaveIn * 0.03) });
    // Vết thương phong ấn là một khoản nợ: đột phá càng về sau càng khó
    if (p.sealed) out.push({ brk: -Math.min(0.1, p.sealed * 0.002) });
    const t = lawTier(p, "thoi_gian");
    if (t) out.push({ cult: -0.015 * t });
    const s = p.crisisCult;
    if (s) out.push({ cult: s });
    if (p.crisisBrk) out.push({ brk: p.crisisBrk });
    return out;
  }
  function duel(c) {
    const p = c.vk2?.phap;
    const out = {};
    if (!p) return out;
    for (const id of Object.keys(p.laws)) {
      const t = lawTier(p, id);
      if (!t || !LAWS[id].duel) continue;
      for (const [k, x] of Object.entries(LAWS[id].duel(t))) out[k] = (out[k] ?? 0) + x;
    }
    return out;
  }
  /** Pháp tắc Sáng Tạo thêm một ô vận hành bí thuật từ bậc Đạo Ý. */
  const extraArtSlots = (c) => (lawTier(c.vk2?.phap, "sang_tao") >= 3 ? 1 : 0);

  // ---------- Một năm ----------

  function onYear(c, acct) {
    const p = ensure(c, acct);
    const notes = [];
    const year = yearOf(c);
    if (year <= p.year) return notes;
    p.year = year;
    const w = acct?.world;
    if (w) {
      crisisStep(w);
      const def = crisisEffects(acct);
      p.crisisCult = def?.cult ?? 0;
      p.crisisBrk = def?.brk ?? 0;
      if (def?.fx?.tamMa) addStat(c, "tamMa", def.fx.tamMa);
    }
    if (year < 6) return notes;

    // Sổ vết thương lấy từ dữ liệu gốc mà không cần vá thêm vào sự kiện gốc.
    const f = c.breakFail ? `${c.breakFail.r}:${c.breakFail.n}` : "";
    if (f && f !== p.seenFail) wound(c, acct, "bai", 4);
    p.seenFail = f;
    if (c.partner !== p.seenPartner) {
      if (p.seenPartner && !c.partner) {
        wound(c, acct, "mat", 10);
        notes.push({ kind: "bad", t: ["Người bên cạnh bạn đã không còn. Vết thương này sẽ theo bạn lâu dài.", "The one beside you is gone. This wound will stay with you a long time."] });
      }
      p.seenPartner = c.partner ?? null;
    }
    if (c.enemy && !p.seenEnemy) {
      p.seenEnemy = true;
      wound(c, acct, "thu", 6);
    }
    if (root.VK2Dao && c.vk2.dao?.promises?.some((x) => !x.done && year - x.at > 40)) wound(c, acct, "hua", 0.2);
    if ((c.stats?.tamMa ?? 0) >= 60 && year % 5 === 0) wound(c, acct, "kiep", 1);

    // Tu pháp tắc: tiến theo năm tu, nhanh hơn khi đạo niệm nguồn cao. Mỗi năm chia đều cho các pháp tắc đang tu.
    if (p.lawOn.length && (c.focus === "tu_luyen" || c.vk2.can?.closed)) {
      const share = 1 / p.lawOn.length;
      for (const id of p.lawOn) {
        const src = c.vk2.dao?.mastery?.[LAWS[id].src] ?? 0;
        const before = lawTier(p, id);
        p.laws[id] = (p.laws[id] ?? 0) + (1 + src / 50) * share;
        const after = lawTier(p, id);
        if (after > before) notes.push({ kind: "big", t: [`Pháp tắc ${LAWS[id].n[0]} đạt bậc ${TIERS[after - 1][0]}.`, `The law of ${LAWS[id].n[1]} reaches ${TIERS[after - 1][1]}.`] });
      }
    }
    // Cơ chế năm của pháp tắc
    for (const id of Object.keys(p.laws)) {
      const t = lawTier(p, id);
      if (t) LAWS[id].year?.(c, t);
    }
    const time = lawTier(p, "thoi_gian");
    if (time > (p.timeApplied ?? 0)) {
      const add = (time - (p.timeApplied ?? 0)) * 30;
      c.lifespan = (c.lifespan ?? 0) + add;
      c.lifeExtra = (c.lifeExtra ?? 0) + add; // Game kẹp thọ mỗi năm, chỉ phần trong lifeExtra mới còn lại
      p.timeApplied = time;
    }
    // Sinh Tử: cứu một lần, có thời gian hồi. Không cứu được cái chết do game phán quyết, chỉ giữ sức khỏe trước khi tới đó.
    const life = lawTier(p, "sinh_tu");
    if (life && (c.stats?.sucKhoe ?? 100) <= 10 && year - p.lifeSaveAt >= 30) {
      p.lifeSaveAt = year;
      addStat(c, "sucKhoe", 20 + life * 8);
      notes.push({ kind: "big", t: ["Pháp tắc Sinh Tử kéo bạn từ bờ vực trở về.", "The law of Life and Death pulls you back from the brink."] });
    }
    // Vết thương phong ấn có thể bật lại khi đột phá thất bại
    if (f && f !== p.seenSealFail && p.sealed >= 10) {
      addStat(c, "tamMa", Math.min(15, p.sealed * 0.3));
      p.sealed = Math.floor(p.sealed * 0.6);
      notes.push({ kind: "bad", t: ["Thứ bạn phong ấn trỗi dậy đúng lúc bạn yếu nhất.", "What you sealed away rises at your weakest moment."] });
    }
    p.seenSealFail = f;
    return notes;
  }
  function nextEvent(c, acct) {
    const p = ensure(c, acct);
    const year = yearOf(c);
    const cr = acct?.world?.crisis;
    if (cr && !p.crisisSeen[cr.at] && (c.realm ?? 0) >= 2 && year >= 16) {
      p.crisisSeen[cr.at] = year;
      return crisisDef(c, acct);
    }
    if (year - p.demonAt >= DEMON_GAP && totalWounds(p) >= DEMON_AT) {
      p.demonAt = year;
      p.evKind = worstWound(p);
      return demonDef(c, acct);
    }
    return null;
  }
  const fallback = (id) => ({ id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] });
  function eventDef(c, acct, id) {
    if (id === EV_DEMON) return demonDef(c, acct) ?? fallback(id);
    if (id === EV_CRISIS) return crisisDef(c, acct) ?? fallback(id);
    return null;
  }
  function onBump(c, acct, name, n) {
    if (name === "kills") {
      const def = crisisEffects(acct);
      if (def?.kills && root.VK2Khi && rnd(c, yearOf(c), 500 + (c.vk2.c?.kills ?? 0)) < 0.1) root.VK2Khi.addMat(c, acct, "yeu_dan", 1);
    }
    // Giết nhiều thì sổ sát nghiệp đầy dần, chậm và có trần chung.
    if (name === "kills" && (c.vk2.c?.kills ?? 0) % 25 === 0) wound(c, acct, "sat", 1);
  }
  /** Kế thừa nghiệp tiền kiếp: đọc từ meta thật của game và lịch sử, cộng một lần lúc đầu đời. */
  function seedKarma(c, acct, karma) {
    if (karma > 0) wound(c, acct, "kiep", Math.min(WOUND_MAX, karma));
  }
  function summary(c) {
    const p = c.vk2?.phap;
    if (!p) return null;
    return { wounds: Object.fromEntries(Object.entries(p.wounds).filter(([, x]) => x > 0)), laws: Object.fromEntries(Object.keys(p.laws).map((id) => [id, lawTier(p, id)])), faced: p.faced, sealed: p.sealed, gaveIn: p.gaveIn };
  }
  function onDeath(c) {
    const s = summary(c);
    return s ? { phap: s } : {};
  }

  const api = {
    kind: "phap", QUESTS, WOUNDS, WOUND_MAX, DEMON_AT, DEMON_GAP, FACE_NEED, TIERS, TIER_XP, LAW_REALM, LAW_MAX_ACTIVE, LAWS, CRISES, CRISIS_GAP,
    ensure, metric, fx, duel, onYear, nextEvent, eventDef, onBump, onDeath, summary, wound, totalWounds, worstWound, faceScore, demonDef, lawTier, lawProgress, canLaw, toggleLaw, lawMech, realmChance, extraArtSlots, crisisStep, endCrisis, crisisDef, crisisEffects, seedKarma,
  };
  root.VK2Phap = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
