# CULTIVATION SYSTEM

Trạng thái: căn cơ (3.0-GĐ1) đã triển khai ở client sandbox trong `vk2/can.js`. Thông số được chỉnh theo mô phỏng trên logic game thật, chưa qua người chơi thật. Lôi kiếp nhiều giai đoạn, Nguyên Anh xuất khiếu và tâm ma dạng lựa chọn **chưa làm** (3.0-GĐ5).

## Hiện có trong game gốc

- Cảnh giới: Phàm Nhân, Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Hóa Thần, Luyện Hư, Độ Kiếp; sau phi thăng có Chân Tiên, Huyền Tiên, Kim Tiên, Đại La Kim Tiên.
- Tốc độ tu (`nM`) phụ thuộc cảnh giới, linh căn, ngộ tính, đạo lộ, trang bị, tâm ma và các hệ số khác.
- Tỷ lệ đột phá được kẹp trong 8–90%.
- Đạo lộ gốc: Kiếm, Đan, Trận, Phật, Ma, Yêu.
- Tâm ma từ 100 có thể dẫn tới tẩu hỏa nhập ma; sức khỏe về 0 thì chết. Căn cơ đi qua các luồng này, không tạo cách chết mới.

Bảng cảnh giới của game gốc được giữ nguyên.

## Điểm vá

| Điểm vá | Tác dụng |
|---|---|
| `nM` | Nhân tốc độ tu với hệ số thiên phú, linh căn và căn cơ |
| Công thức đột phá | Cộng tỷ lệ từ thiên phú, nhiệm vụ chuẩn bị và căn cơ, vẫn trong khoảng kẹp của game |
| `nd` (chỉ số chiến đấu) | Nhân công, phòng, sinh lực |
| `nP` (một năm của game) | Gọi `onYear` đúng một lần mỗi năm, kể cả trong bế quan |
| `nW` (tỷ lệ đột phá) | Bắt hàm kiểm tra thiên tượng, dùng khi đúc |
| `bind` | Thêm tham chiếu `game` tới API của bundle, dùng cho mô phỏng |

## Ba hệ tách biệt

- **Linh căn:** khả năng hấp thu linh khí. Không đổi trong kiếp.
- **Thể chất:** đặc điểm của thân thể, mỗi kiếp một loại, bẩm sinh hoặc thức tỉnh.
- **Thiên phú:** năng lực lớn lên theo hành vi, xem [TALENT_SYSTEM](TALENT_SYSTEM.md).

## Tu luyện nội tại

Chỉ chạy trong năm có trọng tâm Tu luyện hoặc bế quan, từ 6 tuổi. Năm khác thì nội thương giảm 2, riêng Luyện đan giảm thêm 1 tạp chất.

| | Ổn định | Cân bằng | Cưỡng ép |
|---|---:|---:|---:|
| Tốc độ tu | ×0,83 | ×1 | ×1,3 |
| Tiến độ tiểu chu thiên mỗi năm | 34 | 28 | 22 |
| Tiến độ xung mạch mỗi năm | 11 | 14 | 20 |
| An toàn khi xung mạch | +20% | 0 | -15% |
| Tinh thuần mỗi năm | +0,5 | +0,3 | +0,1 |
| Ổn định kinh mạch mỗi năm | +0,5 | +0,1 | -0,4 |
| Tạp chất mỗi năm | -0,5 | +0,1 | +0,5 |
| Nội thương mỗi năm | -1,5 | -0,8 | +0,45 |
| Sự cố chân khí mỗi năm | Không | Không | Từ 3%, tăng theo nội thương |

Phàm nhân chưa có chân khí nên phương pháp chỉ có tác dụng từ Luyện Khí, trước đó luôn tính là Cân bằng. Các tiến độ nhân với hệ số ngộ tính 0,7–1,3.

