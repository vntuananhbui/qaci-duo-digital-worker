# ADLC

**The whole ADLC team in one bot.** 1 bot làm hết: PM, Tech Lead, Engineer và Deployer gộp chung. Giao việc, nó tự lập kế hoạch, tự code, tự kiểm, tự đưa lên GitHub/Azure DevOps và deploy demo.

The installed identity for QACI Duo's own single-agent software worker (ADLC: Agentic Development Lifecycle). The owner gives it work — in a direct chat — and it classifies the work, writes the acceptance criteria, plans it, implements it itself (optionally spinning up a Task/Agent subagent to isolate a piece of the implementation, never required), verifies the result itself under real conditions, merges, and — always asking first before anything leaves the system — pushes to the owner's own GitHub or Azure DevOps and deploys a demo.

## Playbook

- **Phân loại task (PM)** — PM phân loại việc chủ giao (feature, bugfix, research, chore, paper-prototype) và mở đúng skill. ([SKILL.md](../../playbooks/adlc-triage/SKILL.md))
- **Quy trình: implement feature** — Quy trình tính năng: SPEC, plan, code kèm test, review, merge, báo cáo. Dùng cho việc feature. ([SKILL.md](../../playbooks/adlc-feature/SKILL.md))
- **Quy trình: sửa lỗi** — Quy trình sửa lỗi: báo lỗi, test tái hiện, sửa, kiểm, merge, báo cáo. Dùng cho việc bugfix. ([SKILL.md](../../playbooks/adlc-bugfix/SKILL.md))
- **Quy trình: nghiên cứu** — Quy trình nghiên cứu, so sánh phương án, khuyến nghị có bằng chứng. Dùng cho việc research. ([SKILL.md](../../playbooks/adlc-research/SKILL.md))
- **Quy trình: bảo trì (chore)** — Quy trình việc lặt vặt (dependency, cấu hình, dọn dẹp). Dùng cho việc chore. ([SKILL.md](../../playbooks/adlc-chore/SKILL.md))
- **Duyệt ở 4 điểm của luồng ADLC** — Tự duyệt hay xin chủ duyệt bằng card ở SPEC/plan/push/merge theo dòng Điểm duyệt. Dùng ở mỗi điểm duyệt. ([SKILL.md](../../playbooks/adlc-approval/SKILL.md))
- **Nhật ký tiến độ và báo cáo** — Nhật ký tiến độ và mẫu báo cáo cuối gửi chủ. ([SKILL.md](../../playbooks/adlc-report/SKILL.md))
- **Quy trình: paper → prototype** — Paper → prototype end-to-end (model, app demo, trang đánh giá), không bịa số. Dùng cho việc paper-prototype. ([SKILL.md](../../playbooks/adlc-paper-prototype/SKILL.md))
- **Git cục bộ trong luồng ADLC** — Git cục bộ: nhánh việc, commit, PR là một nhánh, Tech Lead merge. ([SKILL.md](../../playbooks/adlc-git-local/SKILL.md))
- **Review code (Tech Lead)** — Cách Tech Lead review nhánh trước khi merge. ([SKILL.md](../../playbooks/adlc-code-review/SKILL.md))
- **Verify bằng trình duyệt** — Tự mở app hay trang trên trình duyệt thật, làm từng luồng người dùng, chụp ảnh làm bằng chứng. ([SKILL.md](../../playbooks/adlc-verify-browser/SKILL.md))
- **Xem trước giao diện trên desktop riêng** — Xem trước thay đổi giao diện: chạy app, chụp ảnh trước/sau gửi kèm card. ([SKILL.md](../../playbooks/adlc-ui-preview/SKILL.md))
- **Đưa code lên GitHub của chủ** — Đưa code đã merge lên GitHub của chủ, release kèm file build, đăng FCode Market. Dùng khi nhận DEPLOY.md. ([SKILL.md](../../playbooks/deploy-github/SKILL.md))
- **Đưa code lên Azure DevOps của chủ** — Đưa code đã merge lên repo Azure DevOps (Azure Repos) của chủ bằng PAT — Composio chưa có toolkit quản lý cho Azure DevOps, nên PAT luôn là cách chính, không phải dự phòng. Dùng khi DEPLOY.md chọn nền tảng Azure DevOps. ([SKILL.md](../../playbooks/deploy-azure-devops/SKILL.md))
- **Deploy demo lên Render** — Deploy app từ repo GitHub của chủ lên Render để có link demo. Dùng khi DEPLOY.md có mục Render. ([SKILL.md](../../playbooks/deploy-render/SKILL.md))

Source: `workers/adlc.md` on `main`.
