// Lớp đồ họa: chỉ đọc trạng thái game và vẽ, không đổi dữ liệu chơi. Vẽ trên canvas độ phân giải thấp để hòa với nét pixel của game.
// Cảnh của game là DOM, nên hai canvas được chèn vào .scene: một sau lưng nhân vật, một trước mặt. Hỏng ở đây không được làm hỏng game.
(function (root) {
  "use strict";
  const U = root.__VK2?._ui;
  if (!U) return;
  const KEY = "vk2.gfx";
  const LEVELS = { high: 1, mid: 0.5, off: 0 };
  const PIXEL = 3;
  const FRAME_MS = 33;
  const MAX_PARTICLES = 140;

  const PATH_COLOR = { kiem: "#bfe8ff", dan: "#ff9a4a", tran: "#ffd866", phat: "#ffe9a8", ma: "#c0395f", yeu: "#7ed957" };
  const ELEMENT_COLOR = { kim: "#f2e6a0", moc: "#7ed957", thuy: "#6ec6ff", hoa: "#ff7a45", tho: "#d9a860" };
  // Cảnh trong nhà không có trời. Tra từ ảnh nền của từng trọng tâm.
  const INDOOR = new Set(["luyen_dan", "kiem_tien"]);
  const OMEN_TINT = {
    linh_khi: ["#7dffc0", 0.16],
    huyet_nguyet: ["#c42a3a", 0.42],
    phat_quang: ["#ffd98a", 0.26],
    cat_tinh: ["#8a7dff", 0.2],
    yeu_trieu: ["#7a3fa8", 0.34],
    giang_ho_loan: ["#a06a40", 0.28],
    loi_van: ["#3a4468", 0.5],
  };

  const loadLevel = () => {
    try {
      const s = localStorage.getItem(KEY);
      if (s && s in LEVELS) return s;
    } catch {}
    return Math.min(root.screen?.width ?? 9999, innerWidth) < 700 ? "mid" : "high"; // Lúc nạp script, điện thoại có thể còn báo chiều rộng 980
  };
  const reduced = () => !!root.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let level = loadLevel();
  let auto = 1; // Giảm thêm khi máy chậm, không lưu lại
  let scene = null;
  let back = null;
  let front = null;
  let tint = null;
  let W = 0;
  let H = 0;
  let last = 0;
  let slow = 0;
  let readAt = 0;
  let t = 0;
  let flash = 0;
  let flashColor = "#ffffff";
  let boltAt = 0;
  let bolt = null;
  let tintKey = "";
  const parts = [];
  const rings = [];
  const clouds = [];
  const stars = [];
  const st = { realm: 0, layer: 0, life: -1, tier: null, rid: null, focus: "", omen: null, night: false, hour: 12, dead: false, cosmos: null, color: "#ffffff", atm: null, sprite: null };
  const debug = {};
  const stats = { frames: 0, fps: 0, shocks: 0, drawn: 0, errors: 0 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const amount = () => LEVELS[level] * auto;

  // ---------- Đọc trạng thái ----------

  function readOmen() {
    if (debug.omen !== undefined) return debug.omen;
    for (const id of Object.keys(OMEN_TINT)) if (root.VK2Can?.omenIs?.(id)) return id;
    return null;
  }
  function readAtmosphere() {
    if (debug.atm !== undefined) return debug.atm;
    const w = U.acct?.()?.world;
    if (!w) return null;
    if ((w.chains ?? []).some((i) => i.id === "ma_tong" && ["xung_dot", "gang_co", "thuc_tinh"].includes(i.st))) return "ma";
    if (w.crisis || w.flags?.ma_chu_thuc_tinh) return "loan";
    return null;
  }
  function read(now) {
    const c = U.char?.();
    if (!c) return;
    st.focus = debug.focus ?? c.focus ?? "";
    st.dead = !!c.dead;
    st.cosmos = debug.cosmos ?? c.cosmos ?? null;
    st.hour = debug.hour ?? new Date().getHours();
    st.night = st.hour >= 20 || st.hour < 5;
    const realm = debug.realm ?? c.realm ?? 0;
    const layer = c.layer ?? 0;
    if (st.life === (c.lifeNo ?? 0)) {
      if (realm > st.realm) breakthrough(true);
      else if (realm === st.realm && layer > st.layer) breakthrough(false);
    }
    st.life = c.lifeNo ?? 0;
    st.realm = realm;
    st.layer = layer;
    const path = debug.path ?? c.path;
    st.color = PATH_COLOR[path] ?? ELEMENT_COLOR[c.element] ?? "#d8f4ff";
    if (now - readAt < 500) return;
    readAt = now;
    st.omen = readOmen();
    st.atm = readAtmosphere();
    readEvent(c);
    applyTint();
  }
  /** Khung sự kiện theo độ hiếm. Sự kiện gốc của game không có cấp nên giữ khung gốc. */
  function readEvent(c) {
    const box = document.querySelector(".dialog.event");
    const p = c.vk2?.su?.pend;
    const tier = p ? p.tier ?? root.VK2Su?.events.get(p.id)?.tier ?? 0 : null;
    if (box) {
      if (tier === null) delete box.dataset.vk2Tier;
      else box.dataset.vk2Tier = tier;
    }
    if (p && p.rid !== st.rid && tier >= 2) {
      const col = ["", "", "#7fb2ff", "#d38bff", "#ffc35a"][tier];
      flash = Math.max(flash, 0.28);
      flashColor = col;
      if (amount() > 0) burst(W / 2, H * 0.55, 10 + tier * 6, col);
    }
    st.rid = p?.rid ?? null;
  }
  function applyTint() {
    if (!tint) return;
    const omen = OMEN_TINT[st.omen];
    const time = st.cosmos || st.dead ? null : st.night ? ["#2b3a7a", 0.56] : st.hour < 7 ? ["#ffae85", 0.24] : st.hour >= 17 ? ["#ff8a55", 0.3] : null;
    const pick = st.atm === "ma" ? ["#7a1a2a", 0.4] : omen ?? time;
    const key = `${pick?.[0]}|${st.dead}`;
    if (key === tintKey) return;
    tintKey = key;
    tint.style.backgroundColor = pick?.[0] ?? "transparent";
    tint.style.opacity = pick ? pick[1] : 0;
    scene?.classList.toggle("vk2g-dead", st.dead);
    document.documentElement.dataset.vk2Omen = st.atm === "ma" ? "huyet_nguyet" : st.omen ?? "";
  }

  // ---------- Hiệu ứng một lần ----------

  function burst(x, y, n, color, speed = 34) {
    const count = Math.round(n * Math.max(0.5, amount()));
    for (let i = 0; i < count && parts.length < MAX_PARTICLES; i++) {
      const a = rnd(0, Math.PI * 2);
      const v = rnd(speed * 0.4, speed);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8, g: 16, life: 0, max: rnd(0.5, 1.2), c: color, s: Math.random() < 0.3 ? 2 : 1 });
    }
  }
  function breakthrough(big) {
    stats.shocks++;
    if (amount() <= 0 || !st.sprite) return;
    const { x, y } = st.sprite;
    rings.push({ x, y: y - 8, r: 2, v: big ? 90 : 46, life: 0, max: big ? 0.8 : 0.45, c: st.color });
    if (big) {
      rings.push({ x, y: y - 8, r: 1, v: 60, life: 0, max: 1, c: "#fff3c4" });
      flash = 0.75;
      flashColor = "#fff6d8";
      burst(x, y - 10, 36, st.color, 60);
      scene?.classList.add("vk2g-shake");
      setTimeout(() => scene?.classList.remove("vk2g-shake"), 350);
    } else burst(x, y - 10, 10, st.color, 26);
  }

  // ---------- Hạt theo trọng tâm và thiên tượng ----------

  const add = (o) => {
    if (parts.length < MAX_PARTICLES) parts.push({ life: 0, g: 0, s: 1, ...o });
  };
  const EMIT = {
    tu_luyen() {
      if (!st.sprite) return;
      const a = rnd(0, Math.PI * 2);
      const d = rnd(26, 46);
      const x = st.sprite.x + Math.cos(a) * d;
      const y = st.sprite.y - 12 + Math.sin(a) * d * 0.6;
      add({ x, y, vx: (st.sprite.x - x) * 0.55, vy: (st.sprite.y - 12 - y) * 0.55, max: 1.05, c: st.color }); // Tan trước khi tới tâm, nếu không hạt chồng thành một đốm sáng
    },
    luyen_dan() {
      add({ x: rnd(0, W), y: H - rnd(0, 6), vx: rnd(-4, 4), vy: rnd(-24, -12), g: -3, max: rnd(0.8, 1.6), c: Math.random() < 0.6 ? "#ff9a3c" : "#ffd27a" });
    },
    kiem_tien() {
      add({ x: rnd(0, W), y: rnd(H * 0.3, H), vx: 0, vy: -2, max: 0.5, c: "#ffe27a", twinkle: 1 });
    },
    tru_yeu() {
      add({ x: rnd(0, W), y: H, vx: rnd(-8, 8), vy: rnd(-22, -10), max: rnd(0.7, 1.5), c: Math.random() < 0.5 ? "#e0452e" : "#6a2a22" });
    },
    ket_duyen() {
      add({ x: rnd(0, W), y: -2, vx: rnd(-6, 6), vy: rnd(8, 16), max: 3.5, c: Math.random() < 0.5 ? "#ff9ec4" : "#ffd3e2", sway: rnd(0, 6) });
    },
    du_ngoan() {
      add({ x: W + 2, y: rnd(0, H * 0.8), vx: rnd(-26, -12), vy: rnd(2, 8), max: 5, c: Math.random() < 0.5 ? "#b8d86a" : "#e8c860", sway: rnd(0, 6) });
    },
  };
  const OMEN_EMIT = {
    linh_khi: () => add({ x: rnd(0, W), y: H, vx: rnd(-3, 3), vy: rnd(-14, -6), max: 3.5, c: "#8affc8" }),
    huyet_nguyet: () => add({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-3, 3), vy: rnd(-6, -2), max: 2.2, c: "#ff4a55" }),
    phat_quang: () => add({ x: rnd(0, W), y: rnd(0, H * 0.7), vx: 0, vy: rnd(4, 8), max: 2.4, c: "#ffe9a8", twinkle: 1 }),
    cat_tinh() {
      if (Math.random() < 0.12) add({ x: rnd(W * 0.3, W), y: rnd(0, H * 0.3), vx: -70, vy: 28, max: 0.7, c: "#fff6d0", tail: 5 });
    },
    yeu_trieu: () => add({ x: rnd(0, W), y: H - rnd(0, 18), vx: rnd(-6, 6), vy: -2, max: 3, c: "#a05ad0", s: 2, soft: 1 }),
    giang_ho_loan: () => add({ x: rnd(0, W), y: H, vx: rnd(6, 16), vy: rnd(-14, -6), max: 2.2, c: "#4a3a30", s: 2, soft: 1 }),
    loi_van() {
      for (let i = 0; i < 3; i++) add({ x: rnd(0, W + 20), y: -2, vx: -22, vy: 150, max: 0.8, c: "#a8c0e8", tail: 2 });
    },
  };
  const rates = { tu_luyen: 12, luyen_dan: 9, kiem_tien: 6, tru_yeu: 7, ket_duyen: 5, du_ngoan: 2.5 };
  let debt = 0;
  let omenDebt = 0;
  function emit(dt) {
    const a = amount();
    const realmBoost = 1 + Math.min(1.5, st.realm * 0.18);
    debt += (rates[st.focus] ?? 3) * a * realmBoost * dt;
    while (debt >= 1) {
      debt -= 1;
      (EMIT[st.focus] ?? EMIT.tu_luyen)();
    }
    const f = OMEN_EMIT[st.omen] ?? (st.atm ? OMEN_EMIT.giang_ho_loan : null);
    if (!f) return;
    omenDebt += 10 * a * dt;
    while (omenDebt >= 1) {
      omenDebt -= 1;
      f();
    }
    if (st.omen === "loi_van" && t > boltAt) {
      boltAt = t + rnd(3, 8);
      makeBolt();
    }
  }
  function makeBolt() {
    let x = rnd(W * 0.15, W * 0.85);
    const pts = [[x, 0]];
    for (let y = 8; y < H * 0.75; y += 8) {
      x += rnd(-7, 7);
      pts.push([x, y]);
    }
    bolt = { pts, life: 0 };
    flash = 0.5;
    flashColor = "#dfe8ff";
  }

  // ---------- Vẽ ----------

  function resetSky() {
    clouds.length = 0;
    stars.length = 0;
    for (let i = 0; i < 4; i++) clouds.push({ x: rnd(-40, W), y: rnd(1, H * 0.16), v: rnd(1.2, 3.5), w: rnd(14, 28), a: rnd(0.55, 0.85) });
    for (let i = 0; i < 40; i++) stars.push({ x: rnd(0, W), y: rnd(0, H * 0.45), p: rnd(0, 6), s: Math.random() < 0.15 ? 2 : 1 });
  }
  /** Mây bậc thang như mây trong ảnh nền của game, không đổ khối, ban đêm mờ hẳn. */
  function drawCloud(g, c) {
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    const w = Math.round(c.w);
    g.globalAlpha = st.night ? c.a * 0.3 : c.a;
    g.fillStyle = st.night ? "#aab4d8" : "#ffffff";
    g.fillRect(x + 2, y + 3, w - 4, 1);
    g.fillRect(x, y + 2, w, 1);
    g.fillRect(x + 3, y + 1, w - 9, 1);
    g.fillRect(x + 7, y, Math.round(w * 0.32), 1);
  }
  function glow(g, x, y, r, color, alpha) {
    g.globalCompositeOperation = "lighter";
    g.fillStyle = color;
    for (let i = 3; i >= 1; i--) {
      g.globalAlpha = alpha / (i + 0.5);
      g.beginPath();
      g.ellipse(x, y, (r * i) / 3, (r * i * 0.95) / 3, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }
  function dottedRing(g, x, y, rx, ry, n, spin, color, alpha) {
    g.fillStyle = color;
    g.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = spin + (i / n) * Math.PI * 2;
      g.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1);
    }
  }
  function drawSky(g) {
    if (INDOOR.has(st.focus) || st.cosmos || st.dead) return;
    if (st.night || st.omen === "cat_tinh") {
      g.fillStyle = "#ffffff";
      for (const s of stars) {
        g.globalAlpha = 0.45 + 0.45 * Math.sin(t * 1.6 + s.p);
        g.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
      }
    }
    if (st.omen === "huyet_nguyet") {
      const mx = W * 0.58;
      const my = H * 0.12;
      glow(g, mx, my, 18, "#ff3040", 0.5);
      g.globalAlpha = 1;
      g.fillStyle = "#d8344a";
      g.beginPath();
      g.arc(mx, my, 6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#a81f38";
      g.fillRect(mx - 3, my - 2, 2, 1);
      g.fillRect(mx + 1, my + 1, 2, 1);
    } else if (st.night) {
      const mx = W * 0.58;
      const my = H * 0.14;
      glow(g, mx, my, 14, "#dfe8ff", 0.3);
      g.globalAlpha = 1;
      g.fillStyle = "#f4f2dc";
      g.beginPath();
      g.arc(mx, my, 5, 0, Math.PI * 2);
      g.fill();
    }
    for (const c of clouds) drawCloud(g, c);
    g.globalAlpha = 1;
  }
  function drawRays(g) {
    const on = st.omen === "phat_quang" || (!st.night && !INDOOR.has(st.focus) && !st.omen && st.hour >= 8 && st.hour < 17 && !st.cosmos);
    if (!on) return;
    g.globalCompositeOperation = "lighter";
    g.fillStyle = st.omen === "phat_quang" ? "#ffdf9a" : "#fff4cc";
    for (let i = 0; i < 4; i++) {
      const x = W * (0.12 + i * 0.22);
      const w = 7 + i * 2;
      g.globalAlpha = (st.omen === "phat_quang" ? 0.13 : 0.05) * (0.7 + 0.3 * Math.sin(t * 0.5 + i));
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + w, 0);
      g.lineTo(x + w - 22, H);
      g.lineTo(x - 22, H);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  }
  function drawAura(g) {
    if (!st.sprite || st.dead) return;
    const { x, y, h } = st.sprite;
    // Bóng dưới chân để nhân vật đứng vững trên nền
    g.globalAlpha = 0.28;
    g.fillStyle = "#1f160d";
    g.beginPath();
    g.ellipse(x, y, 9, 2, 0, 0, Math.PI * 2);
    g.fill();
    const r = st.realm;
    if (r < 1 && !st.cosmos) return;
    const cy = y - h / 2;
    const pulse = 0.8 + 0.2 * Math.sin(t * 2);
    glow(g, x, cy, (12 + Math.min(r, 9) * 3) * pulse, st.color, 0.22 + Math.min(r, 8) * 0.018);
    if (r >= 3 || st.cosmos) {
      // Kim Đan: viên đan quay quanh người
      const a = t * 1.7;
      g.globalAlpha = 1;
      g.fillStyle = "#ffe27a";
      g.fillRect(Math.round(x + Math.cos(a) * 15), Math.round(cy + Math.sin(a) * 6), 2, 2);
    }
    if (r >= 4 || st.cosmos) dottedRing(g, x, cy, 19, 7, 18, t * 0.8, st.color, 0.8);
    if (r >= 5 || st.cosmos) dottedRing(g, x, y, 24, 5, 26, -t * 0.5, st.color, 0.75);
    if (r >= 6 || st.cosmos) {
      g.globalCompositeOperation = "lighter";
      g.fillStyle = st.color;
      g.globalAlpha = 0.12 * pulse;
      g.fillRect(x - 6, 0, 12, y);
      g.fillRect(x - 3, 0, 6, y);
      g.globalCompositeOperation = "source-over";
    }
    if ((r >= 7 || st.cosmos) && Math.sin(t * 7) > 0.55) {
      g.strokeStyle = "#e8f0ff";
      g.globalAlpha = 0.9;
      g.lineWidth = 1;
      g.beginPath();
      let lx = x + rnd(-16, 16);
      let ly = cy - 14;
      g.moveTo(lx, ly);
      for (let i = 0; i < 4; i++) {
        lx += rnd(-5, 5);
        ly += 7;
        g.lineTo(lx, ly);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function drawMist(g) {
    if (st.cosmos || INDOOR.has(st.focus)) return;
    g.fillStyle = st.night ? "#9aa8d8" : "#ffffff";
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = 0.06 + i * 0.015;
      const off = Math.sin(t * 0.3 + i) * 10;
      g.fillRect(-12 + off, H - 5 - i * 4, W + 24, 5);
    }
    g.globalAlpha = 1;
  }
  function stepParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) {
        parts.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += (p.vx + (p.sway !== undefined ? Math.sin(t * 3 + p.sway) * 6 : 0)) * dt;
      p.y += p.vy * dt;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life += dt;
      r.r += r.v * dt;
      if (r.life >= r.max) rings.splice(i, 1);
    }
    for (const c of clouds) {
      c.x += c.v * dt;
      if (c.x > W + 4) c.x = -c.w - 4;
    }
  }
  /** Ánh chớp tắt theo thời gian thật, kể cả khi game tạm dừng, nếu không cả cảnh sẽ bị phủ trắng. */
  function stepLight(dt) {
    flash = Math.max(0, flash - dt * 2.2);
    if (bolt) {
      bolt.life += dt;
      if (bolt.life > 0.22) bolt = null;
    }
  }
  function drawParts(g) {
    for (const p of parts) {
      const k = 1 - p.life / p.max;
      g.globalAlpha = p.twinkle ? Math.abs(Math.sin(k * 9)) : p.soft ? k * 0.28 : Math.min(1, k * 1.6);
      g.fillStyle = p.c;
      if (p.tail) {
        for (let i = 1; i <= p.tail; i++) g.fillRect(Math.round(p.x - (p.vx * i) / 60), Math.round(p.y - (p.vy * i) / 60), 1, 1);
      }
      g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    g.globalAlpha = 1;
  }
  function drawOneShots(g) {
    for (const r of rings) {
      g.strokeStyle = r.c;
      g.globalAlpha = 1 - r.life / r.max;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(r.x, r.y, r.r, r.r * 0.72, 0, 0, Math.PI * 2);
      g.stroke();
    }
    if (bolt) {
      g.globalAlpha = 1;
      g.strokeStyle = "#ffffff";
      g.lineWidth = 1;
      g.beginPath();
      bolt.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
    if (flash > 0) {
      g.globalAlpha = flash;
      g.fillStyle = flashColor;
      g.fillRect(0, 0, W, H);
    }
    g.globalAlpha = 1;
  }

  // ---------- Khung hình ----------

  function remove() {
    for (const el of [back, front, tint]) el?.remove();
    back = front = tint = null;
    scene?.classList.remove("vk2g-dead", "vk2g-shake");
    scene = null;
    tintKey = "";
    parts.length = 0;
    rings.length = 0;
    delete document.documentElement.dataset.vk2Omen;
  }
  function mount() {
    const s = document.querySelector(".scene");
    if (!s) return false;
    if (scene !== s || !back?.isConnected || !front?.isConnected) {
      remove();
      scene = s;
      back = document.createElement("canvas");
      front = document.createElement("canvas");
      tint = document.createElement("div");
      back.className = "vk2g-layer vk2g-back";
      front.className = "vk2g-layer vk2g-front";
      tint.className = "vk2g-tint";
      for (const el of [back, tint, front]) el.setAttribute("aria-hidden", "true");
      s.appendChild(back);
      s.appendChild(tint);
      s.appendChild(front);
      W = 0;
    }
    const nw = Math.max(1, Math.ceil(s.clientWidth / PIXEL));
    const nh = Math.max(1, Math.ceil(s.clientHeight / PIXEL));
    if (nw !== W || nh !== H) {
      W = nw;
      H = nh;
      back.width = front.width = W;
      back.height = front.height = H;
      resetSky();
    }
    const spr = s.querySelector(".sprite-wrap");
    // Game chèn ảnh nền mới khi đổi cảnh, nên canvas sau phải luôn nằm ngay trước nhân vật, canvas trước luôn ở trên cùng.
    if (spr && back.nextElementSibling !== spr) s.insertBefore(back, spr);
    if (s.lastElementChild !== front) {
      s.appendChild(tint);
      s.appendChild(front);
    }
    if (spr) {
      const a = spr.getBoundingClientRect();
      const b = s.getBoundingClientRect();
      // Khung sprite cao hơn nhân vật: đầu ở khoảng 36%, chân ở khoảng 83% chiều cao khung
      st.sprite = { x: (a.left - b.left + a.width / 2) / PIXEL, y: (a.top - b.top + a.height * 0.83) / PIXEL, h: (a.height * 0.47) / PIXEL };
    }
    return true;
  }
  function frame(now) {
    root.requestAnimationFrame(frame);
    try {
      if (level === "off") return;
      if (document.hidden || now - last < FRAME_MS) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      const real = now - last;
      last = now;
      if (!mount()) return;
      read(now);
      const still = reduced();
      const paused = scene.classList.contains("paused");
      stepLight(dt);
      if (!still && !paused) {
        t += dt;
        emit(dt);
        stepParts(dt);
      }
      const b = back.getContext("2d");
      const f = front.getContext("2d");
      b.clearRect(0, 0, W, H);
      f.clearRect(0, 0, W, H);
      drawSky(b);
      drawAura(b);
      drawRays(f);
      drawMist(f);
      drawParts(f);
      drawOneShots(f);
      stats.frames++;
      stats.drawn = parts.length;
      stats.fps = stats.fps * 0.95 + (1000 / real) * 0.05;
      // Máy chậm thì tự giảm số hạt trong lượt chơi này
      slow = real > 55 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 60 && auto > 0.3) {
        auto *= 0.6;
        slow = 0;
      }
    } catch (err) {
      stats.errors++;
      if (stats.errors === 1) console.warn("[VK2 fx]", err);
      if (stats.errors > 20) {
        level = "off";
        remove();
      }
    }
  }
  function setLevel(next) {
    if (!(next in LEVELS)) return;
    level = next;
    auto = 1;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    document.documentElement.classList.toggle("vk2g-on", next !== "off");
    if (next === "off") remove();
  }

  // ---------- Cài đặt ----------

  const { EXT, T, esc } = U;
  EXT.tabs.gfx = {
    n: ["Đồ Họa", "Graphics"],
    html: () => {
      const row = [["high", T("Cao", "High"), T("Đầy đủ hạt, hào quang và ánh sáng.", "Full particles, auras and light.")], ["mid", T("Vừa", "Medium"), T("Ít hạt hơn, hợp với điện thoại.", "Fewer particles, good for phones.")], ["off", T("Tắt", "Off"), T("Giữ nguyên hình của game gốc.", "Keeps the original game's look.")]];
      const cards = row.map(([id, n, d]) => `<div class="vk2-t ${level === id ? "on" : ""}"><b>${esc(n)}</b><small>${esc(d)}</small><div class="vk2-t-act"><button class="vk2-btn" data-act="gfx-level" data-id="${id}" aria-pressed="${level === id}">${level === id ? T("Đang dùng", "In use") : T("Chọn", "Choose")}</button></div></div>`).join("");
      return `<p class="vk2-note">${T("Bầu trời theo giờ trên máy bạn và thiên tượng hôm nay. Hào quang lớn dần theo cảnh giới, màu theo đạo lộ. Đồ họa không ảnh hưởng tới lối chơi.", "The sky follows your device's clock and today's omen. Your aura grows with your realm and takes the colour of your path. Graphics never affect gameplay.")}</p><div class="vk2-t-grid">${cards}</div>${reduced() ? `<p class="vk2-note">${T("Thiết bị đang bật giảm chuyển động, nên cảnh được vẽ tĩnh.", "Your device asks for reduced motion, so scenes stay still.")}</p>` : ""}`;
    },
  };
  EXT.actions["gfx-level"] = (c, a, b) => setLevel(b.dataset.id);

  document.documentElement.classList.toggle("vk2g-on", level !== "off");
  root.VK2Fx = { setLevel, level: () => level, stats: () => ({ ...stats, flash, particles: parts.length, auto, pixel: PIXEL, W, H }), debug, breakthrough };
  root.requestAnimationFrame(frame);
})(typeof globalThis !== "undefined" ? globalThis : this);
