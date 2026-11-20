---
name: adlc-approval
title: Duyệt ở 4 điểm của luồng ADLC
description: Tự duyệt hay xin chủ duyệt bằng card ở SPEC/plan/push/merge theo dòng Điểm duyệt. Dùng ở mỗi điểm duyệt.
triggers: adlc approval, duyệt ở 4 điểm của luồng adlc
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Duyệt ở 4 điểm của luồng ADLC

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Các skill quy trình (`adlc-feature`, `adlc-bugfix`, `adlc-research`, `adlc-chore`, `adlc-paper-prototype`) viết "xin duyệt bằng card Duyệt SPEC/plan/push/merge" ở đúng chỗ cần duyệt. Skill này nói **có thật sự gửi card ở đó không**: theo cài đặt dưới đây, không phải lúc nào cũng gửi. Mọi bước khác của skill quy trình (viết SPEC, lập plan, review, tự chạy test, merge, báo cáo…) vẫn làm đủ như skill đó mô tả.

## 4 điểm duyệt

| Tên điểm | Vai trò | Lúc nào | Chủ duyệt cái gì |
|---|---|---|---|
| `spec` | PM | Trước khi giao Tech Lead | SPEC (feature), báo lỗi (bugfix), đề bài (research), mô tả việc lớn (chore), paper brief (paper-prototype) |
| `plan` | Tech Lead | Sau khi có test plan và implementation plan, **trước khi chia việc**. **Việc nhỏ thì không cần card này** (skill `adlc-feature`, mục Việc nhỏ). | Plan: các phần, ai làm, nhánh, test case |
| `push` | Engineer | Đã commit và chạy test, **trước khi push hoặc báo Tech Lead "đã mở PR"** | Nhánh, danh sách commit, tóm tắt diff, test đã chạy |
| `merge` | Tech Lead | Review đạt và test xanh, **trước khi merge vào nhánh gốc** | Nhánh sắp merge, kết quả review và test |

Card "Xác nhận lỗi" (Tech Lead, bước 0 của skill `adlc-bugfix`, lỗi tự động gửi tới) **không nằm trong 4 điểm trên và luôn phải hỏi**, bất kể cài đặt dưới đây: một cảnh báo tự động chưa ai xác nhận là bug thật thì không được tự ý coi là đã duyệt.

## Cài đặt: tự động hay hỏi chủ

Đọc dòng bắt đầu bằng `Điểm duyệt:` trong khối **Shared section context** ở đầu hướng dẫn hệ thống của bạn (chủ hoặc admin sửa khối này trên app; có hiệu lực ngay từ lượt sau, không cần cài lại team). **Không có dòng này thì coi như tự động** — đây là mặc định của team.

- **`Điểm duyệt: tự động`** (hoặc thiếu dòng): **không gửi card** ở 4 điểm trên. Tự duyệt và làm tiếp ngay, nhưng **bắt buộc ghi lại mỗi lần tự duyệt**:
  - vào nhật ký tiến độ (skill `adlc-report`), ngay lúc tự duyệt: giờ, tên điểm (vd "Duyệt merge"), lý do đạt, bằng chứng;
  - vào báo cáo cuối: thêm một dòng hoặc mục "Tự duyệt" liệt kê từng điểm đã tự duyệt, **cái gì** (tên điểm), **vì sao đạt** (vd "review đạt, test xanh, 12/12 test case"), **bằng chứng** (lệnh đã chạy, số test, đường dẫn diff hay evidence).
- **`Điểm duyệt: hỏi chủ`**: hỏi **cả 4 điểm**, đúng như mô tả ở "Mẫu card Duyệt" bên dưới. Không ghi "tự duyệt" ở điểm nào.
- **`Điểm duyệt: hỏi chủ khi <danh sách>`**: chỉ hỏi các điểm có tên trong danh sách (phân tách bằng dấu phẩy, mỗi tên là một trong `spec`, `plan`, `push`, `merge`); điểm không có tên thì tự động như trên (vẫn ghi lại). Vd `Điểm duyệt: hỏi chủ khi spec, merge` → hỏi Duyệt SPEC và Duyệt merge bằng card, tự duyệt Duyệt plan và Duyệt push (có ghi nhật ký).
- Dòng ghi sai cú pháp hoặc có tên điểm lạ: hiểu đúng phần đọc được, bỏ qua phần còn lại, và nói một câu cho chủ biết bạn đang hiểu dòng này thế nào trong lần trả lời gần nhất — đừng tự suy diễn thêm hay dừng việc lại để hỏi.

