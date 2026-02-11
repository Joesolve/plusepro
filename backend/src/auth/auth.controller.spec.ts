import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

const mockAuthService = {
  register: jest.fn(),
  validateUser: jest.fn(),
  generateTokens: jest.fn(),
  verifyToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = mockAuthService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────────────
  describe('register', () => {
    const dto: RegisterDto = {
      email: 'new@example.com',
      password: 'SecureP@ss1',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('should call authService.register and return the result', async () => {
      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: dto.email,
          role: 'EMPLOYEE',
          tenantId: null,
        },
      };
      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from authService.register', async () => {
      authService.register.mockRejectedValue(new Error('Conflict'));

      await expect(controller.register(dto)).rejects.toThrow('Conflict');
    });
  });

  // ──────────────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────────────
  describe('login', () => {
    it('should call authService.generateTokens with req.user and return tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
      };
      const mockReq = { user: mockUser };
      const expectedResult = {
        accessToken: 'jwt-token',
        user: mockUser,
      };

      authService.generateTokens.mockResolvedValue(expectedResult);

      const result = await controller.login(mockReq);

      expect(authService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /auth/me
  // ──────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return the current user from the @CurrentUser decorator', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        tenantId: 'tenant-1',
      };

      // The controller method simply returns the user injected by the decorator
      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /auth/google/callback
  // ──────────────────────────────────────────────────
  describe('googleCallback', () => {
    it('should call authService.generateTokens with the OAuth user', async () => {
      const oauthUser = {
        id: 'user-2',
        email: 'google@example.com',
        role: 'EMPLOYEE',
        tenantId: null,
      };
      const mockReq = { user: oauthUser };
      const expectedResult = { accessToken: 'google-jwt', user: oauthUser };

      authService.generateTokens.mockResolvedValue(expectedResult);

      const result = await controller.googleCallback(mockReq);

      expect(authService.generateTokens).toHaveBeenCalledWith(oauthUser);
      expect(result).toEqual(expectedResult);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /auth/microsoft/callback
  // ──────────────────────────────────────────────────
  describe('microsoftCallback', () => {
    it('should call authService.generateTokens with the OAuth user', async () => {
      const oauthUser = {
        id: 'user-3',
        email: 'ms@example.com',
        role: 'MANAGER',
        tenantId: 'tenant-2',
      };
      const mockReq = { user: oauthUser };
      const expectedResult = { accessToken: 'ms-jwt', user: oauthUser };

      authService.generateTokens.mockResolvedValue(expectedResult);

      const result = await controller.microsoftCallback(mockReq);

      expect(authService.generateTokens).toHaveBeenCalledWith(oauthUser);
      expect(result).toEqual(expectedResult);
    });
  });
});
