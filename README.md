# SCAP — Student Competition & Achievement Platform

SCAP adalah monorepo aplikasi pengelolaan kompetisi dan prestasi mahasiswa.
Backend menggunakan Express 4, Sequelize 6, dan MySQL 8; frontend menggunakan
React 18, Vite, Tailwind CSS, React Router 6, Axios, dan TanStack Query.

## Prasyarat

- Node.js 20+
- MySQL 8 (dapat dijalankan melalui Laragon)
- npm
- Docker Compose (opsional; hanya untuk menjalankan frontend/backend)

## Database Setup

1. Pastikan Laragon/MySQL 8 berjalan, lalu buat database `scap_db` melalui
   phpMyAdmin (`http://localhost/phpmyadmin`) dengan collation
   `utf8mb4_unicode_ci`.
2. Salin `backend/.env.example` menjadi `backend/.env`, lalu pastikan
   konfigurasi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, dan `DB_NAME` sesuai.
3. Instal dependencies dan siapkan database dari folder backend:

   ```powershell
   cd backend
   npm install
   npm run db:migrate
   npm run db:seed
   npm run db:verify
   ```

   Kredensial testing: `superadmin@scap.test`, `pka@scap.test`, dan akun
   mahasiswa Faker (`@scap.test`); password semua akun `Password123!`.
   Untuk menghapus dan membangun ulang database beserta data seed secara
   destruktif, jalankan `npm run db:reset` setelah menghentikan proses yang
   sedang memakai database.

## Menjalankan dengan Laragon

1. Jalankan MySQL dari Laragon dan buat database `scap_db` dengan collation
   `utf8mb4_unicode_ci`.
2. Salin `backend/.env.example` menjadi `backend/.env`, lalu sesuaikan
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, dan `DB_NAME`. Isi nilai acak
   yang kuat untuk secret JWT sebelum menggunakan aplikasi di luar development.
3. Instal dependensi dan siapkan database:

   ```powershell
   cd backend
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

   API berjalan di `http://localhost:5000`; health check tersedia di
   `http://localhost:5000/api/health`.
   Untuk reset database beserta data secara penuh, jalankan
   `npm run db:reset` setelah menghentikan proses yang sedang memakai database.
4. Pada terminal lain, jalankan frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Buka `http://localhost:5173`.

Jalankan test backend dan frontend masing-masing dari folder proyeknya dengan
`npm test`.

## Autentikasi dan RBAC

Backend menyediakan `POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, dan
endpoint demo role `GET /api/auth/ping/mahasiswa` serta
`GET /api/auth/ping/admin`. Kirim access token sebagai
`Authorization: Bearer <accessToken>`. Access token berlaku 15 menit; refresh
token berlaku 7 hari dan dicabut ketika logout. Batas permintaan auth adalah
10 request per menit per IP.

Contoh login akun seeder:

```powershell
curl.exe -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"superadmin@scap.test\",\"password\":\"Password123!\"}"
```

Jalankan test backend dari folder `backend` dengan `npm test`. Test auth
menggunakan model in-memory agar dapat dijalankan tanpa koneksi MySQL; untuk
demonstrasi data persisten, jalankan migration dan seeder ke `scap_db` terlebih
dahulu.

Seeder membuat akun demo berikut; seluruh akun memakai password
`Password123!`:

| Peran | Email |
|---|---|
| Super admin | `superadmin@scap.test` |
| Admin PKA | `pka@scap.test` |
| Verifier | `verifier1@scap.test`, `verifier2@scap.test` |
| Pimpinan | `pimpinan@scap.test` |
| Prodi | `prodi@scap.test` |
| Mahasiswa | `mahasiswa01_scap72@scap.test` (dan 19 akun Faker lainnya) |

Akun ini hanya untuk development lokal. Ganti atau hapus sebelum deployment.

## Manajemen Kompetisi

Admin `admin_pka` dan `super_admin` dapat mengelola kategori di
`/api/competition-categories` serta kompetisi di `/api/competitions`.
Dashboard admin memakai `GET /api/competitions/stats` untuk total kompetisi
dan ringkasan status.
Endpoint publik discovery tersedia di `/api/public/competitions` dan hanya
menampilkan kompetisi selain draft. Semua route admin memerlukan
`Authorization: Bearer <accessToken>`. Poster JPG/PNG/WEBP (maks. 2 MB) dan
panduan PDF (maks. 10 MB) disimpan di `backend/uploads/competitions/` dan
diakses melalui `/uploads/competitions/<nama-file>`. Audit perubahan
kompetisi dan kategori dicatat di `audit_logs`; tidak ada migration baru.

Jalankan `npm test` dari `backend` untuk menjalankan test auth dan kompetisi.
Test endpoint menggunakan model in-memory; jalankan migration dan seeder untuk
menyimpan data demonstrasi ke MySQL.

## Menjalankan backend/frontend dengan Docker Compose

Pastikan MySQL Laragon berjalan dan `backend/.env` sudah tersedia. Compose
menjalankan hanya backend dan frontend; backend mengakses host MySQL melalui
`host.docker.internal`. Jalankan dari root:

```powershell
docker compose up --build
```

Jalankan migration dan seeder dari terminal kedua:

```powershell
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

