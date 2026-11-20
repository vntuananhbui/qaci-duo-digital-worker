---
name: adlc-git-local
title: Git cục bộ trong luồng ADLC
description: "Git cục bộ: nhánh việc, commit, PR là một nhánh, Tech Lead merge."
triggers: adlc git local, git cục bộ trong luồng adlc
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Git cục bộ trong luồng ADLC

Đường dẫn cụ thể (repo chính, worktree của bạn) nằm trong mục **Môi trường** của hướng dẫn hệ thống của bạn.

## Ai làm ở đâu

- **PM** và **Tech Lead** làm việc ở **repo chính** (nhánh `main`).
- Mỗi **Engineer** có một **git worktree riêng**, dùng chung lịch sử với repo chính. Chỉ sửa file trong worktree của mình.
- Không có `gh`, không push, không thêm remote.

## Engineer

1. Tạo nhánh từ `main` mới nhất, trong worktree của bạn: `git switch -c <tiền tố>/<task>-<phần> main`.
   - Tiền tố theo loại việc: `feature/`, `fix/`, `chore/`, `spike/` (research). Tech Lead đặt tên nhánh trong plan thì dùng đúng tên đó.
2. Commit nhỏ, message rõ ràng, **luôn đứng tên chính bạn** để báo cáo đo được thời gian từng người:
   `git -c user.name="<tên DW của bạn>" -c user.email="<tên viết thường>@casanos.local" commit -m "..."`
3. Trước khi "mở PR", **bắt buộc** xin chủ duyệt bằng card "Duyệt push" (skill `adlc-approval`). Tin báo Tech Lead phải có dòng "Chủ đã duyệt push lúc <giờ>"; thiếu dòng này Tech Lead sẽ trả lại.
4. **"Mở PR"** khi chưa có GitHub nghĩa là: commit hết lên nhánh, rồi báo Tech Lead gồm tên nhánh, danh sách commit (`git log --oneline main..HEAD`), tóm tắt thay đổi, test đã chạy và kết quả.
5. Nhận feedback review: sửa đúng từng điểm, commit thêm lên **cùng nhánh**, không mở nhánh mới. Nếu `main` đã đổi thì `git merge main` vào nhánh của bạn trước khi báo lại.
6. Không merge vào `main`, không force-push, không sửa nhánh của người khác.

## Tech Lead

- Báo "đã mở PR" mà không có dòng "Chủ đã duyệt push lúc <giờ>" thì **không review**: trả lại engineer với `rework: true`, yêu cầu xin chủ duyệt push trước.
- Xem thay đổi: `git -C <repo chính> log main..<nhánh>` và `git -C <repo chính> diff main...<nhánh>`.
- Chạy thử nhánh mà không đụng repo chính: `git -C <repo chính> worktree add ../review-<nhánh> <nhánh>`, chạy test ở đó, xong thì `git -C <repo chính> worktree remove ../review-<nhánh>`.
- Chỉ merge sau khi chủ chọn Đồng ý ở card "Duyệt merge" (skill `adlc-approval`). Merge, **luôn đứng tên bạn**:
  `git -C <repo chính> -c user.name="<tên DW của bạn>" -c user.email="<tên viết thường>@casanos.local" merge --no-ff <nhánh> -m "Merge <mô tả>"`
- Nhiều nhánh cùng sửa một file thì merge lần lượt, sau mỗi lần chạy lại test và xem diff. Gặp xung đột thì tự giải quyết nếu chỉ là ghép hai phần đã review; nếu phải đổi logic thì trả về engineer.
- Chỉ Tech Lead được merge vào `main`.

## Cổng chạy app

Mỗi người chạy app một cổng riêng để không đụng nhau: Tech Lead dùng 5000, engineer dùng 5001–5009.
