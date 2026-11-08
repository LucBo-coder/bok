# REINCARNATION SYSTEM

Trạng thái: luồng luân hồi của game gốc giữ nguyên. VK2 mới thêm phần nhỏ dưới đây, phần còn lại thuộc GĐ5 và **chưa triển khai**.

## VK2 đã thêm

- Sổ thiên phú theo tài khoản: bậc cao nhất từng đạt của mỗi thiên phú, ghi đúng một lần mỗi kiếp khi chết.
- Khi thức tỉnh lại, người chơi có sẵn kinh nghiệm: 25% mỗi bậc cũ, tối đa 75% lượng cần để lên bậc 2. Bậc vẫn bắt đầu từ 1.
- 7 nhiệm vụ luân hồi kéo dài qua nhiều kiếp.

## Chưa có

Nhật ký các kiếp, dòng thời gian, ký ức tiền kiếp mới, thế giới biến đổi theo kiếp. Game gốc đã có bia mộ, nghĩa trang, oan gia, huyết mạch, kế thừa công pháp và Sổ Sinh Tử. GĐ5 phải đọc các phần này trước để mở rộng, không làm lại.

## Sổ các kiếp trước

Khi một kiếp kết thúc, `recordDeath` ghi tóm tắt vào `acct.history` (chỉ thêm một lần cho mỗi kiếp). Tab Hành trình hiển thị danh sách này, mới nhất trước.
