import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register with email/password. Rate limited to 5 per minute.
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * Login with email/password. Rate limited to 10 per minute.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: any) {
    return this.authService.generateTokens(req.user);
  }

  /**
   * GET /api/auth/google
   * Initiate Google OAuth flow.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport redirects to Google
  }

  /**
   * GET /api/auth/google/callback
   * Google OAuth callback — returns JWT.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any) {
    return this.authService.generateTokens(req.user);
  }

  /**
   * GET /api/auth/microsoft
   * Initiate Microsoft OAuth flow.
   */
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Passport redirects to Microsoft
  }

  /**
   * GET /api/auth/microsoft/callback
   * Microsoft OAuth callback — returns JWT.
   */
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftCallback(@Req() req: any) {
    return this.authService.generateTokens(req.user);
  }

  /**
   * GET /api/auth/me
   * Return current authenticated user profile.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
