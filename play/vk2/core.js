// Vạn Kiếp Luân Hồi 2.0 — logic thuần: không chạm DOM, kiểm thử được bằng Node.
//
// Trạng thái gồm hai phần:
//   char.vk2  đi cùng nhân vật, được lưu bằng cơ chế save có sẵn của game.
//   acct      trạng thái theo tài khoản (luân hồi, sổ thiên phú, hằng ngày), do ui.js lưu localStorage.
(function (root) {
  "use strict";
  const D = root.VK2Data;
  const talentDef = new Map(D.TALENTS.map((t) => [t.id, t]));
  const MIN_PRACTICE_AGE = 6;
  const MAX_HISTORY = 30; // Số kiếp gần nhất giữ trong sổ luân hồi
  const FOCUS_COUNTERS = { tu_luyen: "y_tu_luyen", du_ngoan: "y_du_ngoan", kiem_tien: "y_kiem_tien", ket_duyen: "y_ket_duyen", luyen_dan: "y_luyen_dan", tru_yeu: "y_tru_yeu" };

  function newAcct() {
    return { v: 1, c: {}, claimed: {}, book: {}, deaths: 0, maxRealm: 0, seenDead: 0, daily: null, history: [] };
  }

  function normAcct(a) {
    return { ...newAcct(), ...(a && typeof a === "object" ? a : {}) };
  }

  /** Khởi tạo char.vk2. Save cũ được giữ nguyên, các nhiệm vụ đã vượt qua được ghi nhận mà không phát thưởng bù. */
  function ensure(c, acct) {
    if (c.vk2) return c.vk2;
    const v = (c.vk2 = { v: 1, c: {}, claimed: {}, talents: {}, active: [], pins: [], age: Math.floor(c.age ?? 0), realm: c.realm ?? 0, cultSeen: false });
    if ((c.age ?? 0) >= 1) {
      for (const q of D.MAIN) if (metric(q.goal[0], c, acct) >= q.goal[1]) v.claimed[q.id] = "legacy";
    }
    return v;
  }

  function hash32(n) {
    let x = (n | 0) ^ 0x9e3779b9;
    x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
  }

  /** Linh căn suy ra xác định từ dữ liệu sẵn có của nhân vật, nên áp dụng được cho cả save cũ. */
  function rootInfo(c) {
    const mul = c.linhCanMul ?? 1;
    const seed = hash32(c.lookSeed ?? 0);
    const name = String(c.linhCan ?? "");
    let count = mul >= 1.9 ? 1 : mul >= 1.6 ? 2 : mul >= 1.2 ? 3 : mul >= 0.85 ? 4 : 5;
    if (/Hỗn Độn|Chaos/i.test(name)) count = 5;
    const primary = D.GEN_CYCLE.includes(c.element) ? c.element : "kim";
    const i = D.GEN_CYCLE.indexOf(primary);
    const step = seed % 2 === 0 ? 1 : 4; // đi xuôi hay ngược vòng tương sinh
    const elements = [];
    for (let k = 0; k < count; k++) elements.push(D.GEN_CYCLE[(i + k * step) % 5]);
    const variantKeys = Object.keys(D.ROOT_VARIANTS);
    const variant = count <= 2 && seed % 17 === 0 ? variantKeys[(seed >>> 8) % variantKeys.length] : null;
    const affinity = D.PATH_AFFINITY[c.path];
    return { count, elements, primary, variant, form: D.ROOT_FORMS[count], affine: !!affinity && affinity.some((e) => elements.includes(e)) };
  }

  /** Giá trị hiện tại của một chỉ số mục tiêu. Mọi chỉ số đều đọc từ trạng thái game thật. */
  function metric(name, c, acct) {
    const v = c.vk2;
    const st = c.stats ?? {};
    switch (name) {
      case "has_qi": return (c.cultivation ?? 0) > 0 || (c.realm ?? 0) >= 1 ? 1 : 0;
      case "qi_layer": return c.realm === 1 ? (c.layer ?? 0) : (c.realm ?? 0) > 1 ? 9 : 0;
      case "realm": return c.realm ?? 0;
      case "cp": return c.cp?.own?.length ?? 0;
      case "path": return c.path ? 1 : 0;
      case "bond": return c.partner || c.pet ? 1 : 0;
      case "pet": return c.pet ? 1 : 0;
      case "stones": return Math.floor(c.linhThach ?? 0);
      case "age": return Math.floor(c.age ?? 0);
      case "tamCanh": return st.tamCanh ?? 0;
      case "tamma_ok": return (st.tamMa ?? 100) <= 30 ? 1 : 0;
      case "pills": return Object.values(c.pills ?? {}).reduce((s, n) => s + (n > 0 ? n : 0), 0);
      case "evil": return (c.daoTam ?? 0) <= -30 ? 1 : 0;
      case "good": return (c.daoTam ?? 0) >= 30 ? 1 : 0;
      case "root_count": return rootInfo(c).count;
      case "lives": return acct?.lives ?? 0;
      case "lore": return acct?.lore ?? 0;
      case "a_deaths": return acct?.deaths ?? 0;
      case "a_maxRealm": return Math.max(acct?.maxRealm ?? 0, c.realm ?? 0);
      case "a_kills": return acct?.c?.kills ?? 0;
      case "revenge": return Math.max(acct?.c?.revenge ?? 0, c.qf?.revenge ?? 0);
      default:
        if (name.startsWith("path_")) return c.path === name.slice(5) ? 1 : 0;
        return v?.c?.[name] ?? 0;
    }
  }

  function dailyMetric(name, acct) {
    return acct?.daily?.c?.[name] ?? 0;
  }

  // ---------- Thiên phú ----------

  function talentThreshold(def, level) {
    const base = D.LEVEL_XP[level - 1];
    return base === undefined ? Infinity : Math.round(base * D.QUALITY[def.q].xpMul);
  }

  function addXp(c, id, n) {
    const t = c.vk2.talents[id];
    if (!t || !c.vk2.active.includes(id) || t.lv >= 5) return;
    const mul = rootInfo(c).affine ? D.AFFINITY.xpMul : 1;
    t.xp = Math.min(talentThreshold(talentDef.get(id), t.lv), t.xp + n * mul);
  }

  /** Cộng bộ đếm hành vi, và chỉ thiên phú đang vận hành mới hưởng kinh nghiệm. */
  function bump(c, acct, name, n = 1) {
    const v = ensure(c, acct);
    v.c[name] = (v.c[name] ?? 0) + n;
    if (acct) {
      if (name === "kills") acct.c.kills = (acct.c.kills ?? 0) + n;
      if (acct.daily) acct.daily.c[name] = (acct.daily.c[name] ?? 0) + n;
    }
    for (const id of v.active) {
      const w = talentDef.get(id)?.xp?.[name];
      if (w) addXp(c, id, w * n);
    }
  }

  function canAwaken(def, c, acct) {
    return def.awake.every(([m, n]) => metric(m, c, acct) >= n);
  }

  /** Thức tỉnh mọi thiên phú đủ điều kiện, trừ khi đã chạm giới hạn số thiên phú mỗi kiếp. */
  function checkAwaken(c, acct) {
    const v = ensure(c, acct);
    const woken = [];
    for (const def of D.TALENTS) {
      if (v.talents[def.id]) continue;
      if (Object.keys(v.talents).length >= D.MAX_AWAKENED) break;
      if (!canAwaken(def, c, acct)) continue;
      // Sổ thiên phú kiếp trước cho lợi thế khởi đầu có giới hạn: mỗi bậc cũ 25%, tối đa 75% lên bậc 2.
      const past = acct?.book?.[def.id] ?? 0;
      const head = Math.min(0.75, past * 0.25) * talentThreshold(def, 1);
      v.talents[def.id] = { lv: 1, xp: Math.round(head), branch: null };
      if (v.active.length < D.slotsFor(c.realm ?? 0)) v.active.push(def.id);
      woken.push(def.id);
    }
    return woken;
  }

  function setActive(c, acct, id, on) {
    const v = ensure(c, acct);
    if (!v.talents[id]) return false;
    if (!on) {
      v.active = v.active.filter((x) => x !== id);
      return true;
    }
    if (v.active.includes(id)) return true;
    if (v.active.length >= D.slotsFor(c.realm ?? 0)) return false;
    v.active.push(id);
    return true;
  }

  function canLevelUp(c, id) {
    const t = c.vk2?.talents?.[id];
    const def = talentDef.get(id);
    return !!t && !!def && t.lv < 5 && t.xp >= talentThreshold(def, t.lv) && !needsBranch(c, id);
  }

  function needsBranch(c, id) {
    const t = c.vk2?.talents?.[id];
    const def = talentDef.get(id);
    return !!t && !!def?.branch && t.lv >= def.branch.at && !t.branch;
  }

  /** Lên bậc tiêu hao kinh nghiệm, nên gọi lặp lại cũng không lên thêm khi chưa đủ. */
  function levelUp(c, id) {
    if (!canLevelUp(c, id)) return false;
    const t = c.vk2.talents[id];
    t.xp -= talentThreshold(talentDef.get(id), t.lv);
    t.lv += 1;
    return true;
  }

  function chooseBranch(c, id, branchId) {
    const t = c.vk2?.talents?.[id];
    const def = talentDef.get(id);
    if (!needsBranch(c, id) || !def.branch.opts.some((o) => o.id === branchId)) return false;
    t.branch = branchId;
    return true;
  }

  function talentFx(def, lv, branchId) {
    const fx = { ...(def.fx[Math.max(0, lv - 1)] ?? {}) };
    const b = branchId && def.branch?.opts.find((o) => o.id === branchId);
    if (b) for (const [k, x] of Object.entries(b.fx)) fx[k] = (fx[k] ?? 0) + x;
    return fx;
  }

  // ---------- Hiệu ứng lên chỉ số ----------

  function softcap(x, cap) {
    return x <= 0 ? x : cap * (1 - Math.exp(-x / cap));
  }

  /** Tổng hợp linh căn và thiên phú đang vận hành. Phần dương đi qua softcap, phần trừ giữ nguyên. */
  function totals(c) {
    const pos = { atk: 0, def: 0, hp: 0, cult: 0, brk: 0 };
    const neg = { atk: 0, def: 0, hp: 0, cult: 0, brk: 0 };
    const add = (fx) => {
      for (const [k, x] of Object.entries(fx)) if (k in pos) (x >= 0 ? pos : neg)[k] += x;
    };
    const r = rootInfo(c);
    add(r.form.fx);
    if (r.variant) add(D.ROOT_VARIANTS[r.variant].fx);
    if (r.affine) add({ cult: D.AFFINITY.cult });
    const v = c.vk2;
    if (v) {
      for (const id of v.active) {
        const t = v.talents[id];
        const def = talentDef.get(id);
        if (t && def) add(talentFx(def, t.lv, t.branch));
      }
    }
    const out = {};
    for (const k of Object.keys(pos)) out[k] = softcap(pos[k], D.SOFTCAP[k]) + neg[k];
    return out;
  }

  function prepBonus(c) {
    const v = c.vk2;
    if (!v) return 0;
    const target = (c.realm ?? 0) + 1;
    let n = 0;
    for (const q of D.REALM) if (q.target === target && v.claimed[q.id]) n++;
    return n * D.PREP_BONUS;
  }

  const cultMul = (c) => Math.max(0.1, 1 + totals(c).cult);
  const breakBonus = (c) => totals(c).brk + prepBonus(c);
  function statMul(c, s) {
    const t = totals(c);
    return { hp: s.hp * Math.max(0.1, 1 + t.hp), atk: s.atk * Math.max(0.1, 1 + t.atk), def: s.def * Math.max(0.1, 1 + t.def) };
  }

  // ---------- Hằng ngày ----------

  function dayKey(now) {
    const d = new Date(now);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /** Đổi ngày thì đặt lại tiến trình và chọn 3 việc xác định theo ngày. */
  function ensureDaily(acct, now) {
    const day = dayKey(now);
    if (acct.daily?.day === day) return acct.daily;
    let h = 0;
    for (const ch of day) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
    const pool = D.DAILY_POOL.map((q) => q.id);
    const picks = [];
    let s = hash32(h);
    while (picks.length < D.DAILY_COUNT) {
      const id = pool[s % pool.length];
      if (!picks.includes(id)) picks.push(id);
      s = hash32(s + 1);
    }
    acct.daily = { day, quests: picks, c: {}, claimed: {} };
    return acct.daily;
  }

  // ---------- Danh sách nhiệm vụ ----------

  function statusOf(cur, need, claimed, locked) {
    if (claimed) return "claimed";
    if (locked) return "locked";
    return cur >= need ? "complete" : "active";
  }

  /** Trả về danh sách nhiệm vụ đã tính trạng thái, không làm thay đổi dữ liệu. */
  function listQuests(c, acct, now) {
    const v = ensure(c, acct);
    const out = [];
    const realm = c.realm ?? 0;
    for (const q of D.MAIN) {
      const cur = metric(q.goal[0], c, acct);
      const locked = !!q.after && !v.claimed[q.after];
      out.push({ ...q, kind: "main", cur: Math.min(cur, q.goal[1]), need: q.goal[1], status: statusOf(cur, q.goal[1], v.claimed[q.id], locked) });
    }
    for (const q of D.REALM) {
      if (q.target !== realm + 1) continue; // Chỉ hiện nhiệm vụ chuẩn bị của cảnh giới kế tiếp
      const cur = metric(q.goal[0], c, acct);
      out.push({ ...q, kind: "realm", r: { prep: 1 }, cur: Math.min(cur, q.goal[1]), need: q.goal[1], status: statusOf(cur, q.goal[1], v.claimed[q.id], false) });
    }
    for (const id of v.active) {
      const t = v.talents[id];
      const def = talentDef.get(id);
      if (!t || !def || t.lv >= 5) continue;
      const need = talentThreshold(def, t.lv);
      const cur = Math.min(Math.floor(t.xp), need);
      const blocked = needsBranch(c, id);
      out.push({
        id: `t:${id}`, kind: "talent", talent: id, need, cur,
        t: [`${def.n[0]}: thăng bậc ${t.lv + 1}`, `${def.n[1]}: rise to rank ${t.lv + 1}`],
        r: { rank: t.lv + 1 }, go: { tab: "talents" }, blocked,
        status: !blocked && cur >= need ? "complete" : "active",
      });
    }
    const daily = ensureDaily(acct, now);
    for (const id of daily.quests) {
      const q = D.DAILY_POOL.find((x) => x.id === id);
      const cur = dailyMetric(q.goal[0], acct);
      out.push({ ...q, kind: "daily", r: dailyReward(c), cur: Math.min(cur, q.goal[1]), need: q.goal[1], status: statusOf(cur, q.goal[1], daily.claimed[id], false) });
    }
    for (const q of D.LIFE) {
      const cur = metric(q.goal[0], c, acct);
      const locked = !!q.after && !acct.claimed[q.after];
      out.push({ ...q, kind: "life", cur: Math.min(cur, q.goal[1]), need: q.goal[1], status: statusOf(cur, q.goal[1], acct.claimed[q.id], locked) });
    }
    return out;
  }

  function dailyReward(c) {
    return { stones: D.DAILY_REWARD.stonesPerRealm * (1 + (c.realm ?? 0)), txp: D.DAILY_REWARD.txp };
  }

  /** Tối đa 3 nhiệm vụ theo dõi: ưu tiên đã ghim, kế đến việc chờ nhận thưởng, rồi theo độ ưu tiên từng loại. */
  function tracked(list, pins = [], max = 3) {
    const open = list.filter((q) => q.status === "active" || q.status === "complete");
    const rank = { main: 0, talent: 1, realm: 2, daily: 3, life: 4 };
    const score = (q) => (pins.includes(q.id) ? -100 : 0) + (q.status === "complete" ? -10 : 0) + rank[q.kind];
    return open
      .map((q, i) => [score(q), i, q])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .slice(0, max)
      .map((x) => x[2]);
  }

  /** Áp phần thưởng. `ctx.rate(c)` trả về tu vi một năm; `ctx.addPhuc(n)` cộng phúc duyên vào meta của game. */
  function applyReward(c, r, ctx) {
    if (!r) return;
    if (r.stones) c.linhThach = (c.linhThach ?? 0) + r.stones;
    if (r.stat) for (const [k, n] of Object.entries(r.stat)) c.stats[k] = Math.max(0, Math.min(100, (c.stats[k] ?? 0) + n));
    if (r.cultY) {
      const rate = ctx?.rate?.(c) ?? 0;
      if (rate > 0) c.cultivation = (c.cultivation ?? 0) + Math.round(rate * r.cultY);
    }
    if (r.txp) for (const id of c.vk2?.active ?? []) addXp(c, id, r.txp);
    if (r.phuc) ctx?.addPhuc?.(r.phuc);
  }

  /** Nhận thưởng. Đánh dấu đã nhận trước khi phát thưởng, nên chỉ có tác dụng đúng một lần. */
  function claim(c, acct, id, now, ctx) {
    const q = listQuests(c, acct, now).find((x) => x.id === id);
    if (!q || q.status !== "complete") return null;
    if (q.kind === "talent") return levelUp(c, q.talent) ? q : null;
    if (q.kind === "daily") acct.daily.claimed[id] = 1;
    else if (q.kind === "life") acct.claimed[id] = 1;
    else c.vk2.claimed[id] = 1;
    applyReward(c, q.r, ctx);
    return q;
  }

  function togglePin(c, acct, id, max = 3) {
    const v = ensure(c, acct);
    if (v.pins.includes(id)) v.pins = v.pins.filter((x) => x !== id);
    else if (v.pins.length < max) v.pins = [...v.pins, id];
    else return false;
    return true;
  }

  // ---------- Vòng cập nhật ----------

  /** Cập nhật theo độ chênh của tuổi, nên gọi lại nhiều lần cũng không đếm trùng năm. */
  function tick(c, acct, now) {
    const v = ensure(c, acct);
    ensureDaily(acct, now);
    const year = Math.floor(c.age ?? 0);
    if (year > v.age && !c.dead) {
      const n = year - v.age;
      const counted = year - Math.max(v.age, MIN_PRACTICE_AGE - 1); // Những năm còn quá nhỏ không tính là tu hành
      v.age = year;
      if (counted > 0) {
        const counter = FOCUS_COUNTERS[c.focus];
        if (counter) bump(c, acct, counter, counted);
        if (c.focus === "tu_luyen") {
          if (c.sect) bump(c, acct, "y_sect", counted);
          if ((c.stats?.tamMa ?? 100) <= 30) bump(c, acct, "y_calm", counted);
        }
      }
      for (const id of v.active) {
        const py = talentDef.get(id)?.perYear;
        if (!py) continue;
        for (const [k, x] of Object.entries(py)) c.stats[k] = Math.max(0, Math.min(100, (c.stats[k] ?? 0) + x * n));
      }
    }
    if ((c.realm ?? 0) > v.realm) v.realm = c.realm;
    if ((c.realm ?? 0) > (acct.maxRealm ?? 0)) acct.maxRealm = c.realm;
    if ((c.qf?.revenge ?? 0) > (acct.c.revenge ?? 0)) acct.c.revenge = c.qf.revenge;
    const woken = c.dead ? [] : checkAwaken(c, acct);
    const died = c.dead && recordDeath(c, acct);
    return { woken, died };
  }

  /** Ghi sổ thiên phú một lần cho mỗi kiếp, nền cho hệ luân hồi ở giai đoạn sau. */
  function recordDeath(c, acct) {
    const life = c.lifeNo ?? 0;
    if (life <= (acct.seenDead ?? 0)) return false;
    acct.seenDead = life;
    acct.deaths = (acct.deaths ?? 0) + 1;
    for (const [id, t] of Object.entries(c.vk2?.talents ?? {})) acct.book[id] = Math.max(acct.book[id] ?? 0, t.lv);
    acct.history = [
      ...(acct.history ?? []),
      {
        life, name: c.name ?? "", realm: c.realm ?? 0, layer: c.layer ?? 0, age: Math.floor(c.age ?? 0), path: c.path ?? null,
        cause: typeof c.cause === "string" ? c.cause : null, kills: c.vk2?.c?.kills ?? 0,
        talents: Object.entries(c.vk2?.talents ?? {}).map(([id, t]) => [id, t.lv]),
      },
    ].slice(-MAX_HISTORY);
    return true;
  }

  /**
   * Tóm tắt hướng phát triển của nhân vật từ dữ liệu đã có: thời gian dành cho từng việc,
   * mục tiêu kế tiếp và thiên phú sắp thức tỉnh.
   */
  function journey(c, acct, now) {
    const v = ensure(c, acct);
    const activities = Object.keys(D.ACTIVITY_LABELS)
      .map((k) => ({ key: k, years: v.c[k] ?? 0 }))
      .filter((x) => x.years > 0)
      .sort((a, b) => b.years - a.years);
    const totalYears = activities.reduce((s, x) => s + x.years, 0);
    const quests = listQuests(c, acct, now);
    const next = quests.find((q) => q.kind === "main" && q.status === "complete") ?? quests.find((q) => q.kind === "main" && q.status === "active") ?? null;
    const near = D.TALENTS.filter((d) => !v.talents[d.id])
      .map((d) => ({ id: d.id, pct: d.awake.reduce((s, [m, n]) => s + Math.min(metric(m, c, acct), n) / n, 0) / d.awake.length }))
      .filter((x) => x.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
    const daoTam = c.daoTam ?? 0;
    return {
      activities, totalYears, next, near,
      kills: v.c.kills ?? 0,
      lean: daoTam >= 30 ? "chinh" : daoTam <= -30 ? "ta" : "trung",
      breakBonus: breakBonus(c),
      claimable: quests.filter((q) => q.status === "complete").length,
    };
  }

  /** Lọc nhật ký gốc của game, mới nhất trước. */
  function logEntries(c, filter) {
    const tones = { milestone: ["big"], good: ["good", "chinh"], bad: ["bad", "ta"] }[filter];
    const all = Array.isArray(c.log) ? c.log : [];
    return (tones ? all.filter((e) => tones.includes(e.tone)) : all).slice().reverse();
  }

  function onKill(c, acct) {
    bump(c, acct, "kills");
    if (c.path) bump(c, acct, `kills_${c.path}`);
  }

  root.VK2Core = {
    newAcct, normAcct, ensure, rootInfo, metric, bump, onKill, tick, listQuests, tracked, claim, togglePin,
    checkAwaken, canAwaken, setActive, canLevelUp, needsBranch, levelUp, chooseBranch, talentFx, talentThreshold,
    journey, logEntries, totals, softcap, cultMul, breakBonus, statMul, prepBonus, dayKey, ensureDaily, talentDef,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
