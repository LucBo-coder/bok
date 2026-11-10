# TASKS — Trạng thái triển khai

Cập nhật: 09/11/2026. Chỉ ghi "xong" cho phần đã có code và đã chạy kiểm thử.

## Giai đoạn 0 — Audit: xong (trong giới hạn bundle)

Nguồn là bundle production đã minify, không có TypeScript, API server hay schema. Audit dựa trên đọc code ở các điểm chính và tìm theo từ khóa, nên cột "Hiện trạng" của các hệ thống chưa gắn hook chỉ là đánh giá sơ bộ.

| Hệ thống | Hiện trạng trong game gốc | Mức đọc | Hướng nâng cấp |
|---|---|---:|---|
| Lưu dữ liệu | localStorage `vkl.save`, `vkl.meta`; có đăng nhập thì thêm RPC Supabase | Đọc kỹ | Dùng lại cho `char.vk2` |
| Tu luyện | `nM` tính tốc độ theo cảnh giới, linh căn, ngộ tính, đạo lộ, đồ | Đọc kỹ | Đã thêm hệ số VK2 |
| Đột phá, lôi kiếp | Có sự kiện, công thức tỷ lệ kẹp 8–90%; có thiên kiếp | Đọc công thức | Đã thêm cộng tỷ lệ; GĐ3 đào sâu |
| Chiến đấu | Theo lượt tự động, có ngũ hành, công pháp, hiệu ứng | Đọc một phần | Đã thêm hệ số chỉ số |
| Thiên phú | Mua bằng phúc duyên khi đầu thai, không có cấp độ | Đọc một phần | Giữ nguyên, thêm thiên phú tu hành |
| Linh căn | 5 phẩm với hệ số tu; ngũ hành là một `element` riêng | Đọc kỹ | Đã thêm dạng linh căn đa hệ |
| Nhiệm vụ | 3 nhiệm vụ ngày chấm lúc chết; Hệ Thống là sự kiện riêng; không có chính tuyến | Đọc kỹ | Đã thêm chính tuyến, tracker, nhật ký |
| Thành tựu | 16 thành tựu dài hạn, danh hiệu tuần, Sổ Sinh Tử | Từ khóa | Giữ nguyên, không tạo trùng |
| Công pháp | Có sở hữu, trang bị, tầng, truyền kiếp | Đọc một phần | GĐ3 |
| Tông môn | Nhiều tông, cấp bậc, thí luyện | Từ khóa | GĐ4 |
| Linh thú | Thu phục, thân thiết, tiến hóa (bản 4.3.0) | Từ khóa, changelog | GĐ4 |
| Luyện đan | Trọng tâm `luyen_dan`, đan dược | Từ khóa | GĐ4 |
| Luyện khí, cường hóa | Không thấy "cường hóa"; có từ "rèn", chưa đọc | Từ khóa | Cần kiểm tra ở GĐ4 |
| Trận pháp | Đạo lộ Trận tu và văn bản sự kiện, chưa thấy hệ thống riêng | Từ khóa | GĐ4 |
| Bí cảnh | Dạng sự kiện, chưa thấy hệ thống bản đồ | Từ khóa | GĐ4 |
| Tâm ma | Là chỉ số và có trong nhiều sự kiện | Từ khóa | GĐ3 |
| Nhân quả, luân hồi | Đạo tâm, nghiệp, oan gia, bia mộ, huyết mạch, kế thừa công pháp | Đọc một phần | GĐ5 |

## Giai đoạn 1 — Nhiệm vụ: xong ở mức client sandbox

- [x] Chính tuyến 19 nhiệm vụ, 6 chương, mở khóa theo chuỗi
- [x] Chuẩn bị đột phá 18 nhiệm vụ, hiện theo cảnh giới kế tiếp, cộng tỷ lệ đột phá thật
- [x] Hằng ngày: chọn 3 trong 6 việc, đặt lại khi đổi ngày, thưởng một lần
- [x] Luân hồi 7 nhiệm vụ, phạm vi tài khoản, thưởng phúc duyên một lần
- [x] Thiên phú: mỗi thiên phú đang vận hành sinh một nhiệm vụ thăng bậc
- [x] Tracker tối đa 3, thanh tiến trình, số 7/10, nút Đi đến, thông báo, nhận thưởng
- [x] Nhật ký, ghim, tự thu gọn khi có sự kiện và trên màn hình nhỏ
- [ ] **Xác thực phần thưởng phía server: chưa làm được vì không có backend.** Chưa đạt yêu cầu "không tin dữ liệu client", nên chưa dùng được cho production.
- [ ] Reset ngày theo giờ máy chủ: đang dùng giờ máy người chơi
- [ ] Hướng dẫn người chơi mới: game gốc đã có Cẩm nang và gợi ý, chưa bổ sung thêm

