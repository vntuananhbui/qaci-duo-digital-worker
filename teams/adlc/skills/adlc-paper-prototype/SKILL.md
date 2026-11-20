---
name: adlc-paper-prototype
title: "Quy trình: paper → prototype"
description: Paper → prototype end-to-end (model, app demo, trang đánh giá), không bịa số. Dùng cho việc paper-prototype.
triggers: "adlc paper prototype, quy trình: paper → prototype"
tags: adlc-craft, internal
license: Unspecified
author: QACI Duo
---

# Quy trình: paper → prototype

Skill git và **nhánh gốc** của bạn ghi trong mục Môi trường của hướng dẫn hệ thống: `adlc-git-local` (demo cục bộ, nhánh gốc `main`) hoặc `adlc-git-azure` (Azure Repos, vd nhánh gốc `dev`). Dưới đây "nhánh gốc" là nhánh đó. Trên Azure, bước "merge" của Tech Lead là vote approve PR rồi chờ người thật hoàn tất PR trên Azure, và "Mở PR" của engineer là PR thật (skill `adlc-git-azure`).

Dùng kèm: `adlc-approval` (card xin chủ duyệt), skill git của bạn (nhánh `paper/<task>`), `adlc-code-review`, `adlc-verify-browser` (Tech Lead mở trang trực quan), `adlc-report` (nhật ký), và công cụ MCP **QACI Data** (`qaci_data_list_papers`, `qaci_data_get_paper`) khi chủ đã kết nối.

Mục tiêu là **một prototype sản phẩm chạy end-to-end**, dựng đúng phương pháp cốt lõi của paper ở quy mô nhỏ (CPU):

- **Pipeline đầy đủ**: dữ liệu → train → **model đã lưu** → **hàm/API dự đoán** nhận một input mới và trả kết quả.
- **App demo** chạy local bằng một lệnh: người dùng chọn hoặc tải lên một input (hoặc sinh mẫu ngay trên app, vd chỉnh mức nhiễu), bấm chạy, thấy **kết quả dự đoán, độ tin cậy, và trực quan từng bước của phương pháp** (vd đặc trưng trung gian, output của từng nhánh, cách các nhánh được kết hợp), không chỉ một dòng chữ.
- **Trang đánh giá** so với paper: số liệu, biểu đồ "Tái hiện" cạnh "Paper", và kết luận trung thực.

Không cần tái lập đầy đủ kết quả SOTA, nhưng thiếu một trong ba phần trên thì chưa phải prototype.

## Luật cứng của loại việc này

1. **Không bao giờ bịa số liệu.** Mọi con số "Tái hiện" trong báo cáo, README và trang trực quan đều **đọc từ `results/metrics.json`** do `eval.py` ghi ra, và báo cáo ghi kèm khoá của nó dạng `metrics.json:fusion.overall`. Số chưa có trong file thì ghi "chưa chạy" kèm lý do. Không chép số từ log hay từ trí nhớ, không ước lượng.
2. **Mọi con số "Paper" ghi rõ thuộc phương pháp nào và nằm ở bảng/mục nào** của paper. Paper thường có nhiều baseline; không gán số của baseline này cho baseline khác.
3. **Mọi thông số thí nghiệm có nguồn**: `paper` (kèm bảng/mục), `suy ra` (kèm lý do), hoặc `chưa rõ`. Không được âm thầm thêm điều kiện mà paper không có.
4. **Ngân sách thời gian**: `reproduce.sh` mặc định chạy xong trong **tối đa 10 phút thời gian thực** (đồng hồ, không phải tổng CPU; dùng nhiều nhân được), trừ khi chủ đồng ý ngân sách khác. Lệnh có thể chạy lâu luôn có giới hạn thời gian (vd `perl -e 'alarm shift; exec @ARGV' 900 ./reproduce.sh`); quá giờ thì dừng và báo, không chờ, không tự nới giới hạn.
5. **Ngưỡng "Khớp" chốt trong kế hoạch, trước khi chạy, và kiểm đúng khẳng định của paper.** Thấy kết quả rồi thì không được nới. Paper nói một con số hay một dạng cụ thể (vd "độ dốc khoảng −4", "hơn baseline 3 điểm", "tìm lại đúng công thức") thì ngưỡng đo đúng đại lượng đó. Tiêu chí dễ hơn (vd "thắng baseline" thay cho "độ dốc −4") chỉ là **kiểm thay thế**: ghi rõ là thay thế, và kết luận cho khẳng định đó tối đa là "Khớp một phần".
6. **Bằng chứng là thứ thật**: ảnh app chụp từ trình duyệt mở app đang chạy, không vẽ lại từ dữ liệu; số đọc từ file kết quả của đúng lần chạy được nhắc tới.

