import { OnboardingService } from './onboarding.service';
export declare class OnboardingController {
    private service;
    constructor(service: OnboardingService);
    setCoreValues(tenantId: string, values: {
        name: string;
        description?: string;
    }[]): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        isActive: boolean;
        description: string | null;
        sortOrder: number;
        iconUrl: string | null;
    }[]>;
    uploadEmployees(tenantId: string, employees: {
        email: string;
        firstName: string;
        lastName: string;
        role?: string;
        departmentName?: string;
    }[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    getStatus(tenantId: string): Promise<{
        steps: {
            key: string;
            label: string;
            completed: boolean;
        }[];
        completedCount: number;
        totalSteps: number;
        isComplete: boolean;
    }>;
}
