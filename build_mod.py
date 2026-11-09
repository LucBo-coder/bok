"""Dựng bản nâng cấp vào site-mod/ từ site/ gốc, không sửa file gốc nào.

Mỗi điểm vá phải khớp đúng 1 lần. Nếu bundle đổi, build dừng ngay thay vì tạo ra bản hỏng.
"""
import argparse
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "site"
MOD = ROOT / "vk2"
CHUNKS = "_next/static/immutable/chunks"
HOOK = "globalThis.__VK2"

PATCHES = {
    # Game gốc tải lại trang để server đọc cookie và trả HTML tiếng Anh. Site tĩnh luôn trả bản tiếng Việt
    # nên trang tải lại mãi. Bỏ lệnh này thì chữ được đổi ngay ở client.
    "3hv4tg13vrxln.js": [
        ("e&&location.reload()}u(!0)", "}u(!0)"),
    ],
    # Cầu nối tới state của component game. Đặt ở nhánh render khi đang chơi, sau khi mọi hàm đã khai báo.
    "2weh91tpivddk.js": [
        (
            "let tk=nq.current,",
            f"{HOOK}&&{HOOK}.bind({{charRef:nq,metaRef:F,setMeta:E,saveMeta:e=>(0,X.m)(nA.current,e).catch(()=>{{}}),"
            "rerender:nG,save:nV,openPanel:eq,mutate:tl,setRunning:eF,running:eE,user:j,game:O,"
            "pendingRef:nE,panel:eZ});let tk=nq.current,",
        ),
        # Hai hàm đòn duy nhất của game, dùng cho săn quái, phục kích và đấu tay đôi. Bọc lại để cơ chế trận của mod đi vào trận thật.
        (
            "function n7(e,n,t,a,i){if(n.fsP??",
            f"function n7(e,n,t,a,i){{var h={HOOK};if(!h)return __n7(e,n,t,a,i);var f=h.fightFoe(e,n,t),m=n.mHp;__n7(e,n,f,a,i);"
            "for(var x=h.fightExtra(n);x>0&&n.mHp>0;x--)__n7(e,n,f,a,i);h.fightHit(n,m)}function __n7(e,n,t,a,i){if(n.fsP??",
        ),
        (
            "function n8(e,n,t){if(e.fsP??",
            f"function n8(e,n,t){{var h={HOOK},p=e.pHp;__n8(e,n,t);h&&h.fightGuard(e,p)}}function __n8(e,n,t){{if(e.fsP??",
        ),
    ],
    "0pcagq3015zh_.js": [
        # Phe của tông môn: game chỉ biết tông của mình, tông khác mặc định là chính phái. Mod trả phe thật của tông do mod tạo.
        (
            '$=n=>n.sect?T.includes(n.sect)?"ta":M.includes(n.sect)?"trung":"chinh":null',
            f'$=n=>n.sect?({HOOK}&&{HOOK}.sectLean(n.sect))||(T.includes(n.sect)?"ta":M.includes(n.sect)?"trung":"chinh"):null',
        ),
        # Một năm của game: căn cơ được xử lý đúng một lần mỗi năm, kể cả trong bế quan
        # Bản gốc đổi tên thành nP0. Năm không có kỳ ngộ của game thì mod được phép đưa sự kiện của mình vào.
        (
            "function nP(n,l){var",
            f"function nP(n,l){{{HOOK}&&({HOOK}.captureOmen(r.w),{HOOK}.onYear(n,arguments[2]));var __r=nP0.apply(this,arguments);"
            f"return __r||n.dead||!{HOOK}?__r:{HOOK}.yearEvent(n,arguments[2],nD)}}function nP0(n,l){{var",
        ),
        # Tra định nghĩa sự kiện theo id: thêm sự kiện của mod, vẫn lưu và khôi phục được như sự kiện gốc
        ("function nJ(n,e){return e===nX?", f"function nJ(n,e){{var __m={HOOK}&&{HOOK}.eventDef(n,e);if(__m)return __m;return e===nX?"),
        # Sau một lựa chọn: sự kiện nhiều bước của mod (như các tầng bí cảnh) đi tiếp ngay trong cùng năm
        (
            "let m=nS(n,a,o);return m||(nV(n)?nD(n,nI(n)):null)}function n1(",
            f"let m=nS(n,a,o);return m||(nV(n)?nD(n,nI(n)):null)||({HOOK}?{HOOK}.chainEvent(n,nD):null)}}function n1(",
        ),
        # Chỉ số và cấp chiến đấu thật, để trận trong bí cảnh dùng cùng công thức với game
        ("function nd(n){var e,i;let h=", f"function nd(n){{var e,i;{HOOK}&&{HOOK}.captureCombat(nd,nr);let h="),
        # Hàm kiểm tra thiên tượng hôm nay, dùng khi đúc đạo cơ và Kim Đan
        ('.06*!!(0,r.w)("loi_van")', f'.06*!!({HOOK}&&{HOOK}.captureOmen(r.w),(0,r.w)("loi_van"))'),
        # Tốc độ tu luyện
        (
            "function nM(n){let t=nf[n.realm]??90,",
            f"function nM(n){{{HOOK}&&{HOOK}.captureRate(nM);let t=(nf[n.realm]??90)*({HOOK}?{HOOK}.cultMul(n):1),",
        ),
        # Tỷ lệ đột phá
        ("(0,u.r)(n),.08,.9)", f"(0,u.r)(n)+({HOOK}?{HOOK}.breakBonus(n):0),.08,.9)"),
        # Chỉ số chiến đấu
        (
            "let c=(0,t.l)(n,{hp:l,atk:o,def:r});",
            f"let c=(0,t.l)(n,{HOOK}?{HOOK}.stat(n,{{hp:l,atk:o,def:r}}):{{hp:l,atk:o,def:r}});",
        ),
        # Sau khi một lựa chọn đã chạy: ghi vào nhật ký sự kiện, gồm cả kỳ ngộ gốc
        (
            'a.log(`${e.title}: ${l.label}. ${h}`,n.dead?"big":c);',
            f'{HOOK}&&{HOOK}.onChoice(n,e,l);a.log(`${{e.title}}: ${{l.label}}. ${{h}}`,n.dead?"big":c);',
        ),
        # Hàm thưởng khi thắng quái
        ("function nx(n,a,h){", f"function nx(n,a,h){{{HOOK}&&{HOOK}.onKill(n);"),
    ],
}

