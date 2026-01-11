# AGENTS.md — InvoiceFlow Backend (Go + Postgres + Blockchain)

Bạn là AI coding agent (Codex) hỗ trợ phát triển backend cho dự án **InvoiceFlow**.
Mục tiêu: làm backend ổn định, dễ test, có cấu trúc rõ ràng, có luồng nghiệp vụ invoice → funding → repayment,
và có module tích hợp blockchain (mint / mark-paid / settle) theo chuẩn an toàn.

---

## 0) Nguyên tắc làm việc (bắt buộc)

### Không phá vỡ hệ thống
- Không tự ý đổi tên route, đổi cấu trúc response, đổi schema DB nếu chưa có migration tương ứng.
- Ưu tiên backward-compatible. Nếu bắt buộc breaking-change: tạo migration + update docs + update tests.

### Không leak secrets
- Không hardcode private key, JWT secret, DB URL.
- Tất cả secrets lấy từ env (hoặc secret manager). Nếu thiếu: dùng `.env.example`.

### Không "đoán bừa" nghiệp vụ
- Nếu thiếu thông tin, đưa ra giả định rõ ràng trong PR description và trong README/Docs.

### Độ ưu tiên
1) Correctness + Security
2) Observability (log, error code, tracing đơn giản)
3) Clean architecture / maintainability
4) Performance (chỉ tối ưu khi cần)

---

## 1) Tech stack mặc định (assumption)

- Language: Go (1.21+)
- HTTP framework: Gin hoặc Fiber (tùy repo hiện tại, không tự đổi)
- DB: Postgres
- Migration: goose / golang-migrate / atlas (tùy repo)
- Access DB: sqlx / pgx / gorm (tùy repo)
- Auth: JWT (access token), refresh token (nếu có)
- Storage: Cloudinary/S3 (tùy repo)
- Cache/Queue (optional): Redis (nếu repo đã có)

---

## 2) Kiến trúc (phải tuân thủ)

### Layering
- `handlers` / `controllers`: chỉ nhận request, validate input, gọi service
- `services`: nghiệp vụ (invoice, funding, repayment, blockchain orchestration)
- `repositories` / `store`: DB queries (không để SQL rơi vào handler)
- `models` / `domain`: structs domain + enums/statuses
- `pkg` / `utils`: helper thuần (time, uuid, hashing, errors)

### Quy tắc phụ thuộc
- Handler -> Service -> Repo
- Service không import HTTP framework types
- Repo không biết JWT / request context (trừ context.Context)

---

## 3) Folder structure chuẩn (gợi ý)

invoice-flow-backend/
├─ cmd/api/main.go                 # boot server
├─ internal/
│  ├─ app/app.go                   # wiring: router, middlewares, deps
│  ├─ config/                      # load env + validate config
│  ├─ db/                          # db init + migrations runner
│  ├─ domain/                      # entity + enums + errors
│  ├─ repositories/                # SQL queries, tx, locking
│  ├─ services/                    # business logic
│  ├─ handlers/                    # HTTP handlers
│  ├─ routes/                      # route grouping
│  ├─ middleware/                  # auth, request-id, cors, recovery
│  └─ blockchain/                  # chain adapter + tx submitter
├─ migrations/                     # SQL migrations
├─ docs/                           # API docs + flow diagrams
├─ .env.example
└─ README.md

Không cần đúng 100% nếu repo đang khác, nhưng phải giữ tư tưởng layer rõ ràng.

---

## 4) Domain model & status conventions

### Invoice
- `status`: DRAFT | SUBMITTED | APPROVED | TOKENIZED | FUNDED | PARTIALLY_PAID | PAID | DEFAULTED | CANCELED
- Các thay đổi status phải đi qua service (không update trực tiếp từ handler).

### Funding
- `status`: PENDING | CONFIRMED | CANCELED | REFUNDED | SETTLED

### Payment/Repayment
- `status`: INITIATED | CONFIRMED | FAILED

Tất cả enums phải có:
- validation
- mapping DB (varchar/enum)
- không dùng string rải rác.

---

## 5) API contract (phải nhất quán)

### Response format (chuẩn)
- Success:
  - `{ "data": <payload>, "meta": {...optional} }`
- Error:
  - `{ "error": { "code": "<SNAKE_OR_DOT_CODE>", "message": "<human>", "details": {...optional} } }`