## Paper cần GPU hay hạ tầng lớn

App demo và luồng end-to-end (input → `predict` → kết quả và hình từng bước) **luôn phải chạy thật trên máy của chủ**. Phần nặng thì chọn **mức thấp nhất còn trung thực**, theo thứ tự:

| Mức | Khi nào | Phần nặng làm thế nào | App ghi nhãn |
|---|---|---|---|
| **A. Chạy thật, quy mô nhỏ** | Train và dự đoán đều làm được trên CPU trong ngân sách | Như quy trình dưới đây | "Model thật" |
| **B. Dùng trọng số có sẵn** | Train cần GPU nhưng tác giả hay cộng đồng công bố checkpoint, và dự đoán chạy được trên CPU (có thể bản nhỏ hay quantize) | Không train lại; tải checkpoint (ghi nguồn, giấy phép), `predict` chạy thật trên CPU; đánh giá trên tập con nhỏ | "Model thật, trọng số của <nguồn>" |
| **C. Mô hình thu nhỏ** | Không có checkpoint dùng được, hoặc dự đoán cũng quá nặng | Cài **đúng thuật toán của paper** ở cấu hình rất nhỏ (ít lớp, ít tham số, dữ liệu nhỏ) và train trên CPU, để từng bước của phương pháp vẫn chạy và vẽ được | "Bản thu nhỏ, không phải model của paper" |
| **D. Phát lại output có sẵn** | Ngay cả bản thu nhỏ cũng vô nghĩa (cần cluster, dữ liệu riêng, hệ thống đóng) | Dùng các ví dụ input/output **tác giả đã công bố** (trong paper, trang dự án, repo); app phát lại đúng các ví dụ đó, không bịa thêm | "Phát lại ví dụ của tác giả, không chạy model" |

- Mức B, C, D không tạo số "Tái hiện" cho phần chưa chạy: `metrics.json` chỉ chứa số đo thật (vd của bản thu nhỏ, ghi rõ là bản thu nhỏ); kết luận cho phần còn lại là "Chưa tái hiện được: cần <GPU/hạ tầng>".
- Nhãn mức phải hiện **trên app**, cạnh kết quả, không chỉ trong README.
- Code vẫn viết sao cho chạy được bản đầy đủ khi có hạ tầng: `config.yaml` có cấu hình "paper" cạnh cấu hình "demo", `train.py` tự dùng GPU nếu có. README ghi cần phần cứng gì và ước lượng thời gian/chi phí để chạy bản đầy đủ.
- Thuê GPU, gọi API trả phí hay dùng dịch vụ ngoài luôn cần card của chủ (chi tiền), kể cả khi đang tự duyệt.
- **Mức chọn theo phần cứng thật của nơi team chạy, không theo máy nào khác.** Trước khi đề xuất mức, kiểm và ghi vào hợp đồng: hệ điều hành, số nhân CPU, RAM, GPU có thật hay không (vd `nvidia-smi`; với PyTorch: `torch.cuda.is_available()`, `torch.backends.mps.is_available()`). Không có GPU thì "train cần GPU" nghĩa là chọn B, C hoặc D, không phải A.
- **Prototype phải chạy được trên CPU ở mọi máy chủ dùng.** Code chọn thiết bị tự động theo thứ tự CUDA → MPS → CPU, không viết cứng loại GPU nào. GPU chỉ được dùng để chạy nhanh hơn: `reproduce.sh` với cấu hình mặc định và app demo (cả phần dự đoán) phải chạy xong trên CPU trong ngân sách. Kết quả nào chỉ có được nhờ GPU riêng của một máy thì ghi rõ trong "Khác paper" là không tái lập được trên máy chỉ có CPU.
- **App demo không được chờ phần nặng.** Bước nào quá 5 giây trên CPU (vd sinh mẫu nhiều bước) thì app dùng kết quả tính sẵn trong `artifacts/` lúc chạy `reproduce.sh`, ghi nhãn "tính sẵn", và chỉ tính trực tiếp phần nhẹ.

