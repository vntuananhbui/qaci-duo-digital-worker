---
name: adlc-bugfix
title: "Quy trình: sửa lỗi"
description: "Quy trình sửa lỗi: báo lỗi, test tái hiện, sửa, kiểm, merge, báo cáo. Dùng cho việc bugfix."
triggers: "adlc bugfix, quy trình: sửa lỗi"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Quy trình: sửa lỗi

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Dùng kèm: `adlc-approval`, skill git của bạn, `adlc-code-review`, `adlc-verify-browser`, `adlc-report`.

Nguyên tắc: **cảnh báo tự động chưa phải bug** (Tech Lead định vị và kiểm tra trước, bước 0), **không sửa lỗi mà chưa tái hiện được**, và **không coi là xong nếu chưa có test bắt đúng lỗi đó**.

## PM

1. **Viết báo lỗi** (thay cho SPEC):
   - Hiện tượng: người dùng thấy gì, ở đâu.
   - Bước tái hiện, đánh số. Kèm input cụ thể (file, giá trị) nếu có.
   - Kết quả mong đợi và kết quả thực tế.
   - Mức độ: Nghiêm trọng (chặn người dùng, mất dữ liệu) / Cao / Trung bình / Thấp, kèm lý do.
   - Phạm vi ảnh hưởng: ai, tính năng nào.
   - Tiêu chí nghiệm thu: AC1 = làm đúng các bước tái hiện thì ra kết quả mong đợi; AC thêm = các hành vi liên quan không bị hỏng.
   - Thiếu bước tái hiện thì hỏi lại người báo trước khi giao.
2. Mức Nghiêm trọng thì báo chủ ngay khi nhận. Mọi mức: gửi báo lỗi cho chủ rồi **xin duyệt bằng card "Duyệt báo lỗi"** (skill `adlc-approval`); chỉ giao Tech Lead khi chủ chọn Đồng ý.
3. Giao Tech Lead qua `coordinate_bots`: "Loại việc: bugfix. Quy trình: skill adlc-bugfix", kèm báo lỗi và `done_when`: "tái hiện được, có test bắt lỗi, đã sửa và merge, test cũ vẫn xanh, có báo cáo".
4. Kết quả của Tech Lead về: **mở lại skill `adlc-report` (phần PM)** rồi mới trả lời chủ. Gửi đủ 4 phần, chép nguyên văn mọi bảng của Tech Lead, tự kiểm đủ bảng trước khi gửi. Không gửi đoạn tóm tắt.

## Tech Lead

### 0. Lỗi tự động gửi tới (log, cảnh báo, webhook): định vị và kiểm tra trước
Cảnh báo chỉ là **nghi lỗi**, chưa phải bug. Chưa qua bước này thì chưa tạo nhánh, chưa viết test, chưa giao ai.

**a. Định vị: lỗi ở đâu, ai nắm**
- Đọc traceback từ khung **thuộc code của đội** gần lỗi nhất (bỏ qua khung thư viện, runtime): file, hàm, dòng.
- Ghép file với repo trong mục Môi trường (vd `casanos-fe`, `casanos-be`, `casanos-ai`). Không ghép được (lỗi trong thư viện, hạ tầng, dịch vụ ngoài) thì ghi rõ "ngoài code của đội".
- Phân vùng: giao diện, API, dữ liệu, AI hay hạ tầng. Từ đó chọn **Software Engineer** hay **AI Engineer**.
- `git log -n 5 -- <file>` và `git blame -L <dòng>` để biết commit hay PR nào đưa dòng đó vào. Lỗi mới xuất hiện ngay sau một PR thì ghi PR đó (dấu hiệu hồi quy).
- Phiên bản đang chạy khi lỗi xảy ra (commit, môi trường) so với đầu nhánh gốc.

**b. Kiểm tra: có phải bug thật không** (ghi kết quả từng mục vào nhật ký)
1. **Trùng?** Cùng chữ ký lỗi (loại lỗi + file:dòng) đã có nhánh `fix/…`, PR mở hay plan trong thư mục plans? Có thì gộp vào việc đó, báo người đang làm, dừng.
2. **Đã sửa rồi?** Chạy lại bước tái hiện trên **đầu nhánh gốc**. Không còn lỗi thì tìm commit đã sửa, trả lời "đã sửa ở <commit>", dừng.
3. **Tái hiện được không?** Chạy đúng lệnh hoặc input trong cảnh báo, **3 lần**. Không lần nào ra thì là "chưa tái hiện được": ghi đã thử gì, xin thêm dữ liệu (input, log quanh đó), dừng. Lúc có lúc không thì ghi "chập chờn" và tìm điều kiện gây ra.
4. **Hành vi đúng hay sai?** So với README, SPEC, test hiện có, hoặc hành vi trước đây. Ví dụ:
   - input sai bị từ chối bằng thông báo rõ ràng là **đúng**, không phải bug;
   - crash, traceback lộ ra người dùng, dữ liệu sai, mất dữ liệu là **bug**.
