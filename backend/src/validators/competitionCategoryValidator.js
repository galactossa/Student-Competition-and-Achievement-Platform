const { z } = require('zod');

const fields = {
  name: z.string({ error: 'Nama kategori wajib diisi.' })
    .trim()
    .min(3, 'Nama kategori minimal 3 karakter.')
    .max(80, 'Nama kategori maksimal 80 karakter.'),
  description: z.preprocess(
    (value) => value === '' || value === null ? undefined : value,
    z.string({ error: 'Deskripsi kategori harus berupa teks.' })
      .trim()
      .max(10000, 'Deskripsi kategori maksimal 10000 karakter.')
      .optional()
  )
};

module.exports = {
  createSchema: z.object(fields),
  updateSchema: z.object({
    ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()]))
  }).refine((value) => Object.keys(value).length > 0, 'Isi setidaknya satu data kategori.')
};