## PM

1. Lấy paper từ một trong ba nguồn:
   - link arXiv/URL chủ gửi;
   - file PDF chủ đính kèm;
   - công cụ `qaci_data_list_papers` / `qaci_data_get_paper`, **chỉ khi chủ đã kết nối QACI Data**; nhiều kết quả thì hỏi chủ chọn đúng paper trước khi đọc tiếp.
   Không có nguồn nào rõ ràng thì hỏi lại chủ, không tự đoán hay bịa paper.
2. Đọc **bản đầy đủ** (với arXiv: `arxiv.org/html/<id>` hoặc PDF), không dừng ở abstract. Không đọc được bản đầy đủ thì ghi rõ "chỉ đọc abstract" và hỏi chủ trước khi giao tiếp.
3. Viết **hợp đồng paper** vào `plans/<repo>-<việc>/CONTRACT.md`. Mỗi mục có mã, nội dung và nguồn (bảng/mục/hình của paper):
   - **Bài toán**: paper giải quyết gì, vì sao quan trọng (vài câu, không đánh mã).
   - `K1…`: **kết luận chính cần kiểm**, 1–3 khẳng định cốt lõi (vd "A tốt hơn B ở điều kiện X"), không chỉ một con số tổng.
   - `D1…`: **dữ liệu**: tên và nguồn bộ dữ liệu, công khai không, dung lượng, số lớp, điều kiện dữ liệu (nhiễu, biến dạng, tiền xử lý).
   - `S1…`: **cách chia** train/val/test.
   - `M1…`: **phương pháp**: các bước theo đúng thứ tự, công thức chính viết bằng chữ thường, kích thước model.
   - `T1…`: **cách train**: optimizer, learning rate, epoch, batch, số seed.
   - `E1…`: **metric và kết quả paper**: bảng "phương pháp | metric | số | bảng/mục". Có kết quả theo nhóm điều kiện (vd theo mức nhiễu) thì chép cả nhóm.
   - `U1…`: **luồng người dùng của app demo**: ai dùng, đưa input gì vào, nhận lại gì, và người dùng cần **thấy** những bước nào của phương pháp để hiểu nó hoạt động ra sao.
   - `V1…`: **hình cần có trên trang đánh giá**: sơ đồ phương pháp, hình hay bảng chính của paper cần vẽ lại để so.
   - **Khả thi và mức đề xuất**: paper cần phần cứng gì để train và để dự đoán, có checkpoint công khai không; đề xuất **mức A/B/C/D** (mục "Paper cần GPU hay hạ tầng lớn") kèm lý do; mục nào ngoài phạm vi và vì sao. Chủ duyệt mức này cùng hợp đồng.
4. Gửi hợp đồng cho chủ, rồi **xin duyệt bằng card "Duyệt SPEC"** (điểm `spec`, skill `adlc-approval`). Đồng ý (hoặc tự duyệt theo cài đặt) thì **giao Tech Lead** qua `coordinate_bots`: ghi "Loại việc: paper-prototype. Quy trình: skill adlc-paper-prototype", kèm đường dẫn `CONTRACT.md`, link gốc hoặc file PDF, và `done_when`: "prototype đã merge; trên bản clone sạch `reproduce.sh` chạy xanh trong ngân sách và sinh model, `results/metrics.json`, `report/index.html`; `run_demo.sh` mở được app và chạy đủ luồng `U`; báo cáo đối chiếu từng mục K/E".
5. Không tự viết code, không tự lập kế hoạch tái hiện: đó là việc của Tech Lead.
6. Kết quả của Tech Lead về: **mở lại skill `adlc-report` (phần PM)** rồi mới trả lời chủ. Chép nguyên văn bảng báo cáo của Tech Lead, **đính kèm ảnh chụp app demo và trang đánh giá, cùng file `report/index.html`** (`attach_file`), ghi lệnh mở app (`./run_demo.sh`, địa chỉ local) để chủ tự thử, thêm đối chiếu với hợp đồng đã duyệt. Mọi số bạn viết thêm phải trích từ bảng đó hoặc từ `metrics.json`, không lấy từ lần chạy khác.

