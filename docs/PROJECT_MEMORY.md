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

Export của `O` trong chunk `2weh91tpivddk`: `O.f` một năm (`nP`), `O.x` áp lựa chọn sự kiện, `O.v` dựng ctx, `O.n(meta, talents)` tạo nhân vật. Mod truy cập qua `bridge.game`. Sự kiện đột phá có id `__dot_pha`, lựa chọn nghiêng chính đạo thường là "Củng cố" (hoãn).

## Lệnh

```powershell
python build_mod.py   # Git Bash trên Windows: thêm PYTHONIOENCODING=utf-8, nếu không dòng in cuối sẽ báo lỗi mã hóa dù bản dựng đã xong
python serve_mod.py   # http://127.0.0.1:8766/choi/
node --test vk2/tests/core.test.js vk2/tests/can.test.js vk2/tests/dao.test.js vk2/tests/khi.test.js vk2/tests/the.test.js vk2/tests/phap.test.js vk2/tests/menh.test.js
node vk2/tests/v3_e2e.js    # Các hệ thống 3.0 trong game thật, cần server và playwright-core
node vk2/tests/sim.js 100   # Mô phỏng trên logic game thật, cần server và playwright-core
```

## Căn cơ (3.0-GĐ1, 09/11/2026)

- Logic nằm ở `vk2/can.js`, nạp sau `core.js`. `core.js` gọi qua `root.VK2Can?.`, nên `core.test.js` vẫn chạy được khi không nạp module này.
- Trạng thái ở `char.vk2.can`. Xử lý năm ở `onYear` (đúng một lần mỗi năm), việc theo nhịp ở `tick` (đột phá, thất bại, thức tỉnh).
- Tạo nhân vật thẳng ở cảnh giới cao khi test sẽ bị coi là save cũ (`age >= 1` lúc `ensure`). Dùng helper `fresh()` trong `can.test.js`.
- **Muốn đổi thông số thì chạy lại `sim.js`** và so với đối chứng, đừng chỉnh theo cảm giác. Chênh dưới khoảng 10 điểm phần trăm ở 100 kiếp là nhiễu.

## Xuất bản và giao diện nhật ký (09/11/2026)

- **Nguyên nhân khó đọc nhật ký:** bảng HUD của mod nằm giữa `.stage` và `.game-scroll`, lại bị `.panel` của game ghi đè padding, nên lấy mất chỗ của khung "Gia phả". HUD giờ mặc định một dòng; danh sách mở ra thì phủ lên, không đẩy nhật ký.
- **Tab Hành trình:** gom cảnh giới, đạo lộ, thời gian dành cho từng việc, mục tiêu kế tiếp, nhật ký có bộ lọc và các kiếp trước. Lịch sử kiếp lưu ở `acct.history`, tối đa 30 kiếp, ghi từ lần chết đầu tiên sau bản này.
- **Pages:** `build_mod.py --base /bok` thêm tiền tố vào mọi đường dẫn tuyệt đối trong HTML, JS và CSS. Danh sách đường dẫn nằm ở `ROUTES` và `ASSETS`; thêm route mới thì phải thêm vào đó, và `vk2/tests/pages.js` sẽ báo nếu sót.
- **Save trên Pages** nằm theo trình duyệt và theo origin `lucbo-coder.github.io`, không chung với save ở bản local.

## Save chế độ khách (09/11/2026)

Save nằm trong localStorage (`vkl.save`, `vkl.meta`, `vk2.acct.guest`). Game tự lưu khi trang bị ẩn hoặc đóng. Mod gọi `navigator.storage.persist()` lúc khởi động để giảm khả năng trình duyệt tự xóa, nhưng trình duyệt có thể từ chối. Xóa dữ liệu duyệt web hoặc dùng tab ẩn danh thì mất save, và chưa có chức năng sao lưu ra file.

## Cách site được đăng (09/11/2026)

Pages đang ở chế độ deploy từ gốc nhánh `main`, nên bản dựng được commit vào `play/` với `--base /bok/play`. Sau mỗi thay đổi ở `vk2/` hoặc `site/` phải chạy `python build_mod.py --base /bok/play --out play` rồi commit; `check.yml` báo lỗi nếu quên. `404.html` ở gốc chuyển mọi đường dẫn lạ vào game. Bản chạy local vẫn dựng vào `site-mod/`, không có tiền tố.

## Module 3.0 (09/11/2026)

