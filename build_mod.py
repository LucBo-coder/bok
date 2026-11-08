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
OUT = ROOT / "site-mod"
MOD = ROOT / "vk2"
CHUNKS = "_next/static/immutable/chunks"
HOOK = "globalThis.__VK2"

PATCHES = {
    # Cầu nối tới state của component game. Đặt ở nhánh render khi đang chơi, sau khi mọi hàm đã khai báo.
    "2weh91tpivddk.js": [
        (
            "let tk=nq.current,",
            f"{HOOK}&&{HOOK}.bind({{charRef:nq,metaRef:F,setMeta:E,saveMeta:e=>(0,X.m)(nA.current,e).catch(()=>{{}}),"
            "rerender:nG,save:nV,openPanel:eq,mutate:tl,setRunning:eF,running:eE,user:j});let tk=nq.current,",
        ),
    ],
    "0pcagq3015zh_.js": [
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
        # Hàm thưởng khi thắng quái
        ("function nx(n,a,h){", f"function nx(n,a,h){{{HOOK}&&{HOOK}.onKill(n);"),
    ],
}

# Đường dẫn tuyệt đối game dùng. Khi site nằm trong thư mục con như /bok/, tất cả phải có thêm tiền tố.
ROUTES = "choi|dang-nhap|bang-xep-hang|loi-dai|cap-nhat|gop-y|nghia-trang|tang-kiep-cac|moi-tra|tac-gia|chinh-sach|dieu-khoan|so-sinh-tu"
ASSETS = "_next|icons|bg|lpc|px|i18n-dict|icon|apple-icon|og"
ABS_PATH = re.compile(rf"""(?<=["'`(])/(?=(?:{ASSETS}|{ROUTES})(?:[/"'`?#.)\\$]|$))""")
HOME_LINK = re.compile(r"""(href[:=]\\?["'])/(\\?["'])""")


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
        f'<script src="{base}/vk2/data.js"></script>'
        f'<script src="{base}/vk2/core.js"></script>'
        f'<script src="{base}/vk2/ui.js"></script>'
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="", help="Thư mục con khi deploy, ví dụ /bok")
    base = parser.parse_args().base.rstrip("/")
    if base and not re.fullmatch(r"/[A-Za-z0-9._-]+", base):
        sys.exit(f"--base không hợp lệ: {base}")
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
