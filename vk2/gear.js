// Dữ liệu trang bị Tuyệt phẩm và linh thú mới. Bundle đã vá đọc file này khi khởi tạo bảng đồ và bảng dị thú,
// nên nó phải nạp trước bundle, không phụ thuộc file nào khác, và có mặt ở mọi trang (bia mộ, bảng xếp hạng cũng tra bảng đồ).
(function (root) {
  "use strict";
  const tr = (pair) => {
    try {
      return root.localStorage?.getItem("vkl.lang") === "en" ? pair[1] : pair[0];
    } catch {
      return pair[0];
    }
  };
  /** Giữ chữ ở dạng getter: đổi ngôn ngữ không cần dựng lại bảng. */
  const named = (name, desc, rest) => ({
    get name() {
      return tr(name);
    },
    get desc() {
      return tr(desc);
    },
    ...rest,
  });

  const RARE = 4; // Phàm, Tốt, Hiếm, Cực phẩm là 0 đến 3
  /** src "event" giữ đồ khỏi bảng rơi và cửa hàng của game: Tuyệt phẩm chỉ có từ việc đúc. */
  const item = (id, slot, minRealm, name, desc, fx, perk, look) =>
    named(name, desc, { id, slot, price: 0, minRealm, look: "x", fx, src: "event", rare: RARE, perk, ...look });

  /* 3 mốc cảnh giới: Nguyên Anh, Độ Kiếp, Kim Tiên. Chỉ số cao hơn đồ Cực phẩm cùng mốc khoảng một phần tư. */
  const ITEMS = [
    item("tp_doan_nhac", "vu_khi", 4, ["Đoạn Nhạc Thần Phong", "Mountain-Severing Edge"], ["Một nhát từng chẻ đôi ngọn núi không tên.", "One stroke once split a nameless peak in two."], { atk: 45, crit: 13, cult: 8 }, { pierce: 0.06 }, { icon: true, wpn: { k: "dao", a: "#ffe9a8", b: "#7a2ab0" } }),
    item("tp_pha_quan", "vu_khi", 7, ["Phá Quân Tinh Hà", "Starfall Spear"], ["Mũi thương kéo theo vệt sáng như sao băng.", "Its point trails light like a falling star."], { atk: 58, crit: 14, cult: 8 }, { pierce: 0.1 }, { icon: true, wpn: { k: "thuong", a: "#d8f0ff", b: "#2a3a8a" } }),
    item("tp_khai_thien", "vu_khi", 10, ["Khai Thiên Trảm", "Heaven-Opening Blade"], ["Người ta nói trời từng có một vết nứt, là do thanh kiếm này.", "They say the sky once cracked, and this blade was why."], { atk: 88, crit: 18, cult: 14 }, { pierce: 0.14 }, { icon: true, wpn: { k: "kiem", a: "#fff4d0", b: "#b02a2a" } }),
    item("tp_tu_vi", "ao", 4, ["Tử Vi Tinh Bào", "Purple Star Robe"], ["Thêu chòm sao, đêm đến tự phát sáng.", "Embroidered with constellations that glow at night."], { def: 33, hp: 23 }, { shield: 0.05 }, { robe: ["#3a1f6a", "#26124a", "#ffd36b", "#7a5ad0"], deco: "van" }),
    item("tp_cuu_long", "ao", 7, ["Cửu Long Thiên Giáp", "Nine Dragon Armor"], ["Chín con rồng vàng cuộn quanh, đòn đánh tới đều trượt đi.", "Nine golden dragons coil around it, and blows slide away."], { def: 56, hp: 39, cult: 6 }, { shield: 0.08 }, { robe: ["#7a1f1f", "#4a1010", "#ffd36b", "#c84a2a"], deco: "long" }),
    item("tp_hon_nguyen", "ao", 10, ["Hỗn Nguyên Đạo Y", "Primal Dao Robe"], ["Không dệt bằng sợi, chỉ là khí được giữ lại thành hình.", "Not woven from thread, only qi held in shape."], { def: 60, hp: 40, atk: 12 }, { shield: 0.12 }, { robe: ["#f4f0e0", "#c8c0a8", "#3a2a6a", "#ffffff"], deco: "long_thu" }),
    item("tp_thien_co", "phu_kien", 4, ["Thiên Cơ Ngọc Bội", "Heaven's Secret Jade"], ["Rung nhẹ trước khi đòn đánh tới.", "It trembles just before a blow lands."], { cult: 12, atk: 10, def: 10, hp: 10 }, { dodge: 0.03 }, { icon: true }),
    item("tp_van_tuong", "phu_kien", 7, ["Vạn Tượng Luân", "Wheel of Myriad Forms"], ["Tự xoay quanh chủ, không ai đoán được hướng đi của người đeo.", "It circles its master, and none can guess the wearer's next step."], { cult: 19, atk: 15, def: 15, hp: 15 }, { dodge: 0.05 }, { icon: true }),
    item("tp_chu_thien", "phu_kien", 10, ["Chu Thiên Tinh Đồ", "Celestial Star Chart"], ["Tấm đồ này vẽ cả những vì sao chưa ra đời.", "This chart shows even the stars not yet born."], { cult: 25, atk: 24, def: 24, crit: 10 }, { dodge: 0.08 }, { icon: true }),
  ];

  const beast = (sheet, frames, cell, scale, fps, filter) => ({ kind: "beast", sheet, frames, cell, scale, strip: true, fps, filter });
  const pet = (name, look, meet, fly) => {
    const def = named(name, meet, { look, fly: !!fly });
    Object.defineProperty(def, "meet", { get: () => tr(meet), enumerable: true });
    return def;
  };

  /* Ảnh là các sheet gốc của game chưa dùng làm thú cưng, đổi màu bằng bộ lọc, giống cách game làm với Cùng Kỳ và Côn Bằng. */
  const PETS = {
    kim_tien_thiem: pet(["Tam Túc Kim Thiềm", "Three-Legged Golden Toad"], beast("dk_toad", 3, 48, 1.5, 4, "sepia(1) hue-rotate(5deg) saturate(3) brightness(1.15) drop-shadow(0 0 2px #ffd36b)"), ["Con cóc ba chân ngồi trên đống đồng tiền cũ, nhả ra một đồng rồi nhìn bạn chờ đợi.", "A three-legged toad sits on a pile of old coins, spits one out and looks at you, waiting."]),
    thiet_giap_nguu: pet(["Thiết Giáp Ngưu", "Iron-Hide Ox"], beast("dk_ox", 4, 128, 0.95, 4, "invert(1) grayscale(1) sepia(1) hue-rotate(170deg) saturate(1.5) brightness(0.72) contrast(1.35)"), ["Con trâu da như sắt đứng chắn giữa đường. Mưa rơi trên lưng nó kêu leng keng.", "An ox with a hide like iron blocks the road. Rain rings off its back."]),
    linh_vien: pet(["Thông Tý Linh Viên", "Long-Armed Spirit Ape"], beast("dk_monkey", 3, 64, 1.15, 6, "grayscale(1) brightness(1.75) contrast(1.15) drop-shadow(0 0 2px #fff4c8)"), ["Con vượn trắng tay dài vắt vẻo trên cành, bắt chước đúng thế ngồi thiền của bạn.", "A long-armed white ape dangles from a branch, copying your meditation pose exactly."]),
    ty_huu: pet(["Tỳ Hưu", "Pixiu"], beast("dk_tiger", 3, 64, 1.4, 5, "sepia(1) hue-rotate(225deg) saturate(1.7) brightness(0.8) contrast(1.2) drop-shadow(0 0 3px #ffd36b)"), ["Mãnh thú vằn vàng nằm canh một kho báu đã mục. Nó chỉ ăn vàng, và không chịu nhả ra.", "A gold-striped beast guards a rotted hoard. It eats only gold, and gives none back."]),
    bang_phi_long: pet(["Băng Tinh Phi Long", "Frost Wyvern"], beast("dk_flydragon", 3, 144, 0.62, 6, "hue-rotate(160deg) saturate(1.3) brightness(1.25) drop-shadow(0 0 4px #9fe0ff)"), ["Một bóng rồng lướt qua làm hồ nước đóng băng trong chớp mắt.", "A dragon's shadow passes, and the lake freezes in a blink."], true),
    huyen_chu: pet(["Huyền Ti Ma Chu", "Mystic Silk Spider"], beast("dk_spider", 6, 64, 1.4, 8, "hue-rotate(205deg) saturate(1.5) brightness(1.15) drop-shadow(0 0 4px #b08aff)"), ["Mạng nhện giăng kín hang, tơ óng như bạc. Con nhện chúa từ tốn bò ra nhìn bạn.", "Webs fill the cave, silk gleaming like silver. The spider queen crawls out slowly to look at you."]),
    bach_trach: pet(["Bạch Trạch", "Baize"], beast("dk_qilin", 3, 85, 1, 5, "grayscale(1) brightness(1.4) drop-shadow(0 0 6px #ffe9a8)"), ["Thần thú trắng biết nói tiếng người bước ra từ sương, gọi đúng tên kiếp trước của bạn.", "A white divine beast that speaks with human words steps from the mist and calls you by your past-life name."]),
    bang_kinh: pet(["Bắc Minh Băng Kình", "Frost Whale of the North Sea"], beast("whale", 7, 112, 1.3, 5, "invert(1) sepia(1) hue-rotate(165deg) saturate(1.9) brightness(0.95) drop-shadow(0 0 5px #9fd8ff)"), ["Trời đang quang bỗng tối sầm. Trên đầu bạn, một con cá voi băng bơi qua giữa những tầng mây.", "The clear sky goes dark. Above you, an ice whale swims through the clouds."], true),
  };
  const PET_RANK = { kim_tien_thiem: "SR", thiet_giap_nguu: "SR", linh_vien: "SR", ty_huu: "SSR", bang_phi_long: "SSR", huyen_chu: "SSR", bach_trach: "SSS", bang_kinh: "SSS" };
  const PET_KIND = { kim_tien_thiem: "phuc", thiet_giap_nguu: "ho_chu", ty_huu: "phuc", bang_phi_long: "ho_chu", huyen_chu: "ho_chu", bach_trach: "phuc", bang_kinh: "ho_chu" }; // Linh Viên là Dưỡng thân, loại mặc định

  let table = null;
  root.VK2Gear = {
    RARE, ITEMS, PETS, PET_RANK, PET_KIND,
    NEW_SSR: Object.keys(PET_RANK).filter((id) => PET_RANK[id] === "SSR"),
    NEW_SSS: Object.keys(PET_RANK).filter((id) => PET_RANK[id] === "SSS"),
    /** Bản vá đưa bảng đồ thật của game vào đây, để logic đúc tra được phẩm và ô của đồ người chơi đang có. */
    capture(t) {
      table = t;
    },
    all: () => table ?? ITEMS,
    itemOf: (id) => table?.find((x) => x.id === id) ?? ITEMS.find((x) => x.id === id) ?? null,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
