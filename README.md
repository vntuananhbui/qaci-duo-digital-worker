# QACI Duo playbook library (published)

This branch is generated from `main` by the `Publish library` workflow. Do not edit it; open a pull request against `main`.

## Digital Worker

Install a whole Digital Worker in QACI Duo: **+ → Templates → Community templates → Load → Add team**.

- **ADLC** — 1 bot làm hết: PM, Tech Lead, Engineer và Deployer gộp chung. Giao việc, nó tự lập kế hoạch, tự code, tự kiểm, tự đưa lên GitHub/Azure DevOps và deploy demo.
- **Experiment Designer** — Give it a survey's gaps, get runnable experiment designs with fixed success criteria — published as one visual HTML report.
- **Experiment Runner** — Give it DESIGN.md, get back real results — it codes and executes each experiment like a normal coding agent, never a simulated or estimated number.
- **Experiment Validator** — Give it a design and its results, get an independent verdict — checked against the original criteria and raw evidence, never a summary.
- **Literature Surveyor** — Give it a topic, get a cited literature survey with explicit gaps — searched and read for real through Exa, never guessed from a title.

## Playbook

Add one playbook to a Digital Worker you already have: open its SKILL.md link, copy all of it, paste it into **Settings → Skills → Import a skill** (Settings shows Skills in Advanced mode), switch the skill on, then **Assign** it.

| Playbook | What it does | Carried by | SKILL.md |
|---|---|---|---|
| Duyệt ở 4 điểm của luồng ADLC | Tự duyệt hay xin chủ duyệt bằng card ở SPEC/plan/push/merge theo dòng Điểm duyệt. Dùng ở mỗi điểm duyệt. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-approval/SKILL.md) |
| Quy trình: sửa lỗi | Quy trình sửa lỗi: báo lỗi, test tái hiện, sửa, kiểm, merge, báo cáo. Dùng cho việc bugfix. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-bugfix/SKILL.md) |
| Quy trình: bảo trì (chore) | Quy trình việc lặt vặt (dependency, cấu hình, dọn dẹp). Dùng cho việc chore. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-chore/SKILL.md) |
| Review code (Tech Lead) | Cách Tech Lead review nhánh trước khi merge. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-code-review/SKILL.md) |
| Quy trình: implement feature | Quy trình tính năng: SPEC, plan, code kèm test, review, merge, báo cáo. Dùng cho việc feature. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-feature/SKILL.md) |
| Git cục bộ trong luồng ADLC | Git cục bộ: nhánh việc, commit, PR là một nhánh, Tech Lead merge. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-git-local/SKILL.md) |
| Quy trình: paper → prototype | Paper → prototype end-to-end (model, app demo, trang đánh giá), không bịa số. Dùng cho việc paper-prototype. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-paper-prototype/SKILL.md) |
| Nhật ký tiến độ và báo cáo | Nhật ký tiến độ và mẫu báo cáo cuối gửi chủ. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-report/SKILL.md) |
| Quy trình: nghiên cứu | Quy trình nghiên cứu, so sánh phương án, khuyến nghị có bằng chứng. Dùng cho việc research. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-research/SKILL.md) |
| Phân loại task (PM) | PM phân loại việc chủ giao (feature, bugfix, research, chore, paper-prototype) và mở đúng skill. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-triage/SKILL.md) |
| Xem trước giao diện trên desktop riêng | Xem trước thay đổi giao diện: chạy app, chụp ảnh trước/sau gửi kèm card. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-ui-preview/SKILL.md) |
| Verify bằng trình duyệt | Tự mở app hay trang trên trình duyệt thật, làm từng luồng người dùng, chụp ảnh làm bằng chứng. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/adlc-verify-browser/SKILL.md) |
| Đưa code lên Azure DevOps của chủ | Đưa code đã merge lên repo Azure DevOps (Azure Repos) của chủ bằng PAT — Composio chưa có toolkit quản lý cho Azure DevOps, nên PAT luôn là cách chính, không phải dự phòng. Dùng khi DEPLOY.md chọn nền tảng Azure DevOps. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/deploy-azure-devops/SKILL.md) |
| Đưa code lên GitHub của chủ | Đưa code đã merge lên GitHub của chủ, release kèm file build, đăng FCode Market. Dùng khi nhận DEPLOY.md. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/deploy-github/SKILL.md) |
| Deploy demo lên Railway | Deploy app từ repo GitHub của chủ lên Railway để có link demo. Dùng khi DEPLOY.md có mục Railway. | — | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/deploy-railway/SKILL.md) |
| Deploy demo lên Render | Deploy app từ repo GitHub của chủ lên Render để có link demo. Dùng khi DEPLOY.md có mục Render. | ADLC | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/deploy-render/SKILL.md) |
| Design experiments from a literature survey | Turn a survey's gaps and a research question into one or more concrete, runnable experiment designs with explicit hypotheses, methods and success criteria, published as one visual HTML report. | Experiment Designer | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/design-experiments/SKILL.md) |
| Implement and run a designed experiment | Build and actually execute each experiment from DESIGN.md like a normal coding task, capture real output, and write one markdown results file per experiment — never simulated or guessed numbers. | Experiment Runner | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/run-experiment/SKILL.md) |
| Survey related literature for a research topic | Search for papers, articles and prior work related to a given research topic using the Exa app connection, synthesize it by theme with a source matrix, compile a cited survey document with explicit gaps, and hand it to the Experiment Designer. | Literature Surveyor | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/survey-literature/SKILL.md) |
| Independently validate experiment results | Re-check the Runner's results against the Designer's own success criteria and the real underlying output, not the Runner's summary, and report a clear verdict per experiment plus an overall answer to the research question. | Experiment Validator | [raw](https://github.com/vntuananhbui/qaci-duo-digital-worker/raw/library/playbooks/validate-results/SKILL.md) |
