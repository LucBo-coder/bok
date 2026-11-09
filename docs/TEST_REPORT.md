# TEST REPORT

## Lớp đồ họa (09/11/2026)

`vk2/fx.js` và `vk2/gfx.css`, chỉ đọc trạng thái, không đổi dữ liệu chơi. Có ba mức Cao, Vừa, Tắt trong tab Đồ Họa.

| Bộ test | Kết quả |
|---|---|
| Logic Node | 230/230 |
| `gfx` local và tiền tố | 21/21, 21/21 |
| `v3_e2e` local và tiền tố | 66/66, 66/66 |
| `can_e2e`, `restart`, `pages` | 41/41, 7/7, 21/21 |
| `mobile` local và tiền tố | 38/38, 38/38 |
| `e2e`, `lang` local | 52/52, đạt khi chạy riêng lần hai |
| `lang` tiền tố | Đạt |
| `sim.js 100` | 0 vi phạm, 0 lỗi trang |

Trong lượt chạy đầu, `e2e` và `lang` local dừng vì popup ngẫu nhiên của game (cảnh báo đồng đạo, truyện tranh chương 1) che nút mà test cần bấm. Đây là độ mong manh của test, chưa sửa. Chạy lại riêng từng bộ thì đạt.

Lỗi tìm ra bằng cách xem ảnh chụp, không phải bằng test tự động:
- Ánh chớp đột phá không tắt khi game tạm dừng, phủ trắng cả cảnh. Đã sửa và thêm test.
- Ảnh nền mới của game che canvas phía sau. Đã sửa và thêm test.
- Hạt linh khí chồng thành đốm sáng trước người nhân vật. Đã sửa, chỉ kiểm bằng mắt.

Lỗi gameplay tìm ra khi làm đồ họa: hàm thiên tượng chỉ được nạp khi game tính đúc đạo cơ, nên sự kiện theo thiên tượng không chạy ở đầu đời. Nay nạp ở mỗi năm.

Giới hạn: tốc độ 115 khung trong 4 giây chỉ đo trên máy này, chưa đo trên điện thoại thật. Chưa có người chơi đánh giá về thẩm mỹ.

## Hệ thống sự kiện động (09/11/2026)

Nội dung: 132 sự kiện đơn, 30 giai đoạn có lựa chọn (tổng 162), 22 chuỗi, 50 kết cục, 12 nhóm, 5 cấp, 3 mạch đời NPC.

| Bộ test | Kết quả |
|---|---|
| Logic Node (gồm `su.test.js` 49 test) | 230/230 |
| `v3_e2e` local và tiền tố `/bok/play` | 65/65, 65/65 |
| `e2e`, `can_e2e`, `restart` | 52/52, 41/41, 7/7 |
| `mobile` local và tiền tố | 38/38, 38/38 |
| `pages` tiền tố | 21/21 |
| `lang` local và tiền tố | Tất cả đạt |
| `sim.js 100` (1200 kiếp) | 0 vi phạm, 0 lỗi trang |

Mô phỏng: tài khoản lớn nhất 100 KB, linh thạch lớn nhất cuối kiếp 5419, 50/50 kết cục chuỗi đã xảy ra. Tỷ lệ tới Hóa Thần so với đối chứng: Cân bằng 38/23, Ổn định 38/27, Cưỡng ép 20/23, Xoay 23/14, Tà đạo 7/22, Luyện đan 0/0.

Lỗi tìm ra và đã sửa:
- `terr` của tông vượt 9, do `the.js` tăng không chặn và do hậu quả chuỗi.
- Hậu quả chuỗi giảm linh mạch của mọi tông, bào mòn thế giới qua hàng nghìn năm. Nay chỉ tác động một tông.
- Tài khoản không lưu khi rời trang, nên sau tải lại sự kiện chuỗi có thể trỏ tới thế giới cũ hơn. Nay lưu ở `pagehide`, và sự kiện đang chờ giữ tên người liên quan.
- Bảng nhiệm vụ không có nhóm `su`. `bl: "long"` không phải huyết mạch có thật. Chữ `{npc}` chưa được điền trong dấu vết.

