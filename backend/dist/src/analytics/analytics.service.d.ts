import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getEngagementTrend(tenantId: string, months?: number): Promise<{
        month: string;
        averageScore: number;
        responseCount: number;
    }[]>;
    getDepartmentHeatmap(tenantId: string): Promise<{
        departmentId: string;
        departmentName: string;
        scores: {
            value: string;
            average: number;
        }[];
    }[]>;
    getSurveyCompletionRates(tenantId: string): Promise<{
        surveyId: string;
        title: string;
        publishedAt: Date | null;
        assignedCount: number;
        responseCount: number;
        completionRate: number;
    }[]>;
    getTopBottomQuestions(tenantId: string, limit?: number): Promise<{
        top: {
            questionId: string;
            text: string;
            surveyTitle: string;
            averageScore: number;
            responseCount: number;
        }[];
        bottom: {
            questionId: string;
            text: string;
            surveyTitle: string;
            averageScore: number;
            responseCount: number;
        }[];
    }>;
    getGapTrends(tenantId: string): Promise<{
        cycleId: string;
        cycleName: string;
        startDate: Date;
        gaps: {
            value: string;
            avgSelfRating: number;
            avgManagerRating: number;
            avgGap: number;
        }[];
    }[]>;
}
