// Vạn Kiếp Luân Hồi 3.0 — các mục giao diện mới. Mỗi mục có: hướng dẫn ngắn, điều kiện mở, tiến trình, lợi ích, rủi ro và nút thao tác.
(function () {
  "use strict";
  const C = globalThis.VK2Core;
  const D = globalThis.VK2Data;
  const U = globalThis.__VK2._ui;
  const { EXT, L, T, esc, fmt, meter, toast, commit, fxText, closeModal } = U;

  const guide = (how, gain, risk) => `<div class="vk2-guide"><p>${esc(how)}</p><p><b>${T("Lợi ích", "Benefit")}:</b> ${esc(gain)}</p><p><b>${T("Rủi ro", "Risk")}:</b> ${esc(risk)}</p></div>`;
  const locked = (why) => `<p class="vk2-lock">🔒 ${esc(why)}</p>`;
  const reasonText = (rs) => (rs ?? []).map((r) => L(r)).join(". ");
  const realmName = (r) => L(D.REALM_LABELS[r] ?? [`${r}`, `${r}`]);

  // ---------- Giai đoạn 2: công pháp, bí cảnh, truyền thừa ----------

  const G = globalThis.VK2Dao;

  function artHtml(c, a) {
    const d = G.ensure(c, a);
    const concepts = Object.entries(G.CONCEPTS).map(([id, n]) => ({ id, n, x: d.mastery[id] ?? 0 })).sort((p, q) => q.x - p.x);
    const shown = concepts.filter((x) => x.x > 0 || x.id === d.study);
    const rows = shown.map((x) => `<div class="vk2-t ${d.study === x.id ? "on" : ""}">${meter(`${L(x.n)} · ${L(G.masteryName(x.x))}`, x.x, 100)}<div class="vk2-t-act"><button class="vk2-btn" data-act="study" data-id="${x.id}" aria-pressed="${d.study === x.id}">${d.study === x.id ? T("Đang chuyên tâm", "Studying") : T("Chuyên tâm", "Study")}</button></div></div>`).join("");
    const hidden = concepts.filter((x) => x.x === 0 && x.id !== d.study);
    const slots = G.slotsOf(c);
    const arts = d.arts.map((art) => {
      const def = G.recipeDef.get(art.recipe);
      const on = d.active.includes(art.id);
      const pro = Object.fromEntries(Object.entries(def.fx).map(([k, x]) => [k, x * art.power]));
      return `<div class="vk2-t ${on ? "on" : ""}"><b>${esc(art.name)}</b><small>${T("Nguồn gốc", "Origin")}: ${esc(L(G.CONCEPTS[def.a]))} + ${esc(L(G.CONCEPTS[def.b]))} · ${T("sáng tạo năm", "created at age")} ${art.age} · ${T("hệ", "element")} ${esc(L(D.ELEMENTS[def.el]))}</small><p>${esc(L(def.d))}</p><small>${T("Hiệu ứng", "Effect")}: ${esc(fxText({ ...pro, ...def.con }))} · ${T("uy lực", "power")} ×${art.power}</small><div class="vk2-t-act"><button class="vk2-btn" data-act="art-toggle" data-id="${art.id}" ${on || d.active.length < slots ? "" : "disabled"}>${on ? T("Ngừng vận hành", "Deactivate") : T("Vận hành", "Activate")}</button></div></div>`;
    }).join("");
    const recipes = G.RECIPES.filter((r) => !d.arts.some((x) => x.recipe === r.id)).map((r) => {
      const check = G.canCreate(c, a, r.id);
      const known = (d.mastery[r.a] ?? 0) >= 15 || (d.mastery[r.b] ?? 0) >= 15;
      if (!known) return "";
      return `<div class="vk2-t ${check.ok ? "on" : "locked"}"><b>${esc(L(r.n))}</b><small>${esc(L(G.CONCEPTS[r.a]))} ${Math.floor(d.mastery[r.a] ?? 0)}/${G.COMBINE_AT} + ${esc(L(G.CONCEPTS[r.b]))} ${Math.floor(d.mastery[r.b] ?? 0)}/${G.COMBINE_AT}</small><p>${esc(L(r.d))}</p><small>${T("Yêu cầu", "Requires")}: ${esc(realmName(r.realm))} · ${fmt(r.stones)} ${T("linh thạch", "stones")}</small>${check.ok ? `<label class="vk2-field">${T("Đặt tên", "Name")}<input maxlength="28" data-name="${r.id}" placeholder="${esc(L(r.n))}"></label><div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="art-make" data-id="${r.id}">${T("Sáng tạo", "Create")}</button></div>` : `<small>${esc(reasonText(check.reasons))}</small>`}</div>`;
    }).join("");
    return `${guide(T("Mỗi đạo niệm lớn dần theo đạo lộ, linh căn và việc bạn làm mỗi năm. Hai đạo niệm tương thích đều từ Thuần thục thì có thể kết hợp thành bí thuật riêng.", "Concepts grow with your path, root and yearly activity. Two compatible concepts at Practised can be combined into your own art."), T("Bí thuật có hiệu ứng thật, kể cả cơ chế trong trận; có thể lưu lại cho hậu thế.", "Arts have real effects, including battle mechanics, and can be left to later lives."), T("Mỗi bí thuật có nhược điểm hoặc cái giá hằng năm, và chỉ vận hành được số ô có hạn.", "Every art has a drawback or yearly cost, and active slots are limited."))}
      <h3>${T("Đạo niệm", "Concepts")} <small>${T("chuyên tâm trong năm Tu luyện", "study during Cultivation years")}: +${G.STUDY_RATE}/${T("năm", "yr")}</small></h3>
      <div class="vk2-t-grid">${rows || `<p class="vk2-note">${T("Chưa có đạo niệm nào. Từ 6 tuổi, đạo niệm sẽ lớn theo cách bạn sống.", "No concepts yet. They grow from age 6 with how you live.")}</p>`}</div>
      ${hidden.length ? `<label class="vk2-field">${T("Chuyên tâm vào đạo niệm khác", "Study another concept")}<select data-study-select><option value="">—</option>${hidden.map((x) => `<option value="${x.id}">${esc(L(x.n))}</option>`).join("")}</select></label><div class="vk2-t-act"><button class="vk2-btn" data-act="study-pick">${T("Chọn", "Choose")}</button></div>` : ""}
      <h3>${T("Bí thuật đã sáng tạo", "Your arts")} <small>${d.active.length}/${slots} ${T("đang vận hành", "active")}</small></h3>
      <div class="vk2-t-grid">${arts || `<p class="vk2-note">${T("Chưa có.", "None yet.")}</p>`}</div>
      <h3>${T("Công thức khả dĩ", "Possible combinations")}</h3>
      <div class="vk2-t-grid">${recipes || `<p class="vk2-note">${T("Đạo niệm đạt 15 sẽ hé lộ công thức liên quan.", "A concept at 15 reveals related combinations.")}</p>`}</div>`;
  }

  function realmHtml(c, a) {
    const d = G.ensure(c, a);
    const rows = d.open.map((o) => {
      const r = G.realmDef.get(o.id);
      const can = (c.realm ?? 0) >= r.realm && !d.run;
      return `<div class="vk2-t on"><b>${esc(L(r.n))}</b><small>${T("Nguy hiểm", "Danger")}: ${T(G.DANGER[r.danger], G.DANGER_EN[r.danger])} · ${r.floors} ${T("tầng", "levels")} · ${T("cần", "needs")} ${esc(realmName(r.realm))} · ${T("đóng sau", "closes in")} ${o.until - Math.floor(c.age)} ${T("năm", "yr")}</small><small>${T("Yêu thú", "Beasts")}: ${esc(r.foes.map((f) => L(f)).join(", "))}. ${T("Boss", "Boss")}: ${esc(L(r.boss))}. ${T("Cạnh tranh", "Rivals")}: ${esc(L(r.rival))}.</small><div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="realm-go" data-id="${o.id}" ${can ? "" : "disabled"}>${T("Tiến vào", "Enter")}</button></div></div>`;
    }).join("");
    const all = G.REALMS.map((r) => `<li><b>${esc(L(r.n))}</b> · ${T(G.DANGER[r.danger], G.DANGER_EN[r.danger])} · ${r.floors} ${T("tầng", "levels")} · ${esc(realmName(r.realm))}${r.needSect ? T(", cần có tông môn", ", needs a sect") : ""}${r.needLives ? T(`, từ kiếp ${r.needLives}`, `, from life ${r.needLives}`) : ""}</li>`).join("");
    return `${guide(T("Bí cảnh mở ngẫu nhiên và có hạn. Mỗi tầng là một kỳ ngộ: tiến sâu, tìm đường khác, hoặc rút lui mang theo những gì đã có.", "Secret realms open at random for a limited time. Each level is an encounter: press on, find another way, or retreat with what you have."), T("Linh thạch, nguyên liệu, tu vi, đan dược, và có thể gặp truyền thừa.", "Stones, materials, cultivation, pills, and perhaps an inheritance."), T("Trận dùng chỉ số thật của bạn, máu mất đi không hồi giữa các tầng. Thua thì mất phần lớn chiến lợi phẩm, trọng thương, có thể chết.", "Fights use your real stats and lost strength does not recover between levels. Losing costs most of the spoils and causes grave wounds, possibly death."))}
      <h3>${T("Đang mở", "Open now")}</h3>
      ${(c.realm ?? 0) < 1 ? locked(T("Mở từ Luyện Khí.", "Opens from Qi Refining.")) : ""}
      <div class="vk2-t-grid">${rows || `<p class="vk2-note">${T("Chưa có bí cảnh nào mở. Khi có, nhật ký sẽ báo.", "None open. The log will tell you when one does.")}</p>`}</div>
      <p class="vk2-note">${T("Đã vào", "Entered")}: ${d.runs} · ${T("Đã đi hết", "Cleared")}: ${d.cleared}</p>
      <details class="vk2-closed"><summary>${T("Các loại bí cảnh", "Kinds of realm")} (${G.REALMS.length})</summary><ul>${all}</ul></details>`;
  }

  function inheritHtml(c, a) {
    const d = G.ensure(c, a);
    const owned = d.inherits.map((i) => {
      const def = G.inheritDef.get(i.id);
      return `<div class="vk2-t on"><b>${esc(L(def.n))}</b><p>${esc(L(def.mem))}</p><small>${T("Hiệu ứng", "Effect")}: ${esc(fxText(def.fx))}${i.bound ? T(" · đã nhận nhân quả", " · karma accepted") : T(" · đã gạt nhân quả", " · karma rejected")}</small></div>`;
    }).join("");
    const promises = d.promises.map((p) => `<li>${p.done ? "✓" : "○"} ${esc(L(p.t))} <span class="vk2-q-num">${fmt(Math.min(C.metric(p.goal[0], c, a), p.goal[1]))}/${fmt(p.goal[1])}</span></li>`).join("");
    const blood = d.blood ? `<p><b>${esc(L(G.BLOODS[d.blood].n))}</b>: ${esc(fxText({ ...G.BLOODS[d.blood].fx, ...G.BLOODS[d.blood].con }))}</p>` : "";
    const list = G.INHERITS.filter((t) => !d.inherits.some((i) => i.id === t.id)).map((t) => `<li><b>${esc(L(D.PATH_LABELS[t.path] ?? [t.path, t.path]))}</b>: ${esc(L(t.n))}. ${T("Tâm cảnh từ", "Mind State")} ${t.trial.tam}${t.trial.good ? T(", đạo tâm không tà", ", heart not evil") : ""}${t.trial.evil ? T(", đạo tâm không chính", ", heart not righteous") : ""}</li>`).join("");
    return `${guide(T("Truyền thừa nằm sâu trong bí cảnh. Đánh bại boss xong, người xưa thử lòng bạn bằng điều kiện tâm cảnh, rõ ràng và không may rủi.", "Inheritances lie deep in secret realms. After the boss, the ancient tests you with clear Mind State conditions, with no dice."), T("Đạo niệm lớn, hiệu ứng lâu dài; cùng đạo lộ thì học được chiêu thật; có thể thức tỉnh huyết mạch.", "A large concept boost and lasting effects; a real technique if your path matches; perhaps a bloodline."), T("Nhận truyền thừa thường đi kèm lời hứa. Không giữ lời thì nhân quả theo sang kiếp sau.", "Most legacies carry a promise. Break it and the karma follows you into the next life."))}
      <h3>${T("Đã nhận", "Received")}</h3><div class="vk2-t-grid">${owned || `<p class="vk2-note">${T("Chưa có.", "None yet.")}</p>`}</div>
      ${blood ? `<h3>${T("Huyết mạch", "Bloodline")}</h3>${blood}` : ""}
      ${promises ? `<h3>${T("Lời hứa", "Promises")}</h3><ul class="vk2-near">${promises}</ul>` : ""}
      <details class="vk2-closed"><summary>${T("Truyền thừa chưa gặp", "Legacies not yet found")}</summary><ul>${list}</ul></details>`;
  }

  EXT.tabs.art = { n: ["Công Pháp", "Arts"], html: artHtml };
  EXT.tabs.realm = { n: ["Bí Cảnh", "Realms"], html: realmHtml };
  EXT.tabs.inherit = { n: ["Truyền Thừa", "Legacies"], html: inheritHtml };

  Object.assign(EXT.actions, {
    study(c, a, b) {
      const d = G.ensure(c, a);
      G.setStudy(c, a, d.study === b.dataset.id ? null : b.dataset.id);
      commit();
    },
    "study-pick"(c, a) {
      const id = document.querySelector("[data-study-select]")?.value;
      if (id) G.setStudy(c, a, id);
      commit();
    },
    "art-toggle"(c, a, b) {
      if (!G.toggleArt(c, a, b.dataset.id)) toast(T("Hết ô vận hành.", "No free slot."));
      commit();
    },
    "art-make"(c, a, b) {
      const input = document.querySelector(`[data-name="${b.dataset.id}"]`);
      const art = G.createArt(c, a, b.dataset.id, input?.value);
      if (art) {
        c.log.push({ age: Math.floor(c.age), tone: "big", text: T(`Sáng tạo bí thuật: ${art.name}.`, `Created an art: ${art.name}.`) });
        toast(T(`Sáng tạo bí thuật: ${art.name}`, `Created: ${art.name}`), "awake");
      }
      commit();
    },
    "realm-go"(c, a, b) {
      if (!U.canStartChain()) return toast(T("Hãy để thời gian trôi một năm rồi thử lại.", "Let a year pass, then try again."));
      if (!G.enter(c, a, b.dataset.id)) return;
      closeModal();
      U.startChain(c, a);
      commit();
    },
  });
  EXT.facts.push((c) => {
    const d = c.vk2?.dao;
    if (!d) return [];
    const art = G.activeArts(c)[0];
    return art ? [[T("Bí thuật", "Art"), art.name]] : [];
  });


  // ---------- Giai đoạn 3: luyện khí, phù lục, động phủ ----------

  const Q = globalThis.VK2Khi;
  const matNames = (need) => Object.entries(need).map(([id, n]) => `${L(Q.MATS[id].n)} ×${n}`).join(", ");

  function forgeHtml(c, a) {
    const k = Q.ensure(c, a);
    const mats = Object.entries(Q.MATS).map(([id, m]) => `<div class="vk2-t"><div class="vk2-q-top"><b>${esc(L(m.n))}</b><span class="vk2-q-num">${fmt(k.mats[id] ?? 0)}/${Q.MAT_CAP}</span></div><div class="vk2-t-act"><button class="vk2-btn" data-act="mat-buy" data-id="${id}" ${(c.linhThach ?? 0) >= Q.matPrice(c, id) ? "" : "disabled"}>${T("Mua", "Buy")} · ${fmt(Q.matPrice(c, id))}</button></div></div>`).join("");
    const items = k.items.map((it) => {
      const q = Q.QUAL[it.q];
      const worn = k.worn.includes(it.id);
      const natal = k.natal === it.id;
      const pw = Q.itemPower(c, it);
      const pro = Object.fromEntries(Object.entries(Q.KINDS[it.kind].fx).map(([s, x]) => [s, x * pw]));
      const cost = Q.enhanceCost(it);
      return `<div class="vk2-t ${worn ? "on" : ""}"><div><b>${esc(it.name)}</b> <span class="vk2-qual ${q.cls}">${esc(L(q.n))}</span> +${it.lv}${natal ? ` <small>${T("bản mệnh", "natal")}</small>` : ""}${it.spirit ? ` <small>${T("có khí linh", "awakened spirit")}</small>` : ""}</div>
        <small>${T("Hệ", "Element")}: ${it.el ? esc(L(D.ELEMENTS[it.el])) : T("không", "none")} · ${T("Độ bền", "Durability")} ${Math.ceil(it.dur)}/${q.dur}</small>
        <small>${T("Hiệu ứng", "Effect")}: ${it.dur > 0 ? esc(fxText(pro)) : T("đã hỏng", "broken")}</small>
        <div class="vk2-t-act">
          <button class="vk2-btn" data-act="item-wear" data-id="${it.id}" ${natal ? "disabled" : ""}>${worn ? T("Tháo", "Remove") : T("Trang bị", "Equip")}</button>
          <button class="vk2-btn" data-act="item-up" data-id="${it.id}" ${it.lv >= Q.ENHANCE_MAX ? "disabled" : ""}>${T("Cường hóa", "Enhance")} · ${fmt(cost.stones)}</button>
          <button class="vk2-btn" data-act="item-fix" data-id="${it.id}" ${it.dur >= q.dur ? "disabled" : ""}>${T("Sửa", "Repair")}</button>
          ${!k.natal && (c.realm ?? 0) >= Q.NATAL_REALM ? `<button class="vk2-btn vk2-claim" data-act="item-natal" data-id="${it.id}">${T("Nhận bản mệnh", "Bind as natal")}</button>` : ""}
        </div></div>`;
    }).join("");
    const kinds = Object.entries(Q.KINDS).map(([id, def]) => {
      const check = Q.canCraft(c, a, id);
      return `<div class="vk2-t ${check.ok ? "" : "locked"}"><b>${esc(L(def.n))}</b><small>${esc(fxText(def.fx))}</small><small>${esc(matNames(def.need))} · ${fmt(def.stones)} ${T("linh thạch", "stones")} · ${esc(realmName(def.realm))}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<div class="vk2-t-act"><button class="vk2-btn" data-act="craft" data-id="${id}" ${check.ok ? "" : "disabled"}>${T("Luyện", "Craft")}</button></div></div>`;
    }).join("");
    const talismans = Object.entries(Q.TALISMANS).map(([id, def]) => {
      const check = Q.canDraw(c, a, id);
      const n = k.talismans[id] ?? 0;
      const armable = ["ho_than", "hoa_cau", "tinh_tam"].includes(id);
      return `<div class="vk2-t ${k.armed === id ? "on" : ""}"><div class="vk2-q-top"><b>${esc(L(def.n))}</b><span class="vk2-q-num">×${n}</span></div><p>${esc(L(def.d))}</p><small>${T("Dùng cho", "Used for")}: ${esc(L(def.use))} · ${esc(matNames(def.need))} · ${fmt(def.stones)} ${T("linh thạch", "stones")}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<div class="vk2-t-act"><button class="vk2-btn" data-act="tali-draw" data-id="${id}" ${check.ok ? "" : "disabled"}>${T("Vẽ", "Draw")}</button>${armable ? `<button class="vk2-btn" data-act="tali-arm" data-id="${id}" ${n > 0 && !k.armed ? "" : "disabled"}>${k.armed === id ? T("Đang chuẩn bị", "Readied") : T("Chuẩn bị", "Ready")}</button>` : ""}</div></div>`;
    }).join("");
    return `${guide(T("Nguyên liệu đến từ săn yêu, du ngoạn, bí cảnh, dược viên, hoặc mua bằng linh thạch. Pháp bảo có phẩm, hệ, độ bền và có thể cường hóa; cường hóa đủ sâu thì sinh khí linh.", "Materials come from hunting, roaming, secret realms, the herb garden, or buying with stones. Treasures have grade, element and durability, and can be enhanced; deep enhancement awakens a spirit."), T("Tăng sức mạnh và thêm cơ chế trong trận. Bản mệnh (từ Kim Đan) lớn lên theo cảnh giới.", "More power and new battle mechanics. A natal treasure (from Golden Core) grows with your realm."), T("Cường hóa có thể thất bại và mất độ bền. Bản mệnh hỏng thì chủ nhân trọng thương.", "Enhancement can fail and costs durability. If a natal treasure breaks, its owner is gravely hurt."))}
      <h3>${T("Pháp bảo", "Treasures")} <small>${k.worn.length}/${Q.wornSlots(c)} ${T("đang dùng", "worn")} · ${k.items.length}/${Q.HELD_MAX} ${T("đang giữ", "held")}</small></h3>
      <div class="vk2-t-grid">${items || `<p class="vk2-note">${T("Chưa có pháp bảo do bạn luyện. Đồ của Lò rèn trong game vẫn dùng bình thường.", "No crafted treasures yet. Gear from the game's own forge still works as usual.")}</p>`}</div>
      <h3>${T("Luyện khí", "Crafting")} <small>${T("tay nghề", "skill")} ${Math.round(Q.craftScore(c))}</small></h3>
      <div class="vk2-t-grid">${kinds}</div>
      <h3>${T("Phù lục", "Talismans")}</h3>
      <div class="vk2-t-grid">${talismans}</div>
      <h3>${T("Nguyên liệu", "Materials")} <small>${T("giá tăng khi mua nhiều trong năm", "price climbs with yearly purchases")}</small></h3>
      <div class="vk2-t-grid">${mats}</div>`;
  }

  function caveHtml(c, a) {
    const k = Q.ensure(c, a);
    if (!k.cave) {
      const sites = Object.entries(Q.SITES).map(([id, s]) => {
        const check = Q.canFound(c, a, id);
        return `<div class="vk2-t ${check.ok ? "on" : "locked"}"><b>${esc(L(s.n))}</b><small>${esc(realmName(s.realm))} · ${fmt(s.stones)} ${T("linh thạch", "stones")} · ${T("linh khí", "qi")} ×${s.qi} · ${T("phí năm", "yearly fee")} ${s.upkeep}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<div class="vk2-t-act"><button class="vk2-btn" data-act="cave-found" data-id="${id}" ${check.ok ? "" : "disabled"}>${T("Khai phá", "Establish")}</button></div></div>`;
      }).join("");
      return `${guide(T("Động phủ là nơi ở lâu dài của tu sĩ, xây dần từng công trình. Mở từ Trúc Cơ.", "An abode is a cultivator's long-term home, built up over time. Opens at Foundation."), T("Tu nhanh hơn, có thu hoạch hằng năm, và có thể để lại cho đời sau.", "Faster cultivation, yearly yields, and something to leave behind."), T("Tốn phí duy trì mỗi năm. Bỏ bê thì xuống cấp, và có thể bị kẻ khác nhòm ngó.", "Costs a yearly fee. Neglect degrades it, and others may come for it."))}
        ${(c.realm ?? 0) < 2 ? locked(T("Mở từ Trúc Cơ.", "Opens at Foundation.")) : ""}<div class="vk2-t-grid">${sites}</div>`;
    }
    const site = Q.SITES[k.cave.site];
    const maxLv = Math.max(1, (c.realm ?? 0) - 1);
    const rows = Object.entries(Q.BUILDINGS).map(([id, b]) => {
      const lv = Q.buildLv(c, id);
      const cost = Q.buildCost(c, id);
      const can = cost !== null && cost !== undefined && lv < Q.BUILD_MAX && lv + 1 <= maxLv && (c.linhThach ?? 0) >= cost;
      return `<div class="vk2-t ${lv ? "on" : ""}"><div class="vk2-q-top"><b>${esc(L(b.n))}</b><span class="vk2-q-num">${T("cấp", "lv")} ${lv}/${Q.BUILD_MAX}</span></div><p>${esc(L(b.d))}</p><small>${T("Phí năm", "Yearly fee")}: +${b.upkeep}/${T("cấp", "lv")}</small>${lv < Q.BUILD_MAX ? `<small>${T("Cấp kế cần", "Next level")}: ${fmt(cost)} ${T("linh thạch", "stones")}${lv + 1 > maxLv ? T(`, và cảnh giới cao hơn`, `, and a higher realm`) : ""}</small>` : ""}<div class="vk2-t-act"><button class="vk2-btn" data-act="cave-build" data-id="${id}" ${can ? "" : "disabled"}>${lv ? T("Nâng cấp", "Upgrade") : T("Xây", "Build")}</button></div></div>`;
    }).join("");
    const d = c.vk2.dao;
    const stored = (d?.arts ?? []).map((art) => `<li>${esc(art.name)} ${k.cave.stored.includes(art.id) ? `<small>${T("đã cất", "stored")}</small>` : `<button class="vk2-btn" data-act="cave-store" data-id="${art.id}" ${Q.buildLv(c, "tang_kinh") ? "" : "disabled"}>${T("Cất vào tàng kinh các", "Store in the hall")}</button>`}</li>`).join("");
    return `${guide(T("Mỗi công trình cho một lợi ích khác nhau, phí duy trì trừ tự động mỗi năm từ linh thạch.", "Each structure gives a different benefit; the fee is taken from your stones each year."), T("Khi bạn chết, động phủ có thể được người thân hoặc đồ đệ kế thừa, bị bỏ hoang, hoặc thành di tích cho kiếp sau.", "When you die, the abode may pass to kin or disciples, be abandoned, or become a ruin for later lives."), T("Thiếu phí thì công trình không cho ra gì, bỏ bê lâu thì xuống cấp.", "Without the fee structures yield nothing, and long neglect degrades them."))}
      <h3>${esc(L(site.n))} <small>${T("cấp", "level")} ${k.cave.lv} · ${T("linh khí", "qi")} ×${site.qi} · ${T("phí năm", "yearly fee")} ${fmt(Q.upkeep(c))}</small></h3>
      ${k.neglected ? `<p class="vk2-lock">${T(`Đang thiếu phí duy trì (${k.neglected}/${Q.NEGLECT_YEARS} năm).`, `Upkeep unpaid (${k.neglected}/${Q.NEGLECT_YEARS} years).`)}</p>` : ""}
      <div class="vk2-t-grid">${rows}</div>
      <h3>${T("Cất bí thuật cho đời sau", "Store arts for later lives")}</h3>
      ${stored ? `<ul class="vk2-near">${stored}</ul>` : `<p class="vk2-note">${T("Chưa có bí thuật nào để cất.", "No arts to store yet.")}</p>`}`;
  }

  const Bao = globalThis.VK2Bao;
  const Gear = globalThis.VK2Gear;
  const SLOT_NAMES = { vu_khi: ["Vũ khí", "Weapon"], ao: ["Áo", "Robe"], phu_kien: ["Phụ kiện", "Accessory"] };
  const PERK_NAMES = { pierce: ["Xuyên giáp", "Pierce"], shield: ["Hộ thể", "Shield"], dodge: ["Né đòn", "Dodge"] };
  /** fx của đồ trong game đã là phần trăm (atk 88 là +88%), khác fx của mod nên không dùng fxText. */
  const GEAR_FX = { atk: ["Công", "Attack"], def: ["Phòng", "Defence"], hp: ["Sinh lực", "HP"], crit: ["Bạo kích", "Crit"], cult: ["Tu luyện", "Cultivation"] };
  const gearFx = (fx) => Object.entries(fx).map(([k, x]) => `${L(GEAR_FX[k])} +${x}%`).join(", ");
  const perkText = (perk) => Object.entries(perk).map(([k, x]) => `${L(PERK_NAMES[k])} ${Math.round(x * 100)}%`).join(", ");
  function peerlessHtml(c, a) {
    const b = Bao.ensure(c, a);
    const rows = Gear.ITEMS.map((it) => {
      const check = Bao.canForge(c, a, it.id);
      const owned = (c.inventory ?? []).includes(it.id);
      const cost = Bao.COST[it.minRealm];
      return `<div class="vk2-t vk2-peer ${owned ? "on" : check.ok ? "" : "locked"}"><div class="vk2-q-top"><b>${esc(it.name)}</b><span class="vk2-q-num">${esc(L(SLOT_NAMES[it.slot]))} · ${esc(realmName(it.minRealm))}</span></div>
        <p>${esc(it.desc)}</p>
        <small>${esc(gearFx(it.fx))}</small>
        <small>${T("Thần thông", "Power")}: ${esc(perkText(it.perk))}</small>
        ${owned ? `<small>${T("Đã có. Mặc hoặc tháo trong Túi đồ.", "Owned. Wear or remove it in your Inventory.")}</small>` : `<small>${cost.essence} ${T("tinh hoa", "essence")} · ${fmt(cost.stones)} ${T("linh thạch", "stones")} · ${check.mat ? `${T("sẽ dùng", "will use")} ${esc(check.mat.name)}` : T("cần một món Cực phẩm cùng loại chưa mặc", "needs an unworn Supreme item of this type")}</small>
        ${check.ok ? "" : locked(reasonText(check.reasons))}
        <div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="bao-forge" data-id="${it.id}" ${check.ok ? "" : "disabled"}>${T("Đúc", "Forge")}</button></div>`}
      </div>`;
    }).join("");
    const beasts = Object.keys(Gear.PET_RANK).map((id) => {
      const rank = Gear.PET_RANK[id];
      const mine = c.pet && c.petKind === id;
      return `<div class="vk2-t ${mine ? "on" : ""}"><div class="vk2-q-top"><b>${esc(Gear.PETS[id].name)}</b><span class="vk2-q-num">${rank}</span></div><small>${mine ? T("Đang theo bạn", "With you now") : b.seen[id] !== undefined ? T("Đã gặp trong kiếp này", "Met in this life") : `${T("Có thể gặp từ", "Can appear from")} ${esc(realmName(Bao.BEAST[rank].realm))}`}</small></div>`;
    }).join("");
    return `${guide(T("Tuyệt phẩm là phẩm cao nhất, không rơi từ quái và không bán ở chợ. Muốn có phải đúc từ một món Cực phẩm cùng loại và Thiên Công Tinh Hoa.", "Peerless is the highest grade. It never drops and is never sold. You forge it from a Supreme item of the same type and Heavenly Essence."), T("Chỉ số cao hơn đồ Cực phẩm cùng mốc, và mỗi món có một thần thông dùng được trong mọi trận.", "Better stats than Supreme gear of the same tier, and a power that works in every fight."), T("Món Cực phẩm đem đúc sẽ mất. Đồ đang mặc không bị dùng.", "The Supreme item is consumed. Items you are wearing are never used."))}
      <h3>${T("Thiên Công Tinh Hoa", "Heavenly Essence")} <small>${b.essence}/${Bao.ESSENCE_CAP}</small></h3>
      <p class="vk2-note">${T(`Từ ${realmName(Bao.ESSENCE_REALM)}: đi hết một bí cảnh được ${Bao.CLEAR_GAIN} tinh hoa, diệt quái thỉnh thoảng rơi 1, và có thể gặp lão thợ rèn ẩn thế.`, `From ${realmName(Bao.ESSENCE_REALM)}: conquering a secret realm gives ${Bao.CLEAR_GAIN} essence, kills occasionally drop 1, and you may meet the hidden smith.`)}</p>
      <h3>${T("Trang bị", "Gear")}</h3>
      <div class="vk2-t-grid">${rows}</div>
      <h3>${T("Linh thú mới", "New beasts")} <small>${T("thắng trận mới có cơ hội thu phục", "win the fight for a chance to tame")}</small></h3>
      <div class="vk2-t-grid">${beasts}</div>`;
  }
  EXT.tabs.peerless = { n: ["Tuyệt Phẩm", "Peerless"], html: peerlessHtml };
  EXT.actions["bao-forge"] = (c, a, b) => {
    const it = Bao.forge(c, a, b.dataset.id);
    if (it) toast(`${T("Đúc thành", "Forged")}: ${it.name}`, "awake");
    commit(c);
  };
  EXT.tabs.cave = { n: ["Động Phủ", "Abode"], html: caveHtml };
  EXT.tabs.forge = { n: ["Luyện Khí", "Forge"], html: forgeHtml };
  Object.assign(EXT.actions, {
    "mat-buy"(c, a, b) {
      Q.buyMat(c, a, b.dataset.id);
      commit();
    },
    craft(c, a, b) {
      const it = Q.craft(c, a, b.dataset.id);
      if (it) {
        const q = Q.QUAL[it.q];
        c.log.push({ age: Math.floor(c.age), tone: it.q >= 3 ? "big" : "good", text: T(`Luyện thành ${it.name}, phẩm ${q.n[0]}.`, `Crafted ${it.name}, grade ${q.n[1]}.`) });
        toast(`${it.name}: ${L(q.n)}`, it.q >= 3 ? "awake" : "good");
      }
      commit();
    },
    "item-wear"(c, a, b) {
      if (!Q.toggleWorn(c, a, b.dataset.id)) toast(T("Hết ô trang bị, hoặc đây là bản mệnh.", "No free slot, or this is your natal treasure."));
      commit();
    },
    "item-up"(c, a, b) {
      const r = Q.enhance(c, a, b.dataset.id);
      if (!r) toast(T("Thiếu linh thạch hoặc nguyên liệu.", "Not enough stones or materials."));
      else if (r.ok) toast(r.spirit ? T("Pháp bảo sinh khí linh!", "The treasure awakens a spirit!") : T(`Cường hóa thành công: +${r.lv}`, `Enhanced to +${r.lv}`), r.spirit ? "awake" : "good");
      else toast(T("Cường hóa thất bại, độ bền giảm.", "Enhancement failed, and durability drops."));
      commit();
    },
    "item-fix"(c, a, b) {
      if (!Q.repair(c, a, b.dataset.id)) toast(T("Thiếu linh thạch hoặc Tinh thiết.", "Not enough stones or Fine Iron."));
      commit();
    },
    "item-natal"(c, a, b) {
      if (Q.bindNatal(c, a, b.dataset.id)) {
        c.log.push({ age: Math.floor(c.age), tone: "big", text: T("Nhận pháp bảo bản mệnh, từ nay cùng sống cùng chết.", "You bind a natal treasure: from now on, you rise and fall together.") });
        toast(T("Đã nhận bản mệnh.", "Natal treasure bound."), "awake");
      }
      commit();
    },
    "tali-draw"(c, a, b) {
      Q.draw(c, a, b.dataset.id);
      commit();
    },
    "tali-arm"(c, a, b) {
      Q.arm(c, a, b.dataset.id);
      commit();
    },
    "cave-found"(c, a, b) {
      if (Q.found(c, a, b.dataset.id)) {
        c.log.push({ age: Math.floor(c.age), tone: "big", text: T(`Khai phá động phủ: ${L(Q.SITES[b.dataset.id].n)}.`, `Established an abode: ${L(Q.SITES[b.dataset.id].n)}.`) });
        toast(T("Đã có động phủ.", "Abode established."), "awake");
      }
      commit();
    },
    "cave-build"(c, a, b) {
      Q.build(c, a, b.dataset.id);
      commit();
    },
    "cave-store"(c, a, b) {
      Q.storeArt(c, a, b.dataset.id);
      commit();
    },
  });
  EXT.facts.push((c) => {
    const k = c.vk2?.khi;
    if (!k) return [];
    const out = [];
    const natal = k.natal && Q.itemOf(k, k.natal);
    if (natal) out.push([T("Bản mệnh", "Natal"), `${natal.name} +${natal.lv}`]);
    if (k.cave) out.push([T("Động phủ", "Abode"), `${L(Q.SITES[k.cave.site].n)} · ${T("cấp", "lv")} ${k.cave.lv}`]);
    return out;
  });


  // ---------- Giai đoạn 4: sư đồ, gia tộc, tông môn, nhân vật trong thế giới ----------

  const H = globalThis.VK2The;
  const npcLine = (w, n) => `${esc(n.n)} · ${n.r ? esc(L(H.REALM_N[n.r])) : T("phàm nhân", "mortal")} · ${H.ageOf(w, n)} ${T("tuổi", "yrs")} · ${esc(L(H.PATH_NAME[n.pa]))} · ${esc(L(H.PERSONAS[n.pe].n))}`;
  const npcMem = (n) => (n.mem.length ? `<small>${n.mem.slice(-2).map((m) => esc(L(m[1]))).join(" · ")}</small>` : "");

  function mentorHtml(c, a) {
    const h = H.ensure(c, a);
    const w = a.world;
    const m = H.myMaster(c, a);
    const masterBox = m
      ? `<div class="vk2-t on"><b>${T("Sư phụ", "Master")}: ${esc(m.n)}</b><small>${npcLine(w, m)}</small>${meter(T("Thân thiết", "Bond"), Math.max(0, m.aff), 100)}${npcMem(m)}<small>${T("Đang có sư phụ: tu nhanh hơn 4%, đột phá +1%.", "With a master: 4% faster cultivation, +1% breakthrough.")}</small><div class="vk2-t-act"><button class="vk2-btn" data-act="m-learn" ${H.canLearn(c, a) ? "" : "disabled"}>${T("Xin học", "Ask to learn")}${H.canLearn(c, a) ? "" : ` · ${H.LEARN_GAP - (Math.floor(c.age) - h.learnAt)} ${T("năm nữa", "yrs")}`}</button><button class="vk2-btn" data-act="m-leave">${T("Rời sư môn", "Leave")}</button></div></div>`
      : H.masterCandidates(c, a).map((n) => {
          const check = H.canApprentice(c, a, n.id);
          return `<div class="vk2-t ${check.ok ? "" : "locked"}"><b>${esc(n.n)}</b><small>${npcLine(w, n)}</small><small>${T("Lễ bái sư", "Gift")}: ${fmt(H.giftCost(n))} ${T("linh thạch", "stones")}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<div class="vk2-t-act"><button class="vk2-btn" data-act="m-join" data-id="${n.id}" ${check.ok ? "" : "disabled"}>${T("Bái sư", "Apprentice")}</button></div></div>`;
        }).join("") || `<p class="vk2-note">${T("Chưa ai trong thế giới phù hợp để nhận bạn.", "No one suitable right now.")}</p>`;
    const slots = H.discSlots(c.realm ?? 0);
    const arts = c.vk2.dao?.arts ?? [];
    const mine = H.myDisciples(c, a).map((n) => `<div class="vk2-t on"><b>${esc(n.n)}</b><small>${npcLine(w, n)}</small>${meter(T("Tiến độ tu", "Progress"), n.p, 100)}${meter(T("Thân thiết", "Bond"), Math.max(0, n.aff), 100)}${npcMem(n)}${n.task ? `<small>${T("Đang đi làm nhiệm vụ", "Away on an errand")}</small>` : ""}<div class="vk2-t-act">${arts.map((x) => `<button class="vk2-btn" data-act="d-teach" data-id="${n.id}" data-art="${x.id}" ${Math.floor(c.age) - h.teachAt >= H.TEACH_GAP ? "" : "disabled"}>${T("Truyền", "Teach")} ${esc(x.name)}</button>`).join("")}<button class="vk2-btn" data-act="d-help" data-id="${n.id}" ${(c.linhThach ?? 0) >= H.supportCost(n) ? "" : "disabled"}>${T("Hỗ trợ đột phá", "Support")} · ${fmt(H.supportCost(n))}</button><button class="vk2-btn" data-act="d-task" data-id="${n.id}" ${n.task ? "disabled" : ""}>${T("Giao nhiệm vụ", "Send on errand")}</button></div></div>`).join("");
    const cands = slots > H.myDisciples(c, a).length ? H.discCandidates(c, a).map((n) => {
      const check = H.canTakeDisciple(c, a, n.id);
      return `<div class="vk2-t"><b>${esc(n.n)}</b><small>${npcLine(w, n)}</small><div class="vk2-t-act"><button class="vk2-btn" data-act="d-take" data-id="${n.id}" ${check.ok ? "" : "disabled"}>${T("Nhận làm đồ đệ", "Accept")} · 100</button></div></div>`;
    }).join("") : "";
    return `${guide(T("Bái một người hơn bạn một cảnh giới trở lên. Từ Kim Đan có thể nhận đồ đệ; đồ đệ là người thật trong thế giới, tự tu luyện và có thể sống lâu hơn bạn.", "Apprentice to someone above your realm. From Golden Core you can take disciples: real people in the world who cultivate on their own and may outlive you."), T("Sư phụ dạy đạo niệm và chiêu thức. Đồ đệ mang đồ về, nối dõi bí thuật của bạn qua các đời.", "A master teaches concepts and techniques. Disciples bring back goods and carry your arts down the ages."), T("Bỏ sư môn hoặc bỏ bê đồ đệ đều có giá. Đồ đệ có thể phản bội và trở thành kẻ thù.", "Leaving a master or neglecting a disciple has a price. A disciple may betray you and become an enemy."))}
      <h3>${T("Sư phụ", "Master")}</h3><div class="vk2-t-grid">${masterBox}</div>
      <h3>${T("Đồ đệ", "Disciples")} <small>${H.myDisciples(c, a).length}/${slots}</small></h3>
      ${slots ? "" : locked(T("Từ Kim Đan mới nhận đồ đệ.", "Disciples open at Golden Core."))}
      <div class="vk2-t-grid">${mine}${cands}</div>`;
  }

  function familyHtml(c, a) {
    H.ensure(c, a);
    const w = a.world;
    const f = H.myFam(c, a);
    if (!f) {
      const check = H.canFoundFam(c, a);
      const list = Object.values(w.fams).slice(0, 8).map((x) => `<div class="vk2-t"><b>${esc(x.n)}</b><small>${T("Danh vọng", "Fame")} ${Math.floor(x.rep)} · ${T("Lãnh địa", "Land")} ${x.land} · ${T("Thành viên", "Members")} ${w.npcs.filter((n) => n.fam === x.n).length}</small><div class="vk2-t-act"><button class="vk2-btn" data-act="f-join" data-id="${esc(x.n)}" ${(c.linhThach ?? 0) >= 150 ? "" : "disabled"}>${T("Xin gia nhập", "Ask to join")} · 150</button></div></div>`).join("");
      return `${guide(T("Gia nhập một gia tộc đang có, hoặc tự lập từ Trúc Cơ.", "Join an existing clan, or found one from Foundation."), T("Lãnh địa cho linh thạch mỗi năm. Huyết mạch và công pháp gia tộc truyền cho hậu duệ.", "Land yields stones yearly. Bloodline and clan arts pass to your descendants."), T("Gia tộc cần của cải để lớn. Không còn ai nối dõi thì sẽ tuyệt tự.", "A clan needs wealth to grow, and dies out with no heirs."))}
        <h3>${T("Lập gia tộc", "Found a clan")}</h3>
        <div class="vk2-t ${check.ok ? "on" : "locked"}"><small>${esc(realmName(H.OWN_FAM.realm))} · ${fmt(H.OWN_FAM.stones)} ${T("linh thạch", "stones")}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<label class="vk2-field">${T("Tên gia tộc", "Clan name")}<input maxlength="18" data-fam-name></label><div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="f-found" ${check.ok ? "" : "disabled"}>${T("Lập gia tộc", "Found")}</button></div></div>
        <h3>${T("Các gia tộc trong thiên hạ", "Clans of the world")}</h3><div class="vk2-t-grid">${list}</div>`;
    }
    const members = w.npcs.filter((n) => n.fam === f.n);
    const arts = c.vk2.dao?.arts ?? [];
    const can = H.canHaveChild(c, a);
    return `${guide(T("Góp của để mở lãnh địa, đưa bí thuật vào làm công pháp gia truyền, và nuôi dưỡng hậu duệ.", "Give wealth to open land, make an art the clan's heritage, and raise descendants."), T(`Lãnh địa cho ${f.land * 4} linh thạch mỗi năm. Có huyết mạch thì thành viên có thể thức tỉnh.`, `Land yields ${f.land * 4} stones yearly. A bloodline may awaken in members.`), T("Con cái cần có đạo lữ và thời gian. Hậu duệ có thể chết trước bạn.", "Children need a partner and time, and may die before you do."))}
      <h3>${esc(f.n)} <small>${T("danh vọng", "fame")} ${Math.floor(f.rep)} · ${T("gia sản", "wealth")} ${fmt(Math.floor(f.wealth))} · ${T("lãnh địa", "land")} ${f.land}/5</small></h3>
      ${f.blood ? `<p class="vk2-note">${T("Huyết mạch", "Bloodline")}: ${esc(L(globalThis.VK2Dao.BLOODS[f.blood].n))}</p>` : ""}
      ${f.tech ? `<p class="vk2-note">${T("Công pháp gia truyền", "Clan art")}: ${esc(f.tech.name)}</p>` : ""}
      <div class="vk2-t-act"><button class="vk2-btn" data-act="f-give" ${(c.linhThach ?? 0) >= 500 ? "" : "disabled"}>${T("Góp 500 linh thạch", "Give 500 stones")}</button><button class="vk2-btn" data-act="f-land" ${f.land < 5 && f.wealth >= H.landCost(f) ? "" : "disabled"}>${T("Mở lãnh địa", "Open land")} · ${fmt(H.landCost(f))}</button><button class="vk2-btn" data-act="f-child" ${can ? "" : "disabled"}>${T("Có thêm con", "Have a child")} · 300</button>${arts.map((x) => `<button class="vk2-btn" data-act="f-tech" data-id="${x.id}">${T("Đưa vào gia truyền", "Make clan art")}: ${esc(x.name)}</button>`).join("")}</div>
      ${!c.partner ? `<p class="vk2-note">${T("Cần có đạo lữ để có con.", "You need a partner to have children.")}</p>` : ""}
      <h3>${T("Thành viên", "Members")} <small>${members.length}</small></h3>
      <div class="vk2-t-grid">${members.slice(0, 12).map((n) => `<div class="vk2-t"><b>${esc(n.n)}</b><small>${npcLine(w, n)}</small>${npcMem(n)}</div>`).join("") || `<p class="vk2-note">${T("Chưa có thành viên nào khác.", "No other members yet.")}</p>`}</div>`;
  }

  function sectHtml(c, a) {
    const h = H.ensure(c, a);
    const w = a.world;
    const sec = H.mySect(c, a);
    const list = Object.values(w.sects).sort((x, y) => y.terr - x.terr);
    const wars = w.wars.map((x) => `<li>${esc(x.a)} ⚔ ${esc(x.b)}</li>`).join("");
    const rows = list.map((s) => `<div class="vk2-t ${s.n === c.sect ? "on" : ""}"><b>${esc(s.n)}</b><small>${T("Lãnh thổ", "Land")} ${s.terr} · ${T("Linh mạch", "Vein")} ${s.vein} · ${T("Kho", "Store")} ${fmt(Math.floor(s.store))} · ${T("Môn nhân", "Members")} ${w.npcs.filter((n) => n.s === s.n).length}${s.own ? ` · ${T("do bạn lập ở kiếp", "you founded in life")} ${s.own}` : ""}</small><small>${T("Công pháp", "Art")}: ${esc(L(globalThis.VK2Dao.CONCEPTS[s.concept] ?? ["—", "—"]))}${H.headOf(w, s.n) ? ` · ${T("Chưởng môn", "Head")}: ${esc(H.headOf(w, s.n).n)}` : ""}</small>${!c.sect && (c.realm ?? 0) >= 1 ? `<div class="vk2-t-act"><button class="vk2-btn" data-act="s-join" data-id="${esc(s.n)}">${T("Xin gia nhập", "Ask to join")}</button></div>` : ""}</div>`).join("");
    const rank = c.sectRank ?? 0;
    const shop = sec ? Object.entries(H.SECT_SHOP).map(([id, it]) => `<button class="vk2-btn" data-act="s-buy" data-id="${id}" ${h.contrib >= it.cost && sec.store >= it.cost ? "" : "disabled"}>${esc(L(it.n))} · ${it.cost}</button>`).join("") : "";
    const check = H.canFoundSect(c, a);
    const own = h.ownSect ? w.sects[h.ownSect] : null;
    return `${guide(T("Các tông môn trong thiên hạ có lãnh thổ, linh mạch, kho và quan hệ riêng. Chúng lớn lên, đánh nhau và có thể biến mất, kể cả khi bạn không làm gì.", "Sects have their own land, spirit veins, stores and diplomacy. They grow, fight and may vanish, even if you do nothing."), T("Linh mạch tăng tốc độ tu. Cống hiến đổi được nguyên liệu, đan và công pháp; đủ cống hiến thì thăng chức.", "A vein speeds cultivation. Merit buys materials, pills and arts, and raises your rank."), T("Tông thua trận sẽ mất đất, có thể bị diệt. Đứng ngoài chiến tranh thì mất cống hiến.", "A losing sect loses land and may be destroyed. Sitting out a war costs merit."))}
      ${sec ? `<h3>${esc(sec.n)} <small>${esc(L(H.RANK_NAME[Math.min(rank, 3)]))} · ${T("cống hiến", "merit")} ${Math.floor(h.contrib)}</small></h3>
        <div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="s-rank" ${H.canRankUp(c, a) ? "" : "disabled"}>${T("Thăng chức", "Promote")}${rank < 3 ? ` · ${H.RANK_NEED[rank + 1]}` : ""}</button><button class="vk2-btn" data-act="s-give" ${(c.linhThach ?? 0) >= 500 ? "" : "disabled"}>${T("Góp 500 linh thạch", "Give 500 stones")}</button>${shop}</div>` : `<p class="vk2-note">${T("Bạn chưa thuộc tông môn nào.", "You belong to no sect.")}</p>`}
      ${own ? `<h3>${T("Tông môn của bạn", "Your sect")}</h3><div class="vk2-t-act"><button class="vk2-btn" data-act="s-invest" data-id="terr" ${(c.linhThach ?? 0) >= H.investCost(own, "terr") && own.terr < 9 ? "" : "disabled"}>${T("Mở lãnh thổ", "Expand land")} · ${fmt(H.investCost(own, "terr"))}</button><button class="vk2-btn" data-act="s-invest" data-id="vein" ${(c.linhThach ?? 0) >= H.investCost(own, "vein") && own.vein < 9 ? "" : "disabled"}>${T("Khai linh mạch", "Tap a vein")} · ${fmt(H.investCost(own, "vein"))}</button></div>` : `<h3>${T("Tự lập tông môn", "Found a sect")}</h3><div class="vk2-t ${check.ok ? "on" : "locked"}"><small>${esc(realmName(H.OWN_SECT.realm))} · ${fmt(H.OWN_SECT.stones)} ${T("linh thạch", "stones")} · ${T("ít nhất", "at least")} ${H.OWN_SECT.disciples} ${T("đồ đệ", "disciple")}</small>${check.ok ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<label class="vk2-field">${T("Tên tông môn", "Sect name")}<input maxlength="20" data-sect-name></label><div class="vk2-t-act"><button class="vk2-btn vk2-claim" data-act="s-found" ${check.ok ? "" : "disabled"}>${T("Lập tông", "Found")}</button></div></div>`}
      ${wars ? `<h3>${T("Đang có chiến tranh", "Wars")}</h3><ul class="vk2-near">${wars}</ul>` : ""}
      <h3>${T("Thế lực trong thiên hạ", "Powers of the world")}</h3><div class="vk2-t-grid">${rows}</div>`;
  }

  function peopleHtml(c, a) {
    H.ensure(c, a);
    const w = a.world;
    const rank = (n) => (n.foe ? 5 : n.kin ? 4 : n.disc ? 3 : 0) + n.r / 20;
    const list = [...w.npcs].sort((x, y) => rank(y) - rank(x) || y.r - x.r).slice(0, 18);
    const tag = (n) => (n.foe ? T("kẻ thù", "enemy") : n.kin ? T(n.kin === (c.lifeNo ?? 0) ? "hậu duệ" : `hậu duệ từ kiếp ${n.kin}`, n.kin === (c.lifeNo ?? 0) ? "descendant" : `descendant of life ${n.kin}`) : n.disc ? T(n.disc === (c.lifeNo ?? 0) ? "đồ đệ" : `đồ đệ từ kiếp ${n.disc}`, n.disc === (c.lifeNo ?? 0) ? "disciple" : `disciple from life ${n.disc}`) : "");
    const rows = list.map((n) => `<div class="vk2-t"><div><b>${esc(n.n)}</b> ${tag(n) ? `<small>${esc(tag(n))}</small>` : ""}</div><small>${npcLine(w, n)}</small><small>${T("Mục tiêu", "Goal")}: ${esc(L(H.GOALS[n.go]))} · ${T("Căn cốt", "Root")} ${n.ro} · ${esc(L(H.TALENTS[n.ta].n))}${n.s ? ` · ${esc(n.s)}` : ""}${n.fam ? ` · ${esc(n.fam)}` : ""}</small>${npcMem(n)}</div>`).join("");
    const log = [...w.log].reverse().slice(0, 12).map((e) => `<li>${T("Năm", "Year")} ${e.y}: ${esc(L(e.t))}</li>`).join("");
    return `${guide(T(`Thế giới có ${w.npcs.length} nhân vật đang sống, tự tu luyện, kết đôi, sinh con, phản bội và chết đi theo từng năm. Thế giới vẫn trôi khi bạn đã qua đời.`, `The world has ${w.npcs.length} living people who cultivate, marry, have children, betray and die year by year. It goes on after your death.`), T("Người ở đây có thể trở thành sư phụ, đồ đệ, kẻ thù của bạn.", "These people can become your masters, disciples and enemies."), T("Không ai đứng yên chờ bạn: người bạn định kết giao có thể chết trước khi bạn kịp tới.", "No one waits for you: someone you meant to befriend may die first."))}
      <h3>${T("Thiên hạ", "The world")} <small>${T("năm", "year")} ${w.year}</small></h3><div class="vk2-t-grid">${rows}</div>
      <h3>${T("Thời sự", "News")}</h3>${log ? `<ul class="vk2-near">${log}</ul>` : `<p class="vk2-note">${T("Thiên hạ thái bình.", "All is quiet.")}</p>`}`;
  }

  EXT.tabs.mentor = { n: ["Sư Đồ", "Mentors"], html: mentorHtml };
  EXT.tabs.family = { n: ["Gia Tộc", "Clan"], html: familyHtml };
  EXT.tabs.sect = { n: ["Tông Môn", "Sects"], html: sectHtml };
  EXT.tabs.people = { n: ["Nhân Vật", "People"], html: peopleHtml };
  const logEvent = (c, tone, vi, en) => c.log.push({ age: Math.floor(c.age), tone, text: T(vi, en) });
  Object.assign(EXT.actions, {
    "m-join"(c, a, b) {
      const n = H.npcOf(a.world, Number(b.dataset.id));
      if (H.apprentice(c, a, Number(b.dataset.id))) {
        logEvent(c, "big", `Bái ${n.n} làm sư phụ.`, `Became the disciple of ${n.n}.`);
        toast(T("Đã bái sư.", "Apprenticed."), "good");
      }
      commit();
    },
    "m-learn"(c, a) {
      const r = H.learnFromMaster(c, a);
      if (r) toast(r.tech ? T("Sư phụ dạy bạn một chiêu mới.", "Your master teaches you a new technique.") : T("Bạn lĩnh hội thêm đạo niệm của sư phụ.", "You absorb more of your master's concept."), "good");
      commit();
    },
    "m-leave"(c, a) {
      if (H.leaveMaster(c, a)) logEvent(c, "bad", "Rời khỏi sư môn.", "You left your master.");
      commit();
    },
    "d-take"(c, a, b) {
      const n = H.npcOf(a.world, Number(b.dataset.id));
      if (H.takeDisciple(c, a, Number(b.dataset.id))) {
        logEvent(c, "good", `Nhận ${n.n} làm đồ đệ.`, `Took ${n.n} as a disciple.`);
        toast(T("Đã nhận đồ đệ.", "Disciple accepted."), "good");
      }
      commit();
    },
    "d-teach"(c, a, b) {
      if (H.teach(c, a, Number(b.dataset.id), b.dataset.art)) toast(T("Đã truyền công.", "Teaching done."), "good");
      commit();
    },
    "d-help"(c, a, b) {
      H.support(c, a, Number(b.dataset.id));
      commit();
    },
    "d-task"(c, a, b) {
      if (H.sendTask(c, a, Number(b.dataset.id))) toast(T(`Đồ đệ lên đường, ${H.TASK_YEARS} năm sau về.`, `Your disciple sets off, back in ${H.TASK_YEARS} years.`));
      commit();
    },
    "f-join"(c, a, b) {
      if (H.joinFam(c, a, b.dataset.id)) logEvent(c, "good", `Gia nhập ${b.dataset.id}.`, `Joined ${b.dataset.id}.`);
      commit();
    },
    "f-found"(c, a) {
      const name = document.querySelector("[data-fam-name]")?.value ?? "";
      const f = H.foundFam(c, a, name);
      if (f) {
        logEvent(c, "big", `Lập nên ${f.n}.`, `Founded ${f.n}.`);
        toast(f.n, "awake");
      }
      commit();
    },
    "f-give"(c, a) {
      H.famGive(c, a, 500);
      commit();
    },
    "f-land"(c, a) {
      H.famLand(c, a);
      commit();
    },
    "f-tech"(c, a, b) {
      if (H.famTech(c, a, b.dataset.id)) toast(T("Đã đưa vào công pháp gia truyền.", "It is now the clan's art."), "good");
      commit();
    },
    "f-child"(c, a) {
      const n = H.haveChild(c, a);
      if (n) {
        logEvent(c, "big", `${n.n} chào đời.`, `${n.n} is born.`);
        toast(n.n, "good");
      }
      commit();
    },
    "s-join"(c, a, b) {
      if (H.joinWorldSect(c, a, b.dataset.id)) logEvent(c, "good", `Gia nhập ${b.dataset.id}.`, `Joined ${b.dataset.id}.`);
      commit();
    },
    "s-rank"(c, a) {
      if (H.rankUp(c, a)) {
        logEvent(c, "good", "Được thăng chức trong tông.", "Promoted within the sect.");
        toast(T("Đã thăng chức.", "Promoted."), "good");
      }
      commit();
    },
    "s-give"(c, a) {
      H.donate(c, a, 500);
      commit();
    },
    "s-buy"(c, a, b) {
      if (H.exchange(c, a, b.dataset.id)) toast(T("Đã đổi.", "Exchanged."), "good");
      commit();
    },
    "s-found"(c, a) {
      const name = document.querySelector("[data-sect-name]")?.value ?? "";
      const s = H.foundSect(c, a, name);
      if (s) {
        logEvent(c, "big", `Lập nên ${s.n}.`, `Founded ${s.n}.`);
        toast(s.n, "awake");
      }
      commit();
    },
    "s-invest"(c, a, b) {
      H.invest(c, a, b.dataset.id);
      commit();
    },
  });
  EXT.facts.push((c, a) => {
    const h = c.vk2?.the;
    if (!h || !a?.world) return [];
    const out = [];
    const m = H.myMaster(c, a);
    if (m) out.push([T("Sư phụ", "Master"), m.n]);
    if (h.disciples.length) out.push([T("Đồ đệ", "Disciples"), String(h.disciples.length)]);
    if (h.fam) out.push([T("Gia tộc", "Clan"), h.fam]);
    return out;
  });


  // ---------- Giai đoạn 5: tâm ma, pháp tắc, đại sự kiện ----------

  const P = globalThis.VK2Phap;

  function heartHtml(c, a) {
    const p = P.ensure(c, a);
    const rows = Object.entries(P.WOUNDS).map(([id, w]) => `<div class="vk2-t ${(p.wounds[id] ?? 0) > 0 ? "" : "locked"}">${meter(L(w.n), p.wounds[id] ?? 0, P.WOUND_MAX)}<small>${T("Sức đối mặt nếu hiện hình", "Your resolve against it")}: ${P.faceScore(c, p, id)}/${P.FACE_NEED}</small></div>`).join("");
    const total = P.totalWounds(p);
    return `${guide(T("Mọi vết thương trong đời được ghi lại: phản bội, sát nghiệp, mất mát, thất bại đột phá, cừu hận, lời hứa bỏ quên, nghiệp tiền kiếp. Đầy đến một mức thì tâm ma hiện hình, và bạn phải chọn.", "Every wound of a life is recorded: betrayal, bloodshed, loss, failed breakthroughs, hatred, forgotten promises, past-life karma. Past a point the demon manifests, and you must choose."), T("Đối mặt thành công xóa hẳn vết thương và làm tâm cảnh vững hơn. Kết quả tính bằng đúng con số bạn thấy ở đây, không có xúc xắc.", "Facing it successfully erases the wound and steadies you. The result uses exactly the number you see here, with no dice."), T("Đối mặt khi chưa đủ sức sẽ tệ hơn. Phong ấn là nợ cho những lần đột phá sau. Thuận theo cho sức mạnh, nhưng Thiên Đạo ghi nhớ.", "Facing it too early makes things worse. Sealing is a debt for later breakthroughs. Giving in grants power, but Heaven remembers."))}
      <h3>${T("Sổ chấp niệm", "Attachments")} <small>${T("tổng", "total")} ${Math.floor(total)}, ${T("hiện hình từ", "manifests at")} ${P.DEMON_AT}</small></h3>
      <div class="vk2-t-grid">${rows}</div>
      <p class="vk2-note">${T("Đã vượt qua", "Overcome")}: ${p.faced} · ${T("Đang phong ấn", "Sealed")}: ${Math.floor(p.sealed)} · ${T("Đã thuận theo", "Gave in")}: ${p.gaveIn}</p>`;
  }

  function lawHtml(c, a) {
    const p = P.ensure(c, a);
    const realmOk = (c.realm ?? 0) >= P.LAW_REALM;
    const rows = Object.entries(P.LAWS).map(([id, def]) => {
      const t = P.lawTier(p, id);
      const check = P.canLaw(c, a, id);
      const on = p.lawOn.includes(id);
      const pr = P.lawProgress(p, id);
      const tierName = t ? L(P.TIERS[t - 1]) : T("Chưa cảm ngộ", "Unsensed");
      return `<div class="vk2-t ${on ? "on" : check.ok || t ? "" : "locked"}"><div class="vk2-q-top"><b>${esc(L(def.n))}</b><span class="vk2-q-num">${esc(tierName)}</span></div><p>${esc(L(def.d))}</p>${t < P.TIERS.length ? meter(T("Tiến độ bậc kế", "Next tier"), Math.floor(pr.cur), pr.need) : ""}<small>${T("Nguồn", "Source")}: ${esc(L(globalThis.VK2Dao.CONCEPTS[def.src]))}</small>${check.ok || on ? "" : `<small>${esc(reasonText(check.reasons))}</small>`}<div class="vk2-t-act"><button class="vk2-btn" data-act="law-toggle" data-id="${id}" ${check.ok || on ? "" : "disabled"}>${on ? T("Ngừng tu", "Stop") : T("Chuyên tu", "Pursue")}</button></div></div>`;
    }).join("");
    return `${guide(T("Từ Nguyên Anh, một đạo niệm đủ sâu có thể mở ra pháp tắc. Pháp tắc tiến qua sáu bậc: Cảm ngộ, Lĩnh ngộ, Đạo Ý, Lĩnh Vực, Pháp Tắc, Chứng Đạo.", "From Nascent Soul, a deep enough concept can open a law. Laws advance through six tiers: Sensing, Comprehension, Dao Intent, Domain, Law, Dao Proof."), T("Mỗi pháp tắc đổi cách bạn đánh hoặc sống: rút lui chắc chắn, hồi sinh sức khỏe, thêm thọ, thêm cơ chế trận.", "Each law changes how you fight or live: sure escape, restored health, more lifespan, new battle mechanics."), T(`Chỉ tu được ${P.LAW_MAX_ACTIVE} cùng lúc, mỗi năm tu chia đều. Vài pháp tắc có cái giá riêng.`, `Only ${P.LAW_MAX_ACTIVE} can be pursued at once, sharing each year. Some laws have their own price.`))}
      ${realmOk ? "" : locked(T("Mở từ Nguyên Anh.", "Opens at Nascent Soul."))}
      <p class="vk2-note">${T("Bậc cao nhất ở đây là đỉnh của riêng pháp tắc đó. Kết cục Chứng Đạo của cuộc đời vẫn theo đúng cơ chế cũ của game.", "The top tier is the peak of that law alone. The Dao Proof ending of a life still follows the game's existing rules.")}</p>
      <div class="vk2-t-grid">${rows}</div>`;
  }

  function crisisHtml(c, a) {
    P.ensure(c, a);
    const w = a.world;
    const cr = w?.crisis;
    const past = [...(w?.crisisPast ?? [])].reverse().map((x) => {
      const def = P.CRISES[x.id];
      return `<li>${T("Năm", "Year")} ${x.y}: ${esc(L(def.n))} · ${esc(L(x.ok ? def.good : def.bad))}</li>`;
    }).join("");
    return `${guide(T("Thỉnh thoảng thiên hạ có đại biến kéo dài nhiều năm. Trong lúc đó bạn sẽ được hỏi có góp sức không, và thế cuộc có thể đổi hướng theo việc bạn làm.", "Every so often the world faces an upheaval lasting many years. You will be asked whether to help, and events may turn on what you do."), T("Kết cục đổi thật thế giới: linh mạch, lãnh thổ, nhân vật mới.", "The outcome really changes the world: veins, territory, new people."), T("Xông pha có thể bị trọng thương. Lợi dụng thời loạn thì giàu, nhưng thiên hạ tệ đi.", "Going to the front can maim you. Profiting from chaos makes you rich, and the world worse."))}
      ${cr ? `<h3>${esc(L(P.CRISES[cr.id].n))} <small>${T("tới năm", "until year")} ${cr.until}, ${T("hiện là", "now")} ${w.year}</small></h3><p>${esc(L(P.CRISES[cr.id].d))}</p>${meter(T("Thế cuộc", "State of affairs"), Math.round(cr.score), 100)}<p class="vk2-note">${T("Từ 50 trở lên khi kết thúc là kết cục tốt.", "50 or more at the end is the good outcome.")}</p>` : `<p class="vk2-note">${T("Hiện không có đại biến.", "No upheaval at present.")}</p>`}
      <h3>${T("Đã qua", "Past upheavals")}</h3>${past ? `<ul class="vk2-near">${past}</ul>` : `<p class="vk2-note">${T("Chưa có.", "None yet.")}</p>`}`;
  }

  EXT.tabs.heart = { n: ["Tâm Ma", "Heart"], html: heartHtml };
  EXT.tabs.law = { n: ["Đại Đạo", "Laws"], html: lawHtml };
  EXT.tabs.crisis = { n: ["Đại Biến", "Upheavals"], html: crisisHtml };
  Object.assign(EXT.actions, {
    "law-toggle"(c, a, b) {
      if (!P.toggleLaw(c, a, b.dataset.id)) toast(T("Chưa đủ điều kiện, hoặc đã tu đủ pháp tắc.", "Requirements unmet, or you are at the limit."));
      commit();
    },
  });
  EXT.facts.push((c) => {
    const p = c.vk2?.phap;
    if (!p) return [];
    const best = Object.keys(p.laws).map((id) => [id, P.lawTier(p, id)]).sort((x, y) => y[1] - x[1])[0];
    return best && best[1] ? [[T("Pháp tắc", "Law"), `${L(P.LAWS[best[0]].n)} · ${L(P.TIERS[best[1] - 1])}`]] : [];
  });


  // ---------- Giai đoạn 6: Thiên Mệnh, nhân quả ----------

  const M = globalThis.VK2Menh;

  function destinyHtml(c, a) {
    const m = M.ensure(c, a);
    const f = M.fateDef(c);
    const ledger = M.ledgerOf(m);
    const rows = Object.entries(M.LEDGER).map(([id, n]) => meter(L(n), Math.floor(ledger[id]), M.LEDGER_MAX)).join("");
    const rules = [...M.RULES, ...M.PASSIVE].map((r) => `<li>${esc(L(r.d))}</li>`).join("");
    const reacts = [...m.reacts].reverse().slice(0, 5).map((x) => `<li>${T("Năm", "Age")} ${x.y}: ${esc(L(M.RULES.find((r) => r.id === x.id)?.d ?? ["", ""]))}</li>`).join("");
    const passive = M.activePassives(m).map((p) => `<li>${esc(L(p.d))}</li>`).join("");
    const steps = f ? f.steps.map((s, i) => {
      const cur = C.metric(s.goal[0], c, a);
      const ok = cur >= s.goal[1];
      return `<li>${ok ? "✔" : "·"} ${esc(L(s.t))}${ok ? "" : ` <small>${Math.floor(cur)}/${s.goal[1]}</small>`}</li>`;
    }).join("") : "";
    const fateBox = f
      ? `<div class="vk2-t on"><b>${esc(L(f.n))}</b><p>${esc(L(f.d))}</p><small>${T("Được", "Gain")}: ${esc(L(f.gain))}</small><small>${T("Đánh đổi", "Price")}: ${esc(L(f.cost))}</small><ul class="vk2-near">${steps}</ul>${m.fate.end ? `<small>${T("Đã đi tới kết cục của mệnh này.", "This fate has reached its end.")}</small>` : ""}</div>`
      : `<p class="vk2-note">${m.rolled ? T("Kiếp này không mang Thiên Mệnh đặc biệt. Phần lớn đời người đều như vậy.", "This life carries no special fate. Most lives do not.") : T(`Tới ${M.FATE_AGE} tuổi mới rõ đời này có mang Thiên Mệnh hay không.`, `Whether this life carries a fate becomes clear at age ${M.FATE_AGE}.`)}</p>`;
    return `${guide(T("Thiên Đạo ghi lại sát nghiệp, thiện duyên, việc nghịch thiên, cấm thuật và các món nợ. Có quy tắc rõ ràng cho từng phản ứng, được liệt kê bên dưới.", "Heaven records bloodshed, good deeds, defiance, forbidden arts and debts. Every reaction follows a clear rule, listed below."), T("Thiện duyên mở cơ duyên. Một số kiếp có Thiên Mệnh riêng với chuỗi nhiệm vụ và kết cục riêng.", "Good deeds open fortunes. Some lives carry a fate, with its own quests and ending."), T("Sát nghiệp dẫn tới truy sát, nghịch thiên làm thiên kiếp nặng hơn. Thiên Mệnh đều có đánh đổi và không bảo đảm thắng.", "Bloodshed brings hunters, and defiance makes tribulations heavier. Every fate has a price, and none guarantees victory."))}
      <h3>${T("Thiên Mệnh", "Fate")}</h3>${fateBox}
      <h3>${T("Sổ Thiên Đạo", "Heaven's Ledger")} <small>${T("phai dần theo năm", "fades with the years")}</small></h3>${rows}
      ${passive ? `<h3>${T("Đang chịu ảnh hưởng", "In effect")}</h3><ul class="vk2-near">${passive}</ul>` : ""}
      ${reacts ? `<h3>${T("Thiên Đạo đã phản ứng", "Heaven has reacted")}</h3><ul class="vk2-near">${reacts}</ul>` : ""}
      <h3>${T("Quy tắc", "Rules")}</h3><ul class="vk2-near">${rules}</ul>`;
  }

  function karmaHtml(c, a) {
    const m = M.ensure(c, a);
    const lg = a.legacy ?? { items: [], debt: 0 };
    const w = a.world;
    const life = c.lifeNo ?? 0;
    const items = lg.items.filter((x) => x.used).slice(-10).reverse().map((x) => `<li>${esc(x.name ?? (x.k === "cave" ? L(globalThis.VK2Khi.SITES[x.site]?.n ?? ["Động phủ", "Abode"]) : x.k))} <small>${T("kiếp", "life")} ${x.life}</small></li>`).join("");
    const hidden = lg.items.filter((x) => !x.used && x.life < life).length;
    const past = [...(a.history ?? [])].reverse().slice(0, 8).map((h) => {
      const leg = h.legacy ?? {};
      const bits = [];
      if (leg.the?.ownSect) bits.push(T(`lập ${leg.the.ownSect}`, `founded ${leg.the.ownSect}`));
      if (leg.the?.disciples?.length) bits.push(T(`${leg.the.disciples.length} đồ đệ`, `${leg.the.disciples.length} disciples`));
      if (leg.the?.kids?.length) bits.push(T(`${leg.the.kids.length} con`, `${leg.the.kids.length} children`));
      if (leg.menh?.fate) bits.push(L(M.FATES[leg.menh.fate.id]?.n ?? ["", ""]));
      if (leg.menh?.caveFate) bits.push(T({ ke_thua: "động phủ có người giữ", di_tich: "động phủ thành di tích", bo_hoang: "động phủ bỏ hoang" }[leg.menh.caveFate], { ke_thua: "abode passed on", di_tich: "abode became a ruin", bo_hoang: "abode abandoned" }[leg.menh.caveFate]));
      return `<li><b>${T("Kiếp", "Life")} ${h.life}</b>: ${esc(L(D.REALM_LABELS[h.realm] ?? ["", ""]))}, ${h.age} ${T("tuổi", "yrs")}${bits.length ? ` · ${esc(bits.join(", "))}` : ""}</li>`;
    }).join("");
    const old = w ? w.npcs.filter((n) => (n.disc && n.disc < life) || (n.kin && n.kin < life)).slice(0, 8).map((n) => `<li>${esc(n.n)} · ${esc(L(globalThis.VK2The.REALM_N[n.r]))} · ${n.disc && n.disc < life ? T(`đồ đệ từ kiếp ${n.disc}`, `disciple from life ${n.disc}`) : T(`hậu duệ từ kiếp ${n.kin}`, `descendant from life ${n.kin}`)}</li>`).join("") : "";
    const mv = a.mv ?? {};
    return `${guide(T("Khi bạn chết, bí thuật, đồ đệ, hậu duệ, tông môn, động phủ, kẻ thù và lời hứa đều được ghi lại, rồi trôi vào thế giới. Đời sau có thể gặp lại chúng.", "When you die, your arts, disciples, descendants, sect, abode, enemies and promises are recorded and drift into the world. Later lives may meet them again."), T(`Mỗi kiếp tìm lại được tối đa ${M.FINDS_PER_LIFE} món. Đời này đã tìm: ${m.finds}.`, `Each life can recover up to ${M.FINDS_PER_LIFE} things. Found this life: ${m.finds}.`), T("Sức mạnh không đi theo bạn. Bí thuật tìm lại yếu hơn bản gốc, và nợ nhân quả cũng đi theo như di sản.", "Power does not follow you. A recovered art is weaker than the original, and debts of karma follow you just like legacies do."))}
      <div class="vk2-facts"><div><small>${T("Phúc duyên", "Fortune")}</small><b>${fmt(mv.p ?? 0)}</b></div><div><small>${T("Nghiệp", "Karma")}</small><b>${fmt(mv.n ?? 0)}</b></div><div><small>${T("Kiếp số", "Kiep count")}</small><b>${fmt(mv.k ?? 0)}</b></div><div><small>${T("Hồn lực", "Soul force")}</small><b>${fmt(mv.h ?? 0)}</b></div><div><small>${T("Nợ nhân quả", "Karmic debt")}</small><b>${Math.round(lg.debt ?? 0)}</b></div><div><small>${T("Dấu vết chưa gặp", "Traces unmet")}</small><b>${hidden}</b></div></div>
      <p class="vk2-note">${T("Phúc duyên, Nghiệp, Kiếp số, Hồn lực, Canh Mạnh Bà, Sổ Sinh Tử và Thiên thư vẫn theo đúng cơ chế cũ. Mục này chỉ đọc và nối vào nhân quả.", "Fortune, Karma, Kiep count, Soul force, Meng Po's soup, the Book of Life and Death and the Heavenly Book keep their existing rules. This page only reads them.")}</p>
      <h3>${T("Người cũ còn trong thiên hạ", "Old ties still in the world")}</h3>${old ? `<ul class="vk2-near">${old}</ul>` : `<p class="vk2-note">${T("Chưa có ai.", "No one yet.")}</p>`}
      <h3>${T("Đã tìm lại", "Recovered")}</h3>${items ? `<ul class="vk2-near">${items}</ul>` : `<p class="vk2-note">${T("Chưa tìm lại được gì.", "Nothing recovered yet.")}</p>`}
      <h3>${T("Các đời trước", "Past lives")}</h3>${past ? `<ul class="vk2-near">${past}</ul>` : `<p class="vk2-note">${T("Đây là đời đầu tiên.", "This is the first life.")}</p>`}`;
  }

  EXT.tabs.destiny = { n: ["Thiên Mệnh", "Fate"], html: destinyHtml };
  EXT.tabs.karma = { n: ["Nhân Quả", "Karma"], html: karmaHtml };
  EXT.facts.push((c) => {
    const f = M.fateDef(c);
    return f ? [[T("Thiên Mệnh", "Fate"), L(f.n)]] : [];
  });

  // ---------- Thiên Hạ Ký Sự ----------

  const Su = globalThis.VK2Su;
  const TRACE_NAMES = { an_nhan: ["Ân nhân", "Benefactor"], ke_thu: ["Kẻ thù", "Enemy"], loi_hua: ["Lời hứa", "Promise"], de_tu: ["Đệ tử", "Disciple"], dao_lu: ["Đạo lữ", "Companion"], hau_due: ["Hậu duệ", "Descendant"], truyen_thua: ["Truyền thừa", "Legacy"], tong: ["Tông môn", "Sect"], bi_canh: ["Bí cảnh", "Realm"], dai_su: ["Đại sự", "Great deed"] };
  const tierTag = (t) => `<small class="vk2-tier vk2-tier-${t}">${esc(Su.TIER_MARK[t] ?? "")} ${esc(L(Su.TIERS[t] ?? Su.TIERS[0]))}</small>`;
  const nameList = (names) => Object.values(names ?? {}).filter(Boolean).map(esc).join(", ");

  function chronicleHtml(c, a) {
    const v = Su.chronicle(c, a);
    const running = v.running.map((r) => {
      const history = r.choices.filter((x) => x.life === (c.lifeNo ?? 0)).map((x) => `<li>${T("Năm", "Year")} ${x.y}: ${esc(L(x.l))}</li>`).join("");
      return `<div class="vk2-t ${r.joined ? "on" : ""}"><b>${esc(L(r.n))}</b>${tierTag(r.tier)}<small>${T("Hiện tại", "Now")}: ${esc(fillNames(L(r.stage), r.names, c))}</small><small>${T("Giai đoạn sau khoảng", "Next stage in about")} ${Math.max(0, r.until - r.year)} ${T("năm", "yr")} · ${r.joined ? T("bạn đã can dự", "you are involved") : T("chưa can dự, vẫn tự diễn biến", "not involved, unfolding by itself")}</small>${nameList(r.names) ? `<small>${T("Nhân vật", "People")}: ${nameList(r.names)}</small>` : ""}${history ? `<ul class="vk2-near">${history}</ul>` : ""}${r.lost ? `<small>${T("Bạn của kiếp trước đã bỏ dở.", "A former you left this unfinished.")}</small>` : ""}</div>`;
    }).join("");
    const ended = v.ended.map((r) => `<li><b>${esc(L(r.n))}</b>: ${esc(fillNames(L(r.end), r.names, c))} <small>(${T("năm", "year")} ${r.y}${r.joined ? `, ${T("có bạn can dự", "you took part")}` : ""})</small></li>`).join("");
    const world = v.world.map((e) => `<li>${T("Năm", "Year")} ${e.y}: ${esc(L(e.t))}</li>`).join("");
    const people = v.people.map((p) => `<li><b>${esc(p.n)}</b> · ${esc(L(p.chain))} · ${p.alive ? T("còn sống", "alive") : T("đã mất", "dead")}</li>`).join("");
    const journal = v.journal.map((j) => `<li>${T("Tuổi", "Age")} ${j.y}: <b>${esc(L(j.t))}</b>${j.native ? "" : ` ${tierTag(j.tier ?? 0)}`} · ${esc(L(j.l))}${j.r ? ` <small>${esc(String(j.r).slice(0, 160))}</small>` : ""}</li>`).join("");
    const traces = v.traces.map((x) => `<li><b>${esc(L(TRACE_NAMES[x.k] ?? ["Nhân quả", "Karma"]))}</b>${x.n ? ` · ${esc(x.n)}` : ""}: ${esc(L(x.t))} <small>${x.life === (c.lifeNo ?? 0) ? T("kiếp này", "this life") : `${T("từ kiếp", "from life")} ${x.life}`}</small></li>`).join("");
    const none = (vi, en) => `<p class="vk2-note">${T(vi, en)}</p>`;
    return `${guide(T("Thế giới tự đi tiếp dù bạn có mặt hay không. Những cục diện lớn đi qua từng giai đoạn, và bạn có thể can dự khi chúng tới gần.", "The world moves on with or without you. Major affairs pass through stages, and you can step in when they come near."), T("Mỗi lần can dự làm đổi thế cuộc, có thể đổi cả kết cục, và để lại dấu vết cho những kiếp sau.", "Stepping in shifts the balance, may change the ending, and leaves marks for later lives."), T("Lựa chọn nào cũng có giá. Bỏ qua cũng là một lựa chọn: sự việc vẫn tới kết cục của nó.", "Every choice has a price. Staying out is also a choice: events still reach their end."))}
      <h3>${T("Đang diễn ra", "Unfolding now")}</h3><div class="vk2-t-grid">${running || none("Thiên hạ đang yên.", "The world is quiet.")}</div>
      <h3>${T("Nhân quả chưa giải", "Unsettled karma")}</h3>${traces ? `<ul class="vk2-near">${traces}</ul>` : none("Chưa có mối nào.", "None yet.")}
      <h3>${T("Nhân vật liên quan", "People involved")}</h3>${people ? `<ul class="vk2-near">${people}</ul>` : none("Bạn chưa dính vào cục diện nào.", "You have not joined any affair.")}
      <h3>${T("Biến cố thế giới", "World events")}</h3>${world ? `<ul class="vk2-near">${world}</ul>` : none("Chưa có ghi chép.", "No records yet.")}
      <h3>${T("Đã kết thúc", "Concluded")}</h3>${ended ? `<ul class="vk2-near">${ended}</ul>` : none("Chưa có cục diện nào kết thúc.", "No affair has ended yet.")}
      <h3>${T("Lựa chọn của bạn", "Your choices")}</h3>${journal ? `<ul class="vk2-near">${journal}</ul>` : none("Chưa có lựa chọn nào trong kiếp này.", "No choices yet this life.")}`;
  }
  const fillNames = (s, names, c) => String(s ?? "").replace(/\{foe\}/g, names?.foe ?? "?").replace(/\{ally\}/g, names?.ally ?? "?").replace(/\{sect\}/g, names?.sect ?? c.sect ?? "?");
  EXT.tabs.chronicle = { n: ["Thiên Hạ Ký Sự", "World Chronicle"], html: chronicleHtml };

  globalThis.__VK2_views = { guide, locked, reasonText, realmName };
})();