Giới hạn:
- `sim.js` trình duyệt gặp 99/132 sự kiện. Phần còn lại phụ thuộc thiên tượng theo ngày thật, `acct.mv`, Tiên giới hoặc chuỗi lựa chọn hiếm.
- Mô phỏng 1500 kiếp trong `su.test.js`, với thiên tượng và chỉ số được dựng, chọn được 129/132 sự kiện và 30/30 giai đoạn. Chưa được chọn: `bc_doi_doi`, `tm_nguoi_mo_2`, `hq_tran_co`. Cả ba đạt khi dựng đúng điều kiện.
- Sự kiện Tiên giới trong game thật chỉ kiểm bằng cách đặt `c.cosmos = "tien"`, không chơi tới phi thăng.
- Tà đạo tới Hóa Thần thấp hơn đối chứng rõ rệt, chưa xử lý. Luyện đan vẫn chết sớm như đối chứng.
- Chưa có người chơi thật. Tần suất khoảng 18 sự kiện mỗi kiếp với cấu hình Cân bằng là số do mô phỏng.

## 3.0-GĐ2 đến GĐ6 và sửa lỗi đổi ngôn ngữ (09/11/2026)

Edge headless, Node 24.15. "Local" là `site-mod/`. "Tiền tố" là `play/` chạy trên máy dưới `/bok/play`, giống đường dẫn của Pages nhưng **không phải trang Pages thật**.

| Bộ kiểm thử | Kết quả | Lệnh |
|---|---:|---|
| Logic, 7 bộ | 181/181 | `node --test vk2/tests/*.test.js` |
| Các hệ thống 3.0 trong game thật | 54/54 local, 54/54 tiền tố | `node vk2/tests/v3_e2e.js` |
| End-to-end VK2 cũ | 52/52 local | `node vk2/tests/e2e.js` |
| Căn cơ trong game thật | 41/41 local | `node vk2/tests/can_e2e.js` |
| Giả lập điện thoại | 38/38 local, 38/38 tiền tố | `VK2_URL=... node vk2/tests/mobile.js` |
| Tắt hẳn trình duyệt | 7/7 local | `node vk2/tests/restart.js <thư-mục>` |
| Đường dẫn thư mục con | 21/21 tiền tố | `VK2_URL=... node vk2/tests/pages.js` |
| Đổi ngôn ngữ | 23/23 local, 23/23 tiền tố | `VK2_URL=... node vk2/tests/lang.js` |
| Mô phỏng 1.200 kiếp | 0 lỗi, 0 vi phạm bất biến, 0 lỗi trang | `node vk2/tests/sim.js 100` |

Chạy tuần tự, không có việc khác song song. Một lượt trước đó có chạy song song các lượt dò ngôn ngữ thì `e2e.js` còn 45/52 và `can_e2e.js` dừng giữa chừng. Lượt chạy riêng đều đạt, nhưng nguyên nhân của lần lỗi đó chưa được xác nhận trực tiếp. Hai test này có thể chưa ổn định khi máy bận.

### Lỗi trang tải lại liên tục khi chọn tiếng Anh

- **Triệu chứng đo được:** 82 lượt điều hướng trong 6 giây ở trang chủ, 101 ở `/cap-nhat/`, `/choi/` kẹt ở màn hình tải.
- **Nguyên nhân:** game gốc tải lại trang để server đọc cookie `vkl_lang` và trả HTML tiếng Anh. Site tĩnh luôn trả HTML có `en: false`, nên điều kiện tải lại không bao giờ hết. Lỗi có sẵn từ khi chạy bản tĩnh, cũng có trên trang Pages cho tới khi `play/` mới được đẩy lên.
- **Cách sửa:** điểm vá trong `build_mod.py` bỏ lệnh tải lại đó. Các hàm dịch và từ điển của game chạy ở client nên chữ vẫn đổi.
- **Cái giá còn lại:** mỗi lần mở trang bằng tiếng Anh, React báo lỗi hydrate #418 trong console rồi tự vẽ lại, vì HTML tĩnh là tiếng Việt. Có thể thấy tiếng Việt thoáng qua trước khi trang đổi. Không thấy ảnh hưởng tới lối chơi trong test.
- **Chữ còn chưa dịch:** nhãn tốc độ "nhanh" trên màn hình đầu thai (có từ game gốc). Trong bảng của mod, các tab đã quét chỉ còn tên riêng (người, tông, gia tộc).

### Mô phỏng

6 cấu hình, 100 kiếp mỗi cấu hình và 100 kiếp đối chứng tắt các hệ thống 3.0. Bot không phải chiến lược tối ưu, không có trận thời gian thực. `tài khoản` khoảng 65 KB ở cuối lượt.

