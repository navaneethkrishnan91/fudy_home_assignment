import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let executionContext: ExecutionContext;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({ userId: 1 }) as any,
    } as any;
    executionContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockImplementation(() => ({
        headers: {},
      })),
    } as any;
    authGuard = new AuthGuard(jwtService);
  });

  describe('canActivate', () => {
    it('should return true and assign user payload to the request object', async () => {
      const request = { headers: { authorization: 'Bearer token' } };
      executionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      });

      const result = await authGuard.canActivate(executionContext);

      expect(result).toBe(true);
      expect(request['user']).toEqual({ userId: 1 });
    });

    it('should throw an UnauthorizedException if token is missing', async () => {
      await expect(authGuard.canActivate(executionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an UnauthorizedException if token verification fails', async () => {
      const request = { headers: { authorization: 'Bearer invalid-token' } };
      executionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      });
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token verification failed'));

      await expect(authGuard.canActivate(executionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
