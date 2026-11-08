# TEST REPORT

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
