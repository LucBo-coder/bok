# PROJECT MEMORY

## Bối cảnh

- Thư mục này là bản tải client production của Vạn Kiếp Luân Hồi, không có source gốc. Chủ dự án xác nhận là tác giả hoặc có phép và chỉ còn bundle.
- Next.js App Router + Turbopack, Supabase. Không có TypeScript, API server hay schema.

## Quy tắc khi làm tiếp

- Không sửa `site/`, `_next/`, `readable/`. Mọi thay đổi nằm trong `vk2/` và điểm vá của `build_mod.py`.
- `build_site.py` xóa và dựng lại `site/`. `build_mod.py` xóa và dựng lại `site-mod/`. Không lưu gì trong hai thư mục đó.
- Giữ sandbox khi thử: CSP `connect-src 'self'` và `guard.js`. Bundle có URL Supabase production.
- Mỗi điểm vá phải khớp đúng 1 lần, nếu không build dừng.
- Dùng `readable/chunks/*.js` để đọc code. File `readable/*.pretty.js`, `analyze*.txt`, `api-version.json` là UTF-16, grep sẽ không khớp.

## Điểm gắn đã biết (chunk `2weh91tpivddk`, component game)

| Tên minify | Ý nghĩa |
|---|---|
| `nq` | ref nhân vật, object được mutate trực tiếp |
| `F`, `E` | ref và setter của meta tài khoản |
| `nG` | ép render lại |
| `nV` | autosave |
| `tl` | mutate nhân vật rồi lưu và render |
| `eq`, `eZ` | mở panel, panel hiện tại (`hunt`, `congphap`, `shop`, `info`, `today`...) |
| `eE`, `eF` | đang chạy hay tạm dừng |
| `X.m`, `X.l`, `X.n` | lưu meta, lưu save local, lưu save đám mây |

Chunk `0pcagq3015zh_`: `nM` tốc độ tu, `nd` chỉ số chiến đấu, `nx(n,a,h)` thưởng thắng quái.

## Lệnh

```powershell
python build_mod.py
python serve_mod.py   # http://127.0.0.1:8766/choi/
node --test vk2/tests/core.test.js
```

## Xuất bản và giao diện nhật ký (09/11/2026)

- **Nguyên nhân khó đọc nhật ký:** bảng HUD của mod nằm giữa `.stage` và `.game-scroll`, lại bị `.panel` của game ghi đè padding, nên lấy mất chỗ của khung "Gia phả". HUD giờ mặc định một dòng; danh sách mở ra thì phủ lên, không đẩy nhật ký.
- **Tab Hành trình:** gom cảnh giới, đạo lộ, thời gian dành cho từng việc, mục tiêu kế tiếp, nhật ký có bộ lọc và các kiếp trước. Lịch sử kiếp lưu ở `acct.history`, tối đa 30 kiếp, ghi từ lần chết đầu tiên sau bản này.
- **Pages:** `build_mod.py --base /bok` thêm tiền tố vào mọi đường dẫn tuyệt đối trong HTML, JS và CSS. Danh sách đường dẫn nằm ở `ROUTES` và `ASSETS`; thêm route mới thì phải thêm vào đó, và `vk2/tests/pages.js` sẽ báo nếu sót.
- **Save trên Pages** nằm theo trình duyệt và theo origin `lucbo-coder.github.io`, không chung với save ở bản local.