| Cấu hình | ≥Trúc Cơ | ≥Kim Đan | ≥Nguyên Anh | ≥Hóa Thần | Tuổi thọ TB |
|---|---:|---:|---:|---:|---:|
| Cân bằng | 85 (78) | 74 (68) | 65 (46) | 45 (22) | 211 (150) |
| Ổn định | 81 (84) | 77 (80) | 59 (58) | 43 (25) | 198 (167) |
| Cưỡng ép | 86 (83) | 74 (76) | 48 (53) | 25 (19) | 147 (164) |
| Xoay trọng tâm | 54 (60) | 46 (50) | 39 (30) | 24 (12) | 126 (105) |
| Tà đạo liều lĩnh | 83 (81) | 67 (72) | 27 (48) | 6 (25) | 61 (87) |
| Luyện đan | 19 (17) | 1 (7) | 1 (1) | 0 (0) | 36 (38) |

Số trong ngoặc là đối chứng. Chênh dưới khoảng 10 điểm ở 100 kiếp là nhiễu.

**Cân bằng chưa đạt:**

- Cân bằng và Ổn định tới Hóa Thần nhiều gần gấp đôi đối chứng, tuổi thọ Cân bằng tăng 61 năm. Các hệ thống mới đang làm game dễ hơn ở giữa và cuối đời.
- Tà đạo liều lĩnh tụt mạnh: Nguyên Anh 27% so với 48%, Hóa Thần 6% so với 25%, tuổi thọ 61 so với 87. Nguyên nhân chết hàng đầu là tâm ma phản phệ và thiên kiếp. Chưa xác định phần do hệ tâm ma, phần do bot chọn đường liều.
- Số lần chuyển động của từng hệ thống có trong lượt chạy, nên các hệ thống đều được dùng thật: 334 lượt vào bí cảnh, 201 bí thuật, 188 pháp bảo, 190 đồ đệ, 197 di sản tìm lại, 23 Thiên Mệnh, 12 kết cục Thiên Mệnh. `thuanTheo=0` ở Cân bằng là do bot không chọn nhánh đó.

### Lỗi kiểm thử tìm ra và đã sửa

| Lỗi | Cách sửa |
|---|---|
| Thiên Mệnh bị `rollFate` ghi đè | `setFate` đánh dấu đã gieo |
| Sổ Thiên Đạo ra `NaN` khi trừ ô chưa có giá trị (mô phỏng phát hiện) | Mặc định 0, có test |
| Quái bí cảnh quá mạnh ở tầng đầu | Tính lại từ `combatLevel` |
| Người cũ được nhận lại mỗi đời | Ghi `seen` theo tài khoản |
| Test: bấm khi nút còn `arming`, nút góp bị khóa vì thiếu linh thạch, so đạo niệm đúng từng số | Sửa trong test, game không sai |

### Chưa kiểm chứng

- **Trang Pages thật:** bản 3.0 đầy đủ chưa được chạy trên github.io vì chưa commit.
- **Người chơi thật:** chưa ai chơi các hệ thống này. Mọi số cân bằng đến từ bot.
- **Trận thời gian thực:** chỉ nhận chỉ số, không nhận cơ chế của pháp bảo, phù, pháp tắc.
- **Tiếng Anh:** mới kiểm tra đổi ngôn ngữ, vào game, thời gian trôi, tải lại và các tab ở nhân vật mới. Chưa kiểm tra văn bản sự kiện 3.0 và các tab khi đã có đủ dữ liệu bằng tiếng Anh.
- **Điện thoại thật, Safari:** chưa thử.

## 3.0-GĐ1: căn cơ (09/11/2026)

Bản local, Edge headless, Node 24.15.

| Bộ kiểm thử | Kết quả | Lệnh |
|---|---:|---|
| Logic VK2 cũ | 26/26 | `node --test vk2/tests/core.test.js` |
| Logic căn cơ | 35/35 | `node --test vk2/tests/can.test.js` |
| Căn cơ trong game thật | 41/41 | `node vk2/tests/can_e2e.js` |
| End-to-end VK2 cũ | 52/52 | `node vk2/tests/e2e.js` |
| Giả lập điện thoại | Tất cả đạt | `VK2_URL=... node vk2/tests/mobile.js` |
| Tắt hẳn trình duyệt | Tất cả đạt | `node vk2/tests/restart.js <thư-mục>` |
| Đường dẫn thư mục con | Tất cả đạt | `VK2_URL=.../bok node vk2/tests/pages.js` |
| Mô phỏng 1.200 kiếp | 0 lỗi, 0 vi phạm bất biến | `node vk2/tests/sim.js 100` |

