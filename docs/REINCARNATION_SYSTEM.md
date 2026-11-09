# REINCARNATION SYSTEM

Trạng thái: luồng luân hồi của game gốc giữ nguyên. VK2 chỉ thêm các phần dưới đây, không đổi Mạnh Bà, Hồn lực, Kiếp Số, Sổ Sinh Tử hay Thiên thư.

## VK2 đã thêm

- Sổ thiên phú theo tài khoản: bậc cao nhất từng đạt của mỗi thiên phú, ghi đúng một lần mỗi kiếp khi chết.
- Khi thức tỉnh lại, người chơi có sẵn kinh nghiệm: 25% mỗi bậc cũ, tối đa 75% lượng cần để lên bậc 2. Bậc vẫn bắt đầu từ 1.
- 7 nhiệm vụ luân hồi kéo dài qua nhiều kiếp.

## Di sản xuyên kiếp (3.0-GĐ6)

Thế giới sống qua các kiếp và được tua nhanh 20–80 năm giữa hai đời. Khi chết, bí thuật, động phủ, kẻ thù và lời hứa thành món di sản trong `acct.legacy`. Đồ đệ, hậu duệ và tông môn sống tiếp như NPC của thế giới. Mỗi kiếp tìm lại tối đa 3 món, nợ nhân quả phai dần. Chi tiết ở [WORLD_SYSTEM](WORLD_SYSTEM.md).

## Chưa có

Canh Mạnh Bà, Sổ Sinh Tử và Thiên thư chưa được dùng làm điều kiện cho hệ thống mới.

## Sổ các kiếp trước

Khi một kiếp kết thúc, `recordDeath` ghi tóm tắt vào `acct.history` (chỉ thêm một lần cho mỗi kiếp). Tab Hành trình hiển thị danh sách này, mới nhất trước.

Từ 3.0-GĐ1, mỗi dòng còn ghi thể chất, số kinh mạch và phẩm đạo cơ, Kim Đan của kiếp đó (`can`). Căn cơ không truyền sang kiếp sau: mỗi kiếp xây lại từ đầu, chỉ có Luân Hồi Đạo Thể mở ra nhờ số kiếp đã trải. Cơ chế luân hồi của game không đổi.

## Nhân quả từ sự kiện động
Khi chết, dữ liệu được chia ba loại:
- Kết thúc theo kiếp: `c.vk2.su` (cờ, sự kiện đã qua, nhật ký).
- Còn trong lịch sử thế giới: chuỗi, kết cục, cờ thế giới, NPC. Chuỗi đang dở vẫn đi tiếp.
- Có thể ảnh hưởng kiếp sau: `acct.ev.traces`. Mỗi kiếp trọng lượng giảm còn 72%, dưới 8 thì mất. Uống canh Mạnh Bà (`c.tanHon`) giảm thêm một nửa.

Dấu vết chỉ mở sự kiện, không chuyển linh thạch, tu vi hay vật phẩm. Sự kiện đọc thật Phúc duyên, Nghiệp, Kiếp Số, kết cục đã mở, Thiên thư, nợ Địa phủ.
