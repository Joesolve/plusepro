import { Module } from '@nestjs/common';
import { SelfAssessmentsService } from './self-assessments.service';
import { SelfAssessmentsController } from './self-assessments.controller';
@Module({ controllers: [SelfAssessmentsController], providers: [SelfAssessmentsService], exports: [SelfAssessmentsService] })
export class SelfAssessmentsModule {}