### HTTP status
- 200 OK: GET/PUT/PATCH thành công
- 201 Created: create invoice/funding
- 400: validation input
- 401/403: auth/permission
- 404: not found
- 409: conflict (status invalid, optimistic lock)
- 422: business rule violated
- 500: unexpected

### Endpoints tối thiểu (MVP)
Auth
- POST /auth/register
- POST /auth/login
- GET  /auth/me

Invoices (Issuer)
- POST /invoices
- GET  /invoices
- GET  /invoices/:id
- POST /invoices/:id/submit
- POST /invoices/:id/tokenize        # trigger mint (nếu on-chain)
- POST /invoices/:id/upload          # upload document

Funding (Investor)
- POST /invoices/:id/fund            # tạo funding intent
- GET  /me/fundings

Admin/Settlement
- POST /admin/invoices/:id/approve
- POST /admin/invoices/:id/mark-paid # off-chain settle + (optional) on-chain settle

---

## 6) Blockchain integration rules (cực quan trọng)

### Design
- `internal/blockchain` chỉ là adapter (EVM RPC client, signer, contract wrapper).
- `service` quyết định khi nào gọi chain, không để handler gọi trực tiếp.

### Key management (bắt buộc)
- Private key KHÔNG nằm trong repo.
- Nếu dùng signer:
  - env: `CHAIN_PRIVATE_KEY` hoặc integration external signer (khuyến nghị)
- Logging: tuyệt đối không log private key / raw signed tx.

### Idempotency
- Mint/Settle phải idempotent:
  - nếu invoice đã tokenized => gọi tokenize lần 2 phải trả 409 hoặc trả lại kết quả đã có.
  - lưu `tx_hash`, `token_id`, `chain_status` trong DB.

### Confirmation
- Không giả định tx thành công ngay.
- Tối thiểu: lưu tx hash + trạng thái `PENDING`, có worker/poller confirm.
- Nếu MVP chưa có worker: cung cấp endpoint `/admin/tx/:hash/refresh` hoặc cron manual.

---

## 7) Database rules

### Migration-first
- Bất cứ thêm cột/bảng/index nào phải có migration.
- Không chỉnh schema “tay” trên DB production.

### Transaction
- Các luồng quan trọng (funding, mark-paid) phải dùng transaction.
- Nếu có concurrency: dùng row-level locking hoặc optimistic lock (`version`).

### Indexing
- Index cho:
  - invoices(status)
  - invoices(issuer_id)
  - fundings(invoice_id)
  - fundings(investor_id)
  - blockchain_tx(invoice_id, tx_hash)

---

## 8) Validation & security

- Validate JSON body + query params + path params.
- Rate limit (optional MVP) cho auth endpoints.
- Password: hash bằng bcrypt/argon2 (tùy repo).
- JWT:
  - exp ngắn (15m–1h)
  - refresh token nếu có.
- RBAC:
  - issuer, investor, admin
  - admin routes phải require role=admin.

---

## 9) Observability (minimum)

- Mỗi request có `request_id` (middleware).
- Log có: request_id, user_id (nếu có), route, latency, error_code.
- Không log body của login hoặc secrets.

---

## 10) Testing strategy

- Unit tests cho services (mock repo + blockchain adapter).
- Integration test cho repository (Postgres test container nếu có).
- Mỗi bugfix phải có test tái hiện.

---

## 11) “How to work” checklist cho mỗi PR

1) Cập nhật docs/README nếu API thay đổi
2) Thêm migration nếu đổi schema
3) Thêm/Update tests
4) Chạy lint + tests
5) Đảm bảo không có secrets trong diff

---

## 12) Env variables (mẫu)

Bắt buộc có trong `.env.example`:
- APP_ENV=dev
- PORT=8080
- DB_URL=postgres://...
- JWT_SECRET=...
- CORS_ORIGINS=...
- STORAGE_* (nếu upload)

Blockchain (nếu bật):
- CHAIN_RPC_URL=
- CHAIN_ID=
- CHAIN_PRIVATE_KEY= (chỉ dev)
- CONTRACT_INVOICE_NFT_ADDRESS=

---

## 13) Khi gặp thiếu thông tin

Nếu chưa có spec chi tiết:
- Implement theo MVP:
  - invoice create/list/get
  - submit + approve
  - funding intent + list
  - mark-paid
- Blockchain: để behind feature flag `ENABLE_CHAIN=false` (default false) để backend chạy offline-chain được.

Kết thúc.