**Độ ổn định của `can_e2e.js`:** các lượt đầu có lỗi chập chờn do chính test (popup chặn năm đầu, hạn chờ nhân vật chết quá ngắn, so sánh quá chặt sau khi tải lại), đã sửa trong test. Sau đó nhiều lần liên tiếp đều 41/41. Hai vấn đề khác cũng là của test, không phải của game:

- **Test dừng giữa chừng, không in kết quả:** test tự chọn đáp án sự kiện, và có đáp án giết nhân vật thật. Dấu vết của một lần tái hiện ghi rõ nhân vật chết vì sự kiện "Mãng xà ngàn năm" (khoảng 1 trong 5 lần chạy). Test giờ tự chạy lại từ đầu tối đa 3 lần và báo rõ, các lỗi khác vẫn dừng với thông báo "KHÔNG có kết quả". Lỗi nhân vật null từng gặp ở các lượt đầu nhiều khả năng cùng nguyên nhân, nhưng lần đó không có dấu vết để xác nhận.
- **Năm căn cơ lệch tuổi:** sự kiện của game cộng thẳng 5–59 năm vào tuổi mà không qua hàm năm. Năm kế căn cơ bắt kịp và chỉ tính một năm tu luyện, nay đã có test đơn vị; test giao diện chờ bắt kịp rồi mới so.

### Mô phỏng

`sim.js` chạy hàm một năm, hàm áp lựa chọn và hàm tạo nhân vật thật của bundle. 6 cấu hình, 100 kiếp mỗi cấu hình và 100 kiếp đối chứng tắt căn cơ. Mỗi cấu hình kiểm bất biến sau từng năm: chỉ số trong miền hợp lệ, thể chất có thật, việc đúc không kẹt, tới Nguyên Anh phải có đạo cơ.

| Cấu hình | ≥Kim Đan | ≥Hóa Thần | Tuổi vào Kim Đan | Tuổi thọ TB | Kim Đan Thượng trở lên |
|---|---:|---:|---:|---:|---:|
| Cân bằng | 71% (đối chứng 71%) | 33% (18%) | 43 (47) | 165 (147) | 12% |
| Ổn định | 71% (65%) | 19% (22%) | 50 (45) | 162 (147) | 54% |
| Cưỡng ép | 65% (70%) | 6% (20%) | 41 (48) | 117 (151) | 0% |
| Xoay trọng tâm | 48% (49%) | 14% (16%) | 66 (70) | 110 (126) | 39% |
| Tà đạo liều lĩnh | 74% (76%) | 11% (22%) | 30 (34) | 70 (90) | 10% |
| Luyện đan | 3% (12%) | 0% (0%) | 65 (66) | 39 (44) | 1% |

Cách đọc: 100 kiếp có sai số lớn, chênh dưới khoảng 10 điểm phần trăm chưa nói lên gì. Ở lượt 200 kiếp trước đó (thông số gần như giống), Cân bằng là 34% so với 29% ở ≥Hóa Thần, nên con số 33% so với 18% ở bảng trên nhiều khả năng là nhiễu. Cấu hình Luyện đan chết chủ yếu vì nổ lò của game gốc do không đổi trọng tâm, đối chứng cũng vậy.

**Lỗi cân bằng do mô phỏng tìm ra và đã sửa:** Cưỡng ép chậm hơn đối chứng mà còn chết sớm hơn; nội thương tự khuếch đại, chạm 100 sau khoảng 18 năm; Ổn định làm hỏng nhịp tuổi phàm nhân; đạo cơ gần như chỉ ra Trung phẩm; Luân Hồi Đạo Thể, Cửu Âm Huyền Thể và Trường Sinh Thể quá phổ biến. Sau khi sửa, tỷ lệ kiếp có thể chất đặc biệt là 10–37% tùy cấu hình (Phàm Thể 63–90%, không tính cấu hình Luyện đan); Ổn định có Cửu Âm 17%, Cân bằng có Luân Hồi 17%. Chưa rõ mức này đã đủ hiếm với người chơi thật hay chưa.

### Lỗi kiểm thử tìm ra và đã sửa

| Lỗi | Cách sửa |
|---|---|
| Có việc đúc thì mất nút Thiên phú trên HUD (E2E cũ phát hiện) | Giữ cả hai nút, thêm nút ngắn |
| Thông báo chồng 10 dòng che bảng ở tốc độ cao | Hiện tối đa 4, nội dung vẫn nằm trong nhật ký |
| Nhảy cóc qua Kim Đan: đạo cơ chờ thêm một nhịp | Đổi thứ tự xử lý |