# Đường dẫn tuyệt đối game dùng. Khi site nằm trong thư mục con như /bok/, tất cả phải có thêm tiền tố.
ROUTES = "choi|dang-nhap|bang-xep-hang|loi-dai|cap-nhat|gop-y|nghia-trang|tang-kiep-cac|moi-tra|tac-gia|chinh-sach|dieu-khoan|so-sinh-tu"
ASSETS = "_next|icons|bg|lpc|px|i18n-dict|icon|apple-icon|og"
ABS_PATH = re.compile(rf"""(?<=["'`(])/(?=(?:{ASSETS}|{ROUTES})(?:[/"'`?#.)\\$]|$))""")
HOME_LINK = re.compile(r"""(href[:=]\\?["'])/(\\?["'])""")


# Lời giới thiệu trên trang: có mặt ở HTML, chunk và từ điển dịch, nên thay ở cả ba, và phải tìm thấy.
TEXT_EDITS = (
    (
        "đầu thai ngẫu nhiên, tu luyện từ phàm nhân tới phi thăng, chọn chính hay tà, vào tông môn, đấu lôi đài hằng ngày. Chơi miễn phí",
        "mỗi kiếp là một đời người, tu luyện từ phàm nhân tới phi thăng, chọn chính hay tà, lập tông môn, nhận đồ đệ, để lại di sản cho kiếp sau. Chơi miễn phí",
    ),
    (
        "Lên Luyện Khí tầng 5 sẽ chọn con đường tu tập. Hết thọ nguyên thì chết, để lại bia mộ và mang phúc duyên sang kiếp sau.",
        "Lên Luyện Khí tầng 5 sẽ chọn con đường tu tập. Trên đường đi có thể vào bí cảnh, sáng tạo công pháp, luyện pháp bảo, dựng động phủ, bái sư, nhận đồ đệ và lập tông môn. Hết thọ nguyên thì chết, để lại bia mộ và mang phúc duyên sang kiếp sau. Những gì bạn gây dựng vẫn còn trong thế giới, và kiếp sau có thể gặp lại.",
    ),
    (
        "At Qi Refining Layer 5 you choose your Path. When your lifespan runs out you die, leave a tombstone, and carry your Fortune into the next life.",
        "At Qi Refining Layer 5 you choose your Path. Along the way you can enter secret realms, create arts, forge treasures, build an abode, find a master, take disciples and found a sect. When your lifespan runs out you die, leave a tombstone, and carry your Fortune into the next life. What you built stays in the world, and a later life may find it again.",
    ),
)


