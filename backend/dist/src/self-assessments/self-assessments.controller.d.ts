import { SelfAssessmentsService } from './self-assessments.service';
import { AssessmentType } from '@prisma/client';
export declare class SelfAssessmentsController {
    private service;
    constructor(service: SelfAssessmentsService);
    createCycle(tenantId: string, data: {
        name: string;
        startDate: Date;
        endDate: Date;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
    }>;
    getCycles(tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        isActive: boolean;
        startDate: Date;
        endDate: Date;
    }[]>;
    submit(tenantId: string, userId: string, data: {
        cycleId: string;
        employeeId: string;
        coreValueId: string;
        rating: number;
        comment?: string;
        assessmentType: AssessmentType;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        assessorId: string;
        employeeId: string;
        coreValueId: string;
        cycleId: string;
        rating: number;
        comment: string | null;
        assessmentType: import(".prisma/client").$Enums.AssessmentType;
    }>;
    getGapAnalysis(tenantId: string, cycleId: string, employeeId: string): Promise<{
        gap: number | null;
        valueName: string;
        selfRating: number | null;
        managerRating: number | null;
    }[]>;
}
