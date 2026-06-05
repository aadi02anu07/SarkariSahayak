import { z } from 'zod';

export const updateProfileSchema = z.object({
  state: z.string().optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  occupation: z.enum(['FARMER', 'STUDENT', 'BUSINESS', 'LABOURER', 'GOVT_EMPLOYEE', 'OTHER']).optional(),
  annualIncome: z.number().int().min(0).optional(),
  education: z.enum(['BELOW_10', 'TENTH', 'TWELFTH', 'GRADUATE', 'POSTGRADUATE', 'DOCTORATE']).optional(),
  isDisabled: z.boolean().optional(),
  disabilityPct: z.number().int().min(0).max(100).optional(),
  ownsLand: z.boolean().optional(),
  landAcres: z.number().min(0).optional(),
  hasBankAcct: z.boolean().optional(),
  isBpl: z.boolean().optional(),
  familySize: z.number().int().min(1).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
});

export const notificationPrefSchema = z.object({
  deadlineReminder: z.boolean().optional(),
  newSchemeAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  schemeReopened: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

export const savedSchemeStatusSchema = z.object({
  status: z.enum(['SAVED', 'INTERESTED', 'APPLIED', 'DOCS_SUBMITTED', 'APPROVED', 'REJECTED']),
  notes: z.string().max(1000).optional(),
});
