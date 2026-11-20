---
name: adlc-code-review
title: Review code (Tech Lead)
description: Cách Tech Lead review nhánh trước khi merge.
triggers: adlc code review, review code
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Review code (Tech Lead)

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Review thật, không duyệt cho qua. Cách xem diff, chạy thử nhánh và merge: skill git của bạn.

## Các bước

1. Đọc diff toàn bộ nhánh, đối chiếu với SPEC (hoặc báo lỗi) và **ranh giới đã chốt** trong plan.
2. **Tự chạy test của nhánh** trong worktree tạm. Không tin con số engineer báo.
   - Task có API, lệnh hay giao diện: **tự chạy app** (theo mục "Chạy test" của hướng dẫn hệ thống: database thử, tài khoản admin và user thường) và tự gọi **từng test case** như người dùng thật, ghi lệnh và kết quả vào báo cáo review.
   - **Chưa tự chạy test và chưa tự gọi thử thì chưa được gửi card Duyệt merge.** Không làm được (thiếu dịch vụ, thiếu quyền) thì ghi rõ trong card là phần đó chưa kiểm và vì sao, không ghi "đạt".
3. Đi qua checklist bên dưới.
4. Thiếu bất kỳ mục nào: gửi feedback cụ thể (file, dòng, cần sửa gì, vì sao) qua `coordinate_bots` với `rework: true`, rồi kết thúc lượt và review lại khi engineer báo. **Không tự sửa code thay engineer.**
5. Đạt: merge. Ghi vào nhật ký tiến độ (skill `adlc-report`): giờ review, kết quả, số vòng.

## Checklist chung

- Đúng yêu cầu và đúng ranh giới đã chốt; không sửa ngoài phạm vi.
- Mọi code mới hoặc đổi hành vi đều có test; test cũ không bị xoá hay nới để cho qua.
- Test nằm **trong commit của nhánh**, không chỉ trong worktree của engineer: `git show --stat --format= <nhánh gốc>..<nhánh>` phải có file test. Repo bỏ qua `tests/*` trong `.gitignore` thì file test phải được thêm bằng `git add -f`.
- Chạy được với **đúng số process như khi chạy thật**: đọc cấu hình chạy (Dockerfile, `gunicorn.conf.py`, số worker, celery). Code ghi file chung, cache hay trạng thái dùng chung (vd log xoay vòng, file tạm, khoá) phải an toàn khi nhiều worker cùng chạy, và có test nhiều process nếu có thể.
- Xử lý đầu vào lỗi (file hỏng, thiếu trường, giá trị ngoài miền) có thông báo dễ hiểu, không làm sập app.
- Không thêm dependency, dịch vụ mạng hay model ngoài ràng buộc của task.
- README hoặc tài liệu cập nhật nếu cách chạy, cấu hình hay API đổi.
- Diff gọn: không file rác, không debug print, không đổi định dạng hàng loạt.

## Phần AI (model, đặc trưng, xếp hạng, ngưỡng, độ chính xác)

- Ngưỡng hoặc tham số **không được chỉnh cho khớp đúng tập đang dùng để chấm** (vd đặt ngưỡng ngay trên điểm sai cao nhất của benchmark). Bắt engineer báo số liệu trên một tập **held-out** (biến đổi khác, chưa dùng để chỉnh), và tự thử vài input mới chưa ai thấy.
- Kết quả chỉ tốt trên benchmark mà kém trên held-out là **không đạt**.
- Số liệu phải có trước/sau, cùng một tập, cùng cách tính.

## Test ổn định giữa các môi trường

- Test chất lượng phải pass trên mọi môi trường hợp lệ (phiên bản Python, bản build thư viện khác nhau), chứ không chỉ trên máy của engineer.
- Ngưỡng phải chừa biên độ dựa trên số đo thật ở nhiều môi trường, hoặc loại bỏ nguồn dao động (vd tạo ảnh thử không nén thay vì JPEG).
- Ngưỡng đặt sát đúng con số đo trên một máy là **không đạt**.

## Dùng thử như người dùng thật

- **Thử trong điều kiện chạy thật, không chỉ trên dữ liệu đứng yên**:
  - API đọc file hay trạng thái mà chính app đang ghi (log, cache, upload, hàng đợi): gọi nó **trong lúc app vẫn đang ghi** (vd tải file log đang được ghi, nhiều lần, có request khác chạy song song) và so số byte, nội dung trả về.
  - Code chạy trong nhiều process (gunicorn nhiều worker, celery): thử với đúng số worker như cấu hình chạy thật, và khi worker khởi động lại.
  - Test của engineer chỉ dùng dữ liệu đứng yên cho các trường hợp trên thì yêu cầu thêm test cho trường hợp đang thay đổi.

Trước khi coi nhánh là đạt, chạy app và thử vài input điển hình. Đọc kỹ output: có đúng **mục tiêu nghiệp vụ** không, chứ không chỉ đúng câu chữ tiêu chí (vd nhãn "Rất giống" gắn cho cả 5 kết quả thì nhãn vô dụng, dù tiêu chí ghi "đạt").
