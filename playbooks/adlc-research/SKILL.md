---
name: adlc-research
title: "Quy trình: nghiên cứu"
description: Quy trình nghiên cứu, so sánh phương án, khuyến nghị có bằng chứng. Dùng cho việc research.
triggers: "adlc research, quy trình: nghiên cứu"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Quy trình: nghiên cứu

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Dùng kèm: `adlc-approval` (card duyệt), skill git của bạn (nhánh spike), `adlc-report` (nhật ký và báo cáo).

Kết quả của research là **một khuyến nghị có bằng chứng**, không phải tính năng. **Không merge code thử nghiệm vào nhánh gốc.**

## PM

1. **Viết đề bài nghiên cứu** (thay cho SPEC):
   - Câu hỏi cần trả lời, một câu.
   - Vì sao cần biết, quyết định nào phụ thuộc vào câu trả lời.
   - Các phương án đã biết (nếu có) và **tiêu chí so sánh** (độ chính xác, tốc độ, chi phí, độ phức tạp, ràng buộc offline…), có trọng số nếu được.
   - Ràng buộc và giới hạn thời gian.
   - Tiêu chí nghiệm thu: mỗi phương án có số liệu cho từng tiêu chí; có khuyến nghị kèm lý do; có rủi ro của khuyến nghị.
2. Gửi đề bài cho chủ, rồi **xin duyệt bằng card "Duyệt đề bài"** (skill `adlc-approval`). Chủ chọn Đồng ý thì giao Tech Lead: "Loại việc: research. Quy trình: skill adlc-research", kèm đề bài và `done_when`: "báo cáo so sánh và khuyến nghị đã commit trong reports/, có số liệu".
3. Kết quả của Tech Lead về: **mở lại skill `adlc-report` (phần PM)** rồi mới trả lời chủ. Gửi đủ 4 phần, chép nguyên văn mọi bảng của Tech Lead, tự kiểm đủ bảng trước khi gửi, và thêm phần **Quyết định cần chủ đưa ra**. Không gửi đoạn tóm tắt.

## Tech Lead

1. Nhận đề bài, ghi nhật ký. Thêm phương án mà PM chưa nêu nếu thấy đáng thử.
2. **Kế hoạch nghiên cứu**: mỗi phương án là một hướng, ghi cách đo từng tiêu chí, **dùng cùng một bộ dữ liệu thử và cùng cách đo** cho mọi phương án để so sánh công bằng.
3. Chia hướng cho engineer (phần AI cho AI Engineer), mỗi người một nhánh `spike/<task>-<hướng>`, gửi cùng lúc. `done_when`: "số liệu cho từng tiêu chí, script đo chạy lại được, ghi chú ưu/nhược điểm, đã báo Lead".
4. Review kết quả: số liệu có chạy lại được không, so sánh có cùng điều kiện không. Thiếu thì yêu cầu bổ sung với `rework: true`.
5. Viết `reports/research-<task>.md`: câu hỏi, bảng so sánh phương án × tiêu chí (số liệu thật), khuyến nghị và lý do, rủi ro, việc tiếp theo nếu chọn khuyến nghị (thường là một task feature). Commit vào nhánh gốc; **chỉ commit báo cáo và script đo**, không merge code thử nghiệm.
6. Báo cáo PM theo skill `adlc-report`. Mục Nghiệm thu dùng tiêu chí của đề bài; mục Chất lượng là bảng so sánh tóm tắt.

## Engineer

1. Nhận một hướng nghiên cứu. Làm trên nhánh spike, code thử nghiệm được phép đơn giản, nhưng **script đo phải chạy lại được** và ghi rõ lệnh chạy.
2. Đo đúng các tiêu chí, trên đúng bộ dữ liệu chung. Không chỉnh phương án của mình cho khớp tập đo.
3. Báo Tech Lead: số liệu, cách đo, ưu/nhược điểm, điều bất ngờ. Rồi kết thúc lượt.
