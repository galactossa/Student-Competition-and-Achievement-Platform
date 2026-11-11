const { z } = require('zod');

const achievementListQuerySchema = z.object({
  limit: z.coerce.number({ error: 'Batas data harus berupa angka.' })
    .int('Batas data harus berupa bilangan bulat.')
    .min(1, 'Batas data minimal 1.')
    .max(50, 'Batas data maksimal 50.')
    .default(6)
});

module.exports = { achievementListQuerySchema };