## Giai đoạn 2 — Thiên phú và linh căn: xong ở mức client sandbox

- [x] 10 thiên phú, 4 phẩm chất, 5 bậc, thức tỉnh theo hành vi
- [x] Ô vận hành theo cảnh giới, giới hạn 6 thiên phú mỗi kiếp
- [x] Nhánh tiến hóa cho Kiếm Tâm và Ma Tâm, không đổi lại được
- [x] Đánh đổi và trần giảm dần
- [x] Linh căn 1–5 hệ, biến dị hiếm, hợp đạo lộ
- [x] UI thiên phú, UI linh căn, song ngữ trong dữ liệu
- [x] Sổ thiên phú qua kiếp, lợi thế khởi đầu có giới hạn
- [ ] Cân bằng bằng chơi thật: mới là thông số khởi tạo
- [ ] Thức tỉnh từ cơ duyên, bí cảnh, truyền thừa: cần GĐ4
- [x] Hiệu ứng thức tỉnh: chữ lớn giữa màn hình và cột sáng trên nhân vật, cho thiên phú, thể chất và huyết mạch gia tộc

## Kế hoạch 3.0

Master prompt 3.0 (09/11/2026) thay cho các mục GĐ3–GĐ6 cũ, và có cách đánh số giai đoạn riêng (3.0-GĐ1 đến 3.0-GĐ6). Cả 6 giai đoạn đã có code.

### Đối chiếu 18 hệ thống với code hiện có

"Mức đọc" cho biết độ tin cậy của cột "Game gốc đã có".

| # | Hệ thống | Game gốc đã có | Mức đọc | Giai đoạn | Trạng thái |
|---:|---|---|---|---:|---|
| 1 | Kinh mạch, đan điền, chu thiên | Chỉ có văn bản; sự kiện khổ tu quá độ | Đọc kỹ | 1 | **Xong** |
| 2 | Thể chất và huyết mạch | Không có thể chất; huyết mạch `huyetMach` từ linh thú | Đọc một phần | 1, 2, 4 | **Xong**; có 3 huyết mạch mới, thức tỉnh qua truyền thừa, gia tộc, hậu duệ |
| 3 | Đạo cơ, phẩm chất Kim Đan | Chỉ có văn bản | Đọc kỹ | 1 | **Xong** |
| 4 | Ngộ đạo, sáng tạo công pháp | Công pháp có tầng và kinh nghiệm, lĩnh ngộ chiêu từ quái; chưa có kết hợp | Đọc một phần | 2 | **Xong**; 12 công thức cố định, không sinh tự do |
| 5 | Bí cảnh nhiều tầng | Dạng sự kiện (`bi_canh`), chưa có tầng và rút lui | Đọc một phần | 2 | **Xong**; đi qua sự kiện, không có bản đồ riêng |
| 6 | Truyền thừa cổ tu | Truyền công pháp qua kiếp (`cpHeir`, `cpBook`); chưa có truyền thừa theo đạo | Đọc một phần | 2 | **Xong** |
| 7 | Sư đồ | Chuỗi sự kiện nhận đồ đệ, phản sư, sư phụ chỉ điểm; đồ đệ chưa có tiến trình riêng | Đọc một phần | 4 | **Xong** |
| 8 | Tông môn động | Nhiều tông, cấp bậc, thí luyện; chưa có lãnh thổ, chiến tranh | Đọc một phần | 4 | **Xong** |
| 9 | Gia tộc | Chỉ có xuất thân và văn bản | Từ khóa | 4 | **Xong** |
| 10 | Luyện khí, phù lục, bản mệnh | Có Lò rèn (`forge`, `forgeMap`); "bản mệnh" chỉ là hệ ngũ hành; không có phù lục | Đọc một phần | 3 | **Xong**, trừ cơ chế trận trong trận thời gian thực (chỉ nhận chỉ số) |
| 11 | Động phủ | Bế quan có thật, động phủ chỉ là văn bản | Đọc một phần | 3 | **Xong** |
| 12 | Tâm ma, chấp niệm | Chỉ số tâm ma và sự kiện `tam_ma`; chưa dựa trên lịch sử nhân vật | Đọc một phần | 5 | **Xong** |
| 13 | Pháp tắc, Đại Đạo | Không có | Từ khóa | 5 | **Xong** |
| 14 | NPC tự phát triển | Oan gia và kẻ thù có tên, không có mô phỏng theo năm | Đọc một phần | 4 | **Xong**; 34–60 NPC mô phỏng theo năm |
| 15 | Đại sự kiện thế giới | Thiên tượng hằng ngày, Tiên Ma đại chiến dạng sự kiện | Từ khóa | 5 | **Xong** |
| 16 | Thiên Đạo ghi nhớ | Kiếp Số, nghiệp lực, sự kiện "Thiên đạo chú ý" | Đọc một phần | 6 | **Xong** |
| 17 | Thiên Mệnh cá nhân | Chỉ có thiên phú mua "Thiên mệnh chi tử" và chuỗi Hệ Thống | Đọc một phần | 6 | **Xong**; chuỗi Thiên Sát Cô Tinh ít đi tới kết cục trong mô phỏng |
| 18 | Nhân quả, truyền thừa xuyên kiếp | Oan gia, bia mộ, huyết mạch, rương chôn, Mạnh Bà, Thiên thư; chưa có di sản trong thế giới | Đọc một phần | 6 | **Xong**; đọc Phúc duyên, Nghiệp, Kiếp số, Hồn lực; chưa dùng Mạnh Bà, Sổ Sinh Tử, Thiên thư làm điều kiện |

