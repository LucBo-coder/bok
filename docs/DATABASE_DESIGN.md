# DATABASE DESIGN

**Chưa có migration nào được tạo hoặc chạy.** Không có quyền truy cập schema Supabase, và sandbox chặn mọi kết nối tới đó.

## Lưu trữ hiện tại của VK2

| Dữ liệu | Vị trí | Ghi chú |
|---|---|---|
| Tiến trình nhân vật | `char.vk2` trong save của game (`vkl.save`) | Đi theo cơ chế save có sẵn |
| Trạng thái tài khoản | localStorage `vk2.acct.guest` hoặc `vk2.acct.u.<tên>` | Không đồng bộ giữa thiết bị |
| Tùy chọn thu gọn | localStorage `vk2.hud` | Theo trình duyệt |

Dữ liệu định nghĩa nằm trong `vk2/data.js`, tách khỏi dữ liệu người chơi. Muốn gỡ mod, chỉ cần quay lại `site/`: trường `vk2` thừa trong save không ảnh hưởng vì bản gốc không đọc tới, và save cũ không bị ghi đè trường nào khác.

## Đề xuất cho bản online (chưa kiểm chứng)

Trước khi làm, cần xem schema thật và RLS hiện có. Game gốc xác thực bằng token riêng qua RPC (`p_token`), nên nhiều khả năng nên theo cùng mô hình thay vì dùng RLS theo `auth.uid()`.

```sql
-- up
create table vkl_quest_claims (
  player_id  uuid not null,
  scope_key  text not null,   -- 'life:<lifeNo>', 'account', 'day:<yyyy-mm-dd>'
  quest_id   text not null,
  claimed_at timestamptz not null default now(),
  primary key (player_id, scope_key, quest_id)
);
alter table vkl_quest_claims enable row level security;
-- Không cấp policy cho client: chỉ RPC security definer được ghi.

-- down
drop table vkl_quest_claims;
```

- Khóa chính kép chống nhận thưởng lặp ở tầng database.
- RPC `vkl_quest_claim(p_token, p_quest_id)` xác định người chơi từ token, kiểm tra điều kiện bằng dữ liệu phía server, ghi claim và cộng thưởng trong cùng transaction, dùng giờ server cho hằng ngày.
- Cần giới hạn tần suất RPC này.
- **Điểm khó:** tiến trình hiện tính ở client, nên server cần cách tự xác nhận (ví dụ từ `vkl_lives` và save). Phải thiết kế lại khi có source server.

## `acct.history` (thêm 09/11/2026)

Mảng tối đa 30 kiếp gần nhất trong state tài khoản ở localStorage, mỗi phần tử: `{ life, name, realm, layer, age, path, cause, kills, talents: [[id, lv]] }`. Save cũ không có trường này vẫn chạy; lịch sử bắt đầu từ lần chết kế tiếp.
