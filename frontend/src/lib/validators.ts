import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const surveySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isAnonymous: z.boolean().default(true),
  scheduleType: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
  questions: z.array(z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['LIKERT_SCALE', 'MULTIPLE_CHOICE', 'YES_NO', 'OPEN_TEXT']),
    isRequired: z.boolean().default(true),
    coreValueId: z.string().optional(),
    options: z.any().optional(),
  })).min(1, 'At least one question is required'),
});

export const suggestionSchema = z.object({
  text: z.string().min(10, 'Suggestion must be at least 10 characters').max(2000),
});

export const recognitionSchema = z.object({
  receiverId: z.string().min(1, 'Please select a recipient'),
  coreValueId: z.string().min(1, 'Please select a core value'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(500),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SurveyFormData = z.infer<typeof surveySchema>;
export type SuggestionFormData = z.infer<typeof suggestionSchema>;
export type RecognitionFormData = z.infer<typeof recognitionSchema>;