"Xong" ở đây là: có code, có hiệu ứng thật lên nhân vật, đã qua test logic, test trong game và mô phỏng. Chưa có nghĩa là đã cân bằng: chưa có người chơi thật nào chơi các hệ thống này.

### 3.0-GĐ1 — Căn cơ: xong ở mức client sandbox

Code: `vk2/can.js`. Chi tiết ở [CULTIVATION_SYSTEM](CULTIVATION_SYSTEM.md), kết quả ở [TEST_REPORT](TEST_REPORT.md).

- [x] Đan điền, độ tinh thuần, độ ổn định, 20 kinh mạch, nội thương, tạp chất
- [x] 3 phương pháp tu luyện, tích hợp vào trọng tâm Tu luyện và bế quan, không có thao tác lặp
- [x] Tiểu chu thiên, đại chu thiên, xung mạch có thể thất bại
- [x] 10 thể chất có điều kiện, ưu điểm, nhược điểm, cách phát triển và 3 giai đoạn
- [x] Đúc đạo cơ và ngưng Kim Đan có 4 cách, phẩm chất dựa trên 6 yếu tố gồm cả thiên tượng; có cải tạo về sau
- [x] Tab Căn Cơ, nút báo trên HUD, ghi nhật ký game, tab Hành trình, sổ kiếp
- [x] 8 nhiệm vụ căn cơ trong hệ VK2, save cũ được ghi nhận không phát thưởng bù
- [x] Mô phỏng trên logic game thật, có đối chứng
- [ ] Cân bằng bằng chơi thật: thông số mới được chỉnh theo mô phỏng, chưa có người chơi thật
- [ ] Mô phỏng chưa gồm trận đấu thời gian thực, nên các thể chất cần nhiều trận thắng chưa được đo
- [ ] Huyết mạch thức tỉnh qua cơ duyên, truyền thừa, gia tộc: cần GĐ2 và GĐ4

### 3.0-GĐ2 đến GĐ6: xong ở mức client sandbox

Code: `vk2/dao.js`, `khi.js`, `the.js`, `phap.js`, `menh.js`, giao diện ở `vk2/ui3.js`. Chi tiết ở [WORLD_SYSTEM](WORLD_SYSTEM.md), kết quả ở [TEST_REPORT](TEST_REPORT.md).