def apply_text_edits(out):
    files = [*out.rglob("*.html"), *(out / CHUNKS).glob("*.js"), out / "i18n-dict.json"]
    for old, new in TEXT_EDITS:
        hits = 0
        for path in files:
            text = path.read_text("utf-8")
            if old in text:
                hits += 1
                path.write_text(text.replace(old, new), "utf-8", newline="")
        if not hits:
            sys.exit(f"Không tìm thấy lời giới thiệu cần thay: {old[:60]}")


# Module gameplay của bản 3.0, nạp theo thứ tự giai đoạn sau core.js và can.js.
MODULES = ("dao", "khi", "the", "phap", "menh", "su", "su_tale", "su_tale2", "su_chain")


def with_base(text, base):
    """Thêm tiền tố vào mọi đường dẫn tuyệt đối của game trong HTML, JS và CSS."""
    text = ABS_PATH.sub(base + "/", text)
    return HOME_LINK.sub(rf"\g<1>{base}/\g<2>", text)


def head_tags(base):
    # connect-src chặn cứng mọi kết nối ra ngoài, kể cả khi guard.js bị bỏ qua.
    return (
        "<meta http-equiv=\"Content-Security-Policy\" content=\"connect-src 'self'\"/>"
        f'<script>globalThis.__VK2_BASE="{base}"</script>'
        f'<script src="{base}/vk2/guard.js"></script>'
    )


def game_tags(base):
    return (
        f'<link rel="stylesheet" href="{base}/vk2/vk2.css"/>'
        f'<link rel="stylesheet" href="{base}/vk2/gfx.css"/>'
        f'<script src="{base}/vk2/data.js"></script>'
        f'<script src="{base}/vk2/core.js"></script>'
        f'<script src="{base}/vk2/can.js"></script>'
        + "".join(f'<script src="{base}/vk2/{m}.js"></script>' for m in MODULES)
        + f'<script src="{base}/vk2/ui.js"></script>'
        f'<script src="{base}/vk2/ui3.js"></script>'
        f'<script src="{base}/vk2/fx.js"></script>'
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="", help="Thư mục con khi deploy, ví dụ /bok")
    parser.add_argument("--out", default="site-mod", help="Thư mục kết quả, nằm ngay trong dự án và sẽ bị ghi đè")
    args = parser.parse_args()
    base = args.base.rstrip("/")
    if base and not re.fullmatch(r"(/[A-Za-z0-9._-]+)+", base):
        sys.exit(f"--base không hợp lệ: {base}")
    if args.out not in ("site-mod", "play"):
        sys.exit(f"--out chỉ nhận site-mod hoặc play, tránh ghi đè nhầm: {args.out}")
    OUT = ROOT / args.out
    if not SRC.is_dir():
        sys.exit("Thiếu site/. Chạy build_site.py trước.")
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT)
    shutil.copytree(MOD, OUT / "vk2", ignore=shutil.ignore_patterns("tests"))

    for name, edits in PATCHES.items():
        path = OUT / CHUNKS / name
        text = path.read_text("utf-8")
        for old, new in edits:
            found = text.count(old)
            if found != 1:
                sys.exit(f"Điểm vá khớp {found} lần (cần 1) trong {name}: {old[:60]}")
            text = text.replace(old, new)
        path.write_text(text, "utf-8", newline="")

    apply_text_edits(OUT)

    # Mọi trang đều nạp chung chunk, nên trang nào cũng phải có lớp chặn mạng.
    pages = list(OUT.rglob("*.html"))
    for page in pages:
        html = page.read_text("utf-8")
        marker = "<head>"
        if html.count(marker) != 1:
            sys.exit(f"Không tìm thấy <head> duy nhất trong {page}")
        if base:
            html = with_base(html, base)
        tags = head_tags(base) + (game_tags(base) if page.parent.name == "choi" else "")
        page.write_text(html.replace(marker, marker + tags), "utf-8", newline="")

    if base:
        chunks = OUT / CHUNKS
        for path in [*chunks.glob("*.js"), *chunks.glob("*.css")]:
            text = path.read_text("utf-8")
            path.write_text(with_base(text, base), "utf-8", newline="")
    (OUT / ".nojekyll").write_text("")  # Thư mục _next không được bị Jekyll bỏ qua

    print(f"OK: {OUT} ({len(pages)} trang, {sum(len(e) for e in PATCHES.values())} điểm vá, base='{base}')")


if __name__ == "__main__":
    main()
