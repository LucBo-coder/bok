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
- [ ] Hiệu ứng thức tỉnh: mới có thông báo, chưa có animation riêng

## Các giai đoạn sau: chưa bắt đầu

GĐ3 tu luyện chuyên sâu · GĐ4 thế giới · GĐ5 nhân quả và luân hồi · GĐ6 cân bằng và tối ưu.

## Phạm vi hiện tại

Cập nhật 09/11/2026: bản sandbox đã chạy trên GitHub Pages tại https://lucbo-coder.github.io/bok/play/choi/ để chơi bằng điện thoại. Bản này vẫn không có backend, nên đăng nhập, lưu đám mây, bảng xếp hạng và lôi đài không hoạt động.

Chủ dự án chốt ngày 09/11/2026: chỉ chạy local trên máy tính và điện thoại, không làm backend. Vì vậy các mục phía server ở trên không còn là việc cần làm, và việc gian lận qua localStorage được chấp nhận. Sandbox giữ nguyên.

Nếu sau này muốn phát hành online: cần nối lại repo gốc (mod dựa trên 5 chuỗi minify của đúng một build) và làm RPC phía server (xem DATABASE_DESIGN.md).
