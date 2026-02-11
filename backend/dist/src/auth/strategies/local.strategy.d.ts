import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string;
        passwordHash: string | null;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        emailVerified: Date | null;
        lastLoginAt: Date | null;
        deletedAt: Date | null;
        departmentId: string | null;
        teamId: string | null;
    }>;
}
export {};
