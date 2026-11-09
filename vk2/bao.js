// Tuyệt phẩm và linh thú mới. Đồ và thú nằm trong bảng thật của game (vk2/gear.js), file này chỉ giữ cách có được chúng.
// Logic thuần, trạng thái ở char.vk2.bao.
(function (root) {
  "use strict";
  const C = root.VK2Core;
  const G = root.VK2Gear;
  const { rnd, yearOf, tr, addStat } = C.kit;

  // Mốc cảnh giới đầu tiên của đồ Tuyệt phẩm. Tinh hoa chưa rơi trước mốc này.
  const ESSENCE_REALM = 4;
  const COST = { 4: { essence: 3, stones: 3000 }, 7: { essence: 4, stones: 12000 }, 10: { essence: 6, stones: 50000 } };
  const ESSENCE_CAP = 12;
  const KILL_RATE = 0.01; // Trên mỗi lần diệt quái
  const KILL_GAP = 5; // Năm tối thiểu giữa hai lần rơi từ quái, để săn cả ngày cũng không cày được
  const CLEAR_GAIN = 2;
  const BEAST = {
    SR: { realm: 2, rate: 0.012, lv: [9, 15] },
    SSR: { realm: 4, rate: 0.008, lv: [13, 22] },
    SSS: { realm: 6, rate: 0.005, lv: [23, 30] },
  };
  const BEAST_GAP = 15;
  const SMITH_GAP = 30;
  const EV_SMITH = "vk2_bao_smith";
  const EV_BEAST = "vk2_bao_beast_";

  const QUESTS = [
    { id: "b_essence", t: ["Thu được một Thiên Công Tinh Hoa", "Obtain a Heavenly Essence"], goal: ["bao_essence", 1], r: { stones: 500 }, go: { tab: "peerless" } },
    { id: "b_forge", after: "b_essence", t: ["Đúc một món Tuyệt phẩm", "Forge a Peerless item"], goal: ["bao_made", 1], r: { stat: { tamCanh: 3 } }, go: { tab: "peerless" } },
    { id: "b_beast", t: ["Thu phục một linh thú mới", "Tame one of the new beasts"], goal: ["bao_pet", 1], r: { stat: { khiVan: 3 } }, go: { tab: "peerless" } },
  ];

  function ensure(c, acct) {
    const v = C.ensure(c, acct);
    if (!v.bao) v.bao = { v: 1, essence: 0, gained: 0, made: 0, dropAt: -99, beastAt: -99, smithAt: -99, seen: {} };
    return v.bao;
  }
  function metric(name, c) {
    const b = c.vk2?.bao;
    if (name === "bao_essence") return b?.gained ?? 0;
    if (name === "bao_made") return b?.made ?? 0;
    if (name === "bao_pet") return c.pet && G.PET_RANK[c.petKind] ? 1 : 0;
    return undefined;
  }
  function addEssence(c, acct, n) {
    const b = ensure(c, acct);
    const before = b.essence;
    b.essence = Math.min(ESSENCE_CAP, b.essence + n);
    b.gained += b.essence - before;
    return b.essence - before;
  }

  // ---------- Đúc ----------

  const ownItems = (c) => Array.isArray(c.inventory) ? c.inventory : [];
  const dupOf = (c, id) => c.dup?.[id] ?? 0;
  /** Cùng điều kiện bán đồ của game: đang mặc hoặc đã khóa thì không dùng, trừ khi còn bản dư. */
  const spareOf = (c, id) => ownItems(c).includes(id) && (dupOf(c, id) > 0 || (!Object.values(c.equipped ?? {}).includes(id) && !c.locked?.includes(id)));
  /** Đồ Cực phẩm cùng ô có thể đem đúc, món yếu nhất trước. */
  function materials(c, slot) {
    const score = (it) => Object.values(it.fx ?? {}).reduce((s, x) => s + Math.abs(x), 0);
    return ownItems(c).map((id) => G.itemOf(id)).filter((it) => it && it.rare === 3 && it.slot === slot && spareOf(c, it.id)).sort((a, b) => score(a) - score(b));
  }
  const reachedRealm = (c, r) => !!c.cosmos || (c.realm ?? 0) >= r;
  function canForge(c, acct, id) {
    const it = G.ITEMS.find((x) => x.id === id);
    if (!it) return { ok: false, reasons: [] };
    const b = ensure(c, acct);
    const cost = COST[it.minRealm];
    const reasons = [];
    if (ownItems(c).includes(id)) reasons.push(["Đã có món này", "You already own this"]);
    if (!reachedRealm(c, it.minRealm)) reasons.push(["Chưa đủ cảnh giới", "Your realm is too low"]);
    if (b.essence < cost.essence) reasons.push([`Cần ${cost.essence} tinh hoa`, `Needs ${cost.essence} essence`]);
    if ((c.linhThach ?? 0) < cost.stones) reasons.push(["Thiếu linh thạch", "Not enough stones"]);
    const mat = materials(c, it.slot)[0] ?? null;
    if (!mat) reasons.push(["Cần một món Cực phẩm cùng loại chưa mặc", "Needs an unworn Supreme item of the same type"]);
    return { ok: !reasons.length, reasons, mat, cost };
  }
  /** Đúc là chắc chắn: rủi ro nằm ở việc mất món Cực phẩm và phải đi tìm tinh hoa, không nằm ở tỷ lệ. */
  function forge(c, acct, id) {
    const check = canForge(c, acct, id);
    if (!check.ok) return null;
    const b = c.vk2.bao;
    const it = G.ITEMS.find((x) => x.id === id);
    b.essence -= check.cost.essence;
    b.made += 1;
    c.linhThach -= check.cost.stones;
    if (dupOf(c, check.mat.id) > 0) {
      const dup = { ...c.dup };
      if (dup[check.mat.id] > 1) dup[check.mat.id] -= 1;
      else delete dup[check.mat.id];
      c.dup = dup;
    } else {
      c.inventory = c.inventory.filter((x) => x !== check.mat.id);
    }
    c.inventory.push(id);
    c.equipped = { ...c.equipped, [it.slot]: id };
    c.log?.push({ age: yearOf(c), tone: "big", text: tr([`Đúc thành ${it.name} từ ${check.mat.name}.`, `Forged ${it.name} from ${check.mat.name}.`]) });
    return it;
  }

  // ---------- Thần thông trong trận ----------

  function duel(c) {
    const out = {};
    for (const id of Object.values(c.equipped ?? {})) {
      const perk = id && String(id).startsWith("tp_") ? G.ITEMS.find((x) => x.id === id)?.perk : null;
      for (const [k, x] of Object.entries(perk ?? {})) out[k] = (out[k] ?? 0) + x;
    }
    return out;
  }

  // ---------- Nguồn tinh hoa ----------

  /** Đồ rơi từ trận thắng thật, có khoảng cách tối thiểu tính theo năm. */
  function onBump(c, acct, name, n) {
    if (name !== "kills" || !reachedRealm(c, ESSENCE_REALM)) return;
    const b = ensure(c, acct);
    const year = yearOf(c);
    if (year - b.dropAt < KILL_GAP) return;
    b.kills = (b.kills ?? 0) + n;
    if (rnd(c, year, 310 + b.kills) < KILL_RATE && addEssence(c, acct, 1)) b.dropAt = year;
  }
  function onRealmCleared(c, acct) {
    if (reachedRealm(c, ESSENCE_REALM)) addEssence(c, acct, CLEAR_GAIN);
  }

  // ---------- Sự kiện ----------

  function smithDef(c, acct) {
    const price = 1500 * Math.max(1, c.realm ?? 1);
    return {
      id: EV_SMITH,
      title: tr(["Lão thợ rèn ẩn thế", "The Hidden Smith"]),
      text: () => tr(["Trong sơn cốc có tiếng búa đều đều. Ông lão không ngẩng lên, chỉ chìa ra một mảnh tinh thạch còn nóng: \"Đồ tốt không để cho người không biết giá.\"", "A steady hammer rings through the valley. The old man does not look up, only holds out a shard of crystal, still hot: \"Good things are not for those who don't know their price.\""]),
      choices: () => [
        { label: tr([`Trả ${price} linh thạch`, `Pay ${price} stones`]), hint: tr(["+1 Thiên Công Tinh Hoa", "+1 Heavenly Essence"]), lean: "trung", run: (n) => {
          if ((n.linhThach ?? 0) < price) return tr(["Ông lão đếm xong túi của bạn rồi lắc đầu, lại cúi xuống đe.", "The old man counts your purse, shakes his head and bends back to the anvil."]);
          n.linhThach -= price;
          addEssence(n, acct, 1);
          return tr(["Mảnh tinh thạch vẫn còn ấm trong tay áo bạn suốt cả ngày.", "The crystal stays warm in your sleeve all day."]);
        } },
        { label: tr(["Chắp tay rồi đi", "Bow and walk on"]), lean: "trung", run: (n) => {
          addStat(n, "tamCanh", 1);
          return tr(["Tiếng búa vẫn đều đều sau lưng bạn.", "The hammer keeps its rhythm behind you."]);
        } },
      ],
    };
  }
  const levelOf = (c, id) => {
    const [lo, hi] = BEAST[G.PET_RANK[id]].lv;
    return lo + Math.floor(rnd(c, (c.lifeNo ?? 1) * 31, 340 + id.length) * (hi - lo + 1));
  };
  function beastDef(c, id) {
    const def = G.PETS[id];
    if (!def) return null;
    const lv = levelOf(c, id);
    const rank = G.PET_RANK[id];
    return {
      id: EV_BEAST + id,
      pet: () => id,
      title: tr([`Gặp ${def.name}`, `You meet the ${def.name}`]),
      text: () => def.meet,
      choices: () => [
        // beastFight là trường game đọc sau lựa chọn: vào trận thu phục thật, có giao diện và tỷ lệ của game
        { label: tr([`Giao chiến thu phục ${def.name} (${rank}, Lv${lv})`, `Fight to tame the ${def.name} (${rank}, Lv${lv})`]), hint: tr(["thắng mới có cơ hội thu phục", "only a win gives a chance to tame"]), lean: "chinh", run: (n) => {
          n.beastFight = { id, lv };
          return tr(["Bạn thủ thế. Nó nhìn bạn, không hề lùi lại.", "You take your stance. It looks at you, and does not back away."]);
        } },
        { label: tr(["Cúi chào rồi lui", "Bow and withdraw"]), lean: "trung", run: (n) => {
          addStat(n, "khiVan", 2);
          return tr([`${def.name} nhìn bạn một lúc rồi đi.`, `The ${def.name} watches you a while, then leaves.`]);
        } },
      ],
    };
  }
  /** Mỗi kiếp gặp mỗi con tối đa một lần. Phẩm càng cao càng hiếm và càng cần cảnh giới cao. */
  function pickBeast(c, b) {
    const year = yearOf(c);
    if (year - b.beastAt < BEAST_GAP) return null;
    const list = Object.keys(G.PET_RANK).filter((id) => !b.seen[id] && reachedRealm(c, BEAST[G.PET_RANK[id]].realm));
    for (const [i, id] of list.entries()) {
      if (rnd(c, year, 320 + i * 3) < BEAST[G.PET_RANK[id]].rate) return id;
    }
    return null;
  }
  function nextEvent(c, acct, opts) {
    if (opts?.closed || (c.realm ?? 0) < 1) return null;
    const b = ensure(c, acct);
    const year = yearOf(c);
    const id = pickBeast(c, b);
    if (id) {
      b.seen[id] = year;
      b.beastAt = year;
      return beastDef(c, id);
    }
    if (reachedRealm(c, ESSENCE_REALM) && year - b.smithAt >= SMITH_GAP && rnd(c, year, 330) < 0.015) {
      b.smithAt = year;
      return smithDef(c, acct);
    }
    return null;
  }
  function eventDef(c, acct, id) {
    if (id === EV_SMITH) return smithDef(c, acct);
    if (id.startsWith(EV_BEAST)) return beastDef(c, id.slice(EV_BEAST.length));
    return null;
  }

  const api = {
    kind: "bao", QUESTS, COST, ESSENCE_CAP, ESSENCE_REALM, CLEAR_GAIN, BEAST,
    ensure, metric, duel, onBump, onRealmCleared, nextEvent, eventDef, addEssence, materials, canForge, forge, pickBeast, beastDef, smithDef,
  };
  root.VK2Bao = api;
  C.register(api);
})(typeof globalThis !== "undefined" ? globalThis : this);
