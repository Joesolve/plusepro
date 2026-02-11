import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  eraseUserData: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: typeof mockUsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = mockUsersService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ──────────────────────────────────────────────────
  // GET /users
  // ──────────────────────────────────────────────────
  describe('findAll', () => {
    it('should call usersService.findAll with tenant scope and pagination', async () => {
      const tenantId = 'tenant-1';
      const role = 'COMPANY_ADMIN' as any;
      const userId = 'user-1';
      const pagination = { page: 1, limit: 20 };

      const paginatedResult = {
        data: [
          {
            id: 'user-2',
            email: 'b@example.com',
            firstName: 'Bob',
            lastName: 'Bee',
            role: 'EMPLOYEE',
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      usersService.findAll.mockResolvedValue(paginatedResult);

      const result = controller.findAll(tenantId, role, userId, pagination);

      expect(usersService.findAll).toHaveBeenCalledWith(
        tenantId,
        role,
        userId,
        pagination,
      );
      await expect(result).resolves.toEqual(paginatedResult);
    });

    it('should forward pagination parameters correctly', async () => {
      usersService.findAll.mockResolvedValue({ data: [], meta: {} });

      const pagination = { page: 3, limit: 10 };
      controller.findAll('tenant-1', 'MANAGER' as any, 'mgr-1', pagination);

      expect(usersService.findAll).toHaveBeenCalledWith(
        'tenant-1',
        'MANAGER',
        'mgr-1',
        { page: 3, limit: 10 },
      );
    });
  });

  // ──────────────────────────────────────────────────
  // GET /users/:id
  // ──────────────────────────────────────────────────
  describe('findOne', () => {
    it('should call usersService.findOne with id and tenantId', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'a@example.com',
        firstName: 'Alice',
        tenantId: 'tenant-1',
      };
      usersService.findOne.mockResolvedValue(mockUser);

      const result = controller.findOne('user-1', 'tenant-1');

      expect(usersService.findOne).toHaveBeenCalledWith('user-1', 'tenant-1');
      await expect(result).resolves.toEqual(mockUser);
    });

    it('should propagate NotFoundException from service', async () => {
      usersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(
        controller.findOne('nonexistent', 'tenant-1'),
      ).rejects.toThrow('User not found');
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /users/:id
  // ──────────────────────────────────────────────────
  describe('update', () => {
    it('should call usersService.update with correct parameters', async () => {
      const updatedUser = {
        id: 'user-1',
        firstName: 'Alicia',
        tenantId: 'tenant-1',
      };
      usersService.update.mockResolvedValue(updatedUser);

      const dto = { firstName: 'Alicia' };
      const result = controller.update('user-1', 'tenant-1', dto);

      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
        dto,
      );
      await expect(result).resolves.toEqual(updatedUser);
    });
  });

  // ──────────────────────────────────────────────────
  // DELETE /users/:id
  // ──────────────────────────────────────────────────
  describe('remove (soft delete)', () => {
    it('should call usersService.softDelete with id and tenantId', async () => {
      usersService.softDelete.mockResolvedValue({
        id: 'user-1',
        deletedAt: new Date(),
        isActive: false,
      });

      const result = controller.remove('user-1', 'tenant-1');

      expect(usersService.softDelete).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
      );
      await expect(result).resolves.toBeDefined();
    });

    it('should propagate NotFoundException from service', async () => {
      usersService.softDelete.mockRejectedValue(new Error('User not found'));

      await expect(
        controller.remove('nonexistent', 'tenant-1'),
      ).rejects.toThrow('User not found');
    });
  });

  // ──────────────────────────────────────────────────
  // DELETE /users/:id/erase (GDPR hard delete)
  // ──────────────────────────────────────────────────
  describe('erase (GDPR hard delete)', () => {
    it('should call usersService.eraseUserData with id and tenantId', async () => {
      usersService.eraseUserData.mockResolvedValue(undefined);

      const result = controller.erase('user-1', 'tenant-1');

      expect(usersService.eraseUserData).toHaveBeenCalledWith(
        'user-1',
        'tenant-1',
      );
      await expect(result).resolves.toBeUndefined();
    });

    it('should propagate NotFoundException from service', async () => {
      usersService.eraseUserData.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(
        controller.erase('nonexistent', 'tenant-1'),
      ).rejects.toThrow('User not found');
    });
  });
});