- [x] GĐ2: 8 bí cảnh nhiều tầng, 6 truyền thừa, 15 đạo niệm, 12 công thức sáng tạo công pháp, 3 huyết mạch
- [x] GĐ3: 7 nguyên liệu, 5 loại pháp bảo, cường hóa +9, khí linh, bản mệnh, 5 loại phù, động phủ 3 đất và 7 công trình
- [x] GĐ4: thế giới theo năm trong tài khoản, NPC, sư đồ, tông môn động, gia tộc, kẻ thù
- [x] GĐ5: 7 loại chấp niệm, tâm ma, 13 pháp tắc 6 bậc, 8 đại biến
- [x] GĐ6: sổ Thiên Đạo, 5 quy tắc có ngưỡng, 4 Thiên Mệnh, di sản xuyên kiếp, nợ nhân quả
- [x] Không thêm tab trên màn hình chính: mọi thứ nằm trong các nhóm của bảng Hành trình
- [x] Mô tả trên trang chủ và mục "Cách chơi" được đổi lúc build (`TEXT_EDITS`)
- [ ] Cân bằng bằng chơi thật: thông số mới được chỉnh theo mô phỏng
- [x] Trận thời gian thực nhận cơ chế trận (đánh trước, đánh thêm, hút máu, né, xuyên giáp, hộ thể, thiêu đốt) của pháp bảo, phù, bí thuật, pháp tắc
- [x] Sửa lỗi trang tải lại liên tục khi chọn tiếng Anh, có test `lang.js`
- [ ] Cân bằng theo mô phỏng chưa đạt: Cân bằng, Ổn định tới Hóa Thần gần gấp đôi đối chứng, Tà đạo tụt mạnh (số liệu ở TEST_REPORT)
- [ ] Chưa thử: văn bản sự kiện 3.0 bằng tiếng Anh, điện thoại thật, Safari, và bản 3.0 đầy đủ trên trang Pages thật

## Phạm vi hiện tại

Cập nhật 09/11/2026: bản sandbox đã chạy trên GitHub Pages tại https://lucbo-coder.github.io/bok/play/choi/ để chơi bằng điện thoại. Bản này vẫn không có backend, nên đăng nhập, lưu đám mây, bảng xếp hạng và lôi đài không hoạt động.

Chủ dự án chốt ngày 09/11/2026: chỉ chạy local trên máy tính và điện thoại, không làm backend. Vì vậy các mục phía server ở trên không còn là việc cần làm, và việc gian lận qua localStorage được chấp nhận. Sandbox giữ nguyên.

Nếu sau này muốn phát hành online: cần nối lại repo gốc (mod dựa trên 5 chuỗi minify của đúng một build) và làm RPC phía server (xem DATABASE_DESIGN.md).

## Hệ thống sự kiện động: xong (commit `1e78ce3`)
- [x] GĐ1 Event Engine, GĐ2 Chuỗi, GĐ3 NPC và thế giới, GĐ4 Nhân quả và luân hồi, GĐ5 Nội dung, GĐ6 Giao diện và kiểm thử.
- [x] 132 sự kiện đơn, 30 giai đoạn có lựa chọn, 22 chuỗi, 50 kết cục, 3 mạch đời NPC.
- [x] Cân bằng Tà đạo (10/11/2026): "Thuận theo" tâm ma +8 → +3. Mô phỏng: Hóa Thần 11% so với 18% đối chứng (trước: 5% so với 21%).

## Đồng bộ mod với game gốc (09/11/2026)

Trước đợt này, một số hệ thống hiện trên bảng của mod nhưng không tác động vào game. Đo trên game thật trước khi sửa: 451 đòn với mọi pháp tắc chiến đấu ở bậc cao nhất mà không có lần né, hút máu hay đánh thêm nào; cấp 40 năm thọ thì sau 5 năm mất hết.

- [x] Cơ chế trận đi vào trận thật, qua bản vá hai hàm đòn `n7`, `n8` (săn quái, phục kích, đấu tay đôi)
- [x] Trần cơ chế trận hạ xuống vì nay áp dụng cho mọi trận
- [x] Thọ từ pháp tắc Thời Gian và sự kiện ghi vào `lifeExtra`, không còn bị game kẹp mất
- [x] 8 tông môn của game có trong thế giới của mod, đúng phe, không bị diệt; save cũ được bổ sung một lần
- [x] Tông do mod tạo có phe thật trong game (danh xưng, thí luyện), không còn mặc định chính phái
- [x] Hộ Thân Phù có tác dụng khi đột phá hỏng; lên tầng không còn làm mất phù đột phá
- [x] Bảng Trừ yêu, Thông tin, Tàng Kinh Các, Túi đồ, Bế quan, Linh thú của game có mục nối sang hệ thống của mod
- [x] Trận thật mài pháp bảo đang mang 0,25 độ bền mỗi trận (bản mệnh và pháp tắc Kim mòn chậm hơn); bí cảnh vẫn mài 1–3 mỗi trận
- [ ] Cân bằng sau thay đổi này mới đo bằng mô phỏng công thức trận, chưa có người chơi thật

