import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { TeamsModule } from './teams/teams.module';
import { SurveysModule } from './surveys/surveys.module';
import { SelfAssessmentsModule } from './self-assessments/self-assessments.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { RecognitionsModule } from './recognitions/recognitions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    // Config from .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 60 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    // Core
    PrismaModule,
    AuthModule,

    // Domain modules
    TenantsModule,
    UsersModule,
    DepartmentsModule,
    TeamsModule,
    SurveysModule,
    SelfAssessmentsModule,
    SuggestionsModule,
    RecognitionsModule,
    AnalyticsModule,
    NotificationsModule,
    SubscriptionsModule,
    OnboardingModule,
  ],
})
export class AppModule {}