**Luôn gửi card, bất kể dòng `Điểm duyệt:` ghi gì:**
- Chủ **nói thẳng trong cuộc trò chuyện** là muốn duyệt điểm này hoặc việc này (vd "merge thì cho tôi xem trước", "từ giờ cứ hỏi tôi trước khi push"): không bao giờ bỏ một card chủ đã xin rõ, kể cả đang ở chế độ tự động hay điểm đó không có trong danh sách "hỏi chủ khi".
- **Duyệt plan của việc `paper-prototype`**: plan của loại việc này chốt bộ dữ liệu, các điểm lệch so với paper và ngưỡng khớp, nên chủ phải xem trước khi engineer code, kể cả việc nhỏ. Chỉ bỏ card này khi chủ nói thẳng là khỏi hỏi cho việc đó.
- **Hành động phá huỷ hoặc ra ngoài hệ thống**: force-push, xoá nhánh, push thẳng vào nhánh gốc của remote (bỏ qua PR/review), chi tiền, gửi email hoặc đăng bài ra ngoài. Những việc này luôn cần card trước khi làm, dù cài đặt đang ghi tự động cho mọi điểm — đây không phải một trong 4 điểm duyệt, mà là một giới hạn riêng, không tắt được bằng dòng `Điểm duyệt:`.

Chủ dặn riêng cho một task "cứ làm, khỏi hỏi" (luật theo từng task, không đổi cài đặt chung) vẫn áp dụng như trước và vẫn ghi vào nhật ký, không phụ thuộc dòng `Điểm duyệt:`.

## Luật chung (khi có hỏi)

- Duyệt và quyết định luôn hỏi **chính chủ của bạn** (người sở hữu DW của bạn), bằng **công cụ hỏi người dùng** của bạn (tên thường là `ask_user` hoặc `request_user_input`). Công cụ này hiện thành card có nút trong chat của chủ.
- **Không** xin duyệt bằng một câu chữ thường trong tin trả lời, và **không** nhờ DW khác duyệt thay chủ. Tin gửi qua `coordinate_bots` không tới tay người thật.
- **Điểm duyệt phải hỏi chủ mà bạn đang làm việc do bot khác giao** (Tech Lead, engineer): nhiều khi hệ thống không cho bạn hỏi người (công cụ hỏi trả "Not asked…", hoặc hướng dẫn lượt ghi bot giao việc quyết). Khi đó **đừng tự duyệt và đừng dùng `NEEDS INPUT:`**: dừng phần cần duyệt, kết thúc lượt bằng báo cáo gửi người giao việc ghi rõ `CẦN CHỦ DUYỆT: <điểm>` kèm tóm tắt đủ để chủ quyết (như nội dung card) và đường dẫn tài liệu, rồi chờ. Chỉ làm tiếp khi nhận được tin giao việc ghi câu trả lời của chủ.
- **PM nhận `CẦN CHỦ DUYỆT`** từ bot trong team: hỏi chủ bằng card (công cụ hỏi người dùng) **trong cuộc trò chuyện với chủ**, nguyên nội dung bot đó gửi, không thêm ý kiến duyệt của bạn. Chủ trả lời rồi thì giao lại đúng bot đó qua `coordinate_bots`: "Chủ trả lời điểm <điểm>: <nguyên văn câu trả lời>". Không bao giờ tự trả lời thay chủ.
- Card duyệt bạn tự gửi được (công cụ hỏi chạy được) **luôn** gửi bằng công cụ hỏi người dùng, **không bao giờ** bằng dòng `NEEDS INPUT:`, và không ghi `Default:`. Trong việc do bot khác giao, câu hỏi `NEEDS INPUT:` được chuyển cho bot giao việc trả lời thay chủ (không ai trả lời thì tự lấy `Default:`), kể cả khi hệ thống dặn "đừng dừng lại hỏi người". Card của công cụ hỏi thì chỉ chủ trả lời được; lượt của bạn chờ tới khi chủ bấm.
- Bot trong team có câu hỏi duyệt (SPEC, plan, push, merge, hay câu nào ghi "chủ duyệt"): **không bao giờ duyệt thay chủ**, kể cả khi hệ thống ghi là bạn trả lời.
  - Hệ thống báo bot đó **đang chờ chủ trả lời card**: **không gửi gì vào luồng việc của bot đó** cho tới khi chủ trả lời, vì tin bạn gửi vào luồng sẽ được tính là câu trả lời của card. Chỉ báo chủ một dòng trong cuộc trò chuyện với chủ: card duyệt đang chờ ở bot nào.
  - Câu hỏi duyệt đến bạn dạng `NEEDS INPUT:` (hệ thống ghi là bạn trả lời): trả lời ngay bot đó qua `coordinate_bots` "Đây là điểm duyệt của chủ, tôi không duyệt thay. Hỏi lại chủ bằng công cụ hỏi người dùng (card) và chờ chủ bấm.", rồi báo chủ. Phải trả lời như vậy, vì im lặng thì bot kia sẽ tự lấy `Default:`.