5. **Code hay môi trường?** Do thiếu cấu hình hay biến môi trường, hết đĩa, mạng, dịch vụ ngoài chết, dữ liệu bẩn từ nguồn khác thì không phải bug code: phân loại `chore` hoặc vận hành, báo chủ, không mở luồng sửa code.
6. **Mức độ:** bao nhiêu lần, bao nhiêu người hay tính năng bị ảnh hưởng, có mất dữ liệu không, theo thang của PM (Nghiêm trọng / Cao / Trung bình / Thấp).

**c. Kết luận bằng card "Xác nhận lỗi"** (skill `adlc-approval`) gửi chủ. Card gồm:
- chữ ký lỗi, vị trí (repo, file:dòng, vùng), commit hoặc PR nghi gây ra;
- kết quả 6 mục kiểm tra;
- kết luận: **Bug thật** / Không phải bug (lý do) / Trùng với … / Đã sửa ở … / Chưa tái hiện được.

Lựa chọn của card: "Đồng ý, sửa" / "Không sửa" / "Cần thêm thông tin". Chỉ khi chủ chọn **Đồng ý, sửa** mới làm tiếp từ bước 1. Khi đó báo PM một dòng để PM theo dõi: loại bugfix, mức độ, repo, người sẽ sửa. Kết luận khác thì ghi nhật ký và dừng, không tạo nhánh.

1. Nhận báo lỗi, ghi nhật ký.
2. **Tái hiện lỗi** trên nhánh gốc hiện tại, đúng theo các bước. Không tái hiện được thì ghi lại đã thử gì, hỏi lại PM, chưa giao sửa.
3. **Viết hoặc giao viết test bắt lỗi trước**: một test tự động thất bại trên nhánh gốc hiện tại vì đúng lỗi này. Ghi lại lệnh chạy và kết quả đỏ.
4. **Tìm nguyên nhân gốc**: lỗi nằm ở đâu và vì sao, không chỉ triệu chứng. Ghi vào plan. Kiểm xem lỗi cùng kiểu có ở chỗ khác không.
5. **Giao sửa** cho engineer, **không tự sửa** dù lỗi nhỏ: thường một engineer là đủ, tên nhánh `fix/<task>`. Phần AI thì giao AI Engineer. Ghi "Loại việc: bugfix. Quy trình: skill adlc-bugfix", nguyên nhân gốc đã tìm được, test bắt lỗi, `done_when`: "test bắt lỗi chuyển xanh, toàn bộ test cũ vẫn xanh, đã báo Lead".
6. **Review** theo skill `adlc-code-review`, kiểm thêm:
   - bản sửa nhắm đúng nguyên nhân gốc, không chỉ che triệu chứng (vd bắt ngoại lệ rồi bỏ qua);
   - test bắt lỗi **đỏ trước khi sửa, xanh sau khi sửa**: tự chạy test đó trên nhánh gốc cũ và trên nhánh;
   - không đổi hành vi ngoài phạm vi lỗi.
7. Trước khi merge **xin duyệt bằng card "Duyệt merge"** (skill `adlc-approval`). Đồng ý thì merge, rồi **verify lại đúng các bước tái hiện** (có giao diện thì dùng skill `adlc-verify-browser`), và chạy toàn bộ test để chắc không hồi quy.
8. **Báo cáo** PM theo skill `adlc-report`. Mục Chất lượng ghi: test bắt lỗi (tên, đỏ → xanh), nguyên nhân gốc một câu, toàn bộ test.

## Engineer

1. Nhận việc sửa: đọc báo lỗi, nguyên nhân gốc Tech Lead đã tìm, test bắt lỗi.
2. Tự chạy test bắt lỗi trên nhánh mới, thấy nó **đỏ** trước khi sửa.
3. Sửa đúng nguyên nhân gốc, phạm vi nhỏ nhất có thể. Thấy nguyên nhân gốc khác với Tech Lead nói thì báo lại trước khi sửa lớn.
4. Chạy lại: test bắt lỗi **xanh**, toàn bộ test cũ vẫn xanh.
5. Commit xong và test xanh (đổi giao diện thì xem trước theo skill `adlc-ui-preview`) thì **xin duyệt bằng card "Duyệt push"** (skill `adlc-approval`). Đồng ý thì "Mở PR" theo skill git của bạn: ghi nguyên nhân, cách sửa, test đỏ → xanh, rồi kết thúc lượt.