- **Tiểu chu thiên:** đủ 100 thì tinh thuần +1,2, đan điền +0,6.
- **Đại chu thiên:** mở khi có 6 kinh mạch; đủ 100 thì tinh thuần +3, đan điền +2, ổn định +2.
- **Xung mạch:** mạch thứ n cần `40 + 15n` tiến độ. Tỷ lệ `0,55 + (ổn định - 50)/100 + an toàn`, kẹp 20–97%. Thất bại mất nửa tiến độ, nội thương +8.
- **Trần kinh mạch:** Phàm Nhân 3, Luyện Khí 8, Trúc Cơ 12, sau đó +2 mỗi cảnh giới cộng tiềm năng, tối đa 20.
- **Nội thương:** từ 40 thì tâm ma +0,25 mỗi năm; từ 70 thì tâm ma +1, sức khỏe -2 mỗi năm.
- **Hiệu ứng:** kinh mạch tăng tốc tu và phòng, tinh thuần tăng công và đột phá, đan điền tăng sinh lực, ổn định lệch khỏi 50 tăng hoặc giảm đột phá. Tất cả đi chung trần giảm dần với thiên phú. Nội thương và tạp chất giảm tốc độ tu (không dưới ×0,7 và ×0,85) và giảm đột phá.

May rủi lấy từ hash của `lookSeed`, năm và loại việc, nên tải lại trang không đổi được kết quả.

## Đạo cơ và Kim Đan

Vào Trúc Cơ hoặc Kim Đan thì HUD hiện nút, người chơi có 3 năm để chọn cách đúc. Quá hạn thì tự thành theo tự nhiên, game không bao giờ bị chặn. Nhảy cóc qua cảnh giới thì đạo cơ tự thành ngay.

```
đạo cơ  = tinh thuần×0,6 + ổn định×0,25 + công pháp×0,15 + tâm cảnh×0,2 + thiên tượng - phạt + cách đúc
Kim Đan = điểm đạo cơ×0,4 + tinh thuần×0,2 + (100-tạp chất)×0,1 + tâm cảnh×0,1 + ổn định×0,1 + công pháp×0,1 + thiên tượng - phạt + cách đúc
phạt    = nội thương×0,12 + tạp chất×0,1
```

Công pháp tính 2 bộ là đầy điểm. Thiên tượng: Linh khí +6, Lôi vân +4, Cát tinh +3, Phật quang +3, Huyết nguyệt +6 với tà và -3 với chính.

| Cách đúc | Giá đạo cơ / Kim Đan | Điểm |
|---|---:|---:|
| Thuận theo tự nhiên | Miễn phí | 0 |
| Bày trận linh thạch | 300 / 1.200 linh thạch | +12 |
| Dùng một viên đan | 1 viên bất kỳ | +8 |
| Cưỡng đúc | Nội thương +14 | -10 tới +20 |

| Phẩm | Mốc đạo cơ | Hiệu ứng đạo cơ | Mốc Kim Đan | Hiệu ứng Kim Đan |
|---|---:|---|---:|---|
| Hạ | Dưới 30 | Sinh lực -3%, đột phá -1%, lĩnh ngộ ×0,9 | Dưới 35 | Công -3%, tu -2%, lĩnh ngộ ×0,9 |
| Trung | 30 | Không đổi | 35 | Không đổi |
| Thượng | 52 | Sinh lực +5%, đột phá +1%, lĩnh ngộ ×1,05 | 55 | Công +6%, tu +3%, lĩnh ngộ ×1,1 |
| Tuyệt | 72 | Sinh lực +8%, phòng +3%, đột phá +2%, lĩnh ngộ ×1,1 | 75 | Công +10%, tu +5%, đột phá +1%, lĩnh ngộ ×1,2 |

Lĩnh ngộ nhân kinh nghiệm thiên phú. Phẩm chất còn đổi trần kinh mạch và đan điền, tức tiềm năng.

