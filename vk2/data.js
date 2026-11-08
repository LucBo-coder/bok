// Vạn Kiếp Luân Hồi 2.0 — dữ liệu định nghĩa (không chứa trạng thái người chơi).
// Chuỗi hiển thị luôn là cặp [vi, en], cùng quy ước song ngữ với game gốc.
(function (root) {
  "use strict";

  // Tu vi thưởng tính bằng "số năm tu luyện" ở tốc độ hiện tại (cultY), nên tự co giãn theo cảnh giới.
  const MAIN = [
    // Chương 1
    { id: "m1_qi", ch: 1, t: ["Cảm nhận linh khí lần đầu", "Sense spiritual qi for the first time"], goal: ["has_qi", 1], r: { stones: 20 }, go: { focus: "tu_luyen" } },
    { id: "m1_cult", ch: 1, after: "m1_qi", t: ["Tu luyện 10 năm", "Cultivate for 10 years"], goal: ["y_tu_luyen", 10], r: { stones: 40, stat: { ngoTinh: 2 } }, go: { focus: "tu_luyen" } },
    { id: "m1_kill", ch: 1, after: "m1_qi", t: ["Đánh bại 3 yêu thú", "Defeat 3 beasts"], goal: ["kills", 3], r: { stones: 60 }, go: { panel: "hunt" } },
    { id: "m1_layer3", ch: 1, after: "m1_cult", t: ["Đạt Luyện Khí tầng 3", "Reach Qi Refining layer 3"], goal: ["qi_layer", 3], r: { cultY: 1, stones: 60 }, go: { focus: "tu_luyen" } },
    { id: "m1_cp", ch: 1, after: "m1_layer3", t: ["Học một công pháp", "Learn a technique"], goal: ["cp", 1], r: { stat: { tamCanh: 3 } }, go: { panel: "congphap" } },
    { id: "m1_layer9", ch: 1, after: "m1_layer3", t: ["Luyện Khí viên mãn (tầng 9)", "Perfect Qi Refining (layer 9)"], goal: ["qi_layer", 9], r: { cultY: 2, stones: 150 }, go: { focus: "tu_luyen" } },
    // Chương 2
    { id: "m2_path", ch: 2, after: "m1_layer9", t: ["Chọn một đạo lộ", "Choose a Dao path"], goal: ["path", 1], r: { stones: 120, stat: { tamCanh: 3 } }, go: { panel: "info" } },
    { id: "m2_tam", ch: 2, after: "m1_layer9", t: ["Rèn tâm cảnh đạt 60", "Temper your Mind State to 60"], goal: ["tamCanh", 60], r: { stones: 100 }, go: { focus: "du_ngoan" } },
    { id: "m2_realm", ch: 2, after: "m1_layer9", t: ["Đột phá Trúc Cơ", "Break through to Foundation"], goal: ["realm", 2], r: { cultY: 2, stones: 300 }, go: { focus: "tu_luyen" } },
    // Chương 3
    { id: "m3_kill", ch: 3, after: "m2_realm", t: ["Đánh bại 30 đối thủ", "Defeat 30 foes"], goal: ["kills", 30], r: { stones: 400 }, go: { panel: "hunt" } },
    { id: "m3_stones", ch: 3, after: "m2_realm", t: ["Tích lũy 1.500 linh thạch", "Hold 1,500 spirit stones"], goal: ["stones", 1500], r: { stat: { khiVan: 3 } }, go: { focus: "kiem_tien" } },
    { id: "m3_realm", ch: 3, after: "m2_realm", t: ["Ngưng tụ Kim Đan", "Condense a Golden Core"], goal: ["realm", 3], r: { cultY: 3, stones: 800 }, go: { focus: "tu_luyen" } },
    // Chương 4
    { id: "m4_bond", ch: 4, after: "m3_realm", t: ["Có đạo lữ hoặc linh thú", "Gain a Dao partner or spirit beast"], goal: ["bond", 1], r: { stat: { tamCanh: 4 } }, go: { focus: "ket_duyen" } },
    { id: "m4_cp", ch: 4, after: "m3_realm", t: ["Sở hữu 3 công pháp", "Own 3 techniques"], goal: ["cp", 3], r: { stones: 800 }, go: { panel: "congphap" } },
    { id: "m4_realm", ch: 4, after: "m3_realm", t: ["Kết Nguyên Anh", "Form a Nascent Soul"], goal: ["realm", 4], r: { cultY: 3, stones: 1500 }, go: { focus: "tu_luyen" } },
    // Chương 5 trở đi
    { id: "m5_realm", ch: 5, after: "m4_realm", t: ["Bước vào Hóa Thần", "Enter Spirit Transformation"], goal: ["realm", 5], r: { cultY: 3, stones: 3000 }, go: { focus: "tu_luyen" } },
    { id: "m6_realm", ch: 5, after: "m5_realm", t: ["Bước vào Luyện Hư", "Enter Void Refinement"], goal: ["realm", 6], r: { cultY: 3, stones: 6000 }, go: { focus: "tu_luyen" } },
    { id: "m7_realm", ch: 6, after: "m6_realm", t: ["Bước vào Độ Kiếp", "Enter Tribulation"], goal: ["realm", 7], r: { cultY: 3, stones: 12000 }, go: { focus: "tu_luyen" } },
    { id: "m8_realm", ch: 6, after: "m7_realm", t: ["Phi thăng", "Ascend"], goal: ["realm", 8], r: { stat: { khiVan: 5 } }, go: { focus: "tu_luyen" } },
  ];

  const CHAPTERS = {
    1: ["Phàm Nhân Cầu Đạo", "A Mortal Seeks the Dao"],
    2: ["Đạo Cơ Sơ Lập", "Laying the Foundation"],
    3: ["Kim Đan Đại Đạo", "The Golden Core Road"],
    4: ["Nguyên Anh Xuất Thế", "A Nascent Soul Is Born"],
    5: ["Hóa Thần Vấn Hư", "Questioning the Void"],
    6: ["Nghịch Thiên Độ Kiếp", "Defying the Tribulation"],
  };

  // Mỗi nhiệm vụ chuẩn bị đã nhận thưởng cộng PREP_BONUS vào tỷ lệ đột phá kế tiếp.
  const PREP_BONUS = 0.02;
  const REALM_NAMES = {
    2: ["Trúc Cơ", "Foundation"],
    3: ["Kim Đan", "Golden Core"],
    4: ["Nguyên Anh", "Nascent Soul"],
    5: ["Hóa Thần", "Spirit Transformation"],
    6: ["Luyện Hư", "Void Refinement"],
    7: ["Độ Kiếp", "Tribulation"],
  };
  const PREP_STONES = { 2: 300, 3: 1000, 4: 3000, 5: 8000, 6: 20000, 7: 50000 };
  const REALM = [];
  for (const R of [2, 3, 4, 5, 6, 7]) {
    const nm = REALM_NAMES[R];
    REALM.push(
      { id: `p${R}_tam`, target: R, t: [`Chuẩn bị ${nm[0]}: an định tâm ma (≤ 30)`, `${nm[1]} prep: settle inner demons (≤ 30)`], goal: ["tamma_ok", 1], go: { focus: "du_ngoan" } },
      { id: `p${R}_stones`, target: R, t: [`Chuẩn bị ${nm[0]}: gom ${PREP_STONES[R].toLocaleString("vi-VN")} linh thạch`, `${nm[1]} prep: gather ${PREP_STONES[R]} stones`], goal: ["stones", PREP_STONES[R]], go: { focus: "kiem_tien" } },
      { id: `p${R}_pill`, target: R, t: [`Chuẩn bị ${nm[0]}: mang theo đan dược`, `${nm[1]} prep: carry a pill`], goal: ["pills", 1], go: { panel: "shop" } },
    );
  }

  const LIFE = [
    { id: "l_3", t: ["Trải qua 3 kiếp sống", "Live through 3 lives"], goal: ["lives", 3], r: { phuc: 15 }, go: null },
    { id: "l_10", after: "l_3", t: ["Trải qua 10 kiếp sống", "Live through 10 lives"], goal: ["lives", 10], r: { phuc: 40 }, go: null },
    { id: "l_tc", t: ["Từng đạt Trúc Cơ ở một kiếp bất kỳ", "Reach Foundation in any life"], goal: ["a_maxRealm", 2], r: { phuc: 10 }, go: null },
    { id: "l_nd", after: "l_tc", t: ["Từng đạt Nguyên Anh ở một kiếp bất kỳ", "Reach Nascent Soul in any life"], goal: ["a_maxRealm", 4], r: { phuc: 30 }, go: null },
    { id: "l_kill", t: ["Trừ 500 yêu thú qua mọi kiếp", "Slay 500 beasts across all lives"], goal: ["a_kills", 500], r: { phuc: 25 }, go: null },
    { id: "l_rev", t: ["Báo xong một mối thù truyền kiếp", "Settle a vendetta carried across lives"], goal: ["revenge", 1], r: { phuc: 20 }, go: null },
    { id: "l_lore", t: ["Mở 5 mảnh bí sử", "Unlock 5 pieces of hidden lore"], goal: ["lore", 5], r: { phuc: 20 }, go: null },
  ];

  // Mỗi ngày chọn 3 việc. Thưởng được cộng vào nhân vật đang sống; đổi ngày thì đặt lại.
  const DAILY_POOL = [
    { id: "d_cult", t: ["Tu luyện 3 năm", "Cultivate for 3 years"], goal: ["y_tu_luyen", 3], go: { focus: "tu_luyen" } },
    { id: "d_kill", t: ["Trừ 5 yêu thú", "Slay 5 beasts"], goal: ["kills", 5], go: { panel: "hunt" } },
    { id: "d_roam", t: ["Du ngoạn 2 năm", "Roam for 2 years"], goal: ["y_du_ngoan", 2], go: { focus: "du_ngoan" } },
    { id: "d_alch", t: ["Luyện đan 2 năm", "Practise alchemy for 2 years"], goal: ["y_luyen_dan", 2], go: { focus: "luyen_dan" } },
    { id: "d_earn", t: ["Kiếm tiền 2 năm", "Earn money for 2 years"], goal: ["y_kiem_tien", 2], go: { focus: "kiem_tien" } },
    { id: "d_sect", t: ["Tu hành ở tông môn 3 năm", "Train in your sect for 3 years"], goal: ["y_sect", 3], go: { focus: "tu_luyen" } },
  ];
  const DAILY_COUNT = 3;
  const DAILY_REWARD = { stonesPerRealm: 60, txp: 25 };

  /*
   * Thiên phú. Thức tỉnh theo hành vi (awake: mọi điều kiện [metric, n] phải đạt).
   * Chỉ thiên phú đang vận hành mới tích kinh nghiệm từ hành động (xp: metric -> điểm).
   * fx[i] là hiệu ứng ở bậc i+1; cộng dồn qua softcap trong core.js.
   * Khóa hiệu ứng: atk, def, hp, cult (tốc độ tu), brk (cộng tỷ lệ đột phá).
   */
  const TALENTS = [
    {
      id: "kiem_tam", q: 3, icon: "g_kiem_tam_thong_minh_chau",
      n: ["Kiếm Tâm Thông Minh", "Lucid Sword Heart"],
      d: ["Lòng sáng như gương, kiếm theo ý động. Lớn lên qua từng trận chém giết bằng kiếm.", "A heart bright as a mirror; the blade follows intent. Grows with every sword fight."],
      how: ["Theo Kiếm đạo và thắng 5 trận", "Follow the Sword path and win 5 fights"],
      awake: [["path_kiem", 1], ["kills_kiem", 5]], xp: { kills_kiem: 8, y_tu_luyen: 1 },
      fx: [{ atk: 0.05 }, { atk: 0.08 }, { atk: 0.11, cult: 0.02 }, { atk: 0.15, cult: 0.02 }, { atk: 0.2, cult: 0.03 }],
      branch: {
        at: 3,
        opts: [
          { id: "ba", n: ["Bá Kiếm", "Tyrant Sword"], d: ["Công +8%, phòng -4%", "Attack +8%, defence -4%"], fx: { atk: 0.08, def: -0.04 } },
          { id: "tinh", n: ["Tĩnh Kiếm", "Still Sword"], d: ["Đột phá +3%, sinh lực +4%", "Breakthrough +3%, HP +4%"], fx: { brk: 0.03, hp: 0.04 } },
        ],
      },
    },
    {
      id: "dan_tam", q: 2, icon: "g_dan_tam_ngoc",
      n: ["Đan Tâm", "Alchemist's Heart"],
      d: ["Ngửi được dược tính trong gió. Lửa lò càng lâu, thân càng bền.", "Scents medicinal essence on the wind. The longer the furnace burns, the sturdier the body."],
      how: ["Luyện đan 5 năm", "Practise alchemy for 5 years"],
      awake: [["y_luyen_dan", 5]], xp: { y_luyen_dan: 14, y_tu_luyen: 1 },
      fx: [{ hp: 0.04 }, { hp: 0.06, brk: 0.01 }, { hp: 0.08, brk: 0.015 }, { hp: 0.1, brk: 0.02 }, { hp: 0.13, brk: 0.03 }],
    },
    {
      id: "thiet_cot", q: 1, icon: "g_kim_cuong_xu",
      n: ["Thiết Cốt", "Iron Bones"],
      d: ["Xương cứng lên sau mỗi trận thắng. Đổi lại, người cứng thì khí khó thông.", "Bones harden with each victory. In exchange, a stiff body circulates qi poorly."],
      how: ["Thắng 15 trận", "Win 15 fights"],
      awake: [["kills", 15]], xp: { kills: 5 },
      fx: [{ def: 0.05, cult: -0.01 }, { def: 0.08, hp: 0.03, cult: -0.01 }, { def: 0.11, hp: 0.05, cult: -0.02 }, { def: 0.14, hp: 0.07, cult: -0.02 }, { def: 0.18, hp: 0.1, cult: -0.03 }],
    },
    {
      id: "tinh_tam", q: 2, icon: "guong_van_tam",
      n: ["Tĩnh Tâm", "Still Mind"],
      d: ["Lòng yên thì thiên kiếp cũng bớt dữ. Chỉ nở ở người tâm ma thấp.", "A calm heart softens even the tribulation. Blooms only when inner demons are few."],
      how: ["Tu luyện 15 năm khi tâm ma ≤ 30", "Cultivate 15 years with inner demons ≤ 30"],
      awake: [["y_calm", 15]], xp: { y_calm: 10 },
      fx: [{ brk: 0.015 }, { brk: 0.025, cult: 0.02 }, { brk: 0.035, cult: 0.03 }, { brk: 0.045, cult: 0.04 }, { brk: 0.06, cult: 0.05 }],
    },
    {
      id: "lu_khach", q: 1, icon: "g_la_ban_dong",
      n: ["Lữ Khách", "Wayfarer"],
      d: ["Đi nhiều biết nhiều. Tầm mắt rộng thì ngộ đạo nhanh, nhưng chân ít khi đứng yên để luyện võ.", "Far travels bring wide views and quick insight, but rarely time to train the fists."],
      how: ["Du ngoạn 8 năm", "Roam for 8 years"],
      awake: [["y_du_ngoan", 8]], xp: { y_du_ngoan: 12 },
      fx: [{ cult: 0.03, atk: -0.01 }, { cult: 0.05, atk: -0.01 }, { cult: 0.07, atk: -0.02 }, { cult: 0.09, atk: -0.02 }, { cult: 0.12, atk: -0.03 }],
    },
    {
      id: "ma_tam", q: 3, icon: "g_ma_tam_ngoc",
      n: ["Ma Tâm", "Demon Heart"],
      d: ["Lấy dục vọng làm đạo. Mạnh rất nhanh, nhưng mỗi năm tâm ma lại dày thêm, và lôi kiếp không thích kẻ này.", "Desire as the Dao. Power comes fast, but inner demons thicken yearly and the tribulation hates you."],
      how: ["Đạo tâm ≤ -30 và thắng 10 trận", "Dao Heart ≤ -30 and win 10 fights"],
      awake: [["evil", 1], ["kills", 10]], xp: { kills: 6, y_tu_luyen: 2 },
      perYear: { tamMa: 0.2 },
      fx: [{ atk: 0.07, cult: 0.03, brk: -0.01 }, { atk: 0.1, cult: 0.05, brk: -0.015 }, { atk: 0.14, cult: 0.07, brk: -0.02 }, { atk: 0.18, cult: 0.09, brk: -0.025 }, { atk: 0.24, cult: 0.12, brk: -0.03 }],
      branch: {
        at: 3,
        opts: [
          { id: "huyet", n: ["Huyết Ma", "Blood Demon"], d: ["Sinh lực +8%", "HP +8%"], fx: { hp: 0.08 } },
          { id: "tam", n: ["Tâm Ma Chủ", "Lord of Demons"], d: ["Đột phá +3%, bù lại phần lôi kiếp ghét", "Breakthrough +3%, offsetting the tribulation's hate"], fx: { brk: 0.03 } },
        ],
      },
    },
    {
      id: "chinh_khi", q: 2, icon: "g_phat_quang_phu",
      n: ["Hạo Nhiên Chính Khí", "Righteous Qi"],
      d: ["Sống ngay thẳng thì khí tự đầy. Không cần giết nhiều, chỉ cần giữ lòng.", "Live upright and qi fills itself. No need for many kills, only for a kept heart."],
      how: ["Đạo tâm ≥ 30 và sống tới 30 tuổi", "Dao Heart ≥ 30 and live to age 30"],
      awake: [["good", 1], ["age", 30]], xp: { y_tu_luyen: 4, y_du_ngoan: 4 },
      fx: [{ def: 0.03, brk: 0.01 }, { def: 0.05, brk: 0.015 }, { def: 0.07, brk: 0.02 }, { def: 0.09, brk: 0.03 }, { def: 0.12, brk: 0.04 }],
    },
    {
      id: "thu_huu", q: 2, icon: "g_van_yeu_lenh",
      n: ["Thú Hữu", "Beast Friend"],
      d: ["Thú dữ cũng thuận tay người này. Có linh thú bên cạnh, thân càng vững.", "Even wild beasts settle by this hand. With a spirit beast at your side, you stand firmer."],
      how: ["Có linh thú và thắng 5 trận", "Own a spirit beast and win 5 fights"],
      awake: [["pet", 1], ["kills", 5]], xp: { kills: 6, y_du_ngoan: 3 },
      fx: [{ hp: 0.04, atk: 0.02 }, { hp: 0.06, atk: 0.03 }, { hp: 0.08, atk: 0.05 }, { hp: 0.1, atk: 0.07 }, { hp: 0.13, atk: 0.09 }],
    },
    {
      id: "hon_nguyen", q: 4, icon: "g_hon_nguyen_chau",
      n: ["Hỗn Nguyên Thể", "Primordial Body"],
      d: ["Chỉ tạp linh căn mới nảy nở. Linh khí lẫn tạp đủ màu, nay thành thể chất cân bằng hiếm có.", "Sprouts only from mixed roots. Qi of every colour becomes a rare, balanced body."],
      how: ["Linh căn từ 4 hệ trở lên, đạt Trúc Cơ", "A root of 4+ elements, and reach Foundation"],
      awake: [["root_count", 4], ["realm", 2]], xp: { y_tu_luyen: 3, kills: 4 },
      fx: [{ atk: 0.03, def: 0.03, hp: 0.03, cult: 0.03 }, { atk: 0.05, def: 0.05, hp: 0.05, cult: 0.05 }, { atk: 0.07, def: 0.07, hp: 0.07, cult: 0.07 }, { atk: 0.09, def: 0.09, hp: 0.09, cult: 0.09 }, { atk: 0.12, def: 0.12, hp: 0.12, cult: 0.12 }],
    },
    {
      id: "luan_hoi_an", q: 4, icon: "g_thien_dao_an",
      n: ["Luân Hồi Ấn", "Samsara Seal"],
      d: ["Dấu ấn của những lần chết chưa quên. Càng nhiều kiếp càng rõ, nhưng hồn nặng thì thân chậm.", "The mark of deaths unforgotten. Clearer with each life, though a heavy soul slows the body."],
      how: ["Trải qua 5 kiếp, kiếp này sống tới 20 tuổi", "Live through 5 lives, and reach age 20 in this one"],
      awake: [["lives", 5], ["age", 20]], xp: { y_tu_luyen: 3, kills: 3, y_du_ngoan: 3 },
      fx: [{ cult: 0.05, brk: 0.01, hp: -0.02 }, { cult: 0.07, brk: 0.02, hp: -0.02 }, { cult: 0.09, brk: 0.03, hp: -0.03 }, { cult: 0.11, brk: 0.04, hp: -0.03 }, { cult: 0.14, brk: 0.05, hp: -0.04 }],
    },
  ];

  const QUALITY = {
    1: { n: ["Phàm", "Common"], cls: "q1", xpMul: 1 },
    2: { n: ["Linh", "Spirit"], cls: "q2", xpMul: 1.25 },
    3: { n: ["Huyền", "Mystic"], cls: "q3", xpMul: 1.6 },
    4: { n: ["Thiên", "Heavenly"], cls: "q4", xpMul: 2.2 },
  };
  // Kinh nghiệm cần để lên bậc 2, 3, 4, 5 (nhân với xpMul của phẩm chất).
  const LEVEL_XP = [100, 220, 420, 720];
  const MAX_AWAKENED = 6; // Tối đa thức tỉnh mỗi kiếp
  const slotsFor = (realm) => 1 + (realm >= 2 ? 1 : 0) + (realm >= 4 ? 1 : 0);

  // Trần giảm dần theo từng chỉ số: cộng càng nhiều, hiệu quả thêm vào càng ít.
  const SOFTCAP = { atk: 0.45, def: 0.45, hp: 0.45, cult: 0.5, brk: 0.1 };

  const ELEMENTS = {
    kim: ["Kim", "Metal"], moc: ["Mộc", "Wood"], thuy: ["Thủy", "Water"], hoa: ["Hỏa", "Fire"], tho: ["Thổ", "Earth"],
  };
  // Thứ tự tương sinh, dùng để chọn hệ phụ theo seed của nhân vật.
  const GEN_CYCLE = ["kim", "thuy", "moc", "hoa", "tho"];
  // Số hệ càng nhiều thì càng thiên về bền bỉ; đơn hệ thiên về công. Tốc độ hấp thu vẫn do hệ số linh căn gốc quyết định.
  const ROOT_FORMS = {
    1: { n: ["Đơn linh căn", "Single root"], d: ["Sắc bén nhưng mỏng manh: công +6%, sinh lực -3%.", "Sharp but brittle: attack +6%, HP -3%."], fx: { atk: 0.06, hp: -0.03 } },
    2: { n: ["Song linh căn", "Dual root"], d: ["Hai hệ bổ trợ: công +4%, phòng +2%.", "Two elements in support: attack +4%, defence +2%."], fx: { atk: 0.04, def: 0.02 } },
    3: { n: ["Tam linh căn", "Triple root"], d: ["Cân bằng: công, phòng, sinh lực +2%.", "Balanced: attack, defence and HP +2%."], fx: { atk: 0.02, def: 0.02, hp: 0.02 } },
    4: { n: ["Tứ linh căn", "Quadruple root"], d: ["Khí tạp mà dày: phòng +4%, sinh lực +6%, đột phá +1%. Có thể mở Hỗn Nguyên Thể.", "Murky but deep qi: defence +4%, HP +6%, breakthrough +1%. May unlock Primordial Body."], fx: { def: 0.04, hp: 0.06, brk: 0.01 } },
    5: { n: ["Ngũ hành tạp căn", "Five-element root"], d: ["Đủ cả năm hệ: phòng +6%, sinh lực +10%, đột phá +2%. Có thể mở Hỗn Nguyên Thể.", "All five elements: defence +6%, HP +10%, breakthrough +2%. May unlock Primordial Body."], fx: { def: 0.06, hp: 0.1, brk: 0.02 } },
  };
  // Biến dị hiếm: chỉ xuất hiện ở linh căn ít hệ.
  const ROOT_VARIANTS = {
    loi: { n: ["Lôi linh căn", "Lightning root"], d: ["Biến dị: công +6%.", "Mutation: attack +6%."], fx: { atk: 0.06 } },
    bang: { n: ["Băng linh căn", "Ice root"], d: ["Biến dị: phòng +6%.", "Mutation: defence +6%."], fx: { def: 0.06 } },
    phong: { n: ["Phong linh căn", "Wind root"], d: ["Biến dị: tốc độ tu +4%.", "Mutation: cultivation speed +4%."], fx: { cult: 0.04 } },
  };
  // Đạo lộ hợp hệ nào. Hợp hệ: tốc độ tu +5%, kinh nghiệm thiên phú +25%.
  const PATH_AFFINITY = { kiem: ["kim"], dan: ["hoa", "moc"], tran: ["tho"], phat: ["tho", "kim"], ma: ["thuy", "hoa"], yeu: ["moc"] };
  const AFFINITY = { cult: 0.05, xpMul: 1.25 };

  const REALM_LABELS = [
    ["Phàm Nhân", "Mortal"], ["Luyện Khí", "Qi Refining"], ["Trúc Cơ", "Foundation"], ["Kim Đan", "Golden Core"],
    ["Nguyên Anh", "Nascent Soul"], ["Hóa Thần", "Spirit Transformation"], ["Luyện Hư", "Void Refinement"], ["Độ Kiếp", "Tribulation"],
    ["Chân Tiên", "True Immortal"], ["Huyền Tiên", "Mystic Immortal"], ["Kim Tiên", "Golden Immortal"], ["Đại La Kim Tiên", "Daluo Golden Immortal"],
  ];
  // Các hoạt động được đếm theo năm, dùng cho biểu đồ phân bổ thời gian trong tab Hành trình.
  const ACTIVITY_LABELS = {
    y_tu_luyen: ["Tu luyện", "Cultivation"], y_du_ngoan: ["Du ngoạn", "Roaming"], y_kiem_tien: ["Kiếm tiền", "Earning"],
    y_ket_duyen: ["Kết duyên", "Bonds"], y_luyen_dan: ["Luyện đan", "Alchemy"], y_tru_yeu: ["Trừ yêu", "Hunting"],
  };
  const PATH_LABELS = { kiem: ["Kiếm tu", "Sword"], dan: ["Đan tu", "Alchemy"], tran: ["Trận tu", "Array"], phat: ["Phật tu", "Buddhist"], ma: ["Ma tu", "Demon"], yeu: ["Yêu tu", "Beast"] };

  root.VK2Data = {
    REALM_LABELS, ACTIVITY_LABELS, PATH_LABELS,
    MAIN, CHAPTERS, REALM, REALM_NAMES, PREP_BONUS, LIFE, DAILY_POOL, DAILY_COUNT, DAILY_REWARD,
    TALENTS, QUALITY, LEVEL_XP, MAX_AWAKENED, slotsFor, SOFTCAP,
    ELEMENTS, GEN_CYCLE, ROOT_FORMS, ROOT_VARIANTS, PATH_AFFINITY, AFFINITY,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
