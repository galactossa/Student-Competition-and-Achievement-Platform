# Database Reference

Dokumentasi ini merefleksikan skema MySQL aktif pada `scap_db` setelah seluruh migration diterapkan. Migration di `migrations/` adalah sumber perubahan skema.

## Persiapan dan koneksi

- Prasyarat: Node.js 20+, MySQL 8 melalui Laragon, dan database `scap_db` dengan collation `utf8mb4_unicode_ci`.
- Buat database melalui phpMyAdmin: [http://localhost/phpmyadmin](http://localhost/phpmyadmin). Konfigurasi koneksi ada di `src/config/database.js`; rahasia lokal disimpan di `.env`.
- Jalankan command backend dari folder `backend/`.

## Reset database dari nol

> **Destruktif:** perintah reset membatalkan seluruh migration dan menghapus data aplikasi dari database yang dikonfigurasi. Hentikan aplikasi yang sedang terhubung dan pastikan `DB_NAME` menunjuk ke database yang memang ingin di-reset.

```powershell
cd backend
npm run db:reset
```

`db:reset` menjalankan undo seluruh migration, menerapkan ulang migration, mengisi seeder, dan memverifikasi database. Untuk database baru yang baru dibuat manual di phpMyAdmin, jalankan `npm install`, `npm run db:migrate`, `npm run db:seed`, lalu `npm run db:verify`.

## ERD

```mermaid
erDiagram
  ACHIEVEMENT_SKILLS {
    int id PK
    int achievement_id FK
    int skill_id FK
    datetime created_at
    datetime updated_at
  }
  ACHIEVEMENT_VERIFICATIONS {
    int id PK
    int achievement_id FK
    int verifier_id FK
    text notes
    datetime created_at
    datetime updated_at
    enum action
  }
  ACHIEVEMENTS {
    int id PK
    int user_id FK
    int competition_id FK
    enum level
    varchar(150) organizer
    date date
    int skkm_points
    enum status
    datetime submitted_at
    datetime created_at
    datetime updated_at
    int result_id FK
    varchar(255) certificate_url
    varchar(255) evidence_url
    datetime verified_at
  }
  AUDIT_LOGS {
    bigint id PK
    int user_id FK
    varchar(80) action
    varchar(100) model_type
    json new_values
    varchar(45) ip_address
    datetime created_at
    datetime updated_at
    bigint_unsigned model_id
    json old_values
    varchar(255) user_agent
  }
  CERTIFICATES {
    int id PK
    int achievement_id FK, UK
    varchar(80) certificate_number UK
    varchar(255) file_url
    date issued_at
    datetime created_at
    datetime updated_at
  }
  COMPETITION_CATEGORIES {
    int id PK
    varchar(80) name UK
    text description
    datetime created_at
    datetime updated_at
  }
  COMPETITIONS {
    int id PK
    int category_id FK
    varchar(200) name
    varchar(220) slug UK
    longtext description
    enum level
    varchar(150) organizer
    varchar(200) location
    datetime registration_deadline
    date start_date
    date end_date
    enum status
    datetime created_at
    datetime updated_at
    datetime submission_deadline
    date result_date
    enum mode
    varchar(255) registration_url
    text prize
    text requirements
    varchar(255) poster_url
    varchar(255) guidebook_url
    varchar(100) contact_person
    decimal(10,2) price
    int created_by FK
  }
  DOCUMENTS {
    int id PK
    int uploaded_by FK
    varchar(200) file_name
    varchar(255) file_path
    varchar(100) mime_type
    bigint size
    datetime created_at
    datetime updated_at
    varchar(100) documentable_type
    bigint_unsigned documentable_id
    int version
  }
  MENTOR_ASSIGNMENTS {
    int id PK
    int team_id FK, UK
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
  NOTIFICATIONS {
    int id PK
    int user_id FK
    varchar(150) title
    text message
    datetime read_at
    datetime created_at
    datetime updated_at
    varchar(80) type
    json data
  }
  REGISTRATIONS {
    int id PK
    int user_id FK
    int competition_id FK
    int team_id FK
    enum status
    datetime registered_at
    datetime created_at
    datetime updated_at
    enum participation_type
    varchar(255) supporting_document_url
    text notes
  }
  RESULTS {
    int id PK
    int competition_id FK
    int team_id FK
    int position
    varchar(150) title
    text notes
    datetime created_at
    datetime updated_at
    int user_id FK
    enum result_type
    date date
  }
  SKILLS {
    int id PK
    varchar(80) name UK
    varchar(120) slug UK
    text description
    datetime created_at
    datetime updated_at
    varchar(50) category
  }
  STUDENTS {
    int id PK
    int user_id FK, UK
    varchar(20) nim UK
    varchar(120) faculty
    varchar(100) program_studi
    year angkatan
    tinyint semester
    datetime created_at
    datetime updated_at
    varchar(20) phone
    varchar(255) photo_url
    text bio
    tinyint(1) is_public
    varchar(100) slug UK
  }
  SUBMISSION_VERSIONS {
    int id PK
    int submission_id FK
    int uploaded_by FK
    int version
    varchar(255) file_url
    datetime created_at
    datetime updated_at
    varchar(255) repository_url
    varchar(255) demo_url
    varchar(255) video_url
    varchar(255) presentation_url
    varchar(255) supporting_document_url
    text notes
  }
  SUBMISSIONS {
    int id PK
    int team_id FK
    varchar(200) title
    text description
    enum status
    datetime submitted_at
    datetime final_submitted_at
    datetime created_at
    datetime updated_at
    int user_id FK
    int competition_id FK
    int current_version
  }
  TEAM_INVITATIONS {
    int id PK
    int team_id FK
    int inviter_id FK
    int invitee_id FK
    varchar(150) invitee_email
    varchar(100) token UK
    enum status
    datetime expired_at
    datetime created_at
    datetime updated_at
    datetime responded_at
  }
  TEAM_MEMBERS {
    int id PK
    int team_id FK
    int user_id FK
    enum role
    enum status
    datetime joined_at
    datetime created_at
    datetime updated_at
  }
  TEAMS {
    int id PK
    int competition_id FK
    int leader_id FK
    varchar(150) name
    text notes
    enum status
    int approved_by FK
    datetime approved_at
    datetime created_at
    datetime updated_at
    varchar(50) team_code UK
  }
  USER_CALENDAR_EVENTS {
    int id PK
    int user_id FK
    int competition_id FK
    enum event_type
    varchar(150) title
    datetime event_date
    text notes
    datetime created_at
    datetime updated_at
  }
  USERS {
    int id PK
    varchar(100) name
    varchar(150) email UK
    varchar(255) password
    enum role
    tinyint(1) is_active
    varchar(30) phone
    datetime last_login_at
    datetime created_at
    datetime updated_at
  }
  ACHIEVEMENTS ||--o{ ACHIEVEMENT_SKILLS : "achievement_skills_ibfk_1"
  SKILLS ||--o{ ACHIEVEMENT_SKILLS : "achievement_skills_ibfk_2"
  ACHIEVEMENTS ||--o{ ACHIEVEMENT_VERIFICATIONS : "achievement_verifications_achievement_id_fkey"
  USERS o|--o{ ACHIEVEMENT_VERIFICATIONS : "achievement_verifications_verifier_id_fkey"
  COMPETITIONS ||--o{ ACHIEVEMENTS : "achievements_competition_id_fkey"
  RESULTS ||--o{ ACHIEVEMENTS : "achievements_result_id_fkey"
  USERS ||--o{ ACHIEVEMENTS : "achievements_user_id_fkey"
  USERS o|--o{ AUDIT_LOGS : "audit_logs_user_id_fkey"
  ACHIEVEMENTS ||--o| CERTIFICATES : "certificates_achievement_id_fkey"
  COMPETITION_CATEGORIES ||--o{ COMPETITIONS : "competitions_category_id_fkey"
  USERS o|--o{ COMPETITIONS : "competitions_created_by_foreign_idx"
  USERS o|--o{ DOCUMENTS : "documents_uploaded_by_fkey"
  USERS o|--o{ MENTOR_ASSIGNMENTS : "mentor_assignments_assigned_by_fkey"
  TEAMS ||--o| MENTOR_ASSIGNMENTS : "mentor_assignments_ibfk_1"
  USERS ||--o{ MENTOR_ASSIGNMENTS : "mentor_assignments_ibfk_2"
  MENTOR_ASSIGNMENTS ||--o{ MENTOR_NOTES : "mentor_notes_ibfk_1"
  USERS ||--o{ NOTIFICATIONS : "notifications_ibfk_1"
  USERS ||--o{ REGISTRATIONS : "registrations_ibfk_1"
  COMPETITIONS ||--o{ REGISTRATIONS : "registrations_ibfk_2"
  TEAMS o|--o{ REGISTRATIONS : "registrations_team_id_fkey"
  COMPETITIONS ||--o{ RESULTS : "results_competition_id_fkey"
  TEAMS o|--o{ RESULTS : "results_team_id_fkey"
  USERS o|--o{ RESULTS : "results_user_id_fkey"
  USERS ||--o| STUDENTS : "students_ibfk_1"
  SUBMISSIONS ||--o{ SUBMISSION_VERSIONS : "submission_versions_ibfk_1"
  USERS o|--o{ SUBMISSION_VERSIONS : "submission_versions_uploaded_by_fkey"
  COMPETITIONS ||--o{ SUBMISSIONS : "submissions_competition_id_fkey"
  TEAMS o|--o{ SUBMISSIONS : "submissions_team_id_fkey"
  USERS o|--o{ SUBMISSIONS : "submissions_user_id_fkey"
  TEAMS ||--o{ TEAM_INVITATIONS : "team_invitations_ibfk_1"
  USERS ||--o{ TEAM_INVITATIONS : "team_invitations_ibfk_2"
  USERS o|--o{ TEAM_INVITATIONS : "team_invitations_ibfk_3"
  TEAMS ||--o{ TEAM_MEMBERS : "team_members_ibfk_1"
  USERS ||--o{ TEAM_MEMBERS : "team_members_ibfk_2"
  USERS o|--o{ TEAMS : "teams_approved_by_fkey"
  COMPETITIONS ||--o{ TEAMS : "teams_ibfk_1"
  USERS ||--o{ TEAMS : "teams_ibfk_2"
  USERS ||--o{ USER_CALENDAR_EVENTS : "user_calendar_events_ibfk_1"
  COMPETITIONS ||--o{ USER_CALENDAR_EVENTS : "user_calendar_events_ibfk_2"
  TEAMS }o--o{ USERS : "N:M via team_members"
  ACHIEVEMENTS }o--o{ SKILLS : "N:M via achievement_skills"
```

## Tabel, kolom, dan constraints

### `achievement_skills`

Tabel penghubung prestasi dan keterampilan.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `achievement_id` | `int` | NO | - | FK |
| `skill_id` | `int` | NO | - | FK |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `achievement_verifications`

Riwayat tindakan verifikasi prestasi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `achievement_id` | `int` | NO | - | FK |
| `verifier_id` | `int` | YES | - | FK |
| `notes` | `text` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `action` | `enum('approve','revision','reject')` | NO | - | - |

### `achievements`

Prestasi mahasiswa dan poin SKKM.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | NO | - | FK |
| `competition_id` | `int` | NO | - | FK |
| `level` | `enum('Lokal','Regional','Nasional','Internasional')` | NO | - | - |
| `organizer` | `varchar(150)` | NO | - | - |
| `date` | `date` | NO | - | - |
| `skkm_points` | `int` | NO | `0` | - |
| `status` | `enum('draft','submitted','under_verification','revision_required','verified','rejected')` | NO | `draft` | - |
| `submitted_at` | `datetime` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `result_id` | `int` | NO | - | FK |
| `certificate_url` | `varchar(255)` | YES | - | - |
| `evidence_url` | `varchar(255)` | YES | - | - |
| `verified_at` | `datetime` | YES | - | - |

### `audit_logs`

Riwayat tindakan sistem dan nilai perubahan.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `bigint` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | YES | - | FK |
| `action` | `varchar(80)` | NO | - | - |
| `model_type` | `varchar(100)` | YES | - | - |
| `new_values` | `json` | YES | - | - |
| `ip_address` | `varchar(45)` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `model_id` | `bigint unsigned` | YES | - | - |
| `old_values` | `json` | YES | - | - |
| `user_agent` | `varchar(255)` | YES | - | - |

### `certificates`

Sertifikat yang diterbitkan untuk prestasi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `achievement_id` | `int` | NO | - | FK, UNIQUE |
| `certificate_number` | `varchar(80)` | YES | - | UNIQUE |
| `file_url` | `varchar(255)` | NO | - | - |
| `issued_at` | `date` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `competition_categories`

Kategori kompetisi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `name` | `varchar(80)` | NO | - | UNIQUE |
| `description` | `text` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `competitions`

Informasi, jadwal, biaya, dan status kompetisi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `category_id` | `int` | NO | - | FK |
| `name` | `varchar(200)` | NO | - | - |
| `slug` | `varchar(220)` | NO | - | UNIQUE |
| `description` | `longtext` | YES | - | - |
| `level` | `enum('Internal Kampus','Regional','Nasional','Internasional')` | NO | - | - |
| `organizer` | `varchar(150)` | NO | - | - |
| `location` | `varchar(200)` | YES | - | - |
| `registration_deadline` | `datetime` | YES | - | - |
| `start_date` | `date` | YES | - | - |
| `end_date` | `date` | YES | - | - |
| `status` | `enum('draft','published','registration_open','registration_closed','submission','competition','result_announced','completed')` | NO | `draft` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `submission_deadline` | `datetime` | YES | - | - |
| `result_date` | `date` | YES | - | - |
| `mode` | `enum('online','offline','hybrid')` | NO | `online` | - |
| `registration_url` | `varchar(255)` | YES | - | - |
| `prize` | `text` | YES | - | - |
| `requirements` | `text` | YES | - | - |
| `poster_url` | `varchar(255)` | YES | - | - |
| `guidebook_url` | `varchar(255)` | YES | - | - |
| `contact_person` | `varchar(100)` | YES | - | - |
| `price` | `decimal(10,2)` | NO | `0.00` | - |
| `created_by` | `int` | YES | - | FK |

### `documents`

Metadata file dengan target polymorphic.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `uploaded_by` | `int` | YES | - | FK |
| `file_name` | `varchar(200)` | NO | - | - |
| `file_path` | `varchar(255)` | NO | - | - |
| `mime_type` | `varchar(100)` | NO | - | - |
| `size` | `bigint` | NO | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `documentable_type` | `varchar(100)` | NO | - | - |
| `documentable_id` | `bigint unsigned` | NO | - | - |
| `version` | `int` | NO | `1` | - |

### `mentor_assignments`

Penugasan mentor pada tim.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `team_id` | `int` | NO | - | FK, UNIQUE |
| `mentor_id` | `int` | NO | - | FK |
| `assigned_by` | `int` | YES | - | FK |
| `notes` | `text` | YES | - | - |
| `assigned_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `mentor_notes`

Catatan mentor untuk penugasan.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `mentor_assignment_id` | `int` | NO | - | FK |
| `content` | `text` | NO | - | - |
| `type` | `enum('comment','progress','evaluation')` | NO | `comment` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `notifications`

Notifikasi untuk pengguna.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | NO | - | FK |
| `title` | `varchar(150)` | NO | - | - |
| `message` | `text` | NO | - | - |
| `read_at` | `datetime` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `type` | `varchar(80)` | NO | - | - |
| `data` | `json` | YES | - | - |

### `registrations`

Pendaftaran pengguna pada kompetisi, individual atau tim.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | NO | - | FK |
| `competition_id` | `int` | NO | - | FK |
| `team_id` | `int` | YES | - | FK |
| `status` | `enum('draft','registered','confirmed','participating','completed')` | NO | `registered` | - |
| `registered_at` | `datetime` | YES | `CURRENT_TIMESTAMP` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `participation_type` | `enum('individual','team')` | NO | - | - |
| `supporting_document_url` | `varchar(255)` | YES | - | - |
| `notes` | `text` | YES | - | - |

### `results`

Hasil atau peringkat peserta pada kompetisi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `competition_id` | `int` | NO | - | FK |
| `team_id` | `int` | YES | - | FK |
| `position` | `int` | YES | - | - |
| `title` | `varchar(150)` | YES | - | - |
| `notes` | `text` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `user_id` | `int` | YES | - | FK |
| `result_type` | `enum('participation','finalist','winner')` | NO | - | - |
| `date` | `date` | NO | - | - |

### `skills`

Katalog keterampilan untuk penandaan prestasi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `name` | `varchar(80)` | NO | - | UNIQUE |
| `slug` | `varchar(120)` | YES | - | UNIQUE |
| `description` | `text` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `category` | `varchar(50)` | YES | - | - |

### `students`

Profil mahasiswa yang terhubung satu-ke-satu dengan akun.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | NO | - | FK, UNIQUE |
| `nim` | `varchar(20)` | NO | - | UNIQUE |
| `faculty` | `varchar(120)` | YES | - | - |
| `program_studi` | `varchar(100)` | NO | - | - |
| `angkatan` | `year` | NO | - | - |
| `semester` | `tinyint` | NO | `1` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `phone` | `varchar(20)` | YES | - | - |
| `photo_url` | `varchar(255)` | YES | - | - |
| `bio` | `text` | YES | - | - |
| `is_public` | `tinyint(1)` | NO | `0` | - |
| `slug` | `varchar(100)` | YES | - | UNIQUE |

### `submission_versions`

Riwayat file dan metadata versi submission.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `submission_id` | `int` | NO | - | FK |
| `uploaded_by` | `int` | YES | - | FK |
| `version` | `int` | NO | - | - |
| `file_url` | `varchar(255)` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `repository_url` | `varchar(255)` | YES | - | - |
| `demo_url` | `varchar(255)` | YES | - | - |
| `video_url` | `varchar(255)` | YES | - | - |
| `presentation_url` | `varchar(255)` | YES | - | - |
| `supporting_document_url` | `varchar(255)` | YES | - | - |
| `notes` | `text` | YES | - | - |

### `submissions`

Submission karya dari tim atau mahasiswa individual.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `team_id` | `int` | YES | - | FK |
| `title` | `varchar(200)` | NO | - | - |
| `description` | `text` | YES | - | - |
| `status` | `enum('draft','submitted','under_review','revision','final_submission','completed')` | NO | `draft` | - |
| `submitted_at` | `datetime` | YES | - | - |
| `final_submitted_at` | `datetime` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `user_id` | `int` | YES | - | FK |
| `competition_id` | `int` | NO | - | FK |
| `current_version` | `int` | NO | `1` | - |

### `team_invitations`

Undangan pengguna untuk bergabung ke tim.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `team_id` | `int` | NO | - | FK |
| `inviter_id` | `int` | NO | - | FK |
| `invitee_id` | `int` | YES | - | FK |
| `invitee_email` | `varchar(150)` | YES | - | - |
| `token` | `varchar(100)` | NO | - | UNIQUE |
| `status` | `enum('pending','accepted','rejected','expired')` | NO | `pending` | - |
| `expired_at` | `datetime` | NO | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `responded_at` | `datetime` | YES | - | - |

### `team_members`

Tabel penghubung tim dan pengguna, termasuk peran keanggotaan.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `team_id` | `int` | NO | - | FK |
| `user_id` | `int` | NO | - | FK |
| `role` | `enum('leader','member')` | NO | `member` | - |
| `status` | `enum('active','left','removed')` | NO | `active` | - |
| `joined_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `teams`

Tim peserta pada suatu kompetisi.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `competition_id` | `int` | NO | - | FK |
| `leader_id` | `int` | NO | - | FK |
| `name` | `varchar(150)` | NO | - | - |
| `notes` | `text` | YES | - | - |
| `status` | `enum('draft','pending_approval','approved','rejected')` | NO | `draft` | - |
| `approved_by` | `int` | YES | - | FK |
| `approved_at` | `datetime` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `team_code` | `varchar(50)` | NO | - | UNIQUE |

### `user_calendar_events`

Agenda kompetisi pada kalender pengguna.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `user_id` | `int` | NO | - | FK |
| `competition_id` | `int` | NO | - | FK |
| `event_type` | `enum('registration','submission','result','custom')` | NO | - | - |
| `title` | `varchar(150)` | NO | - | - |
| `event_date` | `datetime` | NO | - | - |
| `notes` | `text` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

### `users`

Akun, kredensial, dan peran pengguna.

| Kolom | Tipe MySQL | Null | Default | Constraint |
|---|---|---|---|---|
| `id` | `int` | NO | - | PK, AUTO_INCREMENT |
| `name` | `varchar(100)` | NO | - | - |
| `email` | `varchar(150)` | NO | - | UNIQUE |
| `password` | `varchar(255)` | NO | - | - |
| `role` | `enum('super_admin','admin_pka','mahasiswa','verifier','pimpinan','prodi')` | NO | `mahasiswa` | - |
| `is_active` | `tinyint(1)` | NO | `1` | - |
| `phone` | `varchar(30)` | YES | - | - |
| `last_login_at` | `datetime` | YES | - | - |
| `created_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |
| `updated_at` | `datetime` | NO | `CURRENT_TIMESTAMP` | - |

## ENUM values

| Tabel | Kolom | Nilai |
|---|---|---|
| `achievement_verifications` | `action` | `approve`, `revision`, `reject` |
| `achievements` | `level` | `Lokal`, `Regional`, `Nasional`, `Internasional` |
| `achievements` | `status` | `draft`, `submitted`, `under_verification`, `revision_required`, `verified`, `rejected` |
| `competitions` | `level` | `Internal Kampus`, `Regional`, `Nasional`, `Internasional` |
| `competitions` | `status` | `draft`, `published`, `registration_open`, `registration_closed`, `submission`, `competition`, `result_announced`, `completed` |
| `competitions` | `mode` | `online`, `offline`, `hybrid` |
| `mentor_notes` | `type` | `comment`, `progress`, `evaluation` |
| `registrations` | `status` | `draft`, `registered`, `confirmed`, `participating`, `completed` |
| `registrations` | `participation_type` | `individual`, `team` |
| `results` | `result_type` | `participation`, `finalist`, `winner` |
| `submissions` | `status` | `draft`, `submitted`, `under_review`, `revision`, `final_submission`, `completed` |
| `team_invitations` | `status` | `pending`, `accepted`, `rejected`, `expired` |
| `team_members` | `role` | `leader`, `member` |
| `team_members` | `status` | `active`, `left`, `removed` |
| `teams` | `status` | `draft`, `pending_approval`, `approved`, `rejected` |
| `user_calendar_events` | `event_type` | `registration`, `submission`, `result`, `custom` |
| `users` | `role` | `super_admin`, `admin_pka`, `mahasiswa`, `verifier`, `pimpinan`, `prodi` |

## Indexes

| Tabel | Nama | Kolom | Jenis |
|---|---|---|---|
| `achievement_skills` | `achievement_skills_achievement_skill_unique` | `achievement_id`, `skill_id` | UNIQUE |
| `achievement_skills` | `PRIMARY` | `id` | PRIMARY KEY |
| `achievement_skills` | `skill_id` | `skill_id` | INDEX |
| `achievement_verifications` | `achievement_verifications_achievement_id_fkey` | `achievement_id` | INDEX |
| `achievement_verifications` | `achievement_verifications_verifier_id_fkey` | `verifier_id` | INDEX |
| `achievement_verifications` | `PRIMARY` | `id` | PRIMARY KEY |
| `achievements` | `achievements_competition_id_fkey` | `competition_id` | INDEX |
| `achievements` | `achievements_result_id_fkey` | `result_id` | INDEX |
| `achievements` | `achievements_user_id_fkey` | `user_id` | INDEX |
| `achievements` | `PRIMARY` | `id` | PRIMARY KEY |
| `audit_logs` | `audit_logs_created_at_idx` | `created_at` | INDEX |
| `audit_logs` | `audit_logs_model_idx` | `model_type`, `model_id` | INDEX |
| `audit_logs` | `audit_logs_user_id_fkey` | `user_id` | INDEX |
| `audit_logs` | `PRIMARY` | `id` | PRIMARY KEY |
| `certificates` | `achievement_id` | `achievement_id` | UNIQUE |
| `certificates` | `certificate_number` | `certificate_number` | UNIQUE |
| `certificates` | `PRIMARY` | `id` | PRIMARY KEY |
| `competition_categories` | `name` | `name` | UNIQUE |
| `competition_categories` | `PRIMARY` | `id` | PRIMARY KEY |
| `competitions` | `competitions_category_id_fkey` | `category_id` | INDEX |
| `competitions` | `competitions_created_by_foreign_idx` | `created_by` | INDEX |
| `competitions` | `competitions_level_idx` | `level` | INDEX |
| `competitions` | `competitions_registration_deadline_idx` | `registration_deadline` | INDEX |
| `competitions` | `competitions_status_idx` | `status` | INDEX |
| `competitions` | `PRIMARY` | `id` | PRIMARY KEY |
| `competitions` | `slug` | `slug` | UNIQUE |
| `documents` | `documents_documentable_idx` | `documentable_type`, `documentable_id` | INDEX |
| `documents` | `documents_uploaded_by_fkey` | `uploaded_by` | INDEX |
| `documents` | `PRIMARY` | `id` | PRIMARY KEY |
| `mentor_assignments` | `mentor_assignments_assigned_by_fkey` | `assigned_by` | INDEX |
| `mentor_assignments` | `mentor_assignments_team_unique` | `team_id` | UNIQUE |
| `mentor_assignments` | `mentor_id` | `mentor_id` | INDEX |
| `mentor_assignments` | `PRIMARY` | `id` | PRIMARY KEY |
| `mentor_notes` | `mentor_assignment_id` | `mentor_assignment_id` | INDEX |
| `mentor_notes` | `PRIMARY` | `id` | PRIMARY KEY |
| `notifications` | `notifications_user_read_at_idx` | `user_id`, `read_at` | INDEX |
| `notifications` | `PRIMARY` | `id` | PRIMARY KEY |
| `registrations` | `PRIMARY` | `id` | PRIMARY KEY |
| `registrations` | `registrations_competition_user_unique` | `competition_id`, `user_id` | UNIQUE |
| `registrations` | `registrations_team_id_fkey` | `team_id` | INDEX |
| `registrations` | `user_id` | `user_id` | INDEX |
| `results` | `PRIMARY` | `id` | PRIMARY KEY |
| `results` | `results_competition_id_fkey` | `competition_id` | INDEX |
| `results` | `results_team_id_fkey` | `team_id` | INDEX |
| `results` | `results_user_id_fkey` | `user_id` | INDEX |
| `skills` | `name` | `name` | UNIQUE |
| `skills` | `name_2` | `name` | UNIQUE |
| `skills` | `PRIMARY` | `id` | PRIMARY KEY |
| `skills` | `slug` | `slug` | UNIQUE |
| `skills` | `slug_2` | `slug` | UNIQUE |
| `students` | `nim` | `nim` | UNIQUE |
| `students` | `PRIMARY` | `id` | PRIMARY KEY |
| `students` | `slug` | `slug` | UNIQUE |
| `students` | `student_number` | `nim` | UNIQUE |
| `students` | `user_id` | `user_id` | UNIQUE |
| `submission_versions` | `PRIMARY` | `id` | PRIMARY KEY |
| `submission_versions` | `submission_versions_submission_version_unique` | `submission_id`, `version` | UNIQUE |
| `submission_versions` | `submission_versions_uploaded_by_fkey` | `uploaded_by` | INDEX |
| `submissions` | `PRIMARY` | `id` | PRIMARY KEY |
| `submissions` | `submissions_competition_id_fkey` | `competition_id` | INDEX |
| `submissions` | `submissions_team_id_fkey` | `team_id` | INDEX |
| `submissions` | `submissions_user_id_fkey` | `user_id` | INDEX |
| `team_invitations` | `invited_by` | `inviter_id` | INDEX |
| `team_invitations` | `PRIMARY` | `id` | PRIMARY KEY |
| `team_invitations` | `team_invitations_team_invitee_unique` | `team_id`, `invitee_id` | UNIQUE |
| `team_invitations` | `token` | `token` | UNIQUE |
| `team_invitations` | `user_id` | `invitee_id` | INDEX |
| `team_members` | `PRIMARY` | `id` | PRIMARY KEY |
| `team_members` | `team_members_team_user_unique` | `team_id`, `user_id` | UNIQUE |
| `team_members` | `user_id` | `user_id` | INDEX |
| `teams` | `competition_id` | `competition_id` | INDEX |
| `teams` | `created_by` | `leader_id` | INDEX |
| `teams` | `PRIMARY` | `id` | PRIMARY KEY |
| `teams` | `team_code` | `team_code` | UNIQUE |
| `teams` | `teams_approved_by_fkey` | `approved_by` | INDEX |
| `user_calendar_events` | `competition_id` | `competition_id` | INDEX |
| `user_calendar_events` | `PRIMARY` | `id` | PRIMARY KEY |
| `user_calendar_events` | `user_calendar_events_user_competition_type_unique` | `user_id`, `competition_id`, `event_type` | UNIQUE |
| `users` | `email` | `email` | UNIQUE |
| `users` | `email_2` | `email` | UNIQUE |
| `users` | `PRIMARY` | `id` | PRIMARY KEY |

## Foreign keys

| Tabel | Constraint | Kolom | Referensi | ON DELETE | ON UPDATE |
|---|---|---|---|---|---|
| `achievement_skills` | `achievement_skills_ibfk_1` | `achievement_id` | `achievements.id` | CASCADE | CASCADE |
| `achievement_skills` | `achievement_skills_ibfk_2` | `skill_id` | `skills.id` | CASCADE | CASCADE |
| `achievement_verifications` | `achievement_verifications_achievement_id_fkey` | `achievement_id` | `achievements.id` | CASCADE | CASCADE |
| `achievement_verifications` | `achievement_verifications_verifier_id_fkey` | `verifier_id` | `users.id` | SET NULL | CASCADE |
| `achievements` | `achievements_competition_id_fkey` | `competition_id` | `competitions.id` | CASCADE | CASCADE |
| `achievements` | `achievements_result_id_fkey` | `result_id` | `results.id` | CASCADE | CASCADE |
| `achievements` | `achievements_user_id_fkey` | `user_id` | `users.id` | CASCADE | CASCADE |
| `audit_logs` | `audit_logs_user_id_fkey` | `user_id` | `users.id` | SET NULL | CASCADE |
| `certificates` | `certificates_achievement_id_fkey` | `achievement_id` | `achievements.id` | CASCADE | CASCADE |
| `competitions` | `competitions_category_id_fkey` | `category_id` | `competition_categories.id` | RESTRICT | CASCADE |
| `competitions` | `competitions_created_by_foreign_idx` | `created_by` | `users.id` | SET NULL | CASCADE |
| `documents` | `documents_uploaded_by_fkey` | `uploaded_by` | `users.id` | SET NULL | CASCADE |
| `mentor_assignments` | `mentor_assignments_assigned_by_fkey` | `assigned_by` | `users.id` | SET NULL | CASCADE |
| `mentor_assignments` | `mentor_assignments_ibfk_1` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `mentor_assignments` | `mentor_assignments_ibfk_2` | `mentor_id` | `users.id` | CASCADE | CASCADE |
| `mentor_notes` | `mentor_notes_ibfk_1` | `mentor_assignment_id` | `mentor_assignments.id` | CASCADE | CASCADE |
| `notifications` | `notifications_ibfk_1` | `user_id` | `users.id` | CASCADE | CASCADE |
| `registrations` | `registrations_ibfk_1` | `user_id` | `users.id` | CASCADE | CASCADE |
| `registrations` | `registrations_ibfk_2` | `competition_id` | `competitions.id` | CASCADE | CASCADE |
| `registrations` | `registrations_team_id_fkey` | `team_id` | `teams.id` | SET NULL | CASCADE |
| `results` | `results_competition_id_fkey` | `competition_id` | `competitions.id` | CASCADE | CASCADE |
| `results` | `results_team_id_fkey` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `results` | `results_user_id_fkey` | `user_id` | `users.id` | CASCADE | CASCADE |
| `students` | `students_ibfk_1` | `user_id` | `users.id` | CASCADE | CASCADE |
| `submission_versions` | `submission_versions_ibfk_1` | `submission_id` | `submissions.id` | CASCADE | CASCADE |
| `submission_versions` | `submission_versions_uploaded_by_fkey` | `uploaded_by` | `users.id` | SET NULL | CASCADE |
| `submissions` | `submissions_competition_id_fkey` | `competition_id` | `competitions.id` | CASCADE | CASCADE |
| `submissions` | `submissions_team_id_fkey` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `submissions` | `submissions_user_id_fkey` | `user_id` | `users.id` | CASCADE | CASCADE |
| `team_invitations` | `team_invitations_ibfk_1` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `team_invitations` | `team_invitations_ibfk_2` | `inviter_id` | `users.id` | CASCADE | CASCADE |
| `team_invitations` | `team_invitations_ibfk_3` | `invitee_id` | `users.id` | CASCADE | CASCADE |
| `team_members` | `team_members_ibfk_1` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `team_members` | `team_members_ibfk_2` | `user_id` | `users.id` | CASCADE | CASCADE |
| `teams` | `teams_approved_by_fkey` | `approved_by` | `users.id` | SET NULL | CASCADE |
| `teams` | `teams_ibfk_1` | `competition_id` | `competitions.id` | CASCADE | CASCADE |
| `teams` | `teams_ibfk_2` | `leader_id` | `users.id` | CASCADE | CASCADE |
| `user_calendar_events` | `user_calendar_events_ibfk_1` | `user_id` | `users.id` | CASCADE | CASCADE |
| `user_calendar_events` | `user_calendar_events_ibfk_2` | `competition_id` | `competitions.id` | CASCADE | CASCADE |

`documents.documentable_type` dan `documents.documentable_id` adalah polymorphic key, bukan foreign key database. Submission harus memiliki `team_id` atau `user_id`; validasi partisipan dilakukan di aplikasi.

## phpMyAdmin

1. Buka [http://localhost/phpmyadmin](http://localhost/phpmyadmin), pilih `scap_db`, dan buka **Structure** untuk mengecek nama tabel plural snake_case.
2. Periksa foreign key di **Structure - Relation view** atau detail tabel; cocokkan target serta `ON DELETE` dengan tabel Foreign keys di atas.
3. Periksa ENUM di **Structure** pada kolom terkait dan bandingkan nilainya dengan tabel ENUM values.
4. Buka **Structure - Indexes** untuk melihat primary, unique, dan secondary indexes.

## Akun testing seeder

Semua akun demo menggunakan password `Password123!`. Gunakan hanya untuk development lokal.

| Peran | Email |
|---|---|
| Super admin | `superadmin@scap.test` |
| Admin PKA | `pka@scap.test` |
| Mahasiswa | 20 akun Faker dengan alamat `@scap.test` |
| Verifier | `verifier1@scap.test`, `verifier2@scap.test` |
