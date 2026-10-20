import z from 'zod';
import { LockState } from '../../scanner/enums/LockState.js';

export const LockStateSchema = z.enum(LockState).optional();

export const PollParamsSchema = z.object({
  id: z.uuid({ version: 'v5' }),
});

export const PollQuerySchema = z.object({
  lockState: LockStateSchema,

  timeout: z.coerce
    .number()
    .int()
    .min(1500)
    .max(30000)
    .default(5000)
    .optional(),
});

export const ScannerResponseSchema = z.object({
  id: z.string(),
  path: z.string(),
  vendorId: z.string(),
  productId: z.string(),
});

export const ScannersResponseSchema = z.array(ScannerResponseSchema);

export const SuccessResponseSchema = z.object({
  status: z.literal('success'),
  data: z.string(),
});

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
});

export const IsAliveParamsSchema = z.object({
  id: z.uuid({ version: 'v5' }),
});

export const IsAliveResponseSchema = z.object({
  alive: z.literal(true),
});

export const PortResponseSchema = z.object({
  path: z.string(),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  pnpId: z.string().optional(),
  valid: z.boolean(),
  whitelisted: z.boolean(),
  configured: z.boolean(),
});

export const PortsResponseSchema = z.array(PortResponseSchema);

export const StopResponseSchema = z.object({
  status: z.literal('success'),
});

export const SessionParamsSchema = z.object({
  id: z.uuid(),
});

export const SessionResponseSchema = z.object({
  id: z.uuid(),
  scannerId: z.string(),
  lockState: z.enum(LockState),
  blockedBy: z.uuid().optional(),
});

export const SessionsResponseSchema = z.array(SessionResponseSchema);
