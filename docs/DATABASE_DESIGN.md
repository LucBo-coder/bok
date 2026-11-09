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

## `char.vk2.can` (thêm 09/11/2026)

Căn cơ của kiếp hiện tại, đi theo save của game: `{ v, method, year, purity, stability, dantian, open, openProg, tieu, tieuCount, dai, daiCount, injury, impurity, body: { id, xp, innate }, daoCo, kimDan, pending, failSeen, warned, closed }`. `daoCo` và `kimDan` có dạng `{ grade, score, how, remolded }`. Save chưa có trường này được tạo khi nạp, không đổi dữ liệu cũ. `acct.history` thêm trường `can: { body, open, dao, dan }`.

## `acct.history` (thêm 09/11/2026)

Mảng tối đa 30 kiếp gần nhất trong state tài khoản ở localStorage, mỗi phần tử: `{ life, name, realm, layer, age, path, cause, kills, talents: [[id, lv]] }`. Save cũ không có trường này vẫn chạy; lịch sử bắt đầu từ lần chết kế tiếp.

## Dữ liệu của các module 3.0 (thêm 09/11/2026)

Mỗi trường chỉ được tạo khi nạp nhân vật, save cũ không mất dữ liệu.

| Trường | Phạm vi | Nội dung |
|---|---|---|
| `char.vk2.dao` | Kiếp | Đạo niệm (`mastery`), bí thuật (`arts`, `active`), bí cảnh đang mở và đang đi (`open`, `run`), truyền thừa, lời hứa, huyết mạch |
| `char.vk2.khi` | Kiếp | Nguyên liệu, pháp bảo (`items`, `worn`, `natal`), phù, động phủ (`cave`) |
| `char.vk2.the` | Kiếp | Sư phụ, đồ đệ, con, gia tộc, cống hiến, tông tự lập |
| `char.vk2.phap` | Kiếp | Chấp niệm (`wounds`), pháp tắc (`laws`, `lawOn`), đối mặt, phong ấn, đại biến đã góp |
| `char.vk2.menh` | Kiếp | Sổ Thiên Đạo (`ledger`), Thiên Mệnh (`fate`), số di sản đã tìm trong kiếp |
| `acct.world` | Tài khoản | Thế giới: `seed, year, life, npcs, fallen, sects, fams, wars, log, gone, crisis`. 34–60 NPC sống |
| `acct.legacy` | Tài khoản | Di sản: `items` (tối đa 30), `debt` (tối đa 50), `seen`, `nextId` |
| `acct.mv` | Tài khoản | Bản chép Phúc duyên, Nghiệp, Kiếp số, Hồn lực từ meta của game, chỉ để đọc: `{ p, n, k, h }` |

Các trường mới không được game gốc đọc tới, nên gỡ mod vẫn an toàn như đã nêu ở trên.

## Sự kiện động (thêm 09/11/2026)
- `char.vk2.su`: `{v, done, count, tiers, cd, flags, pend, seq, j, gain, chains, resolved, soupDone?}`. Sự kiện đang chờ nằm ở `pend`, nên tải lại trang dựng lại đúng sự kiện đó. Chết thì `pend` bị xóa.
- `acct.ev`: `{v, once, flags, traces, hist, lives, chainDone, nextId, resolved}`. `traces` tối đa 40 mục, chỉ chứa chữ, tên và trọng lượng, không chứa tài nguyên.
- `acct.world`: thêm `chains` (tối đa 3 đang chạy), `chainHist` (tối đa 40), `events`, `flags` (cờ xóa sau 400 năm), `chainSeq`, `chainAt`, `chainLast`. NPC có thể có `arc` khi đang trong một mạch đời.
- Dữ liệu cũ: save chưa có `su` được tạo khi cần; chuỗi hoặc sự kiện đã bị xóa khỏi code thì được dọn, không làm kẹt.