**Cải tạo:** đạo cơ từ Nguyên Anh (3.000 linh thạch), Kim Đan từ Hóa Thần (8.000 linh thạch). Tăng một phẩm, nội thương +15, tâm ma +10, mỗi loại một lần mỗi kiếp.

## Thể chất

Mỗi kiếp một thể chất, có rồi thì không thức tỉnh thêm. Đa số sinh ra là Phàm Thể (khoảng 95%). Ưu điểm nhân ×0,6 / ×0,8 / ×1 theo 3 giai đoạn, nhược điểm giữ nguyên ngay từ đầu. Đủ điều kiện vẫn phải "có duyên", và duyên được định từ lúc sinh.

| Thể chất | Phẩm | Có được khi | Duyên | Ưu điểm tối đa | Nhược điểm | Phát triển bằng |
|---|---|---|---:|---|---|---|
| Tiên Thiên Đạo Thể | Thiên | Chỉ bẩm sinh (0,5%) | | Tu +12%, đột phá +3% | Thương ×2, tạp chất ×1,5 | Tu Ổn định |
| Hỗn Độn Thể | Thiên | Ngũ hành tạp căn, Kim Đan | 30% | Công, phòng, sinh lực +6% | Tu -8%, khai mạch ×1,4 | Tu luyện, chiến đấu |
| Cửu Âm Huyền Thể | Huyền | Có hệ Thủy, tu Ổn định 20 năm | 20% | Tu +6%, phòng +3%, đột phá +2% | Sinh lực -7% | Tu Ổn định |
| Chí Dương Thần Thể | Huyền | Có hệ Hỏa, luyện đan 8 năm | 25% | Công +10%, tu +3% | Phòng -3%, tâm ma +0,2/năm | Luyện đan, chiến đấu |
| Hoang Cổ Thánh Thể | Thiên | 40 trận thắng, Trúc Cơ | 40% | Sinh lực +16%, phòng +12% | Tu -12% | Chiến đấu |
| Bất Diệt Ma Thể | Thiên | Đạo tâm ≤ -30, 30 trận, Kim Đan | 40% | Sinh lực +14%, công +6%, lành thương ×2 | Đột phá -3%, tâm ma +0,3/năm | Chiến đấu, tu Cưỡng ép |
| Kiếm Cốt | Huyền | Kiếm đạo, 15 trận bằng kiếm | 40% | Công +12% | Phòng -5% | Chiến đấu bằng kiếm |
| Vạn Độc Chi Thể | Huyền | Luyện đan 15 năm | 30% | Công, phòng +5%, miễn tạp chất | Sinh lực -8% | Luyện đan |
| Trường Sinh Thể | Huyền | 120 tuổi, tâm ma ≤ 30 | 12% | Sinh lực +6%, thọ +15% một lần | Công -8%, tu -5% | Tu Ổn định |
| Luân Hồi Đạo Thể | Thiên | 20 kiếp, kiếp này 40 tuổi | 15% | Tu +5%, lĩnh ngộ ×1,25 | Sinh lực -8% | Du ngoạn, tu luyện |

Ngoài ra Trường Sinh Thể (1%) và các thể chất theo hệ Cửu Âm, Chí Dương, Kiếm Cốt (1,5%, theo linh căn), Hỗn Độn (2%, chỉ ngũ hành tạp căn) có thể bẩm sinh.

## Đan dược điều dưỡng

Trong tab Căn Cơ: Hồi Xuân Đan giảm 25 nội thương, Thanh Tâm Đan giảm 15 tạp chất, Tụ Khí Đan thêm 25 tiến độ xung mạch.

## Nhiệm vụ

8 nhiệm vụ nhóm "Căn cơ", phạm vi nhân vật, xem `QUESTS` trong `vk2/can.js`. Save cũ: căn cơ được ước lượng theo số năm đã tu, đạo cơ và Kim Đan mặc định Trung phẩm (không có hiệu ứng), nhiệm vụ đã đạt đánh dấu `legacy` và không phát thưởng.