## Struktur utama

```text
backend/
  migrations/                 Sequelize migrations
  src/
    config/                   env, Sequelize connection, CLI config
    scripts/                  verifikasi database
    seeders/                  16 ordered, idempotent development seeders
    controllers/ middlewares/ routes/ services/ validators/ utils/ jobs/
    models/                    seluruh model dan associations
    app.js server.js
  tests/
frontend/
  src/
    api/ components/ contexts/ hooks/ routes/ utils/
    pages/auth/ pages/student/ pages/admin/ pages/public/
```

## Verifikasi database

Jalankan migration dan seeder, lalu cek jumlah data serta query relasi:

```powershell
cd backend
npm run db:migrate
npm run db:seed
npm run db:verify
```

`db:verify` menampilkan jumlah baris setiap tabel dan lima query sanity check.
Tabel `registrations`, `documents`, dan `user_calendar_events` dapat berjumlah
nol karena belum termasuk data pada 16 seeder; jumlah nol ditampilkan sebagai
peringatan, bukan dianggap kegagalan koneksi.

### Pemeriksaan manual melalui phpMyAdmin

1. Pilih database `scap_db` dan buka tab **Structure**. Pastikan tabel memakai
   nama plural snake_case, termasuk `user_calendar_events` dan
   `achievement_verifications`.
2. Buka tabel, lalu tab **Structure** atau **Relation view**. Pastikan kolom
   `*_id` yang merupakan foreign key mengarah ke tabel dan kolom `id` yang
   benar. Periksa aksi `ON DELETE` sesuai skema (termasuk `SET NULL` pada
   uploader/verifier/audit actor dan `CASCADE` pada relasi wajib).
3. Pada **Structure**, cek tipe `ENUM` dan daftar nilainya untuk role,
   competition level/status/mode, team status, submission status, result type,
   achievement level/status, verification action, mentor note type, dan
   calendar event type. Contoh nilai penting: `users.role` (`super_admin`,
   `admin_pka`, `mahasiswa`, `verifier`, `pimpinan`, `prodi`);
   `results.result_type` (`participation`, `finalist`, `winner`);
   `achievements.status` (`draft`, `submitted`, `under_verification`,
   `revision_required`, `verified`, `rejected`); dan
   `user_calendar_events.event_type` (`registration`, `submission`, `result`,
   `custom`).
4. Pada **Structure → Indexes** (atau **Relation view**), pastikan indeks
   kompetisi, dokumen polymorphic, notifikasi, audit log, pasangan unik
   achievement-skill dan user-calendar-event, serta unique key lain terlihat.