## Tech Lead

1. Nhận hợp đồng, ghi nhật ký (skill `adlc-report`).
2. **Kiểm hợp đồng với bản đầy đủ của paper** trước khi lập kế hoạch: mở paper, kiểm từng số trong `E` đúng phương pháp và đúng bảng, từng mục `D/S/M/T` có nguồn đúng. Sai hoặc thiếu thì trả PM sửa, ghi rõ mục nào.
3. **Kế hoạch tái hiện** ở `plans/<repo>-<việc>/PLAN.md`:
   - **Dữ liệu**, theo thứ tự ưu tiên:
     1. **Đúng bộ dữ liệu của paper** khi nó công khai và tải được (dưới khoảng 1 GB, giấy phép cho phép dùng nghiên cứu): dùng tập con theo đúng cách chia của paper. Cần đồng ý điều khoản hay đăng nhập để tải thì hỏi chủ qua PM.
     2. Chỉ khi không dùng được bộ của paper mới **tự sinh dữ liệu**, bắt chước đúng điều kiện trong `D`; **không thêm nhiễu, biến dạng hay độ khó mà paper không có** (nếu paper có thí nghiệm "độ bền" với biến dạng đó, chính nó cho thấy biến dạng làm tụt kết quả bao nhiêu). Ghi rõ vì sao không dùng được bộ của paper.
   - **`config.yaml`**: mọi thông số thí nghiệm, mỗi dòng có chú thích nguồn theo luật cứng 3, vd `epochs: 12  # paper §III-C` hay `snr_step: 2  # suy ra: paper chỉ ghi khoảng`. Code đọc thông số từ file này, không viết cứng.
   - **Bảng "Khác paper"**: từng điểm lệch so với hợp đồng (dữ liệu, số lớp, kích thước tập, model, cách train, số seed) và ảnh hưởng dự kiến.
   - **Ngưỡng khớp** theo luật cứng 5, một bảng mỗi dòng một mục `K`/`E`: "khẳng định của paper (đúng câu hoặc con số, kèm mục/hình)" | "đại lượng sẽ đo" | "ngưỡng Khớp" | "ngưỡng Khớp một phần" | "đây là kiểm trực tiếp hay kiểm thay thế". Paper chỉ có hình thì đọc giá trị trên hình (ghi đọc từ hình nào) và đặt ngưỡng trên đại lượng đó.
   - **Kiến trúc prototype**: các module (dữ liệu, model, train, `predict`, app demo), app dùng công nghệ gì (ưu tiên thứ chạy local bằng một lệnh, không cần mạng khi chạy: vd FastAPI/Flask phục vụ một trang HTML, hoặc Gradio/Streamlit nếu cài được vào venv), app hiện những gì cho từng mục `U`.
   - **Thứ tự làm cho engineer**, mỗi bước có lệnh kiểm riêng chạy nhanh: dữ liệu (in vài mẫu, thống kê theo lớp, so với `D`) → **baseline đơn giản nhất chạy được** → phương pháp của paper → `metrics.py` → `train.py` lưu model → `predict` → `eval.py` → `make_report.py` → app demo → `reproduce.sh`, `run_demo.sh`.
   - **Ngân sách thời gian** (luật cứng 4) cho `reproduce.sh`; app demo khởi động dưới 30 giây và trả kết quả một input dưới 2 giây trên CPU. Mỗi lần chạy mất dưới 2 phút thì chạy **ít nhất 3 seed**.
   - **Sản phẩm phải có**: `config.yaml`, `metrics.py` kèm test riêng, `train.py` lưu model vào `artifacts/`, module `predict` (một input → nhãn, độ tin cậy, các giá trị trung gian để vẽ), `eval.py` ghi `results/metrics.json`, `make_report.py` sinh `report/index.html`, app demo, `reproduce.sh`, `run_demo.sh`, test end-to-end cho `predict` và cho API của app, `README.md`, `.gitignore` (bỏ qua `__pycache__/`, `.pytest_cache/`, `.venv/`, `artifacts/`, thư mục dữ liệu tải về), nhánh `paper/<task>`.
