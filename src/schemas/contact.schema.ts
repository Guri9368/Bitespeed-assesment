import { z } from 'zod';

export const identifySchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .max(254)
      .nullable()
      .optional()
      .transform((v) => v?.trim() || null),

    phoneNumber: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .regex(/^[+\d\s\-().]+$/, 'Invalid phone number format')
      .nullable()
      .optional()
      .transform((v) => v?.trim() || null),
  })
  .refine((data) => data.email != null || data.phoneNumber != null, {
    message: 'At least one of email or phoneNumber is required',
    path: ['email', 'phoneNumber'],
  });

export type IdentifySchemaInput = z.infer<typeof identifySchema>;
