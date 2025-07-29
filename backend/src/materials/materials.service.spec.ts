import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import {
  createMockAIOutput,
  createMockMaterial,
} from '../../test/helpers/test-data.helper';
import { UnauthorizedException } from '@nestjs/common';

describe('MaterialsService', () => {
  let service: MaterialsService;
  let mockDrizzle: any;

  beforeEach(async () => {
    mockDrizzle = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      catch: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: 'DRIZZLE', useValue: mockDrizzle },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserMaterials', () => {
    it('should return paginated user materials', async () => {
      const mockMaterial = createMockMaterial();

      const countQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      };

      const dataQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockMaterial]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(dataQuery);

      const result = await service.getUserMaterials('user-id');
      expect(result).toEqual({
        data: [mockMaterial],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
    it('it should respect filters', async () => {
      const mockMaterial = createMockMaterial();

      const countQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([{ count: 1 }]),
      };

      const dataQuery = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnValue([mockMaterial]),
      };

      mockDrizzle.select
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(dataQuery);

      const result = await service.getUserMaterials(
        'user-id',
        1,
        10,
        'title-asc',
        'processed',
      );

      expect(countQuery.where).toHaveBeenCalledWith(expect.anything());
      expect(dataQuery.where).toHaveBeenCalledWith(expect.anything());
      expect(result.data).toEqual([mockMaterial]);
    });
  });
  describe('getMaterialById', () => {
    it('should return material by ID', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      const result = await service.getMaterialById('material-id', 'user-1');
      expect(result).toEqual(mockMaterial);
    });
    it('should throw NotFoundException if material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.getMaterialById('non-existing-id', 'user-1'),
      ).rejects.toThrow('Material not found');
    });
    it('should throw UnauthorizedException if user does not own the material', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      await expect(
        service.getMaterialById('material-id', 'user-2'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
  describe('createMaterial', () => {
    it('should only process materials with status "pending"', async () => {
      const mockMaterial = createMockMaterial('pending');
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockReturnValue([{ ...mockMaterial, status: 'processed' }]),
      });

      const result = await service.createMaterial('user-1', {
        id: 'material-1',
        title: 'New Material',
        description: 'Description',
      });

      expect(result).toEqual({ ...mockMaterial, status: 'processed' });
    });
    it('should throw unauthorized if user does not own the material', async () => {
      const mockMaterial = createMockMaterial('pending');

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      await expect(
        service.createMaterial('user-2', {
          id: 'material-1',
          title: 'New Material',
          description: 'Description',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should update material status to "processed"', async () => {
      const mockMaterial = createMockMaterial('pending');
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockReturnValue([{ ...mockMaterial, status: 'processed' }]),
      };

      mockDrizzle.update.mockReturnValueOnce(mockUpdateChain);

      const result = await service.createMaterial('user-1', {
        id: 'material-1',
        title: 'New Material',
        description: 'Description',
      });

      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.anything());
      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        title: 'New Material',
        description: 'Description',
        status: 'processed',
      });
      expect(result.status).toBe('processed');
    });
    it('should handle non-existing material gracefully', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.createMaterial('user-1', {
          id: 'non-existing-id',
          title: 'New Material',
          description: 'Description',
        }),
      ).rejects.toThrow('Material with this ID doesnt exist');
    });
  });
  describe('deleteMaterial', () => {
    it('cascading delete should remove all related data', async () => {
      const mockMaterial = createMockMaterial();
      const mockAIOutput = createMockAIOutput();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockAIOutput]),
      });

      const result = await service.deleteMaterial('user-1', 'material-1');

      expect(mockDrizzle.delete).toHaveBeenCalledTimes(7);
      expect(result).toBe(true);
    });
    it('should only allow deletion of materials owned by the user', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      await expect(
        service.deleteMaterial('user-2', 'material-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw NotFoundException if material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.deleteMaterial('user-1', 'non-existing-id'),
      ).rejects.toThrow('Material not found');
    });
    it('should delete materials without related data', async () => {
      const mockMaterial = createMockMaterial();

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      const result = await service.deleteMaterial('user-1', 'material-1');

      expect(mockDrizzle.delete).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
  });
  describe('updateMaterial', () => {
    it('should update only allowed fields', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockReturnValue([{ ...mockMaterial, title: 'Updated Title' }]),
      };

      mockDrizzle.update.mockReturnValueOnce(mockUpdateChain);

      const result = await service.updateMaterial('user-1', {
        id: 'material-1',
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(result).toBe(true);
      expect(mockDrizzle.update).toHaveBeenCalledWith(expect.anything());
      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        title: 'Updated Title',
        description: 'Updated Description',
      });
    });
    it('should throw NotFoundException if material does not exist', async () => {
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([]),
      });

      await expect(
        service.updateMaterial('user-1', {
          id: 'non-existing-id',
          title: 'Updated Title',
          description: 'Updated Description',
        }),
      ).rejects.toThrow('Material not found');
    });
    it('should throw UnauthorizedException if user does not own the material', async () => {
      const mockMaterial = createMockMaterial();
      mockDrizzle.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([mockMaterial]),
      });

      await expect(
        service.updateMaterial('user-2', {
          id: 'material-1',
          title: 'Updated Title',
          description: 'Updated Description',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
