// "Người chơi máy" cho mô phỏng: dùng đúng các hàm của giao diện, chọn đơn giản và có thể đoán được.
// Không phải chiến lược tối ưu. Mục đích là đi qua mọi hệ thống để tìm lỗi, kẹt và mất cân bằng.
(function () {
  const C = globalThis.VK2Core;
  const add = (out, k, n = 1) => (out.stats[k] = (out.stats[k] ?? 0) + n);
  const bots = [];

  // Giai đoạn 2
  bots.push({
    act(c, a, cfg, rng, out) {
      const G = globalThis.VK2Dao;
      const d = G.ensure(c, a);
      if (!d.study || (d.mastery[d.study] ?? 0) >= G.COMBINE_AT) {
        // Chuyên tâm vào nửa còn thiếu của công thức gần xong nhất
        const best = G.RECIPES.filter((r) => !d.arts.some((x) => x.recipe === r.id)).map((r) => ({ r, s: Math.min(d.mastery[r.a] ?? 0, G.COMBINE_AT) + Math.min(d.mastery[r.b] ?? 0, G.COMBINE_AT) })).sort((x, y) => y.s - x.s)[0];
        if (best) G.setStudy(c, a, (d.mastery[best.r.a] ?? 0) < G.COMBINE_AT ? best.r.a : best.r.b);
      }
      for (const r of G.RECIPES) if (G.canCreate(c, a, r.id).ok) G.createArt(c, a, r.id, "");
      if (cfg.choice !== "random" && !d.run && d.open.length && (c.stats?.sucKhoe ?? 0) >= 50) {
        const o = d.open.find((x) => (c.realm ?? 0) >= G.realmDef.get(x.id).realm && (c.realm ?? 0) >= G.realmDef.get(x.id).realm + (G.realmDef.get(x.id).danger >= 3 ? 1 : 0));
        if (o && G.enter(c, a, o.id)) return true;
      }
      return false;
    },
    pick(ev, c, a, cfg, rng, idx) {
      const id = String(ev.id);
      if (id === "vk2_bc_floor") {
        const run = c.vk2.dao.run;
        if (run && run.hp < 0.35) return idx[idx.length - 1][1];
        return idx[0][1];
      }
      return null;
    },
    check(c, a, out, age) {
      const d = c.vk2.dao;
      for (const [k, x] of Object.entries(d.mastery)) if (!(x >= 0 && x <= 100)) out.bad.push(`đạo niệm ${k}=${x} tuổi ${age}`);
      for (const art of d.arts) if (!(art.power >= 0.7 && art.power <= 1.25)) out.bad.push(`uy lực ${art.power}`);
      if (d.active.length > globalThis.VK2Dao.ART_SLOTS(c.realm ?? 0) + 1) out.bad.push(`quá ô bí thuật: ${d.active.length}`);
      if (d.open.length > 2) out.bad.push("quá nhiều bí cảnh mở");
    },
    collect(c, a, out) {
      const d = c.vk2.dao;
      add(out, "bcVao", d.runs);
      add(out, "bcHet", d.cleared);
      add(out, "biThuat", d.arts.length);
      add(out, "truyenThua", d.inherits.length);
      add(out, "loiHua", d.promises.length);
      add(out, "giuLoi", d.promises.filter((p) => p.done).length);
      if (d.blood) add(out, "huyetMach");
      if (d.run) add(out, "chetTrongBiCanh");
      if (d.run && !c.dead) out.bad.push("kết kiếp còn lượt bí cảnh");
    },
  });

  // Giai đoạn 3
  bots.push({
    act(c, a, cfg, rng) {
      const Q = globalThis.VK2Khi;
      const k = Q.ensure(c, a);
      const rich = (n) => (c.linhThach ?? 0) >= n;
      if (!k.cave) {
        for (const id of ["dia", "linh", "pham"]) if (Q.canFound(c, a, id).ok && rich(Q.SITES[id].stones * 2)) { Q.found(c, a, id); break; }
      } else {
        for (const id of ["tu_linh", "duoc_vien", "khi_phong", "tang_kinh", "phong_ngu"]) {
          const cost = Q.buildCost(c, id);
          if (cost && rich(cost * 3 + Q.upkeep(c) * 10)) { Q.build(c, a, id); break; }
        }
      }
      if (k.items.length < 3) {
        for (const id of Object.keys(Q.KINDS)) {
          for (const [m, n] of Object.entries(Q.KINDS[id].need)) while ((k.mats[m] ?? 0) < n && rich(Q.matPrice(c, m) * 6) && Q.buyMat(c, a, m));
          if (Q.canCraft(c, a, id).ok && rich(Q.KINDS[id].stones * 2)) { Q.craft(c, a, id); break; }
        }
      }
      for (const it of k.items) {
        if (it.dur < Q.QUAL[it.q].dur * 0.4) Q.repair(c, a, it.id);
        if (it.lv < 4 && rich(Q.enhanceCost(it).stones * 4)) Q.enhance(c, a, it.id);
      }
      if (!k.natal && k.items.length && (c.realm ?? 0) >= Q.NATAL_REALM) Q.bindNatal(c, a, k.items[0].id);
      if (!k.talismans.tinh_tam && Q.canDraw(c, a, "tinh_tam").ok && rich(800)) Q.draw(c, a, "tinh_tam");
      if (!k.armed && k.talismans.tinh_tam && (c.breakDelay ?? 1) <= 0) Q.arm(c, a, "tinh_tam");
      if (!k.talismans.don_tho && Q.canDraw(c, a, "don_tho").ok && rich(800)) Q.draw(c, a, "don_tho");
      return false;
    },
    check(c, a, out, age) {
      const Q = globalThis.VK2Khi;
      const k = c.vk2.khi;
      if ((c.linhThach ?? 0) < 0) out.bad.push(`linh thạch âm tuổi ${age}`);
      if (k.items.length > Q.HELD_MAX) out.bad.push("giữ quá số pháp bảo");
      if (k.worn.length > Q.wornSlots(c) + 2) out.bad.push("mặc quá số ô");
      for (const [m, n] of Object.entries(k.mats)) if (!(n >= 0 && n <= Q.MAT_CAP)) out.bad.push(`nguyên liệu ${m}=${n}`);
      for (const it of k.items) if (!(it.dur >= 0 && it.lv <= Q.ENHANCE_MAX)) out.bad.push(`pháp bảo sai ${JSON.stringify(it)}`);
    },
    collect(c, a, out) {
      const k = c.vk2.khi;
      add(out, "phapBao", k.items.length);
      if (k.natal) add(out, "banMenh");
      if (k.cave) add(out, "dongPhu");
      if (k.cave) add(out, "congTrinh", Object.values(k.cave.b).reduce((s, n) => s + n, 0));
      add(out, "phuDaVe", k.taliMade);
    },
  });

  // Giai đoạn 4
  bots.push({
    act(c, a, cfg, rng) {
      const H = globalThis.VK2The;
      const h = H.ensure(c, a);
      const rich = (n) => (c.linhThach ?? 0) >= n;
      if (!h.master && Math.floor(c.age) >= 16) {
        const m = H.masterCandidates(c, a).find((n) => H.canApprentice(c, a, n.id).ok && rich(H.giftCost(n) * 2));
        if (m) H.apprentice(c, a, m.id);
      }
      if (H.canLearn(c, a)) H.learnFromMaster(c, a);
      if (cfg.choice !== "random") {
        const d = H.discCandidates(c, a).find((n) => H.canTakeDisciple(c, a, n.id).ok);
        if (d && rich(300)) H.takeDisciple(c, a, d.id);
      }
      const arts = c.vk2.dao?.arts ?? [];
      for (const n of H.myDisciples(c, a)) {
        if (arts[0]) H.teach(c, a, n.id, arts[0].id);
        if (!n.task && Math.floor(c.age) % 9 === 0) H.sendTask(c, a, n.id);
        if (rich(H.supportCost(n) * 5) && n.p < 60) H.support(c, a, n.id);
      }
      if (!c.sect && (c.realm ?? 0) >= 1 && cfg.choice !== "evil") {
        const names = Object.keys(a.world.sects);
        if (names.length) H.joinWorldSect(c, a, names[Math.floor(rng() * names.length)]);
      }
      if (H.canRankUp(c, a)) H.rankUp(c, a);
      if (c.sect && h.contrib >= 60) H.exchange(c, a, "art");
      if (H.canFoundSect(c, a).ok && rich(H.OWN_SECT.stones * 1.5) && !c.sect) H.foundSect(c, a, "");
      if (H.canFoundFam(c, a).ok && rich(H.OWN_FAM.stones * 2)) H.foundFam(c, a, "");
      const f = H.myFam(c, a);
      if (f) {
        if (rich(4000)) H.famGive(c, a, 500);
        H.famLand(c, a);
        if (arts[0] && !f.tech) H.famTech(c, a, arts[0].id);
        if (c.partner && H.canHaveChild(c, a) && rich(800)) H.haveChild(c, a);
      }
      return false;
    },
    check(c, a, out, age) {
      const H = globalThis.VK2The;
      const w = a.world;
      if (w.npcs.length > H.NPC_CAP + 4) out.bad.push(`quá NPC: ${w.npcs.length}`);
      for (const n of w.npcs) if (!(n.r >= 0 && n.r <= H.REALM_MAX && n.p <= 100 && Number.isFinite(n.p))) out.bad.push(`NPC sai ${JSON.stringify(n).slice(0, 80)}`);
      if (c.vk2.the.disciples.length > H.discSlots(c.realm ?? 0) + 1) out.bad.push(`quá đồ đệ ${c.vk2.the.disciples.length}`);
      if ((c.sectRank ?? 0) > 3) out.bad.push("sectRank vượt 3");
      for (const s of Object.values(w.sects)) if (!(s.terr >= 0 && s.terr <= 9 && s.vein >= 0 && s.vein <= 9 && Number.isFinite(s.store))) out.bad.push(`tông sai ${s.n} ${s.terr}/${s.vein}/${s.store}`);
      if (c.vk2.the.master && !H.npcOf(w, c.vk2.the.master) && c.vk2.the.year !== Math.floor(c.age)) out.bad.push(`sư phụ đã mất vẫn còn tuổi ${age}`);
    },
    collect(c, a, out) {
      const h = c.vk2.the;
      if (h.hadMaster) add(out, "baiSu");
      add(out, "doDe", h.disciples.length);
      add(out, "truyenCong", h.taught);
      if (h.fam) add(out, "giaToc");
      add(out, "con", h.kids.length);
      if (h.ownSect) add(out, "lapTong");
      add(out, "chucTong", c.sectRank ?? 0);
      out.worldNpc = a.world.npcs.length;
      out.worldSects = Object.keys(a.world.sects).length;
      out.worldGone = (a.world.gone ?? []).length;
      out.worldYear = a.world.year;
      out.maxNpcRealm = Math.max(out.maxNpcRealm ?? 0, ...a.world.npcs.map((n) => n.r));
    },
  });

  // Giai đoạn 5
  bots.push({
    act(c, a) {
      const P = globalThis.VK2Phap;
      const p = P.ensure(c, a);
      if ((c.realm ?? 0) >= P.LAW_REALM && p.lawOn.length < P.LAW_MAX_ACTIVE) {
        const m = c.vk2.dao?.mastery ?? {};
        const pick = Object.keys(P.LAWS).filter((id) => P.canLaw(c, a, id).ok && !p.lawOn.includes(id)).sort((x, y) => (m[P.LAWS[y].src] ?? 0) - (m[P.LAWS[x].src] ?? 0))[0];
        if (pick) P.toggleLaw(c, a, pick);
      }
      return false;
    },
    pick(ev, c, a, cfg, rng, idx) {
      if (String(ev.id) === "vk2_phap_demon") {
        const p = c.vk2.phap;
        const score = globalThis.VK2Phap.faceScore(c, p, p.evKind);
        if (cfg.choice === "evil") return idx[idx.length - 1][1];
        if (cfg.choice === "random") return idx[Math.floor(rng() * idx.length)][1];
        return idx[score >= globalThis.VK2Phap.FACE_NEED ? 0 : 1][1];
      }
      return null;
    },
    check(c, a, out, age) {
      const P = globalThis.VK2Phap;
      const p = c.vk2.phap;
      for (const [k, x] of Object.entries(p.wounds)) if (!(x >= 0 && x <= P.WOUND_MAX)) out.bad.push(`vết thương ${k}=${x} tuổi ${age}`);
      if (p.lawOn.length > P.LAW_MAX_ACTIVE) out.bad.push("quá số pháp tắc");
      const cr = a.world?.crisis;
      if (cr && !(cr.score >= 0 && cr.score <= 100 && P.CRISES[cr.id])) out.bad.push(`đại biến sai ${JSON.stringify(cr)}`);
      for (const [k, x] of Object.entries(c.vk2.menh?.ledger ?? {})) if (!(x >= 0 && x <= 100)) out.bad.push(`sổ ${k}=${x}`);
    },
    collect(c, a, out) {
      const P = globalThis.VK2Phap;
      const p = c.vk2.phap;
      add(out, "tamMaVuot", p.faced);
      add(out, "phongAn", p.sealed > 0 ? 1 : 0);
      add(out, "thuanTheo", p.gaveIn);
      const best = Math.max(0, ...Object.keys(p.laws).map((id) => P.lawTier(p, id)));
      if (Object.keys(p.laws).length) add(out, "coPhapTac");
      add(out, "bacPhapTac", best);
      add(out, "gopDaiBien", p.crisisDone ?? 0);
      out.crisisPast = (a.world?.crisisPast ?? []).length;
    },
  });

  // Giai đoạn 6
  bots.push({
    pick(ev, c, a, cfg, rng, idx) {
      const id = String(ev.id);
      if (id === "vk2_menh_legacy" && cfg.choice === "safe") return idx[0][1];
      return null;
    },
    collect(c, a, out) {
      const m = c.vk2.menh;
      if (m.fate) add(out, "thienMenh");
      if (m.fate?.end) add(out, "ketCucMenh");
      add(out, "diSanTimLai", m.finds);
      add(out, "phanUng", m.reacts.length);
      out.legacyItems = a.legacy?.items.length ?? 0;
      out.legacyUsed = (a.legacy?.items ?? []).filter((x) => x.used).length;
      out.debt = Math.round(a.legacy?.debt ?? 0);
      const fates = (out.fates = out.fates ?? {});
      if (m.fate) fates[`${m.fate.id}:${m.fate.end ?? "-"}`] = (fates[`${m.fate.id}:${m.fate.end ?? "-"}`] ?? 0) + 1;
    },
  });

  // Hệ thống sự kiện động
  bots.push({
    check(c, a, out, age) {
      const su = c.vk2.su;
      if (!su) return;
      if (su.j.length > globalThis.VK2Su.JOURNAL_CAP) out.bad.push(`nhật ký sự kiện ${su.j.length}`);
      if ((a.ev?.traces.length ?? 0) > 40) out.bad.push(`dấu vết ${a.ev.traces.length}`);
      if ((a.world?.chains?.length ?? 0) > globalThis.VK2Su.ACTIVE_CHAINS + 2) out.bad.push(`quá nhiều chuỗi ${a.world.chains.length}`);
      for (const inst of a.world?.chains ?? []) if (!globalThis.VK2Su.chains.get(inst.id)?.stages.some((s) => s.id === inst.st)) out.bad.push(`chuỗi ${inst.id} ở giai đoạn lạ ${inst.st}`);
    },
    collect(c, a, out) {
      const su = c.vk2.su;
      if (!su) return;
      add(out, "suGiai", su.resolved ?? 0);
      add(out, "suCuoc", Object.keys(su.chains).length);
      add(out, "suThach", su.gain ?? 0);
      const seen = (out.suSeen = out.suSeen ?? {});
      for (const id of Object.keys(su.done)) seen[id] = (seen[id] ?? 0) + 1;
      const ends = (out.suEnds = out.suEnds ?? {});
      for (const h of a.world?.chainHist ?? []) ends[`${h.id}:${h.end}`] = 1;
      out.acctKB = Math.max(out.acctKB ?? 0, Math.round(JSON.stringify(a).length / 1024));
      out.maxStones = Math.max(out.maxStones ?? 0, c.linhThach ?? 0);
      for (const [id] of Object.entries(su.done)) {
        const e = globalThis.VK2Su.events.get(id);
        if (e) {
          add(out, `nhom_${e.g}`);
          add(out, `cap_${e.tier}`);
        }
      }
    },
  });

  globalThis.__simBot = {
    bots,
    act(c, a, cfg, rng, out) {
      let chained = false;
      for (const b of bots) if (b.act?.(c, a, cfg, rng, out)) chained = true;
      return chained;
    },
    pick(ev, c, a, cfg, rng, idx) {
      for (const b of bots) {
        const i = b.pick?.(ev, c, a, cfg, rng, idx);
        if (i !== null && i !== undefined) return i;
      }
      // Mặc định: theo khuynh hướng của cấu hình
      if (cfg.choice === "evil") return (idx.find(([x]) => x.lean === "ta") ?? idx[0])[1];
      if (cfg.choice === "random") return idx[Math.floor(rng() * idx.length)][1];
      return (idx.find(([x]) => x.lean === "chinh") ?? idx.find(([x]) => x.lean !== "ta") ?? idx[0])[1];
    },
    check(c, a, out, age) {
      for (const b of bots) b.check?.(c, a, out, age);
    },
    collect(c, a, out) {
      for (const b of bots) b.collect?.(c, a, out);
    },
  };
})();
