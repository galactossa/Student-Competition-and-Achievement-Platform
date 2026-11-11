const { z } = require('zod');

const registerSchema = z.object({
  name: z.string({ error: 'Nama wajib diisi.' })
    .trim()
    .min(3, 'Nama minimal 3 karakter.')
    .max(100, 'Nama maksimal 100 karakter.'),
  email: z.string({ error: 'Email wajib diisi.' })
    .trim()
    .email('Format email tidak valid.')
    .max(150, 'Email maksimal 150 karakter.'),
  password: z.string({ error: 'Password wajib diisi.' })
    .min(8, 'Password minimal 8 karakter.')
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf.')
    .regex(/[0-9]/, 'Password harus mengandung angka.'),
  nim: z.string({ error: 'NIM harus berupa teks.' })
    .regex(/^\d{8,20}$/, 'NIM harus terdiri dari 8 sampai 20 digit.')
    .optional(),
  program_studi: z.string({ error: 'Program studi harus berupa teks.' })
    .trim()
    .min(1, 'Program studi tidak boleh kosong.')
    .max(100, 'Program studi maksimal 100 karakter.')
    .optional(),
  angkatan: z.number({ error: 'Angkatan harus berupa angka.' })
    .int('Angkatan harus berupa bilangan bulat.')
    .min(1900, 'Angkatan minimal 1900.')
    .max(2100, 'Angkatan maksimal 2100.')
    .optional()
}).refine((data) => Boolean(data.nim) === Boolean(data.program_studi), {
  message: 'NIM dan program studi harus diisi bersamaan.',
  path: ['nim']
});

const loginSchema = z.object({
  email: z.string({ error: 'Email wajib diisi.' })
    .trim()
    .email('Format email tidak valid.'),
  password: z.string({ error: 'Password wajib diisi.' })
    .min(1, 'Password wajib diisi.')
});

const refreshSchema = z.object({
  refreshToken: z.string({ error: 'Refresh token wajib diisi.' })
    .min(1, 'Refresh token wajib diisi.')
});

module.exports = { loginSchema, refreshSchema, registerSchema };