4. **Luôn xin duyệt bằng card "Duyệt plan"** (điểm `plan`), kể cả khi việc nhỏ, theo skill `adlc-approval`: hỏi chủ bằng công cụ hỏi người dùng nếu hỏi được; nếu hệ thống không cho hỏi người (việc do PM giao), kết thúc lượt báo PM `CẦN CHỦ DUYỆT: plan` để PM hỏi chủ rồi chuyển câu trả lời. **Không tự duyệt plan của loại việc này, không dùng `NEEDS INPUT:`, không giao engineer trước khi có câu trả lời của chủ.** Nội dung cần chủ duyệt: gửi plan trong tin ngay trước card, card tóm tắt bộ dữ liệu, bảng "Khác paper", ngưỡng khớp và ngân sách. Đây là chỗ chủ chặn được lệch thiết lập trước khi code (skill `adlc-approval`).
5. **Giao engineer** qua `coordinate_bots`: "Loại việc: paper-prototype. Quy trình: skill adlc-paper-prototype", kèm đường dẫn `PLAN.md` và `CONTRACT.md`, `done_when`: "đủ sản phẩm trong plan, test xanh, `reproduce.sh` chạy trong ngân sách, đã báo Lead kèm nội dung `results/metrics.json`".
6. **Review** theo skill `adlc-code-review` (bỏ các mục không áp dụng cho code thử nghiệm nhỏ), cộng thêm:
   - đánh dấu từng mục `D/S/M/T/E` của hợp đồng: **đúng / lệch (có trong "Khác paper") / bỏ**; mục lệch mà không có trong "Khác paper" là lỗi;
   - `metrics.py` tách riêng và có test so với giá trị tính tay;
   - `config.yaml` có nguồn cho mọi dòng và code thật sự đọc từ đó;
   - trang đánh giá đủ các hình trong `V` và mọi số trên trang lấy từ `metrics.json`;
   - app demo làm đủ từng luồng `U`, và `predict` dùng đúng model đã lưu từ `train.py` (không train lại, không model khác).
   Engineer báo xong mà thiếu sản phẩm nào thì trả về. Đạt thì **xin duyệt bằng card "Duyệt merge"** (điểm `merge`), Đồng ý (hoặc tự duyệt) thì merge.
7. **Chạy lại trên bản clone sạch** sau merge: `git clone <repo> <thư mục tạm mới>`, chạy `reproduce.sh` có giới hạn thời gian, lưu toàn bộ output vào `plans/<repo>-<việc>/reproduce.log`. Rồi **tự dùng thử như người dùng** bằng skill `adlc-verify-browser`:
   - chạy `run_demo.sh`, **mở app trong trình duyệt thật** (gọi API thôi là chưa đủ). Trình duyệt của bot từ chối địa chỉ local, hoặc không có công cụ trình duyệt, thì chụp bằng Chrome headless từ shell: `perl -e 'alarm shift; exec @ARGV' 120 "<Chrome>" --headless=new --no-first-run --disable-gpu --use-mock-keychain --password-store=basic --user-data-dir=<thư mục tạm mới> --window-size=1400,1800 --virtual-time-budget=8000 --screenshot=<file>.png "<địa chỉ của luồng>"`, rồi xoá thư mục tạm. Thiếu hai cờ keychain thì Chrome có thể treo vài chục giây, làm từng luồng `U` với ít nhất 2 input khác nhau (vd một mẫu dễ, một mẫu khó như nhiễu cao), kiểm kết quả và các hình trung gian hiện đúng, chụp ảnh từng luồng;
   - mở `report/index.html`, kiểm hình hiện đủ và không cần mạng, chụp ảnh.
   Luồng nào hỏng là chưa đạt, trả engineer sửa.
8. **Đối chiếu** từng mục `K` và `E` với ngưỡng đã chốt, kết luận một trong ba: **Khớp**, **Khớp một phần**, **Chưa tái hiện được**. Chưa đạt ngưỡng thì vào **vòng thu hẹp chênh lệch, tối đa 3 vòng**: chẩn đoán nguyên nhân dựa vào bảng "Khác paper" (có thể chạy một thí nghiệm loại trừ nhỏ, đổi một yếu tố mỗi lần), giao engineer sửa đúng nguyên nhân, chạy lại bước 7. Hết 3 vòng thì dừng và báo kèm nguyên nhân đã tìm được và nguyên nhân còn nghi.
9. **Báo cáo** PM theo mẫu bên dưới, đính kèm ảnh chụp trang trực quan.

