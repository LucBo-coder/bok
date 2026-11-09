// Trang bị Tuyệt phẩm và linh thú mới trên game thật: bảng đồ, nhãn phẩm, chỉ số, đúc qua nút bấm, thần thông, ảnh thú, sổ, trận thu phục.
// Dùng: VK2_URL=http://127.0.0.1:8766 NODE_PATH=<thư mục có playwright-core> node vk2/tests/gear_e2e.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const path = require("node:path");
const { guard } = require("./popups");

const BASE = (process.env.VK2_URL || "http://127.0.0.1:8766").replace(/\/$/, "");
const OUT = process.argv[2] || ".";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" ? `  [${extra}]` : ""}`);
};

async function enter(page) {
  await page.goto(`${BASE}/choi/`, { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 60; i++) {
    if (await page.locator("#vk2-hud").count()) break;
    await page.evaluate(() => {
      const w = /Lập bia và luân hồi|Đầu thai|Reincarnate|Bắt đầu|Vào game|Chơi ngay|Để sau|Bỏ qua|Đóng|Tiếp/;
      [...document.querySelectorAll("button, a")].find((b) => w.test(b.textContent || "") && b.offsetParent)?.click();
    });
    await sleep(500);
  }
  for (let i = 0; i < 25; i++) {
    const done = await page.evaluate(() => {
      const vis = (b) => b && b.offsetParent !== null;
      const comic = document.querySelector(".cn-wrap .cn-skip");
      if (vis(comic)) return comic.click(), false;
      const hint = [...document.querySelectorAll("button")].find((b) => /Đã hiểu|Got it/.test(b.textContent) && vis(b));
      if (hint) return hint.click(), false;
      const list = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off"));
      if (list.length) return list[0].click(), false;
      return !document.querySelector(".cn-wrap, .coach");
    });
    if (done) break;
    await sleep(350);
  }
}

/** Nhân vật cao cảnh giới, sống lâu và không bị quá độ, để đo đồ và thú chứ không đo chuyện sinh tồn. */
const strong = (page, realm = 11) =>
  page.evaluate((realm) => {
    const c = globalThis.__VK2._test.char();
    c.age = Math.max(c.age, 60);
    c.lifespan = 5000;
    c.realm = realm;
    c.streak = null;
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    c.linhThach = 500000;
    globalThis.VK2Bao.ensure(c, globalThis.__VK2._test.acct());
  }, realm);

const clear = (page) =>
  page.evaluate(() => {
    const vis = (b) => b && b.getClientRects().length > 0;
    const peer = [...document.querySelectorAll(".duel-warn button")].filter(vis);
    if (peer.length) return (peer.find((b) => /Kết giao|Befriend|Rời|Cáo từ/.test(b.textContent)) ?? peer[peer.length - 1]).click();
    const choice = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off")).pop();
    if (choice) return choice.click();
    const kiep = [...document.querySelectorAll(".kiep button")].filter(vis).pop();
    if (kiep) return kiep.classList.contains("kiep-skip") ? kiep.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })) : kiep.click();
    const close = [...document.querySelectorAll(".event-card button, .mc-stage button, .cn-wrap .cn-skip")].filter(vis).pop();
    close?.click();
  });

class Died extends Error {}
async function alive(page) {
  const ok = await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    return !!c && !c.dead;
  });
  if (!ok) throw new Died("nhân vật chết giữa chừng");
}

const play = (page) =>
  page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.streak = null;
    c.stats.sucKhoe = 100;
    c.stats.tamMa = 0;
    const speed = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "8×");
    if (speed && !speed.classList.contains("on")) speed.click();
    [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶")?.click();
  });

