// Popup ngẫu nhiên của game (kẻ địch chặn đường, truyện tranh chương mới, thương nhân lưu động, thiên kiếp) che nút mà test đang bấm.
// Playwright tự dọn chúng trước mỗi thao tác, giống người chơi: cáo từ hoặc bỏ chạy, bỏ qua truyện, chào rồi đi tiếp, phó mặc thiên kiếp.
async function guard(page) {
  await page.addLocatorHandler(page.locator(".duel-warn"), async () => {
    await page.locator(".duel-warn .duel-actions button").last().click();
  });
  await page.addLocatorHandler(page.locator(".cn-wrap"), async () => {
    await page.locator(".cn-wrap .cn-skip").click();
  });
  // Thiên kiếp có nhiều màn liền nhau, nên không chờ nó biến mất sau mỗi lần bấm
  await page.addLocatorHandler(page.locator(".kiep"), async () => {
    await page.locator(".kiep button").last().click();
  }, { noWaitAfter: true });
  await page.addLocatorHandler(page.locator(".mc-stage"), async () => {
    await page.getByRole("button", { name: /Chào lão|Bid farewell/ }).click();
  });
}

module.exports = { guard };
