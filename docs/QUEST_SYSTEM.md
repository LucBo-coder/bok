# QUEST SYSTEM

Trạng thái: đã triển khai ở client sandbox. Code: `vk2/data.js`, `vk2/core.js`, `vk2/ui.js`.

## Nhóm nhiệm vụ

| Nhóm | Số lượng | Phạm vi | Thưởng |
|---|---:|---|---|
| Chính tuyến | 19 | Nhân vật | Linh thạch, chỉ số, tu vi theo số năm |
| Chuẩn bị đột phá | 18 (3 mỗi cảnh giới) | Nhân vật | +2% tỷ lệ đột phá kế tiếp |
| Căn cơ | 8 | Nhân vật | Linh thạch, chỉ số |
| Thiên phú | Theo thiên phú đang vận hành | Nhân vật | Lên bậc |
| Hằng ngày | 3/ngày từ 6 việc | Tài khoản | Linh thạch theo cảnh giới, kinh nghiệm thiên phú |
| Luân hồi | 7 | Tài khoản | Phúc duyên, một lần |

Nhiệm vụ ngày và 16 thành tựu của game gốc được giữ nguyên ở bảng riêng. Nhật ký có nút mở bảng đó thay vì làm lại.

## Trạng thái

`locked → active → complete → claimed`. Nhiệm vụ chuẩn bị của cảnh giới đã qua không còn được hiển thị.

## Dữ liệu tiến trình

Tiến trình đọc từ trạng thái game thật qua `metric()`, gồm hai loại:

- **Chỉ số trạng thái:** cảnh giới, tầng, linh thạch, tâm cảnh... Không thể cộng trùng vì được đọc trực tiếp.
- **Bộ đếm hành vi:** số năm theo từng trọng tâm và số trận thắng. Năm được tính theo độ chênh tuổi, trận thắng lấy từ hook hàm thưởng của game.

## Chống nhận thưởng lặp

`claim()` tính lại trạng thái, đánh dấu đã nhận rồi mới phát thưởng. Thưởng phúc duyên chỉ có ở nhóm tài khoản, nên không thể cày bằng cách tự sát để chơi lại.

**Giới hạn:** cơ chế này chỉ chống lỗi và bấm đúp. Người chơi sửa localStorage vẫn gian lận được cho tới khi có RPC phía server.

## Save cũ

Lần đầu gặp nhân vật chưa có `vk2`, nhiệm vụ chính tuyến đã đạt được đánh dấu `legacy`: coi như xong, không phát thưởng. Nhân vật đang ở tuổi 0 thì bắt đầu bình thường.

## Giao diện

- Bảng theo dõi nằm trong luồng trang dưới sân khấu, không phủ lên nhân vật.
- Thứ tự: ghim, chờ nhận thưởng, rồi chính tuyến, thiên phú, cảnh giới, hằng ngày, luân hồi.
- Mở nhật ký thì thời gian game dừng, đóng thì khôi phục trạng thái chạy trước đó.