/** Trận thật qua nút Trừ yêu, trả về chữ game vẽ lên màn hình. */
async function realFight(page, ms, want) {
  await page.evaluate(() => {
    globalThis.__seen = [];
    globalThis.__seenIds = new Set();
    globalThis.__watch = setInterval(() => {
      for (const d of document.querySelectorAll(".dmg")) {
        if (globalThis.__seenIds.has(d)) continue;
        globalThis.__seenIds.add(d);
        globalThis.__seen.push(d.textContent);
      }
    }, 40);
  });
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await alive(page);
    await clear(page);
    await page.evaluate(async () => {
      const c = globalThis.__VK2._test.char();
      c.streak = null;
      c.stats.sucKhoe = 100;
      if (document.querySelector(".scene .battle")) return;
      [...document.querySelectorAll("button")].find((b) => /Trừ yêu/.test(b.textContent) && b.offsetParent !== null)?.click();
      await new Promise((r) => setTimeout(r, 250));
      const it = document.querySelector(".hunt-item");
      if (it) (it.querySelector("button") ?? it).click();
      [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶")?.click();
    });
    await sleep(220);
    // Đòn của quái ít hay nhiều tùy trận, nên đánh tới khi thấy điều cần đo, chỉ báo hỏng khi hết thời gian
    if (want && (await page.evaluate((s) => globalThis.__seen.some((t) => new RegExp(s).test(t)), want))) break;
  }
  return page.evaluate(() => {
    clearInterval(globalThis.__watch);
    for (const b of document.querySelectorAll("button")) if (/Dừng|Về nghỉ|Rút lui/.test(b.textContent) && b.offsetParent) b.click();
    return globalThis.__seen;
  });
}

const panelText = (page, id, shot) =>
  page.evaluate(async (id) => {
    globalThis.__VK2._test.openPanel(id);
    await new Promise((r) => setTimeout(r, 900));
    return document.body.innerText;
  }, id).then(async (text) => {
    if (shot) await page.screenshot({ path: path.join(OUT, shot) });
    await page.evaluate(() => globalThis.__VK2._test.openPanel(null));
    await sleep(300);
    return text;
  });