### Chưa kiểm chứng

- **Trận đấu thời gian thực** không có trong mô phỏng (săn quái, phục kích, mini-game đỡ lôi), nên số trận thắng thấp hơn chơi thật. Hoang Cổ Thánh Thể, Bất Diệt Ma Thể và Kiếm Cốt gần như không xuất hiện, nên độ cân bằng của chúng chưa được đo. Logic thức tỉnh của chúng chỉ qua test đơn vị.
- **Đạo cơ trong game thật** được test bằng cách đặt cảnh giới rồi bấm giao diện. Đột phá thật được chạy trong mô phỏng, chưa có test giao diện cho đúng lượt đột phá đó.
- **Chiến lược chọn trong mô phỏng** là chiến lược máy, không phải người chơi. Chưa ai chơi một mạch tới Phi Thăng với căn cơ.
- **Phi thăng và cảnh giới Tiên:** rất ít kiếp mô phỏng tới Độ Kiếp, chưa có kiếp nào được xác nhận đi qua phi thăng cùng căn cơ.
- **Chưa chạy:** giao diện tiếng Anh, điện thoại thật, Safari. GĐ1 đã có trên Pages, nhưng ở đó mới xác minh tệp có mặt.

Ngày chạy: 09/11/2026 · Node 24.15 · Microsoft Edge headless · Bản dựng: `site-mod/`

## Kết quả

| Bộ kiểm thử | Kết quả | Lệnh |
|---|---:|---|
| Logic thuần | 26/26 đạt | `node --test vk2/tests/core.test.js` |
| End-to-end trong game thật | 48/48 đạt ở 2/3 lần chạy cuối (xem giới hạn) | Xem bên dưới |
| Giả lập điện thoại qua LAN | 34/34 đạt | `node vk2/tests/mobile.js` |

```powershell
python build_mod.py
python serve_mod.py          # cửa sổ khác
npm i --prefix <thư-mục-tạm> playwright-core
$env:NODE_PATH = "<thư-mục-tạm>\node_modules"
node vk2/tests/e2e.js <thư-mục-ảnh>
```

## Giả lập điện thoại qua LAN

34/34 đạt: `VK2_URL=http://<ip>:8766 node vk2/tests/mobile.js`. Chạy ở 360×640 và 390×844 với giả lập cảm ứng, truy cập qua IP Wi-Fi thật bằng HTTP. Gồm chạm mở rộng/thu gọn bảng, thanh hành động không bị che, cuộn bảng thiên phú, xoay ngang, popup sự kiện và mở lại vẫn còn nhân vật. **Chưa thử trên điện thoại thật**, nên chưa biết Wi-Fi có cho thiết bị thấy nhau không, và chưa thử Safari.

## Đã kiểm chứng trong game thật

- Năm trôi qua bằng vòng lặp gốc và được đếm đúng, không tính các năm dưới 6 tuổi.
- Thắng quái qua bảng săn của game: hook chạy đúng một lần mỗi trận.
- Hàm tốc độ tu, chỉ số chiến đấu và tỷ lệ đột phá của game đều đi qua hook.
- Nhận thưởng khi bấm đúp chỉ tính một lần, kể cả sau khi tải lại trang.
- Tải lại trang giữ tiến trình; trạng thái tài khoản được lưu riêng.
- Save cũ chưa có dữ liệu VK2 vẫn giữ nguyên nhân vật, nhiệm vụ đã qua được ghi nhận mà không phát thưởng.
- Chết, lập bia, đầu thai chạy trọn luồng gốc; kiếp mới có tiến trình riêng, sổ thiên phú còn nguyên.
- Mở bảng làm thời gian dừng. Có sự kiện thì bảng thu gọn, lựa chọn nằm trong màn hình.
- 360px không tràn ngang. Không có request nào ra backend thật; không có lỗi JS.

## Lỗi kiểm thử tìm ra và đã sửa

