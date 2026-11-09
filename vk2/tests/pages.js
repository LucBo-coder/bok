// Kiểm thử bản dựng cho thư mục con như GitHub Pages: mọi trang phải mở được và không có request nào lọt khỏi tiền tố.
// Dùng: python build_mod.py --base /bok; BASE=/bok PORT=8777 python serve_mod.py
//       VK2_URL=http://localhost:8777/bok NODE_PATH=<...> node vk2/tests/pages.js [thư-mục-ảnh]
const { chromium } = require("playwright-core");
const { guard } = require("./popups");
const path = require("node:path");

const ROOT = process.env.VK2_URL;
const PREFIX = new URL(ROOT).pathname;
const ORIGIN = new URL(ROOT).origin;
const OUT = process.argv[2] || ".";
const ROUTES = ["/", "/choi/", "/dang-nhap/", "/bang-xep-hang/", "/loi-dai/", "/cap-nhat/", "/gop-y/", "/nghia-trang/", "/tang-kiep-cac/", "/moi-tra/", "/tac-gia/", "/chinh-sach/", "/dieu-khoan/", "/so-sinh-tu/"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`);
};

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await guard(page);
  const bad = new Set();
  const missingSprites = new Set();
  const external = new Set();
  const errors = [];
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.origin !== ORIGIN) return;
    // Lệnh gọi API bị guard chặn thì không tới máy chủ; thứ gì còn trả 404 là đường dẫn hỏng thật.
    // Game cố ý thử idle.png rồi lùi về walk.png, và bản bundle thiếu một số lớp áo/tóc, nên ảnh lpc được đếm riêng.
    const inPrefix = u.pathname === PREFIX || u.pathname.startsWith(PREFIX + "/");
    if (inPrefix && r.status() === 404 && u.pathname.startsWith(`${PREFIX}/lpc/`)) missingSprites.add(u.pathname);
    else if (r.status() >= 400 || !inPrefix) bad.add(`${r.status()} ${u.pathname}`);
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    // Font và script đăng nhập Google là tài nguyên có sẵn của game; thứ cần chặn là kết nối dữ liệu.
    if (u.protocol.startsWith("http") && u.origin !== ORIGIN && ["fetch", "xhr", "websocket", "eventsource"].includes(r.resourceType())) external.add(u.origin);
  });
  page.on("pageerror", (e) => errors.push(e.message));

  for (const route of ROUTES) {
    const res = await page.goto(`${ROOT}${route}`, { waitUntil: "load" });
    await sleep(500);
    const title = await page.evaluate(() => document.body.innerText.trim().length);
    check(`mở ${route}`, res.status() === 200 && title > 0, `${res.status()}, ${title} ký tự`);
  }

  // Bấm link thật trong trang chủ: điều hướng phía client của Next phải giữ tiền tố.
  await page.goto(`${ROOT}/`, { waitUntil: "load" });
  await sleep(800);
  const hrefs = await page.evaluate(() => [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")));
  const outside = hrefs.filter((h) => !h.startsWith(PREFIX + "/"));
  check("mọi link trong trang chủ có tiền tố", hrefs.length > 0 && outside.length === 0, `${hrefs.length} link; sai: ${outside.join(",")}`);
  const playLink = page.locator(`a[href^="${PREFIX}/choi"]`).first();
  if (await playLink.count()) {
    await playLink.click();
    await page.waitForURL(`**${PREFIX}/choi/**`, { timeout: 10000 }).catch(() => {});
    await sleep(800);
    check("bấm link vào game giữ đúng địa chỉ", new URL(page.url()).pathname.startsWith(`${PREFIX}/choi`), page.url());
  } else check("trang chủ có link vào game", false);

  // Vào game: chữ, ảnh, nhật ký của mod đều phải hoạt động dưới tiền tố.
  await page.goto(`${ROOT}/choi/`, { waitUntil: "load" });
  for (let i = 0; i < 40 && !(await page.locator("#vk2-hud").count()); i++) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button, a")].find((x) => /Đầu thai|Bỏ qua|Ngẫu nhiên|Đã hiểu/.test(x.textContent) && x.offsetParent !== null);
      if (b) b.click();
    });
    await sleep(600);
  }
  check("vào được game", (await page.locator("#vk2-hud").count()) === 1);
  await page.evaluate(() => document.querySelector('#vk2-hud [data-tab="talents"]')?.click());
  await sleep(1000);
  const icons = await page.evaluate(() => [...document.querySelectorAll("#vk2-modal img.vk2-ic")].map((i) => ({ src: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })));
  const brokenIcons = icons.filter((i) => !i.ok);
  check("biểu tượng thiên phú tải được", icons.length > 0 && brokenIcons.length === 0, `${icons.length} ảnh; hỏng: ${brokenIcons.map((i) => i.src).slice(0, 3).join(",")}`);
  await page.screenshot({ path: path.join(OUT, "p-talents.png") });

  check("không có request hỏng hoặc lọt khỏi tiền tố", bad.size === 0, [...bad].slice(0, 12).join(" | "));
  console.log(`INFO  lớp ảnh nhân vật không có trong bundle: ${missingSprites.size}`);
  check("không có request tới máy chủ ngoài", external.size === 0, [...external].slice(0, 6).join(","));
  check("không có lỗi JS", errors.length === 0, errors.slice(0, 3).join(" | ").slice(0, 400));
  await browser.close();
  console.log(fails ? `${fails} lỗi` : "Tất cả đạt");
  process.exit(fails ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
