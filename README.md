# Vạn Kiếp Luân Hồi — bản sao client

- **Nguồn:** https://van-kiep-luan-hoi.vercel.app/
- **Ngày thu thập:** 09/11/2026
- **Nội dung:** toàn bộ phần client công khai (HTML, JS, CSS, hình ảnh, dữ liệu i18n) và một bản mirror chạy được offline.

## Bản nâng cấp 2.0 (sandbox)

```powershell
python build_mod.py
python serve_mod.py
```

Mở http://127.0.0.1:8766/choi/. Muốn chơi trên điện thoại cùng Wi-Fi, chạy `python serve_mod.py --lan` rồi mở địa chỉ `192.168.x.x` được in ra. Máy tính phải bật trong lúc chơi, và save trên mỗi thiết bị là riêng. Bản này thêm hệ nhiệm vụ, thiên phú và linh căn, chạy tách khỏi `site/` gốc và chặn mọi kết nối tới backend thật. Trạng thái và giới hạn xem [docs/TASKS.md](docs/TASKS.md) và [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## Tóm tắt

Đã tải **1.108 tệp asset** (~6,67 MB), gồm:

| Nhóm | Số tệp | Dung lượng |
|---|---:|---:|
| Next.js chunks + CSS | 34 | 3,16 MB |
| Background (`bg/`) | 41 | 366 KB |
| Icon (`icons/`) | 305 | 125 KB |
| LPC sprite sheets (`lpc/`) | 721 | 1,79 MB |
| Pixel asset khác (`px/`) | 1 | 1 KB |
| Tệp gốc khác (i18n, og, icon, robots, sitemap) | 6 | 1,23 MB |
| **Tổng** | **1.108** | **6,67 MB** |

Ngoài ra có 14 trang HTML đã lưu, bản dịch **8.556 cặp chuỗi**, 34 chunk đã được prettify, và mirror tĩnh tại `site/`.

## Quan trọng: đây không phải source gốc

Trang đang chạy là bản **production build** của Next.js. Những gì tải được là:

- ✅ Toàn bộ JavaScript/CSS mà trình duyệt nhận (đã minify).
- ✅ Toàn bộ hình ảnh, sprite, background, icon, dữ liệu i18n.
- ✅ Toàn bộ HTML server-rendered của 14 route.

Không thể tải được:

- ❌ Source TypeScript/React gốc (`app/`, `components/`, `lib/`…).
- ❌ Source map (`.js.map`) — Vercel trả **HTTP 403**.
- ❌ Code server/API (`/api/version`, `/api/broadcast`, `/api/loi-dai`…).
- ❌ Schema, dữ liệu và khóa service-role của Supabase.
- ❌ Nội dung động như bảng xếp hạng, lời đài, broadcast (cần server trực tuyến).

Nói cách khác: **đã lấy 100% client production, nhưng không phải 100% source code dự án**. Muốn có source gốc phải được tác giả cung cấp hoặc truy cập repository.

## Cấu trúc thư mục

```
van-kiep-source/
├─ site/                         # Mirror tĩnh, chạy được bằng serve.py
│  ├─ index.html                 # Trang chủ "/"
│  ├─ choi/index.html            # Game "/choi"
│  ├─ bang-xep-hang/index.html   # Bảng xếp hạng
│  ├─ loi-dai/ cap-nhat/ gop-y/ nghia-trang/
│  ├─ tang-kiep-cac/ moi-tra/ tac-gia/ chinh-sach/
│  ├─ dang-nhap/ dieu-khoan/ so-sinh-tu/
│  ├─ _next/                     # JS/CSS dùng bởi mirror
│  ├─ bg/ icons/ lpc/ px/        # Asset dùng bởi mirror
│  └─ i18n-dict.json, og.png, icon.png, ...
│
├─ _next/static/immutable/       # 33 file JS + 1 file CSS gốc
├─ bg/                           # 41 background
├─ icons/                        # 305 icon
├─ lpc/                          # 721 sprite sheet
│  ├─ <tên layer>/               # 153 layer, 663 file animation (walk/idle/slash/…)
│  ├─ beasts/                    # 26 beast sheet
│  └─ pets/                      # 32 pet sheet
├─ px/                           # 1 pixel asset
│
├─ readable/
│  ├─ chunks/                    # 34 chunk đã prettify
│  ├─ 0pcagq3015zh_.pretty.js    # Chunk game chính (3,56 MB)
│  └─ i18n-dict.pretty.json      # Từ điển đã format
│
├─ *.html                        # 14 trang gốc tải từ site
├─ i18n-dict.json                # 8.556 cặp chuỗi gốc
├─ assets_manifest.json          # Danh sách 1.108 asset + kích thước
├─ scrape.py                     # Script crawl trang
├─ download_assets.py            # Script tải asset (đợt 1)
├─ download_assets2.py           # Script tải asset (đợt 2)
├─ build_site.py                 # Tạo lại site/ và serve.py
├─ serve.py                      # Server tĩnh + stub /api/version
└─ *.txt                         # Log phân tích/crawl
```

