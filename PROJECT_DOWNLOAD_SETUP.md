# ZulkyAV Space — Project Download, Gallery, and Long Description

## 1. Apply the database migration

Open the Supabase project used by ZulkyAV Space, then run this file in SQL Editor:

```text
supabase/migrations/20260825_004_add_project_download_and_gallery.sql
```

The migration adds an optional HTTPS download link and a secure project gallery table.

## 2. Verify the website build

```bash
npm run build
```

## 3. Add Zav Recap through the website admin

Open **Admin → Project → Add project**, then use:

- Title: `Zav Recap`
- Slug: `zav-recap`
- Type: `web`
- Stage: `active`
- Visibility: `published`
- Download URL:

```text
https://github.com/ZulkyAV/Zav-Recap/releases/download/v0.1.0/za-sales-beta-v0.1.0.apk
```

Suggested description:

```text
Aplikasi Android sederhana untuk mencatat order, omzet, modal usaha, statistik penjualan, dan recap mingguan otomatis melalui email.
```

The Project description field now supports up to **12,000 characters** and keeps line breaks. You can write several paragraphs instead of a short summary.

Upload one **Project cover**, then optionally add up to **4 gallery photos**. The cover is used on project cards; gallery photos appear on the public project detail page.

Suggested components:

```text
Expo SDK 54 | component
React Native | component
TypeScript | component
Supabase | component
Brevo | component
```

Suggested progress update:

```text
2026-08-25 | public | Beta v0.1.0 | APK beta pertama sudah tersedia untuk Android.
```

Once saved, the public project detail page displays the longer description, photo gallery, and **Download APK** button.
