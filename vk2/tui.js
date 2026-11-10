// Túi đồ của game: chia đồ Phàm giới và Thiên giới, nút trang bị nhanh, và dòng cho thấy mod đang cộng gì vào chỉ số.
// Bộ lọc đi qua bản vá danh sách đồ trong bundle (__VK2.bagShow), nên lưới đồ, nhóm và số đếm của game vẫn đúng.
(function (root) {
  "use strict";

  /** Cảnh giới đầu tiên của Tiên giới là Chân Tiên (8). Độ Kiếp (7) là cảnh giới cuối ở phàm gian. */
  const HEAVEN = 8;
  const SLOTS = ["vu_khi", "ao", "phu_kien"];
  const WORLDS = ["all", "pham", "thien"];
  const KEY = "vk2.bagWorld";

  const worldOf = (it) => ((it?.minRealm ?? 0) >= HEAVEN ? "thien" : "pham");

  /** Điểm của một món là phần chỉ số chiến đấu thật nó thêm vào (qua hàm chỉ số của game), cộng tu luyện, bạo kích và thần thông. */
  function score(c, stats, it, base) {
    const fx = it.fx ?? {};
    let s = stats.atk / base.atk + stats.def / base.def + stats.hp / base.hp;
    s += (fx.cult ?? 0) / 100 + (fx.crit ?? 0) / 200 + (fx.drop ?? 0) / 300;
    for (const x of Object.values(it.perk ?? {})) s += x;
    return s;
  }

  /**
   * Món tốt nhất cho từng ô trong số đồ người chơi có (lọc theo giới nếu có).
   * statsOf(c) phải là hàm chỉ số thật của game; hàm này đổi tạm c.equipped rồi trả lại như cũ.
   */
  function bestGear(c, items, statsOf, world = "all") {
    const own = new Set(c.inventory ?? []);
    const pool = items.filter((it) => own.has(it.id) && SLOTS.includes(it.slot) && (world === "all" || worldOf(it) === world));
    const saved = { ...c.equipped };
    const out = {};
    try {
      for (const slot of SLOTS) {
        const cands = pool.filter((it) => it.slot === slot);
        if (!cands.length) continue;
        // Mốc so sánh là ô này để trống (áo thì không thể trống, nên so với áo đang mặc)
        c.equipped = { ...saved, [slot]: slot === "ao" ? saved.ao : undefined };
        const base = statsOf(c);
        const one = (id) => {
          c.equipped = { ...saved, [slot]: id };
          const it = items.find((x) => x.id === id);
          return it ? score(c, statsOf(c), it, base) : -Infinity;
        };
        let best = null;
        let bestScore = saved[slot] ? one(saved[slot]) : -Infinity;
        for (const it of cands) {
          if (it.id === saved[slot]) continue;
          const sc = one(it.id);
          if (sc > bestScore + 1e-9) {
            best = it.id;
            bestScore = sc;
          }
        }
        if (best) out[slot] = best;
      }
    } finally {
      c.equipped = saved;
    }
    return out;
  }

  const api = { HEAVEN, SLOTS, WORLDS, worldOf, bestGear, score };
  root.VK2Tui = api;

  // ---------- Phần giao diện, chỉ chạy trong trình duyệt có game ----------
  if (typeof document === "undefined" || !root.__VK2?._ui) return;

  const H = root.__VK2;
  const U = H._ui;
  const { T, L, esc, toast, commit, char } = U;
  const C = root.VK2Core;

  let world = "all";
  try {
    const w = localStorage.getItem(KEY);
    if (WORLDS.includes(w)) world = w;
  } catch {}

  H.bagShow = (it) => world === "all" || worldOf(it) === world;

  const items = () => root.VK2Gear?.all() ?? [];
  const statsOf = (c) => C.combatStats(c);
  const NAMES = { atk: ["Công", "Atk"], def: ["Thủ", "Def"], hp: ["Máu", "HP"], cult: ["Tu", "Cult."], brk: ["Đột phá", "Breakthrough"] };
  const PERKS = { pierce: ["Xuyên giáp", "Pierce"], shield: ["Hộ thể", "Shield"], dodge: ["Né đòn", "Dodge"] };
  const pct = (x) => `${x > 0 ? "+" : ""}${Math.round(x * 100)}%`;

  function modLine(c) {
    const t = C.totals(c);
    const parts = Object.keys(NAMES).filter((k) => Math.abs(t[k]) >= 0.005).map((k) => `${L(NAMES[k])} ${pct(t[k])}`);
    const perks = {};
    for (const id of Object.values(c.equipped ?? {})) {
      for (const [k, x] of Object.entries(items().find((it) => it.id === id)?.perk ?? {})) perks[k] = (perks[k] ?? 0) + x;
    }
    const perkText = Object.entries(perks).map(([k, x]) => `${L(PERKS[k] ?? [k, k])} ${Math.round(x * 100)}%`);
    return `${T("Mod đang cộng (đã tính vào Công, Thủ, Sinh lực bên trên)", "Mod bonuses (already in Attack, Defense, HP above)")}: ${parts.join(" · ") || T("chưa có", "none yet")}${perkText.length ? ` · ${T("Thần thông", "Perks")}: ${perkText.join(", ")}` : ""}`;
  }

  function html(c) {
    const own = new Set(c.inventory ?? []);
    const gear = items().filter((it) => own.has(it.id) && SLOTS.includes(it.slot));
    const n = { all: gear.length, pham: gear.filter((it) => worldOf(it) === "pham").length, thien: gear.filter((it) => worldOf(it) === "thien").length };
    const label = { all: T("Tất cả", "All"), pham: T("Phàm giới", "Mortal"), thien: T("Thiên giới", "Heavenly") };
    const chips = WORLDS.map((w) => `<button type="button" role="radio" aria-checked="${world === w}" class="vk2-world ${world === w ? "on" : ""}" data-world="${w}">${label[w]} <small>${n[w]}</small></button>`).join("");
    const best = bestGear(c, items(), statsOf, world);
    const k = Object.keys(best).length;
    return `<div class="vk2-bag-row" role="radiogroup" aria-label="${T("Lọc theo giới", "Filter by realm")}">${chips}</div>
      <div class="vk2-bag-row"><button type="button" class="vk2-btn vk2-quick" data-quick="1" ${k ? "" : "disabled"}>⚡ ${T("Trang bị nhanh", "Quick equip")}${k ? ` <small>${k} ${T("món tốt hơn", "better")}</small>` : ""}</button>
      <small class="vk2-bag-hint">${world === "thien" ? T("Đồ từ Chân Tiên trở lên", "Gear from True Immortal up") : world === "pham" ? T("Đồ từ Phàm Nhân tới Độ Kiếp", "Gear from Mortal to Tribulation") : T("Chọn món mạnh nhất cho mỗi ô", "Picks the strongest item per slot")}</small></div>
      <p class="vk2-bag-mod">${esc(modLine(c))}</p>`;
  }

  function onClick(e) {
    const c = char();
    if (!c) return;
    const w = e.target.closest("[data-world]");
    if (w) {
      world = w.dataset.world;
      try {
        localStorage.setItem(KEY, world);
      } catch {}
      commit();
      return draw(true);
    }
    if (e.target.closest("[data-quick]")) {
      const best = bestGear(c, items(), statsOf, world);
      const names = [];
      for (const [slot, id] of Object.entries(best)) {
        c.equipped[slot] = id;
        names.push(items().find((it) => it.id === id)?.name ?? id);
      }
      if (names.length) {
        const text = `${T("Trang bị nhanh", "Quick equip")}: ${names.join(", ")}.`;
        c.log?.push({ age: Math.floor(c.age ?? 0), tone: "normal", text });
        toast(text, "good");
      } else toast(T("Đồ đang mặc đã là tốt nhất.", "You already wear the best you have."));
      commit();
      draw(true);
    }
  }

  function draw(force) {
    try {
      const kinds = document.querySelector(".bagdoll .inv-kinds");
      const c = char();
      if (!kinds || !c || c.dead) return document.getElementById("vk2-bag")?.remove();
      let box = document.getElementById("vk2-bag");
      if (!box) {
        box = document.createElement("div");
        box.id = "vk2-bag";
        box.className = "vk2-bag";
        box.addEventListener("click", onClick);
      }
      if (box.previousElementSibling !== kinds) kinds.after(box);
      const next = html(c);
      if (force || box.dataset.h !== next) {
        box.innerHTML = next;
        box.dataset.h = next;
      }
    } catch (err) {
      console.warn("[VK2]", err);
    }
  }

  setInterval(draw, 400);
})(typeof globalThis !== "undefined" ? globalThis : this);