5. Buka tab **SQL** untuk menjalankan query verifikasi atau periksa jumlah baris
   tiap tabel dari tab **Browse**.

## ERD database

```mermaid
erDiagram
  USERS {
    int id PK
    varchar name
    varchar email UK
    varchar password
    enum role
    boolean is_active
    datetime created_at
    datetime updated_at
  }
  STUDENTS {
    int id PK
    int user_id FK "UNIQUE"
    varchar nim UK
    varchar program_studi
    year angkatan
    varchar phone
    varchar photo_url
    text bio
    boolean is_public
    varchar slug UK
    datetime created_at
    datetime updated_at
  }
  COMPETITION_CATEGORIES {
    int id PK
    varchar name UK
    text description
    datetime created_at
    datetime updated_at
  }
  COMPETITIONS {
    int id PK
    int category_id FK
    int created_by FK
    varchar name
    varchar slug UK
    varchar organizer
    longtext description
    enum level
    date start_date
    date end_date
    datetime registration_deadline
    datetime submission_deadline
    date result_date
    varchar location
    enum mode
    varchar registration_url
    text prize
    text requirements
    varchar poster_url
    varchar guidebook_url
    varchar contact_person
    decimal price
    enum status
    datetime created_at
    datetime updated_at
  }
  REGISTRATIONS {
    int id PK
    int competition_id FK
    int user_id FK
    int team_id FK
    enum participation_type
    varchar supporting_document_url
    enum status
    text notes
    datetime registered_at
    datetime created_at
    datetime updated_at
  }
  TEAMS {
    int id PK
    int competition_id FK
    int leader_id FK
    int approved_by FK
    varchar name
    varchar team_code UK
    enum status
    datetime approved_at
    text notes
    datetime created_at
    datetime updated_at
  }
  TEAM_MEMBERS {
    int id PK
    int team_id FK
    int user_id FK
    enum role
    datetime joined_at
    enum status
    datetime created_at
    datetime updated_at
  }
  TEAM_INVITATIONS {
    int id PK
    int team_id FK
    int inviter_id FK
    int invitee_id FK
    varchar invitee_email
    varchar token UK
    enum status
    datetime expired_at
    datetime responded_at
    datetime created_at
    datetime updated_at
  }
  MENTOR_ASSIGNMENTS {
    int id PK
    int team_id FK "UNIQUE"
    int mentor_id FK
    int assigned_by FK
    text notes
    datetime assigned_at
    datetime created_at
    datetime updated_at
  }
  MENTOR_NOTES {
    int id PK
    int mentor_assignment_id FK
    text content
    enum type
    datetime created_at
    datetime updated_at
  }
  SUBMISSIONS {
    int id PK
    int team_id FK
    int user_id FK
    int competition_id FK
    varchar title
    text description
    enum status
    int current_version
    datetime created_at
    datetime updated_at
  }
  SUBMISSION_VERSIONS {
    int id PK
    int submission_id FK
    int uploaded_by FK
    int version
    varchar file_url
    varchar repository_url
    varchar demo_url
    varchar video_url
    varchar presentation_url
    varchar supporting_document_url
    text notes
    datetime created_at
    datetime updated_at
  }
  RESULTS {
    int id PK
    int competition_id FK
    int team_id FK
    int user_id FK
    enum result_type
    int position
    varchar title
    date date
    text notes
    datetime created_at
    datetime updated_at
  }
  ACHIEVEMENTS {
    int id PK
    int result_id FK
    int user_id FK
    int competition_id FK
    enum level
    varchar organizer
    date date
    varchar certificate_url
    varchar evidence_url
    int skkm_points
    enum status
    datetime submitted_at
    datetime verified_at
    datetime created_at
    datetime updated_at
  }
  ACHIEVEMENT_VERIFICATIONS {
    int id PK
    int achievement_id FK
    int verifier_id FK
    enum action
    text notes
    datetime created_at
    datetime updated_at
  }
  ACHIEVEMENT_SKILLS {
    int id PK
    int achievement_id FK
    int skill_id FK
    datetime created_at
    datetime updated_at
  }
  SKILLS {
    int id PK
    varchar name UK
    varchar category
    datetime created_at
    datetime updated_at
  }
  CERTIFICATES {
    int id PK
    int achievement_id FK "UNIQUE"
    varchar certificate_number UK
    varchar file_url
    date issued_at
    datetime created_at
    datetime updated_at
  }
  DOCUMENTS {
    int id PK
    varchar documentable_type
    bigint_unsigned documentable_id
    varchar file_name
    varchar file_path
    varchar mime_type
    bigint size
    int version
    int uploaded_by FK
    datetime created_at
    datetime updated_at
  }
  NOTIFICATIONS {
    int id PK
    int user_id FK
    varchar type
    varchar title
    text message
    json data
    datetime read_at
    datetime created_at
    datetime updated_at
  }
  AUDIT_LOGS {
    bigint id PK
    int user_id FK
    varchar action
    varchar model_type
    bigint_unsigned model_id
    json old_values
    json new_values
    varchar ip_address
    varchar user_agent
    datetime created_at
    datetime updated_at
  }
  USER_CALENDAR_EVENTS {
    int id PK
    int user_id FK
    int competition_id FK
    enum event_type
    varchar title
    datetime event_date
    text notes
    datetime created_at
    datetime updated_at
  }

  USERS ||--o| STUDENTS : "1:1 profile"
  COMPETITION_CATEGORIES ||--o{ COMPETITIONS : "1:N category"
  USERS o|--o{ COMPETITIONS : "1:N creator"
  COMPETITIONS ||--o{ REGISTRATIONS : "1:N registrations"
  USERS ||--o{ REGISTRATIONS : "1:N registrant"
  TEAMS o|--o{ REGISTRATIONS : "1:N optional team"
  COMPETITIONS ||--o{ TEAMS : "1:N competition"
  USERS ||--o{ TEAMS : "1:N team leader"
  USERS o|--o{ TEAMS : "1:N approver"
  TEAMS ||--o{ TEAM_MEMBERS : "1:N membership"
  USERS ||--o{ TEAM_MEMBERS : "1:N membership"
  TEAMS }o--o{ USERS : "N:M via team_members"
  TEAMS ||--o{ TEAM_INVITATIONS : "1:N invitations"
  USERS ||--o{ TEAM_INVITATIONS : "1:N inviter"
  USERS o|--o{ TEAM_INVITATIONS : "1:N optional invitee"
  TEAMS ||--o| MENTOR_ASSIGNMENTS : "1:0..1 assignment"
  USERS ||--o{ MENTOR_ASSIGNMENTS : "1:N mentor"
  USERS o|--o{ MENTOR_ASSIGNMENTS : "1:N assigner"
  MENTOR_ASSIGNMENTS ||--o{ MENTOR_NOTES : "1:N notes"
  TEAMS o|--o{ SUBMISSIONS : "1:N optional team"
  USERS o|--o{ SUBMISSIONS : "1:N optional submitter"
  COMPETITIONS ||--o{ SUBMISSIONS : "1:N submissions"
  SUBMISSIONS ||--o{ SUBMISSION_VERSIONS : "1:N versions"
  USERS o|--o{ SUBMISSION_VERSIONS : "1:N optional uploader"
  COMPETITIONS ||--o{ RESULTS : "1:N results"
  TEAMS o|--o{ RESULTS : "1:N optional team"
  USERS o|--o{ RESULTS : "1:N optional participant"
  RESULTS ||--o{ ACHIEVEMENTS : "1:N achievement source"
  USERS ||--o{ ACHIEVEMENTS : "1:N owner"
  COMPETITIONS ||--o{ ACHIEVEMENTS : "1:N competition"
  ACHIEVEMENTS ||--o{ ACHIEVEMENT_VERIFICATIONS : "1:N verification history"
  USERS o|--o{ ACHIEVEMENT_VERIFICATIONS : "1:N optional verifier"
  ACHIEVEMENTS ||--o| CERTIFICATES : "1:0..1 certificate"
  ACHIEVEMENTS ||--o{ ACHIEVEMENT_SKILLS : "1:N skill link"
  SKILLS ||--o{ ACHIEVEMENT_SKILLS : "1:N skill link"
  ACHIEVEMENTS }o--o{ SKILLS : "N:M via achievement_skills"
  USERS o|--o{ DOCUMENTS : "1:N optional uploader"
  USERS ||--o{ NOTIFICATIONS : "1:N notifications"
  USERS o|--o{ AUDIT_LOGS : "1:N optional actor"
  USERS ||--o{ USER_CALENDAR_EVENTS : "1:N calendar events"
  COMPETITIONS ||--o{ USER_CALENDAR_EVENTS : "1:N calendar events"
```