## Engineer

1. Nhận kế hoạch, đọc `PLAN.md`, `CONTRACT.md`. Công thức hay bước chưa rõ thì hỏi Tech Lead trước khi code. Paper dựa trên một bộ dữ liệu hay một phương pháp có code chính thức công khai (loader của dataset, công thức chuẩn) thì đọc nó trước.
2. Code bằng **Python** theo đúng thứ tự trong plan; xong mỗi bước thì chạy lệnh kiểm của bước đó rồi mới sang bước sau. Có baseline chạy được trước rồi mới thêm phương pháp của paper.
3. **`metrics.py`** chứa toàn bộ cách tính metric, có test riêng so với giá trị tính tay. Không sửa `metrics.py`, ngưỡng khớp, ngân sách hay giới hạn thời gian khi chưa có Tech Lead đồng ý.
4. **Đo trước khi chạy lớn**: chạy với cấu hình rất nhỏ (vài phần trăm dữ liệu, 1 epoch), đo thời gian, ước lượng cấu hình mặc định. Vượt ngân sách thì giảm cấu hình và báo Tech Lead; **không bao giờ chạy thử cấu hình đầy đủ khi chưa đo**. Lệnh dài luôn có giới hạn thời gian (luật cứng 4).
5. **`eval.py`** ghi `results/metrics.json`: số theo từng phương pháp, từng nhóm điều kiện paper dùng, từng seed và trung bình ± độ lệch, cộng `config` đã dùng và thời gian chạy. Ghi vào file tạm rồi mới đổi tên khi chạy xong; run lỗi thì không để lại `metrics.json` cũ hay dở.
6. **`make_report.py`** sinh **`report/index.html`** và lưu mỗi hình thành **một file ảnh riêng trong `report/`** (PNG/SVG, mỗi file dưới khoảng 100 KB), HTML chỉ trỏ bằng `<img src="...">` tương đối tới các file đó: **không nhúng ảnh base64 vào HTML**, để mỗi file đủ nhỏ cho một lần gọi tool khi đẩy lên GitHub qua app đã kết nối (không đọc được file trên máy). Không dùng CDN; trang và ảnh vẫn mở được khi không có mạng. Mọi số trên trang đọc từ `results/metrics.json`. Trang gồm, theo thứ tự:
   - **Paper làm gì**: 2–3 câu và một **sơ đồ phương pháp** (các khối và luồng dữ liệu, vẽ bằng matplotlib hoặc SVG).
   - **Dữ liệu trông thế nào**: vài mẫu đầu vào trực quan của mỗi lớp hay mỗi điều kiện (vd tín hiệu, ảnh, chuỗi).
   - **Kết quả chính**: mỗi mục `K` một biểu đồ, đường hoặc cột "Tái hiện" cạnh điểm "Paper"; vẽ lại các hình trong `V`.
   - **Phân tích lỗi**: một hình cho thấy model sai ở đâu (vd ma trận nhầm lẫn).
   - **Bảng số** đọc từ `metrics.json`, bảng **"Khác paper"**, và kết luận Khớp / Khớp một phần / Chưa tái hiện được theo ngưỡng.
