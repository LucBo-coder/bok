// Sự kiện đơn của hệ thống sự kiện động, theo 12 nhóm. Mỗi sự kiện có nguyên do trong điều kiện, và hậu quả có thể mở sự kiện khác.
// Khóa: when = điều kiện, who = người liên quan, ex = nhóm loại trừ, once mặc định true, cd = năm hồi nếu lặp lại.
// Hậu quả: s = linh thạch theo cảnh giới, stat, dt = đạo tâm, wound, led, mat, mast, flag = dấu trong kiếp, aflag = dấu tài khoản, trace = nhân quả xuyên kiếp.
(function (root) {
  "use strict";
  const E = (id, g, tier, when, t, x, c, o = {}) => ({ id, g, tier, when, t, x, c, ...o });
  const O = (l, r, fx, lean = "trung", o = {}) => ({ l, r, fx, lean, ...o });

  root.VK2Su.define([
    // ---------- 1. Kỳ ngộ ngẫu nhiên ----------
    E("ky_lao_cai", "ky_ngo", 0, { age: [8, 30], focus: "du_ngoan" }, ["Lão ăn mày bên cầu", "The beggar at the bridge"], ["Một lão ăn mày chìa bát về phía bạn. Trong bát có một mảnh ngọc vỡ, lão như không biết.", "An old beggar holds out his bowl. There is a shard of jade in it, and he seems not to know."], [
      O(["Cho lão bữa cơm", "Buy him a meal"], ["Lão ăn xong, gõ nhẹ vào trán bạn rồi đi. Đầu óc bạn sáng ra một chút.", "He eats, taps your brow and leaves. Your mind feels a little clearer."], { s: -1, stat: { ngoTinh: 3 }, led: { thien: 3 }, flag: "cuu_lao_cai" }, "chinh"),
      O(["Lấy mảnh ngọc", "Take the shard"], ["Bạn lấy mảnh ngọc. Lão nhìn theo, cười không ra tiếng.", "You take the shard. He watches you go, laughing without a sound."], { s: 3, dt: -4, flag: "lay_ngoc_lao_cai" }, "ta"),
      O(["Đi qua", "Walk past"], ["Bạn đi qua. Tiếng bát gõ xuống đá vọng theo một đoạn.", "You walk on. The sound of the bowl on stone follows you for a while."], {}),
    ]),
    E("ky_lao_cai_2", "ky_ngo", 1, { age: [25, 90], realm: [2], done: "ky_lao_cai", flag: "cuu_lao_cai" }, ["Người từng ăn xin", "He who once begged"], ["Một vị đạo nhân chặn bạn trên đường. Bạn nhận ra đôi tay gõ bát năm xưa.", "A daoist stops you on the road. You know those hands that once tapped a bowl."], [
      O(["Hành lễ, xin chỉ giáo", "Bow and ask for teaching"], ["Ông giảng cho bạn một canh giờ, rồi tan vào sương. Những gì nghe được còn nguyên.", "He teaches you for an hour, then fades into mist. What you heard remains."], { cult: 3, stat: { tamCanh: 4 }, trace: { k: "an_nhan", t: ["Đạo nhân từng ăn xin bên cầu đã chỉ giáo bạn.", "The daoist who once begged at the bridge taught you."], key: "lao_cai", n: "?" } }, "chinh"),
      O(["Hỏi vì sao ông giả làm kẻ ăn xin", "Ask why he played the beggar"], ["\"Để xem ai còn nhìn người chứ không nhìn áo.\" Ông để lại một lọ thuốc.", "\"To see who still looks at the person, not the clothes.\" He leaves you a vial."], { stat: { sucKhoe: 15 }, mast: { dan_dao: 3 } }),
    ]),
    E("ky_ruong_chim", "ky_ngo", 0, { age: [12, 80], focus: ["du_ngoan", "tru_yeu"] }, ["Thuyền chìm dưới hồ", "The sunken boat"], ["Nước cạn sau mùa khô để lộ một con thuyền cũ. Trong khoang còn hòm đồ, và một bộ xương ôm hòm.", "The dry season lowers the lake and reveals an old boat. There is a chest in the hold, and a skeleton holding it."], [
      O(["Lấy hòm, an táng bộ xương", "Take the chest, bury the bones"], ["Bạn đắp nấm mộ rồi mở hòm. Người chết đã giữ nó đủ lâu.", "You raise a small grave and open the chest. The dead has guarded it long enough."], { s: 4, led: { thien: 2 } }, "chinh"),
      O(["Lấy hòm, mặc kệ", "Take the chest and leave"], ["Hòm nặng tay. Đêm đó bạn ngủ không yên.", "The chest is heavy. You sleep poorly that night."], { s: 5, stat: { tamMa: 2 } }, "ta"),
      O(["Không đụng vào", "Leave it"], ["Có những thứ nên để hồ giữ.", "Some things are for the lake to keep."], { stat: { tamCanh: 2 } }),
    ]),
    E("ky_quan_tro", "ky_ngo", 0, { age: [10, 60], focus: "du_ngoan" }, ["Gánh hát rong", "The travelling troupe"], ["Gánh hát diễn tích một vị tiên nhân. Lời ca có một đoạn lạ, nghe như khẩu quyết bị người đời hát sai.", "A troupe performs the tale of an immortal. One verse sounds like a cultivation chant sung wrong by generations."], [
      O(["Nghe hết, ghi lại đoạn đó", "Stay and note the verse"], ["Bạn sửa vài chữ theo cảm giác. Luồng khí trong người chạy êm hơn.", "You correct a few words by feel. Your qi flows smoother."], { stat: { ngoTinh: 2 } }, "trung", { ck: { on: "ngoTinh", at: 40, p: 0.7, rf: ["Bạn sửa sai một chữ, khí nghịch một lúc. Không sao, nhưng mất buổi.", "You correct the wrong word and your qi kicks back. No harm, only a lost afternoon."], fxf: { hp: -4 } } }),
      O(["Thưởng cho gánh hát", "Tip the troupe"], ["Trưởng gánh cảm ơn, bảo từ nay đi đâu cũng sẽ kể về bạn.", "The leader thanks you, and says they will tell of you wherever they go."], { s: -1, stat: { khiVan: 3 }, flag: "gia_hat" }, "chinh"),
    ]),
    E("ky_dua_be", "ky_ngo", 1, { age: [30, 200], realm: [2], tam: [-20] }, ["Đứa bé bị bỏ lại", "The abandoned child"], ["Làng vừa qua cơn yêu loạn. Một đứa bé ngồi giữa nhà cháy, căn cốt trong trẻo lạ thường.", "A village has just survived a beast raid. A child sits in a burned house, with a strangely clear root."], [
      O(["Mang theo nuôi dạy", "Raise the child"], ["Đứa bé bám áo bạn suốt đường. Sau này nó sẽ có tên có tuổi.", "The child clings to your robe all the way. One day that name will be known."], { led: { thien: 5 }, flag: "nuoi_dua_be", trace: { k: "de_tu", t: ["Bạn đã cứu một đứa bé trong làng cháy.", "You saved a child from a burned village."], key: "dua_be" } }, "chinh"),
      O(["Gửi vào tông môn gần nhất", "Leave the child with a sect"], ["Bạn để lại linh thạch và đi. Có lẽ thế là đủ.", "You leave some stones and go. Perhaps that is enough."], { s: -2, led: { thien: 2 } }),
      O(["Đi tiếp", "Move on"], ["Bạn không quay đầu. Một vết nhỏ nằm lại trong lòng.", "You do not look back. A small mark stays in your heart."], { wound: { mat: 2 } }, "ta"),
    ]),
    E("ky_co_mo", "ky_ngo", 1, { age: [15, 120], realm: [1], khi: [55] }, ["Mộ cổ sau mưa", "An old tomb after rain"], ["Mưa lớn làm sạt sườn núi, lộ ra cửa mộ. Khí vận của bạn đủ để cửa không tự đóng.", "Heavy rain has torn a hillside open and revealed a tomb door. Your fortune is enough to keep it from closing."], [
      O(["Vào trong", "Go in"], ["Mộ chủ để lại công pháp dở dang. Bạn học được vài phần.", "The owner left an unfinished manual. You learn a part of it."], { cult: 2, mast: { hon_thuat: 4 } }, "trung", { duel: { off: -1, rf: ["Thi vệ đánh bạn văng ra cửa. Bạn lết về, tay trắng.", "A tomb guard throws you out of the door. You crawl home with nothing."], fxf: { hp: -25 } } }),
      O(["Lấp lại cho người đã khuất", "Seal it for the dead"], ["Bạn đắp đất, thắp nhang. Trong lòng nhẹ đi.", "You pile the earth back and light incense. Your heart lightens."], { stat: { tamCanh: 4 }, led: { thien: 3 } }, "chinh"),
    ]),
    E("ky_tieu_nhi", "ky_ngo", 0, { age: [6, 14] }, ["Con diều mắc trên cây", "A kite in the tree"], ["Bọn trẻ trong xóm nhờ bạn trèo lấy con diều. Cành cây rất cao.", "The village children ask you to climb for their kite. The branch is very high."], [
      O(["Trèo lên", "Climb"], ["Bạn lấy được diều, và thấy từ trên cao làng mình nhỏ đến thế nào.", "You get the kite, and see how small your village is from up there."], { stat: { khiVan: 1, ngoTinh: 1 } }, "chinh"),
      O(["Bảo chúng tự trèo", "Tell them to climb"], ["Một đứa ngã xước đầu gối. Từ đó bọn trẻ ít rủ bạn hơn.", "One of them scrapes a knee. They invite you less after that."], { dt: -1 }),
    ]),
    E("ky_thu_nhi", "ky_ngo", 0, { age: [60, 400], realm: [1] }, ["Bức thư gửi nhầm", "A letter gone astray"], ["Một lá thư gửi cho người cùng tên với bạn, đã mất từ trăm năm. Mực vẫn chưa phai.", "A letter for someone with your name, dead for a century. The ink has not faded."], [
      O(["Đọc thư", "Read it"], ["Chỉ là lời mẹ gửi con. Bạn ngồi đó lâu hơn bạn nghĩ.", "Only a mother writing to her child. You sit there longer than you meant to."], { stat: { tamCanh: 3 }, wound: { mat: 1 } }),
      O(["Đốt đi, gửi cho người đã khuất", "Burn it, send it to the dead"], ["Khói bay thẳng lên, không tan.", "The smoke rises straight and does not scatter."], { led: { thien: 2 } }, "chinh"),
    ]),

    // ---------- 2. Tu luyện và tâm ma ----------
    E("tu_tau_hoa", "tu_luyen", 0, { realm: [1, 6], focus: "tu_luyen", tamma: [25] }, ["Khí nghịch đêm khuya", "Qi reversal at midnight"], ["Giữa lúc nhập định, luồng khí bỗng chảy ngược. Tâm ma trong bạn đã lớn hơn bạn tưởng.", "Mid-meditation your qi runs backward. The demon in you has grown more than you thought."], [
      O(["Dừng lại, tán công", "Stop and disperse the qi"], ["Mất mấy tháng công phu, nhưng kinh mạch còn nguyên.", "Months of work lost, but your meridians are intact."], { stat: { tamMa: -6 }, cult: -1 }, "chinh"),
      O(["Cắn răng vận tiếp", "Grit your teeth and push"], ["Khí chạy hết một vòng. Bạn mạnh lên một chút.", "The qi completes its circuit. You are a little stronger."], { cult: 2 }, "ta", { ck: { on: "tamCanh", at: 50, p: 0.5, rf: ["Máu trào ra miệng. Bạn nằm liệt mấy ngày.", "Blood fills your mouth. You lie still for days."], fxf: { hp: -30, stat: { tamMa: 6 } } } }),
    ], { cd: 40, once: false, ex: "tam_ma", excd: 15 }),
    E("tu_bai_trial", "tu_luyen", 3, { realm: [2], fails: [8] }, ["Khảo nghiệm của kẻ ngã nhiều lần", "Trial of the often-fallen"], ["Đêm ấy, bạn gặp lại chính mình ở mỗi lần thất bại. Từng người đứng thành hàng, im lặng nhìn bạn.", "That night you meet yourself from every failure. They stand in a line, silent, looking at you."], [
      O(["Đi qua từng người, nhận lấy", "Walk past each, accept them"], ["Tới người cuối cùng, hàng người tan đi. Vết thất bại không còn nặng như trước.", "At the last one the line dissolves. Those failures no longer weigh as they did."], { wound: { bai: -8 }, stat: { tamCanh: 8 }, flag: "qua_khao_nghiem" }, "chinh", { ck: { on: "tamCanh", at: 40, p: 0.6, rf: ["Bạn quay lưng giữa chừng. Họ đi theo bạn vào giấc ngủ.", "You turn back halfway. They follow you into sleep."], fxf: { stat: { tamMa: 10 } } } }),
      O(["Rút kiếm chém qua", "Cut through them"], ["Họ không chống cự. Bạn mạnh hơn, và lạnh hơn.", "They do not resist. You are stronger, and colder."], { cult: 4, dt: -8, wound: { bai: -4, sat: 3 } }, "ta"),
    ], { hidden: true }),
    E("tu_vong_cu", "tu_luyen", 0, { realm: [1, 3], age: [14, 50], focus: "tu_luyen" }, ["Tiếng gọi về nhà", "A call from home"], ["Tin từ quê báo mẹ già đau nặng, đúng lúc bạn sắp phá quan.", "Word comes that your aged mother is gravely ill, just as you are about to break through."], [
      O(["Về ngay", "Go home"], ["Bạn kịp ở bên bà những ngày cuối. Tâm bạn tĩnh lại, dù công phu dở dang.", "You are with her in her last days. Your mind grows still, though the work is unfinished."], { stat: { tamCanh: 6 }, led: { thien: 3 } }, "chinh"),
      O(["Bế quan xong mới về", "Finish first"], ["Bạn phá quan thành công. Về tới nơi chỉ còn nấm mộ mới.", "You break through. When you arrive, there is only a new grave."], { cult: 3, wound: { mat: 8, hua: 3 } }, "ta"),
    ]),
    E("tu_kiem_tam", "tu_luyen", 3, { path: "kiem", mast: { kiem_y: 60 }, realm: [3], tamcanh: [45] }, ["Tàn hồn Kiếm Tiên", "The Sword Immortal's remnant"], ["Trên vách đá có một đường kiếm đã phai. Bạn nhìn lâu, và đường kiếm nhìn lại bạn.", "A faded sword cut lines the cliff. You look at it for a long time, and it looks back."], [
      O(["Cầm kiếm, đối một chiêu", "Draw and answer with one stroke"], ["Tàn hồn gật đầu, tan vào lưỡi kiếm của bạn.", "The remnant nods, and melts into your blade."], { mast: { kiem_y: 12 }, stat: { tamCanh: 5 }, trace: { k: "truyen_thua", t: ["Tàn hồn một vị Kiếm Tiên đã công nhận bạn.", "A Sword Immortal's remnant acknowledged you."], key: "kiem_tien" } }, "chinh", { duel: { off: 1, rf: ["Một chiêu ấy đã rạch áo bạn tới tim. Tàn hồn không nói gì, chỉ chờ lần sau.", "That one stroke opens your robe to the heart. The remnant says nothing, and waits."], fxf: { hp: -35, mast: { kiem_y: 4 } } } }),
      O(["Chỉ quan sát, không động kiếm", "Only watch"], ["Bạn ngồi ba ngày. Khi đứng dậy, tay cầm kiếm đã khác.", "You sit for three days. When you rise, your sword hand has changed."], { mast: { kiem_y: 5 } }),
    ], { hidden: true, acctOnce: true }),
    E("tu_di_hoa", "tu_luyen", 3, { path: "dan", el: "hoa", realm: [2], mast: { dan_dao: 25 } }, ["Dị hỏa dưới mạch đất", "Strange fire below the earth"], ["Lò của bạn cháy sáng khác thường khi đặt trên khe núi này. Sâu bên dưới có một ngọn lửa đang thở.", "Your furnace burns strangely bright over this ravine. Far below, a fire is breathing."], [
      O(["Xuống thu phục", "Go down and tame it"], ["Bạn dùng chính đan điền làm lò, giữ được một tia dị hỏa.", "You use your own dantian as the furnace, and keep a spark of it."], { mast: { dan_dao: 10, hoa_phap: 10 }, mat: { hoa_tinh: 4 } }, "trung", { ck: { on: "tamCanh", at: 55, p: 0.55, rf: ["Lửa đốt ngược lên kinh mạch. Bạn thoát được, tay còn run mấy tháng.", "The fire burns up your meridians. You escape, and your hands shake for months."], fxf: { hp: -30, mat: { hoa_tinh: 1 } } } }),
      O(["Ghi lại vị trí, bán cho đan hội", "Sell the location to the guild"], ["Đan hội trả giá cao và nhớ tên bạn.", "The guild pays well and remembers your name."], { s: 8, contrib: 5 }),
      O(["Để nó yên", "Let it be"], ["Có những ngọn lửa không phải để dùng.", "Some fires are not for use."], { stat: { tamCanh: 3 } }, "chinh"),
    ], { hidden: true }),
    E("tu_phat_toa", "tu_luyen", 2, { path: "phat", tam: [40], realm: [2] }, ["Hòa thượng ngồi giữa sa mạc", "A monk in the desert"], ["Vị sư già ngồi đó không biết đã bao năm, cát phủ tới ngực. Ông hỏi bạn một câu: \"Ai đang đi?\"", "The old monk has sat for who knows how long, sand to his chest. He asks: \"Who is walking?\""], [
      O(["Ngồi xuống bên ông", "Sit with him"], ["Ba ngày sau bạn không còn nhớ câu hỏi, và không cần nữa.", "Three days later you no longer recall the question, and no longer need to."], { mast: { phat_phap: 8 }, stat: { tamMa: -8 } }, "chinh"),
      O(["Đào ông lên", "Dig him out"], ["Ông cười, rồi tan thành cát. Trong tay bạn còn một hạt bồ đề.", "He laughs and turns to sand. A bodhi seed stays in your hand."], { stat: { ngoTinh: 4 }, led: { thien: 2 } }),
    ]),
    E("tu_ma_cong", "tu_luyen", 1, { path: "ma", realm: [2], tam: [-100, -20] }, ["Cuốn ma kinh còn sót", "A surviving demon sutra"], ["Cuốn kinh viết bằng máu ghi một cách tu nhanh gấp ba, đổi bằng mạng người khác.", "A sutra written in blood teaches thrice the speed, paid in other lives."], [
      O(["Luyện theo", "Practise it"], ["Tu vi tăng vọt. Tiếng người khóc ở đâu đó trong đầu không còn tắt.", "Your power surges. Someone keeps crying somewhere in your head."], { cult: 5, led: { cam: 10, sat: 6 }, stat: { tamMa: 8 } }, "ta"),
      O(["Đốt nó", "Burn it"], ["Trang giấy kêu lên khi cháy. Ma tu cũng có thứ không muốn thành.", "The pages scream as they burn. Even a demon cultivator has things not to become."], { dt: 6, stat: { tamCanh: 4 } }, "chinh"),
      O(["Giữ lại, chưa luyện", "Keep it, unread"], ["Bạn cất nó thật sâu. Không ai cất được thứ đó mãi.", "You hide it deep. No one hides such a thing forever."], { flag: "giu_ma_kinh", stat: { tamMa: 2 } }),
    ]),
    E("tu_ma_kinh_doi", "tu_luyen", 2, { flag: "giu_ma_kinh", age: [40], tamma: [10] }, ["Kinh tự mở", "The sutra opens itself"], ["Cuốn kinh bạn cất đã nằm mở trên bàn. Bạn không nhớ đã lấy ra.", "The hidden sutra lies open on your table. You do not recall taking it out."], [
      O(["Luyện một lần cho biết", "Practise once, just to know"], ["Không có lần thứ nhất nào chỉ là một lần.", "No first time is only once."], { cult: 4, led: { cam: 12 }, stat: { tamMa: 10 } }, "ta"),
      O(["Mang tới Phật tự phong ấn", "Take it to be sealed"], ["Sư trụ trì nhận kinh, không hỏi gì. Bạn ngủ được một đêm trọn.", "The abbot takes it without a question. You sleep a whole night."], { stat: { tamMa: -10 }, led: { thien: 4 } }, "chinh"),
    ]),

    // ---------- 3. Tông môn ----------
    E("tm_nhiem_vu", "tong_mon", 0, { sect: true, rank: [0, 1], age: [12, 80] }, ["Nhiệm vụ của ngoại môn", "An outer-sect errand"], ["Chấp sự giao đi thu thuế các làng dưới núi. Một làng vừa mất mùa, trưởng làng quỳ xin hoãn.", "The steward sends you to collect tax from the villages below. One just lost its harvest, and its elder kneels to beg for time."], [
      O(["Hoãn cho họ, tự bù vào", "Grant it and cover the gap"], ["Bạn nộp đủ bằng tiền túi. Làng ấy nhớ ơn bạn.", "You pay from your own purse. That village remembers."], { s: -2, led: { thien: 3 }, contrib: 2, flag: "on_lang" }, "chinh"),
      O(["Thu đủ", "Collect in full"], ["Chấp sự khen bạn được việc.", "The steward praises your efficiency."], { contrib: 5, dt: -3 }, "ta"),
      O(["Báo cáo lại tình hình", "Report the situation"], ["Chấp sự cau mày, nhưng ghi vào sổ.", "The steward frowns, but writes it down."], { contrib: 2 }),
    ]),
    E("tm_lang_tra_on", "tong_mon", 1, { flag: "on_lang", age: [25, 150] }, ["Dân làng lên núi", "The village climbs the mountain"], ["Năm yêu loạn, chính làng năm xưa gánh gạo lên núi cho bạn, không ai bảo.", "In the year of the beast raids, that same village carries rice up the mountain for you, unasked."], [
      O(["Nhận và xuống giúp họ giữ làng", "Accept, and go down to defend them"], ["Bạn đánh lui lũ yêu. Tên bạn được khắc trên bia làng.", "You drive the beasts off. Your name is carved on the village stone."], { led: { thien: 5 }, stat: { tamCanh: 3 }, mat: { yeu_dan: 1 } }, "chinh", { duel: { off: -2, rf: ["Yêu quá đông. Bạn cứu được người, nhưng bị thương nặng.", "Too many beasts. You save the people, but are badly hurt."], fxf: { hp: -25, led: { thien: 3 } } } }),
      O(["Nhận gạo, ở lại trên núi", "Take the rice and stay"], ["Bạn được no. Trên núi nhìn xuống, khói vẫn bốc lên.", "You eat. From the mountain you can see the smoke."], { wound: { hua: 3 } }, "ta"),
    ], {}),
    E("tm_doan_truong", "tong_mon", 1, { sect: true, rank: [1], realm: [2] }, ["Trưởng lão ép tội", "An elder's accusation"], ["Một đệ tử bị vu trộm kho đan. Bạn biết thật ra là cháu của trưởng lão.", "A disciple is framed for robbing the pill store. You know it was the elder's nephew."], [
      O(["Đứng ra làm chứng", "Testify"], ["Oan được giải, nhưng từ nay trưởng lão ghi nhớ bạn.", "The disciple is cleared, but the elder will not forget you."], { led: { thien: 4 }, contrib: -3, flag: "chong_truong_lao", trace: { k: "ke_thu", t: ["Một trưởng lão ghi hận vì bạn làm chứng.", "An elder holds a grudge for your testimony."], key: "truong_lao", w: 25 } }, "chinh"),
      O(["Im lặng", "Stay silent"], ["Đệ tử kia bị trục xuất khỏi tông. Hắn nhìn bạn khi bước qua cổng.", "The disciple is expelled. He looks at you as he passes the gate."], { dt: -5, wound: { hua: 2 }, flag: "de_bi_truc" }, "ta"),
      O(["Bí mật báo cho chưởng môn", "Tell the sect head in secret"], ["Chưởng môn xử kín. Không ai biết là bạn, ngoại trừ ông.", "The head settles it quietly. No one but he knows it was you."], { contrib: 4 }),
    ]),
    E("tm_truc_quay_ve", "tong_mon", 2, { flag: "de_bi_truc", age: [40], sect: true }, ["Kẻ bị trục xuất quay về", "The expelled returns"], ["Người năm xưa bị trục xuất nay đứng dưới chân núi, áo đen, sau lưng là một đội ma tu. Hắn gọi tên bạn.", "The disciple once expelled stands at the foot of the mountain in black, a band of demon cultivators behind him. He calls your name."], [
      O(["Một mình xuống gặp", "Go down alone"], ["Hắn nghe xong lời xin lỗi muộn màng rồi cười. \"Ta không đến vì ngươi.\" Đội ma tu rút đi.", "He hears your late apology and laughs. \"I did not come for you.\" The band withdraws."], { wound: { hua: -4 }, stat: { tamCanh: 5 }, sect: { store: -20 } }, "chinh"),
      O(["Dẫn đệ tử ra đánh", "Lead the disciples out"], ["Trận này giữ được sơn môn.", "The gate holds."], { contrib: 8, s: 4, led: { sat: 3 } }, "trung", { duel: { off: 0, rf: ["Sơn môn vỡ một góc, bạn bị đánh bay khỏi tường.", "A corner of the gate falls, and you are thrown from the wall."], fxf: { hp: -30, sect: { store: -40, terr: -1 } } } }),
    ]),
    E("tm_dai_bi", "tong_mon", 0, { sect: true, age: [15, 60], realm: [1, 3] }, ["Đại bỉ trong tông", "The sect tournament"], ["Đại bỉ mười năm một lần. Đối thủ của bạn ở vòng đầu là {npc}.", "The decennial tournament. Your first opponent is {npc}."], [
      O(["Đánh hết sức", "Fight with everything"], ["Bạn thắng trong tiếng hò reo.", "You win amid the cheers."], { contrib: 6, s: 2 }, "chinh", { duel: { off: 0, rf: ["Bạn thua, nhưng học được một chiêu.", "You lose, but learn a move."], fxf: { hp: -10, stat: { ngoTinh: 2 } } } }),
      O(["Giữ sức, nhường trận", "Save your strength and yield"], ["Không ai nhớ trận này, kể cả bạn.", "No one remembers this bout, not even you."], { stat: { tamCanh: 1 } }),
    ], { who: "peer", once: false, cd: 30 }),
    E("tm_chia_re", "tong_mon", 2, { sect: true, rank: [2], realm: [3] }, ["Hai phe trong tông", "Two factions in the sect"], ["Chưởng môn sắp tọa hóa. Đại trưởng lão muốn mở rộng, nhị trưởng lão muốn thủ. Cả hai đều cần tiếng nói của bạn.", "The sect head nears the end. The first elder wants to expand, the second to hold. Both need your voice."], [
      O(["Ủng hộ mở rộng", "Back expansion"], ["Tông môn thêm đất, thêm thù.", "The sect gains land, and enemies."], { sect: { terr: 1 }, led: { pha: 3 }, contrib: 6 }, "ta"),
      O(["Ủng hộ phòng thủ", "Back defence"], ["Tông môn yên ổn, kho đầy dần.", "The sect stays safe and its stores fill."], { sect: { store: 60 }, led: { bao: 4 }, contrib: 6 }, "chinh"),
      O(["Đứng ngoài", "Stay out"], ["Cả hai phe đều không ưa bạn nữa.", "Neither faction likes you now."], { contrib: -4, stat: { tamCanh: 2 } }),
    ]),
    E("tm_mat_ky", "tong_mon", 1, { sect: true, age: [20], tam: [-100, -10], rank: [1] }, ["Mật thám của địch", "An enemy's offer"], ["Người của tông địch đưa bạn túi linh thạch, đổi lấy sơ đồ đại trận.", "An enemy sect's man offers you a purse for the map of the great array."], [
      O(["Bán", "Sell it"], ["Bạn có tiền. Trong lòng biết sẽ có ngày phải trả.", "You have the money, and know a day will come."], { s: 10, dt: -10, flag: "ban_tong", led: { pha: 5 }, trace: { k: "tong", t: ["Bạn từng bán sơ đồ đại trận của {sect}.", "You once sold the array map of your sect."], key: "ban_tong", w: 40 } }, "ta"),
      O(["Bắt hắn giao cho tông", "Seize him for the sect"], ["Bạn được ghi công.", "You are commended."], { contrib: 10, led: { bao: 3 } }, "chinh", { duel: { off: -1, rf: ["Hắn chạy thoát sau khi để lại cho bạn một vết sâu.", "He escapes, leaving you a deep cut."], fxf: { hp: -15 } } }),
    ]),

    // ---------- 4. Bí cảnh và truyền thừa ----------
    E("bc_ban_do", "bi_canh", 1, { realm: [1], focus: ["du_ngoan", "kiem_tien"], stones: 2 }, ["Tấm bản đồ rách", "A torn map"], ["Tay buôn ở phường thị rao một mảnh bản đồ. Theo ông ta, nó dẫn tới động phủ cổ tu.", "A market trader sells half a map. It leads, he swears, to an ancient abode."], [
      O(["Mua", "Buy it"], ["Lần này thì không phải đồ giả. Có một lối vào đang mở.", "This one is real. An entrance has opened."], { open: "dong_phu" }, "trung", { pay: 2 }),
      O(["Trả giá thấp đến mức ông ta bỏ đi", "Haggle him away"], ["Vài năm sau bạn nghe có người giàu lên nhờ tấm bản đồ đó.", "Years later you hear someone grew rich off that map."], { stat: { tamCanh: 1 } }),
    ]),
    E("bc_co_tu", "bi_canh", 2, { realm: [3], mast: { hon_thuat: 10 } }, ["Hồn cổ tu còn sót", "An ancient's lingering soul"], ["Trong động phủ hoang có một tàn hồn đang tự đọc lại chính lời mình. Hắn xin bạn một đoạn thọ nguyên để nói hết câu.", "In a ruined abode a remnant recites itself. It asks for a piece of your lifespan to finish the sentence."], [
      O(["Đổi 10 năm thọ", "Give ten years"], ["Câu nói ấy là khẩu quyết cuối mà hắn giấu suốt đời.", "The sentence is the last chant he hid his whole life."], { life: -10, cult: 6, mast: { hon_thuat: 8 } }),
      O(["Từ chối, cho hắn được yên", "Refuse, and let him rest"], ["Bạn đọc kinh siêu độ. Tàn hồn im lặng lần đầu sau ngàn năm.", "You chant the rites. For the first time in a thousand years the voice stops."], { led: { thien: 5 }, stat: { tamCanh: 4 } }, "chinh"),
      O(["Ép hỏi bằng hồn thuật", "Force it with soul arts"], ["Bạn có câu trả lời và một tiếng thét không bao giờ quên.", "You get an answer, and a scream you will never forget."], { cult: 4, led: { cam: 6 }, stat: { tamMa: 6 } }, "ta"),
    ]),
    E("bc_truyen_nhan", "bi_canh", 3, { realm: [4], tam: [30], tamcanh: [50] }, ["Thử thách người kế thừa", "Trial of the heir"], ["Một vị đại năng để lại ý chí: ai vượt được ba câu hỏi sẽ nhận y bát. Câu đầu: \"Ngươi sẽ làm gì khi đã có tất cả?\"", "A great master's will remains: whoever passes three questions inherits. The first: \"What will you do once you have everything?\""], [
      O(["\"Cho đi\"", "\"Give it away\""], ["Ý chí im lặng rất lâu, rồi mở cửa thứ hai.", "The will is silent for long, then opens the second door."], { cult: 8, led: { thien: 6 }, trace: { k: "truyen_thua", t: ["Bạn nhận y bát của một đại năng, với lời hứa truyền lại.", "You inherited from a great master, promising to pass it on."], key: "y_bat", w: 50 } }, "chinh"),
      O(["\"Giữ lấy\"", "\"Keep it\""], ["\"Thật thà.\" Cửa không mở, nhưng ý chí tặng bạn một viên đan.", "\"Honest.\" The door stays shut, but the will gifts you a pill."], { stat: { sucKhoe: 30 }, s: 6 }),
      O(["\"Câu hỏi đó sai\"", "\"That question is wrong\""], ["Tiếng cười vang cả động phủ. Bạn bị ném ra ngoài, và ngộ được điều gì đó.", "Laughter fills the abode. You are thrown out, having learned something."], { stat: { ngoTinh: 8 } }),
    ], { hidden: true, acctOnce: true }),
    E("bc_doi_thu", "bi_canh", 1, { realm: [2], focus: ["du_ngoan", "tru_yeu"] }, ["Tranh đoạt ở cửa bí cảnh", "Fighting at the gate"], ["Cửa bí cảnh vừa mở, {npc} đã đứng đó trước bạn, đòi chia ba phần bảy.", "The realm has just opened, and {npc} stands there first, demanding seven parts in ten."], [
      O(["Chia theo lời hắn", "Accept his split"], ["Vẫn hơn tay trắng. Hắn nhớ bạn là người dễ nói chuyện.", "Better than nothing. He remembers you as reasonable."], { s: 2, aff: 10 }),
      O(["Đánh để giành quyền vào", "Fight for the right"], ["Hắn bỏ đi, ném lại một lời hứa sẽ gặp lại.", "He leaves, promising to meet again."], { s: 5, aff: -30, flag: "gay_oan" }, "ta", { duel: { off: 0, rf: ["Bạn thua trước cửa, không thấy được gì bên trong.", "You lose at the door and never see inside."], fxf: { hp: -20, aff: -10 } } }),
      O(["Đề nghị cùng đi, chia đôi", "Offer to go together, half each"], ["Hai người đi hết bí cảnh, chia sòng phẳng.", "You clear it together and split fairly."], { s: 3, aff: 25, led: { thien: 2 } }, "chinh"),
    ], { who: "peer" }),
    E("bc_doi_doi", "bi_canh", 2, { life: [2], realm: [2], trace: "truyen_thua" }, ["Bia ghi tên quen", "A familiar name on the stele"], ["Trong bí cảnh, bạn thấy một tấm bia khắc đạo hiệu. Tay bạn tự sờ lên nét chữ như đã từng viết.", "Inside the realm a stele bears a daoist title. Your hand traces the strokes as if it had written them."], [
      O(["Đọc nốt lời trên bia", "Read the rest"], ["Đó là lời dặn của người mang tên ấy cho người sẽ đến sau. Có lẽ là bạn.", "It is advice from one of that name to whoever comes after. Perhaps you."], { cult: 4, stat: { ngoTinh: 4 }, resolve: "truyen_thua" }, "chinh"),
      O(["Xóa đi", "Erase it"], ["Không ai được biết kiếp trước bạn đã hứa gì.", "No one will know what you promised in another life."], { dt: -6, resolve: "truyen_thua", wound: { kiep: 4 } }, "ta"),
    ], { hidden: true }),
    E("bc_bao_dong", "bi_canh", 0, { realm: [1, 5], focus: "tru_yeu" }, ["Hang gấu cũ", "An old bear den"], ["Con gấu tinh bị bạn đuổi chạy vào một hang. Sâu trong hang có cửa đá bị rêu phủ.", "A bear spirit flees into a cave. Deep inside is a stone door under moss."], [
      O(["Đuổi theo tới cùng", "Chase it down"], ["Yêu đan trong tay, cửa đá vẫn đóng.", "A beast core in hand, the door still shut."], { mat: { yeu_dan: 2 } }, "ta", { duel: { off: -1, rf: ["Trong hang tối nó mạnh hơn bạn tưởng. Bạn bò ra với vết cào dọc lưng.", "It is stronger in the dark. You crawl out with claw marks down your back."], fxf: { hp: -18 } } }),
      O(["Nghiên cứu cửa đá", "Study the door"], ["Trận cổ đã hỏng. Bạn học được một hai điều về trận.", "The old array is broken. You learn a thing or two."], { mast: { tran_dao: 5 } }),
    ]),

    // ---------- 5. Nhân duyên và quan hệ ----------
    E("nd_gap_lai", "nhan_duyen", 0, { age: [18, 120], focus: "ket_duyen" }, ["Gặp lại bên hồ", "Meeting again by the lake"], ["{npc} ngồi câu bên hồ, bảo đã chờ người hỏi chuyện suốt mười năm.", "{npc} is fishing by the lake, saying they have waited ten years for someone to ask."], [
      O(["Ngồi xuống hỏi chuyện", "Sit and ask"], ["Câu chuyện dài tới tối. Bạn có thêm một người bạn.", "The story lasts till dark. You have one more friend."], { aff: 25, stat: { tamCanh: 3 } }, "chinh"),
      O(["Hỏi về cơ duyên hắn biết", "Ask what fortune they know"], ["Bạn có tin tức, và một người hiểu bạn đến vì gì.", "You get news, and someone who knows why you came."], { s: 2, aff: -5 }),
    ], { who: "peer" }),
    E("nd_dao_lu_nan", "nhan_duyen", 1, { partner: true, age: [25], focus: ["ket_duyen", "tu_luyen"] }, ["Đạo lữ gặp nạn", "Your partner in danger"], ["{npc} bị kẻ thù cũ vây ở núi xa. Nếu đi ngay, việc bế quan của bạn sẽ đổ.", "{npc} is surrounded by old enemies far away. Going now will ruin your seclusion."], [
      O(["Đi ngay", "Go at once"], ["Hai người về cùng nhau. Không ai nói gì suốt đường.", "You return together. Neither speaks the whole way."], { stat: { tamCanh: 6 }, led: { thien: 4 }, trace: { k: "dao_lu", t: ["Bạn đã bỏ tất cả để cứu đạo lữ.", "You dropped everything to save your partner."], key: "cuu_dao_lu", w: 35 } }, "chinh", { duel: { off: 0, rf: ["Bạn cứu được người, nhưng mang theo vết thương không dễ lành.", "You save them, and carry a wound slow to heal."], fxf: { hp: -30, stat: { tamCanh: 3 } } } }),
      O(["Nhờ đồng môn đi giúp", "Send fellow disciples"], ["Họ về kịp, nhưng đạo lữ nhìn bạn đã khác.", "They arrive in time, but your partner looks at you differently."], { s: -2, stat: { tamMa: 3 } }),
    ], { who: "partner" }),
    E("nd_su_phu", "nhan_duyen", 1, { npc: "master", age: [20] }, ["Lời trối của sư phụ", "Your master's request"], ["{npc} gọi bạn tới: \"Ta nợ một người ở phương bắc một món nợ. Nếu ta không kịp, thay ta trả.\"", "{npc} calls you: \"I owe someone in the north. If I run out of time, repay it for me.\""], [
      O(["Hứa", "Promise"], ["Sư phụ gật đầu, nhắm mắt yên tâm.", "Your master nods, and closes their eyes at ease."], { aff: 20, flag: "hua_su_phu", trace: { k: "loi_hua", t: ["Bạn hứa trả món nợ của sư phụ ở phương bắc.", "You promised to repay your master's debt in the north."], key: "no_su_phu", w: 45 } }, "chinh"),
      O(["Từ chối, việc ai nấy trả", "Refuse: each pays their own"], ["Không khí trong phòng lạnh đi.", "The room grows cold."], { aff: -20, dt: -3 }, "ta"),
    ], { who: "master" }),
    E("nd_tra_no", "nhan_duyen", 2, { trace: "loi_hua", age: [30], realm: [2] }, ["Món nợ ở phương bắc", "The debt in the north"], ["Bạn tìm tới chủ nợ năm xưa, giờ chỉ còn một bà lão mù. Bà không nhớ ai nợ gì, chỉ hỏi có còn ai nhớ con bà không.", "You find the old creditor, now a blind woman. She remembers no debt, and only asks if anyone still remembers her child."], [
      O(["Ở lại hầu hạ bà những năm cuối", "Stay and care for her"], ["Lời hứa đã giữ, và bạn giữ thêm một điều không ai bắt.", "The promise is kept, and you have kept something no one asked of you."], { resolve: "loi_hua", stat: { tamCanh: 8 }, led: { thien: 6 }, wound: { hua: -8 } }, "chinh"),
      O(["Để lại linh thạch rồi đi", "Leave stones and go"], ["Món nợ coi như xong.", "The debt is settled, more or less."], { resolve: "loi_hua", s: -3, wound: { hua: -3 } }, "trung"),
      O(["Bỏ đi, bà đâu nhớ gì", "Leave. She remembers nothing"], ["Không ai đòi bạn. Bạn vẫn biết.", "No one will claim it. You still know."], { wound: { hua: 6 }, dt: -5, resolve: "loi_hua" }, "ta"),
    ]),
    E("nd_de_tu", "nhan_duyen", 1, { npc: "disciple", realm: [3] }, ["Đồ đệ phạm lỗi", "Your disciple's offence"], ["{npc} giết nhầm người trong lúc làm nhiệm vụ. Gia đình nạn nhân đang tới cửa.", "{npc} killed the wrong person on an errand. The victim's family is at your gate."], [
      O(["Giao đồ đệ cho họ xử", "Hand them over"], ["Đồ đệ quỳ nhận. Từ đó nhìn bạn khác đi.", "Your disciple kneels and accepts. They never look at you the same."], { aff: -30, led: { thien: 3 } }, "chinh"),
      O(["Đền bù thay", "Pay in their stead"], ["Việc êm xuống. Đồ đệ nhớ ơn và cũng học được điều sai.", "It quiets down. They are grateful, and have learned the wrong thing."], { s: -4, aff: 20 }),
      O(["Đuổi cả nhà kia đi", "Drive the family off"], ["Không ai dám tới nữa. Không ai cũng dám nhìn bạn nữa.", "No one dares come again. No one dares look at you either."], { aff: 10, led: { sat: 4 }, dt: -8 }, "ta"),
    ], { who: "disciple" }),
    E("nd_ke_thu_gia", "nhan_duyen", 1, { npc: "foe", age: [40] }, ["Kẻ thù già đi", "An enemy grown old"], ["Bạn gặp lại {npc} ở quán nhỏ ven đường. Hắn đã già đi nhiều, tay run khi rót rượu.", "You find {npc} in a roadside inn. He has aged badly, and his hand shakes when he pours."], [
      O(["Ngồi xuống uống cùng", "Sit and drink"], ["Hai người không nhắc chuyện cũ. Đến lúc chia tay, hận cũng nhẹ đi.", "Neither mentions the past. By the time you part, the hatred has lightened."], { wound: { thu: -6 }, stat: { tamCanh: 4 }, aff: 30 }, "chinh"),
      O(["Kết liễu ngay", "End it now"], ["Rượu đổ loang ra bàn.", "The wine spreads across the table."], { wound: { thu: -4, sat: 3 }, led: { sat: 3 } }, "ta", { duel: { off: -1, rf: ["Hắn già chứ chưa yếu. Bạn trúng độc từ chén rượu.", "He is old, not weak. There was poison in the cup."], fxf: { hp: -30 } } }),
    ], { who: "foe" }),

    // ---------- 6. Thiên tượng ----------
    E("tt_huyet_nguyet", "thien_tuong", 1, { omen: "huyet_nguyet", age: [12] }, ["Đêm huyết nguyệt", "A blood moon night"], ["Trăng đỏ như máu. Tiếng tru vang khắp núi, và trong người bạn có gì đó đáp lại.", "The moon is red as blood. Howls fill the hills, and something in you answers."], [
      O(["Ngồi tĩnh tâm tới sáng", "Sit still till dawn"], ["Trời sáng, bạn vẫn là bạn.", "Dawn comes, and you are still you."], { stat: { tamMa: -4, tamCanh: 3 } }, "chinh"),
      O(["Thuận theo cơn khát", "Follow the thirst"], ["Sáng ra tay bạn đầy máu, và tu vi tăng.", "By morning your hands are bloody, and your power has risen."], { cult: 3, led: { sat: 5 }, dt: -6 }, "ta"),
    ], { omenW: { huyet_nguyet: 6 } }),
    E("tt_linh_khi", "thien_tuong", 0, { omen: "linh_khi", realm: [1], focus: "tu_luyen" }, ["Linh khí dâng trào", "The rising qi tide"], ["Linh khí đổ về đỉnh núi trong đêm. Người tu quanh vùng đều kéo tới.", "Qi pours to the peak in the night. Every cultivator around comes running."], [
      O(["Giành chỗ tốt nhất", "Fight for the best spot"], ["Bạn ngồi đúng mắt khí, cũng thêm vài kẻ ghét.", "You sit at the very eye, and make a few enemies."], { cult: 3, led: { sat: 1 } }, "ta", { duel: { off: -1, rf: ["Bạn bị đẩy ra rìa, thu được chút ít.", "You are shoved to the edge, and get a little."], fxf: { cult: 1, hp: -8 } } }),
      O(["Nhường chỗ cho vãn bối", "Yield to the younger"], ["Một đứa nhỏ đột phá ngay cạnh bạn, lễ phép cúi đầu.", "A child breaks through beside you, and bows."], { cult: 1, led: { thien: 3 } }, "chinh"),
    ], { omenW: { linh_khi: 5 }, cd: 50, once: false }),
    E("tt_loi_van", "thien_tuong", 1, { omen: "loi_van", realm: [2] }, ["Lôi vân tụ đỉnh", "Thunderclouds at the peak"], ["Mây sấm tụ ngay trên đầu, không phải kiếp của bạn, nhưng có thể mượn.", "Thunderclouds gather overhead. Not your tribulation, but it can be borrowed."], [
      O(["Dẫn lôi tôi thân", "Draw the lightning through you"], ["Da thịt cháy xém, mạch khí sạch đi một phần.", "Your skin chars, and your meridians run cleaner."], { mast: { loi_phap: 8 }, hp: -15 }, "trung", { ck: { on: "sucKhoe", at: 40, p: 0.7, rf: ["Một tia quá mạnh đánh gục bạn tại chỗ.", "One bolt is too strong and drops you where you stand."], fxf: { hp: -40 } } }),
      O(["Tìm chỗ tránh", "Take shelter"], ["Khôn ngoan. Ngày mai trời vẫn còn.", "Wise. The sky will be there tomorrow."], {}, "chinh"),
    ], { omenW: { loi_van: 5 } }),
    E("tt_phat_quang", "thien_tuong", 1, { omen: "phat_quang", tamma: [15] }, ["Phật quang chiếu xuống", "The light of the Buddha"], ["Ánh vàng nhạt phủ khắp thung lũng. Những tiếng nói trong đầu bạn bỗng im.", "Pale gold covers the valley. The voices in your head go quiet."], [
      O(["Ngồi xuống sám hối", "Sit and repent"], ["Một phần nghiệp cũ tan đi.", "A part of old karma dissolves."], { stat: { tamMa: -10 }, led: { sat: -5 } }, "chinh"),
      O(["Tránh xa ánh sáng này", "Keep away from the light"], ["Ánh sáng làm da bạn rát. Bạn không muốn biết vì sao.", "It stings your skin. You do not want to know why."], { dt: -2 }, "ta"),
    ], { omenW: { phat_quang: 5 } }),
    E("tt_yeu_trieu", "thien_tuong", 1, { omen: "yeu_trieu", realm: [1], age: [14] }, ["Yêu triều tràn về", "The beast tide"], ["Yêu thú từ núi sâu đổ xuống đồng bằng. Trấn gần nhất cầu cứu.", "Beasts pour down from the deep hills. The nearest town calls for help."], [
      O(["Xuống giữ trấn", "Hold the town"], ["Bạn và dân trấn giữ được cổng.", "You and the townsfolk hold the gate."], { led: { thien: 4 }, mat: { yeu_dan: 2 } }, "chinh", { duel: { off: 0, rf: ["Cổng vỡ, bạn cõng được vài người chạy ra.", "The gate falls, and you carry a few out."], fxf: { hp: -25, led: { thien: 2 } } } }),
      O(["Đi săn yêu đan lúc hỗn loạn", "Hunt cores in the chaos"], ["Một mùa thu hoạch béo bở.", "A rich harvest."], { mat: { yeu_dan: 4 }, s: 2 }, "ta"),
    ], { omenW: { yeu_trieu: 6 } }),
    E("tt_cat_tinh", "thien_tuong", 0, { omen: "cat_tinh", age: [10] }, ["Cát tinh trên đầu", "A lucky star overhead"], ["Hôm nay làm gì cũng thuận. Một người lạ dúi vào tay bạn chiếc vé số của phường thị.", "Everything goes well today. A stranger presses a market lottery ticket into your hand."], [
      O(["Đem đi đổi", "Claim it"], ["Trúng thật.", "It really wins."], { s: 3 }),
      O(["Đưa cho đứa bé bên đường", "Give it to a child"], ["Đứa bé hét lên vì vui, và cát tinh như sáng thêm một chút.", "The child shrieks with joy, and the star seems a little brighter."], { stat: { khiVan: 4 }, led: { thien: 2 } }, "chinh"),
    ], { omenW: { cat_tinh: 5 } }),
    E("tt_giang_ho", "thien_tuong", 1, { omen: "giang_ho_loan", realm: [1], age: [16] }, ["Giang hồ đại loạn", "Chaos in the jianghu"], ["Khắp nơi đồn rằng ai đó vừa tìm ra bí tịch. Chẳng ai biết thật giả, nhưng người đã chết.", "Rumour says someone found a secret manual. No one knows if it is true, but people are already dead."], [
      O(["Nhân lúc loạn đi kiếm lời", "Profit in the chaos"], ["Bạn mua rẻ của những kẻ cần chạy.", "You buy cheap from those who must flee."], { s: 5, dt: -3 }, "ta"),
      O(["Đóng cửa tu luyện", "Stay in and cultivate"], ["Năm yên ổn nhất mà cả giang hồ không có.", "The quietest year in a jianghu that has none."], { cult: 1 }, "chinh"),
    ], { omenW: { giang_ho_loan: 6 } }),

    // ---------- 7. Kinh tế và phường thị ----------
    E("kt_dau_co", "kinh_te", 0, { focus: "kiem_tien", age: [14], stones: 2 }, ["Giá linh thảo tăng", "Herb prices rising"], ["Tin đồn yêu triều làm giá linh thảo tăng. Một thương nhân rủ bạn gom hàng.", "Rumours of a beast tide push herb prices up. A merchant invites you to hoard."], [
      O(["Góp vốn gom hàng", "Buy in"], ["Tin đồn thành thật. Bạn lãi to, còn người dân thì khổ.", "The rumour comes true. You profit, and the people suffer."], { s: 6, dt: -3 }, "ta", { pay: 2, ck: { on: "khiVan", at: 40, p: 0.6, rf: ["Tin đồn chỉ là tin đồn. Hàng mốc trong kho.", "It was only a rumour. The stock rots."], fxf: {} } }),
      O(["Bán lại rẻ cho y quán", "Sell cheap to the clinic"], ["Thầy thuốc cảm ơn bạn, và từ đó mua của bạn.", "The physician thanks you, and buys from you ever after."], { s: 1, led: { thien: 2 }, mat: { linh_thao: 2 } }, "chinh"),
    ]),
    E("kt_thuong_doan", "kinh_te", 1, { focus: "kiem_tien", realm: [1], age: [20] }, ["Thương đoàn cầu cứu", "A caravan's plea"], ["Thương đoàn vượt đèo nhờ bạn hộ tống. Đường đó có cướp, và tiền công không tệ.", "A caravan asks for an escort over the pass. There are bandits on that road, and the pay is decent."], [
      O(["Nhận lời", "Accept"], ["Tới nơi an toàn, chủ đoàn hứa từ nay giảm giá cho bạn.", "You arrive safely, and the leader promises you a discount from now on."], { s: 4, flag: "on_thuong_doan" }, "chinh", { duel: { off: -2, rf: ["Bạn giữ được người, mất hàng. Họ vẫn trả nửa công.", "You save the people, not the goods. They still pay half."], fxf: { s: 2, hp: -15 } } }),
      O(["Bán tin cho bọn cướp", "Sell the route to the bandits"], ["Tiền đến nhanh. Về sau không ai thuê bạn nữa.", "Quick money. No one hires you after that."], { s: 7, dt: -10, led: { sat: 2 } }, "ta"),
    ]),
    E("kt_on_thuong", "kinh_te", 1, { flag: "on_thuong_doan", age: [30] }, ["Món hàng trả ơn", "A gift of thanks"], ["Chủ thương đoàn năm xưa gửi tới một kiện hàng, kèm lời nhắn \"có đường hàng mới, ngài góp một phần chứ?\"", "The old caravan master sends a parcel: \"a new route has opened, care to take a share?\""], [
      O(["Góp vốn", "Invest"], ["Mỗi năm bạn nhận được chút lời, đều đặn.", "A small profit comes to you each year."], { s: 8, mat: { kim_thiet: 2, thuy_ngoc: 1 } }, "trung", { pay: 3 }),
      O(["Nhận quà, từ chối góp", "Take the gift, not the share"], ["Vậy cũng tốt.", "That is fine too."], { mat: { kim_thiet: 1 } }),
    ]),
    E("kt_dau_gia", "kinh_te", 2, { realm: [2], age: [25], stones: 10 }, ["Phiên đấu giá lớn", "A grand auction"], ["Phiên đấu giá có một món ai cũng thèm: ngọc giản không rõ lai lịch. {npc} đang trả giá cạnh bạn.", "The auction has one lot everyone wants: an unknown jade slip. {npc} bids beside you."], [
      O(["Trả giá đến cùng", "Outbid everyone"], ["Ngọc giản về tay bạn, kèm cái nhìn của cả sảnh.", "The slip is yours, along with every stare in the hall."], { cult: 5, stat: { ngoTinh: 4 }, aff: -15 }, "ta", { pay: 10 }),
      O(["Để {npc} mua rồi đề nghị đọc chung", "Let {npc} buy it, then read together"], ["{npc} bất ngờ đồng ý.", "To your surprise {npc} agrees."], { cult: 2, aff: 25 }, "chinh"),
      O(["Không tham gia", "Sit out"], ["Mấy tháng sau người mua nó bị giết. Có lẽ bạn may.", "Months later the buyer is murdered. Perhaps you were lucky."], {}),
    ], { who: "peer" }),
    E("kt_no", "kinh_te", 0, { age: [20], realm: [1], stones: 1 }, ["Bạn cũ hỏi vay", "An old friend's loan"], ["{npc} hỏi vay một số linh thạch, hẹn ba năm trả.", "{npc} asks to borrow stones, promising to repay in three years."], [
      O(["Cho vay", "Lend"], ["{npc} cảm ơn rối rít.", "{npc} thanks you profusely."], { aff: 25, flag: "cho_vay" }, "chinh", { pay: 1 }),
      O(["Từ chối", "Refuse"], ["Tình bạn nguội đi.", "The friendship cools."], { aff: -15 }),
    ], { who: "peer" }),
    E("kt_tra_no", "kinh_te", 1, { flag: "cho_vay", age: [30] }, ["Món nợ được trả", "A debt repaid"], ["Người vay năm xưa đến trả, kèm một mối làm ăn. Hóa ra mấy năm đó người ấy đã rất khó khăn.", "The old borrower comes to repay, with a business lead. Those years, it seems, were hard."], [
      O(["Nhận cả vốn lẫn mối", "Accept both"], ["Tình cũ, tiền mới.", "Old friendship, new money."], { s: 4 }),
      O(["Xóa nợ, chỉ nhận lòng", "Forgive the debt"], ["Hai người uống đến sáng.", "You drink until dawn."], { stat: { tamCanh: 4 }, led: { thien: 3 } }, "chinh"),
    ]),
    E("kt_gia", "kinh_te", 0, { age: [15], stones: 1, focus: ["kiem_tien", "du_ngoan"] }, ["Đan giả ở phường thị", "Fake pills at the market"], ["Tay bán hàng chào mời đan \"Trúc Cơ\" giá rẻ. Bạn ngửi thấy mùi bột gạo.", "A vendor offers cheap \"Foundation\" pills. You can smell the rice flour."], [
      O(["Vạch mặt giữa chợ", "Expose him"], ["Hắn bị đuổi khỏi chợ, người mua trước kéo tới đòi tiền.", "He is driven out, with his customers on his heels."], { led: { thien: 2 }, stat: { khiVan: 2 } }, "chinh"),
      O(["Bắt hắn chia lãi để im", "Take a cut for your silence"], ["Dễ kiếm thật. Vài kẻ khờ sẽ uống phải.", "Easy money. A few fools will swallow it."], { s: 3, dt: -5 }, "ta"),
    ]),

    // ---------- 8. Linh thú và yêu tộc ----------
    E("lt_con_non", "linh_thu", 0, { age: [10], focus: ["du_ngoan", "tru_yeu"], pet: false }, ["Yêu thú non bị thương", "A wounded cub"], ["Yêu thú mẹ đã chết bên cạnh. Con non gầm gừ, chân rách.", "The mother lies dead nearby. The cub snarls with a torn leg."], [
      O(["Băng bó, thả đi", "Bind the leg and release it"], ["Con non bỏ chạy, ngoái lại một lần.", "It runs, and looks back once."], { led: { thien: 2 }, flag: "cuu_con_non" }, "chinh"),
      O(["Lấy yêu đan của mẹ nó", "Take the mother's core"], ["Con non nhìn bạn lấy, không gầm nữa.", "It watches you take it, and stops snarling."], { mat: { yeu_dan: 1 }, dt: -2 }, "ta"),
    ]),
    E("lt_tra_on", "linh_thu", 2, { done: "lt_con_non", flag: "cuu_con_non", age: [30], realm: [1] }, ["Bóng lớn trong rừng", "A great shadow in the forest"], ["Bạn lạc giữa đàn yêu. Một con thú khổng lồ bước ra, chân có vết sẹo cũ, rồi quay đầu dẫn đường.", "You are lost among the beasts. A huge one steps out, an old scar on its leg, and turns to lead the way."], [
      O(["Đi theo", "Follow"], ["Nó đưa bạn tới mỏ yêu tinh, rồi biến mất.", "It leads you to a spirit-ore seam and vanishes."], { mat: { yeu_dan: 3, tho_nguyen: 2 }, mast: { yeu_huyet: 5 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Rút kiếm, đó là yêu đan lớn", "Draw. That is a great core"], ["Nó nhìn bạn rất lâu rồi bỏ đi. Từ đó rừng này không còn an toàn với bạn.", "It looks at you a long while, and goes. This forest is never safe for you again."], { dt: -8, wound: { hua: 3 } }, "ta"),
    ]),
    E("lt_yeu_toc", "linh_thu", 1, { path: "yeu", realm: [2] }, ["Sứ giả yêu tộc", "An envoy of the beast clans"], ["Sứ giả yêu tộc tới: \"Người mang huyết mạch ta, sao lại đứng cạnh nhân tộc?\"", "An envoy comes: \"You bear our blood. Why stand with humans?\""], [
      O(["Đi cùng về yêu tộc một thời gian", "Go with them for a while"], ["Bạn học được cách yêu tộc thở.", "You learn how the clans breathe."], { mast: { yeu_huyet: 10 }, flag: "than_yeu", wflag: "yeu_ket_minh" }, "ta"),
      O(["Bạn là bạn, không theo bên nào", "You are your own"], ["Sứ giả cười, để lại lệnh bài.", "The envoy laughs, and leaves a token."], { stat: { tamCanh: 3 }, mat: { yeu_dan: 1 } }),
    ]),
    E("lt_than_thiet", "linh_thu", 0, { pet: true, age: [12] }, ["Linh thú bỏ ăn", "Your beast refuses food"], ["Linh thú của bạn nằm bẹp mấy ngày. Có vẻ nó nhớ rừng, hoặc đang thay da.", "Your beast has lain flat for days. It misses the forest, or it is molting."], [
      O(["Đưa nó về rừng một tháng", "Take it to the forest"], ["Nó chạy một vòng rồi quay lại bên bạn.", "It runs one circle and comes back."], { stat: { tamCanh: 3, khiVan: 2 } }, "chinh"),
      O(["Cho uống đan", "Feed it a pill"], ["Nó khỏe lại ngay, nhìn bạn hơi khác.", "It recovers at once, and looks at you a little differently."], { s: -1, mast: { dan_dao: 2 } }),
    ]),
    E("lt_long_mach", "linh_thu", 3, { realm: [5], mast: { yeu_huyet: 30 }, khi: [50] }, ["Long hồn dưới hồ sâu", "A dragon soul in the deep"], ["Huyết mạch trong bạn sôi lên bên hồ này. Dưới đáy có một long hồn đang chờ đủ ngàn năm.", "Your blood boils by this lake. On the bottom a dragon soul waits out its thousand years."], [
      O(["Xuống hồ đối thoại", "Dive and speak with it"], ["Rồng cho bạn một giọt máu, đổi một lời hứa.", "The dragon gives you a drop of blood in exchange for a promise."], { mast: { yeu_huyet: 15 }, cult: 6, bl: "yeu_de", trace: { k: "loi_hua", t: ["Bạn đã hứa với long hồn sẽ đưa nó về biển.", "You promised the dragon soul to return it to the sea."], key: "long_hon", w: 60 } }, "chinh", { ck: { on: "tamCanh", at: 55, p: 0.6, rf: ["Long uy đè bạn nát lồng ngực. Rồng để bạn đi vì thương hại.", "Dragon might crushes your chest. It lets you go out of pity."], fxf: { hp: -45 } } }),
      O(["Giết rồng lấy máu", "Kill it for its blood"], ["Nó đã quá yếu để chống cự. Hồ đỏ suốt một năm.", "It is too weak to fight. The lake stays red for a year."], { cult: 10, led: { sat: 15, nghich: 10 }, wound: { sat: 8 } }, "ta", { duel: { off: 1, rf: ["Rồng già vẫn là rồng. Bạn bị nó hất lên bờ gần chết.", "An old dragon is still a dragon. It flings you ashore, nearly dead."], fxf: { hp: -50 } } }),
    ], { hidden: true, acctOnce: true }),
    E("lt_san_yeu", "linh_thu", 0, { focus: "tru_yeu", realm: [1], kills: [20] }, ["Yêu vương đặt giá", "A bounty on your head"], ["Bạn giết đủ nhiều để yêu vương trong vùng biết tên bạn. Lũ thú gần đây săn bạn có tổ chức.", "You have killed enough for the local beast king to know your name. They now hunt you in packs."], [
      O(["Tìm tận hang yêu vương", "Go to the king's den"], ["Đầu yêu vương treo ở cổng trấn.", "Its head hangs at the town gate."], { mat: { yeu_dan: 5 }, s: 4, led: { sat: 3 } }, "ta", { duel: { off: 1, rf: ["Yêu vương mạnh hơn đồn đại. Bạn sống là nhờ chạy nhanh.", "The king is stronger than the rumours. You live by running fast."], fxf: { hp: -35 } } }),
      O(["Rời vùng này một thời gian", "Leave the region for a while"], ["Không cần lúc nào cũng phải thắng.", "You need not always win."], { stat: { tamCanh: 3 } }, "chinh"),
    ]),

    // ---------- 9. Thiên kiếp và thiên phạt ----------
    E("tk_thien_phat", "thien_kiep", 2, { path: "ma", led: { sat: 40 }, realm: [2] }, ["Thiên phạt giáng xuống", "Heaven's punishment"], ["Sát nghiệp đã đủ nặng. Giữa trời quang, một đạo sét tìm đúng mái nhà của bạn.", "Your bloodshed weighs enough. From a clear sky, a bolt finds your very roof."], [
      O(["Đỡ bằng ma công", "Block with demon arts"], ["Sét tan. Trời ghi thêm một nét.", "The bolt shatters. Heaven adds one more stroke."], { led: { nghich: 8 }, mast: { ma_cong: 6 } }, "ta", { duel: { off: 2, rf: ["Sét xuyên qua hộ thể. Bạn cháy đen nửa người.", "The bolt pierces your guard. Half your body chars."], fxf: { hp: -45, led: { nghich: 3 } } } }),
      O(["Quỳ nhận, sám hối", "Kneel and accept"], ["Nặng hơn bạn tưởng, nhưng sổ nghiệp nhẹ đi.", "Heavier than you thought, but the ledger lightens."], { hp: -25, led: { sat: -15 }, dt: 8 }, "chinh"),
    ], { hidden: true, cd: 60, once: false }),
    E("tk_ho_phap", "thien_kiep", 1, { realm: [2, 8], npc: "peer", age: [25] }, ["Hộ pháp cho người độ kiếp", "Guard a tribulation"], ["{npc} sắp độ kiếp, nhờ bạn hộ pháp. Người đang độ kiếp là kẻ yếu nhất trong trời đất.", "{npc} faces a tribulation and asks you to stand guard. No one is weaker than one under the lightning."], [
      O(["Giữ lời đến cùng", "Stand to the end"], ["{npc} qua kiếp, ngã xuống ôm vai bạn.", "{npc} survives and collapses against your shoulder."], { aff: 40, led: { thien: 4 }, trace: { k: "an_nhan", t: ["Bạn đã hộ pháp cho {npc} độ kiếp.", "You guarded a tribulation."], key: "ho_phap" } }, "chinh"),
      O(["Lấy trộm đồ của {npc} lúc đó", "Rob {npc} in that moment"], ["Túi đồ nặng thật. {npc} sống hay chết bạn không cần biết.", "A heavy purse. Whether {npc} lived is none of your concern."], { s: 7, dt: -15, foe: true, led: { sat: 3 }, trace: { k: "ke_thu", t: ["Bạn đã phản bội {npc} lúc độ kiếp.", "You betrayed someone during their tribulation."], key: "phan_ho_phap", w: 50 } }, "ta"),
    ], { who: "peer" }),
    E("tk_chiu_thay", "thien_kiep", 2, { partner: true, realm: [3], age: [60] }, ["Đạo lôi đánh nhầm", "A misdirected bolt"], ["Trong kiếp lôi của bạn, đạo cuối bẻ về phía đạo lữ đang đứng xa.", "In your tribulation, the last bolt bends toward your partner standing far off."], [
      O(["Lao ra đỡ", "Throw yourself in the way"], ["Bạn gục xuống. Đạo lữ còn nguyên.", "You fall. Your partner stands unharmed."], { hp: -40, stat: { tamCanh: 8 }, led: { thien: 8, nghich: 5 } }, "chinh"),
      O(["Dùng pháp bảo đẩy lôi đi", "Deflect with a treasure"], ["Pháp bảo vỡ, đạo lữ an toàn.", "The treasure shatters, and your partner is safe."], { s: -6, stat: { tamCanh: 3 } }),
    ], { who: "partner" }),
    E("tk_khong_kiep", "thien_kiep", 1, { realm: [2], led: { nghich: 25 } }, ["Mây kiếp không tan", "Clouds that will not clear"], ["Đã mấy năm mây kiếp lơ lửng trên chỗ bạn ở. Hàng xóm dời đi hết.", "For years the clouds have hung over your home. The neighbours have all moved away."], [
      O(["Dọn lên núi một mình", "Move to the mountain alone"], ["Không ai bị liên lụy nữa.", "No one else will be caught up in it."], { led: { nghich: -8 }, stat: { tamCanh: 4 }, wound: { mat: 2 } }, "chinh"),
      O(["Mặc kệ", "Ignore it"], ["Người khác chịu trận, không phải bạn.", "Others bear it, not you."], { led: { nghich: 3 }, dt: -4 }, "ta"),
    ]),
    E("tk_kiep_so", "thien_kiep", 2, { kiep: [5], realm: [3] }, ["Kiếp số nặng", "A heavy Calamity Count"], ["Nhiều kiếp qua, trời đã biết tên bạn. Một lão giả chỉ có bóng nói: \"Kiếp này, đạo lôi sẽ gọi ngươi bằng tên cũ.\"", "After so many lives, Heaven knows your name. A shadow of an elder says: \"This life the bolt will call you by your old name.\""], [
      O(["Hỏi tên cũ là gì", "Ask your old name"], ["Bóng ấy đọc lên. Bạn thấy mình muốn khóc mà không biết vì sao.", "The shadow says it. You want to weep and do not know why."], { stat: { ngoTinh: 5, tamMa: 3 }, wound: { kiep: 3 } }),
      O(["\"Tên ta là tên kiếp này\"", "\"My name is this life's name\""], ["Bóng cười. Tâm bạn vững hơn trước.", "The shadow laughs. Your mind grows steadier."], { stat: { tamCanh: 6 } }, "chinh"),
    ], { hidden: true, acctOnce: true }),
    E("tk_tien_mon", "thien_kiep", 3, { realm: [8] }, ["Bóng cửa trời", "The shadow of Heaven's gate"], ["Trong mơ bạn thấy cửa trời mở hé. Có ai đó đứng bên trong đang nhìn ra.", "In a dream, Heaven's gate stands ajar. Someone inside is looking out."], [
      O(["Bước tới hỏi", "Walk up and ask"], ["Người đó có khuôn mặt của bạn, và lắc đầu. \"Chưa.\"", "They have your face, and shake their head. \"Not yet.\""], { stat: { ngoTinh: 6 }, cult: 5 }),
      O(["Quay lại", "Turn back"], ["Bạn thức dậy, thấy mình bình yên lạ.", "You wake strangely at peace."], { stat: { tamCanh: 8 } }, "chinh"),
    ], { hidden: true }),

    // ---------- 10. Đại sự kiện thế giới (sự kiện đơn nối với đại biến và cờ thế giới) ----------
    E("tg_linh_kiet", "the_gioi", 1, { crisis: "linh_kiet", realm: [1] }, ["Mạch linh khô dần", "The veins run dry"], ["Linh khí đang cạn. Tông môn cắt suất tu luyện, người tán tu bắt đầu đánh nhau vì một mạch khí nhỏ.", "Spiritual qi is failing. Sects cut rations and rogues fight over the smallest veins."], [
      O(["Chia phần của mình cho vãn bối", "Share your portion with juniors"], ["Bạn tu chậm đi, nhưng vài đứa trẻ được cứu.", "You slow down, and a few children are saved."], { led: { thien: 4, bao: 3 }, cult: -1 }, "chinh"),
      O(["Chiếm một mạch khí nhỏ", "Seize a small vein"], ["Bạn đủ dùng. Người kia thì không.", "It is enough for you. Not for the other."], { cult: 3, led: { sat: 2 }, dt: -5 }, "ta"),
    ], { omenW: {} }),
    E("tg_ma_tong", "the_gioi", 1, { crisis: "ma_tong", realm: [1], tam: [20] }, ["Lửa ma ở trấn bên", "Demon fire in the next town"], ["Ma tông vừa quét qua trấn bên. Người chạy loạn kéo qua cổng nhà bạn.", "The demon sect has swept the next town. Refugees stream past your door."], [
      O(["Mở cửa đón người", "Open your door"], ["Nhà bạn chật cả năm. Bạn không thấy phiền như đã nghĩ.", "Your home is full for a year. It bothers you less than you thought."], { s: -2, led: { thien: 5 } }, "chinh"),
      O(["Đóng cửa", "Close the door"], ["Tiếng đập cửa kéo dài đến khuya.", "The knocking lasts into the night."], { stat: { tamMa: 3 } }, "ta"),
    ]),
    E("tg_yeu_ket", "the_gioi", 2, { wflag: "yeu_ket_minh", realm: [2], noFlag: "than_yeu" }, ["Yêu tộc qua sông", "The clans cross the river"], ["Từ khi có kẻ làm cầu nối, yêu tộc đã liên minh. Các trấn ven sông thành đất tranh chấp.", "Since someone bridged the two, the clans have allied. The river towns are now contested."], [
      O(["Đi đàm phán ranh giới", "Negotiate a border"], ["Không ai vui, nhưng người chết ít đi.", "No one is happy, but fewer die."], { led: { bao: 5 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Đi săn lúc chúng còn phân tán", "Hunt while they are scattered"], ["Yêu đan chất đầy túi, và hận thù cũng vậy.", "Your pouch fills with cores, and hatred too."], { mat: { yeu_dan: 4 }, led: { sat: 5 } }, "ta"),
    ]),
    E("tg_ma_chu", "the_gioi", 3, { wflag: "ma_chu_thuc_tinh", realm: [3] }, ["Bóng Ma Chủ", "The Demon Lord's shadow"], ["Ma Chủ đã tỉnh. Sứ giả của y đến nhà từng tu sĩ có danh tiếng, hỏi một câu duy nhất: theo hay chết.", "The Demon Lord has woken. His envoys visit every cultivator of name, with one question: follow or die."], [
      O(["Đuổi sứ giả", "Drive off the envoy"], ["Bạn có thêm một kẻ thù rất lớn, và nhiều người tin bạn.", "You gain a vast enemy, and many who trust you."], { led: { bao: 8 }, wound: { thu: 4 } }, "chinh", { duel: { off: 1, rf: ["Sứ giả đánh bạn gục rồi cười: \"Chủ nhân sẽ không phiền nếu ngươi sống thêm vài năm.\"", "He beats you down and laughs: \"My lord will not mind if you live a few more years.\""], fxf: { hp: -40 } } }),
      O(["Thần phục", "Submit"], ["Ấn đen in lên vai bạn. Nó ấm một cách kỳ lạ.", "A black seal burns into your shoulder. It feels strangely warm."], { cult: 5, dt: -25, led: { cam: 10 }, flag: "an_ma_chu", trace: { k: "tong", t: ["Bạn đã thần phục Ma Chủ.", "You submitted to the Demon Lord."], key: "ma_chu", w: 60 } }, "ta"),
    ]),
    E("tg_phong_an", "the_gioi", 2, { wflag: "ma_chu_phong_an", realm: [1], age: [14] }, ["Phong ấn còn nóng", "The seal still warm"], ["Thiên hạ ăn mừng Ma Chủ bị phong ấn. Bạn đi qua nơi đó, đất vẫn còn nóng và cỏ không mọc.", "The world celebrates the Lord's sealing. You pass the site: the earth is warm and no grass grows."], [
      O(["Tế cho người đã ngã xuống", "Offer rites for the fallen"], ["Có người bên cạnh khóc suốt buổi. Bạn đứng cạnh họ.", "Someone beside you weeps all through it. You stand with them."], { led: { thien: 3 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Lấy đất đó về nghiên cứu", "Take the soil to study"], ["Đất này có gì đó đang thở.", "Something in this soil is breathing."], { mast: { ma_cong: 5 }, stat: { tamMa: 3 } }, "ta"),
    ]),
    E("tg_tan_tong", "the_gioi", 1, { fn: (c, a) => (a?.world?.gone?.length ?? 0) >= 1, realm: [1], focus: "du_ngoan" }, ["Phế tích tông cũ", "Ruins of a fallen sect"], ["Bạn đi qua nơi từng là một tông môn lớn. Bậc đá vẫn còn, và một đệ tử già vẫn quét sân mỗi sáng.", "You pass what was once a great sect. The steps remain, and an old disciple still sweeps the yard each morning."], [
      O(["Giúp ông quét một buổi", "Sweep with him for a morning"], ["Ông kể về tông môn hết buổi. Bạn nhớ được vài câu khẩu quyết.", "He talks of the sect all morning. You remember a few lines of chant."], { cult: 2, led: { thien: 2 } }, "chinh"),
      O(["Lục tìm kho cũ", "Search the old stores"], ["Bạn thấy vài món còn dùng được.", "A few things are still useful."], { s: 4 }, "ta"),
    ]),

    // ---------- 11. Nhân quả và tiền kiếp ----------
    E("nq_giac_mo", "nhan_qua", 0, { life: [2], soup: false, age: [6, 30] }, ["Giấc mơ không phải của mình", "A dream not your own"], ["Bạn hất đổ canh Mạnh Bà nên ký ức còn lại. Đêm nay bạn mơ về một người đã nằm xuống vì bạn.", "You knocked over Meng Po's soup, and your memories remain. Tonight you dream of someone who fell for you."], [
      O(["Ghi lại những gì nhớ được", "Write down what you recall"], ["Những dòng chữ trông quen tay lạ.", "The handwriting looks strangely like yours."], { stat: { ngoTinh: 3 }, wound: { kiep: 2 } }),
      O(["Cố quên đi", "Try to forget"], ["Quên không dễ như uống một chén canh.", "Forgetting is not as easy as a bowl of soup."], { stat: { tamCanh: 2 } }, "chinh"),
    ]),
    E("nq_quen_ten", "nhan_qua", 0, { life: [2], soup: true, age: [15, 60], fn: (c, a) => (a?.ev?.traces ?? []).some((x) => x.open) }, ["Người lạ gọi tên lạ", "A stranger calls a strange name"], ["Một người lạ níu áo bạn, gọi một cái tên bạn không biết. Bạn đã uống canh, nên chỉ thấy tim mình đập nhanh.", "A stranger grabs your sleeve and calls a name you do not know. You drank the soup, and only feel your heart race."], [
      O(["Hỏi người đó tên ấy là ai", "Ask whose name that was"], ["Người đó nhìn kỹ rồi lắc đầu xin lỗi, nhưng tay vẫn run.", "They look closely, shake their head and apologise, but their hand trembles."], { stat: { ngoTinh: 2 } }),
      O(["Gỡ tay đi tiếp", "Pull free and walk on"], ["Bạn đi được rất xa rồi mới thấy mắt ướt.", "You are far away before you notice your eyes are wet."], { stat: { tamCanh: 2 } }, "chinh"),
    ]),
    E("nq_an_nhan", "nhan_qua", 1, { life: [2], trace: "an_nhan", realm: [1], age: [14] }, ["Ơn đời trước", "A debt of a past life"], ["Một vị đạo nhân vô cớ giúp bạn qua cơn khốn đốn. \"Có người từng làm việc này cho ta, lâu lắm rồi.\"", "A daoist helps you through hardship for no reason. \"Someone did this for me, long ago.\""], [
      O(["Nhận, và hứa giúp người sau", "Accept and promise to help others"], ["Có những món nợ chỉ trả được cho người khác.", "Some debts can only be paid to someone else."], { s: 3, resolve: "an_nhan", led: { thien: 3 } }, "chinh"),
      O(["Hỏi cho rõ về người đó", "Ask about that person"], ["Ông kể một câu chuyện có giọng bạn trong đó.", "He tells a story with your voice in it."], { stat: { ngoTinh: 3 }, resolve: "an_nhan" }),
    ]),
    E("nq_ke_thu", "nhan_qua", 1, { life: [2], trace: "ke_thu", realm: [1], age: [18] }, ["Nợ máu kiếp trước", "A blood debt from before"], ["Có người mang vết sẹo cũ tìm tới, chỉ thẳng vào bạn: \"Hồn ngươi có mùi của kẻ ta tìm mấy trăm năm.\"", "Someone with an old scar finds you and points: \"Your soul smells of the one I have sought for centuries.\""], [
      O(["Nhận, và xin trả", "Own it, and offer to repay"], ["Người ấy không tha, nhưng cũng không ra tay. Mối thù nhỏ đi một phần.", "They do not forgive, but do not strike. The feud shrinks a little."], { resolve: "ke_thu", wound: { kiep: -3 }, s: -3 }, "chinh"),
      O(["Đánh đuổi kẻ điên", "Drive off the madman"], ["Hắn bỏ đi, và chắc chắn sẽ trở lại.", "He leaves, and will surely return."], { led: { sat: 2 } }, "ta", { duel: { off: 0, rf: ["Bạn thua. \"Vẫn yếu như kiếp trước.\"", "You lose. \"As weak as last time.\""], fxf: { hp: -30 } } }),
    ]),
    E("nq_tong_cu", "nhan_qua", 2, { life: [2], trace: "tong", age: [18], realm: [1] }, ["Bia tông nhớ tội", "The stele remembers"], ["Trong từ đường của một tông, tên bạn ở kiếp trước bị khắc ngược. Khi bạn đi qua, bia rung lên.", "In a sect's hall, your name from a past life is carved upside down. The stele trembles as you pass."], [
      O(["Khai thật, xin chịu phạt", "Confess and accept punishment"], ["Họ không tin, nhưng người giữ từ đường để bạn quét sân ba năm.", "They do not believe you, but the keeper lets you sweep the yard for three years."], { resolve: "tong", hp: -10, stat: { tamCanh: 6 }, wound: { kiep: -5 } }, "chinh"),
      O(["Đi nhanh qua", "Walk on quickly"], ["Bia hết rung sau lưng bạn. Bạn không nhẹ người hơn.", "It stops trembling behind you. You feel no lighter."], { wound: { kiep: 2 } }),
    ], { hidden: true }),
    E("nq_mong_truyen", "nhan_qua", 2, { body: "luan_hoi", life: [3], realm: [2] }, ["Động phủ tiền kiếp", "An abode from a past life"], ["Luân Hồi Đạo Thể rung lên trên ngọn núi vô danh. Bạn biết đường vào như biết đường về nhà.", "Your Samsara Body stirs on a nameless mountain. You know the way in as you know the way home."], [
      O(["Vào", "Enter"], ["Mọi thứ còn nguyên, có cả chén trà chưa uống hết. Bạn ngồi lại uống nốt.", "Everything is as it was, even a half-finished cup of tea. You sit and finish it."], { cult: 6, stat: { ngoTinh: 5 }, wound: { kiep: -4 }, aflag: "ve_dong_phu_cu" }, "chinh"),
      O(["Phong kín, kiếp này là kiếp này", "Seal it. This life is this life"], ["Bạn đắp đá lên cửa, thấy mình như vừa tiễn ai đó.", "You pile stones over the door, as if seeing someone off."], { stat: { tamCanh: 8 } }),
    ], { hidden: true, acctOnce: true }),
    E("nq_thien_thu", "nhan_qua", 2, { lore: [3], realm: [2], age: [20] }, ["Trang sách nhớ người", "A page that remembers you"], ["Mảnh Thiên thư trong ký ức bỗng rõ thêm một dòng, đúng khi bạn đọc một câu trên bia cổ.", "A fragment of the Heavenly Book clears by one more line, just as you read an old stele."], [
      O(["Ngồi lại đọc tới cùng", "Stay and read to the end"], ["Câu hỏi vì sao mình luân hồi không còn xa như trước.", "The question of why you keep returning feels nearer than before."], { stat: { ngoTinh: 6 }, wound: { kiep: 2 } }),
      O(["Rời đi, sống kiếp này đã", "Leave. Live this life first"], ["Có thể câu trả lời chờ được.", "Perhaps the answer can wait."], { stat: { tamCanh: 5 } }, "chinh"),
    ], { hidden: true }),
    E("nq_so_sinh_tu", "nhan_qua", 2, { ending: [5], realm: [1], life: [3] }, ["Tên trong Sổ Sinh Tử", "A name in the Book"], ["Một quỷ sai đi nhầm đường, đánh rơi trang sổ. Trên đó là những cách chết bạn đã từng trải qua.", "A messenger of the underworld drops a page. On it are the ways you have already died."], [
      O(["Trả lại cho quỷ sai", "Return it"], ["Quỷ sai cảm ơn, bảo sẽ đọc tên bạn chậm hơn một chút.", "He thanks you, and says he will call your name a little later."], { life: 5, led: { thien: 2 } }, "chinh"),
      O(["Đọc xem còn cách nào chưa thử", "See which ways remain"], ["Bạn biết thêm vài chỗ không nên đi. Quỷ sai ghi lại tên bạn.", "You learn a few places to avoid. He notes your name."], { stat: { khiVan: 5 }, wound: { kiep: 3 } }, "ta"),
    ], { hidden: true, acctOnce: true }),
    E("nq_phuc_duyen", "nhan_qua", 1, { phuc: [30], age: [8, 40] }, ["Phúc mỏng phúc dày", "Thin and thick fortune"], ["Bà lão ở cổng làng nhìn bạn lâu lắm: \"Có đứa tích phúc nhiều đời mới đầu thai vào đây. Đừng tiêu hoang.\"", "An old woman at the gate stares long: \"Someone stored fortune for many lives to be born here. Do not waste it.\""], [
      O(["Hỏi nên làm gì", "Ask what to do"], ["\"Cho đi trước khi cần.\"", "\"Give before you need.\""], { led: { thien: 3 } }, "chinh"),
      O(["Cười bỏ đi", "Laugh and leave"], ["Bà cũng cười, như đã biết trước.", "She laughs too, as if she knew."], { stat: { khiVan: 2 } }),
    ]),

    // ---------- 12. Thiên Mệnh và sự kiện ẩn ----------
    E("tm_chon_doi", "thien_menh", 4, { realm: [3], fn: (c) => !!c.vk2?.menh?.fate, age: [40] }, ["Đổi mệnh", "Trading fate"], ["Một người mặc áo trắng ngồi chờ ở ngã ba, trên tay là quyển sổ mở sẵn. \"Thiên Mệnh của ngươi, ta mua.\"", "One in white sits at the crossroads, a book open on their lap. \"Your destiny. I will buy it.\""], [
      O(["Bán", "Sell"], ["Bạn nhẹ người, như vừa đặt xuống gánh nước. Rồi nhận ra không còn gì để nắm.", "You feel light, as if a yoke had been set down. Then you find nothing left to hold."], { s: 15, stat: { tamCanh: 8, khiVan: -10 }, led: { su: 15 } }, "ta"),
      O(["Không bán", "Do not sell"], ["Người áo trắng gập sổ. \"Vậy thì đi cho hết đi.\"", "The figure closes the book. \"Then walk it to the end.\""], { stat: { tamCanh: 3 } }, "chinh"),
    ], { hidden: true, acctOnce: true }),
    E("tm_nguoi_mo", "thien_menh", 3, { life: [5], realm: [2], age: [20] }, ["Người canh mộ của chính mình", "Keeper of your own graves"], ["Ở nghĩa trang vắng có người quét những nấm mộ mang tên bạn, tên nào bạn cũng biết.", "In an empty graveyard someone sweeps graves bearing your names, and you know each one."], [
      O(["Hỏi vì sao", "Ask why"], ["\"Có người phải nhớ giúp ngươi.\" Người ấy đưa bạn cây chổi.", "\"Someone must remember for you.\" They hand you the broom."], { stat: { tamCanh: 8 }, wound: { kiep: -6 }, aflag: "gap_nguoi_mo" }, "chinh"),
      O(["Đốt nghĩa trang", "Burn the graveyard"], ["Khói bốc lên. Tối đó bạn không nhớ tên mẹ mình.", "Smoke rises. That night you cannot remember your mother's name."], { stat: { tamMa: 12 }, led: { nghich: 15 } }, "ta"),
    ], { hidden: true, acctOnce: true }),
    E("tm_nguoi_mo_2", "thien_menh", 4, { aflag: "gap_nguoi_mo", life: [7], realm: [3] }, ["Chổi trao lại", "The broom passes on"], ["Lần này người quét mộ già đi nhiều, đưa chổi cho bạn: \"Tới lượt ngươi. Hoặc đừng.\"", "This time the sweeper is much older, and offers you the broom: \"Your turn. Or not.\""], [
      O(["Nhận chổi", "Take it"], ["Bạn biết mình sẽ không còn đầu thai vội vã nữa.", "You know you will no longer hurry into your next life."], { stat: { tamCanh: 15, ngoTinh: 5 }, wound: { kiep: -10 } }, "chinh"),
      O(["Trả lại, còn đường phải đi", "Return it. There is road yet"], ["Người ấy cười, không buồn lắm.", "They laugh, not too sad."], { cult: 6 }),
    ], { hidden: true, acctOnce: true }),
    E("tm_gieo_que", "thien_menh", 1, { khi: [60], age: [16, 80] }, ["Quẻ bói bên đường", "A fortune by the road"], ["Thầy bói mù đưa ra ba đồng xu. \"Gieo đi. Đừng hỏi. Quẻ đúng ở chỗ ngươi không muốn nghe.\"", "A blind diviner offers three coins. \"Toss. Do not ask. The reading is right where you do not want to hear.\""], [
      O(["Gieo", "Toss"], ["Thầy nói đúng một chuyện bạn chưa kể cho ai.", "He names something you have told no one."], { stat: { ngoTinh: 3, tamMa: 2 } }),
      O(["Từ chối, mệnh mình tự biết", "Refuse. You know your own fate"], ["Ông cười, cúi xuống nhặt xu.", "He laughs and stoops for the coins."], { stat: { tamCanh: 2 } }, "chinh"),
    ]),
    E("tm_ten_trong_kinh", "thien_menh", 3, { realm: [5], tamcanh: [60], kiep: [2] }, ["Tên trong kinh cổ", "A name in the old canon"], ["Cuốn kinh ngàn năm có đoạn tiên đoán người \"mang năm hệ, qua trăm kiếp\". Tên trong đó không phải của bạn, nhưng người đọc đều nhìn bạn.", "A thousand-year canon foretells one \"bearing five elements through a hundred lives\". The name is not yours, yet every reader looks at you."], [
      O(["Nhận lấy trách nhiệm", "Take up the burden"], ["Từ đó người ta đến tìm bạn, và bạn không thể từ chối hết.", "People come seeking you now, and you cannot refuse them all."], { stat: { tamCanh: 5, khiVan: 5 }, led: { bao: 8 }, flag: "duoc_chon" }, "chinh"),
      O(["Xé trang đó", "Tear out the page"], ["Không ai đọc được nữa. Lời tiên đoán tìm người khác.", "No one will read it. The prophecy seeks another."], { led: { su: 10 }, stat: { tamCanh: 4 } }, "ta"),
    ], { hidden: true }),
    E("tm_cuu_thien", "thien_menh", 3, { cosmos: true }, ["Tiên giới: cửa Cửu Thiên", "Immortal Realm: the Ninth Gate"], ["Đứng ở Tiên giới, bạn thấy hạ giới như một đám mây nhỏ. Tiên lại đến hỏi bạn có muốn xóa tên khỏi Sổ Sinh Tử.", "From the Immortal Realm the lower world is a small cloud. An immortal clerk asks if you wish your name struck from the Book."], [
      O(["Xóa", "Strike it"], ["Bạn không còn chết nữa, cũng không còn ai gọi bạn.", "You will not die again. Nor will anyone call you."], { led: { nghich: 20 }, stat: { tamCanh: -10 } }, "ta"),
      O(["Giữ lại", "Keep it"], ["\"Hiếm người chọn vậy.\" Tiên lại gật đầu, ghi một dòng.", "\"Few choose that.\" The clerk nods and notes a line."], { stat: { tamCanh: 10 }, led: { thien: 8 } }, "chinh"),
    ], { hidden: true, acctOnce: true }),
    E("tm_ha_pham", "the_gioi", 2, { cosmos: true, fn: (c, a) => !!a?.world }, ["Tiên giới: nhìn xuống hạ giới", "Immortal Realm: looking down"], ["Từ đài quan sát của Tiên giới, bạn thấy một tông môn hạ giới đang cháy. Hạ phàm giúp sẽ phạm thiên quy.", "From the watch-terrace you see a sect burning below. Descending to help breaks Heaven's law."], [
      O(["Hạ phàm một lần", "Descend once"], ["Đám cháy tắt. Tiên lại ghi tên bạn vào sổ phạt.", "The fire dies. A clerk enters you in the penalty book."], { led: { nghich: 12, bao: 8 } }, "chinh"),
      O(["Đứng nhìn, thiên quy là thiên quy", "Watch. Law is law"], ["Khói tan rất lâu sau đó.", "The smoke takes long to clear."], { stat: { tamMa: 4 } }),
    ], {}),
  ]);
})(typeof globalThis !== "undefined" ? globalThis : this);
