import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserAlreadyExistException } from './exceptions/user-already-exists.exception';
import { InternalServerErrorException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should find a user by username', async () => {
      const username = 'john_doe';
      const user = new User();
      user.username = username;

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(user);

      const result = await service.findOne(username);

      expect(result).toBe(user);
      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
    });

    it('should return null if user is not found', async () => {
      const username = 'non_existing_user';

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      const result = await service.findOne(username);

      expect(result).toBeNull();
      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'new_user',
        password: 'password',
      };

      const createdUser = new User();
      Object.assign(createdUser, createUserDto);

      jest.spyOn(repository, 'save').mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toBe(createdUser);
      expect(repository.save).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw UserAlreadyExistException when user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'existing_user',
        password: 'password',
      };

      jest.spyOn(repository, 'save').mockRejectedValue({
        code: '23505', // UniqueViolation error code
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        UserAlreadyExistException,
      );
      expect(repository.save).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw InternalServerErrorException when an error occurs', async () => {
      const createUserDto: CreateUserDto = {
        username: 'new_user',
        password: 'password',
      };

      jest.spyOn(repository, 'save').mockRejectedValue(new Error());

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(repository.save).toHaveBeenCalledWith(createUserDto);
    });
  });
});
