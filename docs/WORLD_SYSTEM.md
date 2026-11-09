# WORLD SYSTEM

Trạng thái: có trong bản 3.0 (GĐ2–GĐ6), chạy ở client sandbox, đã kiểm thử bằng test logic, test trình duyệt và mô phỏng. Chưa qua người chơi thật. Kết quả ở [TEST_REPORT](TEST_REPORT.md).

Nguyên tắc chung: mọi hệ thống dùng lại sự kiện, chỉ số và hàm năm của game gốc. Không có bản đồ riêng hay vòng lặp riêng. Sức mạnh cộng thêm của toàn bộ 3.0 đi qua một trần chung (`MOD_CAP` trong `core.js`).

## Bí cảnh và truyền thừa (`dao.js`)

- 8 loại bí cảnh, mỗi loại có điều kiện cảnh giới, độ nguy hiểm, số tầng, quái, đối thủ, bẫy, tài nguyên, boss, truyền thừa. Mỗi tầng là một sự kiện của game, tải lại trang giữa chừng vẫn đúng tầng.
- Trận trong bí cảnh là trận tự động theo lượt, cấp quái theo bí cảnh, có sàn theo tu vi người vào. Sức khỏe mang từ tầng này sang tầng sau.
- Có ba cách kết thúc: đi hết, rút lui (giữ phần lớn), thua (mất phần lớn, trọng thương).
- 6 truyền thừa theo đạo lộ, có thử thách tâm cảnh, có thể kèm lời hứa ràng buộc. 3 huyết mạch thức tỉnh được qua truyền thừa, gia tộc, hậu duệ.

## Ngộ đạo và sáng tạo công pháp (`dao.js`)

15 đạo niệm lớn theo đạo lộ, linh căn, việc làm mỗi năm. 12 công thức kết hợp cố định, có tên riêng do người chơi đặt. Mỗi bí thuật có hiệu ứng thật và nhược điểm hoặc cái giá hằng năm. Một đời sáng tạo tối đa 3 môn, cách nhau tối thiểu 25 năm, số ô vận hành có hạn.

## Luyện khí, phù lục, động phủ (`khi.js`)

- 7 nguyên liệu, nguồn: săn yêu (có trần mỗi năm), du ngoạn, bí cảnh, dược viên, tông môn, mua bằng linh thạch (giá tăng khi mua nhiều).
- 5 loại pháp bảo, 4 phẩm, thuộc tính theo nguyên liệu, độ bền, cường hóa +9 có thể thất bại, khí linh từ +6. Giữ tối đa 6, mặc theo cảnh giới. Phẩm tính từ tay nghề và seed theo năm, tải lại trang không đổi được.
- Bản mệnh từ Kim Đan, lớn theo cảnh giới, không tháo được, hỏng thì trọng thương.
- 5 loại phù: Hộ Thân và Liệt Hỏa dùng trong trận, Độn Thổ và Phá Cấm dùng trong bí cảnh, Tĩnh Tâm dùng cho đột phá.
- 3 loại đất và 7 công trình, mỗi công trình 3 cấp, cấp bị giới hạn theo cảnh giới, phí năm tự trừ. Thiếu phí thì không có thu hoạch, 5 năm liền thì xuống cấp. Có sự kiện bị dòm ngó.

Trận thời gian thực của game gốc (săn quái) chỉ nhận chỉ số, không nhận cơ chế trận (đánh thêm, hút máu, né...). Các cơ chế này chỉ có tác dụng trong trận tự động của bí cảnh và sự kiện 3.0.

## Thế giới sống (`the.js`, `acct.world`)

- Thế giới nằm trong tài khoản, nên sống qua các kiếp. Có đồng hồ năm riêng, tua nhanh 20–80 năm giữa hai kiếp. Mọi diễn biến xác định theo seed.
- NPC: 34–60 người sống, có tên, tuổi, cảnh giới, căn cốt, thiên phú, đạo lộ, tính cách, mục tiêu, tông môn, gia tộc, đạo lữ, thọ nguyên và tối đa 4 ký ức. Mỗi năm tu luyện và đột phá; mỗi năm có 3 người gặp biến cố: vào tông, kết đôi, sinh con, tranh cơ duyên, phản bội, báo thù.
- Sư đồ: bái người hơn mình, học đạo niệm và chiêu cùng đạo. Từ Kim Đan nhận đồ đệ theo số ô, truyền bí thuật, hỗ trợ đột phá, giao nhiệm vụ. Đồ đệ bị bỏ bê có thể phản bội. Sư phụ, đồ đệ chết thì hiệu ứng mất và thành vết thương tâm ma.
- Tông môn: lãnh thổ, linh mạch, kho, công pháp, ngoại giao, chiến tranh, hưng suy. Có thể bị diệt, người chơi khi đó mất chốn về. Tông của cốt truyện gốc không bị xóa khỏi thế giới. Cống hiến đổi nguyên liệu, đan, công pháp, và thăng `sectRank` thật của game. Lập tông từ Nguyên Anh, tốn 20.000 linh thạch và cần đồ đệ.
- Gia tộc: thành viên là NPC thật, gia sản, danh vọng, lãnh địa cho linh thạch, công pháp gia truyền, huyết mạch. Hậu duệ của hậu duệ vẫn được đánh dấu.
- Kẻ thù: mối thù từ bí cảnh, đồ đệ phản bội, Thiên Mệnh đều thành NPC thật, tối đa 3 người cùng lúc, có thể chặn đường, hóa giải được.

