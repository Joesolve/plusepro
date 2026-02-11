import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const MicrosoftStrategy_base: new (...args: unknown[]) => any;
export declare class MicrosoftStrategy extends MicrosoftStrategy_base {
    private authService;
    constructor(config: ConfigService, authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<void>;
}
export {};
