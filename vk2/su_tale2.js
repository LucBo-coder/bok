// Đợt nội dung thứ hai: đủ các đạo lộ, các chặng đời, Tiên giới, xuyên kiếp, và thêm các chuỗi. Mỗi sự kiện gắn với một tình huống riêng, không phải bản đổi tên.
(function (root) {
  "use strict";
  const Su = root.VK2Su;
  const E = (id, g, tier, when, t, x, c, o = {}) => ({ id, g, tier, when, t, x, c, ...o });
  const O = (l, r, fx, lean = "trung", o = {}) => ({ l, r, fx, lean, ...o });
  const S = (id, n, log, dur, o = {}) => ({ id, n, log, dur, ...o });
  const EV = (when, t, x, c) => ({ when, t, x, c });
  const nearEnd = (c) => (c.lifespan ?? 0) > 0 && (c.age ?? 0) >= (c.lifespan ?? 0) * 0.85;

  Su.define([
    // ---------- Theo đạo lộ ----------
    E("dl_kiem_gay", "tu_luyen", 1, { path: "kiem", realm: [1], age: [18] }, ["Thanh kiếm gãy giữa trận", "A blade snaps"], ["Thanh kiếm theo bạn nhiều năm gãy ngang. Thợ rèn bảo có thể nối lại, nhưng sẽ không còn như cũ.", "The sword you have carried for years snaps. The smith can rejoin it, but it will never be the same."], [
      O(["Nối lại, giữ làm bạn", "Rejoin it and keep it"], ["Vết nối xấu. Mỗi lần rút kiếm bạn lại nhớ trận đó.", "The join is ugly. Every draw reminds you of that fight."], { stat: { tamCanh: 3 }, mast: { kiem_y: 4 } }, "chinh", { pay: 1 }),
      O(["Chôn kiếm, luyện tay không một năm", "Bury it and train empty-handed"], ["Một năm không kiếm dạy bạn kiếm là gì.", "A year without a sword teaches you what a sword is."], { mast: { kiem_y: 8 }, s: -1 }),
    ]),
    E("dl_kiem_hen", "nhan_duyen", 1, { path: "kiem", realm: [2], age: [25] }, ["Lời hẹn lúc bình minh", "Appointment at dawn"], ["{npc} gửi thư thách đấu, hẹn bình minh trên cầu đá. Thư viết rất lễ độ.", "{npc} sends a courteous challenge: dawn, on the stone bridge."], [
      O(["Đúng hẹn, đấu công bằng", "Keep it, fight fair"], ["Không ai nói gì sau trận. Hai người cùng xuống cầu.", "No one speaks after. You walk off the bridge together."], { mast: { kiem_y: 6 }, aff: 15, led: { bao: 2 } }, "chinh", { duel: { off: 0, rf: ["Bạn thua, và được tha một đường kiếm.", "You lose, and are spared one stroke."], fxf: { hp: -20, mast: { kiem_y: 3 } } } }),
      O(["Không tới", "Do not go"], ["Thiên hạ cười vài hôm rồi quên. Bạn thì không.", "The world laughs for a few days and forgets. You do not."], { dt: -5, wound: { thu: 2 } }),
    ], { who: "peer" }),
    E("dl_dan_hu", "tu_luyen", 0, { path: "dan", realm: [1], focus: "luyen_dan" }, ["Lò đan nổ", "A cauldron bursts"], ["Lò nổ giữa đêm, cháy nửa dãy nhà. Trong đống tro còn một viên đan có màu không có trong sách.", "The cauldron bursts at night and burns half the row. In the ash is a pill of a colour no book lists."], [
      O(["Đền nhà cho hàng xóm trước", "Repay the neighbours first"], ["Túi vơi. Hàng xóm vẫn để bạn ở lại.", "A lighter purse. The neighbours let you stay."], { led: { thien: 3 }, stat: { tamCanh: 2 } }, "chinh", { pay: 2 }),
      O(["Nuốt thử viên đan lạ", "Swallow the strange pill"], ["Ba ngày sốt, rồi hiểu ra một điều về hỏa hầu.", "Three days of fever, then an insight about fire."], { hp: -18, mast: { dan_dao: 7 } }, "trung"),
      O(["Ghi lại sai sót, làm lại từ đầu", "Note the error and start over"], ["Lần sau lò không nổ.", "The next batch does not burst."], { mast: { dan_dao: 3 } }),
    ]),
    E("dl_dan_cuu", "ky_ngo", 1, { path: "dan", realm: [2], age: [25] }, ["Đứa bé trúng độc", "The poisoned child"], ["Người mẹ quỳ ở cửa. Thuốc giải cần một nguyên liệu bạn đang để dành cho lần đột phá.", "A mother kneels at your door. The antidote needs an ingredient you were saving for your breakthrough."], [
      O(["Dùng nó cứu đứa bé", "Use it for the child"], ["Đứa bé khóc được. Lần đột phá phải chờ thêm.", "The child cries again. Your breakthrough must wait."], { led: { thien: 6 }, cult: -1, trace: { k: "an_nhan", t: ["Một đứa bé sống nhờ viên đan của bạn.", "A child lives by your pill."], key: "be_trung_doc" } }, "chinh"),
      O(["Bán thuốc giải với giá thật", "Sell it at true price"], ["Họ bán nhà để trả.", "They sell the house to pay."], { s: 5, dt: -8 }, "ta"),
    ]),
    E("dl_tran_lang", "tu_luyen", 0, { path: "tran", realm: [1], age: [16] }, ["Làng xin một trận pháp", "A village asks for an array"], ["Trưởng làng mang cả mùa thu hoạch tới xin một trận chống yêu thú. Đá trận loại tốt thì tốn, loại rẻ thì chỉ giữ được vài năm.", "The headman brings the whole harvest for a ward against beasts. Good stones cost dearly, cheap ones last only a few years."], [
      O(["Làm trận tốt, nhận phần ít", "Build it well for little"], ["Trận còn đứng sau khi bạn đi xa.", "It still stands after you are gone."], { mast: { tran_dao: 5 }, led: { thien: 3 } }, "chinh", { pay: 1 }),
      O(["Làm trận rẻ, thu đủ giá", "Build cheap, charge full"], ["Bạn dặn họ mấy năm nữa gọi lại.", "You tell them to call again in a few years."], { s: 3, dt: -4 }, "ta"),
    ]),
    E("dl_tran_co", "bi_canh", 2, { path: "tran", realm: [3], mast: { tran_dao: 20 } }, ["Trận cổ dưới lòng sông", "The array under the river"], ["Nước sông rút lộ một trận pháp còn chạy. Nó đang giữ thứ gì đó, không phải canh giữ kho báu.", "The river falls and reveals a working array. It is holding something in, not guarding a treasure."], [
      O(["Đọc trận, không chạm vào", "Read it without touching"], ["Ba tháng đọc bằng một đời học.", "Three months' reading equals a lifetime's study."], { mast: { tran_dao: 12 } }, "chinh"),
      O(["Mở thử một nút", "Open one node"], ["Trận hé một khe. Bạn đóng lại kịp, tay còn run.", "A gap opens. You close it in time, hands shaking."], { mast: { tran_dao: 6 }, s: 5, stat: { tamMa: 6 } }, "ta", { ck: { on: "ngoTinh", at: 55, p: 0.6, rf: ["Khe mở rộng hơn bạn nghĩ. Có gì đó đã thoát ra.", "The gap widens. Something got out."], fxf: { hp: -30, wflag: "tran_co_ho" } } }),
    ]),
    E("dl_phat_doi", "tu_luyen", 1, { path: "phat", realm: [1], age: [18] }, ["Bát cơm cuối cùng", "The last bowl"], ["Năm mất mùa, trong bát khất thực của bạn còn đúng một nắm cơm. Một kẻ từng cướp chùa đang đói lả trước mặt.", "In a lean year your alms bowl holds a last handful of rice. A man who once robbed the temple lies starving before you."], [
      O(["Đưa hết cho hắn", "Give him all of it"], ["Hắn ăn, rồi khóc. Bạn đói thêm hai ngày.", "He eats, then weeps. You go hungry two more days."], { mast: { phat_phap: 7 }, led: { thien: 5 }, hp: -6 }, "chinh"),
      O(["Chia đôi", "Share it"], ["Hai người cùng đói ít hơn.", "Two people go a little less hungry."], { mast: { phat_phap: 3 }, led: { thien: 2 } }),
      O(["Ăn phần mình rồi đi", "Eat your own and go"], ["Không ai trách. Bạn đọc kinh không vào suốt mùa đó.", "No one blames you. The sutras won't enter your head all winter."], { stat: { tamMa: 4 } }),
    ]),
    E("dl_phat_gioi", "thien_kiep", 2, { path: "phat", realm: [2], led: { sat: 10 } }, ["Giới sát đã phá", "The broken vow"], ["Sư phụ không nói gì, chỉ đẩy về phía bạn chiếc bát sứt. Nhiều người đã chết dưới tay bạn, kể cả khi đáng chết.", "Your teacher says nothing, only pushes a chipped bowl toward you. Many have died by your hand, even if they deserved it."], [
      O(["Xin chịu phạt, sám hối ba năm", "Accept penance for three years"], ["Ba năm gánh nước. Vai sưng, lòng nhẹ.", "Three years hauling water. Sore shoulders, a lighter heart."], { wound: { sat: -4 }, led: { thien: 6 }, cult: -2, stat: { tamMa: -6 } }, "chinh"),
      O(["Hoàn tục, đi con đường khác", "Disrobe and go another way"], ["Bạn trả lại bát. Cổng chùa khép rất khẽ.", "You return the bowl. The gate closes softly."], { dt: -6, led: { nghich: 4 } }),
    ]),
    E("dl_ma_con", "nhan_qua", 1, { path: "ma", realm: [2], age: [28], led: { sat: 5 } }, ["Con của người đã chết", "A dead man's child"], ["Một thiếu niên tìm tới, cầm con dao cùn. Bạn đã giết cha nó vì một viên linh thạch, nó nói đúng cả năm và tên quán.", "A youth arrives with a blunt knife. You killed his father over a single stone, and he names the year and the inn."], [
      O(["Để nó đi, cho nó sống", "Let him go"], ["Nó sẽ quay lại, mạnh hơn. Nó cũng sẽ sống.", "He will return stronger. He will also live."], { led: { thien: 3 }, trace: { k: "ke_thu", t: ["Đứa con của người bạn đã giết vẫn đang luyện dao.", "The son of a man you killed still trains with his knife."], key: "con_ke_chet", w: 40 } }, "trung"),
      O(["Nhận nó làm đồ đệ", "Take him as a disciple"], ["Nó quỳ xuống, mắt không cúi.", "He kneels. His eyes do not lower."], { mast: { ma_cong: 3 }, flag: "de_thu_nhan", stat: { tamMa: 3 } }, "ta"),
      O(["Trừ hậu họa", "End it now"], ["Việc xong trong một nhịp thở. Ngày mai bạn quên tên quán.", "It takes one breath. By tomorrow you forget the inn's name."], { led: { sat: 6 }, dt: -12, wound: { sat: 3 } }, "ta"),
    ]),
    E("dl_ma_de_tu", "tu_luyen", 2, { flag: "de_thu_nhan", age: [45] }, ["Đồ đệ mang dao", "The disciple with a knife"], ["Đêm đó nó đứng ở đầu giường, con dao đã được mài rất sắc. Nó đợi bạn mở mắt.", "That night he stands at your bed, the knife now very sharp. He waits for your eyes to open."], [
      O(["Mở mắt, đưa cổ ra", "Open your eyes and offer your neck"], ["Nó không đâm. Nó đi khỏi tông từ đêm đó.", "He does not strike, and leaves that night."], { wound: { sat: -3 }, stat: { tamCanh: 5 }, led: { thien: 4 } }, "chinh"),
      O(["Nói: ngươi ra tay chậm rồi", "Say: you are late"], ["Trận cuối giữa hai thầy trò không có ai xem.", "No one watches the last fight of master and pupil."], { mast: { ma_cong: 6 }, led: { sat: 3 } }, "ta", { duel: { off: 0, rf: ["Nó học được từ bạn nhiều hơn bạn tưởng.", "He learned more from you than you thought."], fxf: { hp: -40 } } }),
    ]),
    E("dl_yeu_nguoi", "linh_thu", 1, { path: "yeu", realm: [1], age: [18] }, ["Nuôi người như nuôi thú", "Raised like a beast"], ["Một đứa trẻ người lớn lên trong đàn yêu thú, không biết nói. Đàn đang ở trong tầm tu sĩ đi săn.", "A human child grew up among beasts and cannot speak. The pack is now in hunters' range."], [
      O(["Đưa cả đàn đi xa", "Lead the pack away"], ["Đàn nhận ra mùi của bạn, đi theo.", "They recognise your scent and follow."], { mast: { yeu_huyet: 6 }, led: { thien: 3 } }, "chinh"),
      O(["Trả đứa trẻ về làng người", "Return the child to the village"], ["Nó gào suốt đường. Làng không biết phải làm gì với nó.", "It howls all the way. The village has no idea what to do."], { stat: { tamCanh: -1, ngoTinh: 2 } }),
    ]),
    E("dl_yeu_huyet", "linh_thu", 2, { path: "yeu", realm: [3], mast: { yeu_huyet: 20 } }, ["Tiếng gọi trong máu", "The call in the blood"], ["Đêm rằm bạn tỉnh dậy cách nơi ở ba ngọn núi, chân trần, miệng có mùi máu.", "At full moon you wake three peaks from home, barefoot, the taste of blood in your mouth."], [
      O(["Xích mình trong đêm rằm", "Chain yourself at full moon"], ["Mấy năm liền xích có vết răng, nhưng không ai chết.", "For years the chains bear teeth marks, but no one dies."], { stat: { tamCanh: 4 }, dt: 5 }, "chinh"),
      O(["Thuận theo huyết mạch", "Give in to the blood"], ["Cơ thể khỏe lên, người trong làng dời đi.", "Your body strengthens, and the villagers move away."], { mast: { yeu_huyet: 12 }, dt: -8, led: { sat: 2 } }, "ta"),
    ]),

    // ---------- Các chặng đời ----------
    E("doi_me_om", "nhan_duyen", 0, { age: [8, 16], realm: [0, 1] }, ["Mẹ ốm nặng", "Mother falls ill"], ["Mẹ bạn ho ra máu. Thầy lang đòi đúng số bạc gia đình để dành cho bạn đi bái sư.", "Your mother coughs blood. The physician asks exactly what the family saved to send you to a master."], [
      O(["Dùng bạc chữa bệnh", "Pay for the cure"], ["Mẹ khỏi. Bạn bái sư muộn hai năm.", "She recovers. You join a master two years late."], { led: { thien: 3 }, stat: { tamCanh: 3 }, cult: -1 }, "chinh"),
      O(["Mẹ bảo cứ đi", "She tells you to go"], ["Bạn đi. Năm sau có thư báo tin.", "You go. A letter comes the next year."], { cult: 1, wound: { mat: 3 }, stat: { tamMa: 3 } }, "trung"),
    ]),
    E("doi_ban_tho", "nhan_duyen", 0, { age: [14, 30], realm: [1, 3] }, ["Bạn thuở nhỏ", "A childhood friend"], ["Người bạn thuở nhỏ giờ làm thợ mộc, tóc đã có sợi bạc dù cùng tuổi. Họ gọi bạn là tiên sư.", "Your childhood friend is now a carpenter, greying though the same age. They call you immortal master."], [
      O(["Ở lại uống rượu một đêm", "Stay and drink a night"], ["Một đêm không ai nói về tu luyện.", "A night with no talk of cultivation."], { stat: { tamCanh: 4, tamMa: -3 } }, "chinh"),
      O(["Để lại ít linh thạch rồi đi", "Leave some stones and go"], ["Họ tiễn tới đầu làng, vẫn gọi là tiên sư.", "They see you off, still calling you immortal master."], { s: -1, led: { thien: 2 } }),
    ]),
    E("doi_trung_nien", "tu_luyen", 0, { age: [80, 160], realm: [2, 4] }, ["Những người cùng lứa", "Those of your cohort"], ["Danh sách lứa đệ tử cùng năm với bạn chỉ còn vài tên chưa bị gạch. Người trẻ giờ gọi bạn là tiền bối.", "Your cohort's roster has few names left uncrossed. The young now call you senior."], [
      O(["Về thăm mộ từng người", "Visit each grave"], ["Mất một năm. Bạn nhớ lại vì sao mình bắt đầu.", "It takes a year. You remember why you began."], { stat: { tamCanh: 5 }, cult: -1 }, "chinh"),
      O(["Đóng cửa tu luyện gấp đôi", "Shut the door and train double"], ["Không ai trong danh sách còn nhắc nhở bạn dừng lại.", "No one on the list remains to tell you to stop."], { cult: 2, stat: { tamMa: 4 } }),
    ]),
    E("doi_di_chuc", "ky_ngo", 1, { fn: nearEnd, age: [40], realm: [1] }, ["Thọ nguyên sắp cạn", "Your span runs short"], ["Tóc đã bạc hết. Bạn biết còn lại không nhiều năm. Có những việc chưa làm và vài người chưa gặp.", "Your hair has gone white. Few years remain, with deeds undone and people unseen."], [
      O(["Viết thư cho những người còn nợ", "Write to those you owe"], ["Lá thư cuối cùng dài nhất.", "The last letter is the longest."], { led: { bao: 3 }, stat: { tamCanh: 4, tamMa: -6 }, trace: { k: "dai_su", t: ["Những lá thư cuối đời của bạn vẫn được truyền đọc.", "Your last letters are still read aloud."], key: "thu_cuoi" } }, "chinh"),
      O(["Liều một phen tìm thuốc kéo dài", "Risk all for a longevity herb"], ["Cả đời bạn chưa đi xa thế.", "You have never travelled so far."], { life: 6, s: -3, hp: -15 }, "ta", { ck: { on: "khiVan", at: 50, p: 0.5, rf: ["Không tìm được gì ngoài một cái rét.", "You find only a chill."], fxf: { hp: -20 } } }),
      O(["Ngồi nhìn trời", "Sit and watch the sky"], ["Có lẽ chỉ cần thế.", "Perhaps that is enough."], { stat: { tamCanh: 6 } }),
    ]),
    E("doi_truyen_nguoi", "tong_mon", 1, { fn: nearEnd, npc: "disciple", realm: [3] }, ["Người kế thừa", "The successor"], ["{npc} vẫn chưa đủ sức, nhưng bạn không còn đủ thời gian để chờ.", "{npc} is not yet ready, but you no longer have the time to wait."], [
      O(["Truyền hết những gì mình có", "Pass on all you have"], ["Mười năm dạy gói trong một mùa.", "Ten years' teaching fits in one season."], { aff: 25, cult: -2, trace: { k: "de_tu", t: ["{npc} giữ đạo của bạn sau khi bạn mất.", "{npc} keeps your way after you are gone."], key: "truyen_de_tu", w: 45 } }, "chinh"),
      O(["Giữ lại một chiêu cuối", "Keep back one last move"], ["Thầy nào cũng giữ lại một chiêu. Chiêu đó theo bạn xuống đất.", "Every master keeps one back. It goes into the ground with you."], { aff: 5 }),
    ], { who: "disciple" }),

    // ---------- Xuyên kiếp ----------
    E("xk_mo_minh", "nhan_qua", 1, { life: [2], age: [20], ending: [1], soup: false }, ["Bia mộ quen tên", "A familiar gravestone"], ["Bạn dừng trước một ngôi mộ cổ không rõ vì sao. Trên bia là một cái tên, và tay bạn tự biết viết nó.", "You stop before an old grave without knowing why. A name is on the stone, and your hand already knows how to write it."], [
      O(["Quét mộ, thắp nhang", "Sweep it and light incense"], ["Một cảm giác rất lạ khi tự thắp nhang cho mình.", "A strange feeling, lighting incense for yourself."], { stat: { tamCanh: 3, ngoTinh: 3 } }, "chinh"),
      O(["Đào lên xem", "Dig it up"], ["Trong mộ không có gì, ngoài một thứ bạn từng giấu.", "Nothing inside, except something you once hid."], { s: 3, led: { nghich: 3 } }, "ta"),
    ]),
    E("xk_cau_hon", "nhan_qua", 1, { cau: true, age: [18] }, ["Món nợ với Địa phủ", "Your debt below"], ["Một quỷ sai ngồi xuống bàn bạn, gọi hai chén trà. \"Ngươi đã thoát một lần. Lần này ta chỉ tới đòi lãi.\"", "A messenger of the underworld sits at your table and orders two teas. \"You escaped once. I come only for the interest.\""], [
      O(["Trả bằng thọ nguyên", "Pay with lifespan"], ["Ông gạch một dòng và uống hết chén trà.", "He crosses a line and finishes his tea."], { life: -5, led: { bao: 4 } }, "chinh"),
      O(["Trả bằng linh thạch", "Pay with stones"], ["Ông đếm rất kỹ, không hề vội.", "He counts carefully, in no hurry."], { led: { bao: 2 } }, "trung", { pay: 4 }),
      O(["Đuổi ông đi", "Throw him out"], ["Ông cười, để lại chén trà còn nóng. Nợ sẽ tăng.", "He smiles and leaves the tea still hot. The debt will grow."], { led: { nghich: 6, su: 4 } }, "ta"),
    ]),
    E("xk_de_tu_cu", "nhan_qua", 2, { life: [2], trace: "de_tu", realm: [1], age: [16] }, ["Môn sinh của đời trước", "A pupil from before"], ["Một bà lão nhìn thế đứng của bạn rồi chảy nước mắt. Bà nói người dạy bà năm xưa cũng đứng như thế, và đã mất từ rất lâu.", "An old woman sees how you stand and weeps. Her teacher stood just so, she says, long since dead."], [
      O(["Xin nghe bà kể", "Ask her to tell it"], ["Bạn nghe chuyện đời mình, như chuyện của một người khác.", "You hear your own life, as if it were someone else's."], { stat: { ngoTinh: 4 }, resolve: "de_tu", led: { nhan: 4 } }, "chinh"),
      O(["Nói bà nhận nhầm", "Say she is mistaken"], ["Bà gật đầu, nhưng vẫn cúi chào.", "She nods, but bows anyway."], { stat: { tamCanh: 2 } }),
    ]),
    E("xk_nghiep_nang", "nhan_qua", 1, { nghiep: [25], life: [2], age: [12] }, ["Sinh ra đã mang tiếng", "Born with a name"], ["Chó trong làng sủa khi bạn đi ngang. Không làm gì sai, nhưng ai cũng tránh, như thể có mùi gì đó từ rất lâu về trước.", "Dogs bark when you pass. You have done nothing, but people avoid you, as if you carry a scent from long ago."], [
      O(["Làm việc thiện không ai biết", "Do good in secret"], ["Nhiều năm sau chó không sủa nữa.", "Years later, the dogs stop barking."], { led: { thien: 6 }, dt: 4 }, "chinh"),
      O(["Rời làng, đừng để ai biết tên", "Leave, and tell no one your name"], ["Đi tới đâu bạn cũng là người mới.", "Everywhere you go, you are new."], { stat: { tamMa: 3, khiVan: 1 } }),
    ]),

    // ---------- Tiên giới ----------
    E("tn_tien_quan", "thien_menh", 2, { cosmos: true }, ["Công văn Thiên Đình", "A heavenly dispatch"], ["Một tiên lại mang tới tờ giấy phân cho bạn trông coi một dải sao sắp tắt. Làm cho tốt thì thăng quan, làm không tốt thì không ai nhớ dải sao đó từng có.", "A clerk brings an order assigning you a dying band of stars. Do well and be promoted; fail and no one remembers it existed."], [
      O(["Nhận việc, giữ sao thêm vạn năm", "Accept and keep them burning"], ["Trên những hành tinh đó có người ngước lên nhìn.", "On those worlds, someone is looking up."], { led: { thien: 8 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Rút linh khí của sao về luyện", "Drain the stars for yourself"], ["Sao tắt sớm hơn. Công văn sau không nhắc tới.", "They go out sooner. The next dispatch does not mention them."], { cult: 3, led: { su: 6 }, dt: -8 }, "ta"),
    ]),
    E("tn_ha_gioi_keu", "nhan_qua", 1, { cosmos: true, fn: (c, a) => (a?.ev?.traces ?? []).some((x) => x.open) }, ["Tiếng kêu từ hạ giới", "A cry from below"], ["Trong gương soi hạ giới có người đang gọi đúng tên bạn. Tiên luật cấm can thiệp.", "In the mirror of the lower world someone calls your very name. Immortal law forbids interference."], [
      O(["Phá lệ, ném xuống một đạo phù", "Break the rule and send a talisman"], ["Một đạo phù rơi qua chín tầng trời. Bạn bị ghi tên.", "A talisman falls through nine heavens. Your name is noted."], { led: { nghich: 8, thien: 5 }, resolve: "an_nhan" }, "chinh"),
      O(["Đóng gương", "Close the mirror"], ["Tiếng gọi tắt. Trong phòng rất yên.", "The voice stops. The room is very quiet."], { stat: { tamMa: 4 } }),
    ]),
    E("tn_tien_ma", "the_gioi", 2, { cosmos: true }, ["Cửa Ma Giới rạn", "The Demon Gate cracks"], ["Cửa thông Ma Giới rạn một đường. Các tiên quân đang đùn đẩy xem ai chịu trách nhiệm, vì không ai muốn vào sổ.", "A crack runs through the gate to the Demon Realm. The immortal lords pass the blame, for no one wants it on record."], [
      O(["Một mình đi vá", "Mend it alone"], ["Không ai cảm ơn. Cửa thì liền.", "No one thanks you. The gate holds."], { hp: -25, led: { bao: 8 }, mast: { tran_dao: 6 } }, "chinh"),
      O(["Viết báo cáo đổ cho người khác", "File a report blaming another"], ["Ở Tiên giới đây là một kỹ năng.", "In heaven this is a skill."], { s: 3, dt: -5 }, "ta"),
    ]),

    // ---------- Bổ sung các nhóm ----------
    E("nh_ke_su_tu", "tong_mon", 1, { sect: true, age: [25], realm: [2], rank: [1] }, ["Sổ công đức bị sửa", "A tampered ledger"], ["Bạn thấy sổ công đức của tông có nét sửa: phần của mấy đệ tử đã chết được chuyển sang tên con trưởng lão.", "You find alterations in the sect's ledger: merit of dead disciples moved to an elder's son."], [
      O(["Trình lên chưởng môn", "Report to the head"], ["Trưởng lão bị phạt nhẹ, và từ nay nhớ mặt bạn.", "The elder gets a light penalty, and now knows your face."], { contrib: 6, led: { bao: 4 }, trace: { k: "ke_thu", t: ["Một trưởng lão của {sect} ghi hận vì bạn tố cáo.", "An elder of {sect} resents your report."], key: "so_cong_duc" } }, "chinh"),
      O(["Đổi lấy một phần", "Trade your silence for a share"], ["Tên bạn cũng vào danh sách đó.", "Your name joins the list."], { contrib: 10, dt: -8 }, "ta"),
    ]),
    E("nh_tong_nghi", "tong_mon", 0, { sect: true, age: [16, 60], rank: [0, 1], focus: ["tu_luyen", "kiem_tien"] }, ["Đệ tử mới bị bắt nạt", "A bullied novice"], ["Vài đệ tử cũ lấy phần đan của một đứa mới vào. Đứa nhỏ không dám kêu, và cũng không nhìn bạn.", "Older disciples take a novice's pill ration. The child dares not complain, nor look at you."], [
      O(["Đứng ra đòi lại", "Stand up for the child"], ["Bạn có thêm một người theo sau và vài kẻ ngáng đường.", "You gain one follower and a few obstacles."], { aff: 5, contrib: 2, led: { thien: 3 } }, "chinh"),
      O(["Coi như không thấy", "Pretend not to see"], ["Ở đâu cũng vậy mà.", "It is the same everywhere."], { stat: { tamMa: 1 } }),
    ]),
    E("nh_bc_nguoi_cu", "bi_canh", 1, { realm: [2], focus: ["du_ngoan", "tru_yeu"], age: [25] }, ["Xác người đi trước", "The one who came before"], ["Bên trong hang là một bộ xương vẫn ngồi thiền, tay cầm mảnh giấy ghi đúng đường bạn vừa đi, kèm chữ: đừng rẽ trái.", "In the cave a skeleton still sits in meditation, holding a note of the very path you came by, with the words: do not turn left."], [
      O(["Nghe lời, chôn cất rồi về", "Heed it, bury him and leave"], ["Bạn sống, và không bao giờ biết bên trái có gì.", "You live, and never know what lay left."], { led: { thien: 2 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Rẽ trái", "Turn left"], ["Kho đồ của người đi trước, và thứ đã giết ông.", "His hoard, and what killed him."], { s: 6, mat: { yeu_dan: 2 } }, "ta", { duel: { off: 1, rf: ["Thứ đó vẫn còn đói.", "It is still hungry."], fxf: { hp: -35 } } }),
    ]),
    E("nh_bc_ban_mang", "bi_canh", 0, { realm: [1, 4], stones: 1, focus: "du_ngoan" }, ["Lái buôn bản đồ", "A map peddler"], ["Lão lái buôn bày ra mười tấm bản đồ bí cảnh, khẳng định chỉ một tấm là thật. Giá như nhau.", "A peddler lays out ten realm maps, swearing only one is real. They all cost the same."], [
      O(["Hỏi lão đã đi tấm nào", "Ask which one he has walked"], ["Lão cười hở lợi, rút ra tấm thứ mười một.", "He grins and draws out an eleventh."], { stat: { khiVan: 2, ngoTinh: 1 } }, "trung", { pay: 1 }),
      O(["Cười rồi đi", "Laugh and leave"], ["Biết đâu tấm thứ ba là thật.", "Perhaps the third really was."], {}),
    ]),
    E("nh_kt_no_tong", "kinh_te", 1, { sect: true, realm: [2], stones: 2, rank: [1] }, ["Tông môn vay tiền", "The sect borrows"], ["Kho {sect} cạn, chấp sự tới hỏi vay bạn. Có ghi giấy, nhưng ai cũng biết tông môn trả nợ thế nào.", "The stores of {sect} run low and a deacon asks you for a loan. There's a note, but everyone knows how sects repay."], [
      O(["Cho vay", "Lend it"], ["Giấy nợ được cất vào hộp, và có lẽ sẽ nằm đó.", "The note goes into a box, likely to stay."], { contrib: 12, sect: { store: 30 } }, "chinh", { pay: 2 }),
      O(["Bảo mình cũng hết rồi", "Say you are out too"], ["Chấp sự nhìn áo bạn rồi đi.", "The deacon glances at your robe and leaves."], { contrib: -3 }),
    ]),
    E("nh_kt_chieu", "kinh_te", 0, { age: [18], realm: [1], focus: "kiem_tien" }, ["Sạp bùa giả", "The fake talisman stall"], ["Một đứa nhỏ bán bùa giả ngay bên sạp của bạn, giá chỉ bằng một phần mười. Khách đang đổ qua đó, nhiều người sẽ mất mạng vì nó.", "A child sells fake talismans beside your stall at a tenth the price. Customers flock there, and many will die for it."], [
      O(["Dạy nó làm bùa thật", "Teach it the real craft"], ["Một đối thủ mới, giá phải chăng.", "A new rival, at fair prices."], { s: 1, led: { thien: 4 } }, "chinh"),
      O(["Giảm giá, ép nó phá sản", "Undercut it"], ["Nó dọn sạp. Bạn không gặp lại nó.", "It packs up. You never see it again."], { s: 2, dt: -3 }),
    ]),
    E("nh_lt_day", "linh_thu", 0, { pet: true, age: [16], realm: [1] }, ["Linh thú đòi đi", "Your beast wants to leave"], ["Linh thú của bạn nhìn về phía núi nhiều đêm liền. Đến mùa của nó rồi.", "Your beast has stared at the mountains for many nights. Its season has come."], [
      O(["Mở cửa cho nó đi một mùa", "Let it go for a season"], ["Xuân sau nó về, khỏe hơn, mang theo một chiếc lá.", "It returns next spring, stronger, with a leaf in its mouth."], { stat: { tamCanh: 2 }, mast: { yeu_huyet: 2 } }, "chinh"),
      O(["Xích lại, đang cần nó", "Chain it, you need it"], ["Nó nằm xuống, không nhìn bạn nữa.", "It lies down and no longer looks at you."], { dt: -3 }, "ta"),
    ]),
    E("nh_lt_yeu_tho", "linh_thu", 1, { realm: [2], age: [30], focus: ["du_ngoan", "tru_yeu"], fn: (c, a) => !!a?.world?.flags?.yeu_thu_han }, ["Yêu tộc nhớ thù", "The clans remember"], ["Từ sau trận yêu quân tan vỡ, chúng săn đơn lẻ các tu sĩ. Hôm nay đến lượt một đoàn thương nhân trước mặt bạn.", "Since the horde was broken, they hunt cultivators one at a time. Today it is a caravan ahead of you."], [
      O(["Giải vây", "Break it up"], ["Xong trận bạn biết tên con yêu cầm đầu, và nó biết tên bạn.", "Afterwards you know their leader's name, and it knows yours."], { led: { bao: 3 }, mat: { yeu_dan: 2 } }, "chinh", { duel: { off: 0, rf: ["Chỉ cứu được hai người và một con la.", "You save just two people and a mule."], fxf: { hp: -20 } } }),
      O(["Đi đường khác", "Take another road"], ["Tiếng kêu tắt sau lưng rất nhanh.", "The cries behind you stop very soon."], { stat: { tamMa: 3 } }),
    ]),
    E("nh_tk_nguoi_khac", "thien_kiep", 1, { realm: [2], age: [30], tamcanh: [35] }, ["Người độ kiếp giữa chợ", "Tribulation in the market"], ["Một tu sĩ bị kiếp đuổi tới giữa phiên chợ, cố tình đứng giữa đám đông để trời nể. Mây đã kéo đến.", "A cultivator flees tribulation into a market, standing in the crowd so Heaven will hold back. The clouds are here."], [
      O(["Kéo hắn ra khỏi chợ", "Drag him out"], ["Sét đánh sượt vai bạn. Chợ còn nguyên.", "The bolt grazes your shoulder. The market stands."], { hp: -22, led: { thien: 6, nghich: 2 } }, "chinh"),
      O(["Sơ tán mọi người", "Evacuate the people"], ["Chậm một nhịp, nhưng đa số thoát.", "One beat late, but most escape."], { led: { thien: 3 } }),
      O(["Nhân lúc loạn gom hàng", "Loot in the chaos"], ["Sạp nào cũng bỏ không.", "Every stall stands abandoned."], { s: 3, dt: -6, led: { su: 3 } }, "ta"),
    ]),
    E("nh_tt_sao_roi", "thien_tuong", 0, { age: [10], focus: ["du_ngoan", "tu_luyen"], khi: [40] }, ["Sao rơi sau núi", "A star behind the hill"], ["Đêm qua một vệt sáng rơi sau núi. Dân làng đã kéo đi, chưa biết thứ đó lành hay dữ.", "Last night a streak fell behind the hill. The villagers go to see, not knowing if it bodes good or ill."], [
      O(["Đi trước tìm, dặn làng đừng tới", "Go first and warn them off"], ["Thiên thạch vẫn nóng, và đang tỏa độc.", "The stone is still hot, and leaking poison."], { mat: { kim_thiet: 2 }, led: { thien: 2 }, hp: -5 }, "chinh"),
      O(["Đi theo xem", "Follow and watch"], ["Mỗi người nhặt được một mẩu, vài người ốm cả mùa.", "Everyone takes a shard, and some are ill all season."], { mat: { kim_thiet: 1 } }),
    ]),
    E("nh_tt_tuyet", "thien_tuong", 1, { realm: [1], age: [14], wflag: "dat_hoang" }, ["Tuyết rơi tháng sáu", "Snow in June"], ["Linh mạch hỏng từ thời Chính Ma giằng co khiến khí trời rối loạn. Tháng sáu có tuyết, lúa chết trên đồng.", "Veins broken in the long war have upset the weather. Snow falls in June and the rice dies in the fields."], [
      O(["Đi phân lương cứu đói", "Distribute grain"], ["Bạn tính được ai sống qua mùa này, và tính cả mình.", "You work out who survives, yourself included."], { led: { thien: 6 } }, "chinh", { pay: 2 }),
      O(["Gom thóc bán cao", "Hoard the grain"], ["Một mùa đông có lãi.", "A profitable winter."], { s: 5, dt: -10, led: { su: 3 } }, "ta"),
    ]),
    E("nh_tg_co_chung", "the_gioi", 0, { age: [16], realm: [0, 2], focus: "du_ngoan", fn: (c, a) => (a?.world?.chainHist ?? []).length > 0 }, ["Người kể chuyện cũ", "The old storyteller"], ["Một ông già ở quán trà đang kể đại biến năm xưa, thêm thắt rất nhiều. Thính giả hỏi bạn có tin không.", "An old man at a teahouse tells of the great upheaval, with many embellishments. His listeners ask if you believe it."], [
      O(["Hỏi kỹ từng chi tiết", "Ask about each detail"], ["Ông bực, nhưng bạn biết thêm vài điều thật.", "He bristles, but you learn some truths."], { stat: { ngoTinh: 3 } }),
      O(["Thả cho ông vài đồng", "Toss him a coin"], ["Ông kể tiếp, hay hơn lúc nãy.", "He goes on, better than before."], { stat: { tamCanh: 1 } }, "chinh"),
    ]),
    E("nh_tg_loan_dan", "the_gioi", 1, { realm: [1], crisis: true, age: [15] }, ["Dân chạy loạn", "Refugees"], ["Đại biến khiến dân chạy loạn qua vùng bạn ở. Một người đàn ông đưa con gái ra: xin nuôi, chỉ cần cho nó ăn.", "The crisis sends refugees through your region. A man holds out his daughter: please raise her, just feed her."], [
      O(["Nhận nuôi", "Take her in"], ["Bạn có thêm một miệng ăn, và một lý do về nhà.", "You gain one mouth to feed, and a reason to come home."], { s: -1, led: { thien: 6 }, trace: { k: "de_tu", t: ["Đứa bé gặp ngày chạy loạn đã lớn lên nhờ bạn.", "A refugee child grew up in your care."], key: "be_chay_loan" } }, "chinh"),
      O(["Cho lương rồi đi", "Give food and go"], ["Hai cha con cúi đầu, tiếp tục đi.", "They bow and walk on."], { s: -1, led: { thien: 2 } }),
    ]),
    E("nh_tm_tho", "thien_menh", 2, { khi: [65], realm: [2], age: [25] }, ["Vận may quá đều", "Too much luck"], ["Bạn thắng liên tiếp, tìm được báu vật liên tiếp, thoát chết liên tiếp. Một lão tinh tướng nói: chưa ai may mãi mà không trả giá.", "You keep winning, finding, and escaping. An old astrologer says: no one stays lucky without paying."], [
      O(["Chủ động cho đi một phần", "Give some of it away"], ["Cuối năm túi nhẹ, ngủ ngon.", "A lighter pouch by year's end, and better sleep."], { s: -2, stat: { khiVan: -3, tamCanh: 4 }, led: { thien: 3 } }, "chinh"),
      O(["Mặc kệ, cứ thử vận tiếp", "Ignore it and press on"], ["Vận chưa hết, cho tới hôm hết.", "The luck holds until the day it doesn't."], { s: 3, stat: { khiVan: 2, tamMa: 3 } }, "ta"),
    ]),
    E("nh_ky_nguoi_la", "ky_ngo", 0, { age: [16, 200], focus: ["du_ngoan", "kiem_tien"], realm: [0, 3] }, ["Đổi một năm", "Trade a year"], ["Người lạ ở bến đò nói: \"Cho ta một năm đời ngươi, ta trả một kiến thức.\" Trông ông ta rất mệt.", "A stranger at the ferry says: \"Give me one year of your life and I'll pay with knowledge.\" He looks very tired."], [
      O(["Đồng ý", "Agree"], ["Bạn thấy già đi một chút, và biết một điều chưa ai dạy.", "You feel a little older, and know what no one taught."], { life: -1, stat: { ngoTinh: 4 } }),
      O(["Mời ông ly trà thay vào đó", "Offer him tea instead"], ["Ông uống, ngủ gục, sáng ra không còn đó.", "He drinks, nods off, and by morning is gone."], { stat: { tamCanh: 2, khiVan: 1 } }, "chinh"),
    ]),
    // Hậu quả lâu dài của các chuỗi bên dưới
    E("hq_tran_co", "bi_canh", 2, { wflag: "tran_co_ho", realm: [3] }, ["Thứ thoát ra từ trận cổ", "What escaped the array"], ["Nhiều vùng ven sông có người mất tích. Dấu vết dẫn về khe trận cổ dưới lòng sông.", "People vanish along the river. The trail leads back to the gap in the old array."], [
      O(["Đi đóng khe", "Go and close the gap"], ["Đóng được, sau khi mất rất nhiều đá trận.", "It closes, at great cost in stones."], { led: { bao: 6 }, mast: { tran_dao: 5 }, wflag: "tran_co_dong" }, "chinh", { pay: 3 }),
      O(["Mặc thế gian tự lo", "Let the world handle it"], ["Ai bảo bạn là người phải lo.", "Who says it must be you."], { stat: { tamMa: 3 } }),
    ]),
    E("hq_ky_tai_nga", "nhan_duyen", 2, { wflag: "ky_tai_sa_nga", realm: [3] }, ["Kỳ tài năm xưa", "The genius of old"], ["Vị kỳ tài sa ngã năm nào giờ đứng đầu một phe riêng, gửi thư mời bạn. Trong thư chỉ viết: \"Ngươi từng biết ta.\"", "The fallen genius now leads a faction, and writes you just: \"You knew me once.\""], [
      O(["Đến gặp, thử kéo về", "Go, and try to bring them back"], ["Người ấy nghe, không gật, nhưng giảm việc giết chóc đi vài năm.", "They listen without nodding, but kill less for some years."], { led: { thien: 4 }, stat: { tamCanh: 3 } }, "chinh"),
      O(["Đến gia nhập", "Go and join them"], ["Bên đó không ai hỏi quá khứ.", "No one asks about your past there."], { cult: 3, dt: -12 }, "ta"),
      O(["Đốt thư", "Burn the letter"], ["Tro bay. Bạn vẫn nhớ nét chữ.", "Ash drifts. You still recall the hand."], {}),
    ]),
    E("hq_troi_nhe", "thien_kiep", 0, { wflag: "troi_nhe", realm: [2], focus: "tu_luyen" }, ["Bầu trời sáng trong", "A clear sky"], ["Từ khi mây kiếp vô chủ tan, vùng này trời trong lạ thường, người đột phá đều thấy nhẹ hơn.", "Since the masterless clouds cleared, the sky here is strangely clean, and breakthroughs feel lighter."], [
      O(["Tranh thủ tu luyện", "Make use of it"], ["Một năm có giá trị bằng vài năm.", "One year is worth several."], { cult: 2 }),
      O(["Đi tìm mộ người đã nhận kiếp", "Find the grave of the one who took it"], ["Ngôi mộ nhỏ, có ai đó vẫn đặt hoa.", "A small grave, where someone still leaves flowers."], { stat: { tamCanh: 4 } }, "chinh"),
    ]),
  ]);

  Su.defineChain([
    {
      id: "dai_han", g: "thien_tuong", tier: 1, w: 3, n: ["Đại Hạn Ba Năm", "The Three-Year Drought"], roles: { foe: "any", ally: "any" },
      stages: [
        S("dau", ["Năm đầu không mưa", "A year without rain"], ["Cả năm không có một trận mưa, sông cạn tới đáy.", "Not a drop of rain all year. Rivers run dry."], [3, 5], {
          ev: EV({ age: [10] }, ["Năm không mưa", "A year without rain"], ["Giếng làng đã cạn. {ally} đề nghị góp linh thạch mở trận hút nước ngầm, {foe} đang mua hết nước còn lại để bán.", "The well is dry. {ally} proposes pooling stones for a groundwater array, while {foe} buys up all remaining water."], [
            O(["Góp đá mở trận", "Pool stones for the array"], ["Nước lên. Không nhiều, nhưng đủ.", "Water rises. Not much, but enough."], { ds: 12, led: { thien: 5 } }, "chinh", { pay: 1 }),
            O(["Cùng {foe} bán nước", "Sell water with {foe}"], ["Mùa này nước đắt hơn đan.", "Water costs more than pills this year."], { s: 4, ds: -12, dt: -10 }, "ta"),
            O(["Dẫn dân đi tìm nguồn", "Lead people to find a source"], ["Mười ngày đường, ba người ngã xuống, nhưng tìm được khe nước.", "Ten days' walk, three fall, but a spring is found."], { ds: 6, hp: -8, stat: { tamCanh: 3 } }),
          ]),
        }),
        S("doi", ["Nạn đói", "Famine"], ["Năm thứ hai đã có người đói phải bán con.", "By the second year, starving people sell their children."], [3, 5], {
          ev: EV({ age: [14], realm: [1] }, ["Chợ bán người", "A market of people"], ["Những đứa trẻ được dắt ra chợ, bảng ghi giá bằng vài đấu thóc. {foe} mua nhiều nhất.", "Children are led to market, priced in measures of grain. {foe} buys the most."], [
            O(["Mua hết, thả tự do", "Buy them all and free them"], ["Không đủ tiền cho tất cả. Bạn phải chỉ tay chọn.", "There isn't enough for all. You must point and choose."], { ds: 15, led: { thien: 8 }, stat: { tamMa: 3 } }, "chinh", { pay: 3 }),
            O(["Phá chợ", "Break the market"], ["Chợ tan, trẻ chạy tán loạn. Năm sau chợ mở chỗ khác.", "It scatters, the children run. It reopens elsewhere next year."], { ds: 8, led: { pha: 4 } }, "ta", { duel: { off: 0, rf: ["Lính đánh thuê của {foe} tiếp đón bạn.", "{foe}'s mercenaries receive you."], fxf: { hp: -25 } } }),
          ]),
          br: [{ if: { s: 15 }, to: "mua" }, { to: "chet" }],
        }),
        S("mua", ["Mưa trở lại", "The rains return"], ["Cuối năm thứ ba trời đổ mưa. Người còn lại cùng ra đồng.", "Rain comes at the end of the third year. Those left go back to the fields."], [2, 3], { end: true, wfx: { flag: "qua_han" } }),
        S("chet", ["Đất chết", "Dead land"], ["Mưa tới quá muộn. Ba trấn không còn ai để gieo hạt.", "The rain comes too late. Three towns have no one left to sow."], [2, 3], { end: true, wfx: { vein: -1, flag: "dat_hoang" } }),
      ],
    },
    {
      id: "kiem_co", g: "bi_canh", tier: 2, w: 3, n: ["Kiếm Cổ Xuất Thế", "The Ancient Sword Emerges"], roles: { foe: "strong", ally: "strong" },
      stages: [
        S("hien", ["Kiếm khí xuyên mây", "Sword qi splits the clouds"], ["Một luồng kiếm khí xuyên mây suốt bảy đêm. Mọi kiếm tu đều đang đi về một hướng.", "For seven nights sword qi pierces the clouds. Every swordsman walks in the same direction."], [4, 7], {
          ev: EV({ realm: [2], age: [18] }, ["Dòng người lên núi", "Crowds on the mountain"], ["Cả đoàn người leo núi. Nhiều người sẽ chết vì một thứ chưa ai thấy. {ally} và {foe} đi đầu.", "Crowds climb the mountain. Many will die for what no one has seen. {ally} and {foe} lead."], [
            O(["Đi cùng {ally}", "Go with {ally}"], ["Hai người giữ được một đoạn đường.", "Together you hold a stretch of the path."], { ds: 8, mast: { kiem_y: 4 } }, "chinh"),
            O(["Lẻn đi đường riêng", "Sneak a route of your own"], ["Đường đó dốc hơn, nhưng vắng.", "It is steeper, but empty."], { stat: { khiVan: 2 }, cf: "duong_rieng" }),
          ]),
        }),
        S("tranh", ["Tranh kiếm", "The struggle for the blade"], ["Trên đỉnh, máu chảy xuống theo khe đá. Kiếm vẫn cắm trong đá, không ai rút nổi.", "On the summit, blood runs in the cracks. The sword stays in the stone, immovable."], [3, 6], {
          ev: EV({ realm: [3] }, ["Rút kiếm", "Drawing the sword"], ["Tới lượt bạn đặt tay lên chuôi. Giọng trong kiếm hỏi: \"Rút để làm gì?\"", "Your turn to grip the hilt. A voice within asks: \"Draw me, to do what?\""], [
            O(["\"Để không ai phải chết vì ngươi nữa\"", "\"So that no one dies for you again\""], ["Thanh kiếm tự rung, gãy làm đôi. Mọi người nhìn bạn như nhìn kẻ điên.", "It shudders and snaps in two. They look at you as at a madman."], { ds: 20, cf: "gay_kiem", mast: { kiem_y: 10 }, led: { thien: 6, pha: 5 } }, "chinh"),
            O(["\"Để mạnh hơn\"", "\"To become stronger\""], ["Kiếm nhúc nhích một chút, nhưng không ra.", "It shifts a little, but stays."], { mast: { kiem_y: 6 }, hp: -15 }, "ta"),
            O(["Bỏ tay ra, xuống núi", "Let go and descend"], ["Cả đời bạn sẽ tự hỏi.", "You will wonder all your life."], { stat: { tamCanh: 2 } }),
          ]),
          br: [{ if: { f: "gay_kiem" }, to: "gay" }, { if: { dead: "foe" }, to: "chinh" }, { if: { s: 12 }, to: "chinh" }, { to: "ma" }],
        }),
        S("gay", ["Kiếm cổ gãy", "The sword breaks"], ["Kiếm cổ gãy đôi, từ đó không ai còn leo ngọn núi ấy.", "The ancient sword is broken, and no one climbs that mountain again."], [2, 3], { end: true, wfx: { flag: "kiem_co_gay" } }),
        S("chinh", ["{ally} đoạt kiếm", "{ally} takes the sword"], ["{ally} rút được kiếm, và bị kiếm dẫn đi đâu không ai biết.", "{ally} draws it, and is led off to who knows where."], [2, 3], { end: true, wfx: { flag: "kiem_chinh" } }),
        S("ma", ["{foe} đoạt kiếm", "{foe} takes the sword"], ["{foe} rút được kiếm. Một năm sau có ba tông môn không còn người.", "{foe} draws it. A year later three sects have no one left."], [2, 3], { end: true, wfx: { flag: "kiem_ma", sect: { store: -40 } } }),
      ],
    },
    {
      id: "giao_long", g: "linh_thu", tier: 2, w: 2, n: ["Giao Long Hóa Rồng", "The Flood-Dragon's Ascent"], roles: { foe: "any", ally: "any" },
      stages: [
        S("dau", ["Giao long đang tu", "A flood-dragon cultivates"], ["Giao long trên sông lớn tu nghìn năm, đang chờ đi qua cửa biển để hóa rồng. Đường nó đi có năm trấn.", "The great river's flood-dragon has cultivated for a thousand years, and now awaits the sea gate. Five towns lie on its path."], [6, 10], {
          ev: EV({ realm: [2], age: [20] }, ["Lời xin của giao long", "The dragon's request"], ["Nó trồi lên giữa dòng, cúi đầu xin bạn nói với năm trấn hãy dời đi: nó không muốn giết ai, cũng không thể dừng lại.", "It surfaces and bows, asking you to tell the towns to move: it wants no deaths, and cannot stop."], [
            O(["Thuyết phục các trấn dời", "Persuade the towns to move"], ["Một nửa nghe. Một nửa cười.", "Half listen. Half laugh."], { ds: 15, led: { thien: 5 }, cf: "thuyet" }, "chinh"),
            O(["Báo cho tu sĩ đi săn", "Tell the hunters"], ["Yêu đan giao long ngàn năm là thứ ai cũng muốn.", "A thousand-year core is what everyone wants."], { ds: -15, s: 4, cf: "san" }, "ta"),
          ]),
        }),
        S("hoa", ["Ngày nước lên", "The day of the flood"], ["Sông dâng cao chưa từng có, giao long bắt đầu đi.", "The river rises as never before, and the dragon begins to move."], [3, 5], {
          br: [{ if: { f: "san" }, to: "chet" }, { if: { s: 8 }, to: "rong" }, { to: "lut" }],
        }),
        S("rong", ["Rồng bay qua cửa biển", "A dragon crosses the sea gate"], ["Giao long hóa rồng, bay qua đầu năm trấn trống không. Ngày đó mưa ấm như nước tắm.", "It becomes a dragon and flies over five empty towns. The rain that day is warm."], [2, 3], { end: true, wfx: { flag: "rong_on" } }),
        S("lut", ["Đại hồng thủy", "The great flood"], ["Giao long đi qua cả những trấn không chịu dời. Hóa rồng rồi, nó khóc.", "It passes through the towns that would not move. Having become a dragon, it weeps."], [2, 3], { end: true, wfx: { vein: -1 } }),
        S("chet", ["Giao long bị giết", "The dragon slain"], ["Giao long chết ở cửa biển trước khi hóa rồng, bị chia làm mười phần. Sông đỏ một tháng.", "It is slain at the sea gate before it could ascend, and split into ten shares. The river runs red for a month."], [2, 3], { end: true, wfx: { flag: "yeu_thu_han", kill: "foe" } }),
      ],
    },
    {
      id: "dao_bien", g: "tu_luyen", tier: 2, w: 3, n: ["Luận Đạo Thiên Hạ", "The Great Debate"], roles: { ally: "strong", foe: "strong" },
      stages: [
        S("dau", ["Luận đạo mở", "The debate opens"], ["Đại hội luận đạo mở ra sau trăm năm: có nên dạy tu tiên cho phàm nhân không căn cốt?", "After a century, the Great Debate opens: should the rootless be taught to cultivate?"], [4, 7], {
          ev: EV({ realm: [2], age: [20] }, ["Tới lượt bạn phát biểu", "Your turn to speak"], ["{ally} nói nên dạy, {foe} nói đó là phung phí. Cả hội trường chờ bạn.", "{ally} says teach them, {foe} calls it a waste. The hall awaits you."], [
            O(["Nên dạy, kể cả khi phí", "Teach them, even if wasteful"], ["Bạn bị cười, rồi có người vỗ tay rất khẽ.", "They laugh, then someone softly claps."], { ds: 12, stat: { ngoTinh: 3 }, led: { thien: 3 } }, "chinh"),
            O(["Không nên, đạo không chia đều", "No, the Dao is not equal"], ["Một số tông môn sẽ nhớ tên bạn.", "Some sects will remember your name."], { ds: -10, s: 2 }, "ta"),
            O(["Hỏi cả hai bên có từng làm phàm nhân", "Ask if either has ever been mortal"], ["Hội trường yên lặng một lúc lâu.", "The hall falls silent for a long while."], { stat: { tamCanh: 3, ngoTinh: 2 } }),
          ]),
        }),
        S("ket", ["Kết luận", "The verdict"], ["Đại hội đi tới kết luận sau nhiều năm tranh cãi.", "After years of argument, the debate concludes."], [6, 10], { br: [{ if: { s: 10 }, to: "mo" }, { to: "dong" }] }),
        S("mo", ["Đạo mở cho phàm nhân", "The Dao opens to mortals"], ["Các trường dạy phàm nhân được mở. Đa phần chẳng ai thành tiên, nhưng người biết chữ nhiều lên.", "Schools for mortals open. Few ascend, but many learn to read."], [2, 3], { end: true, wfx: { flag: "dao_mo" } }),
        S("dong", ["Đạo đóng cửa", "The Dao closes its gates"], ["Các tông giữ kín cửa hơn trước. Nhiều đứa trẻ không ai đoái tới.", "The sects close their doors tighter. Many children go unseen."], [2, 3], { end: true, wfx: { flag: "dao_dong" } }),
      ],
    },
    {
      id: "thien_phat_tong", g: "thien_kiep", tier: 3, w: 2, n: ["Thiên Phạt Giáng Tông", "Heaven Punishes a Sect"], roles: { ally: "strong", foe: "strong" }, sect: true,
      stages: [
        S("dau", ["Sét đánh cổng tông", "Lightning at the gate"], ["Trời quang mà sét đánh xuống cổng {sect} ba lần. Người ta nói tông này đã làm gì đó.", "From a clear sky, lightning strikes the gate of {sect} three times. They say the sect has done something."], [5, 9], {
          ev: EV({ realm: [3] }, ["Bí mật trong cấm địa", "The forbidden secret"], ["Bạn tìm được hồ sơ: {sect} đã tế sống một làng để đổi lấy linh mạch. {ally} không biết, {foe} là người ký.", "You find records: {sect} sacrificed a village for its vein. {ally} did not know, and {foe} signed it."], [
            O(["Công khai trước thiên hạ", "Reveal it to the world"], ["Người vẫn nhổ vào tên bạn, nhưng sét không đánh nữa.", "They spit at your name, but the lightning stops."], { ds: 20, led: { pha: 5, thien: 5 }, cf: "cong_khai" }, "chinh"),
            O(["Giúp {foe} giấu đi", "Help {foe} bury it"], ["Sét đánh gần hơn năm trước.", "The lightning lands closer than last year."], { ds: -18, contrib: 8, dt: -14, led: { su: 8 } }, "ta"),
            O(["Tự tay trả lại linh mạch", "Quietly return the vein"], ["Không ai biết bạn đã làm, kể cả trời có lẽ.", "No one knows you did it, perhaps not even Heaven."], { ds: 12, led: { thien: 4 }, cult: -2 }),
          ]),
        }),
        S("nang", ["Thiên phạt nặng dần", "The punishment grows"], ["Linh khí trong {sect} giảm từng năm, đệ tử đột phá đều chết.", "Qi in {sect} wanes yearly, and disciples die in breakthrough."], [6, 10], {
          wfx: { sect: { store: -30 } },
          br: [{ if: { f: "cong_khai" }, to: "chuoc" }, { if: { s: 10 }, to: "chuoc" }, { to: "diet" }],
        }),
        S("chuoc", ["Tông môn chuộc tội", "The sect atones"], ["Tông bỏ một nửa linh mạch cho dân, lập bia chuộc tội. Sét ngừng.", "The sect gives half its vein to the people and raises a stele of atonement. The lightning stops."], [2, 3], { end: true, wfx: { sect: { vein: -1 }, flag: "bia_chuoc" } }),
        S("diet", ["Tông môn tuyệt diệt", "The sect falls"], ["Đêm cuối, một đạo lôi to bằng ngọn núi. Sáng ra tông chỉ còn nền đá.", "On the last night, a bolt as wide as a mountain. By morning, only foundations remain."], [2, 3], { end: true, wfx: { sect: { terr: -2, store: -200 }, flag: "tong_tuyet" } }),
      ],
    },
    {
      id: "phi_thang_gia", g: "thien_menh", tier: 3, w: 1, n: ["Phi Thăng Giả", "The False Ascension"], roles: { ally: "strong", foe: "strong" }, when: { minYear: 1030 },
      stages: [
        S("dau", ["Phi thăng giữa ban ngày", "Ascension in broad daylight"], ["{foe} phi thăng trước vạn người. Ai cũng thấy, chỉ {ally} không tin.", "{foe} ascends before ten thousand witnesses. All saw it, but {ally} does not believe."], [6, 10], {
          ev: EV({ realm: [3], tamcanh: [40] }, ["Khe hở của ánh sáng", "A gap in the light"], ["{ally} đưa bạn xem ghi chép: mấy trăm năm nay, không một người phi thăng nào gửi được tin về. Hầm dưới đài phi thăng có vết máu mới.", "{ally} shows you a record: for centuries, no ascender has sent word back. Below the ascension platform there is fresh blood."], [
            O(["Cùng xuống hầm", "Go down together"], ["Bạn thấy thứ không có trong kinh sách, và phải mang nó sống qua ngày mai.", "You see what no scripture holds, and must carry it alive through tomorrow."], { ds: 18, cf: "thay", wflag: "biet_dai", led: { nghich: 8 }, stat: { tamMa: 5 } }, "chinh"),
            O(["Đốt ghi chép, đừng dính vào", "Burn the record, stay out"], ["Phi thăng vẫn là giấc mơ của bạn.", "Ascension remains your dream."], { stat: { tamCanh: -2 }, s: 2 }, "trung"),
          ]),
        }),
        S("lo", ["Lời đồn lan ra", "The rumour spreads"], ["Có người đồn đài phi thăng là lò luyện đan của ai đó. Người đồn lần lượt mất tích.", "Rumour says the platform is someone's cauldron. Those who spread it vanish."], [8, 14], { br: [{ if: { f: "thay" }, to: "pha" }, { if: { dead: "ally" }, to: "vui" }, { if: { s: 10 }, to: "pha" }, { to: "vui" }] }),
        S("pha", ["Đài phi thăng sụp", "The platform falls"], ["Đài phi thăng bị phá. Từ đó người muốn phi thăng phải tự tìm đường, nguy hiểm hơn và thật hơn.", "The platform is destroyed. Would-be ascenders must now find their own, more dangerous, more real, way."], [2, 3], { end: true, wfx: { flag: "dai_sup" } }),
        S("vui", ["Sự thật bị chôn", "The truth is buried"], ["Lời đồn tắt. Năm sau lại có người bước lên đài trước vạn người.", "The rumour dies. Next year another climbs the platform before ten thousand."], [2, 3], { end: true, wfx: { flag: "dai_con" } }),
      ],
    },
    {
      id: "nhan_duyen_cu", g: "nhan_qua", tier: 2, w: 2, n: ["Món Nợ Trăm Năm", "A Hundred-Year Debt"], roles: { ally: "any", foe: "any" },
      stages: [
        S("dau", ["Hai nhà có thù", "Two houses at feud"], ["Nhà của {ally} và {foe} giết nhau từ đời ông cố, nay không ai còn nhớ vì sao.", "The houses of {ally} and {foe} have killed each other since their great-grandfathers, and no one recalls why."], [6, 10], {
          ev: EV({ age: [20], realm: [1], life: [2] }, ["Giấy nợ cũ", "An old note"], ["Trong căn nhà cũ bạn được chia, có một tờ giấy nợ giữa hai nhà, chữ giống hệt chữ bạn. Tờ giấy này có thể chấm dứt mối thù.", "In your old house is a note of debt between the families, in a hand identical to yours. It could end the feud."], [
            O(["Mang tới cho cả hai nhà", "Bring it to both houses"], ["Họ đọc xong, im lặng. Ba đời người đã chết vì một món nợ nhỏ.", "They read, and fall silent. Three generations died for a small debt."], { ds: 18, led: { thien: 5, nhan: 5 }, cf: "giai" }, "chinh"),
            O(["Đốt đi", "Burn it"], ["Hai nhà vẫn đánh nhau. Bạn ngủ ngon hơn họ.", "The houses keep fighting. You sleep better than they do."], { stat: { tamMa: 3 } }),
            O(["Bán cho bên trả cao hơn", "Sell to the higher bidder"], ["Họ dùng nó để giết nốt bên kia.", "They use it to finish the other side."], { s: 3, ds: -15, led: { su: 4 } }, "ta"),
          ]),
        }),
        S("sau", ["Đời sau", "The next generation"], ["Lứa trẻ hai nhà đã lớn. Một đứa bên này yêu một đứa bên kia.", "The youth of both houses have grown. One from each side falls in love."], [8, 12], { br: [{ if: { f: "giai" }, to: "hoa" }, { if: { s: 10 }, to: "hoa" }, { to: "tuyet" }] }),
        S("hoa", ["Hai nhà thông gia", "The houses marry"], ["Hai nhà thông gia. Trong đám cưới không ai dám nói tới ông cố.", "The houses marry. At the wedding, no one dares mention the great-grandfathers."], [2, 3], { end: true, wfx: {} }),
        S("tuyet", ["Hai nhà tuyệt tự", "The lines end"], ["Đám cưới bí mật bị phát hiện. Đến cuối năm, cả hai nhà không còn ai mang họ.", "The secret wedding is found out. By year's end, neither name has a bearer."], [2, 3], { end: true, wfx: { kill: "foe" } }),
      ],
    },
  ]);
})(typeof globalThis !== "undefined" ? globalThis : this);
