import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    tenantId: string | null;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    validateUser(email: string, password: string): Promise<{
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
    validateOAuthUser(profile: {
        email: string;
        firstName: string;
        lastName: string;
        provider: string;
        providerAccountId: string;
        avatarUrl?: string;
        accessToken?: string;
        refreshToken?: string;
    }): Promise<{
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
    generateTokens(user: {
        id: string;
        email: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    verifyToken(token: string): Promise<JwtPayload>;
}