## Lớp đồ họa
- [x] Trời theo giờ, thiên tượng, hạt theo trọng tâm, hào quang theo cảnh giới, hiệu ứng đột phá, khung sự kiện theo độ hiếm, tab Đồ Họa.
- [x] Trận chiến: tia va chạm, nổ khi quái chết, rung khi bạo kích, viền đỏ khi máu dưới 25%.
- [x] Linh thú: bóng dưới chân, đốm lấp lánh, viền sáng.
- [x] Màn chết: hồn bay phía sau tờ giấy, nền tối. Màn đầu thai: trời sao, bánh xe luân hồi, quầng sáng khi vào đời.
- [x] `vk2/tests/popups.js`: mọi test Playwright tự dọn cảnh báo đồng đạo, truyện tranh và thương nhân lưu động.
- [ ] Đo tốc độ trên điện thoại thật.
- [ ] Người chơi thật đánh giá về thẩm mỹ.

## Trang bị Tuyệt phẩm và linh thú mới (09/11/2026)
- [x] Phẩm thứ 5 trong bảng đồ thật của game: nhãn, màu, giá bán, ảnh
- [x] 9 món ở 3 mốc Nguyên Anh, Độ Kiếp, Kim Tiên; mỗi món có một thần thông đi vào cơ chế trận chung
- [x] Đúc từ một món Cực phẩm cùng loại, Thiên Công Tinh Hoa và linh thạch; không rơi từ quái, không bán ở chợ
- [x] 8 linh thú (3 SR, 3 SSR, 2 SSS) trong bảng dị thú thật: sổ, trận thu phục, tiến hóa của game
- [x] Bảng Tuyệt Phẩm ở nhóm Sản nghiệp, mục nối từ Túi đồ, 3 nhiệm vụ
- [ ] Tốc độ kiếm tinh hoa và tỷ lệ gặp thú chưa được đo qua người chơi thật

## Túi đồ: Phàm giới, Thiên giới, trang bị nhanh (10/11/2026)
- [x] Lọc lưới đồ của game theo giới: Phàm giới là đồ yêu cầu Phàm Nhân tới Độ Kiếp, Thiên giới từ Chân Tiên trở lên. Lựa chọn được nhớ theo trình duyệt (`vk2.bagWorld`).
- [x] Nút Trang bị nhanh: thử từng món trong túi bằng hàm chỉ số thật của game (`nd`), cộng tu luyện, bạo kích và thần thông, rồi mặc món tốt nhất cho mỗi ô trong giới đang xem.
- [x] Dòng "Mod đang cộng" trong Túi đồ: phần trăm thật sau trần và softcap, cùng thần thông của đồ Tuyệt phẩm.
- [x] Kiểm tra chỉ số mod có vào game không: Công trong Túi đồ từ 213 lên 255 khi mang 3 pháp bảo, tắt mod thì về 220. Chỉ số có vào game, nhưng bị trần `MOD_CAP` và softcap nên thường nhỏ hơn con số in trên từng món của mod.
- [ ] Nút "Bán đồ thừa" của game vẫn tính trên cả túi, kể cả khi đang lọc một giới.

## Cân bằng 10/11/2026 (mô phỏng 100 kiếp mỗi cấu hình)
- [x] Nội thương tự lành 3% mức hiện tại mỗi năm khi tu, nên Cưỡng ép không còn cộng dồn tới chết. Cưỡng ép: Nguyên Anh 44% (đối chứng 54%), tuổi thọ 135 (174); trước sửa là 39% (59%), 118 (161).
- [x] Cân bằng và Ổn định không còn gấp đôi đối chứng: Hóa Thần 42% (30%) và 37% (29%).
- [ ] Cưỡng ép vẫn thất bại đột phá gần gấp đôi đối chứng (98 so với 50) và thọ ngắn hơn khoảng 40 năm. Có thể là đúng ý "rủi ro cao", cần người chơi thật đánh giá.
