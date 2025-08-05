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
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
        role: 'user',
      });
      await controller.register(mockRegisterDto, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'jwt',
        'mockedRefreshToken',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000,
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
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
        role: 'user',
      });
      await controller.register(mockRegisterDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 1,
        email: mockRegisterDto.email,
        firstName: mockRegisterDto.firstName,
        role: 'user',
        accessToken: 'mockedAccessToken',
        message: 'User created successfully',
      });
    });
  });
  describe('login', () => {
    it('should log in a user and set a cookie', async () => {
      const mockLoginDto = {
        email: 'test@gmail.com',
        password: 'password123',
      };
      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      mockAuthService.login.mockResolvedValueOnce({
        ...mockLoginDto,
        id: 1,
        accessToken: 'mockedAccessToken',
        refreshToken: 'mockedRefreshToken',
        role: 'user',
      });
      await controller.login(mockLoginDto, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'jwt',
        'mockedRefreshToken',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        },
      );
    });
    it('should return user details after login', async () => {
      const mockLoginDto = {
        email: 'test@gmail.com',
        password: 'password123',
      };
      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      mockAuthService.login.mockResolvedValueOnce({
        ...mockLoginDto,
        id: 1,
        firstName: 'Test',
        accessToken: 'mockedAccessToken',
        role: 'user',
      });
      await controller.login(mockLoginDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 1,
        email: mockLoginDto.email,
        firstName: 'Test',
        accessToken: 'mockedAccessToken',
        role: 'user',
        message: 'User logged in successfully',
      });
    });
  });
  describe('logout', () => {
    it('should log out a user and clear the cookie', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.logout(mockResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    });
    it('should return a success message after logout', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.logout(mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'User logged out successfully',
      });
    });
  });
});
