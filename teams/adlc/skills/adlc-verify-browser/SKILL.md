---
name: adlc-verify-browser
title: Verify bằng trình duyệt
description: Tự mở app hay trang trên trình duyệt thật, làm từng luồng người dùng, chụp ảnh làm bằng chứng.
triggers: adlc verify browser, verify bằng trình duyệt
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Verify bằng trình duyệt

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Đường dẫn bản clone của repo trong máy ảo nằm trong mục **Môi trường** của hướng dẫn hệ thống của bạn.

## Vì sao trong máy ảo

Trình duyệt dựng sẵn của bot chỉ vào được các cổng localhost do chính bot chạy. Local VM là một máy Linux có desktop và Firefox, nơi bạn tự chạy app rồi thao tác như người dùng thật.

Máy ảo **không thấy thư mục trên máy chủ**, chỉ thấy `/home/cua/workspace`. Repo đã có một bản clone ở đó.

## Các bước

1. Trên **máy chủ**, kéo nhánh gốc mới nhất vào bản clone: `git -C <bản clone trên máy chủ> pull --ff-only`.
2. Trong **máy ảo** (`vm_exec`): vào `/home/cua/workspace/<repo>`, cài requirements, chạy app ở cổng 5000 (chạy nền).
   - Python của máy ảo không cài được thư viện đã ghim thì dùng một môi trường ảo phiên bản khác, và ghi lại trong báo cáo.
3. Mở **Firefox của desktop** tới `http://127.0.0.1:5000` và thao tác như người dùng thật theo từng test case: bấm, gõ, chọn file, đọc kết quả.
4. Chụp màn hình **mỗi test case**. Ảnh không được chỉ đính kèm trong chat của bạn, vì người khác không đọc được thread của bạn:
   - lưu trong máy ảo vào `/home/cua/workspace/<repo>/reports/screenshots/<task>-<TC>.png`;
   - chép sang repo chính `reports/screenshots/`, commit (đứng tên bạn, skill git của bạn);
   - ghi đường dẫn đó ở cột **Bằng chứng** của bảng nghiệm thu.
5. Ghi Đạt / Đạt một phần / Không đạt cho từng test case.
   - Không đạt: tạo phần việc sửa, giao lại engineer phụ trách, review và verify lại.
   - Thấy test case hoặc tiêu chí không thể đạt được (mâu thuẫn với ràng buộc), báo lại người viết yêu cầu thay vì tự lách.

## Không có trình duyệt

Nếu máy ảo không khởi động được, verify bằng `curl` hoặc script, và ghi rõ trong báo cáo là **không qua trình duyệt**, kèm lý do.
