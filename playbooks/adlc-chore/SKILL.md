---
name: adlc-chore
title: "Quy trình: bảo trì (chore)"
description: Quy trình việc lặt vặt (dependency, cấu hình, dọn dẹp). Dùng cho việc chore.
triggers: "adlc chore, quy trình: bảo trì"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Quy trình: bảo trì (chore)

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Dùng kèm: `adlc-approval`, skill git của bạn, `adlc-code-review`, `adlc-report`.

Nguyên tắc: **hành vi người dùng thấy không được đổi**. Nếu buộc phải đổi hành vi thì đó không còn là chore, báo PM để phân loại lại.

## PM

1. **Mô tả việc**: làm gì, vì sao (nợ kỹ thuật, bảo mật, hiệu năng, tài liệu…), phạm vi file/module, rủi ro.
2. Tiêu chí nghiệm thu: toàn bộ test hiện có vẫn xanh; hành vi không đổi; tiêu chí riêng của việc (vd phiên bản thư viện mới, test không còn chập chờn qua N lần chạy, tài liệu có mục X).
3. Việc nhỏ, rủi ro thấp: giao Tech Lead ngay, báo chủ một dòng. Việc lớn (nâng thư viện lớn, refactor nhiều module): gửi mô tả rồi **xin duyệt bằng card "Duyệt việc"** (skill `adlc-approval`) trước khi giao.
4. Giao Tech Lead: "Loại việc: chore. Quy trình: skill adlc-chore", kèm mô tả và `done_when`.
5. Kết quả của Tech Lead về: **mở lại skill `adlc-report` (phần PM)** rồi mới trả lời chủ. Gửi đủ 4 phần, chép nguyên văn mọi bảng của Tech Lead, tự kiểm đủ bảng trước khi gửi. Không gửi đoạn tóm tắt.

## Tech Lead

1. Nhận việc, ghi nhật ký. Chạy toàn bộ test trên nhánh gốc và ghi lại kết quả làm **mốc trước**.
2. Chia việc nếu lớn; việc nhỏ một engineer là đủ, nhánh `chore/<task>`. Ghi "Loại việc: chore. Quy trình: skill adlc-chore".
3. Review theo skill `adlc-code-review`, kiểm thêm:
   - diff đúng phạm vi, không lẫn tính năng mới hay sửa lỗi;
   - toàn bộ test vẫn xanh, **không test nào bị xoá, tắt hay nới** để cho qua;
   - nâng thư viện: đọc changelog phần thay đổi gây vỡ, chạy test ở mọi môi trường hợp lệ.
4. **Xin duyệt bằng card "Duyệt merge"** (skill `adlc-approval`), Đồng ý thì merge, chạy toàn bộ test lần nữa. So với mốc trước: cùng số test, cùng kết quả (trừ test chập chờn nếu đó là việc của task).
5. Báo cáo PM theo skill `adlc-report`. Mục Chất lượng ghi kết quả test trước/sau.

## Engineer

1. Chạy toàn bộ test trước khi sửa, ghi kết quả.
2. Sửa đúng phạm vi. Thấy lỗi hoặc ý tưởng tính năng trên đường đi thì ghi lại báo Tech Lead, không sửa lẫn vào.
3. Chạy lại toàn bộ test, so với kết quả trước.
4. Commit xong và test xanh (đổi giao diện thì xem trước theo skill `adlc-ui-preview`) thì **xin duyệt bằng card "Duyệt push"** (skill `adlc-approval`). Đồng ý thì "Mở PR" theo skill git của bạn, ghi kết quả test trước/sau, rồi kết thúc lượt.
