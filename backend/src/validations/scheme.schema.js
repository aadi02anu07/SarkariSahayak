import { z } from 'zod';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
];

export const createSchemeSchema = z.object({
  name: z.string().min(3).max(500).trim(),
  nameHindi: z.string().max(500).trim().optional(),
  slug: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .trim(),
  description: z.string().optional(),
  ministry: z.string().max(255).optional(),
  isCentral: z.boolean().default(true),
  state: z.string().optional(),
  benefitType: z.enum(['CASH', 'LOAN', 'SUBSIDY', 'SCHOLARSHIP', 'INSURANCE', 'OTHER']),
  benefitAmount: z.string().max(255).optional(),
  eligibilityJson: z.object({
    states: z.array(z.string()).default(['ALL']),
    categories: z.array(z.enum(['ALL', 'GENERAL', 'OBC', 'SC', 'ST', 'EWS'])).default(['ALL']),
    minAge: z.number().int().min(0).max(120).optional(),
    maxAge: z.number().int().min(0).max(120).optional(),
    genders: z.array(z.enum(['ALL', 'MALE', 'FEMALE', 'OTHER'])).default(['ALL']),
    occupations: z.array(z.enum(['ALL', 'FARMER', 'STUDENT', 'BUSINESS', 'LABOURER', 'GOVT_EMPLOYEE', 'OTHER'])).default(['ALL']),
    maxIncome: z.number().int().min(0).optional(),
    minIncome: z.number().int().min(0).optional(),
    minEducation: z.enum(['BELOW_10', 'TENTH', 'TWELFTH', 'GRADUATE', 'POSTGRADUATE', 'DOCTORATE']).optional(),
    requiresDisability: z.boolean().optional(),
    requiresBPL: z.boolean().optional(),
    requiresBankAccount: z.boolean().optional(),
    requiresLand: z.boolean().optional(),
    maxLandAcres: z.number().optional(),
    customCriteria: z.string().optional(),
  }),
  documentsNeeded: z.array(z.string()).default([]),
  applyUrl: z.string().url('Must be a valid URL').optional(),
  openDate: z.string().datetime().optional(),
  closeDate: z.string().datetime().optional(),
  isRolling: z.boolean().default(false),
  processingDays: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'UPCOMING']).default('DRAFT'),
  lastVerified: z.string().datetime().optional(),
});

export const updateSchemeSchema = createSchemeSchema.partial().omit({ slug: true });

export const schemeListQuerySchema = z.object({
  state: z.string().optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  benefitType: z.enum(['CASH', 'LOAN', 'SUBSIDY', 'SCHOLARSHIP', 'INSURANCE', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED', 'UPCOMING']).default('ACTIVE'),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'deadline_asc', 'views_desc']).default('newest'),
});

export const eligibilityMatchSchema = z.object({
  state: z.string().optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  occupation: z.enum(['FARMER', 'STUDENT', 'BUSINESS', 'LABOURER', 'GOVT_EMPLOYEE', 'OTHER']).optional(),
  annualIncome: z.coerce.number().int().min(0).optional(),
  education: z.enum(['BELOW_10', 'TENTH', 'TWELFTH', 'GRADUATE', 'POSTGRADUATE', 'DOCTORATE']).optional(),
  isDisabled: z.coerce.boolean().optional(),
  isBpl: z.coerce.boolean().optional(),
  hasBankAcct: z.coerce.boolean().optional(),
  ownsLand: z.coerce.boolean().optional(),
  landAcres: z.coerce.number().optional(),
});
