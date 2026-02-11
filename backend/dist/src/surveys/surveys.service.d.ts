import { PrismaService } from '../prisma/prisma.service';
export declare class SurveysService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createdById: string, dto: any): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            surveyId: string;
            type: import(".prisma/client").$Enums.QuestionType;
            text: string;
            isRequired: boolean;
            sortOrder: number;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            coreValueId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SurveyStatus;
        title: string;
        description: string | null;
        isAnonymous: boolean;
        scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
        scheduleDay: number | null;
        nextRunAt: Date | null;
        lastRunAt: Date | null;
        createdById: string | null;
        publishedAt: Date | null;
        closesAt: Date | null;
    }>;
    findAll(tenantId: string, page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                questions: number;
                assignments: number;
                responses: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.SurveyStatus;
            title: string;
            description: string | null;
            isAnonymous: boolean;
            scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
            scheduleDay: number | null;
            nextRunAt: Date | null;
            lastRunAt: Date | null;
            createdById: string | null;
            publishedAt: Date | null;
            closesAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, tenantId: string): Promise<{
        _count: {
            assignments: number;
            responses: number;
        };
        questions: ({
            coreValue: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                isActive: boolean;
                description: string | null;
                sortOrder: number;
                iconUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            surveyId: string;
            type: import(".prisma/client").$Enums.QuestionType;
            text: string;
            isRequired: boolean;
            sortOrder: number;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            coreValueId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SurveyStatus;
        title: string;
        description: string | null;
        isAnonymous: boolean;
        scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
        scheduleDay: number | null;
        nextRunAt: Date | null;
        lastRunAt: Date | null;
        createdById: string | null;
        publishedAt: Date | null;
        closesAt: Date | null;
    }>;
    update(id: string, tenantId: string, dto: any): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            surveyId: string;
            type: import(".prisma/client").$Enums.QuestionType;
            text: string;
            isRequired: boolean;
            sortOrder: number;
            options: import("@prisma/client/runtime/library").JsonValue | null;
            coreValueId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SurveyStatus;
        title: string;
        description: string | null;
        isAnonymous: boolean;
        scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
        scheduleDay: number | null;
        nextRunAt: Date | null;
        lastRunAt: Date | null;
        createdById: string | null;
        publishedAt: Date | null;
        closesAt: Date | null;
    }>;
    publish(id: string, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SurveyStatus;
        title: string;
        description: string | null;
        isAnonymous: boolean;
        scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
        scheduleDay: number | null;
        nextRunAt: Date | null;
        lastRunAt: Date | null;
        createdById: string | null;
        publishedAt: Date | null;
        closesAt: Date | null;
    }>;
    close(id: string, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SurveyStatus;
        title: string;
        description: string | null;
        isAnonymous: boolean;
        scheduleType: import(".prisma/client").$Enums.ScheduleType | null;
        scheduleDay: number | null;
        nextRunAt: Date | null;
        lastRunAt: Date | null;
        createdById: string | null;
        publishedAt: Date | null;
        closesAt: Date | null;
    }>;
    assignToUsers(surveyId: string, tenantId: string, userIds: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    submitResponse(surveyId: string, tenantId: string, userId: string | null, answers: any[]): Promise<{
        answers: {
            id: string;
            createdAt: Date;
            numericValue: number | null;
            textValue: string | null;
            questionId: string;
            responseId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        surveyId: string;
        userId: string | null;
    }>;
    getResponses(surveyId: string, tenantId: string): Promise<({
        answers: ({
            question: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                surveyId: string;
                type: import(".prisma/client").$Enums.QuestionType;
                text: string;
                isRequired: boolean;
                sortOrder: number;
                options: import("@prisma/client/runtime/library").JsonValue | null;
                coreValueId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            numericValue: number | null;
            textValue: string | null;
            questionId: string;
            responseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        surveyId: string;
        userId: string | null;
    })[]>;
    getCompletionRate(surveyId: string, tenantId: string): Promise<{
        total: number;
        completed: number;
        rate: number;
    }>;
}
