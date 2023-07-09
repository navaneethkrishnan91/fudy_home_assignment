import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AuthGuard } from './auth.guard';

jest.mock('./auth.guard');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let authGuard: AuthGuard;

  beforeEach(async () => {
    const mockRepository = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        AuthGuard,
      ],
      imports: [
        JwtModule.register({
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '60s' },
        }),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  describe('signIn', () => {
    it('should return the result of authService.signIn', async () => {
      const loginUserDto: LoginUserDto = {
        username: 'testuser',
        password: 'testpassword',
      };
      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);
      const signInResult = { access_token: 'some-access-token' };
      jest.spyOn(authService, 'signIn').mockResolvedValue(signInResult);

      const result = await controller.signIn(loginUserDto);

      expect(result).toEqual(signInResult);
    });
  });

  describe('getProfile', () => {
    it('should return the user from the request object', () => {
      const user = { id: 1, username: 'testuser' };
      const request = { user };
      jest.spyOn(authGuard, 'canActivate').mockResolvedValue(true);

      const result = controller.getProfile(request);

      expect(result).toEqual(user);
    });
  });
});
