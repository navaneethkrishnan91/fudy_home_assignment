import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { User } from '../src/users/user.entity';
import { Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NODE_ENV } from '../src/app.constant';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let createdUser: User;
  let access_token: string;

  const user: CreateUserDto = {
    username: 'tim',
    password: 'abcd',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('POSTGRES_HOST'),
            port: configService.get('POSTGRES_PORT'),
            username: configService.get('POSTGRES_USER'),
            password: configService.get('POSTGRES_PASSWORD'),
            database: configService.get('POSTGRES_DB'),
            entities: [User],
            synchronize: configService.get('NODE_ENV') === NODE_ENV.DEVELOPMENT,
            logging: configService.get('NODE_ENV') === NODE_ENV.DEVELOPMENT,
          }),
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    userRepository = moduleFixture.get<Repository<User>>('UserRepository');
  });

  afterAll(async () => {
    // Remove any test data from the database
    await userRepository.clear();
    await app.close();
  });

  describe('POST /user', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send(user)
        .set('Accept', 'application/json')
        .expect(201);

      createdUser = response.body;

      expect(createdUser.username).toEqual(user.username);
      expect(createdUser.password).toEqual(user.password);
    });
  });

  describe('Login and Profile', () => {
    it('should login the user and return access_token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .set('Accept', 'application/json')
        .expect(200);

      access_token = response.body.access_token;

      expect(response.body).toHaveProperty('access_token');
    });

    it('should get the the user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(response.body.username).toEqual(user.username);
    });
  });
});
