import z from 'zod';

export const ScannerOpenOptionsSchema = z.object({
  baudRate: z.coerce.number(),
  parity: z.enum(['none', 'even', 'odd']).optional(),
  dataBits: z
    .union([z.literal(5), z.literal(6), z.literal(7), z.literal(8)])
    .optional(),
  lock: z.boolean().optional(),
  stopBits: z.union([z.literal(1), z.literal(1.5), z.literal(2)]).optional(),
  rtscts: z.boolean().optional(),
  xon: z.boolean().optional(),
  xoff: z.boolean().optional(),
  xany: z.boolean().optional(),
  hupcl: z.boolean().optional(),
});

export const ScannerParserOptionsSchema = z.object({
  regex: z.string(),
  encoding: z.string().optional(), // BufferEncoding is a string
});

export const ScannerConfigSchema = z.object({
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  serialNumber: z.string().optional(),
  openOptions: ScannerOpenOptionsSchema,
  parserOptions: ScannerParserOptionsSchema,
});

export const WhiteListSchema = z.object({
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  serialNumber: z.string().optional(),
});

export type ScannerConfigType = z.infer<typeof ScannerConfigSchema>;
export type WhiteListType = z.infer<typeof WhiteListSchema>;
