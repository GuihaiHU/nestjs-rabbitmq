import { Injectable, Module, Global } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RabbitmqModule, RabbitmqSubscribe } from '../src';
import { RabbitmqConnection } from '../src/rabbitmq.connection';

describe('测试rabbitmq启动', () => {
  @Injectable()
  class RabbitMqService {
    constructor(private readonly amqpConnection: RabbitmqConnection) {}

    async sendInfo() {
      await this.amqpConnection.publish('test', 'routingKey', {
        msg: 'Hello World!',
      });
    }

    @RabbitmqSubscribe('test', 'routingKey', 'queue')
    async getInfo(info) {
      console.log(info);
    }
  }

  it('同步依赖导入-正确认证', async done => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [RabbitMqService],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    await app.close();
    done();
  }, 10000);

  it('同步依赖导入-错误认证', async done => {
    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          RabbitmqModule.register({
            urls: ['amqp://server1:errorPassword@localhost:5672?heartbeat=60'],
          }),
        ],
        providers: [RabbitMqService],
      }).compile();
      let app = module.createNestApplication();
      await app.init();
      await app.close();
      done(new Error('此处认证错误，应该报错'));
    } catch (error) {
      done();
    }
  }, 10000);

  it('异步依赖导入-正确认证', async done => {
    @Injectable()
    class ConfigService {
      get(key: string) {
        return {
          name: 'test',
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        };
      }
    }
    @Module({
      providers: [ConfigService],
      exports: [ConfigService],
    })
    class ConfigModule {}

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => config.get('rabbitmq'),
          inject: [ConfigService],
        }),
      ],
      providers: [RabbitMqService],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    await app.close();
    done();
  }, 10000);

  it('异步依赖导入-错误认证', async done => {
    @Injectable()
    class ConfigService {
      get(key: string) {
        return {
          name: 'test',
          urls: ['amqp://server:errorPwd@localhost:5672?heartbeat=60'],
        };
      }
    }
    @Module({
      providers: [ConfigService],
      exports: [ConfigService],
    })
    class ConfigModule {}

    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          RabbitmqModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => config.get('rabbitmq'),
            inject: [ConfigService],
          }),
        ],
        providers: [RabbitMqService],
      }).compile();

      const app = module.createNestApplication();
      await app.init();
      await app.close();
      done(new Error('此处认证错误，应该报错'));
    } catch (error) {
      done();
    }
  }, 10000);
});