let browser = null;
async function attempt() {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  await guard(page);
  await enter(page);
  await strong(page);

  // ---------- Đồ nằm trong bảng thật của game ----------
  const data = await page.evaluate(() => {
    const G = globalThis.VK2Gear;
    const all = G.all();
    const ids = G.ITEMS.map((x) => x.id);
    return {
      size: all.length,
      found: ids.filter((id) => all.some((x) => x.id === id)).length,
      supreme: all.filter((x) => x.rare === 3 && x.slot === "vu_khi" && (x.minRealm ?? 0) <= 11).slice(0, 2).map((x) => x.id),
      supremeRobe: all.find((x) => x.rare === 3 && x.slot === "ao")?.id,
    };
  });
  check("bảng đồ thật của game đã có đủ 9 món Tuyệt phẩm", data.size > 400 && data.found === 9, `${data.found}/9 trong ${data.size} món`);

  // ---------- Nhãn phẩm và chỉ số ----------
  // Con số Công trong túi đồ là chỉ số game thật dùng khi đánh
  const atkShown = async () => Number((await panelText(page, "bag")).match(/Công\s+([\d.,]+)/)?.[1].replace(/[.,]/g, ""));
  await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.inventory = (c.inventory ?? []).filter((x) => !String(x).startsWith("tp_"));
    c.equipped = {};
  });
  const atkOff = await atkShown();
  await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.inventory.push("tp_khai_thien", "tp_chu_thien");
    c.equipped.vu_khi = "tp_khai_thien";
    c.equipped.phu_kien = "tp_chu_thien";
    c.equipped.ao = "tp_hon_nguyen";
    c.inventory.push("tp_hon_nguyen");
  });
  const atkOn = await atkShown();
  check("mặc đồ Tuyệt phẩm làm tăng công trong chỉ số thật của game", atkOn > atkOff * 1.5, `${atkOff} -> ${atkOn}`);

  const bag = await panelText(page, "bag", "gear_bag.png");
  check("túi đồ không có chữ undefined", !/undefined/.test(bag));
  check("mục nối của túi đồ chỉ sang đúc Tuyệt phẩm", /Tinh hoa/.test(bag) && /Đúc Tuyệt phẩm/.test(bag));
  const cell = await page.evaluate(async () => {
    globalThis.__VK2._test.openPanel("bag");
    await new Promise((r) => setTimeout(r, 900));
    const imgs = [...document.querySelectorAll('img[src*="/icons/tp_"]')];
    for (const i of imgs) i.loading = "eager";
    await new Promise((r) => setTimeout(r, 500));
    const tags = [...document.querySelectorAll(".inv-rare.r4")].map((e) => e.textContent);
    document.querySelector(".inv-rare.r4")?.closest("button, [role=button], [class*=inv]")?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { tags, icons: imgs.map((i) => [i.getAttribute("src"), i.naturalWidth]), text: document.body.innerText };
  });
  await page.screenshot({ path: path.join(OUT, "gear_item.png") });
  await page.evaluate(() => globalThis.__VK2._test.openPanel(null));
  check("ô đồ hiện nhãn Tuyệt cho cả 3 món", cell.tags.length === 3 && cell.tags.every((t) => t === "Tuyệt"), cell.tags.join(","));
  check("ảnh đồ tải được", cell.icons.length >= 2 && cell.icons.every(([, w]) => w === 32), JSON.stringify(cell.icons));
  check("bấm vào đồ thấy tên và phẩm đầy đủ", /Khai Thiên Trảm|Chu Thiên Tinh Đồ|Hỗn Nguyên Đạo Y/.test(cell.text) && !/undefined/.test(cell.text));

  // ---------- Đúc qua nút thật ----------
  await page.evaluate((id) => {
    const c = globalThis.__VK2._test.char();
    const a = globalThis.__VK2._test.acct();
    c.inventory = c.inventory.filter((x) => !String(x).startsWith("tp_"));
    c.equipped = {};
    c.inventory.push(id);
    c.vk2.bao.essence = 0;
    globalThis.VK2Bao.addEssence(c, a, 6);
    c.linhThach = 500000;
  }, data.supreme[0]);
  await page.click('#vk2-hud [data-tab="journey"]');
  await page.click('#vk2-modal .vk2-tabs [data-tab="estate"], #vk2-modal .vk2-tabs [data-tab="cave"]');
  await page.click('#vk2-modal .vk2-subtabs [data-tab="peerless"]');
  await sleep(200);
  await page.screenshot({ path: path.join(OUT, "gear_tab.png") });
  check("nút đúc khóa khi thiếu đồ Cực phẩm cùng loại", await page.locator('[data-act="bao-forge"][data-id="tp_hon_nguyen"]').isDisabled());
  const line = await page.locator('.vk2-peer:has([data-id="tp_khai_thien"])').textContent();
  check("dòng chỉ số đúng phần trăm của game", /Công \+88%/.test(line) && /Bạo kích \+18%/.test(line) && /Tu luyện \+14%/.test(line) && !/undefined/.test(line), line.replace(/\s+/g, " ").slice(0, 120));
  await page.click('[data-act="bao-forge"][data-id="tp_khai_thien"]');
  await sleep(250);
  const made = await page.evaluate((id) => {
    const c = globalThis.__VK2._test.char();
    return { own: c.inventory.includes("tp_khai_thien"), worn: c.equipped.vu_khi, gone: !c.inventory.includes(id), ess: c.vk2.bao.essence, panel: document.querySelector("#vk2-modal")?.textContent ?? "" };
  }, data.supreme[0]);
  check("nút đúc tạo ra đồ, tự mặc, tốn đúng tinh hoa và món Cực phẩm", made.own && made.worn === "tp_khai_thien" && made.gone && made.ess === 0, JSON.stringify({ ess: made.ess, worn: made.worn }));
  check("bảng hiện đã có món vừa đúc", /Đã có/.test(made.panel));
  await page.click('#vk2-modal [data-act="close"]');

  // ---------- Thần thông trong trận thật ----------
  await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.inventory.push("tp_hon_nguyen", "tp_chu_thien");
    c.equipped.ao = "tp_hon_nguyen";
    c.equipped.phu_kien = "tp_chu_thien";
  });
  const mods = await page.evaluate(() => globalThis.__VK2._test.core.duelMods(globalThis.__VK2._test.char()));
  check("thần thông của đồ đang mặc đi vào cơ chế trận", mods.pierce >= 0.14 && mods.shield >= 0.12 && mods.dodge >= 0.08, JSON.stringify({ pierce: mods.pierce, shield: mods.shield, dodge: mods.dodge }));
  await alive(page);
  // Đo đường đi của thần thông: nâng né trong lúc đo để không phụ thuộc vận may, và hạ cảnh giới để quái còn đánh trả được
  const realFightMods = await page.evaluate(() => {
    const it = globalThis.VK2Gear.ITEMS.find((x) => x.id === "tp_chu_thien");
    const old = it.perk.dodge;
    it.perk.dodge = 0.5;
    globalThis.__VK2._test.char().realm = 4;
    return old;
  });
  const seen = await realFight(page, 45000, "Né");
  check("trong trận thật có né đòn từ đồ Tuyệt phẩm", seen.some((t) => /Né/.test(t)), `${seen.length} đòn`);
  await page.evaluate((old) => {
    globalThis.VK2Gear.ITEMS.find((x) => x.id === "tp_chu_thien").perk.dodge = old;
    globalThis.__VK2._test.char().realm = 11;
  }, realFightMods);
  check("đồ không bán ở chợ: giá 0 và nguồn sự kiện, đúng điều kiện lọc của cửa hàng", await page.evaluate(() => globalThis.VK2Gear.ITEMS.every((x) => x.src === "event" && !x.price)));

  // ---------- Ảnh thú ----------
  const pets = await page.evaluate(() => Object.keys(globalThis.VK2Gear.PETS));
  for (const id of pets) {
    await alive(page);
    await clear(page);
    const r = await page.evaluate(async (id) => {
      const c = globalThis.__VK2._test.char();
      c.pet = true;
      c.petKind = id;
      c.streak = null;
      for (const b of document.querySelectorAll("button")) if (/Dừng|Về nghỉ|Rút lui/.test(b.textContent) && b.offsetParent) b.click();
      globalThis.__VK2._test.game();
      globalThis.__VK2._test.render();
      await new Promise((r) => setTimeout(r, 1400));
      const look = globalThis.VK2Gear.PETS[id].look;
      const img = new Image();
      const size = await new Promise((res) => {
        img.onload = () => res([img.naturalWidth, img.naturalHeight]);
        img.onerror = () => res(null);
        img.src = [...document.querySelectorAll("script[src*='/vk2/gear.js']")][0].src.replace(/\/vk2\/gear\.js.*/, `/lpc/beasts/${look.sheet}.png`);
      });
      return { size, want: [look.frames * look.cell, look.cell] };
    }, id);
    check(`ảnh ${id} tải được và đúng kích thước khung`, r.size && r.size[0] === r.want[0] && r.size[1] === r.want[1], `${r.size} / ${r.want}`);
    await page.screenshot({ path: path.join(OUT, `pet_${id}.png`) });
    const thu = await panelText(page, "thu", `pet_panel_${id}.png`);
    const name = await page.evaluate((id) => globalThis.VK2Gear.PETS[id].name, id);
    check(`bảng Linh thú của game hiện ${name}`, thu.includes(name) && !/undefined/.test(thu));
  }
  const book = await panelText(page, "thu");
  const count = book.match(/(\d+)\s*\/\s*(\d+)/g);
  check("sổ linh thú của game có thêm 8 con", (count ?? []).some((x) => /\/\s*51$/.test(x)), `${count}`);

  // ---------- Gặp thú qua sự kiện thật rồi thu phục ----------
  await page.evaluate(() => {
    const c = globalThis.__VK2._test.char();
    c.pet = false;
    c.petKind = null;
    const B = globalThis.VK2Bao;
    c.vk2.bao.seen = {};
    c.vk2.bao.beastAt = -99;
    for (const k of Object.keys(B.BEAST)) B.BEAST[k].rate = 1;
  });
  let met = null;
  for (let i = 0; i < 400 && !met; i++) {
    await alive(page);
    await play(page);
    met = await page.evaluate(() => {
      // Game cũng có sự kiện thú của riêng nó với cùng lời mời, nên nhận theo tên thú mới
      const names = Object.values(globalThis.VK2Gear.PETS).map((p) => p.name);
      const b = [...document.querySelectorAll(".choices .choice")].find((x) => /Giao chiến thu phục/.test(x.textContent) && names.some((n) => x.textContent.includes(n)) && x.getClientRects().length);
      if (!b) return null;
      const t = b.textContent;
      b.click();
      return t;
    });
    if (!met) await clear(page);
    await sleep(120);
  }
  check("sự kiện gặp linh thú hiện ra trong năm thật", !!met, met ?? "");
  await page.screenshot({ path: path.join(OUT, "pet_event.png") });
  await page.evaluate(() => {
    for (const k of Object.keys(globalThis.VK2Bao.BEAST)) globalThis.VK2Bao.BEAST[k].rate = 0;
  });

  let fought = false;
  let tamed = false;
  let catchText = "";
  for (let i = 0; i < 700 && !tamed; i++) {
    await alive(page);
    const r = await page.evaluate(() => {
      const c = globalThis.__VK2._test.char();
      c.streak = null;
      c.stats.sucKhoe = 100;
      const vis = (b) => b && b.getClientRects().length > 0;
      const battle = !!document.querySelector(".scene .battle");
      const choices = [...document.querySelectorAll(".choices .choice")].filter((b) => vis(b) && !b.classList.contains("off"));
      const pick = choices.find((b) => /thu phục|Thu phục|Tame|Phù|Thử/.test(b.textContent)) ?? choices[0];
      const text = choices.map((b) => b.textContent.trim()).join(" | ");
      pick?.click();
      if (!choices.length && !battle) [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "▶")?.click();
      return { battle, text, pet: c.pet && c.petKind, target: !!c.catchTarget };
    });
    fought = fought || r.battle;
    if (r.text && /thu phục|Thu phục/.test(r.text)) catchText = r.text;
    tamed = !!r.pet;
    if (i % 40 === 39 && !fought) await page.screenshot({ path: path.join(OUT, "pet_stuck.png") });
    await sleep(150);
  }
  check("chọn giao chiến thì vào trận thu phục thật", fought);
  const pet = await page.evaluate(() => globalThis.__VK2._test.char().petKind);
  check("thắng trận thu phục được thú mới", tamed && !!(await page.evaluate((p) => globalThis.VK2Gear.PET_RANK[p], pet)), `${pet} · ${catchText.slice(0, 120)}`);
  await page.screenshot({ path: path.join(OUT, "pet_tamed.png") });

  // ---------- Tiếng Anh ----------
  await page.evaluate(() => localStorage.setItem("vkl.lang", "en"));
  await page.goto(`${BASE}/choi/`, { waitUntil: "domcontentloaded" });
  await sleep(2500);
  const fxLine = await page.evaluate(() => globalThis.VK2Gear.ITEMS[0].fx.atk);
  check("chỉ số đồ không bị đổi khi đổi ngôn ngữ", fxLine === 45);
  const en = await page.evaluate(() => ({ item: globalThis.VK2Gear.ITEMS[2].name, pet: globalThis.VK2Gear.PETS.bach_trach.name, meet: globalThis.VK2Gear.PETS.bach_trach.meet }));
  check("đổi tiếng Anh thì tên đồ và thú đổi theo", en.item === "Heaven-Opening Blade" && en.pet === "Baize" && /white divine beast/.test(en.meet), en.item);

  // Hydrate #418 là cái giá đã biết khi tải trang bằng tiếng Anh: HTML tĩnh là tiếng Việt, xem lang.js
  const real = errors.filter((e) => !/Minified React error #418/.test(e));
  check("không có lỗi trang", real.length === 0, real.slice(0, 3).join(" | "));
  await browser.close();
}

(async () => {
  for (let i = 1; i <= 5; i++) {
    fails = 0;
    try {
      await attempt();
      break;
    } catch (e) {
      await browser?.close().catch(() => {});
      if (!(e instanceof Died) || i === 5) throw e;
      console.log(`\n--- Lượt ${i} dừng vì nhân vật chết giữa chừng, chơi lại. Chỉ tính kết quả của lượt cuối.\n`);
    }
  }
  console.log(fails ? `\n${fails} kiểm tra hỏng` : "\nĐạt hết");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
