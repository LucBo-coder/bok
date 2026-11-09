// Chuỗi sự kiện liên hoàn và mạch đời NPC. Chuỗi nằm trong thế giới: tới hạn thì tự đi tiếp theo thế cuộc (điểm s), sức của NPC tham gia và lịch sử,
// dù người chơi có mặt, đã chết hay chưa sinh ra. Người chơi chỉ đổi được thế cuộc qua lựa chọn ở giai đoạn có ev.
(function (root) {
  "use strict";
  const Su = root.VK2Su;
  const S = (id, n, log, dur, o = {}) => ({ id, n, log, dur, ...o });
  const O = (l, r, fx, lean = "trung", o = {}) => ({ l, r, fx, lean, ...o });
  const EV = (when, t, x, c) => ({ when, t, x, c });

  Su.defineChain([
    {
      id: "ma_tong", g: "the_gioi", tier: 3, w: 3, n: ["Ma Tông Tái Xuất", "The Demon Sect Returns"], roles: { foe: "strong", ally: "strong" }, sect: "chinh",
      stages: [
        S("dau_hieu", ["Ma khí ở một ngôi làng", "Demon qi in a village"], ["Một ngôi làng ở vùng biên bỗng không còn ai. Trên tường có vết cháy hình con mắt.", "A border village is suddenly empty. An eye-shaped burn marks the walls."], [6, 12], {
          ev: EV({ realm: [1], age: [14] }, ["Làng không người", "The empty village"], ["Bạn đi qua một làng không còn tiếng gà. Trong nhà còn mâm cơm, tường có vết cháy hình con mắt. {ally} của {sect} cũng đang điều tra.", "You pass a village without a rooster's cry. Meals sit on tables, and an eye is burned into the wall. {ally} of {sect} is investigating too."], [
            O(["Cùng {ally} điều tra", "Investigate with {ally}"], ["Hai người lần ra dấu chân về phía tế đàn cổ.", "Together you trace footprints toward an old altar."], { ds: 8, cf: "biet_te_dan", led: { bao: 3 }, trace: { k: "dai_su", t: ["Bạn là một trong những người đầu tiên phát hiện Ma Tông trở lại.", "You were among the first to find the Demon Sect's return."], key: "ma_tong_dau" } }, "chinh"),
            O(["Báo tông môn rồi đi", "Report it and go"], ["Có người sẽ lo. Có lẽ.", "Someone will handle it. Perhaps."], { ds: 2 }),
            O(["Thu nhặt những gì còn lại", "Scavenge what remains"], ["Nhà nào cũng còn chút của để dành.", "Every house has something put by."], { s: 2, dt: -4, ds: -3 }, "ta"),
          ]),
        }),
        S("te_dan", ["Tế đàn dưới núi", "The altar below"], ["Có tin đồn về một tế đàn đang hoạt động trở lại. {foe} được thấy ở gần đó.", "Rumour tells of an active altar again. {foe} has been seen nearby."], [6, 12], {
          ev: EV({ realm: [1], age: [14] }, ["Tế đàn dưới núi", "The altar below"], ["Tế đàn còn nóng. Giữa vòng máu là những đứa trẻ bị trói, còn thở. Người canh giữ là {foe}.", "The altar is warm. Inside the circle of blood are bound children, still breathing. {foe} stands guard."], [
            O(["Xông vào cứu người", "Charge in"], ["Bạn phá vòng máu, đưa bọn trẻ ra. {foe} bỏ chạy, tế lễ dở dang.", "You break the circle and bring the children out. {foe} flees with the rite unfinished."], { ds: 20, cf: "pha_te", led: { thien: 8 }, stat: { tamCanh: 4 }, trace: { k: "an_nhan", t: ["Những đứa trẻ ở tế đàn mang ơn bạn.", "The children of the altar owe you their lives."], key: "tre_te_dan", w: 40 } }, "chinh", { duel: { off: 1, rf: ["{foe} đánh bạn văng khỏi tế đàn. Bạn chỉ cứu được hai đứa.", "{foe} hurls you off the altar. You save only two."], fxf: { hp: -30, ds: 6, led: { thien: 3 }, wound: { mat: 4 } } } }),
            O(["Về báo, xin viện binh", "Return for reinforcements"], ["Tới khi người kéo đến thì đã xong.", "By the time help arrives, it is done."], { ds: 4, wound: { mat: 3 } }),
            O(["Hỏi {foe} xem có thể làm ăn", "Ask {foe} for a deal"], ["{foe} cười, dạy bạn một đoạn ma công.", "{foe} laughs and teaches you a passage."], { ds: -15, mast: { ma_cong: 8 }, dt: -12, cf: "theo_ma", led: { cam: 6 } }, "ta"),
          ]),
        }),
        S("mo_rong", ["Ma Tông mở rộng thế lực", "The Demon Sect spreads"], ["Ma Tông chiếm liền ba trấn. {sect} kêu gọi các tông liên minh.", "The Demon Sect takes three towns. {sect} calls on the others to ally."], [10, 18], {
          br: [{ if: { s: 35 }, to: "xung_dot" }],
          wfx: { sect: { store: -30 } },
        }),
        S("xung_dot", ["Chính Ma xung đột", "War of orthodox and demon"], ["Chính Ma đại chiến ở bình nguyên giữa. {ally} dẫn đầu phe chính đạo, {foe} phe ma đạo.", "War on the central plain: {ally} leads the orthodox, {foe} the demons."], [8, 15], {
          ev: EV({ realm: [2] }, ["Bình nguyên giữa", "The central plain"], ["Hai đạo quân đã giáp nhau. Cả hai đều cử người tìm tới bạn.", "Two armies have met. Both send someone to find you."], [
            O(["Ra trận cùng {ally}", "Fight beside {ally}"], ["Tên bạn được nhắc trong quân báo.", "Your name appears in the dispatches."], { ds: 18, led: { bao: 6, sat: 4 }, contrib: 10 }, "chinh", { duel: { off: 0, rf: ["Bạn bị thương nặng ngay trận đầu, được đồng đội khiêng về.", "You fall badly in the first battle and are carried back."], fxf: { hp: -35, ds: 6 } } }),
            O(["Lẻn vào phá hậu cần ma đạo", "Slip behind and sabotage"], ["Kho lương cháy, trận đổi chiều.", "The stores burn, and the tide turns."], { ds: 12, s: 3 }, "trung", { ck: { on: "khiVan", at: 45, p: 0.6, rf: ["Bạn bị phát hiện, phải bỏ đồ chạy.", "You are found and flee, abandoning your gear."], fxf: { hp: -20 } } }),
            O(["Bán tin cho {foe}", "Sell intelligence to {foe}"], ["Tin của bạn cướp đi cả một đội.", "Your word costs a whole company their lives."], { ds: -22, s: 6, dt: -18, led: { sat: 6 }, trace: { k: "ke_thu", t: ["Bạn đã bán đứng phe chính đạo ở bình nguyên giữa.", "You betrayed the orthodox on the central plain."], key: "ban_binh_nguyen", w: 55 } }, "ta"),
          ]),
          br: [{ if: { s: 30 }, to: "phong_an" }, { if: { lt: -15 }, to: "thuc_tinh" }, { if: { dead: "foe" }, to: "phong_an" }, { to: "gang_co" }],
        }),
        S("gang_co", ["Thế giằng co", "Stalemate"], ["Chính Ma giằng co nhiều năm, đất đai tan hoang, không bên nào thắng.", "The war drags for years. The land is ruined and no side wins."], [10, 16], {
          wfx: { vein: -1, flag: "dat_hoang" }, br: [{ if: { s: 5 }, to: "phong_an" }, { to: "thuc_tinh" }],
        }),
        S("phong_an", ["Ma Chủ bị phong ấn", "The Demon Lord sealed"], ["Ma Chủ bị phong ấn trước khi thức tỉnh hoàn toàn. Thiên hạ ăn mừng, nhiều người không về.", "The Demon Lord is sealed before fully waking. The world celebrates, and many do not return."], [2, 3], { end: true, wfx: { flag: "ma_chu_phong_an", sect: { terr: 1 } } }),
        S("thuc_tinh", ["Ma Chủ thức tỉnh", "The Demon Lord wakes"], ["Ma Chủ đã thức tỉnh. Bầu trời phương bắc đỏ suốt ba năm.", "The Demon Lord has woken. The northern sky is red for three years."], [2, 3], { end: true, wfx: { flag: "ma_chu_thuc_tinh", sect: { terr: -2, store: -80 }, vein: -1 } }),
      ],
    },
    {
      id: "yeu_hoang", g: "linh_thu", tier: 2, w: 3, n: ["Yêu Hoàng Xuống Núi", "The Beast Sovereign Descends"], roles: { foe: "strong", ally: "any" },
      stages: [
        S("dau", ["Đàn thú rời rừng", "Herds leave the forest"], ["Muông thú đồng loạt rời núi sâu, như đang chạy khỏi thứ gì đó.", "Whole herds flee the deep hills, as if running from something."], [5, 10], {
          ev: EV({ age: [12], focus: ["du_ngoan", "tru_yeu"] }, ["Đàn thú rời rừng", "Herds leave the forest"], ["Một đàn nai chạy ngang người bạn mà không né. Phía sau chúng, cây đổ từng hàng.", "Deer run past you without flinching. Behind them, trees fall in rows."], [
            O(["Đi xem rõ chuyện gì", "Go and see"], ["Bạn thấy một dấu chân rộng bằng sân nhà.", "You find a footprint as wide as a courtyard."], { ds: 4, cf: "biet_yeu", stat: { ngoTinh: 2 } }),
            O(["Về làng báo động", "Warn the village"], ["Làng dời đi kịp. Họ kể chuyện bạn nhiều năm.", "The village moves in time. They tell of you for years."], { ds: 8, led: { thien: 5 } }, "chinh"),
          ]),
        }),
        S("tien", ["Yêu tộc tiến về đồng bằng", "The clans march"], ["Yêu Hoàng ra lệnh tiến về đồng bằng. Các tông ven núi cầu viện.", "The Sovereign orders the march. The mountain sects cry for aid."], [8, 14], { wfx: { sect: { terr: -1 } } }),
        S("so_tai", ["Trận trước thành", "Battle before the walls"], ["Yêu quân tới chân thành. {ally} ra thành khiêu chiến.", "The horde reaches the walls. {ally} rides out to challenge them."], [6, 10], {
          ev: EV({ realm: [2] }, ["Trước thành", "Before the walls"], ["Yêu quân đã áp sát. Sứ giả mang lời Yêu Hoàng: \"Trả lại rừng, sẽ không giết ai.\"", "The horde is here. The envoy brings the Sovereign's words: \"Return the forest, and no one dies.\""], [
            O(["Đứng ra hòa đàm", "Stand forth to negotiate"], ["Hai bên chia lại ranh giới rừng.", "The sides redraw the forest border."], { ds: 18, led: { bao: 8, thien: 4 }, cf: "hoa_dam" }, "chinh", { ck: { on: "tamCanh", at: 50, p: 0.6, rf: ["Không ai chịu nghe. Bạn bị cả hai bên nghi ngờ.", "No one will listen. Both sides distrust you."], fxf: { hp: -10 } } }),
            O(["Ra trận giết tướng", "Slay their general"], ["Đầu yêu tướng bay qua tường thành.", "The general's head sails over the wall."], { ds: 15, led: { sat: 6 }, mat: { yeu_dan: 4 } }, "ta", { duel: { off: 1, rf: ["Yêu tướng quật bạn gãy mấy cái xương.", "The general breaks several of your bones."], fxf: { hp: -35 } } }),
          ]),
          br: [{ if: { f: "hoa_dam" }, to: "ranh_gioi" }, { if: { s: 15 }, to: "thang" }, { to: "that_thu" }],
        }),
        S("ranh_gioi", ["Ranh giới mới", "A new border"], ["Người và yêu chia lại ranh giới rừng. Đây là hòa ước đầu tiên sau trăm năm.", "Humans and beasts redraw the forest line, the first treaty in a century."], [2, 3], { end: true, wfx: { flag: "hoa_uoc_yeu" } }),
        S("thang", ["Yêu tộc lui về núi", "The clans withdraw"], ["Yêu quân tan vỡ, lui về núi. Thù này chưa hết.", "The horde breaks and retreats to the hills. This hatred is not over."], [2, 3], { end: true, wfx: { flag: "yeu_thu_han" } }),
        S("that_thu", ["Thành thất thủ", "The city falls"], ["Thành thất thủ. Đồng bằng phía nam thành đất của yêu tộc.", "The city falls. The southern plain becomes clan land."], [2, 3], { end: true, wfx: { flag: "yeu_ket_minh", vein: -1 } }),
      ],
    },
    {
      id: "dan_doc", g: "kinh_te", tier: 2, w: 3, n: ["Mùa Đan Độc", "The Season of Poisoned Pills"], roles: { foe: "any", ally: "any" },
      stages: [
        S("dau", ["Người uống đan chết", "Pills that kill"], ["Khắp phường thị có người chết sau khi uống đan rẻ tiền. Giá đan lên gấp đôi.", "People die across the markets after taking cheap pills. Prices double."], [6, 10], {
          ev: EV({ age: [14], stones: 1 }, ["Đan giết người", "Pills that kill"], ["Một y sĩ kéo bạn lại: lô đan của thương hội do {foe} cầm đầu có độc. Ông không dám nói ra.", "A physician pulls you aside: the pills from {foe}'s guild are poisoned. He dares not speak."], [
            O(["Lấy mẫu, đi tố cáo", "Take a sample and expose them"], ["Tin lan ra. Bạn có thêm kẻ thù.", "Word spreads, and you gain an enemy."], { ds: 15, led: { thien: 5 }, cf: "to_cao" }, "chinh"),
            O(["Gom đan sạch để bán đắt", "Hoard clean pills to resell"], ["Mùa này bạn giàu lên.", "You grow rich this season."], { s: 6, ds: -8, dt: -8 }, "ta"),
            O(["Giúp ông làm thuốc giải", "Help make an antidote"], ["Hai người thức trắng nhiều đêm.", "Many sleepless nights follow."], { ds: 10, mast: { dan_dao: 6 } }, "trung", { pay: 1 }),
          ]),
        }),
        S("lan", ["Dịch lan ra các trấn", "It spreads"], ["Độc từ đan vào cả nguồn nước. Các trấn phía tây đóng cổng.", "The poison reaches the water. Western towns close their gates."], [8, 12], { br: [{ if: { f: "to_cao" }, to: "xu_an" }] }),
        S("xu_an", ["Xử án thương hội", "The guild on trial"], ["Các tông ép thương hội ra tòa. {foe} nói mình chỉ làm theo lệnh.", "The sects force the guild to trial. {foe} claims only to have followed orders."], [5, 8], {
          br: [{ if: { s: 10 }, to: "sach" }, { to: "dut_diem" }],
        }),
        S("sach", ["Thương hội bị giải tán", "The guild disbanded"], ["Thương hội bị giải tán, người bị hại được đền một phần.", "The guild is dissolved, and victims receive part compensation."], [2, 3], { end: true, wfx: { flag: "phuong_thi_sach" } }),
        S("dut_diem", ["Vụ việc bị dìm", "The case is buried"], ["Vụ án bị dìm. Thương hội đổi tên, đan rẻ lại ra chợ.", "The case is buried. The guild changes its name, and cheap pills return."], [2, 3], { end: true, wfx: { flag: "phuong_thi_ban" } }),
      ],
    },
    {
      id: "tranh_mach", g: "tong_mon", tier: 2, w: 3, n: ["Tranh Linh Mạch", "War for the Vein"], roles: { foe: "strong", ally: "strong" }, sect: true,
      stages: [
        S("phat_hien", ["Linh mạch mới lộ", "A new vein found"], ["Động đất làm lộ một linh mạch lớn, ngay trên ranh đất của {sect}.", "An earthquake exposes a great vein on the border of {sect}."], [4, 8], {
          ev: EV({ sect: true, realm: [1] }, ["Linh mạch mới", "A new vein"], ["Trưởng lão họp gấp. {ally} muốn chiếm trước, người của {foe} đã có mặt ở đó.", "The elders convene. {ally} wants to seize it first, but {foe}'s people are already there."], [
            O(["Đề nghị chia sẻ theo năm", "Propose sharing by year"], ["Tiếng cười rộ lên, nhưng có người nghe.", "They laugh, but some listen."], { ds: 8, led: { bao: 3 }, cf: "chia_se" }, "chinh"),
            O(["Tình nguyện đi trước chiếm giữ", "Volunteer to seize it"], ["Bạn cắm cờ tông môn lên mỏ.", "You plant the sect flag on the vein."], { ds: 12, contrib: 10, led: { pha: 2 } }, "ta", { duel: { off: 0, rf: ["Đối phương đông hơn, bạn rút về với vết thương.", "They outnumber you, and you withdraw wounded."], fxf: { hp: -25, contrib: 3 } } }),
          ]),
        }),
        S("giao_tranh", ["Giao tranh ở mỏ", "Skirmishes at the vein"], ["Đệ tử hai bên đánh nhau ở cửa mỏ. Số người chết tăng dần.", "Disciples clash at the mine. The dead keep rising."], [6, 12], { br: [{ if: { f: "chia_se" }, to: "hiep_uoc" }, { if: { s: 20 }, to: "thang" }, { if: { lt: -15 }, to: "thua" }, { to: "dai_chien" }] }),
        S("dai_chien", ["Đại chiến hai tông", "All-out war"], ["Không ai rút được nữa. {ally} và {foe} giao đấu trên đỉnh mỏ.", "No one can back out now. {ally} and {foe} duel atop the vein."], [5, 10], {
          ev: EV({ sect: true, realm: [2] }, ["Đại chiến", "All-out war"], ["Tông môn tổng động viên. Bạn được giao giữ cổng phía đông, nơi cũng có đường tắt vào hầm linh mạch.", "The sect mobilizes. You are given the east gate, which also leads into the vein tunnels."], [
            O(["Giữ cổng", "Hold the gate"], ["Cổng không vỡ, tên bạn được khắc.", "The gate holds, and your name is carved."], { ds: 15, contrib: 12, led: { bao: 4 } }, "chinh", { duel: { off: 0, rf: ["Cổng vỡ, bạn được kéo về từ đống xác.", "The gate falls, and you are dragged out from the bodies."], fxf: { hp: -35, ds: -5 } } }),
            O(["Bỏ cổng, lẻn vào hầm lấy linh thạch", "Abandon the gate for the tunnels"], ["Túi bạn đầy. Cổng phía đông vỡ.", "Your pouch is full. The east gate falls."], { s: 8, ds: -15, dt: -10, flag: "bo_cong", wound: { hua: 4 } }, "ta"),
          ]),
          br: [{ if: { dead: "foe" }, to: "thang" }, { if: { dead: "ally" }, to: "thua" }, { if: { s: 0 }, to: "thang" }, { to: "thua" }],
        }),
        S("hiep_uoc", ["Hiệp ước linh mạch", "The Vein Accord"], ["Hai tông chia mỏ theo năm. Hiệp ước này tồn tại lâu hơn người ký nó.", "They share the vein by year. The accord outlives those who signed it."], [2, 3], { end: true, wfx: { sect: { vein: 1 }, flag: "hiep_uoc_mach" } }),
        S("thang", ["{sect} giữ được mỏ", "The vein is held"], ["{sect} giữ được mỏ, linh khí trong tông dày thêm.", "{sect} keeps the vein, and qi thickens in the sect."], [2, 3], { end: true, wfx: { sect: { vein: 1, terr: 1 } } }),
        S("thua", ["{sect} mất mỏ", "The vein is lost"], ["{sect} mất mỏ và thêm một vùng đất.", "{sect} loses the vein and more land besides."], [2, 3], { end: true, wfx: { sect: { terr: -1, store: -60 } } }),
      ],
    },
    {
      id: "thien_tai", g: "nhan_duyen", tier: 2, w: 3, n: ["Kỳ Tài Một Đời", "The Genius of an Age"], roles: { ally: "any", foe: "any" },
      stages: [
        S("noi_len", ["Một thiên tài nổi lên", "A genius rises"], ["{ally} đột phá liên tiếp, cả thiên hạ bàn tán. Có người nói đây là kỳ tài trăm năm.", "{ally} breaks through again and again, and the world talks of a once-in-a-century talent."], [8, 14], {
          ev: EV({ age: [16], realm: [1] }, ["Tên trên miệng người", "A name on every lip"], ["Bạn gặp {ally} ở phường thị. Người ấy nhỏ tuổi hơn bạn, mắt thâm vì thiếu ngủ.", "You meet {ally} at the market, younger than you, eyes dark from lack of sleep."], [
            O(["Bắt chuyện", "Strike up a talk"], ["{ally} nói chuyện như người chưa từng có bạn.", "{ally} talks like someone who has never had a friend."], { ds: 8, cf: "ban", stat: { tamCanh: 2 } }, "chinh"),
            O(["Thách đấu để thử", "Challenge to test them"], ["Trận này ai cũng nhớ.", "Everyone remembers this match."], { ds: -3, stat: { ngoTinh: 3 } }, "trung", { duel: { off: 1, rf: ["Bạn thua trong ba chiêu, và hiểu vì sao họ bàn tán.", "You lose in three moves, and see why they talk."], fxf: { hp: -10, stat: { ngoTinh: 4 } } } }),
          ]),
        }),
        S("do_ky", ["Đố kỵ", "Envy"], ["Có kẻ muốn {ally} không sống tới Nguyên Anh. {foe} được thấy ở gần đó.", "Someone wants {ally} never to reach Nascent Soul. {foe} has been seen nearby."], [6, 10], {
          ev: EV({ realm: [2], age: [20] }, ["Lời mời lạ", "A strange invitation"], ["{foe} mời bạn góp tay: \"Một tên kỳ tài đủ làm cả tông môn không ngẩng đầu được nữa. Ngươi cũng thế thôi.\"", "{foe} invites you in: \"One genius and no one else can lift their head. Same for you.\""], [
            O(["Báo cho {ally}", "Warn {ally}"], ["{ally} im lặng rất lâu rồi nói cảm ơn. Có lẽ chưa từng ai nói việc này với họ.", "{ally} is silent for long, then thanks you. Perhaps no one has ever warned them."], { ds: 18, led: { thien: 5 }, trace: { k: "an_nhan", t: ["Bạn đã cứu một kỳ tài khỏi âm mưu.", "You saved a genius from a plot."], key: "cuu_ky_tai", w: 35 } }, "chinh"),
            O(["Góp tay", "Join in"], ["Việc thành. Bạn được chia phần, và không ngủ ngon nữa.", "It succeeds. You get a share, and no more good sleep."], { ds: -25, s: 6, dt: -15, wound: { sat: 4 }, cf: "hai" }, "ta"),
          ]),
          br: [{ if: { f: "hai" }, to: "ngoc_vo" }, { if: { dead: "ally" }, to: "ngoc_vo" }, { if: { s: 10 }, to: "lon" }, { to: "sa_nga" }],
        }),
        S("lon", ["Kỳ tài lập đạo", "The genius founds a way"], ["{ally} qua được kiếp nạn, lập nên một đạo pháp riêng. Nhiều người theo học.", "{ally} survives and founds a way of their own. Many come to learn."], [2, 3], { end: true, wfx: { flag: "ky_tai_lap_dao" } }),
        S("sa_nga", ["Kỳ tài sa ngã", "The genius falls"], ["Cô độc quá lâu, {ally} bỏ tông môn đi theo con đường khác.", "Alone for too long, {ally} leaves the sect for another path."], [2, 3], { end: true, wfx: { flag: "ky_tai_sa_nga" } }),
        S("ngoc_vo", ["Viên ngọc vỡ", "A broken jade"], ["Tin {ally} vong mạng làm cả thiên hạ im lặng một lúc. Rồi người ta lại đi tu tiếp.", "News of {ally}'s death silences the world a while. Then people go back to cultivating."], [2, 3], { end: true, wfx: { kill: "ally" } }),
      ],
    },
    {
      id: "bc_sup", g: "bi_canh", tier: 2, w: 2, n: ["Bí Cảnh Sụp Đổ", "The Collapsing Realm"], roles: { ally: "any", foe: "any" },
      stages: [
        S("mo", ["Bí cảnh thượng cổ mở", "An ancient realm opens"], ["Một bí cảnh thượng cổ tự mở, và ngày càng rộng. Có người vào không ra.", "An ancient realm opens on its own, and keeps growing. Some who enter do not leave."], [6, 10], {
          ev: EV({ realm: [2] }, ["Cửa càng mở càng rộng", "A widening door"], ["Trận pháp giữ bí cảnh đã hỏng. Nếu không vá, nó sẽ nuốt cả vùng. Bên trong còn nhiều báu vật.", "The sealing array has broken. Unpatched, it will swallow the region. There is still treasure inside."], [
            O(["Cùng {ally} vá trận", "Patch the array with {ally}"], ["Đá trận vào đúng chỗ, cửa chậm lại.", "The stones fall into place, and the door slows."], { ds: 18, mast: { tran_dao: 6 }, led: { bao: 5 } }, "chinh", { pay: 1 }),
            O(["Vào vơ báu vật trước", "Loot it first"], ["Bạn ra kịp, vác nặng cả hai vai.", "You get out in time, heavy on both shoulders."], { s: 7, ds: -10, led: { su: 3 } }, "ta", { duel: { off: 0, rf: ["Thủ vệ không để bạn lấy gì ra.", "The guardians let you take nothing out."], fxf: { hp: -30 } } }),
          ]),
        }),
        S("lan", ["Vết nứt lan ra", "Cracks spread"], ["Vết nứt lan ra ngoài, hai trấn biến mất qua một đêm.", "The cracks spread, and two towns vanish overnight."], [6, 12], { br: [{ if: { s: 15 }, to: "van" }, { to: "nuot" }] }),
        S("van", ["Bí cảnh được phong", "The realm sealed"], ["Các trận sư phong được bí cảnh, biến nó thành nơi rèn luyện có trông coi.", "Array masters seal the realm, and turn it into a guarded training ground."], [2, 3], { end: true, wfx: { flag: "bc_phong" } }),
        S("nuot", ["Một vùng đất biến mất", "A land swallowed"], ["Cả một vùng biến mất khỏi bản đồ. Từ đó chỉ còn một cái hồ tròn hoàn hảo.", "A whole region disappears from the map. Only a perfectly round lake remains."], [2, 3], { end: true, wfx: { vein: -1, flag: "ho_tron" } }),
      ],
    },
    {
      id: "loi_kiep_lan", g: "thien_kiep", tier: 2, w: 2, n: ["Kiếp Lôi Vô Chủ", "The Masterless Tribulation"], roles: { ally: "strong" },
      stages: [
        S("dau", ["Mây kiếp vô chủ", "Clouds with no owner"], ["Một đám mây kiếp không thuộc về ai đang trôi qua các trấn, sét đánh bừa.", "A tribulation cloud with no owner drifts across the towns, striking at random."], [5, 9], {
          ev: EV({ realm: [2] }, ["Mây kiếp vô chủ", "Clouds with no owner"], ["Mây đang trôi về phía trấn nhỏ. {ally} bảo: phải có người nhận lấy kiếp này, mây mới tan.", "The cloud drifts toward a small town. {ally} says: only someone taking it upon themselves will clear it."], [
            O(["Nhận kiếp thay trấn", "Take it for the town"], ["Bạn nhận đạo lôi mà không có gì để được. Trấn còn nguyên.", "You take the bolts with nothing to gain. The town stands."], { hp: -35, ds: 25, led: { thien: 10, nghich: 5 }, cult: 3 }, "chinh"),
            O(["Dẫn mây về phía tông địch", "Lead it toward a rival"], ["Một tông môn gặp nạn, không ai biết vì sao.", "A rival sect suffers, and no one knows why."], { ds: -10, led: { su: 6 }, dt: -10 }, "ta"),
            O(["Giúp dời dân", "Help move the people"], ["Trấn mất, người còn.", "The town is lost, the people live."], { ds: 8, led: { thien: 4 } }),
          ]),
        }),
        S("ket", ["Mây kiếp lớn dần", "The clouds grow"], ["Mây lớn dần, nuốt thêm các đám mây khác. Trận sư các nơi đều bó tay.", "It grows, swallowing other clouds. Array masters everywhere are helpless."], [6, 10], { br: [{ if: { s: 15 }, to: "tan" }, { to: "giang" }] }),
        S("tan", ["Mây kiếp tan", "The clouds clear"], ["Có người nhận đủ đạo lôi, mây tan. Trời xanh như chưa có gì.", "Someone takes enough bolts, and the clouds clear. The sky is blue as if nothing happened."], [2, 3], { end: true, wfx: { flag: "troi_nhe" } }),
        S("giang", ["Trận lôi trăm năm", "The hundred-year storm"], ["Đạo lôi giáng xuống suốt ba năm. Từ đó kiếp lôi vùng này nặng hơn.", "Lightning falls for three years, and tribulations here have grown heavier since."], [2, 3], { end: true, wfx: { flag: "troi_nang", vein: -1 } }),
      ],
    },
    {
      id: "nhat_thuc", g: "thien_tuong", tier: 2, w: 2, n: ["Nhật Thực Trăm Năm", "The Century Eclipse"], roles: { foe: "any", ally: "any" },
      stages: [
        S("dau", ["Điềm báo nhật thực", "Omens of an eclipse"], ["Tinh quan các tông đều tính ra một lần nhật thực dài chưa từng có.", "Every sect's astrologers calculate an eclipse of unprecedented length."], [6, 10]),
        S("toi", ["Trời tối ba ngày", "Three dark days"], ["Mặt trời tắt trong ba ngày. Yêu thú và ma tu tràn ra, người tu chính đạo mất nửa sức.", "The sun goes out for three days. Beasts and demon cultivators swarm while the orthodox lose half their strength."], [3, 5], {
          ev: EV({ age: [10] }, ["Ba ngày tối", "Three dark days"], ["Trời tối đen giữa trưa. Tiếng khóc khắp làng. {foe} cầm đuốc đi từng nhà đòi nộp đồ, nói là để lập đàn cầu mặt trời.", "Black at noon. Weeping across the village. {foe} goes door to door with a torch, demanding tribute for a sun altar."], [
            O(["Thắp lửa giữa làng, gom mọi người lại", "Light a fire and gather everyone"], ["Ba ngày đó không ai trong làng bị lạc.", "No one in the village is lost those three days."], { ds: 10, led: { thien: 5 }, stat: { tamCanh: 3 } }, "chinh"),
            O(["Theo {foe} chia phần", "Follow {foe} for a share"], ["Đêm dài thật có lợi cho vài người.", "A long night favours some."], { ds: -8, s: 4, dt: -8 }, "ta"),
            O(["Bế quan hút âm khí", "Seclude and draw on the dark"], ["Không có ban ngày, âm khí rất đặc.", "With no day, the dark qi is thick."], { mast: { thuy_phap: 5 }, cult: 2 }),
          ]),
        }),
        S("sang", ["Mặt trời trở lại", "The sun returns"], ["Mặt trời trở lại. Người ta đếm xem còn lại bao nhiêu.", "The sun returns. People count who remains."], [2, 3], { br: [{ if: { s: 5 }, to: "tot" }, { to: "xau" }] }),
        S("tot", ["Dân tin tu sĩ hơn", "Faith in cultivators"], ["Sau ba ngày tối, dân chúng tin vào người tu hơn. Nhiều đứa trẻ được gửi lên núi.", "After the dark, the people trust cultivators more. Many children are sent to the mountains."], [2, 3], { end: true, wfx: { flag: "dan_tin" } }),
        S("xau", ["Dân sợ tu sĩ", "Fear of cultivators"], ["Sau ba ngày tối, dân chúng sợ người tu. Nhiều nơi đóng cổng với họ.", "After the dark, the people fear cultivators. Many places close their gates to them."], [2, 3], { end: true, wfx: { flag: "dan_so" } }),
      ],
    },
    {
      id: "nguoi_sua_so", g: "nhan_qua", tier: 3, w: 2, n: ["Người Sửa Sổ", "The One Who Edits the Book"], roles: { foe: "strong" }, when: { minYear: 1040 },
      stages: [
        S("dau", ["Người chết sống lại", "The dead return"], ["Có người đã chôn lại đi trên phố, không nhớ mình từng chết. Sổ Sinh Tử có gì đó sai.", "People who were buried walk the streets, not remembering they died. Something is wrong with the Book."], [8, 14], {
          ev: EV({ life: [2], realm: [1] }, ["Người đáng ra đã chết", "One who should be dead"], ["Một người hàng xóm đã chết từ mùa trước đang tưới rau. Bà chào bạn như không có gì. Một quỷ sai cũng đang đứng nhìn, trông rất bối rối.", "A neighbour dead since last season is watering vegetables and greets you as usual. A messenger of the underworld also stands watching, deeply confused."], [
            O(["Giúp quỷ sai điều tra", "Help the messenger"], ["Quỷ sai ghi tên bạn vào phía có ơn.", "He writes your name on the side of favours."], { ds: 12, led: { bao: 4 }, trace: { k: "an_nhan", t: ["Bạn đã giúp Địa phủ tra việc sửa sổ.", "You helped the underworld investigate the Book."], key: "giup_dia_phu" } }, "chinh"),
            O(["Giấu bà đi", "Hide her"], ["Bà sống thêm một mùa rau. Quỷ sai ghi tên bạn vào phía khác.", "She lives another season of vegetables. The messenger writes you on the other side."], { ds: -8, led: { su: 8, thien: 3 }, cf: "giau" }),
          ]),
        }),
        S("lo", ["Kẻ đứng sau lộ diện", "The hand behind"], ["{foe} đã lén sửa tên trong Sổ cho những người trả giá cao. Địa phủ truy lùng.", "{foe} has been secretly editing names for those who pay. The underworld hunts."], [8, 12], {
          ev: EV({ life: [2], realm: [2] }, ["Lời đề nghị của người sửa sổ", "The editor's offer"], ["{foe} tìm tới bạn: \"Ta có thể xóa tên ngươi khỏi một lần chết. Chỉ cần nói ra tên ba người.\"", "{foe} finds you: \"I can strike your name from one death. Just give me three others.\""], [
            O(["Đưa ba cái tên", "Give three names"], ["Ba người bạn từng biết chết trong năm đó. Thọ nguyên bạn thêm ra.", "Three people you knew die that year. Your lifespan grows."], { life: 25, ds: -20, dt: -20, led: { su: 15, sat: 6 }, trace: { k: "ke_thu", t: ["Bạn đã đổi mạng ba người lấy thọ nguyên.", "You traded three lives for your own span."], key: "ba_ten", w: 60 } }, "ta"),
            O(["Bắt hắn giao Địa phủ", "Seize him for the underworld"], ["Hắn gào lên rằng trong Sổ có tên bạn.", "He screams that your name is in the Book."], { ds: 25, led: { bao: 6 } }, "chinh", { duel: { off: 1, rf: ["Hắn cào một đường lên tay bạn, vết thương không chịu lành.", "He claws your arm, and the wound refuses to heal."], fxf: { hp: -30, life: -5 } } }),
          ]),
          br: [{ if: { s: 15 }, to: "bat" }, { if: { dead: "foe" }, to: "bat" }, { to: "loan" }],
        }),
        S("bat", ["Người sửa sổ bị bắt", "The editor caught"], ["Địa phủ bắt được kẻ sửa sổ. Những cái tên đã sửa lần lượt về đúng chỗ.", "The underworld catches the editor. The altered names slowly return to their places."], [2, 3], { end: true, wfx: { kill: "foe", flag: "so_ngay" } }),
        S("loan", ["Sinh tử rối loạn", "Life and death in disorder"], ["Sổ Sinh Tử rối loạn hàng chục năm. Người đáng chết không chết, người đáng sống bỗng đổ xuống.", "The Book is in disorder for decades. Those due to die do not, and those due to live collapse."], [2, 3], { end: true, wfx: { flag: "so_loan" } }),
      ],
    },
    {
      id: "chan_menh", g: "thien_menh", tier: 3, w: 1, n: ["Thiên Mệnh Chi Tử", "Heaven's Chosen"], roles: { ally: "any", foe: "strong" }, when: { minYear: 1060 },
      stages: [
        S("dau", ["Lời tiên tri", "The prophecy"], ["Trời giáng dị tượng khi {ally} ra đời lại. Cả thiên hạ nói đây là người được Thiên Mệnh chọn.", "Omens fall as {ally} comes of age. The world says Heaven has chosen them."], [10, 16], {
          ev: EV({ realm: [2], age: [20] }, ["Người được chọn", "The chosen one"], ["{ally} không muốn làm người được chọn, tìm tới bạn hỏi có thể đổi được không. Phía sau bạn, {foe} đang chờ câu trả lời.", "{ally} never wanted to be chosen, and asks if it can be changed. Behind you, {foe} awaits the answer."], [
            O(["\"Ngươi chọn lấy đời mình\"", "\"You choose your own life\""], ["{ally} khóc rồi cười. Thiên Đạo không thích câu này.", "{ally} weeps, then laughs. Heaven does not like these words."], { ds: 15, led: { nghich: 8, thien: 5 }, cf: "tu_chon" }, "chinh"),
            O(["Giúp {foe} đoạt mệnh", "Help {foe} seize the fate"], ["Mệnh có thể đoạt thật. Giá thì khác.", "Fate can indeed be seized. The price is another matter."], { ds: -20, cult: 5, led: { su: 12 }, dt: -15 }, "ta"),
            O(["Không can thiệp", "Do not intervene"], ["Việc của trời cứ để trời lo.", "Let Heaven handle Heaven's affairs."], {}),
          ]),
        }),
        S("tranh", ["Tranh đoạt thiên mệnh", "The struggle for fate"], ["{foe} truy sát {ally}, muốn đoạt Thiên Mệnh về mình.", "{foe} hunts {ally}, seeking the fate for himself."], [8, 14], { br: [{ if: { f: "tu_chon" }, to: "tu_do" }, { if: { dead: "ally" }, to: "doat" }, { if: { s: 10 }, to: "thanh" }, { to: "doat" }] }),
        S("tu_do", ["Người bỏ Thiên Mệnh", "One who left fate"], ["{ally} từ bỏ Thiên Mệnh, sống như người thường. Mệnh ấy tan vào khắp thiên hạ.", "{ally} abandons the destiny and lives plainly. The fate scatters across the world."], [2, 3], { end: true, wfx: { flag: "menh_tan" } }),
        S("thanh", ["Thiên Mệnh hoàn thành", "Fate fulfilled"], ["{ally} hoàn thành Thiên Mệnh và phi thăng giữa ban ngày. Không ai hỏi họ có muốn không.", "{ally} fulfils the destiny and ascends in daylight. No one asks if they wanted to."], [2, 3], { end: true, wfx: { flag: "menh_thanh" } }),
        S("doat", ["Thiên Mệnh bị đoạt", "Fate stolen"], ["{foe} đoạt được Thiên Mệnh. Trời cũng không làm gì, và đó là điều đáng sợ nhất.", "{foe} seizes the fate. Heaven does nothing, and that is the most frightening part."], [2, 3], { end: true, wfx: { flag: "menh_doat", kill: "ally" } }),
      ],
    },
    {
      id: "thuong_minh", g: "kinh_te", tier: 1, w: 3, n: ["Thương Minh Độc Quyền", "The Merchant Monopoly"], roles: { foe: "any" },
      stages: [
        S("dau", ["Thương minh gom chợ", "The league buys the markets"], ["Một thương minh mới do {foe} đứng đầu mua dần các phường thị. Giá bắt đầu lên.", "A new league led by {foe} buys up the markets. Prices start rising."], [8, 14], {
          ev: EV({ age: [18], focus: ["kiem_tien", "du_ngoan"] }, ["Lời mời vào hội", "An invitation"], ["{foe} mời bạn góp vốn vào thương minh, bảo chỉ cần gật đầu là có lãi mỗi năm. Những tiểu thương không vào hội đang phải đóng cửa.", "{foe} invites you to invest: nod and profit each year. The stalls that refuse are closing."], [
            O(["Góp vốn", "Invest"], ["Tiền đến đều đặn.", "The money comes steadily."], { s: 5, ds: -10, dt: -4 }, "ta", { pay: 2 }),
            O(["Lập chợ riêng cho tiểu thương", "Open a market for small traders"], ["Chợ nhỏ, nhưng đông.", "A small market, but busy."], { ds: 15, led: { thien: 4 } }, "chinh", { pay: 2 }),
          ]),
        }),
        S("ep", ["Giá linh thạch leo thang", "Prices climb"], ["Muốn mua gì cũng phải qua thương minh. Tán tu bắt đầu kêu.", "Everything goes through the league now. Rogues begin to complain."], [8, 12], { br: [{ if: { s: 10 }, to: "vo" }, { to: "tri" }] }),
        S("vo", ["Thương minh tan vỡ", "The league collapses"], ["Tiểu thương liên kết, thương minh sụp vì nợ.", "Small traders unite, and the league collapses into debt."], [2, 3], { end: true, wfx: { flag: "cho_tu_do" } }),
        S("tri", ["Thương minh thống trị", "The league rules"], ["Thương minh đứng trên cả tông môn nhỏ.", "The league stands above small sects."], [2, 3], { end: true, wfx: { flag: "thuong_minh_tri" } }),
      ],
    },
    {
      id: "duoc_vien", g: "ky_ngo", tier: 1, w: 3, n: ["Khu Vườn Của Dược Lão", "The Herb-Elder's Garden"], roles: { ally: "any" },
      stages: [
        S("dau", ["Vườn thuốc không chủ", "A garden without an owner"], ["Dược lão {ally} để lại vườn thuốc rồi đi biệt. Người ta bắt đầu tới hái trộm.", "Herb-elder {ally} leaves a garden and disappears. People begin to steal from it."], [8, 12], {
          ev: EV({ age: [12], focus: ["du_ngoan", "luyen_dan"] }, ["Vườn của Dược Lão", "The Herb-Elder's Garden"], ["Trong vườn có ghi: \"Ai hái một cây, trồng lại một cây.\" Có nhiều chỗ đất đã trống.", "A sign reads: \"Pick one, plant one.\" Much of the soil is bare."], [
            O(["Hái một cây, trồng một cây", "Pick one, plant one"], ["Cây non bén rễ. Bạn quay lại vài lần sau đó.", "The seedling takes root. You return a few times after."], { mat: { linh_thao: 2 }, ds: 12, led: { thien: 3 } }, "chinh"),
            O(["Hái sạch những gì quý", "Strip the best"], ["Túi đầy.", "A full bag."], { mat: { linh_thao: 5 }, s: 2, ds: -15, dt: -4 }, "ta"),
          ]),
        }),
        S("sau", ["Vườn sau nhiều năm", "The garden years later"], ["Tin về khu vườn đã lan xa.", "Word of the garden has spread far."], [8, 12], { br: [{ if: { s: 5 }, to: "xanh" }, { to: "tan" }] }),
        S("xanh", ["Vườn xanh trở lại", "The garden thrives"], ["Người qua đường vẫn giữ lệ hái một trồng một. Vườn rộng ra cả sườn núi.", "Passers-by keep the rule. The garden now covers a hillside."], [2, 3], { end: true, wfx: { flag: "vuon_xanh" } }),
        S("tan", ["Vườn hoang", "The garden dies"], ["Vườn trơ đất. Tấm biển còn đó, không ai đọc.", "The soil lies bare. The sign remains, unread."], [2, 3], { end: true, wfx: {} }),
      ],
    },
    {
      id: "chuyen_kiep", g: "tu_luyen", tier: 2, w: 2, n: ["Dịch Tẩu Hỏa", "The Plague of Madness"], roles: { foe: "any", ally: "any" },
      stages: [
        S("dau", ["Người tu lần lượt phát điên", "Cultivators go mad"], ["Khắp nơi có tu sĩ đang tọa thiền thì phát điên, miệng lặp cùng một câu kinh.", "Everywhere cultivators go mad in meditation, repeating the same line of scripture."], [6, 10], {
          ev: EV({ realm: [1], focus: "tu_luyen" }, ["Một câu kinh lạ", "A strange line"], ["Trong lúc nhập định, bạn nghe một câu kinh không thuộc về mình. Nó rất đẹp, và bạn muốn đọc tiếp.", "In meditation you hear a line of scripture not your own. It is beautiful, and you want to continue."], [
            O(["Dừng hẳn, nhờ {ally} kiểm tra", "Stop, and ask {ally} to check"], ["{ally} tìm ra câu đó xuất phát từ một cuốn kinh giả đang lan truyền.", "{ally} traces it to a false scripture in circulation."], { ds: 15, stat: { tamMa: -5 }, cf: "tim_ra" }, "chinh"),
            O(["Đọc tiếp", "Continue"], ["Tu vi tăng nhanh lạ thường. Bạn không biết mình đang cười.", "Your cultivation leaps. You do not notice that you are smiling."], { cult: 4, stat: { tamMa: 12 }, ds: -8 }, "ta"),
          ]),
        }),
        S("lan", ["Kinh giả lan truyền", "The false canon spreads"], ["Cuốn kinh được bán khắp nơi. {foe} là một trong những người phát hành.", "The canon sells everywhere. {foe} is among its publishers."], [8, 12], { br: [{ if: { f: "tim_ra" }, to: "dep" }, { if: { s: 10 }, to: "dep" }, { to: "tan_pha" }] }),
        S("dep", ["Kinh giả bị thiêu", "The canon burned"], ["Các tông cùng thiêu kinh giả. Những người chưa điên hẳn dần tỉnh lại.", "The sects burn the false canon together. Those not fully gone slowly recover."], [2, 3], { end: true, wfx: { kill: "foe" } }),
        S("tan_pha", ["Một đời tu sĩ mất", "A generation lost"], ["Một đời tu sĩ phát điên. Các tông mất phần lớn trưởng lão trẻ.", "A generation goes mad, and the sects lose most of their young elders."], [2, 3], { end: true, wfx: { vein: -1, flag: "the_he_mat" } }),
      ],
    },
    {
      id: "phan_su", g: "tong_mon", tier: 1, w: 3, n: ["Đại Hội Khai Sơn", "The Grand Opening"], roles: { ally: "any" }, sect: true,
      stages: [
        S("dau", ["Tông môn mở cửa nhận đệ tử", "The sect opens its gates"], ["{sect} mở đại hội tuyển đệ tử sau nhiều năm, hàng ngàn thiếu niên kéo về.", "{sect} holds its first recruitment in years, and thousands of youths arrive."], [4, 7], {
          ev: EV({ sect: true, realm: [1], rank: [1] }, ["Người khảo hạch", "The examiner"], ["Bạn được cử làm khảo hạch. Một thiếu niên căn cốt xuất sắc nhưng xuất thân nô bộc, trưởng lão khẽ lắc đầu.", "You are an examiner. A youth of superb root but slave birth stands before you, and an elder gently shakes his head."], [
            O(["Vẫn nhận", "Accept anyway"], ["Thiếu niên ấy cúi đầu thật lâu.", "The youth bows for a long time."], { ds: 15, led: { thien: 4 }, contrib: -2, trace: { k: "de_tu", t: ["Bạn đã nhận một thiếu niên xuất thân nô bộc vào tông.", "You admitted a slave-born youth to the sect."], key: "nhan_no_boc" } }, "chinh"),
            O(["Làm theo trưởng lão", "Follow the elder"], ["Một suất cho con nhà có tiền.", "The place goes to a rich family's child."], { s: 3, contrib: 3, ds: -5 }, "ta"),
          ]),
        }),
        S("sau", ["Lứa đệ tử mới", "The new generation"], ["Lứa đệ tử mới đã trưởng thành.", "The new generation has grown up."], [10, 15], { br: [{ if: { s: 5 }, to: "hung" }, { to: "tram" }] }),
        S("hung", ["{sect} hưng thịnh", "{sect} flourishes"], ["Lứa đệ tử xuất thân đa dạng đưa {sect} lên.", "A diverse generation lifts {sect}."], [2, 3], { end: true, wfx: { sect: { store: 40, terr: 1 } } }),
        S("tram", ["{sect} trì trệ", "{sect} stagnates"], ["Con cháu trưởng lão chiếm hết suất, {sect} chậm lại.", "Elders' kin take every place, and {sect} slows."], [2, 3], { end: true, wfx: { sect: { store: -20 } } }),
      ],
    },
    {
      id: "ban_gia_truyen", g: "nhan_duyen", tier: 1, w: 3, n: ["Chuyện Gia Tộc Sa Sút", "A Clan in Decline"], roles: { ally: "any", foe: "any" },
      stages: [
        S("dau", ["Gia tộc sa sút", "A clan declines"], ["Gia tộc của {ally} sa sút, đất đai bị {foe} mua dần.", "{ally}'s clan declines, and {foe} slowly buys their land."], [8, 12], {
          ev: EV({ age: [20], realm: [1] }, ["Người bán gia phả", "The one selling the genealogy"], ["{ally} định bán cả gia phả cho {foe} để trả nợ, trong đó có bí pháp gia truyền.", "{ally} means to sell the family records to {foe} for debts, including the clan's secret art."], [
            O(["Cho vay không lấy lãi", "Lend without interest"], ["{ally} giữ được gia phả.", "{ally} keeps the records."], { ds: 15, led: { thien: 3 }, trace: { k: "an_nhan", t: ["Bạn từng giữ được gia phả cho một gia tộc.", "You once saved a clan's records."], key: "gia_pha" } }, "chinh", { pay: 2 }),
            O(["Mua lại trước {foe}", "Buy it before {foe}"], ["Bí pháp giờ là của bạn.", "The secret art is yours now."], { cult: 3, ds: -5 }, "trung", { pay: 3 }),
          ]),
        }),
        S("sau", ["Nhiều năm sau", "Years later"], ["Mối quan hệ giữa hai nhà đã khác trước.", "Things between the two houses have changed."], [10, 14], { br: [{ if: { s: 5 }, to: "dung" }, { to: "mat" }] }),
        S("dung", ["Gia tộc gượng dậy", "The clan recovers"], ["Nhà {ally} gượng dậy nhờ một lứa con cháu giỏi.", "{ally}'s house recovers through a talented generation."], [2, 3], { end: true, wfx: {} }),
        S("mat", ["Gia tộc tan", "The clan scatters"], ["Nhà {ally} tan đàn xẻ nghé, mỗi người một nơi.", "{ally}'s house scatters to the winds."], [2, 3], { end: true, wfx: {} }),
      ],
    },
  ]);

  // ---------- Mạch đời NPC: chạy theo năm, không cần người chơi ----------

  const H = () => root.VK2The;
  const push = (w, t, tier = 1) => Su.pushWorld(w, { y: w.year, t, tier });
  const mem = (n, w, t) => {
    n.mem.push([w.year, t]);
    if (n.mem.length > 4) n.mem.shift();
  };

  Su.defineArc([
    {
      // Đệ tử bị trục xuất, vào Ma Tông, thành trưởng lão, quay lại báo thù
      id: "phan_do",
      when: (w, n, r) => !!n.s && w.sects[n.s]?.lean !== "ta" && n.pe === "cuong" && r(0) < 0.5,
      steps: [
        { run: (w, n) => {
          n.oldS = n.s;
          n.s = null;
          mem(n, w, ["Bị trục xuất khỏi tông", "Expelled from the sect"]);
          push(w, [`${n.n} bị trục xuất khỏi ${n.oldS}.`, `${n.n} is expelled from ${n.oldS}.`]);
        } },
        { wait: [4, 10], run: (w, n) => {
          const dark = Object.values(w.sects).find((s) => s.lean === "ta");
          if (dark) n.s = dark.n;
          n.go = "thu";
          mem(n, w, [`Gia nhập ${dark?.n ?? "ma đạo"}`, `Joined ${dark?.n ?? "the demons"}`]);
          push(w, [`${n.n} gia nhập ${dark?.n ?? "ma đạo"}.`, `${n.n} joins ${dark?.n ?? "the demons"}.`]);
        } },
        { wait: [10, 20], run: (w, n) => {
          n.r = Math.min(H().REALM_MAX, n.r + 1);
          mem(n, w, ["Thành trưởng lão ma đạo", "Became a demon elder"]);
          push(w, [`${n.n} đã thành trưởng lão ma đạo, đang nhòm về ${n.oldS}.`, `${n.n} is now a demon elder, eyeing ${n.oldS}.`]);
        } },
        { wait: [8, 15], run: (w, n) => {
          const old = w.sects[n.oldS];
          if (old) {
            old.store = Math.max(0, old.store - 60);
            old.terr = Math.max(1, old.terr - 1);
          }
          (w.flags = w.flags ?? {}).phan_do_ve = w.year;
          mem(n, w, [`Trả thù ${n.oldS}`, `Took revenge on ${n.oldS}`]);
          push(w, [`${n.n} dẫn ma quân quay về đánh ${n.oldS}, báo thù năm xưa.`, `${n.n} leads demons back against ${n.oldS}, for the old grudge.`], 2);
        } },
      ],
    },
    {
      // Tán tu mạnh tự lập tông, tồn tại thật trong thế giới
      id: "lap_tong",
      when: (w, n, r) => !n.s && n.r >= 3 && r(1) < 0.25 && Object.keys(w.sects).length < 14,
      steps: [
        { run: (w, n) => {
          mem(n, w, ["Thu nhận đồ đệ đầu tiên", "Took a first disciple"]);
          push(w, [`Tán tu ${n.n} bắt đầu thu nhận đồ đệ.`, `The rogue ${n.n} begins taking disciples.`]);
        } },
        { wait: [8, 16], run: (w, n) => {
          const name = `${n.n.split(" ")[0]} Môn`;
          if (w.sects[name] || (w.gone ?? []).some((g) => g.n === name)) return false;
          const sec = H().sectOf(w, name);
          if (!sec) return false;
          sec.prot = false;
          sec.lean = n.pe === "cuong" ? "ta" : "trung";
          n.s = name;
          push(w, [`${n.n} lập nên ${name}.`, `${n.n} founds ${name}.`], 2);
        } },
      ],
    },
    {
      // Người ẩn cư: rời tông về già, dạy lũ trẻ trong làng, để lại một đứa học trò
      id: "an_si",
      when: (w, n, r) => n.r >= 2 && H().ageOf(w, n) > n.lo * 0.7 && r(2) < 0.3,
      steps: [
        { run: (w, n) => {
          n.s = null;
          n.go = "yen";
          mem(n, w, ["Về ở ẩn", "Went into retirement"]);
        } },
        { wait: [5, 10], run: (w, n) => {
          const kid = H().addNpc(w, { old: false, par: n.id });
          kid.teach = (kid.teach ?? 0) + 1;
          mem(kid, w, [`Học trò của ${n.n}`, `Pupil of ${n.n}`]);
          push(w, [`${n.n} ở ẩn, dạy dỗ một đứa trẻ tên ${kid.n}.`, `${n.n}, in retirement, teaches a child named ${kid.n}.`]);
        } },
      ],
    },
  ]);

  // Sự kiện người chơi nối với mạch đời NPC: chỉ xuất hiện khi NPC thật đang ở đúng giai đoạn.
  Su.define([
    {
      id: "arc_phan_do", g: "nhan_duyen", tier: 2, when: { realm: [1], age: [18], npc: "arc:phan_do:2" }, who: "arc:phan_do:2", t: ["Trưởng lão từng bị đuổi", "The elder once expelled"], x: ["{npc} từng là đệ tử chính đạo, nay gặp bạn ở quán trọ, gọi hai chén rượu. \"Ngươi cũng từng thấy họ đối xử với kẻ yếu thế nào.\"", "{npc}, once of the orthodox, meets you at an inn and orders two cups. \"You too have seen how they treat the weak.\""],
      c: [
        { l: ["Nghe hắn nói hết", "Hear him out"], r: ["Có những câu bạn không cãi được. Hắn bỏ đi, để lại một địa chỉ.", "Some of it you cannot dispute. He leaves an address."], lean: "trung", fx: { aff: 15, stat: { ngoTinh: 2 } } },
        { l: ["Khuyên hắn quay đầu", "Urge him to turn back"], r: ["Hắn cười, nhưng lần đầu sau nhiều năm im lặng một lúc.", "He laughs, but for the first time in years falls silent a moment."], lean: "chinh", fx: { aff: 5, led: { thien: 3 } } },
        { l: ["Ra tay trừ hại", "Strike him down"], r: ["Ma đạo mất một trưởng lão.", "The demons lose an elder."], lean: "ta", fx: { led: { sat: 4, bao: 2 }, aff: -40 }, duel: { off: 1, rf: ["Hắn để lại một vết trên ngực bạn, rồi uống nốt chén rượu.", "He leaves a mark on your chest, and finishes his cup."], fxf: { hp: -30, aff: -20 } } },
      ],
    },
    {
      id: "arc_an_si", g: "nhan_duyen", tier: 1, when: { age: [8, 40], npc: "arc:an_si:1" }, who: "arc:an_si:1", t: ["Ông giáo làng", "The village teacher"], x: ["Làng có một ông giáo già lạ, dạy lũ trẻ chữ mà nói như giảng đạo. Người ta gọi ông là {npc}.", "The village has a strange old teacher who teaches letters as if lecturing on the Dao. They call him {npc}."],
      c: [
        { l: ["Xin theo học", "Ask to study"], r: ["Ông dạy bạn đúng ba chữ, dùng được cả đời.", "He teaches you just three words, useful for life."], lean: "chinh", fx: { stat: { ngoTinh: 3, tamCanh: 3 }, aff: 20 } },
        { l: ["Hỏi về chuyện cũ của ông", "Ask about his past"], r: ["Ông chỉ cười, chỉ tay về phía núi.", "He only smiles, and points at the mountain."], lean: "trung", fx: { stat: { khiVan: 2 } } },
      ],
    },
    // Hậu quả lâu dài của chuỗi: chỉ có khi thế giới thực sự đã đi tới kết cục đó, kể cả từ nhiều kiếp trước.
    {
      id: "hq_hoa_uoc", g: "linh_thu", tier: 1, when: { wflag: "hoa_uoc_yeu", age: [12], focus: ["du_ngoan", "tru_yeu"] }, t: ["Cột mốc hòa ước", "The treaty stone"], x: ["Đi tới ranh rừng, bạn thấy cột đá hòa ước năm xưa. Một con yêu thú ngồi cạnh cột, nhìn bạn mà không gầm.", "At the forest line stands the old treaty stone. A beast sits beside it, watching without a growl."],
      c: [
        { l: ["Cúi chào nó", "Bow to it"], r: ["Nó vẫy đuôi một cái, rồi quay vào rừng.", "It flicks its tail once and turns back into the trees."], lean: "chinh", fx: { mast: { yeu_huyet: 2 }, stat: { tamCanh: 2 } } },
        { l: ["Vượt ranh đi săn", "Cross and hunt"], r: ["Yêu đan ngon lành. Hòa ước vốn chỉ là đá.", "A fine core. A treaty is only stone."], lean: "ta", fx: { mat: { yeu_dan: 2 }, led: { pha: 3 } } },
      ],
    },
    {
      id: "hq_troi_nang", g: "thien_kiep", tier: 1, when: { wflag: "troi_nang", realm: [2] }, t: ["Bầu trời nặng", "A heavy sky"], x: ["Từ trận lôi trăm năm, người vùng này ngước lên đều thấy nặng. Trận sư bảo muốn đột phá nên đi xa hơn.", "Since the hundred-year storm, the sky here feels heavy. Array masters advise going far before breaking through."],
      c: [
        { l: ["Đi xa đột phá", "Travel far to break through"], r: ["Tốn đường, nhưng lòng nhẹ hơn.", "A long road, but a lighter heart."], lean: "chinh", fx: { s: -2, stat: { tamCanh: 3 } } },
        { l: ["Ở lại luyện với đạo lôi", "Stay and train in the lightning"], r: ["Da sạm đi, thân rắn lại.", "Your skin darkens and your body hardens."], lean: "trung", fx: { hp: -12, mast: { loi_phap: 5 } } },
      ],
    },
    {
      id: "hq_so_loan", g: "nhan_qua", tier: 2, when: { wflag: "so_loan", life: [2] }, t: ["Sổ đọc nhầm tên", "A misread name"], x: ["Quỷ sai đến đòi mạng một người trùng tên bạn, nhìn sổ rồi nhìn bạn. Sổ Sinh Tử vẫn đang loạn từ sau vụ người sửa sổ.", "A messenger comes for someone with your name, and looks from book to you. The Book is still in disorder since the editor."],
      c: [
        { l: ["Bảo ông đi nhầm rồi", "Tell him he's mistaken"], r: ["Ông lật qua lật lại, rồi xin lỗi, đi tiếp.", "He flips pages, apologises and goes."], lean: "chinh", fx: { stat: { khiVan: 3 } } },
        { l: ["Hối lộ để gạch hẳn", "Bribe him to strike it"], r: ["Ông gạch một đường. Từ đó bạn thấy gió lạnh sau gáy.", "He strikes a line. Since then you feel a cold wind on your neck."], lean: "ta", pay: 4, fx: { life: 8, led: { su: 8 } } },
      ],
    },
    {
      id: "hq_dan_so", g: "the_gioi", tier: 1, when: { wflag: "dan_so", realm: [1], focus: "du_ngoan" }, t: ["Cổng trấn đóng với tu sĩ", "Gates closed to cultivators"], x: ["Từ sau ba ngày tối, trấn này treo biển: tu sĩ không được vào. Một đứa nhỏ ném đá vào bạn.", "Since the three dark days, this town has posted: no cultivators. A child throws a stone at you."],
      c: [
        { l: ["Để yên, đi vòng", "Let it be and go around"], r: ["Hòn đá không đau. Câu nói của mẹ đứa bé mới đau.", "The stone does not hurt. Its mother's words do."], lean: "chinh", fx: { stat: { tamCanh: 3 } } },
        { l: ["Bước qua cổng", "Walk through the gate"], r: ["Không ai dám cản. Cả trấn đóng cửa khi bạn đi qua.", "No one dares stop you. Doors close as you pass."], lean: "ta", fx: { dt: -4, s: 1 } },
      ],
    },
    {
      id: "hq_ky_tai", g: "nhan_duyen", tier: 1, when: { wflag: "ky_tai_lap_dao", realm: [1], age: [16] }, t: ["Học phái của kỳ tài", "The genius's school"], x: ["Người theo đạo pháp mới của vị kỳ tài năm xưa mở lớp giảng miễn phí.", "Followers of the old genius's way offer free lectures."],
      c: [
        { l: ["Đến nghe", "Attend"], r: ["Cách nghĩ mới, không phải ai cũng hợp, nhưng bạn học được một chút.", "A new way of thinking. Not for everyone, but you learn a little."], lean: "chinh", fx: { cult: 2, stat: { ngoTinh: 2 } } },
        { l: ["Tranh luận cho vỡ lẽ", "Debate them"], r: ["Hai bên đều không thua, cũng đều ghi nhớ.", "Neither side loses, and both remember."], lean: "trung", fx: { stat: { tamCanh: 2, ngoTinh: 1 } } },
      ],
    },
  ]);
})(typeof globalThis !== "undefined" ? globalThis : this);
