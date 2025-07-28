import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and set a cookie', async () => {
      const mockRegisterDto = {
        email: 'test@gmail.com',
        password: 'password123',
        firstName: 'Test',
      };
      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      mockAuthService.register.mockResolvedValueOnce({
        ...mockRegisterDto,
        id: 1,
        access_token: 'mockedAccessToken',
        role: 'user',
      });
      await controller.register(mockRegisterDto, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'jwt',
        'mockedAccessToken',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000,
        },
      );
    });
    it('should return user details after registration', async () => {
      const mockRegisterDto = {
        email: 'test@gmail.com',
        password: 'password123',
        firstName: 'Test',
      };
      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      mockAuthService.register.mockResolvedValueOnce({
        ...mockRegisterDto,
        id: 1,
        access_token: 'mockedAccessToken',
        role: 'user',
      });
      await controller.register(mockRegisterDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 1,
        email: mockRegisterDto.email,
        firstName: mockRegisterDto.firstName,
        role: 'user',
        message: 'User created successfully',
      });
    });
  });
  describe('login', () => {
    it.todo('should log in a user and set a cookie');
    it.todo('should return user details after login');
  });
  describe('logout', () => {
    it.todo('should log out a user and clear the cookie');
    it.todo('should return a success message after logout');
  });
});
