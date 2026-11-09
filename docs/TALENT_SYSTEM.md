# TALENT SYSTEM

Trạng thái: đã triển khai ở client sandbox. Thông số là giá trị khởi tạo, chưa cân bằng bằng chơi thật.

## Quan hệ với thiên phú gốc

Thiên phú mua bằng phúc duyên khi đầu thai của game gốc được giữ nguyên, vì chúng là lựa chọn lúc sinh ra. Thiên phú VK2 là thứ lớn lên trong kiếp, thức tỉnh từ cách người chơi sống. Hai hệ cộng dồn với nhau.

Thiên phú khác với linh căn (khả năng hấp thu linh khí) và thể chất (đặc điểm thân thể, xem [CULTIVATION_SYSTEM](CULTIVATION_SYSTEM.md)). Từ 3.0-GĐ1, phẩm chất đạo cơ, Kim Đan và Luân Hồi Đạo Thể nhân kinh nghiệm thiên phú nhận được (`insight`), từ ×0,81 tới ×1,65.

## Danh sách

| Thiên phú | Phẩm | Thức tỉnh | Đánh đổi | Nhánh |
|---|---|---|---|---|
| Kiếm Tâm Thông Minh | Huyền | Kiếm đạo, 5 trận thắng | Không | Bá Kiếm / Tĩnh Kiếm |
| Đan Tâm | Linh | Luyện đan 5 năm | Không | |
| Thiết Cốt | Phàm | 15 trận thắng | Giảm tốc độ tu | |
| Tĩnh Tâm | Linh | Tu 15 năm khi tâm ma ≤ 30 | Không | |
| Lữ Khách | Phàm | Du ngoạn 8 năm | Giảm công | |
| Ma Tâm | Huyền | Đạo tâm ≤ -30, 10 trận thắng | Giảm đột phá, tâm ma +0,2/năm | Huyết Ma / Tâm Ma Chủ |
| Hạo Nhiên Chính Khí | Linh | Đạo tâm ≥ 30, 30 tuổi | Không | |
| Thú Hữu | Linh | Có linh thú, 5 trận thắng | Không | |
| Hỗn Nguyên Thể | Thiên | Linh căn ≥ 4 hệ, Trúc Cơ | Chỉ tạp căn mở được | |
| Luân Hồi Ấn | Thiên | 5 kiếp, 20 tuổi | Giảm sinh lực | |

## Giới hạn sức mạnh

- Thức tỉnh tối đa 6 thiên phú mỗi kiếp.
- Ô vận hành: 1, thêm ở Trúc Cơ và Nguyên Anh, tối đa 3.
- Chỉ thiên phú đang vận hành mới tăng kinh nghiệm.
- Trần giảm dần `cap × (1 − e^(−x/cap))`: công, phòng, sinh lực 45%; tốc độ tu 50%; đột phá 10%.
- Phần trừ của đánh đổi không đi qua trần.

## Kinh nghiệm

Cần 100, 220, 420, 720 để lên bậc 2–5, nhân theo phẩm: Phàm ×1, Linh ×1,25, Huyền ×1,6, Thiên ×2,2. Lên bậc là thao tác của người chơi và tiêu hao kinh nghiệm. Đạo lộ hợp linh căn được nhân kinh nghiệm ×1,25.

## Linh căn

Tốc độ hấp thu vẫn do hệ số gốc của game quyết định. VK2 thêm dạng linh căn, suy ra xác định từ `linhCanMul`, `element` và `lookSeed`, nên áp dụng được cho save cũ mà không ghi đè dữ liệu.

| Hệ số | Dạng | Hiệu ứng |
|---:|---|---|
| ≥ 1,9 | Đơn | Công +6%, sinh lực -3% |
| ≥ 1,6 | Song | Công +4%, phòng +2% |
| ≥ 1,2 | Tam | Công, phòng, sinh lực +2% |
| ≥ 0,85 | Tứ | Phòng +4%, sinh lực +6%, đột phá +1% |
| < 0,85 | Ngũ hành | Phòng +6%, sinh lực +10%, đột phá +2% |

Đơn và song linh căn có xác suất 1/17 mang biến dị Lôi, Băng hoặc Phong. Đạo lộ hợp hệ được tốc độ tu +5%.

Linh căn chưa ảnh hưởng tới khắc chế ngũ hành trong trận, độ tương thích tài nguyên và khả năng lĩnh ngộ công pháp. Các phần này thuộc GĐ3 và GĐ4.
