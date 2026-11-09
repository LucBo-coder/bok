// Vạn Kiếp Luân Hồi 3.0 — Hệ thống sự kiện động. Mở rộng hàng đợi kỳ ngộ 4 lựa chọn của game, không phải hệ thống riêng:
// mọi sự kiện ở đây đi qua nD/n0 của game như một kỳ ngộ thường, chỉ khác ở chỗ được viết bằng dữ liệu.
//
// Registry    define, defineChain: định nghĩa có id ổn định và phiên bản, bị kiểm tra ngay khi nạp
// Scheduler   eligible, pick: điều kiện, trọng số có giới hạn, thời gian hồi, loại trừ
// Resolver    apply, resolve: hậu quả, áp dụng đúng một lần
// Chain       worldStep: chuỗi nằm trong thế giới, tự diễn biến kể cả khi người chơi không có mặt hay đã chết
// NPC         arcStep: NPC đi theo mạch đời của chính họ
// Karma       trace: dấu vết xuyên kiếp, không chứa tài nguyên
// Bridge      onDeath: phân loại kết thúc theo kiếp, lịch sử thế giới, ảnh hưởng kiếp sau
// Journal     journal: nhật ký và lịch sử lựa chọn, gồm cả kỳ ngộ gốc
//
// Trạng thái: char.vk2.su (theo kiếp), acct.ev (dấu vết, theo tài khoản), acct.world.chains (trong thế giới).
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const { clamp, hash32, rnd, yearOf, tr, addStat } = C.kit;

  const VERSION = 1;
  const GROUPS = {
    ky_ngo: ["Kỳ ngộ", "Encounter"], tu_luyen: ["Tu luyện", "Cultivation"], tong_mon: ["Tông môn", "Sect"], bi_canh: ["Bí cảnh", "Secret Realm"],
    nhan_duyen: ["Nhân duyên", "Bonds"], thien_tuong: ["Thiên tượng", "Omens"], kinh_te: ["Phường thị", "Market"], linh_thu: ["Linh thú", "Beasts"],
    thien_kiep: ["Thiên kiếp", "Tribulation"], the_gioi: ["Đại sự thế giới", "World Affairs"], nhan_qua: ["Nhân quả", "Karma"], thien_menh: ["Thiên Mệnh", "Destiny"],
  };
  const TIERS = [["Thường", "Common"], ["Hiếm", "Rare"], ["Sử Thi", "Epic"], ["Truyền Thuyết", "Legendary"], ["Thiên Mệnh", "Destined"]];
  const TIER_MARK = ["·", "✦", "✦✦", "✦✦✦", "☯"];
  const TIER_WEIGHT = [100, 40, 14, 5, 2];
  const TIER_LIFE_CAP = [99, 12, 5, 2, 1]; // Mỗi kiếp chỉ có từng ấy sự kiện của mỗi cấp, kể cả khi đủ điều kiện
  const FIRE_CHANCE = 0.42; // Năm đã đủ khoảng nghỉ vẫn có thể yên ả
  const JOURNAL_CAP = 60;
  const TRACE_CAP = 40;
  const HIST_CAP = 80;
  const ACTIVE_CHAINS = 3;
  const CHAIN_GAP = 18; // Số năm tối thiểu giữa hai lần mở chuỗi
  const CHAIN_REPEAT = 300;
  const TRACE_FADE = 0.72; // Mỗi lần luân hồi, dấu vết phai đi
  const TRACE_MIN = 8;
  const SOUP_FADE = 0.5; // Uống canh Mạnh Bà thì dấu vết phai nhanh gấp đôi
  // Thưởng linh thạch theo cảnh giới, và giảm dần khi đã nhận nhiều trong một kiếp, nên không thể cày qua sự kiện.
  const SCALE = [1, 2, 5, 14, 40, 110, 280, 650, 1400, 3000, 6000, 12000, 24000];
  const LIFE_GAIN = (realm) => 30 * (SCALE[realm] ?? 1);

  // ---------- Registry ----------

  const events = new Map();
  const chains = new Map();
  const arcs = new Map();
  const STATS = new Set(["tamCanh", "tamMa", "khiVan", "ngoTinh", "sucKhoe"]);
  const FX_KEYS = new Set(["s", "stat", "dt", "cult", "wound", "led", "mat", "mast", "flag", "aflag", "wflag", "aff", "foe", "sect", "contrib", "ds", "start", "trace", "resolve", "life", "hp", "cf", "open", "bl"]);
  const WHEN_KEYS = new Set(["age", "realm", "path", "focus", "el", "rootN", "body", "talent", "mast", "sect", "lean", "rank", "partner", "pet", "tam", "tamma", "tamcanh", "khi", "ngo", "nghiep", "phuc", "kiep", "soup", "cau", "lore", "ending", "omen", "crisis", "done", "notDone", "flag", "noFlag", "aflag", "noAflag", "wflag", "noWflag", "life", "stones", "kills", "fails", "wound", "led", "npc", "trace", "chain", "arts", "items", "cave", "cosmos", "fn"]);
  const WHO = new Set(["master", "disciple", "foe", "kin", "partner", "any", "elder", "peer", "head", "trace", "arc"]);

  function fail(id, why) {
    throw new Error(`Sự kiện ${id}: ${why}`);
  }
  function checkFx(id, fx) {
    for (const k of Object.keys(fx ?? {})) if (!FX_KEYS.has(k)) fail(id, `hậu quả lạ "${k}"`);
    for (const k of Object.keys(fx?.stat ?? {})) if (!STATS.has(k)) fail(id, `chỉ số lạ "${k}"`);
  }
  function checkBody(id, e) {
    if (!Array.isArray(e.t) || e.t.length !== 2) fail(id, "thiếu tên song ngữ");
    if (!Array.isArray(e.x) || e.x.length !== 2) fail(id, "thiếu nội dung song ngữ");
    if (!Array.isArray(e.c) || !e.c.length || e.c.length > 4) fail(id, "phải có từ 1 tới 4 lựa chọn");
    if (e.who && !WHO.has(String(e.who).split(":")[0])) fail(id, `who lạ "${e.who}"`);
    for (const ch of e.c) {
      if (!Array.isArray(ch.l) || ch.l.length !== 2) fail(id, "lựa chọn thiếu nhãn song ngữ");
      if (!Array.isArray(ch.r) || ch.r.length !== 2) fail(id, `lựa chọn "${ch.l[0]}" thiếu kết quả song ngữ`);
      if (!["chinh", "trung", "ta"].includes(ch.lean ?? "trung")) fail(id, "lean lạ");
      checkFx(id, ch.fx);
      if (ch.ck) {
        if (!ch.ck.rf || ch.ck.rf.length !== 2) fail(id, "phép thử thiếu kết quả thất bại");
        checkFx(id, ch.ck.fxf);
      }
      if (ch.duel) {
        if (!ch.duel.rf || ch.duel.rf.length !== 2) fail(id, "trận đấu thiếu kết quả thua");
        checkFx(id, ch.duel.fxf);
      }
    }
  }
  function define(list) {
    for (const e of list) {
      if (!e.id || !/^[a-z0-9_]+$/.test(e.id)) fail(e.id, "id không hợp lệ");
      if (events.has(e.id)) fail(e.id, "trùng id");
      if (!GROUPS[e.g]) fail(e.id, `nhóm lạ "${e.g}"`);
      if (!TIERS[e.tier ?? 0]) fail(e.id, "cấp lạ");
      for (const k of Object.keys(e.when ?? {})) if (!WHEN_KEYS.has(k)) fail(e.id, `điều kiện lạ "${k}"`);
      checkBody(e.id, e);
      events.set(e.id, { v: VERSION, tier: 0, w: 1, once: true, ...e });
    }
  }
  function defineChain(list) {
    for (const ch of list) {
      if (chains.has(ch.id)) fail(ch.id, "trùng chuỗi");
      if (!GROUPS[ch.g]) fail(ch.id, "nhóm lạ");
      if (!ch.stages?.length) fail(ch.id, "chuỗi rỗng");
      const ids = new Set(ch.stages.map((s) => s.id));
      if (ids.size !== ch.stages.length) fail(ch.id, "trùng giai đoạn");
      for (const s of ch.stages) {
        if (!s.n || !s.log) fail(`${ch.id}.${s.id}`, "giai đoạn thiếu tên hoặc nhật ký");
        for (const b of s.br ?? []) if (!ids.has(b.to)) fail(`${ch.id}.${s.id}`, `nhánh tới giai đoạn lạ ${b.to}`);
        if (s.to && !ids.has(s.to)) fail(`${ch.id}.${s.id}`, `tới giai đoạn lạ ${s.to}`);
        if (s.ev) {
          checkBody(`${ch.id}.${s.id}`, s.ev);
          for (const k of Object.keys(s.ev.when ?? {})) if (!WHEN_KEYS.has(k)) fail(`${ch.id}.${s.id}`, `điều kiện lạ "${k}"`);
        }
        for (const k of Object.keys(s.wfx ?? {})) if (!["flag", "sect", "kill", "vein", "trace"].includes(k)) fail(`${ch.id}.${s.id}`, `hậu quả thế giới lạ "${k}"`);
      }
      // Mọi giai đoạn không phải kết thúc phải có đường đi tiếp, nên chuỗi không bao giờ kẹt
      ch.stages.forEach((s, i) => {
        if (!s.end && !s.to && !s.br?.length && !ch.stages[i + 1]) fail(`${ch.id}.${s.id}`, "không có đường đi tiếp");
        if (s.br?.length && s.br[s.br.length - 1].if !== undefined && !s.to && !ch.stages[i + 1]) fail(`${ch.id}.${s.id}`, "nhánh không có đường dự phòng");
      });
      if (!ch.stages.some((s) => s.end)) fail(ch.id, "chuỗi không có kết thúc");
      chains.set(ch.id, { v: VERSION, tier: 2, w: 1, ...ch });
    }
  }
  function defineArc(list) {
    for (const a of list) arcs.set(a.id, a);
  }

  // ---------- Trạng thái ----------

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (v.su) return v.su;
    v.su = { v: VERSION, done: {}, count: {}, tiers: {}, cd: {}, flags: {}, pend: null, seq: 0, j: [], gain: 0, chains: {}, resolved: 0 };
    return v.su;
  }
  function ledger(acct) {
    if (!acct) return null;
    acct.ev = acct.ev ?? { v: VERSION, once: {}, flags: {}, traces: [], hist: [], lives: [], chainDone: 0, nextId: 1, resolved: 0 };
    return acct.ev;
  }
  const worldOf = (acct) => acct?.world ?? null;
  const worldChains = (w) => (w.chains = w.chains ?? []);
  const wr = (w, a, b = 0) => hash32(hash32(w.seed + Math.imul(w.year + 1, 73856093)) + Math.imul(a + 7, 19349663) + Math.imul(b + 13, 83492791)) / 4294967296;

  // ---------- Nhân quả ----------

  /** Dấu vết chỉ mô tả mối liên hệ, không chứa tài nguyên, nên luân hồi không thể dùng để sao chép sức mạnh. */
  function trace(c, acct, t) {
    const l = ledger(acct);
    if (!l) return null;
    const key = t.key ?? null;
    if (key && l.traces.some((x) => x.key === key && x.open)) return null;
    const entry = { id: l.nextId++, k: t.k, t: t.t, key, n: t.n ?? null, npc: t.npc ?? null, life: c?.lifeNo ?? 0, y: acct.world?.year ?? 0, w: t.w ?? 30, open: true };
    l.traces.push(entry);
    if (l.traces.length > TRACE_CAP) {
      const closed = l.traces.findIndex((x) => !x.open);
      l.traces.splice(closed >= 0 ? closed : 0, 1);
    }
    root.VK2Menh?.note?.(c, acct, "nhan", 2);
    return entry;
  }
  const openTraces = (acct, k) => (ledger(acct)?.traces ?? []).filter((x) => x.open && (!k || x.k === k));
  function resolveTrace(c, acct, id) {
    const x = (ledger(acct)?.traces ?? []).find((t) => t.id === id && t.open);
    if (!x) return false;
    x.open = false;
    x.closedLife = c?.lifeNo ?? 0;
    ledger(acct).resolved += 1;
    root.VK2Menh?.note?.(c, acct, "nhan", -5);
    return true;
  }

  // ---------- Điều kiện ----------

  const inRange = (x, r) => (Array.isArray(r) ? x >= (r[0] ?? -Infinity) && x <= (r[1] ?? Infinity) : x >= r);
  const omenIs = (id) => !!root.VK2Can?.omenIs?.(id);

  function rolesOf(c, acct) {
    const H = root.VK2The;
    const w = worldOf(acct);
    if (!H || !w) return {};
    const year = w.year;
    const living = w.npcs.filter((n) => year - n.b >= 14);
    return {
      master: () => H.myMaster(c, acct),
      disciple: () => H.myDisciples(c, acct)[0] ?? null,
      foe: () => H.liveFoes(c, acct)?.[0] ?? null,
      kin: () => living.find((n) => n.kin) ?? null,
      partner: () => (c.partner ? { id: null, n: typeof c.partner === "string" ? c.partner : c.partner.name ?? "?" } : null),
      elder: () => living.filter((n) => n.r >= (c.realm ?? 0) + 1).sort((a, b) => a.id - b.id)[0] ?? null,
      peer: () => living.filter((n) => Math.abs(n.r - (c.realm ?? 0)) <= 1 && !n.foe && !n.disc).sort((a, b) => a.id - b.id)[yearOf(c) % 5] ?? living[0] ?? null,
      any: () => living[yearOf(c) % Math.max(1, living.length)] ?? null,
      head: () => {
        const s = H.mySect(c, acct);
        return s ? H.headOf(w, s.n) : null;
      },
    };
  }
  function npcFor(c, acct, who, su) {
    if (!who) return null;
    const w = worldOf(acct);
    if (!w) return null;
    const [role, arg, st] = String(who).split(":");
    if (role === "arc") return w.npcs.find((n) => n.arc?.id === arg && (st === undefined || n.arc.st === Number(st))) ?? null;
    if (role === "trace") {
      const x = openTraces(acct, arg).find((t) => t.npc && w.npcs.some((n) => n.id === t.npc));
      return x ? w.npcs.find((n) => n.id === x.npc) : null;
    }
    return rolesOf(c, acct)[role]?.() ?? null;
  }

  /** Mỗi khóa là một điều kiện thật trên nhân vật, tài khoản hoặc thế giới. Khóa nào không thỏa thì sự kiện không xuất hiện. */
  function meets(c, acct, when, ctx) {
    if (!when) return true;
    const su = c.vk2?.su;
    const st = c.stats ?? {};
    const mv = acct?.mv ?? {};
    const w = worldOf(acct);
    const l = acct?.ev;
    const has = (k) => when[k] !== undefined;
    if (!!c.cosmos !== !!when.cosmos) return false; // Sự kiện Tiên giới và hạ giới tách hẳn nhau
    if (has("age") && !inRange(yearOf(c), when.age)) return false;
    if (has("realm") && !inRange(c.realm ?? 0, when.realm)) return false;
    if (has("path") && ![].concat(when.path).includes(c.path)) return false;
    if (has("focus") && ![].concat(when.focus).includes(c.focus)) return false;
    if (has("el") && !C.rootInfo(c).elements.includes(when.el)) return false;
    if (has("rootN") && !inRange(C.rootInfo(c).count, when.rootN)) return false;
    if (has("body") && c.vk2?.can?.body?.id !== when.body) return false;
    if (has("talent") && !(c.vk2?.talents?.[when.talent]?.lv >= 1)) return false;
    if (has("mast") && !Object.entries(when.mast).every(([k, n]) => (c.vk2?.dao?.mastery?.[k] ?? 0) >= n)) return false;
    if (has("sect") && !!c.sect !== when.sect) return false;
    if (has("lean")) {
      const s = root.VK2The?.mySect?.(c, acct);
      if (!s || s.lean !== when.lean) return false;
    }
    if (has("rank") && !inRange(c.sectRank ?? 0, when.rank)) return false;
    if (has("partner") && !!c.partner !== when.partner) return false;
    if (has("pet") && !!c.pet !== when.pet) return false;
    if (has("tam") && !inRange(c.daoTam ?? 0, when.tam)) return false;
    if (has("tamma") && !inRange(st.tamMa ?? 0, when.tamma)) return false;
    if (has("tamcanh") && !inRange(st.tamCanh ?? 0, when.tamcanh)) return false;
    if (has("khi") && !inRange(st.khiVan ?? 0, when.khi)) return false;
    if (has("ngo") && !inRange(st.ngoTinh ?? 0, when.ngo)) return false;
    if (has("nghiep") && !inRange(mv.n ?? c.nghiep ?? 0, when.nghiep)) return false;
    if (has("phuc") && !inRange(mv.p ?? 0, when.phuc)) return false;
    if (has("kiep") && !inRange(mv.k ?? 0, when.kiep)) return false;
    if (has("soup") && !!c.tanHon !== when.soup) return false;
    if (has("cau") && !!c.cauHon !== when.cau) return false;
    if (has("lore") && !inRange(acct?.lore ?? 0, when.lore)) return false;
    if (has("ending") && !inRange(mv.e ?? 0, when.ending)) return false;
    if (has("omen") && !omenIs(when.omen)) return false;
    if (has("crisis") && (when.crisis === true ? !w?.crisis : w?.crisis?.id !== when.crisis)) return false;
    if (has("done") && !su?.done[when.done]) return false;
    if (has("notDone") && su?.done[when.notDone] !== undefined) return false;
    if (has("flag") && !su?.flags[when.flag]) return false;
    if (has("noFlag") && su?.flags[when.noFlag]) return false;
    if (has("aflag") && !l?.flags[when.aflag]) return false;
    if (has("noAflag") && l?.flags[when.noAflag]) return false;
    if (has("wflag") && !w?.flags?.[when.wflag]) return false;
    if (has("noWflag") && w?.flags?.[when.noWflag]) return false;
    if (has("life") && !inRange(c.lifeNo ?? 0, when.life)) return false;
    if (has("stones") && (c.linhThach ?? 0) < when.stones * (SCALE[c.realm ?? 0] ?? 1)) return false;
    if (has("kills") && !inRange(c.vk2?.c?.kills ?? 0, when.kills)) return false;
    if (has("fails") && !inRange(c.vk2?.phap?.wounds?.bai ?? 0, when.fails)) return false; // Sổ chấp niệm ghi mỗi lần đột phá thất bại
    if (has("wound") && !Object.entries(when.wound).every(([k, n]) => (c.vk2?.phap?.wounds?.[k] ?? 0) >= n)) return false;
    if (has("led") && !Object.entries(when.led).every(([k, n]) => (c.vk2?.menh?.ledger?.[k] ?? 0) >= n)) return false;
    if (has("npc") && !npcFor(c, acct, when.npc)) return false;
    if (has("trace") && !openTraces(acct, when.trace).length) return false;
    if (has("chain") && !worldChains(w ?? {}).some((i) => i.id === when.chain)) return false;
    if (has("arts") && (c.vk2?.dao?.arts?.length ?? 0) < when.arts) return false;
    if (has("items") && (c.vk2?.khi?.items?.length ?? 0) < when.items) return false;
    if (has("cave") && !!c.vk2?.khi?.cave !== when.cave) return false;
    if (has("fn") && !when.fn(c, acct, ctx)) return false;
    return true;
  }

  // ---------- Scheduler ----------

  function weightOf(c, e) {
    let x = TIER_WEIGHT[e.tier] * e.w;
    for (const [id, m] of Object.entries(e.omenW ?? {})) if (omenIs(id)) x *= m;
    if (e.focusW?.[c.focus]) x *= e.focusW[c.focus];
    return x;
  }
  function eligibleWhy(c, acct, e) {
    const su = ensure(c, acct);
    const year = yearOf(c);
    if (e.once && su.done[e.id] !== undefined) return "đã xảy ra";
    if (e.acctOnce && ledger(acct)?.once[e.id]) return "đã xảy ra ở kiếp trước";
    if (e.cd && su.done[e.id] !== undefined && year - su.done[e.id] < e.cd) return "đang hồi";
    if (e.ex && su.cd[e.ex] !== undefined && year - su.cd[e.ex] < (e.excd ?? 25)) return "đang bị loại trừ";
    if ((su.tiers[e.tier] ?? 0) >= TIER_LIFE_CAP[e.tier]) return "đủ số sự kiện của cấp này";
    if (!meets(c, acct, e.when)) return "chưa đủ điều kiện";
    if (e.who && !npcFor(c, acct, e.who)) return "không có người liên quan";
    return null;
  }
  const eligible = (c, acct) => [...events.values()].filter((e) => !eligibleWhy(c, acct, e));

  /** Chọn theo trọng số, xác định theo nhân vật và năm, nên tải lại trang không đổi được sự kiện. */
  function pick(c, acct, list, salt = 701) {
    if (!list.length) return null;
    const total = list.reduce((s, e) => s + weightOf(c, e), 0);
    let x = rnd(c, yearOf(c), salt) * total;
    for (const e of list) {
      x -= weightOf(c, e);
      if (x <= 0) return e;
    }
    return list[list.length - 1];
  }

  /** Sự kiện của giai đoạn chuỗi đang chờ người chơi. Đến hạn thì chuỗi tự đi tiếp, người chơi chỉ là một bên tham gia. */
  function dueChainEvent(c, acct) {
    const w = worldOf(acct);
    if (!w) return null;
    const su = ensure(c, acct);
    for (const inst of worldChains(w)) {
      const def = chains.get(inst.id);
      const stage = def?.stages.find((s) => s.id === inst.st);
      if (!stage?.ev) continue;
      if ((inst.asked ?? {})[`${c.lifeNo ?? 0}:${inst.st}`]) continue;
      if (!meets(c, acct, stage.ev.when)) continue;
      if (stage.ev.join === false && !su.chains[inst.uid]) continue;
      return { inst, stage, def };
    }
    return null;
  }

  // ---------- Dựng sự kiện cho game ----------

  const fill = (s, ctx) => String(s).replace(/\{npc\}/g, ctx.npc?.n ?? "?").replace(/\{sect\}/g, ctx.sect ?? "?").replace(/\{me\}/g, ctx.me ?? "").replace(/\{foe\}/g, ctx.foe ?? "?").replace(/\{ally\}/g, ctx.ally ?? "?");
  function ctxOf(c, acct, p) {
    const w = worldOf(acct);
    const npc = p?.npc && w ? root.VK2The?.npcOf(w, p.npc) ?? { n: p.npcN } : p?.npcN ? { n: p.npcN } : null;
    const inst = p?.uid ? worldChains(w ?? {}).find((i) => i.uid === p.uid) : null;
    const names = inst?.names ?? p?.names;
    const role = (r) => (inst?.roles?.[r] && w ? root.VK2The?.npcOf(w, inst.roles[r])?.n ?? names?.[r] : names?.[r]);
    return { npc, sect: c.sect ?? inst?.sect ?? p?.sect ?? null, me: c.name ?? "", foe: role("foe"), ally: role("ally") };
  }
  const cost = (c, s) => Math.round(s * (SCALE[c.realm ?? 0] ?? 1));

  function choiceOff(c, acct, ch) {
    if (ch.need && !meets(c, acct, ch.need)) return true;
    if (ch.pay && (c.linhThach ?? 0) < cost(c, ch.pay)) return true;
    return false;
  }
  function buildDef(c, acct, runtimeId, e, p) {
    const ctx = ctxOf(c, acct, p);
    const tier = e.tier ?? p?.tier ?? 0;
    const head = `${TIER_MARK[tier]} ${tr(TIERS[tier])}`;
    return {
      id: runtimeId,
      title: `${tr(e.t)} (${head})`,
      text: () => {
        const who = ctx.npc?.n ? `\n${tr(["Liên quan", "Involved"])}: ${ctx.npc.n}` : "";
        return `${fill(tr(e.x), ctx)}${who}`;
      },
      choices: (n) =>
        e.c.map((ch, i) => ({
          label: fill(tr(ch.l), ctx),
          hint: [ch.h ? fill(tr(ch.h), ctx) : "", ch.pay ? `${tr(["tốn", "costs"])} ${cost(n, ch.pay)} ${tr(["linh thạch", "stones"])}` : "", ch.needT ? tr(ch.needT) : ""].filter(Boolean).join(" · "),
          lean: ch.lean ?? "trung",
          off: choiceOff(n, acct, ch),
          run: (x) => resolve(x, acct, runtimeId, i),
        })),
    };
  }
  /** Sau tải lại, sự kiện được dựng lại từ phần đang chờ đã lưu trong nhân vật. */
  function eventDef(c, acct, id) {
    if (!String(id).startsWith("vk2_su_")) return null;
    const su = ensure(c, acct);
    const p = su.pend;
    const body = p && p.rid === id ? bodyOf(p) : null;
    if (!body) return { id, title: "", text: () => "", choices: () => [{ label: tr(["Đi tiếp", "Continue"]), lean: "trung", run: () => "" }] };
    return buildDef(c, acct, id, body, p);
  }
  function bodyOf(p) {
    if (p.ch) return chains.get(p.ch)?.stages.find((s) => s.id === p.st)?.ev ?? null;
    return events.get(p.id) ?? null;
  }
  function startPending(c, acct, p, e) {
    const su = ensure(c, acct);
    su.pend = p;
    return buildDef(c, acct, p.rid, e, p);
  }
  function nextEvent(c, acct, opts) {
    if (!acct) return null;
    const su = ensure(c, acct);
    if (su.pend) {
      const body = bodyOf(su.pend);
      if (body) return buildDef(c, acct, su.pend.rid, body, su.pend);
      su.pend = null;
    }
    const due = dueChainEvent(c, acct);
    if (due) {
      due.inst.asked = due.inst.asked ?? {};
      due.inst.asked[`${c.lifeNo ?? 0}:${due.inst.st}`] = yearOf(c);
      return startPending(c, acct, { rid: `vk2_su_ch_${due.inst.uid}_${due.stage.id}`, ch: due.inst.id, st: due.stage.id, uid: due.inst.uid, names: due.inst.names, sect: due.inst.sect ?? null, tier: due.def.tier, npc: due.inst.roles?.foe ?? due.inst.roles?.ally ?? null, npcN: due.inst.names?.foe ?? due.inst.names?.ally ?? null, at: yearOf(c) }, due.stage.ev);
    }
    if (rnd(c, yearOf(c), 700) >= FIRE_CHANCE) return null;
    const e = pick(c, acct, eligible(c, acct));
    if (!e) return null;
    const npc = npcFor(c, acct, e.who);
    return startPending(c, acct, { rid: `vk2_su_${e.id}`, id: e.id, npc: npc?.id ?? null, npcN: npc?.n ?? null, at: yearOf(c) }, e);
  }

  /** Tiên giới không có sự kiện năm của các module khác, nên có lối riêng và thưa hơn. */
  function cosmosEvent(c, acct) {
    if (!acct) return null;
    const su = ensure(c, acct);
    if (su.pend) {
      const body = bodyOf(su.pend);
      if (body) return buildDef(c, acct, su.pend.rid, body, su.pend);
      su.pend = null;
    }
    if (rnd(c, yearOf(c), 702) >= FIRE_CHANCE * 0.5) return null;
    const e = pick(c, acct, eligible(c, acct), 703);
    if (!e) return null;
    return startPending(c, acct, { rid: `vk2_su_${e.id}`, id: e.id, at: yearOf(c) }, e);
  }

  // ---------- Resolver ----------

  const FX_NAME = { tamCanh: ["Tâm cảnh", "Composure"], tamMa: ["Tâm ma", "Inner demons"], khiVan: ["Khí vận", "Fortune"], ngoTinh: ["Ngộ tính", "Insight"], sucKhoe: ["Sức khỏe", "Health"] };
  const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

  /** Áp một gói hậu quả. Trả về dòng tóm tắt những gì nhân vật biết được, phần bí mật không có ở đây. */
  function apply(c, acct, fx, ctx = {}) {
    if (!fx) return [];
    const su = ensure(c, acct);
    const seen = [];
    if (fx.s) {
      let n = cost(c, fx.s);
      if (n > 0) {
        // Càng nhận nhiều trong một kiếp thì sự kiện càng cho ít
        n = Math.round(n / (1 + su.gain / LIFE_GAIN(c.realm ?? 0)));
        su.gain += n;
      }
      c.linhThach = Math.max(0, (c.linhThach ?? 0) + n);
      if (n) seen.push(`${tr(["Linh thạch", "Stones"])} ${sign(n)}`);
    }
    for (const [k, n] of Object.entries(fx.stat ?? {})) {
      addStat(c, k, n);
      seen.push(`${tr(FX_NAME[k])} ${sign(n)}`);
    }
    if (fx.hp) {
      addStat(c, "sucKhoe", fx.hp);
      if ((c.stats?.sucKhoe ?? 0) < 5) c.stats.sucKhoe = 5; // Một lựa chọn có thể làm trọng thương, nhưng không giết thẳng
      seen.push(`${tr(FX_NAME.sucKhoe)} ${sign(fx.hp)}`);
    }
    if (fx.dt) c.daoTam = clamp((c.daoTam ?? 0) + fx.dt, -100, 100);
    if (fx.cult) {
      const rate = root.__VK2?._test?.rate?.(c) ?? 0;
      if (rate > 0) c.cultivation = Math.max(0, (c.cultivation ?? 0) + Math.round(rate * fx.cult));
      seen.push(`${tr(["Tu vi", "Cultivation"])} ${sign(fx.cult)} ${tr(["năm", "yrs"])}`);
    }
    if (fx.life) {
      c.lifespan = (c.lifespan ?? 0) + fx.life;
      seen.push(`${tr(["Thọ nguyên", "Lifespan"])} ${sign(fx.life)}`);
    }
    for (const [k, n] of Object.entries(fx.wound ?? {})) root.VK2Phap?.wound?.(c, acct, k, n);
    for (const [k, n] of Object.entries(fx.led ?? {})) root.VK2Menh?.note?.(c, acct, k, n);
    for (const [k, n] of Object.entries(fx.mat ?? {})) {
      root.VK2Khi?.addMat?.(c, acct, k, n);
      seen.push(`${tr(root.VK2Khi?.MATS?.[k]?.n ?? [k, k])} +${n}`);
    }
    for (const [k, n] of Object.entries(fx.mast ?? {})) {
      root.VK2Dao?.addMastery?.(c, k, n);
      seen.push(`${tr(root.VK2Dao?.CONCEPTS?.[k] ?? [k, k])} +${n}`);
    }
    if (fx.flag) su.flags[fx.flag] = yearOf(c);
    if (fx.aflag) ledger(acct).flags[fx.aflag] = c.lifeNo ?? 1;
    const w = worldOf(acct);
    if (fx.wflag && w) (w.flags = w.flags ?? {})[fx.wflag] = w.year;
    const npc = ctx.npc?.id && w ? root.VK2The?.npcOf(w, ctx.npc.id) : null;
    if (fx.aff && npc) npc.aff = clamp((npc.aff ?? 0) + fx.aff, -100, 100);
    if (fx.foe && npc) {
      npc.foe = c.lifeNo ?? 1;
      npc.foeSince = yearOf(c);
    }
    if (fx.sect) {
      const s = root.VK2The?.mySect?.(c, acct);
      if (s) {
        if (fx.sect.store) s.store = Math.max(0, (s.store ?? 0) + fx.sect.store);
        if (fx.sect.terr) s.terr = clamp((s.terr ?? 1) + fx.sect.terr, 1, 9);
        if (fx.sect.vein) s.vein = clamp((s.vein ?? 1) + fx.sect.vein, 0, 5);
      }
    }
    if (fx.contrib && c.vk2.the) c.vk2.the.contrib = (c.vk2.the.contrib ?? 0) + fx.contrib;
    if (fx.ds && ctx.inst) ctx.inst.s = clamp(ctx.inst.s + fx.ds, -100, 100);
    if (fx.cf && ctx.inst) (ctx.inst.f = ctx.inst.f ?? {})[fx.cf] = 1;
    if (fx.start && w) startChain(w, fx.start, { by: c });
    if (fx.open && root.VK2Dao) {
      const d = root.VK2Dao.ensure(c, acct);
      if (d.open.length < 2 && !d.open.some((o) => o.id === fx.open)) d.open.push({ id: fx.open, until: yearOf(c) + 30, seed: hash32((c.lookSeed ?? 0) + yearOf(c)) });
      seen.push(tr(["Một bí cảnh vừa mở ra", "A secret realm has opened"]));
    }
    if (fx.bl && root.VK2Dao) {
      const d = root.VK2Dao.ensure(c, acct);
      if (!d.blood) d.blood = fx.bl;
    }
    if (fx.trace) {
      const names = { npc, sect: c.sect ?? ctx.inst?.sect ?? null, me: c.name ?? "", foe: ctx.inst?.names?.foe, ally: ctx.inst?.names?.ally };
      trace(c, acct, { ...fx.trace, t: fx.trace.t.map((s) => fill(s, names)), npc: fx.trace.npc ?? npc?.id ?? null, n: fx.trace.n ?? npc?.n ?? null });
      seen.push(tr(["Nhân quả đã ghi lại", "Karma noted"]));
    }
    if (fx.resolve) {
      const list = openTraces(acct, fx.resolve === true ? ctx.traceKind : fx.resolve);
      if (list[0]) resolveTrace(c, acct, list[0].id);
    }
    return seen;
  }
  function roll(c, ck, salt) {
    const stat = ck.on === "daoTam" ? Math.abs(c.daoTam ?? 0) : c.stats?.[ck.on] ?? 0;
    const chance = clamp((ck.p ?? 0.5) + (stat - (ck.at ?? 50)) * 0.01, 0.05, 0.95);
    return rnd(c, yearOf(c), salt) < chance;
  }
  /** Chạy đúng một lần: phần đang chờ bị xóa ngay, nên bấm lặp hay tải lại không thể nhận hậu quả lần hai. */
  function resolve(c, acct, rid, idx) {
    const su = ensure(c, acct);
    const p = su.pend;
    if (!p || p.rid !== rid) return "";
    const body = bodyOf(p);
    const ch = body?.c[idx];
    if (!ch || choiceOff(c, acct, ch)) return tr(["Bạn chưa đủ điều kiện để chọn cách này.", "You do not meet the conditions for this choice."]);
    su.pend = null;
    su.seq += 1;
    const salt = 800 + su.seq;
    const w = worldOf(acct);
    const inst = p.uid && w ? worldChains(w).find((i) => i.uid === p.uid) : null;
    const npc = p.npc && w ? root.VK2The?.npcOf(w, p.npc) : null;
    const ctx = { inst, npc, traceKind: body.when?.trace };
    if (ch.pay) c.linhThach = Math.max(0, (c.linhThach ?? 0) - cost(c, ch.pay));
    let result = ch.r;
    let fx = ch.fx;
    let won = true;
    if (ch.ck && !roll(c, ch.ck, salt)) {
      won = false;
      result = ch.ck.rf;
      fx = ch.ck.fxf;
    } else if (ch.duel) {
      const lv = C.combatLevel(c) + (ch.duel.off ?? 0);
      const r = C.duel(c, lv, ch.duel.mul ?? 1, hash32((c.lookSeed ?? 0) + salt), clamp((c.stats?.sucKhoe ?? 100) / 100, 0.2, 1));
      if (!r.win) {
        won = false;
        result = ch.duel.rf;
        fx = ch.duel.fxf;
      }
    }
    const seen = apply(c, acct, fx, ctx);
    const text = fill(tr(result), ctxOf(c, acct, p));
    // Ghi nhận
    if (p.id) {
      su.done[p.id] = yearOf(c);
      su.count[p.id] = (su.count[p.id] ?? 0) + 1;
      su.tiers[body.tier ?? 0] = (su.tiers[body.tier ?? 0] ?? 0) + 1;
      if (body.ex) su.cd[body.ex] = yearOf(c);
      if (body.acctOnce) ledger(acct).once[p.id] = c.lifeNo ?? 1;
    }
    if (inst) {
      su.chains[inst.uid] = (su.chains[inst.uid] ?? 0) + 1;
      inst.me = inst.me ?? {};
      inst.me[c.lifeNo ?? 0] = (inst.me[c.lifeNo ?? 0] ?? 0) + 1;
      inst.choices = inst.choices ?? [];
      inst.choices.push({ life: c.lifeNo ?? 0, st: p.st, l: ch.l, y: w.year });
      if (inst.choices.length > 8) inst.choices.shift();
    }
    su.resolved += 1;
    journal(c, acct, { y: yearOf(c), t: body.t, tier: body.tier ?? p.tier ?? 0, g: p.ch ? chains.get(p.ch)?.g : body.g, l: ch.l, lean: ch.lean ?? "trung", r: result, won, ch: p.ch ?? null, n: npc?.n ?? p.npcN ?? null });
    return seen.length ? `${text} (${seen.join(", ")})` : text;
  }

  // ---------- Journal ----------

  function journal(c, acct, entry) {
    const su = ensure(c, acct);
    su.j.push(entry);
    if (su.j.length > JOURNAL_CAP) su.j.shift();
  }
  const NATIVE_GROUP = [[/^vk2_bc|^vk2_dao/, "bi_canh"], [/^vk2_the_(war)/, "tong_mon"], [/^vk2_the/, "nhan_duyen"], [/^vk2_phap_demon/, "tu_luyen"], [/^vk2_phap/, "the_gioi"], [/^vk2_menh/, "nhan_qua"], [/^vk2_cave/, "kinh_te"], [/^__dot_pha/, "thien_kiep"]];
  /** Mọi lựa chọn của game gốc và các module khác cũng vào nhật ký, nên lịch sử lựa chọn không bị đứt quãng. */
  function onChoice(c, acct, ev, choice) {
    if (!c.vk2 || !ev || String(ev.id).startsWith("vk2_su_")) return;
    const id = String(ev.id);
    const g = NATIVE_GROUP.find(([re]) => re.test(id))?.[1] ?? "ky_ngo";
    journal(c, acct, { y: yearOf(c), t: [ev.title, ev.title], tier: 0, g, l: [choice.label, choice.label], lean: choice.lean ?? "trung", native: 1 });
  }

  // ---------- Chuỗi trong thế giới ----------

  function stageIdx(def, id) {
    return def.stages.findIndex((s) => s.id === id);
  }
  function enterStage(w, inst, def, id) {
    const st = def.stages.find((s) => s.id === id);
    inst.st = id;
    const [a, b] = st.dur ?? [6, 14];
    inst.until = w.year + a + Math.floor(wr(w, 50, inst.uid) * (b - a + 1));
    pushWorld(w, { y: w.year, t: fillWorld(st.log, inst, w), ch: inst.id, uid: inst.uid, tier: def.tier });
    if (st.wfx) applyWorld(w, inst, st.wfx);
    if (st.end) {
      inst.ended = st.id;
      inst.endY = w.year;
    }
  }
  function roleName(w, inst, role) {
    const n = inst.roles?.[role] ? root.VK2The?.npcOf(w, inst.roles[role]) : null;
    return n?.n ?? inst.names?.[role] ?? "?";
  }
  const fillWorld = (pair, inst, w) => pair.map((s) => s.replace(/\{foe\}/g, roleName(w, inst, "foe")).replace(/\{ally\}/g, roleName(w, inst, "ally")).replace(/\{sect\}/g, inst.sect ?? "?"));
  function pushWorld(w, e) {
    w.events = w.events ?? [];
    w.events.push(e);
    if (w.events.length > HIST_CAP) w.events.shift();
    w.log?.push({ y: e.y, t: e.t });
    if ((w.log?.length ?? 0) > 60) w.log.shift();
  }
  function applyWorld(w, inst, wfx) {
    if (wfx.flag) (w.flags = w.flags ?? {})[wfx.flag] = w.year;
    const sec = inst.sect ? w.sects[inst.sect] : null;
    if (wfx.sect && sec) {
      sec.terr = clamp(sec.terr + (wfx.sect.terr ?? 0), 1, 9);
      sec.store = Math.max(0, sec.store + (wfx.sect.store ?? 0));
      sec.vein = clamp(sec.vein + (wfx.sect.vein ?? 0), 1, 9);
    }
    // Tai họa theo vùng: một tông chịu, không bào mòn linh mạch cả thế giới qua hàng nghìn năm
    if (wfx.vein) {
      const all = Object.values(w.sects);
      const hit = sec ?? all[Math.floor(wr(w, 57, inst.uid) * all.length)];
      if (hit) hit.vein = clamp(hit.vein + wfx.vein, 1, 9);
    }
    if (wfx.kill) {
      const n = inst.roles?.[wfx.kill] ? root.VK2The?.npcOf(w, inst.roles[wfx.kill]) : null;
      if (n) root.VK2The?.die?.(w, n, ["vong mạng trong biến cố", "fell in the upheaval"]);
    }
  }
  /** Điều kiện nhánh chỉ đọc điểm thế cuộc và dấu của chuỗi, không đọc người chơi có mặt hay không. */
  function nextStage(w, inst, def, cur) {
    for (const b of cur.br ?? []) {
      if (b.if === undefined) return b.to;
      if (b.if.s !== undefined && inst.s >= b.if.s) return b.to;
      if (b.if.lt !== undefined && inst.s < b.if.lt) return b.to;
      if (b.if.f && inst.f?.[b.if.f]) return b.to;
      if (b.if.dead && !root.VK2The?.npcOf(w, inst.roles?.[b.if.dead])) return b.to;
    }
    if (cur.to) return cur.to;
    return def.stages[stageIdx(def, cur.id) + 1]?.id;
  }
  /** Thế cuộc trôi theo sức của hai phe và tính cách NPC, nên người chơi vắng mặt thì kết quả vẫn không cố định. */
  function driftOf(w, inst) {
    const H = root.VK2The;
    const ally = inst.roles?.ally ? H?.npcOf(w, inst.roles.ally) : null;
    const foe = inst.roles?.foe ? H?.npcOf(w, inst.roles.foe) : null;
    const pa = ally ? H.npcPower(ally) : 0;
    const pf = foe ? H.npcPower(foe) : 0;
    const force = (pa - pf) / Math.max(4, pa + pf) * 18;
    return force + (wr(w, 51, inst.uid) - 0.5) * 16 + (inst.bias ?? 0);
  }
  function startChain(w, id, o = {}) {
    const def = chains.get(id);
    const H = root.VK2The;
    if (!def || !H) return null;
    if (worldChains(w).some((i) => i.id === id) || worldChains(w).length >= ACTIVE_CHAINS + (o.by ? 1 : 0)) return null;
    w.chainSeq = (w.chainSeq ?? 0) + 1;
    const uid = w.chainSeq;
    const inst = { uid, id, v: def.v, s: def.s0 ?? 0, st: null, at: w.year, roles: {}, names: {}, f: {} };
    const pool = w.npcs.filter((n) => w.year - n.b >= 18 && !n.disc && !n.kin);
    const sects = Object.values(w.sects);
    const pickFrom = (list, salt) => list[Math.floor(wr(w, salt, uid) * list.length) % Math.max(1, list.length)];
    // NPC tham gia là người thật trong thế giới, sống chết của họ đổi được diễn biến
    if (def.roles?.foe) {
      const f = pickFrom(pool.filter(def.roles.foe === "strong" ? (n) => n.r >= 2 : () => true), 52);
      if (f) {
        inst.roles.foe = f.id;
        inst.names.foe = f.n;
      }
    }
    if (def.roles?.ally) {
      const a = pickFrom(pool.filter((n) => n.id !== inst.roles.foe && (def.roles.ally === "strong" ? n.r >= 2 : true)), 53);
      if (a) {
        inst.roles.ally = a.id;
        inst.names.ally = a.n;
      }
    }
    const sec = def.sect ? pickFrom(sects.filter((s) => def.sect === true || s.lean === def.sect), 54) : null;
    inst.sect = sec?.n ?? null;
    worldChains(w).push(inst);
    w.chainAt = w.year;
    (w.chainLast = w.chainLast ?? {})[id] = w.year;
    enterStage(w, inst, def, def.stages[0].id);
    return inst;
  }
  function chainWhen(w, def) {
    const cond = def.when;
    if (!cond) return true;
    if (cond.wflag && !w.flags?.[cond.wflag]) return false;
    if (cond.noWflag && w.flags?.[cond.noWflag]) return false;
    if (cond.crisis && w.crisis?.id !== cond.crisis) return false;
    if (cond.minYear && w.year < cond.minYear) return false;
    if (cond.fn && !cond.fn(w)) return false;
    return true;
  }
  /** Gọi một lần mỗi năm thế giới từ the.js, kể cả khi tua nhanh giữa hai kiếp. */
  function worldStep(w) {
    const list = worldChains(w);
    for (const inst of [...list]) {
      const def = chains.get(inst.id);
      if (!def) {
        list.splice(list.indexOf(inst), 1);
        continue;
      }
      const cur = def.stages.find((s) => s.id === inst.st);
      if (w.year < inst.until) continue;
      if (cur?.end) {
        finishChain(w, inst, def, cur);
        list.splice(list.indexOf(inst), 1);
        continue;
      }
      inst.s = clamp(inst.s + driftOf(w, inst), -100, 100);
      inst.auto = (inst.auto ?? 0) + 1;
      const next = nextStage(w, inst, def, cur);
      if (!next) {
        // Đề phòng dữ liệu cũ sau khi cập nhật: chuỗi không được kẹt
        finishChain(w, inst, def, cur);
        list.splice(list.indexOf(inst), 1);
        continue;
      }
      enterStage(w, inst, def, next);
    }
    if (list.length < ACTIVE_CHAINS && w.year - (w.chainAt ?? -999) >= CHAIN_GAP && wr(w, 55) < 0.2) {
      const options = [...chains.values()].filter((d) => !d.manual && !list.some((i) => i.id === d.id) && w.year - (w.chainLast?.[d.id] ?? -9999) >= CHAIN_REPEAT && chainWhen(w, d));
      if (options.length) {
        const total = options.reduce((s, d) => s + d.w, 0);
        let x = wr(w, 56) * total;
        for (const d of options) {
          x -= d.w;
          if (x <= 0) {
            startChain(w, d.id);
            break;
          }
        }
      }
    }
    arcStep(w);
    // Cờ thế giới cũ hết tác dụng, nên lịch sử không đè nặng mãi
    for (const [k, y] of Object.entries(w.flags ?? {})) if (w.year - y > 400) delete w.flags[k];
  }
  function finishChain(w, inst, def, cur) {
    w.chainHist = w.chainHist ?? [];
    w.chainHist.push({ uid: inst.uid, id: inst.id, end: cur?.id ?? null, y: w.year, at: inst.at, s: Math.round(inst.s), me: inst.me ?? null, names: inst.names });
    if (w.chainHist.length > 40) w.chainHist.shift();
  }

  // ---------- Mạch đời NPC ----------

  /** Không chạy theo thời gian thực: mỗi năm chỉ xét một ít người, ưu tiên người đang ở giữa mạch. */
  function arcStep(w) {
    const running = w.npcs.filter((n) => n.arc);
    for (const n of running) {
      const def = arcs.get(n.arc.id);
      if (!def) {
        delete n.arc;
        continue;
      }
      if (w.year < n.arc.next) continue;
      const step = def.steps[n.arc.st];
      if (!step) {
        delete n.arc;
        continue;
      }
      const go = step.run(w, n, (a, b = 0) => wr(w, 60 + a, n.id + b));
      if (go === false) {
        delete n.arc;
        continue;
      }
      n.arc.st += 1;
      const after = def.steps[n.arc.st];
      if (!after) delete n.arc;
      else n.arc.next = w.year + (after.wait?.[0] ?? 8) + Math.floor(wr(w, 61, n.id) * ((after.wait?.[1] ?? 16) - (after.wait?.[0] ?? 8) + 1));
    }
    if (running.length >= 6 || w.year % 4 !== 0 || !w.npcs.length) return;
    const n = w.npcs[Math.floor(wr(w, 62) * w.npcs.length) % w.npcs.length];
    if (n.arc || n.disc || n.kin || n.foe) return;
    for (const def of arcs.values()) {
      if (def.when(w, n, (a) => wr(w, 63 + a, n.id))) {
        n.arc = { id: def.id, st: 0, at: w.year, next: w.year + 1 };
        return;
      }
    }
  }

  // ---------- Vòng năm, kiếp ----------

  function onYear(c, acct) {
    if (!acct) return [];
    ensure(c, acct);
    ledger(acct);
    const notes = [];
    const w = worldOf(acct);
    if (!w) return notes;
    // Báo ngắn gọn những biến cố lớn đã xảy ra từ lần xem trước, không chen thành lựa chọn
    const su = c.vk2.su;
    const fresh = (w.events ?? []).filter((e) => e.y > (su.seenY ?? w.year - 1) && (e.tier ?? 0) >= 2);
    su.seenY = w.year;
    for (const e of fresh.slice(-1)) notes.push({ kind: "big", t: e.t });
    return notes;
  }
  /**
   * Khi chết: phân loại. Trạng thái trong char.vk2.su mất cùng kiếp. Sự kiện thế giới và chuỗi còn lại trong thế giới.
   * Chỉ dấu vết còn mở mới theo sang sau, và phai dần. Uống canh Mạnh Bà thì phai nhanh hơn ở kiếp kế tiếp.
   */
  function onDeath(c, acct) {
    const su = c.vk2?.su;
    if (!su || !acct) return {};
    const l = ledger(acct);
    const w = worldOf(acct);
    const life = c.lifeNo ?? 0;
    su.pend = null;
    for (const x of l.traces) if (x.open && x.life < life) x.w = Math.round(x.w * TRACE_FADE);
    const faded = l.traces.filter((x) => x.open && x.w < TRACE_MIN);
    for (const x of faded) {
      x.open = false;
      x.faded = true;
    }
    const lost = w ? worldChains(w).filter((i) => su.chains[i.uid]).map((i) => i.uid) : [];
    if (w) for (const inst of worldChains(w)) if (lost.includes(inst.uid)) inst.lost = life;
    const summary = {
      ended: Object.keys(su.done).length + Object.keys(su.flags).length,
      world: (w?.events ?? []).filter((e) => (su.chains[e.uid] ?? 0) > 0).length,
      carried: l.traces.filter((x) => x.open).length,
    };
    l.lives.push({ life, ...summary, resolved: su.resolved });
    if (l.lives.length > 30) l.lives.shift();
    return { su: summary };
  }
  /** Canh Mạnh Bà đọc từ cờ thật của game (c.tanHon): quên nhanh hơn, nhưng thế giới không quên. */
  function drinkFade(c, acct) {
    const su = ensure(c, acct);
    if (su.soupDone || !c.tanHon) return;
    su.soupDone = true;
    for (const x of ledger(acct)?.traces ?? []) if (x.open && x.life < (c.lifeNo ?? 0)) x.w = Math.round(x.w * SOUP_FADE);
  }
  function tick(c, acct) {
    if (!acct || !c.vk2) return [];
    drinkFade(c, acct);
    return [];
  }

  // ---------- Nhiệm vụ ----------

  function metric(name, c, acct) {
    switch (name) {
      case "su_resolved": return c.vk2?.su?.resolved ?? 0;
      case "su_chain_join": return Object.keys(c.vk2?.su?.chains ?? {}).length;
      case "su_chain_seen": return (acct?.world?.chainHist ?? []).filter((h) => h.me && h.me[c.lifeNo ?? 0]).length;
      case "su_trace_done": return acct?.ev?.resolved ?? 0;
      default: return undefined;
    }
  }
  const QUESTS = [
    { id: "su_first", t: ["Trải qua 5 biến cố", "Live through 5 events"], goal: ["su_resolved", 5], r: { stones: 150 }, go: { tab: "chronicle" } },
    { id: "su_chain", after: "su_first", t: ["Dấn thân vào một cục diện", "Join an unfolding affair"], goal: ["su_chain_join", 1], r: { stat: { tamCanh: 2 } }, go: { tab: "chronicle" } },
    { id: "su_finish", after: "su_chain", t: ["Chứng kiến một cục diện đi tới kết thúc", "See an affair to its end"], goal: ["su_chain_seen", 1], r: { phuc: 1 }, go: { tab: "chronicle" } },
    { id: "su_karma", t: ["Giải một mối nhân quả", "Settle a karmic debt"], goal: ["su_trace_done", 1], r: { phuc: 1 }, go: { tab: "chronicle" } },
  ];

  // ---------- Dữ liệu cho giao diện ----------

  function chronicle(c, acct) {
    const w = worldOf(acct);
    const su = ensure(c, acct);
    const running = (w ? worldChains(w) : []).map((inst) => {
      const def = chains.get(inst.id);
      const st = def?.stages.find((s) => s.id === inst.st);
      return { uid: inst.uid, n: def?.n, g: def?.g, tier: def?.tier ?? 2, stage: st?.n, joined: !!su.chains[inst.uid] || !!inst.me, at: inst.at, until: inst.until, year: w.year, names: inst.names, choices: inst.choices ?? [], lost: inst.lost };
    });
    const hist = w?.chainHist ?? [];
    const mine = hist.filter((h) => h.me).slice(-8);
    const others = hist.filter((h) => !h.me).slice(-(12 - mine.length));
    const ended = [...mine, ...others].sort((p, q) => q.y - p.y).map((h) => {
      const def = chains.get(h.id);
      return { n: def?.n, end: def?.stages.find((s) => s.id === h.end)?.n, y: h.y, joined: !!h.me, names: h.names };
    });
    const people = [];
    const seen = new Set();
    for (const inst of w ? worldChains(w) : []) {
      if (!su.chains[inst.uid] && !inst.me) continue;
      for (const role of ["foe", "ally"]) {
        const id = inst.roles?.[role];
        if (id && !seen.has(id)) {
          seen.add(id);
          const n = root.VK2The?.npcOf(w, id);
          people.push({ n: n?.n ?? inst.names[role], alive: !!n, role, chain: chains.get(inst.id)?.n, r: n?.r });
        }
      }
    }
    return {
      running,
      ended,
      world: (w?.events ?? []).slice(-15).reverse(),
      people,
      journal: su.j.slice(-25).reverse(),
      traces: openTraces(acct).sort((a, b) => b.w - a.w),
      lives: (acct?.ev?.lives ?? []).slice(-5).reverse(),
    };
  }

  const api = {
    kind: "su", VERSION, GROUPS, TIERS, TIER_MARK, TIER_WEIGHT, TIER_LIFE_CAP, FIRE_CHANCE, JOURNAL_CAP, TRACE_CAP, ACTIVE_CHAINS, SCALE, LIFE_GAIN, QUESTS,
    events, chains, arcs, define, defineChain, defineArc, ensure, ledger, meets, eligible, eligibleWhy, weightOf, pick, nextEvent, eventDef, resolve, apply, trace, openTraces, resolveTrace,
    journal, onChoice, worldStep, startChain, pushWorld, cosmosEvent, onYear, onDeath, tick, metric, chronicle, npcFor, buildDef, omenIs,
  };
  root.VK2Su = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
