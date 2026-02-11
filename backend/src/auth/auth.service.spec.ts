import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

// Mock bcryptjs at the module level
jest.mock('bcryptjs');

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  account: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let jwt: typeof mockJwtService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = mockPrismaService;
    jwt = mockJwtService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // register()
  // ──────────────────────────────────────────────────
  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'SecureP@ss1',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('should register a new user and return tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const createdUser = {
        id: 'user-1',
        email: registerDto.email,
        passwordHash: 'hashed_password',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        tenantId: null,
      };
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.account.create.mockResolvedValue({});
      jwt.sign.mockReturnValue('jwt-access-token');

      const result = await service.register(registerDto);

      // Should have checked for existing user
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      // Should hash the password with 12 rounds
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);

      // Should create the user in the database
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashed_password',
          firstName: 'Jane',
          lastName: 'Doe',
          tenantId: null,
          role: 'EMPLOYEE',
        },
      });

      // Should create a credentials account record
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'user-1',
        },
      });

      // Should return access token and user info
      expect(result).toEqual({
        accessToken: 'jwt-access-token',
        user: {
          id: 'user-1',
          email: registerDto.email,
          role: 'EMPLOYEE',
          tenantId: null,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );

      // Should not attempt to create user
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should use provided tenantId and role when given', async () => {
      const dtoWithTenant: RegisterDto = {
        ...registerDto,
        tenantId: 'tenant-1',
        role: 'COMPANY_ADMIN' as any,
      };

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      prisma.user.create.mockResolvedValue({
        id: 'user-2',
        email: dtoWithTenant.email,
        role: 'COMPANY_ADMIN',
        tenantId: 'tenant-1',
      });
      prisma.account.create.mockResolvedValue({});
      jwt.sign.mockReturnValue('jwt-token');

      await service.register(dtoWithTenant);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          role: 'COMPANY_ADMIN',
        }),
      });
    });
  });

  // ──────────────────────────────────────────────────
  // validateUser()
  // ──────────────────────────────────────────────────
  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'correct-password';

    const activeUser = {
      id: 'user-1',
      email,
      passwordHash: 'hashed_pw',
      isActive: true,
      deletedAt: null,
      role: 'EMPLOYEE',
      tenantId: 'tenant-1',
    };

    it('should return the user when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(activeUser);

      const result = await service.validateUser(email, password);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed_pw');
      // Should update lastLoginAt
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(result).toEqual(activeUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        passwordHash: null,
      });

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when account is deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        isActive: false,
      });

      await expect(service.validateUser(email, password)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Account is deactivated',
      );
    });

    it('should throw ForbiddenException when account is deleted', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        deletedAt: new Date(),
      });

      await expect(service.validateUser(email, password)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Account has been deleted',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  // ──────────────────────────────────────────────────
  // generateTokens()
  // ──────────────────────────────────────────────────
  describe('generateTokens', () => {
    it('should return an accessToken and user object with correct JWT payload', async () => {
      const user = {
        id: 'user-1',
        email: 'u@example.com',
        role: 'EMPLOYEE' as const,
        tenantId: 'tenant-1',
      };

      jwt.sign.mockReturnValue('signed-jwt-token');

      const result = await service.generateTokens(user);

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'u@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
      });

      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        user: {
          id: 'user-1',
          email: 'u@example.com',
          role: 'EMPLOYEE',
          tenantId: 'tenant-1',
        },
      });
    });

    it('should handle null tenantId', async () => {
      const user = {
        id: 'user-2',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN' as const,
        tenantId: null,
      };

      jwt.sign.mockReturnValue('admin-token');

      const result = await service.generateTokens(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: null }),
      );
      expect(result.user.tenantId).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────
  // verifyToken()
  // ──────────────────────────────────────────────────
  describe('verifyToken', () => {
    it('should return decoded payload for a valid token', async () => {
      const payload = {
        sub: 'user-1',
        email: 'u@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
      };
      jwt.verify.mockReturnValue(payload);

      const result = await service.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyToken('bad-token')).rejects.toThrow(
        'Invalid or expired token',
      );
    });
  });
});
