# Content Team

Mini Content Management App cho team 2 người, xây bằng Next.js 15, TypeScript, Tailwind CSS, Prisma/PostgreSQL và object storage tương thích S3.

## Tính năng

- Board dạng bảng và lịch; tìm kiếm, lọc theo người, trạng thái, ngày.
- Tạo bài, chỉnh sửa trực tiếp trong drawer và autosave sau 700ms.
- 5 trạng thái nội dung, dashboard 4 chỉ số, cảnh báo thiếu link bài đã đăng.
- Upload nhiều ảnh bằng chọn file, kéo thả hoặc paste clipboard; preview, tải, xóa và chọn ảnh chính.
- Liên kết nhiều Facebook Page và đăng bài chữ/một ảnh/nhiều ảnh qua Facebook Graph API.
- API posts/users/images thống nhất `{ success, data }`; lỗi thống nhất `{ success: false, error }`.
- Upload multipart cho MVP và presigned URL cho production.
- Storage abstraction độc lập với controller, dùng được AWS S3, Cloudflare R2 hoặc S3-compatible storage.
- Optimistic concurrency qua `lastKnownUpdatedAt` (tùy chọn từ client).

Khi chưa kết nối PostgreSQL, giao diện tự hiển thị dữ liệu mẫu chỉ để xem UI; các thay đổi trong chế độ này không được lưu sau khi reload.

## Chạy local

Yêu cầu Node.js 20+ và PostgreSQL 15+.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## PostgreSQL

Tạo database rồi sửa `DATABASE_URL` trong `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/content_team?schema=public"
```

Production nên chạy migration đã commit bằng:

```bash
npx prisma migrate deploy
```

Seed xóa dữ liệu hiện tại trước khi thêm 2 user và bài mẫu, vì vậy chỉ dùng `npm run db:seed` cho môi trường local/demo.

## Cấu hình S3 / Cloudflare R2

```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=content-team
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://cdn.example.com
MAX_IMAGE_SIZE_MB=10
MAX_IMAGES_PER_POST=10
APP_ENCRYPTION_KEY=thay-bang-chuoi-bi-mat-toi-thieu-32-ky-tu
FACEBOOK_GRAPH_VERSION=v26.0
```

Với AWS S3, có thể bỏ `S3_ENDPOINT`, đặt region thực tế và dùng public CDN/bucket URL tại `S3_PUBLIC_URL`. Bucket cần CORS cho origin của frontend khi dùng direct upload:

```json
[{ "AllowedOrigins": ["https://app.example.com"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
```

Không đưa biến S3 secret vào biến `NEXT_PUBLIC_*`. Nếu bucket private, nên mở rộng `getPublicUrl()` để tạo signed GET URL hoặc phân phối qua CDN có kiểm soát.

## API chính

- `GET/POST /api/posts`
- `GET/PATCH/DELETE /api/posts/:id`
- `GET/POST /api/users`, `PATCH /api/users/:id`
- `GET/POST /api/posts/:postId/images`
- `PATCH/DELETE /api/images/:imageId`
- `PATCH /api/posts/:postId/images/order`
- `POST /api/uploads/presign`, `POST /api/uploads/complete`

`GET /api/posts` nhận `assigneeId`, `status`, `fromDate`, `toDate`, `search`, `page`, `limit`, `sort=oldest|newest`.

Direct-upload flow: gọi `presign`, upload file bằng `PUT` tới `uploadUrl`, rồi gọi `complete`. Multipart endpoint vẫn phù hợp MVP. Client hiện dùng multipart để có luồng hoàn chỉnh và validation MIME bằng magic bytes ở server.

## Liên kết Facebook Page

1. Tạo Meta App tại [Meta for Developers](https://developers.facebook.com/).
2. Lấy Page Access Token có quyền `pages_manage_posts` và `pages_read_engagement`.
3. Tạo khóa bằng `openssl rand -base64 32`, lưu vào `APP_ENCRYPTION_KEY`. Không đổi khóa sau khi đã lưu token.
4. Chạy migration, mở tab **Facebook Pages**, nhập Page ID và token rồi chọn **Kiểm tra và liên kết**.
5. Mở chi tiết bài, chọn Page và bấm **Đăng ngay**.

Token được mã hóa AES-256-GCM và không được API trả lại trình duyệt. Đăng thành công sẽ tự lưu permalink vào `publishedUrl` và đổi trạng thái bài thành `PUBLISHED`. Production cần Meta App được duyệt quyền phù hợp.

## Authentication

MVP chưa ép login để setup local nhanh. Trước khi public production, thêm middleware/session (Auth.js hoặc JWT), đặt helper `requireUser()` ở đầu các route `POST/PATCH/DELETE`, và kiểm tra quyền ở service. Không dựa vào ID user do client tự gửi làm bằng chứng xác thực. Upload/presign/complete/delete ảnh phải được bảo vệ cùng các mutation khác.

## Deploy

1. Tạo PostgreSQL managed và bucket S3/R2.
2. Khai báo toàn bộ biến môi trường từ `.env.example` trên nền tảng deploy.
3. Chạy `npx prisma migrate deploy` trong release step.
4. Build bằng `npm run build`, chạy bằng `npm start`.
5. Dùng presigned upload ở production nếu ảnh lớn hoặc traffic cao để tránh chuyển file qua serverless runtime.

### VPS bằng Docker Compose

Các file `Dockerfile`, `docker-compose.yml`, `Caddyfile` và `.env.production.example` đã sẵn sàng. Trên VPS:

```bash
git clone <repo-url> content-team && cd content-team
cp .env.production.example .env.production
# sửa toàn bộ giá trị trong .env.production, đặc biệt App Secret/domain
docker compose up -d --build
```

Nếu đã trỏ DNS về VPS, chạy proxy HTTPS tự động:

```bash
docker compose --profile proxy up -d
```

Meta App cần thêm đúng `FACEBOOK_REDIRECT_URI` vào danh sách Valid OAuth Redirect URIs. Không commit `.env.production`; các secret chỉ tồn tại trên VPS.

## Kiến trúc

- `app/api`: route handlers mỏng, chỉ parse request/response.
- `services`: PostService, UserService, ImageService và StorageService.
- `lib/validation.ts`: schema Zod dùng chung.
- `prisma`: schema, migration và seed.
- `components`: board, calendar, create dialog và detail drawer.

Khi xóa post, service chỉ xóa record sau khi tất cả object đã xóa thành công. Nếu storage lỗi, API trả `STORAGE_DELETE_FAILED` và giữ nguyên DB để có thể retry, tránh orphan metadata khó truy vết.