- Mỗi vai trò chỉ xin duyệt **điểm của mình** (bảng trên). Các card Duyệt plan, Duyệt merge, Duyệt push đến chủ của Tech Lead và engineer, không đến chủ của PM: PM không báo trước hay hỏi chủ mình về các card đó. Tech Lead không xin PM duyệt plan hay merge; PM không xin duyệt merge thay Tech Lead; engineer không xin Tech Lead duyệt push.
- Chỉ kết thúc tin bằng dòng `NEEDS INPUT:` khi **thật sự** có câu hỏi cần người trả lời. Không có câu hỏi thì không viết dòng đó (không bao giờ viết "NEEDS INPUT: không có"): dòng này luôn bật một card.
- Hỏi xong thì **chờ câu trả lời**. Không tự coi im lặng là đồng ý, không làm tiếp phần cần duyệt.

## Mẫu card Duyệt

Một câu hỏi, gồm:

- **Tiêu đề ngắn** (header): vd "Duyệt SPEC", "Duyệt plan", "Duyệt merge", "Duyệt push".
- **Nội dung câu hỏi**: tóm tắt đủ để chủ quyết mà không phải mở chỗ khác, tối đa khoảng 15 dòng: việc gì, phạm vi, con số chính, nhánh, kết quả test. Bản đầy đủ (SPEC, plan) thì gửi trong tin nhắn ngay trước card.
- **Hai lựa chọn**, mỗi lựa chọn có mô tả việc sẽ xảy ra:
  - `Đồng ý`: vd "Giao Tech Lead ngay", "Merge vào nhánh gốc", "Push và báo Tech Lead".
  - `Yêu cầu sửa`: "Ghi điều cần sửa ở ô trả lời".
- Luôn để ô trả lời tự do.

## Card Duyệt push và Duyệt merge phải kèm git diff

Chủ chỉ duyệt được khi thấy code. Ngay **trước** card:

0. **Kiểm nhánh đã commit đủ**, chạy trong worktree của nhánh. Sai điều nào thì sửa trước, chưa gửi card:
   - `git status --short` không có dòng nào: mọi thay đổi đã commit, không còn file `M` hay `??` thuộc việc này.
   - `git log --oneline <nhánh gốc>..<nhánh>` có ít nhất một commit. Duyệt push là duyệt **commit đã có**, không phải thay đổi sẽ commit sau.
   - Mọi file mới (code, **test**, tài liệu) đều nằm trong commit: `git show --stat --format= <nhánh gốc>..<nhánh>`. File bị `.gitignore` bỏ qua (`git check-ignore -v <file>` có kết quả, vd repo bỏ qua `tests/*`) thì thêm bằng `git add -f <file>` và ghi điều này trong tin.
   - Test bạn báo trong card chạy trên đúng commit đó (chạy lại sau khi commit nếu đã sửa thêm).
1. Ghi toàn bộ diff ra file trong thư mục làm việc: `git diff <nhánh gốc>...<nhánh> > review-<nhánh>.diff.txt` (đổi `/` trong tên nhánh thành `-`). Duyệt merge: diff là đúng những gì sắp vào nhánh gốc.
2. Đính kèm file bằng `attach_file`, rồi xoá file đó. Không commit file này.
3. Gửi một tin ngắn: nhánh, các commit (`git log --oneline <nhánh gốc>..<nhánh>`) và `git diff --stat <nhánh gốc>...<nhánh>`. **Không** dán diff vào tin.

Nội dung card ghi "Diff đầy đủ ở file đính kèm ngay trên". Đổi giao diện thì card Duyệt push còn kèm phần xem trước theo skill `adlc-ui-preview` (ảnh màn hình ngay trên, app đang mở trên desktop để chủ Take control thử).

Điểm đang **tự duyệt** (không gửi card) cũng làm đủ bước 0 ở trên và ghi file diff đó vào nhật ký/evidence, để sau này xem lại được đúng diff đã tự duyệt.

## Các dạng card khác

Dùng khi cần chủ quyết định, không phải để duyệt (các dạng này luôn hỏi, không theo cài đặt `Điểm duyệt:`):

- **Chọn một phương án**: mỗi lựa chọn là một phương án, mô tả ghi ưu/nhược điểm ngắn. Vd chọn hướng triển khai, chọn khuyến nghị của research.
- **Chọn nhiều**: bật chọn nhiều. Vd chọn những bug sửa trong đợt này.
- **Hỏi tự do**: một câu hỏi không có lựa chọn, khi thiếu thông tin chỉ chủ biết.
- **Nhiều câu trong một card**: khi cần làm rõ vài điểm cùng lúc, tối đa 3 câu.

## Xử lý câu trả lời

- `Đồng ý`: làm tiếp đúng việc đã ghi trong lựa chọn.
- `Yêu cầu sửa` hoặc trả lời tự do: làm theo, rồi **hỏi lại bằng card mới** với bản đã sửa. Không làm tiếp khi chưa có `Đồng ý`.
- Ghi vào nhật ký: điểm duyệt, giờ hỏi, giờ trả lời, kết quả (hỏi chủ) hoặc lý do và bằng chứng (tự duyệt).
