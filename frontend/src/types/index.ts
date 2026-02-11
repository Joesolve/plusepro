// ============================================================
// Core types matching the Prisma schema
// ============================================================

export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'SCALE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'UNPAID';
export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type QuestionType = 'LIKERT_SCALE' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'OPEN_TEXT';
export type ScheduleType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
export type AssignmentStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';
export type AssessmentType = 'SELF' | 'MANAGER';
export type SuggestionStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
export type NotificationType = 'SURVEY_ASSIGNED' | 'SURVEY_REMINDER' | 'SUGGESTION_UPDATE' | 'RECOGNITION_RECEIVED' | 'ASSESSMENT_DUE' | 'SYSTEM';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
  subscription?: Subscription;
  _count?: { users: number };
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxEmployees: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface User {
  id: string;
  tenantId?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  departmentId?: string;
  teamId?: string;
  department?: Department;
  team?: Team;
  createdAt: string;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  teams?: Team[];
  _count?: { users: number };
}

export interface Team {
  id: string;
  tenantId: string;
  departmentId: string;
  name: string;
  managerId?: string;
  manager?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  _count?: { members: number };
}

export interface CoreValue {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Survey {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  isAnonymous: boolean;
  scheduleType?: ScheduleType;
  publishedAt?: string;
  createdAt: string;
  questions?: SurveyQuestion[];
  _count?: { questions: number; responses: number; assignments: number };
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  sortOrder: number;
  coreValueId?: string;
  coreValue?: CoreValue;
  options?: Record<string, unknown>;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId?: string;
  createdAt: string;
  answers: SurveyAnswer[];
}

export interface SurveyAnswer {
  id: string;
  responseId: string;
  questionId: string;
  numericValue?: number;
  textValue?: string;
  question?: SurveyQuestion;
}

export interface GapAnalysis {
  valueName: string;
  selfRating: number | null;
  managerRating: number | null;
  gap: number | null;
}

export interface Suggestion {
  id: string;
  tenantId: string;
  text: string;
  category?: string;
  tags: string[];
  status: SuggestionStatus;
  adminNote?: string;
  createdAt: string;
}

export interface Recognition {
  id: string;
  tenantId: string;
  senderId: string;
  receiverId: string;
  coreValueId: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
  sender?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  receiver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  coreValue?: Pick<CoreValue, 'id' | 'name'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'role' | 'tenantId'>;
}

export interface EngagementTrend {
  month: string;
  averageScore: number;
  responseCount: number;
}

export interface DepartmentHeatmapData {
  departmentId: string;
  departmentName: string;
  scores: Array<{ value: string; average: number }>;
}

export interface CompletionRate {
  surveyId: string;
  title: string;
  publishedAt: string;
  assignedCount: number;
  responseCount: number;
  completionRate: number;
}

export interface KeywordFrequency {
  word: string;
  count: number;
}

export interface BillingOverview {
  totalTenants: number;
  activeTenants: number;
  mrr: number;
  seatUtilization: Array<{
    tenantId: string;
    tenantName: string;
    plan: SubscriptionPlan;
    maxEmployees: number;
    currentEmployees: number;
    utilization: number;
  }>;
}

export interface OnboardingStatus {
  steps: Array<{ step: string; label: string; completed: boolean }>;
  progress: number;
  isComplete: boolean;
}