7. **`train.py`** lưu model và mọi thứ cần để dự đoán (tham số chuẩn hoá, danh sách lớp) vào `artifacts/`. **`predict`** nạp đúng các file đó, nhận một input, trả nhãn, độ tin cậy và các giá trị trung gian để app vẽ.
8. **App demo** (công nghệ theo plan), chạy bằng `run_demo.sh`, in địa chỉ local khi sẵn sàng; chưa có model thì báo cần chạy `reproduce.sh` trước. Với mỗi luồng `U`: chọn, tải lên hoặc sinh input ngay trên app; hiện input dạng trực quan; hiện **từng bước của phương pháp** bằng hình (vd đặc trưng trung gian, xác suất của từng nhánh, cách kết hợp); hiện kết quả cuối và độ tin cậy. Có thêm một mục ngắn "Paper này làm gì" và link sang trang đánh giá. **Mở app ra là thấy ngay một ví dụ đã chạy xong** (input mẫu, kết quả và đủ hình từng bước), không để trang trống chờ người dùng bấm. **Mỗi luồng `U` mở được bằng một địa chỉ có tham số** (vd `/?input=…&mode=…`) dựng sẵn đúng trạng thái đó, để chụp ảnh từng luồng không cần bấm; README liệt kê các địa chỉ này. **Trình bày kết quả theo đúng dạng paper trình bày**: công thức rút gọn về dạng đọc được (gộp hằng số, làm tròn hợp lý, kèm dạng thô nếu cần), đơn vị và thang đo (vd log-log) giống hình của paper, tên lớp hay nhãn dễ hiểu thay vì chỉ số. Thay đổi giao diện thì làm theo skill `adlc-ui-preview` (ảnh chụp).
9. **`reproduce.sh`**: một lệnh chạy dữ liệu → `train.py` → `eval.py` → `make_report.py` với cấu hình mặc định, trong ngân sách, thoát mã khác 0 khi lỗi. **Repo tự đứng được trên máy khác**: `reproduce.sh` và `run_demo.sh` không trỏ tới đường dẫn nào ngoài repo (venv hay thư mục làm việc của bot); Python lấy từ biến môi trường nếu có, không thì `.venv/` trong repo hoặc `python3`, và `requirements.txt` ghi đủ gói cần cài.
10. Test end-to-end: `predict` trên vài input mẫu chạy được với model đã lưu; API của app trả đúng cấu trúc (khởi động app trong test, gọi API, tắt app).
11. Tự chạy `reproduce.sh` rồi `run_demo.sh` và tự dùng thử app, ghi lại **output thật**. Commit xong và test xanh thì **xin duyệt bằng card "Duyệt push"** (điểm `push`, skill `adlc-approval`). Đồng ý (hoặc tự duyệt) thì "Mở PR" theo skill git của bạn, báo lại Tech Lead kèm nội dung `results/metrics.json`, ảnh chụp app demo và trang đánh giá, rồi kết thúc lượt.
12. Cùng một lỗi sửa 3 lần chưa xong thì dừng, báo Tech Lead lỗi gì, đã thử gì, nghi nguyên nhân nào.

## Báo cáo

Tech Lead gửi PM (tự kiểm đủ các dòng trước khi gửi, không để trống dòng nào mà không ghi lý do):

```
# Báo cáo tái hiện: {tên paper} (paper-prototype)

| Mục | Giá trị |
|---|---|
| Paper | {tên, nguồn: arXiv/URL/PDF/QACI Data; đã đọc bản đầy đủ hay chỉ abstract} |
| Mức tái hiện | {A/B/C/D, lý do; phần nào chạy thật, phần nào thu nhỏ hay phát lại} |
| Dữ liệu dùng | {bộ của paper hay tự sinh, kích thước, vì sao} |
| Thí nghiệm chính | {lệnh `./reproduce.sh`, thời gian chạy trên bản clone sạch, số seed} |
| Kết quả paper | {phương pháp: số (bảng/mục)} |
| Kết quả tái hiện | {phương pháp: số (`metrics.json:<khoá>`), hoặc "chưa chạy" kèm lý do} |
| Kết luận chính của paper | {K1, K2…: tái hiện được / không / chưa kiểm, kèm số và khoá} |
| Khác paper | {bảng "Khác paper", điểm nào giải thích chênh lệch} |
| Vòng thu hẹp chênh lệch | {số vòng, mỗi vòng đổi gì, số trước/sau} |
| Kết luận | Khớp / Khớp một phần / Chưa tái hiện được — theo ngưỡng đã chốt trong plan |
| Test | {đạt}/{tổng} |
| App demo | {lệnh `./run_demo.sh`, địa chỉ local, từng luồng `U` đã tự thử với input nào, ảnh chụp đính kèm} |
| Trang đánh giá | {đường dẫn `report/index.html`, ảnh chụp đính kèm} |
| Phần ngoài phạm vi | {đúng như hợp đồng, hoặc phát sinh thêm, kèm lý do} |
| Thời gian hoàn thành | {từ nhật ký} |
```

PM chép nguyên văn bảng này vào báo cáo gửi chủ, theo đúng thứ tự của skill `adlc-report` (Kết luận, bảng của Tech Lead, đối chiếu với hợp đồng đã duyệt, ý kiến PM).
