// Vạn Kiếp Luân Hồi 2.0 — cầu nối với game và giao diện nhiệm vụ, thiên phú, linh căn.
// Mọi hook đều bọc try/catch và trả giá trị trung tính: lỗi của mod không được làm hỏng game gốc.
(function () {
  "use strict";
  const C = globalThis.VK2Core;
  const D = globalThis.VK2Data;
  const K = globalThis.VK2Can;
  const BASE = globalThis.__VK2_BASE ?? ""; // Tiền tố khi site nằm trong thư mục con, ví dụ GitHub Pages
  let bridge = null;
  let nM = null;
  let acctCache = null;
  let acctKey = null;
  let lastHtml = "";
  let modal = null; // { tab } khi bảng đang mở
  let wasRunning = null;
  let builder = null; // Hàm dựng sự kiện của game (nD), nhận từ bản vá
  let testAcct = null; // Mô phỏng dùng tài khoản riêng, không đụng save thật
  const toastSeen = new Set();
  let toastLife = null;
  let flashTimer = 0;
  const MAX_TOASTS = 4;

  const lang = () => {
    try {
      return localStorage.getItem("vkl.lang") === "en" ? 1 : 0;
    } catch {
      return 0;
    }
  };
  const L = (pair) => (Array.isArray(pair) ? pair[lang()] : pair);
  const T = (vi, en) => (lang() ? en : vi);
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
  const fmt = (n) => Number(n).toLocaleString(lang() ? "en-US" : "vi-VN");

  // ---------- Lưu trữ tài khoản ----------

  function storeKey() {
    const name = bridge?.user?.username;
    return `vk2.acct.${name ? `u.${name}` : "guest"}`;
  }

  function acct() {
    if (testAcct) return testAcct;
    const key = storeKey();
    if (acctCache && acctKey === key) return syncMeta(acctCache);
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) || "null");
    } catch {}
    acctCache = C.normAcct(saved);
    acctKey = key;
    return syncMeta(acctCache);
  }

  function syncMeta(a) {
    const m = bridge?.metaRef?.current;
    if (m) {
      a.lives = m.lives ?? 0;
      a.lore = m.lore?.length ?? 0;
      a.mv = { p: m.phucDuyen ?? 0, n: m.nghiep ?? 0, k: m.kiepSo ?? 0, h: m.hon?.v ?? 0, e: Object.keys(m.endings ?? {}).length, d: m.noDrink ?? 0 };
    }
    return a;
  }

  let lastSavedAcct = "";
  function saveAcct() {
    if (!acctCache) return;
    const s = JSON.stringify(acctCache);
    if (s === lastSavedAcct) return;
    try {
      localStorage.setItem(acctKey, s);
      lastSavedAcct = s;
    } catch {}
  }

  // Nhân vật được game lưu khi rời trang, nên tài khoản phải lưu cùng lúc, nếu không sự kiện đang chờ sẽ trỏ tới một thế giới cũ hơn nó.
  globalThis.addEventListener?.("pagehide", saveAcct);

  const char = () => bridge?.charRef?.current ?? null;

  const rewardCtx = () => ({
    rate: (c) => (nM ? nM(c) : 0),
    addPhuc: (n) => {
      const m = bridge?.metaRef?.current;
      if (!m) return;
      const next = { ...m, phucDuyen: (m.phucDuyen ?? 0) + n };
      bridge.metaRef.current = next;
      bridge.setMeta(next);
      bridge.saveMeta(next);
    },
  });

  function commit() {
    saveAcct();
    try {
      bridge?.save?.(true);
      bridge?.rerender?.();
    } catch {}
    render(true);
  }

  // ---------- Văn bản phần thưởng và hiệu ứng ----------

  const STAT_NAMES = { ngoTinh: ["ngộ tính", "Insight"], tamCanh: ["tâm cảnh", "Mind State"], khiVan: ["khí vận", "Luck"] };

  function rewardText(r) {
    if (!r) return "";
    const out = [];
    if (r.stones) out.push(T(`${fmt(r.stones)} linh thạch`, `${fmt(r.stones)} stones`));
    if (r.cultY) out.push(T(`tu vi ${r.cultY} năm`, `${r.cultY} yr cultivation`));
    if (r.stat) for (const [k, n] of Object.entries(r.stat)) out.push(`+${n} ${L(STAT_NAMES[k] ?? [k, k])}`);
    if (r.txp) out.push(T(`${r.txp} kinh nghiệm thiên phú`, `${r.txp} talent XP`));
    if (r.phuc) out.push(T(`${r.phuc} phúc duyên`, `${r.phuc} Fortune`));
    if (r.prep) out.push(T(`đột phá +${Math.round(D.PREP_BONUS * 100)}%`, `breakthrough +${Math.round(D.PREP_BONUS * 100)}%`));
    if (r.rank) out.push(T(`lên bậc ${r.rank}`, `rank ${r.rank}`));
    return out.join(", ");
  }

  const FX_NAMES = { atk: ["Công", "Attack"], def: ["Phòng", "Defence"], hp: ["Sinh lực", "HP"], cult: ["Tốc độ tu", "Cultivation"], brk: ["Đột phá", "Breakthrough"] };
  function fxText(fx) {
    return Object.entries(fx)
      .map(([k, x]) => `${L(FX_NAMES[k])} ${x > 0 ? "+" : ""}${Math.round(x * 1000) / 10}%`)
      .join(", ");
  }

  // ---------- Bảng theo dõi ----------

  function goButton(q) {
    if (!q.go) return "";
    return `<button class="vk2-btn" data-act="go" data-id="${esc(q.id)}">${T("Đi đến", "Go")}</button>`;
  }

  function questRow(q) {
    const pct = q.need > 0 ? Math.round((q.cur / q.need) * 100) : 0;
    const done = q.status === "complete";
    return `<div class="vk2-q ${done ? "is-done" : ""}">
      <div class="vk2-q-top"><b class="vk2-q-name">${esc(L(q.t))}</b><span class="vk2-q-num">${fmt(q.cur)}/${fmt(q.need)}</span></div>
      <div class="vk2-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${q.need}" aria-valuenow="${q.cur}"><i style="width:${pct}%"></i></div>
      <div class="vk2-q-bot"><small>${T("Thưởng", "Reward")}: ${esc(rewardText(q.r))}</small>${
        done
          ? `<button class="vk2-btn vk2-claim" data-act="claim" data-id="${esc(q.id)}">${q.kind === "talent" ? T("Thăng bậc", "Rise") : T("Nhận thưởng", "Claim")}</button>`
          : q.blocked
            ? `<button class="vk2-btn" data-act="tab" data-tab="talents">${T("Chọn nhánh", "Pick branch")}</button>`
            : goButton(q)
      }</div></div>`;
  }

  /** Mặc định chỉ một dòng, để nhật ký gốc của game luôn có chỗ. Mở ra thì phủ tạm lên nhật ký. */
  function collapsedPref() {
    try {
      return localStorage.getItem("vk2.hudOpen") !== "1";
    } catch {
      return true;
    }
  }

  /** Khi game đang chờ chọn sự kiện, bảng luôn chỉ còn một dòng để lựa chọn không bị đẩy khỏi màn hình. */
  const eventPending = () => !!document.querySelector(".game.has-event");

  function hudHtml(c, a, now) {
    const list = C.listQuests(c, a, now);
    const top = C.tracked(list, c.vk2.pins);
    const ready = list.filter((q) => q.status === "complete").length;
    const inEvent = eventPending();
    // Xoay ngang thì không đủ chiều cao cho danh sách: CSS đưa bảng ra lề, ở đây giữ dạng nút.
    const collapsed = inEvent || innerHeight <= 520 || collapsedPref();
    const next = top[0];
    const summary = next ? `<span class="vk2-hud-next">${esc(L(next.t))} <i>${fmt(next.cur)}/${fmt(next.need)}</i></span>` : "";
    const pending = K.ensure(c, a).pending;
    return `<div class="vk2-hud-head">
        <button class="vk2-link vk2-hud-toggle" data-act="collapse" aria-expanded="${!collapsed}" ${inEvent ? "disabled" : ""}><b>${T("Mục tiêu", "Goals")}</b>${ready ? ` <em>${ready}</em>` : ""} <span>${collapsed ? "▸" : "▾"}</span>${collapsed ? summary : ""}</button>
        <span class="vk2-hud-tabs">
          <button class="vk2-btn" data-act="tab" data-tab="journey">${T("Hành trình", "Journey")}</button>
          <button class="vk2-btn" data-act="tab" data-tab="talents">${T("Thiên phú", "Talents")}</button>
          ${pending ? `<button class="vk2-btn vk2-claim" data-act="tab" data-tab="can" aria-label="${pending.kind === "dao" ? T("Đúc đạo cơ", "Forge your Dao Foundation") : T("Ngưng Kim Đan", "Condense your Golden Core")}">${pending.kind === "dao" ? T("Đúc", "Forge") : T("Ngưng", "Core")}</button>` : ""}
        </span>
      </div>
      ${collapsed ? "" : `<div class="vk2-hud-list">${top.map(questRow).join("") || `<small>${T("Chưa có mục tiêu mới.", "No new goals.")}</small>`}<button class="vk2-btn" data-act="tab" data-tab="quests">${T("Xem toàn bộ nhiệm vụ", "All quests")}</button></div>`}`;
  }

  // ---------- Bảng lớn ----------

  function journalHtml(c, a, now) {
    const list = C.listQuests(c, a, now);
    const groups = [
      ["main", T("Chính tuyến", "Main story")],
      ["realm", T("Chuẩn bị đột phá", "Breakthrough preparation")],
      ["can", T("Căn cơ", "Foundation")],
      ["dao", T("Ngộ đạo và cơ duyên", "Insight and fortunes")],
      ["khi", T("Luyện khí và động phủ", "Crafting and abode")],
      ["the", T("Sư đồ, gia tộc, tông môn", "Mentors, clans, sects")],
      ["phap", T("Tâm ma và Đại Đạo", "Demons and the Dao")],
      ["menh", T("Thiên Mệnh và nhân quả", "Destiny and karma")],
      ["su", T("Thiên Hạ Ký Sự", "World Chronicle")],
      ["talent", T("Thiên phú", "Talents")],
      ["daily", T("Hằng ngày", "Daily")],
      ["life", T("Luân hồi (qua nhiều kiếp)", "Samsara (across lives)")],
    ];
    let html = "";
    for (const [kind, title] of groups) {
      const qs = list.filter((q) => q.kind === kind);
      const open = qs.filter((q) => q.status === "active" || q.status === "complete");
      const closed = qs.filter((q) => q.status === "claimed");
      html += `<h3>${esc(title)} <small>${closed.length}/${qs.length}</small></h3>`;
      if (kind === "main" && open[0]?.ch) html += `<p class="vk2-note">${T("Chương", "Chapter")} ${open[0].ch}: ${esc(L(D.CHAPTERS[open[0].ch]))}</p>`;
      if (kind === "daily") html += `<p class="vk2-note">${T("Đặt lại khi đổi ngày. Nhiệm vụ Thiên Tượng của game vẫn ở bảng riêng.", "Resets daily. The game's Celestial Signs quests stay on their own board.")} <button class="vk2-link" data-act="panel" data-panel="today">${T("Mở", "Open")}</button></p>`;
      if (!open.length) html += `<p class="vk2-note">${T("Không có việc đang mở.", "Nothing open.")}</p>`;
      for (const q of open) {
        const pinned = c.vk2.pins.includes(q.id);
        html += `<div class="vk2-q-wrap">${questRow(q)}<button class="vk2-pin ${pinned ? "on" : ""}" data-act="pin" data-id="${esc(q.id)}" aria-pressed="${pinned}" title="${T("Ghim lên bảng theo dõi", "Pin to tracker")}">${pinned ? "★" : "☆"}</button></div>`;
      }
      if (closed.length) {
        html += `<details class="vk2-closed"><summary>${T("Đã hoàn thành", "Completed")} (${closed.length})</summary><ul>${closed.map((q) => `<li>${esc(L(q.t))}</li>`).join("")}</ul></details>`;
      }
    }
    const locked = list.filter((q) => q.status === "locked").length;
    if (locked) html += `<p class="vk2-note">${T(`Còn ${locked} nhiệm vụ chưa mở khóa.`, `${locked} more quests are still locked.`)}</p>`;
    return html;
  }

  function talentCard(c, a, def) {
    const v = c.vk2;
    const t = v.talents[def.id];
    const q = D.QUALITY[def.q];
    const icon = `<img class="vk2-ic" src="${BASE}/icons/${esc(def.icon)}.png" alt="" width="32" height="32">`;
    const head = `<div class="vk2-t-head">${icon}<div><b>${esc(L(def.n))}</b> <span class="vk2-qual ${q.cls}">${esc(L(q.n))}</span>${t ? ` <small>${T("Bậc", "Rank")} ${t.lv}/5</small>` : ""}</div></div>`;
    if (!t) {
      const parts = def.awake.map(([m, n]) => Math.min(C.metric(m, c, a), n) / n);
      const pct = Math.round((parts.reduce((s, x) => s + x, 0) / parts.length) * 100);
      const past = a.book?.[def.id];
      return `<div class="vk2-t locked">${head}<p>${esc(L(def.d))}</p>
        <small>${T("Điều kiện thức tỉnh", "Awakening")}: ${esc(L(def.how))}</small>
        <div class="vk2-bar"><i style="width:${pct}%"></i></div>
        <small>${T("Bậc 1", "Rank 1")}: ${esc(fxText(C.talentFx(def, 1)))}</small>
        ${past ? `<small class="vk2-past">${T(`Kiếp trước từng đạt bậc ${past}: thức tỉnh lại sẽ có sẵn kinh nghiệm.`, `Reached rank ${past} in a past life: you will start with some XP.`)}</small>` : ""}</div>`;
    }
    const on = v.active.includes(def.id);
    const need = C.talentThreshold(def, t.lv);
    const atMax = t.lv >= 5;
    const pct = atMax ? 100 : Math.round((Math.min(t.xp, need) / need) * 100);
    const cur = C.talentFx(def, t.lv, t.branch);
    const nextFx = atMax ? null : C.talentFx(def, t.lv + 1, t.branch);
    const slots = D.slotsFor(c.realm ?? 0);
    const canOn = on || v.active.length < slots;
    let branch = "";
    if (def.branch && t.lv >= def.branch.at) {
      branch = t.branch
        ? `<small>${T("Nhánh", "Branch")}: ${esc(L(def.branch.opts.find((o) => o.id === t.branch).n))}</small>`
        : `<div class="vk2-branch"><b>${T("Chọn nhánh tiến hóa (không đổi lại được):", "Pick an evolution (permanent):")}</b>${def.branch.opts
            .map((o) => `<button class="vk2-btn" data-act="branch" data-id="${esc(def.id)}" data-branch="${esc(o.id)}"><b>${esc(L(o.n))}</b><small>${esc(L(o.d))}</small></button>`)
            .join("")}</div>`;
    }
    return `<div class="vk2-t ${on ? "on" : ""}">${head}<p>${esc(L(def.d))}</p>
      <div class="vk2-bar"><i style="width:${pct}%"></i></div>
      <small>${atMax ? T("Đã đạt bậc tối đa", "Max rank") : `${fmt(Math.floor(Math.min(t.xp, need)))}/${fmt(need)} ${T("kinh nghiệm", "XP")}${on ? "" : T(" (chỉ tăng khi vận hành)", " (grows only while active)")}`}</small>
      <small>${T("Hiện tại", "Now")}: ${esc(fxText(cur))}</small>
      ${nextFx ? `<small>${T("Bậc kế", "Next")}: ${esc(fxText(nextFx))}</small>` : ""}
      ${branch}
      <div class="vk2-t-act">
        <button class="vk2-btn" data-act="toggle" data-id="${esc(def.id)}" ${canOn ? "" : "disabled"}>${on ? T("Ngừng vận hành", "Deactivate") : T("Vận hành", "Activate")}</button>
        ${C.canLevelUp(c, def.id) ? `<button class="vk2-btn vk2-claim" data-act="level" data-id="${esc(def.id)}">${T("Thăng bậc", "Rise")}</button>` : ""}
      </div></div>`;
  }

  function talentsHtml(c, a) {
    const v = c.vk2;
    const slots = D.slotsFor(c.realm ?? 0);
    const woken = Object.keys(v.talents).length;
    const t = C.totals(c);
    const sum = Object.entries(t).filter(([, x]) => Math.abs(x) >= 0.001);
    const defs = [...D.TALENTS].sort((x, y) => (v.talents[y.id] ? 1 : 0) - (v.talents[x.id] ? 1 : 0));
    return `<p class="vk2-note">${T("Đang vận hành", "Active")}: <b>${v.active.length}/${slots}</b> · ${T("Đã thức tỉnh", "Awakened")}: <b>${woken}/${D.MAX_AWAKENED}</b>. ${T("Ô vận hành mở thêm ở Trúc Cơ và Nguyên Anh.", "More slots open at Foundation and Nascent Soul.")}</p>
      <p class="vk2-note">${T("Tổng hiệu ứng (đã tính trần giảm dần)", "Total effect (after diminishing returns)")}: ${esc(sum.length ? fxText(Object.fromEntries(sum)) : T("chưa có", "none"))}</p>
      <div class="vk2-t-grid">${defs.map((d) => talentCard(c, a, d)).join("")}</div>`;
  }

  function rootHtml(c) {
    const r = C.rootInfo(c);
    const pathAff = c.path ? D.PATH_AFFINITY[c.path] : null;
    return `<div class="vk2-root">
      <h3>${esc(c.linhCan ?? "")} <small>${T("hệ số hấp thu", "absorption")} ×${c.linhCanMul ?? 1}</small></h3>
      <div class="vk2-els">${["kim", "moc", "thuy", "hoa", "tho"].map((e) => `<span class="vk2-el el-${e} ${r.elements.includes(e) ? "has" : ""}">${esc(L(D.ELEMENTS[e]))}</span>`).join("")}</div>
      <p><b>${esc(L(r.form.n))}</b>: ${esc(L(r.form.d))}</p>
      ${r.variant ? `<p><b>${esc(L(D.ROOT_VARIANTS[r.variant].n))}</b>: ${esc(L(D.ROOT_VARIANTS[r.variant].d))}</p>` : ""}
      <p>${
        c.path
          ? r.affine
            ? T(`Đạo lộ hiện tại hợp linh căn: tốc độ tu +${D.AFFINITY.cult * 100}%, kinh nghiệm thiên phú ×${D.AFFINITY.xpMul}.`, `Your path suits this root: cultivation +${D.AFFINITY.cult * 100}%, talent XP ×${D.AFFINITY.xpMul}.`)
            : T(`Đạo lộ hiện tại cần ${pathAff ? pathAff.map((e) => L(D.ELEMENTS[e])).join(T(" hoặc ", " or ")) : ""} để được cộng hưởng.`, `Your path needs ${pathAff ? pathAff.map((e) => L(D.ELEMENTS[e])).join(" or ") : ""} to resonate.`)
          : T("Chưa chọn đạo lộ. Đạo lộ hợp hệ sẽ được cộng hưởng.", "No path yet. A path matching your elements will resonate.")
      }</p>
      <table class="vk2-aff"><tbody>${Object.entries(D.PATH_AFFINITY)
        .map(([p, els]) => `<tr><th>${esc(L(PATH_NAMES[p]))}</th><td>${els.map((e) => L(D.ELEMENTS[e])).join(", ")}</td></tr>`)
        .join("")}</tbody></table>
    </div>`;
  }
  // ---------- Tab Căn Cơ ----------

  function pastCanText(s) {
    const grade = (g) => (g ? L(K.GRADES[g].n) : T("chưa có", "none"));
    return `${L(K.bodyDef.get(s.body)?.n ?? ["", ""])} · ${T("kinh mạch", "meridians")} ${s.open} · ${T("đạo cơ", "base")} ${grade(s.dao)} · Kim Đan ${grade(s.dan)}`;
  }

  function meter(label, val, max, hint) {
    const pct = max > 0 ? Math.round((Math.min(val, max) / max) * 100) : 0;
    return `<div class="vk2-meter"><div class="vk2-q-top"><span>${esc(label)}</span><span class="vk2-q-num">${fmt(Math.floor(val))}/${fmt(max)}</span></div><div class="vk2-bar"><i style="width:${pct}%"></i></div>${hint ? `<small>${esc(hint)}</small>` : ""}</div>`;
  }

  function forgeCard(c, kind) {
    const can = c.vk2.can;
    const conf = K.FORGE_KINDS[kind];
    const cur = can[conf.field];
    const name = L(conf.def.name);
    if (cur) {
      const g = K.GRADES[cur.grade];
      const canUp = !cur.remolded && cur.grade < 4;
      return `<div class="vk2-t"><div><b>${esc(name)}</b> <span class="vk2-qual ${g.cls}">${esc(L(g.n))}</span>${cur.how === "legacy" ? ` <small>${T("(ước lượng từ save cũ)", "(estimated from an old save)")}</small>` : ""}</div>
        <small>${T("Hiệu ứng", "Effect")}: ${esc(fxText(conf.def.fx[cur.grade]) || T("không tăng không giảm", "none"))} · ${T("lĩnh ngộ", "insight")} ×${conf.def.insight[cur.grade]}</small>
        ${cur.remolded ? `<small>${T("Đã cải tạo một lần trong kiếp này.", "Already remade once this life.")}</small>` : ""}
        ${canUp ? `<small>${T(`Cải tạo: từ ${L(D.REALM_LABELS[conf.remoldRealm])}, ${fmt(conf.remoldCost)} linh thạch, nội thương +15, tâm ma +10, tăng một phẩm. Một lần mỗi kiếp.`, `Remake: from ${L(D.REALM_LABELS[conf.remoldRealm])}, ${fmt(conf.remoldCost)} stones, wounds +15, demons +10, raises one grade. Once per life.`)}</small>
          <div class="vk2-t-act"><button class="vk2-btn" data-act="remold" data-id="${kind}" ${K.canRemold(c, kind) ? "" : "disabled"}>${T("Cải tạo", "Remake")}</button></div>` : ""}</div>`;
    }
    if (can.pending?.kind === kind) {
      const base = Math.round(K.forgeBase(c, kind));
      const left = K.PENDING_YEARS - (Math.floor(c.age ?? 0) - can.pending.at);
      return `<div class="vk2-t on"><b>${T(`Chọn cách đúc ${name}`, `Choose how to forge your ${name}`)}</b>
        <small>${T(`Điểm căn cơ hiện tại: ${base}. Mốc Trung, Thượng, Tuyệt phẩm: ${conf.def.cut.join(", ")}. Còn ${left} năm, quá hạn sẽ tự thành theo tự nhiên.`, `Current score: ${base}. Mid, High, Peerless at ${conf.def.cut.join(", ")}. ${left} yr left, then it forms naturally.`)}</small>
        <div class="vk2-branch">${K.forgeOptions(c, kind)
          .map((o) => `<button class="vk2-btn" data-act="forge" data-id="${kind}" data-opt="${o.id}" ${o.ok ? "" : "disabled"}><b>${esc(L(o.n))}${o.cost ? ` · ${fmt(o.cost)} ${T("linh thạch", "stones")}` : ""}</b><small>${esc(L(o.d))}</small></button>`)
          .join("")}</div></div>`;
    }
    return `<div class="vk2-t locked"><b>${esc(name)}</b>
      <small>${T(`Mở khi đạt ${L(D.REALM_LABELS[conf.realm])}. Điểm dự kiến hiện tại: ${Math.round(K.forgeBase(c, kind))}. Mốc Trung, Thượng, Tuyệt phẩm: ${conf.def.cut.join(", ")}.`, `Opens at ${L(D.REALM_LABELS[conf.realm])}. Projected score: ${Math.round(K.forgeBase(c, kind))}. Mid, High, Peerless at ${conf.def.cut.join(", ")}.`)}</small>
      <small>${T("Phụ thuộc độ tinh thuần, ổn định, công pháp, tâm cảnh, thiên tượng; nội thương và tạp chất làm giảm điểm.", "Depends on purity, stability, techniques, mind state and omens; wounds and impurity lower it.")}</small></div>`;
  }

  function bodyCard(c) {
    const can = c.vk2.can;
    const body = K.bodyOf(c);
    const q = D.QUALITY[body.q];
    const stage = K.stageOf(can.body.xp);
    let growth = "";
    if (body.id !== "pham") {
      const next = K.STAGES.xp[stage];
      growth = `${next ? meter(`${L(K.STAGES.names[stage])} → ${L(K.STAGES.names[stage + 1])}`, can.body.xp, next, `${T("Phát triển bằng", "Grows through")}: ${L(body.grow_d)}`) : `<small>${esc(L(K.STAGES.names[stage]))}</small>`}
        <small>${T("Nhược điểm", "Drawback")}: ${esc(L(body.con_d))}</small>`;
    }
    const others = K.BODIES.filter((b) => b.id !== body.id).map((b) => `<li><b>${esc(L(b.n))}</b> <span class="vk2-qual ${D.QUALITY[b.q].cls}">${esc(L(D.QUALITY[b.q].n))}</span><br><small>${esc(L(b.d))}</small><br><small>${T("Điều kiện", "Requires")}: ${esc(L(b.how))}${b.awake ? T(", và phải có duyên", ", and it must be fated") : ""}</small><br><small>${esc(fxText(b.fx))} · ${esc(L(b.con_d))}</small></li>`).join("");
    return `<div class="vk2-t on"><div><b>${esc(L(body.n))}</b> <span class="vk2-qual ${q.cls}">${esc(L(q.n))}</span>${can.body.innate ? ` <small>${T("bẩm sinh", "innate")}</small>` : ""}</div><p>${esc(L(body.d))}</p>${growth}</div>
      <details class="vk2-closed"><summary>${T("Các thể chất có thể có", "Known bodies")} (${K.BODIES.length})</summary><ul class="vk2-bodies">${others}</ul></details>
      <p class="vk2-note">${T("Mỗi kiếp chỉ có một thể chất. Đã có thì không thức tỉnh thêm, nên đôi khi Phàm Thể lại để ngỏ nhiều đường hơn.", "One body per life. Once you have one, no other can awaken, so a Mortal Body keeps more roads open.")}${c.huyetMach?.length ? ` ${T("Huyết mạch kiếp trước vẫn hoạt động riêng.", "Bloodlines from past lives work separately.")}` : ""}</p>`;
  }

  function canHtml(c, a) {
    const can = K.ensure(c, a);
    const cap = K.meridianCap(c);
    const cost = K.openCost(c, can.open);
    const m = K.METHODS[can.method];
    const pills = Object.entries(K.PILL_USES)
      .map(([id, u]) => {
        const n = c.pills?.[id] ?? 0;
        return `<button class="vk2-btn" data-act="pill" data-id="${id}" ${n > 0 ? "" : "disabled"}><b>${esc(L(u.n))} ×${fmt(n)}</b><small>${esc(L(u.d))}</small></button>`;
      })
      .join("");
    return `<p class="vk2-note">${T("Căn cơ phát triển trong những năm chọn trọng tâm Tu luyện, không cần thao tác lặp lại. Linh căn quyết định hấp thu linh khí, thể chất là thân thể, thiên phú là năng lực lớn dần theo cách sống.", "Your base grows during years focused on Cultivation, with no repeated actions. Roots absorb qi, bodies are physical, talents grow from how you live.")}</p>
      <h3>${T("Phương pháp tu luyện", "Cultivation method")}</h3>
      <div class="vk2-filters" role="group">${Object.entries(K.METHODS).map(([id, x]) => `<button class="vk2-btn ${id === can.method ? "on" : ""}" aria-pressed="${id === can.method}" data-act="method" data-id="${id}">${esc(L(x.n))}</button>`).join("")}</div>
      <p class="vk2-note">${esc(L(m.d))} ${T("Tốc độ tu", "Speed")} ×${m.cult}. ${esc(L(m.risk))}.</p>
      <h3>${T("Đan điền và kinh mạch", "Dantian and meridians")}</h3>
      <div class="vk2-meters">
        ${meter(T("Dung lượng đan điền", "Dantian capacity"), can.dantian, K.dantianCap(c), T("Tăng sinh lực. Trần tăng theo cảnh giới và phẩm chất căn cơ.", "Raises HP. The cap grows with realm and grade."))}
        ${meter(T("Độ tinh thuần linh lực", "Qi purity"), can.purity, 100, T("Tăng công và tỷ lệ đột phá.", "Raises attack and breakthrough."))}
        ${meter(T("Độ ổn định kinh mạch", "Meridian stability"), can.stability, 100, T("Trên 50 giúp đột phá và khai mạch, dưới 50 thì ngược lại.", "Above 50 helps breakthroughs and opening meridians; below 50 hurts."))}
        ${meter(T("Kinh mạch đã khai mở", "Meridians opened"), can.open, cap, T(`Mỗi mạch tăng hấp thu linh khí. Tối đa ${K.MERIDIANS.total} (${K.MERIDIANS.regular} chính kinh, ${K.MERIDIANS.extra} kỳ kinh).`, `Each raises qi absorption. Up to ${K.MERIDIANS.total} (${K.MERIDIANS.regular} regular, ${K.MERIDIANS.extra} extraordinary).`))}
        ${can.open < cap ? meter(T("Tiến độ xung mạch kế tiếp", "Next meridian"), can.openProg, Math.round(cost)) : `<small>${T("Đã chạm trần kinh mạch của cảnh giới này.", "Meridian cap reached for this realm.")}</small>`}
        ${meter(T("Nội thương", "Inner wounds"), can.injury, 100, T("Giảm tốc độ tu và đột phá. Từ 40 nuôi tâm ma, từ 70 còn mất sức khỏe mỗi năm.", "Lowers speed and breakthrough. From 40 it feeds demons; from 70 it also drains health yearly."))}
        ${meter(T("Tạp chất", "Impurity"), can.impurity, 100, T("Giảm tốc độ tu và làm xấu phẩm chất đạo cơ, Kim Đan.", "Lowers speed and worsens foundation and core grades."))}
      </div>
      <p class="vk2-note">${T(`Hấp thu từ kinh mạch: +${(can.open * 1.2).toFixed(1)}% (trước trần giảm dần).`, `Absorption from meridians: +${(can.open * 1.2).toFixed(1)}% (before diminishing returns).`)}</p>
      <h3>${T("Chu thiên", "Circulation")}</h3>
      <div class="vk2-meters">
        ${meter(`${T("Tiểu chu thiên", "Lesser")} · ${T("đã xong", "done")} ${fmt(can.tieuCount)}`, can.tieu, 100, T("Mỗi vòng tăng độ tinh thuần và đan điền.", "Each cycle raises purity and dantian."))}
        ${can.open >= 6 ? meter(`${T("Đại chu thiên", "Greater")} · ${T("đã xong", "done")} ${fmt(can.daiCount)}`, can.dai, 100, T("Mỗi vòng tăng mạnh tinh thuần, đan điền và độ ổn định.", "Each cycle strongly raises purity, dantian and stability.")) : `<small>${T(`Đại chu thiên mở khi khai đủ 6 kinh mạch (hiện ${can.open}).`, `The Greater Circulation opens at 6 meridians (now ${can.open}).`)}</small>`}
      </div>
      <h3>${T("Dùng đan điều dưỡng", "Restorative pills")}</h3>
      <div class="vk2-branch">${pills}</div>
      <h3>${T("Thể chất", "Body")}</h3>
      ${bodyCard(c)}
      <h3>${T("Đạo cơ và Kim Đan", "Foundation and core")}</h3>
      <div class="vk2-t-grid">${forgeCard(c, "dao")}${forgeCard(c, "dan")}</div>`;
  }

  // ---------- Tab Hành trình ----------

  const realmLabel = (realm, layer) => {
    const n = L(D.REALM_LABELS[realm] ?? [`Cảnh giới ${realm}`, `Realm ${realm}`]);
    return realm >= 1 && layer ? `${n} ${T("tầng", "layer")} ${layer}` : n;
  };
  const LOG_FILTERS = [["milestone", ["Cột mốc", "Milestones"]], ["all", ["Tất cả", "All"]], ["good", ["Điều tốt", "Good"]], ["bad", ["Biến cố", "Hardship"]]];
  const LOG_PAGE = 100;

  function journeyHtml(c, a, now) {
    const j = C.journey(c, a, now);
    const can = K.ensure(c, a);
    const lean = { chinh: T("Chính đạo", "Righteous"), ta: T("Tà đạo", "Evil"), trung: T("Trung lập", "Neutral") }[j.lean];
    const facts = [
      [T("Cảnh giới", "Realm"), realmLabel(c.realm ?? 0, c.layer)],
      [T("Tuổi", "Age"), `${Math.floor(c.age ?? 0)}/${c.lifespan ?? "?"}`],
      [T("Đạo lộ", "Path"), c.path ? L(D.PATH_LABELS[c.path] ?? [c.path, c.path]) : T("Chưa chọn", "None yet")],
      [T("Đạo tâm", "Dao Heart"), `${lean} (${c.daoTam ?? 0})`],
      [T("Linh căn", "Root"), `${c.linhCan ?? ""} · ${L(C.rootInfo(c).form.n)}`],
      [T("Thể chất", "Body"), L(K.bodyOf(c).n)],
      [T("Kinh mạch", "Meridians"), `${can.open}/${K.meridianCap(c)}`],
      [T("Trận thắng", "Wins"), fmt(j.kills)],
      ...EXT.facts.flatMap((f) => f(c, a) ?? []),
    ];
    const active = c.vk2.active.map((id) => `${L(C.talentDef.get(id).n)} ${T("bậc", "rank")} ${c.vk2.talents[id].lv}`);
    const time = j.activities.length
      ? `<div class="vk2-time">${j.activities
          .map((x) => {
            const pct = Math.round((x.years / j.totalYears) * 100);
            return `<div class="vk2-time-row"><span>${esc(L(D.ACTIVITY_LABELS[x.key]))}</span><div class="vk2-bar"><i style="width:${pct}%"></i></div><b>${fmt(x.years)} ${T("năm", "yr")}</b></div>`;
          })
          .join("")}</div>`
      : `<p class="vk2-note">${T("Chưa đủ tuổi tu hành. Số năm được tính từ 6 tuổi.", "Too young to practise. Years count from age 6.")}</p>`;
    const nextHtml = j.next
      ? `<p><b>${esc(L(j.next.t))}</b> <span class="vk2-q-num">${fmt(j.next.cur)}/${fmt(j.next.need)}</span></p>`
      : `<p>${T("Đã đi hết chính tuyến hiện có.", "Main story complete.")}</p>`;
    const near = j.near.map((x) => `<li>${esc(L(C.talentDef.get(x.id).n))}: ${Math.round(x.pct * 100)}% · ${esc(L(C.talentDef.get(x.id).how))}</li>`).join("");

    const filter = modal.filter ?? "milestone";
    const entries = C.logEntries(c, filter);
    const limit = modal.logLimit ?? LOG_PAGE;
    const logHtml = entries
      .slice(0, limit)
      .map((e) => `<li class="vk2-log-item tone-${esc(e.tone ?? "normal")}"><span class="vk2-log-age">${Math.floor(e.age ?? 0)}${T("t", "y")}</span><span>${esc(e.text ?? "")}</span></li>`)
      .join("");
    const past = [...(a.history ?? [])].reverse();

    return `<div class="vk2-facts">${facts.map(([k, x]) => `<div><small>${esc(k)}</small><b>${esc(x)}</b></div>`).join("")}</div>
      <h3>${T("Hướng phát triển", "Development")}</h3>
      <p class="vk2-note">${T("Thời gian kiếp này đã dành cho:", "How this life has been spent:")}</p>
      ${time}
      <p><small>${T("Thiên phú đang vận hành", "Active talents")}:</small> ${esc(active.join(", ") || T("chưa có", "none"))}</p>
      <h3>${T("Mục tiêu kế tiếp", "Next goal")}</h3>
      ${nextHtml}
      ${j.breakBonus ? `<p class="vk2-note">${T("Đột phá kế tiếp đang được cộng", "Next breakthrough bonus")} ${j.breakBonus > 0 ? "+" : ""}${Math.round(j.breakBonus * 1000) / 10}%.</p>` : ""}
      ${near ? `<p class="vk2-note">${T("Thiên phú gần thức tỉnh:", "Talents close to awakening:")}</p><ul class="vk2-near">${near}</ul>` : ""}
      <h3>${T("Nhật ký kiếp này", "This life's log")} <small>${fmt(entries.length)}</small></h3>
      <div class="vk2-filters" role="group">${LOG_FILTERS.map(([k, n]) => `<button class="vk2-btn ${k === filter ? "on" : ""}" aria-pressed="${k === filter}" data-act="logfilter" data-filter="${k}">${esc(L(n))}</button>`).join("")}</div>
      ${logHtml ? `<ol class="vk2-log">${logHtml}</ol>` : `<p class="vk2-note">${T("Chưa có ghi chép ở mục này.", "Nothing here yet.")}</p>`}
      ${entries.length > limit ? `<button class="vk2-btn vk2-more" data-act="logmore">${T("Xem thêm ghi chép cũ", "Show older entries")}</button>` : ""}
      <h3>${T("Các kiếp trước", "Past lives")} <small>${fmt(past.length)}</small></h3>
      ${
        past.length
          ? `<ul class="vk2-lives">${past
              .map((h) => {
                const tal = (h.talents ?? []).map(([id, lv]) => `${L(C.talentDef.get(id)?.n ?? [id, id])} ${lv}`).join(", ");
                return `<li><b>${T("Kiếp", "Life")} ${h.life}: ${esc(h.name)}</b><br>${esc(realmLabel(h.realm, h.layer))} · ${h.age} ${T("tuổi", "yrs")}${h.path ? ` · ${esc(L(D.PATH_LABELS[h.path] ?? [h.path, h.path]))}` : ""}${h.cause ? `<br><small>${esc(h.cause)}</small>` : ""}${tal ? `<br><small>${T("Thiên phú", "Talents")}: ${esc(tal)}</small>` : ""}${h.can ? `<br><small>${esc(pastCanText(h.can))}</small>` : ""}</li>`;
              })
              .join("")}</ul>`
          : `<p class="vk2-note">${T("Chưa có kiếp nào được ghi lại.", "No lives recorded yet.")}</p>`
      }`;
  }

  const PATH_NAMES = { kiem: ["Kiếm", "Sword"], dan: ["Đan", "Alchemy"], tran: ["Trận", "Array"], phat: ["Phật", "Buddhist"], ma: ["Ma", "Demon"], yeu: ["Yêu", "Beast"] };

  const TAB_NAMES = { journey: ["Hành Trình", "Journey"], can: ["Căn Cơ", "Base"], talents: ["Thiên phú", "Talents"], root: ["Linh căn", "Root"] };
  const GROUPS = [
    { n: ["Hành trình", "Journey"], tabs: ["journey", "chronicle", "gfx"] },
    { n: ["Nhiệm vụ", "Quests"], tabs: ["quests"] },
    { n: ["Tu luyện", "Practice"], tabs: ["can", "art", "talents", "root"] },
    { n: ["Cơ duyên", "Fortunes"], tabs: ["realm", "inherit"] },
    { n: ["Sản nghiệp", "Estate"], tabs: ["cave", "forge", "peerless"] },
    { n: ["Nhân thế", "World"], tabs: ["mentor", "family", "sect", "people"] },
    { n: ["Thiên cơ", "Fate"], tabs: ["law", "heart", "crisis", "destiny", "karma"] },
  ];
  // Các mục của bản 3.0 đăng ký ở ui3.js.
  const EXT = { tabs: {}, actions: {}, facts: [] };

  function modalHtml(c, a, now) {
    const tab = modal.tab;
    const ext = EXT.tabs[tab];
    const body = ext ? ext.html(c, a, now) : tab === "journey" ? journeyHtml(c, a, now) : tab === "can" ? canHtml(c, a) : tab === "talents" ? talentsHtml(c, a) : tab === "root" ? rootHtml(c) : journalHtml(c, a, now);
    // Nhóm chức năng theo danh mục: hàng trên là danh mục, hàng dưới là các mục của danh mục đang mở.
    const group = GROUPS.find((g) => g.tabs.includes(tab)) ?? GROUPS[0];
    const tabName = (k) => L(EXT.tabs[k]?.n ?? TAB_NAMES[k] ?? [k, k]);
    const realTabs = (g) => g.tabs.filter((k) => EXT.tabs[k] || TAB_NAMES[k] || g.tabs.length === 1);
    return `<div class="vk2-sheet" role="dialog" aria-modal="true">
      <div class="vk2-sheet-head">
        <div class="vk2-tabs" role="tablist">${GROUPS.filter((g) => realTabs(g).length).map((g) => `<button role="tab" aria-selected="${g === group}" class="${g === group ? "on" : ""}" data-act="tab" data-tab="${realTabs(g)[0]}">${esc(L(g.n))}</button>`).join("")}</div>
        <button class="vk2-x" data-act="close" aria-label="${T("Đóng", "Close")}">✕</button>
      </div>
      ${realTabs(group).length > 1 ? `<div class="vk2-subtabs" role="tablist">${realTabs(group).map((k) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? "on" : ""}" data-act="tab" data-tab="${k}">${esc(tabName(k))}</button>`).join("")}</div>` : ""}
      <div class="vk2-sheet-body">${body}</div></div>`;
  }

  // ---------- Render ----------

  function el(id, tag, cls) {
    let n = document.getElementById(id);
    if (!n) {
      n = document.createElement(tag);
      n.id = id;
      if (cls) n.className = cls;
      n.addEventListener("click", onClick);
    }
    return n;
  }

  // ---------- Mục nối trong các bảng của game gốc ----------

  const FIGHT_NAMES = { first: ["Đánh trước", "First strike"], extra: ["Đánh thêm", "Extra strike"], leech: ["Hút máu", "Drain"], dodge: ["Né đòn", "Dodge"], pierce: ["Xuyên giáp", "Pierce"], shield: ["Hộ thể", "Shield"], burn: ["Thiêu đốt", "Burn"] };
  const pct = (x) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;
  function fightLine(c) {
    const m = C.duelMods(c);
    return Object.keys(FIGHT_NAMES).filter((k) => m[k] > 0).map((k) => `${L(FIGHT_NAMES[k])} ${Math.round(m[k] * 100)}%`).join(" · ");
  }
  /** Mỗi bảng của game hiện đúng phần liên quan của mod đang tác động lên nhân vật, kèm nút mở bảng đầy đủ. */
  const NATIVE = {
    hunt: (c) => {
      const armed = c.vk2?.khi?.armed;
      const line = fightLine(c);
      return {
        text: `${T("Trong trận", "In battle")}: ${line || T("chưa có cơ chế nào. Pháp bảo, phù, bí thuật và pháp tắc sẽ thêm né đòn, hút máu, đánh thêm.", "no mechanics yet. Treasures, talismans, arts and laws add dodge, drain and extra strikes.")}${armed ? ` · ${T("Phù đã chuẩn bị", "Talisman ready")}: ${L(globalThis.VK2Khi.TALISMANS[armed].n)}` : ""}`,
        tab: "forge", btn: T("Pháp bảo và phù", "Treasures and talismans"),
      };
    },
    info: (c) => {
      const t = C.totals(c);
      const parts = [[["Công", "Atk"], t.atk], [["Thủ", "Def"], t.def], [["Máu", "HP"], t.hp], [["Tu", "Cult."], t.cult], [["Đột phá", "Breakthrough"], t.brk]].filter(([, x]) => Math.abs(x) >= 0.005);
      const line = fightLine(c);
      return {
        text: `${T("Tu hành cộng", "From your practice")}: ${parts.map(([n, x]) => `${L(n)} ${pct(x)}`).join(" · ") || T("chưa có", "none yet")}${line ? ` · ${T("Trận", "Battle")}: ${line}` : ""}`,
        tab: "journey", btn: T("Hành trình", "Journey"),
      };
    },
    congphap: (c) => {
      const arts = globalThis.VK2Dao?.activeArts(c) ?? [];
      return {
        text: `${T("Bí thuật tự sáng tạo đang vận hành", "Created arts in use")}: ${arts.map((x) => x.name).join(", ") || T("chưa có", "none yet")}`,
        tab: "art", btn: T("Mở Bí thuật", "Open Arts"),
      };
    },
    bag: (c) => {
      const k = c.vk2?.khi;
      const tali = Object.values(k?.talismans ?? {}).reduce((s, n) => s + n, 0);
      return {
        text: `${T("Pháp bảo", "Treasures")}: ${k?.worn?.length ?? 0}/${k?.items?.length ?? 0} ${T("đang mang", "worn")} · ${T("Phù", "Talismans")}: ${tali} · ${T("Tinh hoa", "Essence")}: ${c.vk2?.bao?.essence ?? 0}`,
        tab: "peerless", btn: T("Đúc Tuyệt phẩm", "Forge Peerless"),
      };
    },
    bequan: (c) => {
      const can = c.vk2?.can;
      const m = can && K.METHODS[can.method];
      const cave = c.vk2?.khi?.cave;
      return {
        text: `${T("Căn cơ", "Foundation")}: ${m ? L(m.n) : T("chưa rõ", "unknown")} · ${T("Động phủ", "Abode")}: ${cave ? T("đã có", "established") : T("chưa có", "none")}`,
        tab: "can", btn: T("Mở Căn Cơ", "Open Foundation"),
      };
    },
    thu: (c) => {
      const lv = c.vk2?.khi?.cave?.b?.thu_vien ?? 0;
      return {
        text: `${T("Linh thú viên", "Beast Garden")}: ${lv ? `${T("cấp", "level")} ${lv}, ${T("linh thú hồi sức cho chủ mỗi năm", "your beast restores you yearly")}` : T("chưa xây trong động phủ", "not built in your abode")}`,
        tab: "cave", btn: T("Mở Động phủ", "Open Abode"),
      };
    },
  };
  function renderNative(c) {
    const sheets = document.querySelectorAll(".sheet");
    const sheet = sheets[sheets.length - 1];
    // Tàng Kinh Các và Linh thú là cảnh toàn màn hình, phần nội dung giấy nằm cuối cảnh
    const scene = document.querySelector(".forge-wrap .forge-scene")?.lastElementChild;
    const make = bridge?.panel ? NATIVE[bridge.panel] : null;
    if ((!sheet && !scene) || !make) return document.getElementById("vk2-native")?.remove();
    const d = make(c);
    const html = `<p>${esc(d.text)}</p><button class="vk2-btn" data-act="tab" data-tab="${d.tab}">${esc(d.btn)}</button>`;
    const box = el("vk2-native", "div", "vk2-native");
    if (scene) {
      if (box.parentNode !== scene) scene.prepend(box);
    } else if (box.parentNode !== sheet) {
      const head = sheet.querySelector(".sheet-head");
      if (head) head.after(box);
      else sheet.prepend(box);
    }
    if (box.dataset.h !== html) {
      box.innerHTML = html;
      box.dataset.h = html;
    }
  }

  function hideAll() {
    document.getElementById("vk2-native")?.remove();
    document.getElementById("vk2-hud")?.remove();
    document.getElementById("vk2-modal")?.remove();
    modal = null;
    lastHtml = "";
  }

  function render(force) {
    const c = char();
    const stage = document.querySelector(".stage");
    if (!c || !stage || c.dead) return hideAll();
    const a = acct();
    C.ensure(c, a);
    const now = Date.now();
    const hud = el("vk2-hud", "section", "panel vk2-hud");
    // Xếp ngay dưới sân khấu trong luồng trang, nên không che nhân vật. Tự gắn lại nếu React dựng lại khung.
    if (hud.parentNode !== stage.parentNode || hud.previousElementSibling !== stage) stage.parentNode.insertBefore(hud, stage.nextSibling);
    const html = hudHtml(c, a, now);
    if (force || html !== lastHtml) {
      hud.innerHTML = html;
      lastHtml = html;
    }
    renderNative(c);
    if (modal) {
      const m = el("vk2-modal", "div", "vk2-modal");
      if (!m.parentNode) document.body.appendChild(m);
      const next = modalHtml(c, a, now);
      if (force || m.dataset.h !== next) {
        const body = m.querySelector(".vk2-sheet-body");
        const scroll = body ? body.scrollTop : 0;
        m.innerHTML = next;
        m.dataset.h = next;
        const nb = m.querySelector(".vk2-sheet-body");
        if (nb) nb.scrollTop = scroll;
      }
    } else {
      document.getElementById("vk2-modal")?.remove();
    }
  }

  function toast(text, kind) {
    let box = document.getElementById("vk2-toasts");
    if (!box) {
      box = document.createElement("div");
      box.id = "vk2-toasts";
      box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    const n = document.createElement("div");
    n.className = `vk2-toast ${kind ?? ""}`;
    n.textContent = text;
    box.appendChild(n);
    // Ở tốc độ cao nhiều việc xảy ra cùng lúc. Nội dung vẫn nằm trong nhật ký, nên chỉ giữ vài thông báo mới nhất.
    while (box.children.length > MAX_TOASTS) box.firstChild.remove();
    setTimeout(() => n.remove(), 3600);
  }

  // ---------- Tương tác ----------

  function setPaused(pause) {
    if (!bridge?.setRunning) return;
    if (pause) {
      if (wasRunning === null) wasRunning = bridge.running;
      bridge.setRunning(false);
    } else if (wasRunning !== null) {
      bridge.setRunning(wasRunning);
      wasRunning = null;
    }
  }

  function openTab(tab) {
    modal = { ...modal, tab };
    setPaused(true);
    render(true);
  }

  function closeModal() {
    modal = null;
    setPaused(false);
    render(true);
  }

  function doGo(q) {
    const go = q.go;
    if (!go) return;
    closeModalIfAny();
    if (go.tab) return openTab(go.tab);
    if (go.panel) return bridge.openPanel(go.panel);
    if (go.focus) {
      if (go.focus === "tru_yeu") return bridge.openPanel("hunt");
      bridge.mutate((c) => {
        c.focus = go.focus;
      });
    }
  }
  function closeModalIfAny() {
    if (modal) closeModal();
  }

  function onClick(e) {
    const b = e.target.closest("[data-act]");
    if (!b) {
      if (e.target.id === "vk2-modal") closeModal();
      return;
    }
    const c = char();
    if (!c) return;
    const a = acct();
    const now = Date.now();
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case "collapse":
        try {
          localStorage.setItem("vk2.hudOpen", collapsedPref() ? "1" : "0");
        } catch {}
        render(true);
        break;
      case "tab":
        openTab(b.dataset.tab);
        break;
      case "close":
        closeModal();
        break;
      case "logfilter":
        modal = { ...modal, filter: b.dataset.filter, logLimit: LOG_PAGE };
        render(true);
        break;
      case "logmore":
        modal = { ...modal, logLimit: (modal.logLimit ?? LOG_PAGE) + LOG_PAGE };
        render(true);
        break;
      case "panel":
        closeModalIfAny();
        bridge.openPanel(b.dataset.panel);
        break;
      case "go": {
        const q = C.listQuests(c, a, now).find((x) => x.id === id);
        if (q) doGo(q);
        break;
      }
      case "claim": {
        const q = C.claim(c, a, id, now, rewardCtx());
        if (q) {
          c.log.push({ age: Math.floor(c.age), tone: "good", text: `${T("Hoàn thành", "Completed")}: ${L(q.t)}. ${rewardText(q.r)}` });
          toast(`${L(q.t)}: ${rewardText(q.r)}`, "good");
        }
        commit();
        break;
      }
      case "pin":
        if (!C.togglePin(c, a, id)) toast(T("Chỉ ghim được 3 nhiệm vụ.", "You can only pin 3 quests."));
        commit();
        break;
      case "toggle":
        if (!C.setActive(c, a, id, !c.vk2.active.includes(id))) toast(T("Hết ô vận hành.", "No free slot."));
        commit();
        break;
      case "level":
        if (C.levelUp(c, id)) toast(`${L(C.talentDef.get(id).n)}: ${T("bậc", "rank")} ${c.vk2.talents[id].lv}`, "good");
        commit();
        break;
      case "branch":
        C.chooseBranch(c, id, b.dataset.branch);
        commit();
        break;
      case "method":
        K.setMethod(c, a, id);
        commit();
        break;
      case "forge": {
        const done = K.forge(c, id, b.dataset.opt);
        if (done) pushNotes(c, [K.forgeNote(id, done)]);
        commit();
        break;
      }
      case "remold":
        if (K.remold(c, id)) toast(T("Căn cơ đã được cải tạo, nhưng thân thể phải trả giá.", "Your base has been remade, at a cost to your body."), "good");
        commit();
        break;
      case "pill":
        if (K.usePill(c, a, id)) toast(`${L(K.PILL_USES[id].n)}: ${L(K.PILL_USES[id].d)}`, "good");
        commit();
        break;
      default:
        EXT.actions[b.dataset.act]?.(c, a, b);
    }
  }

  // ---------- Vòng cập nhật ----------

  /** Ghi chú căn cơ vào nhật ký gốc của game và báo cho người chơi. */
  function pushNotes(c, notes) {
    for (const n of notes ?? []) {
      const text = L(n.t);
      c.log?.push({ age: Math.floor(c.age ?? 0), tone: n.kind === "big" ? "big" : n.kind === "bad" ? "bad" : "good", text });
      toast(text, n.kind === "big" ? "awake" : n.kind === "bad" ? "" : "good");
    }
  }

  function step() {
    try {
      const c = char();
      if (!c) return render();
      const a = acct();
      const now = Date.now();
      const { woken, died, notes } = C.tick(c, a, now);
      pushNotes(c, notes);
      for (const id of woken) {
        const def = C.talentDef.get(id);
        toast(`${T("Thức tỉnh thiên phú", "Talent awakened")}: ${L(def.n)}`, "awake");
        c.log.push({ age: Math.floor(c.age), tone: "big", text: `${T("Thức tỉnh thiên phú", "Talent awakened")}: ${L(def.n)}.` });
      }
      // Lần quét đầu của mỗi kiếp chỉ ghi nhận: tải lại trang không được báo lại việc đã xong từ trước.
      const firstScan = toastLife !== c.lifeNo;
      toastLife = c.lifeNo;
      if (!c.dead) {
        for (const q of C.listQuests(c, a, now)) {
          const key = `${c.lifeNo}:${q.id}`;
          if (q.status === "complete" && !toastSeen.has(key)) {
            toastSeen.add(key);
            if (!firstScan && q.kind !== "talent") toast(`${T("Xong nhiệm vụ", "Quest complete")}: ${L(q.t)}`, "good");
          }
        }
      }
      if (woken.length || died) saveAcct();
      else if (now - flashTimer > 5000) {
        flashTimer = now;
        saveAcct();
      }
      render();
    } catch (err) {
      console.warn("[VK2]", err);
    }
  }

  const safe = (fn, fallback) => (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      console.warn("[VK2]", err);
      return typeof fallback === "function" ? fallback(...args) : fallback;
    }
  };

  // ---------- API được bundle đã vá gọi tới ----------

  globalThis.__VK2 = {
    bind(b) {
      bridge = b;
    },
    captureRate(fn) {
      nM = fn;
    },
    captureOmen(fn) {
      K.captureOmen(fn);
    },
    captureCombat(nd, nr) {
      C.captureCombat(nd, nr);
    },
    onYear: safe((c, opts) => {
      pushNotes(c, C.onYear(c, acct(), opts));
    }),
    yearEvent: safe((c, opts, nD) => {
      builder = nD;
      const def = C.yearEvent(c, acct(), opts);
      return def ? nD(c, def) : null;
    }, null),
    chainEvent: safe((c, nD) => {
      builder = nD;
      const def = C.chainEvent(c, acct());
      return def ? nD(c, def) : null;
    }, null),
    eventDef: safe((c, id) => C.eventDef(c, acct(), id), null),
    onChoice: safe((c, ev, choice) => globalThis.VK2Su?.onChoice(c, acct(), ev, choice)),
    cultMul: safe((c) => {
      return C.cultMul(c);
    }, 1),
    breakBonus: safe((c) => C.breakBonus(c), 0),
    sectLean: safe((name) => globalThis.VK2The?.sectLean(acct(), name) ?? null, null),
    fightFoe: safe((c, f, foe) => C.fightFoe(c, f, foe), (c, f, foe) => foe),
    fightExtra: safe((f) => C.fightExtra(f), 0),
    fightHit: safe((f, before) => C.fightHit(f, before)),
    fightGuard: safe((f, before) => C.fightGuard(f, before)),
    stat: safe((c, s) => C.statMul(c, s), (c, s) => s),
    onKill: safe((c) => {
      C.onKill(c, acct());
    }),
    step,
    _test: { acct, char, core: C, can: K, game: () => bridge?.game ?? null, render: () => render(true), rate: (c) => (nM ? nM(c) : null), useAcct: (a) => (testAcct = a), openPanel: (id) => bridge?.openPanel(id) },
    // Dành cho ui3.js: dùng chung cách vẽ và lưu, không có API thứ hai.
    _ui: {
      char, acct, EXT, L, T, esc, fmt, meter, toast, commit, pushNotes, closeModal: () => closeModalIfAny(), fxText, rewardText, FX_NAMES,
      /** Đưa ngay sự kiện kế tiếp của mod vào hàng đợi của game, ví dụ khi bấm vào bí cảnh trong bảng. */
      startChain(c, a) {
        const def = C.chainEvent(c, a);
        if (def && builder && bridge?.pendingRef) bridge.pendingRef.current = builder(c, def);
        return !!def && !!builder;
      },
      canStartChain: () => !!builder && !!bridge?.pendingRef,
    },
  };

  function boot() {
    // Chế độ khách chỉ có save trong máy, nên xin trình duyệt đừng tự xóa khi thiếu dung lượng.
    // Không có trên HTTP thường (chơi qua LAN); bị từ chối thì save vẫn hoạt động như cũ.
    navigator.storage?.persist?.().catch(() => {});
    setInterval(step, 500);
    step();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