## Tâm ma, pháp tắc, đại biến (`phap.js`)

- Sổ chấp niệm 7 loại, ghi từ hành động thật, có trần. Từ tổng 25 thì tâm ma hiện hình, cách nhau tối thiểu 25 năm. Đối mặt không có xúc xắc: so con số sức đối mặt người chơi nhìn thấy với 40. Phong ấn là món nợ cho các lần đột phá sau. Thuận theo cho sức mạnh có trần và tăng tâm ma.
- 13 pháp tắc, 6 bậc, mở từ Nguyên Anh và cần đạo niệm nguồn, tu tối đa 2 cùng lúc. Mỗi pháp tắc đổi cơ chế: Không Gian rút lui chắc chắn, Sinh Tử cứu sức khỏe mỗi 30 năm, Thời Gian thêm thọ nhưng tu chậm, Nhân Quả làm kẻ thù khó tìm, Luân Hồi thêm số di sản tìm lại, Hủy Diệt tự tổn thương, Sáng Tạo thêm ô bí thuật, ngũ hành và Kiếm đổi cơ chế trận. Bậc Chứng Đạo ở đây là đỉnh của pháp tắc, độc lập với kết cục Chứng Đạo của game.
- 8 đại biến, mỗi cái 15–40 năm, cách nhau tối thiểu 70 năm, có thanh thế cuộc tự trôi. Người chơi từ Trúc Cơ được hỏi một lần cho mỗi biến cố. Kết cục đổi thật linh mạch, lãnh thổ, kho, nhân vật.

## Thiên Đạo, Thiên Mệnh, di sản (`menh.js`, `acct.legacy`)

- Sổ Thiên Đạo 8 mục, có trần, phai 0,7% mỗi năm. Nguồn: `daoTam` của game (mọi lựa chọn gốc đều đi qua đây), số trận thắng, phương pháp Cưỡng ép, cấm thuật, bí cảnh, Thiên Mệnh.
- Bảng 5 quy tắc có ngưỡng và 2 quy tắc thụ động, hiện ngay trong tab Thiên Mệnh. Không dùng xác suất để quyết định có phản ứng hay không.
- 4 Thiên Mệnh, khoảng 28% số kiếp có, mỗi cái có điều kiện, chuỗi nhiệm vụ trong bảng VK2, biến cố, thưởng, đánh đổi và kết cục lựa chọn.
- Khi chết: bí thuật, động phủ, kẻ thù, lời hứa thành món di sản (tối đa 30), đồ đệ, hậu duệ, tông môn sống tiếp trong thế giới. Động phủ có người giữ thì được kế thừa, có công trình thì thành di tích, còn lại bỏ hoang.
- Kiếp sau: mỗi đời tìm lại tối đa 3 món (thêm theo pháp tắc Luân Hồi). Bí thuật tìm lại có uy lực 0,8. Nợ nhân quả đi theo và phai dần.
- Phúc duyên, Nghiệp, Kiếp số, Hồn lực được đọc để hiển thị và tính nhân quả đầu đời. Thưởng cuối của Thiên Mệnh cộng Phúc duyên qua đúng hàm thưởng của VK2. Canh Mạnh Bà, Sổ Sinh Tử, Thiên thư không bị đổi, cũng chưa được dùng làm điều kiện.

## Sự kiện động (`su.js`, `acct.world.chains`)
Mỗi năm thế giới: NPC, tông môn, rồi `VK2Su.worldStep` tiến các chuỗi tới hạn, mở chuỗi mới (cách nhau ít nhất 18 năm, tối đa 3 chuỗi cùng lúc), chạy mạch đời NPC. Năm của nhân vật: sự kiện gấp, rồi giai đoạn chuỗi đang chờ hỏi, rồi chọn một sự kiện đơn theo trọng số nếu đủ khoảng nghỉ.

Chuỗi đi tiếp theo điểm thế cuộc `s`, sức NPC tham gia và dấu của lựa chọn, kể cả khi người chơi vắng mặt. Kết cục đặt cờ thế giới, và cờ đó mở sự kiện hậu quả ở các kiếp sau. Tai họa làm giảm linh mạch chỉ tác động một tông, không bào mòn toàn thế giới.

Mạch đời NPC: `phan_do` (bị trục xuất, vào ma đạo, thành trưởng lão, báo thù), `lap_tong` (tán tu lập tông), `an_si` (về ở ẩn, dạy một đứa trẻ).