`DOCUMENTS` memakai polymorphic key (`documentable_type`, `documentable_id`),
sehingga target dokumennya tidak memiliki foreign key database. `SUBMISSIONS`
memiliki `team_id` dan `user_id` nullable; validasi model mengharuskan salah
satunya terisi. Field `created_at` dan `updated_at` bertipe `DATETIME` pada
seluruh tabel.

## Ringkasan tabel dan data seeder

| Tabel | Deskripsi | Relasi Utama | Jumlah Seeder |
|---|---|---|---:|
| `users` | Akun dan peran pengguna | Profil mahasiswa, tim, prestasi, aktivitas | 26 |
| `students` | Profil mahasiswa | 1:1 `users` | 20 |
| `competition_categories` | Kategori kompetisi | 1:N `competitions` | 7 |
| `competitions` | Informasi dan jadwal kompetisi | Kategori, tim, registrasi, hasil | 12 |
| `skills` | Katalog keterampilan | N:M prestasi | 15 |
| `teams` | Tim peserta | Kompetisi, pemimpin, anggota | 6 |
| `team_members` | Penghubung tim dan anggota | N:M `teams`–`users` | 19 |
| `registrations` | Registrasi mahasiswa/tim | Kompetisi, pengguna, tim | 0 |
| `team_invitations` | Undangan bergabung ke tim | Tim, inviter, invitee | 5 |
| `mentor_assignments` | Mentor yang ditugaskan ke tim | Tim, mentor, assigner | 2 |
| `mentor_notes` | Catatan pendampingan | 1:N `mentor_assignments` | 6 |
| `submissions` | Karya untuk kompetisi | Tim/pengguna dan kompetisi | 3 |
| `submission_versions` | Riwayat versi submission | Submission dan uploader | 3 |
| `results` | Hasil kompetisi | Kompetisi, tim atau pengguna | 4 |
| `achievements` | Prestasi mahasiswa dan SKKM | Hasil, pemilik, kompetisi | 5 |
| `achievement_verifications` | Riwayat verifikasi prestasi | Prestasi dan verifier | 4 |
| `achievement_skills` | Penghubung prestasi dan skill | N:M `achievements`–`skills` | 6 |
| `certificates` | Sertifikat prestasi | 1:0..1 `achievements` | 2 |
| `documents` | Metadata file dengan target polymorphic | Uploader; target via type/id | 0 |
| `notifications` | Notifikasi pengguna | N:1 `users` | 20 |
| `audit_logs` | Log aktivitas sistem | N:1 pengguna opsional | 30 |
| `user_calendar_events` | Agenda kompetisi per pengguna | Pengguna dan kompetisi | 0 |

## Catatan awal

- API awal menyediakan health check; modul bisnis dan autentikasi belum
  diimplementasikan.
- `frontend/src/api/axios.js` menggunakan base URL API localhost dan mengambil
  access token dari `localStorage` untuk header Bearer.
- Migration membuat skema 22 tabel. Periksa kebijakan retensi data sebelum
  memakai penghapusan cascade di produksi.