- `build_mod.py` có 12 điểm vá và `MODULES = ("dao", "khi", "the", "phap", "menh", "su", "su_tale", "su_tale2", "su_chain")`. Thêm module thì thêm tên vào đây.
- `TEXT_EDITS` đổi lời giới thiệu trên trang, thay trong HTML, chunk và `i18n-dict.json`, và dừng build nếu không tìm thấy chuỗi gốc.
- **Viết module:** gọi `C.register(api)`. Có thể cung cấp `ensure, onYear, tick, fx, duel, insight, metric, QUESTS + kind, onBump, urgentEvent, nextEvent, chain, eventDef, onDeath, applyReward, summary, breakExtra, cultFactor`.
- **Viết sự kiện:** id bắt đầu `vk2_`, định nghĩa `{ id, title, text: () => str, choices: (c, seed) => [{ label, hint, lean, off?, run: (n, e) => str }] }`. Phải dựng lại được từ `eventDef` chỉ với nhân vật và tài khoản, vì người chơi có thể tải lại trang khi sự kiện đang mở. Các sự kiện `nextEvent` cách nhau tối thiểu `EVENT_GAP` 4 năm (`v.evAt`).
- **Sức mạnh cộng thêm** phải đi qua `fx`, tổng bị kẹp bởi `C.MOD_CAP` trong `totals`. Đừng cộng thẳng vào chỉ số.
- **Cấp chiến đấu:** chênh một cấp đổi kết quả rất mạnh (đo: thắng 85% ở cùng cấp, 10% ở +2). Quái của mod phải tính từ `combatLevel`, không đoán con số.
- `fx` không nhận `acct`, nên hiệu ứng từ thế giới được `refresh` chép vào nhân vật (`h.fx`).
- Cơ chế `duel` có tác dụng ở cả trận tự động của mod (`C.duel`) và trận thời gian thực (`fightFoe`, `fightExtra`, `fightHit`, `fightGuard` trong `core.js`, gọi từ bản vá `n7`, `n8`). Trạng thái mỗi trận nằm ở `f.vk2`.
- Thay đổi thọ nguyên phải cộng cả `lifeExtra`: game kẹp `lifespan` mỗi năm, phần chỉ cộng vào `lifespan` sẽ mất.
- Mọi `c.sect` đều phải có phe: tông của game do game tự quyết, tông của mod trả qua hook `sectLean`.
- **Khi kiểm thử giao diện:** nút lựa chọn của game có trạng thái `arming` ngay khi popup vừa hiện, cú bấm lúc đó có thể bị bỏ qua. Test phải chờ kết quả của lựa chọn, không chờ việc thấy sự kiện.
- Git Bash đổi `/bok/play` thành đường dẫn Windows: thêm `MSYS_NO_PATHCONV=1` khi chạy build, nếu không build dừng ở kiểm tra `--base`.
- **Ngôn ngữ trên site tĩnh:** không có server đọc cookie `vkl_lang`, nên HTML luôn là tiếng Việt và client tự đổi chữ. Lỗi hydrate #418 trong console khi mở bằng tiếng Anh là chuyện đã biết. `lang.js` bỏ qua đúng lỗi này và báo mọi lỗi khác. Nút chọn ngôn ngữ là `.lang-seg button`, có `role="radio"`.

## Hệ thống sự kiện động (`vk2/su*.js`)
- `su.js` là bộ máy: registry, lập lịch, resolver, chuỗi trong thế giới, mạch đời NPC, nhân quả, nhật ký. `su_tale.js`, `su_tale2.js` là sự kiện đơn và chuỗi, `su_chain.js` là chuỗi và mạch NPC.
- Thêm sự kiện: `Su.define([{id,g,tier,when,t,x,c:[{l,r,fx,lean}],who?}])`. Khóa lạ trong `when` hoặc `fx` làm nạp lỗi ngay, không âm thầm bỏ qua.
- Thêm chuỗi: `Su.defineChain([{id,g,tier,w,n,roles,sect?,stages}])`. Mỗi giai đoạn có `id,n,log,dur`, tùy chọn `ev` (hỏi người chơi), `br` (nhánh), `wfx` (hậu quả thế giới), `end`. Cần ít nhất 2 kết cục.
- `c.cosmos` của game là chuỗi `"tien"`, `"hu"`, `"ma"`, không phải boolean. Đặt `true` làm vòng năm đứng yên.
- `acct.mv` và `acct.lore` chỉ được đồng bộ trong game thật (`syncMeta`), mô phỏng trình duyệt không có. Vì vậy sự kiện theo Phúc duyên, Nghiệp, Kiếp Số, kết cục, Thiên thư được kiểm ở `su.test.js`.
- Thiên tượng theo ngày thật, nên một lượt `sim.js` chỉ gặp thiên tượng của hôm đó.
- Tài khoản giờ được lưu cả khi `pagehide`, cùng lúc game lưu nhân vật. Trước đó có thể lệch tới 5 giây.

## Lớp đồ họa (`vk2/fx.js`, `vk2/gfx.css`)
- Hai canvas độ phân giải 1/3 chèn vào `.scene`. `mount()` giữ canvas sau ngay trước `.sprite-wrap` và canvas trước ở cuối, vì game chèn ảnh nền mới khi đổi cảnh.
- `VK2Fx.debug` ghi đè `hour, omen, focus, realm, path, cosmos, atm` để chụp ảnh từng cảnh. `vk2/tests/gfx.js` xuất ảnh, và phải xem ảnh bằng mắt: test tự động không phát hiện được cảnh bị bạc màu.
- Khung sprite cao hơn nhân vật: đầu khoảng 36%, chân khoảng 83% chiều cao khung.
- Mọi CSS nằm dưới `html.vk2g-on`, nên mức Tắt trả về đúng hình gốc.
- Trong khi đồ họa bật, `VK2Can.omenIs` có dữ liệu từ năm đầu tiên nhờ điểm vá `nP`.
- Trận chiến đọc từ DOM: `.dmg.p` là đòn của người chơi (trúng quái), `.dmg.m` là đòn của quái (trúng người chơi), chữ không bắt đầu bằng `-số` thì bỏ qua.
- Game có thể ghi đè `className` của `.scene`, nên các lớp `vk2g-*` được đặt lại ở mỗi lượt đọc, không chỉ khi trạng thái đổi.
- Màn đầu thai không nằm trong `.scene`. Canvas `.vk2g-page-birth` gắn vào `body` với `z-index: -1`, nên `body` phải trong suốt, nếu không nền của nó che canvas. Canvas màn chết nằm trong `.sheet-backdrop`, đứng trước `.sheet`.
- Popup `position: fixed` có `offsetParent` là null. Khi test kiểm popup có đang mở không, phải dùng `getClientRects()`.
