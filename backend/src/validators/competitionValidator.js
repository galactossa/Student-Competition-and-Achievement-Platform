const { z } = require('zod');

const LEVELS = ['Internal Kampus', 'Regional', 'Nasional', 'Internasional'];
const MODES = ['online', 'offline', 'hybrid'];
const STATUSES = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'submission',
  'competition',
  'result_announced',
  'completed'
];

const optionalText = (max = 10000) => z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string({ error: 'Nilai harus berupa teks.' })
    .trim()
    .max(max, `Panjang teks maksimal ${max} karakter.`)
    .optional()
);
const optionalDate = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.union(
    [z.iso.date(), z.iso.datetime({ offset: true })],
    { error: 'Tanggal harus menggunakan format ISO yang valid.' }
  ).optional()
);
const optionalDateOnly = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus berformat YYYY-MM-DD.')
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
      && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value, 'Tanggal tidak valid.')
    .optional()
);
const optionalUrl = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string({ error: 'URL harus berupa teks.' }).url('URL tidak valid.').optional()
);
const optionalPrice = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.number({ error: 'Harga harus berupa angka.' })
    .finite('Harga harus berupa angka.')
    .min(0, 'Harga tidak boleh negatif.')
    .optional()
);

const fields = {
  name: z.string({ error: 'Nama kompetisi wajib diisi.' }).trim().min(3, 'Nama kompetisi minimal 3 karakter.').max(200, 'Nama maksimal 200 karakter.'),
  organizer: z.string({ error: 'Penyelenggara wajib diisi.' }).trim().min(3, 'Penyelenggara minimal 3 karakter.').max(150),
  description: optionalText(),
  category_id: z.coerce.number({ error: 'Kategori wajib dipilih.' }).int().positive('Kategori wajib dipilih.'),
  level: z.enum(LEVELS, { error: 'Level kompetisi wajib diisi dan harus valid.' }),
  start_date: optionalDateOnly,
  end_date: optionalDateOnly,
  registration_deadline: optionalDate,
  submission_deadline: optionalDate,
  result_date: optionalDateOnly,
  location: optionalText(200),
  mode: z.enum(MODES, { error: 'Mode kompetisi wajib diisi dan harus valid.' }),
  registration_url: optionalUrl,
  prize: optionalText(),
  requirements: optionalText(),
  contact_person: optionalText(100),
  price: optionalPrice
};

function scheduleIssues(value, context) {
  const dates = [
    ['registration_deadline', value.registration_deadline],
    ['submission_deadline', value.submission_deadline],
    ['end_date', value.end_date]
  ].filter(([, date]) => date);
  for (let index = 1; index < dates.length; index += 1) {
    if (Date.parse(dates[index - 1][1]) >= Date.parse(dates[index][1])) {
      context.addIssue({
        code: 'custom',
        path: [dates[index][0]],
        message: 'Urutan tanggal harus pendaftaran, pengumpulan, lalu akhir kompetisi.'
      });
    }
  }
}

const createSchema = z.object(fields).superRefine(scheduleIssues);
const updateSchema = z.object({
  ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()]))
}).superRefine(scheduleIssues);

const statusSchema = z.object({
  status: z.enum(STATUSES, { error: 'Status kompetisi tidak valid.' })
});

const listQuerySchema = z.object({
  q: z.string({ error: 'Parameter pencarian harus berupa teks.' }).trim().optional(),
  category_id: z.preprocess((value) => value === '' ? undefined : value, z.coerce.number({ error: 'ID kategori harus berupa angka.' }).int('ID kategori harus berupa bilangan bulat.').positive('ID kategori tidak valid.').optional()),
  level: z.enum(LEVELS, { error: 'Level kompetisi tidak valid.' }).optional(),
  mode: z.enum(MODES, { error: 'Mode kompetisi tidak valid.' }).optional(),
  status: z.enum(STATUSES, { error: 'Status kompetisi tidak valid.' }).optional(),
  sort: z.enum(['name_asc', 'name_desc', 'deadline_asc', 'newest'], { error: 'Urutan data tidak valid.' }).default('newest'),
  page: z.coerce.number({ error: 'Halaman harus berupa angka.' }).int('Halaman harus berupa bilangan bulat.').min(1, 'Halaman minimal 1.').default(1),
  limit: z.coerce.number({ error: 'Batas data harus berupa angka.' }).int('Batas data harus berupa bilangan bulat.').min(1).max(50, 'Batas data maksimal 50.').default(10)
});

const publicListQuerySchema = z.object({
  q: z.string({ error: 'Parameter pencarian harus berupa teks.' }).trim().optional(),
  category_id: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number({ error: 'ID kategori harus berupa angka.' }).int().positive('ID kategori tidak valid.').optional()
  ),
  level: z.enum(LEVELS, { error: 'Level kompetisi tidak valid.' }).optional(),
  mode: z.enum(MODES, { error: 'Mode kompetisi tidak valid.' }).optional(),
  is_free: z.preprocess((value) => {
    if (value === undefined || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  }, z.boolean({ error: 'is_free harus bernilai true atau false.' }).optional()),
  deadline_before: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.union(
      [z.iso.date(), z.iso.datetime({ offset: true })],
      { error: 'deadline_before harus berupa tanggal ISO yang valid.' }
    ).optional()
  ),
  sort: z.enum(['newest', 'deadline_asc', 'name_asc'], { error: 'Urutan data tidak valid.' }).default('newest'),
  page: z.coerce.number({ error: 'Halaman harus berupa angka.' }).int().min(1, 'Halaman minimal 1.').default(1),
  limit: z.coerce.number({ error: 'Batas data harus berupa angka.' })
    .int()
    .min(1, 'Batas data minimal 1.')
    .max(50, 'Batas data maksimal 50.')
    .default(6)
});

module.exports = {
  createSchema,
  listQuerySchema,
  publicListQuerySchema,
  statusSchema,
  updateSchema,
  STATUSES
};