| Lỗi | Cách sửa |
|---|---|
| Popup sự kiện của game đè lên nhật ký | Nâng z-index của bảng VK2 |
| Bảng mục tiêu đẩy lựa chọn sự kiện khỏi màn hình | Tự thu gọn khi có sự kiện và trên màn hình nhỏ |
| Năm dưới 6 tuổi bị tính khi tuổi nhảy cóc | Chỉ đếm các năm từ 6 tuổi |
| Xoay ngang: bảng mục tiêu bóp khung cảnh còn 3px và đẩy nút ra ngoài | Đưa bảng ra lề trái ở màn hình thấp |
| Thông báo nổi trên màn hình chết và lặp lại sau khi tải trang | Bỏ qua khi đã chết, lần quét đầu chỉ ghi nhận |

## Giới hạn: chưa kiểm chứng

- **Test E2E và popup ngẫu nhiên:** lỗi chập chờn cũ do helper không nhận ra popup `position: fixed` đã được sửa. Hai lần chạy liên tiếp đều đạt, nhưng game vẫn có yếu tố ngẫu nhiên nên chưa thể coi là không bao giờ lỗi.
- **Backend:** đăng nhập, lưu đám mây, bảng xếp hạng, lôi đài đều bị chặn trong sandbox. Chưa biết server có chấp nhận trường `char.vk2` hay không.
- **Bảo mật:** toàn bộ logic chạy ở client, người chơi sửa được localStorage. Phần này chưa đạt tiêu chí nghiệm thu cho production.
- **Rút ngắn bằng chỉnh state:** kiểm thử có đẩy tuổi, cảnh giới và tu vi để tới nhanh các nhánh sau. Chưa ai chơi một mạch từ đầu tới Phi Thăng, nên chưa biết nhịp tiến triển và độ cân bằng thực tế.
- **Chưa chạy:** giao diện tiếng Anh, thiết bị di động thật, trình duyệt ngoài Edge, các chương cuối của chính tuyến trong game.
- **Nút Đi đến:** mới kiểm tra đường tới bảng săn quái. Các nút còn lại dùng cùng cơ chế nhưng chưa chạy riêng từng nút. Nhiệm vụ "Chọn đạo lộ" chỉ mở bảng thông tin nhân vật, vì đạo lộ được chọn qua sự kiện trong game.

## Đợt 09/11/2026: nhật ký và GitHub Pages

Chạy trên bản dựng `--base /bok`, máy chủ giả lập chỉ phục vụ dưới tiền tố đó, Edge headless:

| Bộ test | Kết quả |
| --- | --- |
| `vk2/tests/core.test.js` | 26/26 |
| `vk2/tests/e2e.js` | 52/52, chạy 2 lần |
| `vk2/tests/mobile.js` | 38/38 |
| `vk2/tests/pages.js` | 21/21 |

Chiều cao khung "Gia phả kiếp này" sau khi sửa: 139px ở 360x640 và 210px ở 390x844 (trước đó khoảng 64px và 174px).

Giới hạn đã biết:

- **Sprite thiếu trong bundle:** khoảng 20 đến 24 lớp ảnh nhân vật trả 404 mỗi lượt chạy. Một phần là game cố ý thử `idle.png` rồi lùi về `walk.png`, phần còn lại không có trong bản scrape (ví dụ `lpc/hairc_parted_side_bangs/walk.png`), nên một số nhân vật hiện thiếu tóc hoặc áo. Lỗi có từ bundle, không do đường dẫn.
- **Máy chủ giả lập khác Pages thật:** kết quả thật trên github.io được ghi ở `docs/PROJECT_MEMORY.md` sau khi deploy.
- **Chưa thử trên điện thoại thật;** các số liệu mobile đến từ giả lập.

## Save của chế độ khách (09/11/2026)

`vk2/tests/restart.js`, hồ sơ trình duyệt thật trên đĩa, tắt hẳn trình duyệt rồi mở lại: 7/7 trên Edge headless, bản local.

- Đóng trang bình thường: giữ nguyên tên, tuổi, nhật ký và tiến trình nhiệm vụ.
- Tắt đột ngột: nhân vật còn, nhưng mất phần sau lần lưu gần nhất (lần thử: tuổi 9 về 8).
- Chưa thử trên điện thoại thật và trên Safari.

## Site thật trên GitHub Pages (09/11/2026)

Chạy trên https://lucbo-coder.github.io/bok/play/choi/ bằng Edge headless giả lập điện thoại: `pages.js` 21/21, `mobile.js` 38/38, `restart.js` 7/7. Link gốc `/bok/` tự chuyển vào game.

Chưa thử trên điện thoại thật và trên Safari. Mục "Máy chủ giả lập khác Pages thật" ở trên đã được kiểm chứng bằng các lượt chạy này.
