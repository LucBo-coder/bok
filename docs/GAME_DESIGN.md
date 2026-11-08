# GAME DESIGN — Vạn Kiếp Luân Hồi 2.0

## Nguyên tắc

Giữ nguyên game gốc và thêm vào đúng chỗ còn thiếu. Game gốc đã giàu nội dung sự kiện, nhưng người chơi thiếu mục tiêu rõ ràng và thiên phú không phát triển trong kiếp. Hai giai đoạn đầu giải quyết đúng hai việc đó.

## Vòng lặp sau nâng cấp

| Tầm | Người chơi nhìn thấy | Hệ thống |
|---|---|---|
| Ngắn hạn | 3 mục tiêu trên bảng theo dõi | Tracker, hằng ngày |
| Trung hạn | Chương truyện, chuẩn bị đột phá, thăng bậc thiên phú | Chính tuyến, nhiệm vụ cảnh giới, thiên phú |
| Dài hạn | Nhiệm vụ qua nhiều kiếp, sổ thiên phú | Nhiệm vụ luân hồi |

## Quyết định người chơi mới phải đưa ra

- Thiên phú nào được vận hành khi ô có hạn, vì chỉ thiên phú đang vận hành mới tăng kinh nghiệm.
- Chọn nhánh tiến hóa không đổi lại được.
- Đánh đổi của thiên phú, ví dụ Ma Tâm mạnh nhanh nhưng nuôi tâm ma và khó đột phá.
- Nên đột phá ngay hay dành thời gian làm nhiệm vụ chuẩn bị để tăng tỷ lệ.

## Kiến trúc mod

```
site/ (bản gốc, không sửa)
  └─ build_mod.py ─ 5 điểm vá + chèn script ─▶ site-mod/
vk2/data.js   dữ liệu định nghĩa
vk2/core.js   logic thuần, không chạm DOM
vk2/ui.js     cầu nối game và giao diện
vk2/guard.js  chặn mạng trong sandbox
```

Lỗi trong mod được bắt lại và trả giá trị trung tính, để không làm hỏng game gốc.

## Liên quan

[QUEST_SYSTEM](QUEST_SYSTEM.md) · [TALENT_SYSTEM](TALENT_SYSTEM.md) · [CULTIVATION_SYSTEM](CULTIVATION_SYSTEM.md) · [REINCARNATION_SYSTEM](REINCARNATION_SYSTEM.md) · [WORLD_SYSTEM](WORLD_SYSTEM.md) · [DATABASE_DESIGN](DATABASE_DESIGN.md)