## Cách chạy

Yêu cầu: Python 3. Không cần cài thêm thư viện.

```powershell
cd "C:\Users\pc\Documents\Default Project\van-kiep-source"
python serve.py
```

Sau đó mở:

- Trang chủ: http://127.0.0.1:8765/
- Chơi game: http://127.0.0.1:8765/choi/

Nếu cổng 8765 đang bận:

```powershell
$env:PORT = "8790"
python serve.py
```

rồi mở `http://127.0.0.1:8790/choi/`.

> Không mở trực tiếp `site/choi/index.html` bằng `file://`. Game dùng đường dẫn tuyệt đối `/_next/...`, nên cần server tĩnh để phục vụ đúng thư mục gốc.

## Đã kiểm tra

- Trang chủ và `/choi/` hiển thị đúng, không lỗi console.
- Tạo nhân vật ngẫu nhiên thành công.
- Bấm **Đầu thai** vào được vòng chơi (tuổi 0).
- Hộp thoại phiên bản hoạt động nhờ `serve.py` giả lập `/api/version`.

## Chạy offline được gì?

**Hoạt động:** giao diện, tạo nhân vật, vòng chơi, lưu tiến trình bằng `localStorage`, toàn bộ hình ảnh và chuỗi dịch.

**Cần mạng/server:** đăng nhập, bảng xếp hạng, lời đài, broadcast, một số RPC Supabase. Mirror trả 404 cho các `/api/*` khác ngoài `/api/version`.

## Ghi chú kỹ thuật

- Next.js App Router + Turbopack; chunk nằm dưới `/_next/static/immutable/chunks/`.
- Chunk game chính `0pcagq3015zh_.js` ~1,09 MB (3,56 MB sau khi prettify) chứa phần lớn dữ liệu và logic game.
- `0dr7ab43jf4xx.js` xử lý render nhân vật theo lớp LPC.
- `i18n-dict.json` là mảng 8.556 mục, mỗi mục gồm chuỗi tiếng Việt và tiếng Anh.
- Bundle có tham chiếu Supabase (URL + publishable key công khai) và các RPC `vkl_track`, `vkl_titles_char`.
- `api-version.json` lưu phản hồi thật của `/api/version`: hash `34be145195c489cf3c9c6209841f479843348b00`.

## Chạy trên GitHub Pages

Chơi tại https://lucbo-coder.github.io/bok/play/choi/ (cả máy tính và điện thoại).

Pages đang lấy từ thư mục gốc của nhánh `main`, nên bản đã dựng được commit vào `play/`. **Sau khi sửa `vk2/` hoặc `site/`, phải dựng lại rồi commit `play/`**, nếu không site sẽ không đổi. Workflow `check.yml` báo lỗi nếu quên.

```bash
python build_mod.py --base /bok/play --out play   # Git Bash: thêm MSYS_NO_PATHCONV=1 phía trước
```

Bản này vẫn giữ sandbox: chơi ở chế độ khách, save nằm trong trình duyệt của từng thiết bị. Đăng nhập, lưu đám mây, bảng xếp hạng và lôi đài không hoạt động.

## Bản quyền

Mã client, cốt truyện, nhân vật và hình ảnh thuộc về tác giả game Vạn Kiếp Luân Hồi và các tác giả asset gốc (một phần sprite theo phong cách LPC). Chủ dự án xác nhận có quyền với game này và là người quyết định phát hành bản Pages. Ghi công tác giả asset nằm ở trang `/tac-gia/`, cần giữ khi phát hành.
