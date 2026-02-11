import { Role } from '@prisma/client';
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    role?: Role;
    departmentId?: string;
    teamId?: string;
    isActive?: boolean;
}
