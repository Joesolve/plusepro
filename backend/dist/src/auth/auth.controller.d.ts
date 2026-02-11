import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    login(req: any): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    googleAuth(): Promise<void>;
    googleCallback(req: any): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    microsoftAuth(): Promise<void>;
    microsoftCallback(req: any): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            tenantId: string | null;
        };
    }>;
    getProfile(user: any): Promise<any>;
}
