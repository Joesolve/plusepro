import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/utils/pagination';
import { Role } from '@prisma/client';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(tenantId: string, role: Role, userId: string, pagination: PaginationDto): Promise<import("../common/utils/pagination").PaginatedResult<{
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        department: {
            id: string;
            name: string;
        } | null;
        team: {
            id: string;
            name: string;
        } | null;
    }>>;
    findOne(id: string, tenantId: string): Promise<{
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
        } | null;
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            departmentId: string;
            managerId: string | null;
        } | null;
    } & {
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
    update(id: string, tenantId: string, dto: UpdateUserDto): Promise<{
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
    remove(id: string, tenantId: string): Promise<{
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
    erase(id: string, tenantId: string): Promise<void>;
}
