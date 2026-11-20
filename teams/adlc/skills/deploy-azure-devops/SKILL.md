---
name: deploy-azure-devops
title: Đưa code lên Azure DevOps của chủ
description: Đưa code đã merge lên repo Azure DevOps (Azure Repos) của chủ bằng PAT — Composio chưa có toolkit quản lý cho Azure DevOps, nên PAT luôn là cách chính, không phải dự phòng. Dùng khi DEPLOY.md chọn nền tảng Azure DevOps.
triggers: deploy azure devops, đưa code lên azure devops, push azure repos
tags: deploy, git, azure-devops, internal
license: Unspecified
author: QACI Duo
---

# Đưa code lên Azure DevOps của chủ

Đưa nhánh gốc **đã merge** lên repo Azure Repos của chủ. Không sửa code của team: thiếu file (vd `fcode.json`, dù FCode Market/Release gắn với GitHub nên không áp dụng cho nền tảng này) thì trả người giao, ghi rõ cần thêm gì.

## Đầu vào: `DEPLOY.md`

Người giao việc ghi: đường dẫn repo cục bộ, nhánh gốc đã merge, **organization**, **project**, **tên repo** Azure DevOps, repo đã có hay cần tạo mới, có mở Pull Request thay vì push thẳng `main` không. Thiếu mục nào thì hỏi lại người giao, không đoán.

## Luôn hỏi chủ trước (card bằng công cụ hỏi người dùng)

Đưa dữ liệu ra ngoài hệ thống nên **luôn cần card**, kể cả khi team đang tự duyệt:
- trước khi **tạo repo mới** hoặc **đẩy code lần đầu**: card ghi organization/project/repo, số file và commit sẽ đẩy, `git diff --stat`;
- trước khi **đổi repo sang public** (Azure Repos mặc định chỉ người trong project thấy được).
Không bao giờ force-push hay xoá repo trên Azure DevOps.

## Kết nối: PAT của chủ (cách chính, không phải dự phòng)

**Composio chưa có toolkit quản lý Azure DevOps cho git** — khác với GitHub (ưu tiên app đã connect), nền tảng này luôn dùng Personal Access Token của chủ ngay từ đầu, không cần kiểm "đã connect app chưa".

Gọi `request_credential` với đúng nguyên văn `label: "Azure DevOps PAT"`, `delivery: "file"`, `reason`: "Scope Code (Read & Write); cần Code (Read, write, & manage) nếu phải tạo repo mới; hạn tối đa 90 ngày." Giá trị chỉ đọc vào biến cho từng lệnh, không in ra, không ghi vào chat, log hay repo:

```bash
PAT=$(cat "<đường dẫn file bí mật>")
AUTH="AUTHORIZATION: basic $(printf ':%s' "$PAT" | base64 | tr -d '\n')"
```

Luôn có `-c credential.helper=` ở mọi lệnh git chạm tới Azure DevOps: máy có thể đã lưu tài khoản của người khác (Keychain, credential store); git chỉ được dùng đúng token chủ cấp cho việc này.

## Các bước

1. **Repo đích**: `curl -s -H "$AUTH" "https://dev.azure.com/<org>/<project>/_apis/git/repositories/<repo>?api-version=7.1"` kiểm đã có chưa. Chưa có, `DEPLOY.md` yêu cầu tạo mới (sau card): `curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" -d '{"name":"<repo>"}' "https://dev.azure.com/<org>/<project>/_apis/git/repositories?api-version=7.1"`.
2. **Đẩy code** lên nhánh `main`:
   ```bash
   git remote add azure "https://dev.azure.com/<org>/<project>/_git/<repo>" 2>/dev/null \
     || git remote set-url azure "https://dev.azure.com/<org>/<project>/_git/<repo>"
   git -c credential.helper= -c http.extraheader="$AUTH" push azure main
   ```
3. **Kiểm lại**: `curl -s -H "$AUTH" ".../refs?filter=heads/main&api-version=7.1"`, so hash với commit cục bộ.
4. **Pull Request** (khi `DEPLOY.md` yêu cầu thay vì push thẳng `main`): `POST .../pullrequests?api-version=7.1` body `{"sourceRefName": "refs/heads/<nhánh>", "targetRefName": "refs/heads/main", "title": "..."}`.
5. Tool báo lỗi tham số hay đường dẫn API sai: thử lại đúng 1 lần với tham số đã sửa, vẫn lỗi thì dừng và báo nguyên văn.

## Lỗi

401/403: PAT hết hạn hoặc thiếu scope — báo chủ nguyên văn lỗi, `rm "<đường dẫn file bí mật>"`, gọi lại `request_credential`. 404 ở org/project/repo: báo đúng tên đã dùng trong `DEPLOY.md`, hỏi chủ xác nhận lại, không tự đoán tên khác.

## Báo cáo

Link repo (`https://dev.azure.com/<org>/<project>/_git/<repo>`), hash `main` trên remote, số file đã đẩy, link Pull Request nếu có tạo.
