# Sticky Wall

Mỗi sáng tạo một ảnh nền iPhone có 3 sticky note ngẫu nhiên từ kho ghi chú của bạn.

```
App (iPhone)  →  notes.json trên GitHub  →  GitHub Actions render PNG lúc 05:00  →  Phím tắt iPhone tải ảnh và đặt làm ảnh nền
```

## 1. Đưa lên GitHub (làm một lần, có thể làm trên điện thoại)

1. Tạo repo mới (ví dụ `sticky-wall`), tải toàn bộ thư mục này lên nhánh `main`.
2. **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main` / `(root)`.
3. **Settings → Actions → General → Workflow permissions**: chọn *Read and write permissions*.
4. Vào tab **Actions → Render wallpaper → Run workflow** để tạo ảnh đầu tiên.
5. Mở `https://<tài-khoản>.github.io/<repo>/` trên Safari, bấm Chia sẻ → *Thêm vào MH chính*.

Link ảnh nền hằng ngày: `https://<tài-khoản>.github.io/<repo>/wallpaper-today.png`

## 2. Token để app đẩy ghi chú lên GitHub

GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate:
- Repository access: chỉ repo `sticky-wall`
- Permissions: **Contents = Read and write**

Dán token vào app, tab Cài đặt → Đồng bộ GitHub. Token chỉ lưu trên máy bạn.

## 3. Phím tắt iOS 26

Mở app **Phím tắt** → tạo phím tắt mới:

1. **Lấy nội dung của URL** (Get Contents of URL): `https://<tài-khoản>.github.io/<repo>/wallpaper-today.png?t=` + biến *Ngày hiện tại* (để tránh ảnh cũ trong cache).
2. **Đặt hình nền** (Set Wallpaper) → Màn hình khóa, dùng ảnh ở bước 1, tắt "Hiện bản xem trước".
   - Nếu iOS 26 của bạn không có hoặc chặn hành động này: dùng **Lưu vào album ảnh** với album `Sticky`, rồi đặt màn hình khóa dùng **Photo Shuffle** từ album đó.

Tự động hoá: tab **Tự động hoá → Tạo → Thời gian trong ngày** → 06:30, hằng ngày → **Chạy ngay**, chọn phím tắt trên.

## Chạy thử trên máy

```
npm ci
node scripts/render.mjs          # tạo wallpaper-today.png
WALLPAPER_DATE=2026-11-01 node scripts/render.mjs   # thử ngày khác
```

## Tuỳ chỉnh

Trong app (tab Cài đặt): nền tối/sáng, số note, kích thước màn hình, chỉ lấy ghi chú theo thẻ. Các cài đặt này nằm trong `notes.json` nên GitHub dùng cùng cấu hình.
