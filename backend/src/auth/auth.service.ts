import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: Role;
  tenantId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user with email/password credentials.
   */
  async register(dto: RegisterDto) {
    // Check for existing user
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tenantId: dto.tenantId || null,
        role: dto.role || Role.EMPLOYEE,
      },
    });

    // Create a credentials account record
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      },
    });

    return this.generateTokens(user);
  }

  /**
   * Validate email/password and return JWT tokens.
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('Account has been deleted');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  /**
   * Handle OAuth user — find or create account.
   */
  async validateOAuthUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
    provider: string;
    providerAccountId: string;
    avatarUrl?: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    // Check if account already linked
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (account) {
      // Update last login
      await this.prisma.user.update({
        where: { id: account.userId },
        data: { lastLoginAt: new Date() },
      });
      return account.user;
    }

    // Check if user exists with this email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          emailVerified: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    // Link OAuth account
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    return user;
  }

  /**
   * Generate JWT access token for authenticated user.
   */
  async generateTokens(user: { id: string; email: string; role: Role; tenantId: string | null }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Verify and decode a JWT token.
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
