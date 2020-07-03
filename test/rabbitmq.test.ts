import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RabbitmqModule, RabbitmqSubscribe } from '../src';
import { RabbitmqConnection } from '../src/rabbitmq.connection';

describe('测试rabbitmq启动', () => {
  @Injectable()
  class SingleQueueRabbitMqService {
    info = { test: 'hello' };
    result = { isReceive: false, data: null };
    constructor(private readonly amqpConnection: RabbitmqConnection) {}

    async sendInfo() {
      await this.amqpConnection.publish('test', 'routingKey', this.info);
      return new Promise((resolve, reject) => {
        let _i = setInterval(() => {
          if (this.result.isReceive) {
            expect(this.result.data).toEqual(this.info);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          if (!this.result.isReceive) {
            clearInterval(_i);
            reject('消费者没有收到消息');
          }
        }, 2000);
      });
    }

    @RabbitmqSubscribe('test', 'routingKey', 'queue')
    async getInfo(info: any) {
      this.result.data = info;
      this.result.isReceive = true;
    }
  }

  @Injectable()
  class MultiQueueRabbitMqService {
    info = { test: 'hello' };
    result = { isReceive1: false, data1: null, isReceive2: false, data2: null };
    constructor(private readonly amqpConnection: RabbitmqConnection) {}

    async sendInfo() {
      await this.amqpConnection.publish('test', 'routingKey', this.info);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!this.result.isReceive1 && !this.result.isReceive2) {
            reject('消费者没有收到消息');
          } else {
            expect(Object.assign({}, this.result.data1, this.result.data2)).not.toEqual({});
            if (!this.result.data1 && this.result.data2) {
              expect(this.result.data2).toEqual(this.info);
            } else if (!this.result.data2 && this.result.data1) {
              expect(this.result.data1).toEqual(this.info);
            } else {
              reject('消费者没有收到消息');
            }
            resolve();
          }
        }, 2000);
      });
    }

    @RabbitmqSubscribe('test', 'routingKey', 'queue')
    async getInfo1(info: any) {
      this.result.data1 = info;
      this.result.isReceive1 = true;
    }

    @RabbitmqSubscribe('test', 'routingKey', 'queue')
    async getInfo2(info: any) {
      this.result.data2 = info;
      this.result.isReceive2 = true;
    }
  }

  @Injectable()
  class UnnamedQueueRabbitMqService {
    info = { test: 'hello' };
    result = { isReceive1: false, data1: null, isReceive2: false, data2: null };
    constructor(private readonly amqpConnection: RabbitmqConnection) {}

    async sendInfo() {
      await this.amqpConnection.publish('test', 'UnnamedQueueRabbitMqService', this.info);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!this.result.isReceive1 && !this.result.isReceive2) {
            reject('消费者没有收到消息');
          } else {
            expect(Object.assign({}, this.result.data1, this.result.data2)).not.toEqual({});
            if (!this.result.data1 && this.result.data2) {
              expect(this.result.data2).toEqual(this.info);
            } else if (!this.result.data2 && this.result.data1) {
              expect(this.result.data1).toEqual(this.info);
            } else {
              reject('消费者没有收到消息');
            }
            resolve();
          }
        }, 2000);
      });
    }

    @RabbitmqSubscribe('test', 'UnnamedQueueRabbitMqService')
    async getInfo1(info: any) {
      this.result.data1 = info;
      this.result.isReceive1 = true;
    }

    @RabbitmqSubscribe('test', 'UnnamedQueueRabbitMqService')
    async getInfo2(info: any) {
      this.result.data2 = info;
      this.result.isReceive2 = true;
    }
  }

  it('同步依赖导入-正确认证', async done => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [SingleQueueRabbitMqService],
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
        providers: [SingleQueueRabbitMqService],
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
      providers: [SingleQueueRabbitMqService],
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
        providers: [SingleQueueRabbitMqService],
      }).compile();

      const app = module.createNestApplication();
      await app.init();
      await app.close();
      done(new Error('此处认证错误，应该报错'));
    } catch (error) {
      done();
    }
  }, 10000);

  it('消息获取-具名队列-单消费者', async done => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [SingleQueueRabbitMqService],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    const rabbitmqService = module.get<SingleQueueRabbitMqService>(SingleQueueRabbitMqService);
    await rabbitmqService.sendInfo();
    await app.close();
    done();
  });

  it('消息获取-具名队列-多消费者', async done => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [MultiQueueRabbitMqService],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    const rabbitmqService = module.get<MultiQueueRabbitMqService>(MultiQueueRabbitMqService);
    await rabbitmqService.sendInfo();
    await app.close();
    done();
  });

  it('消息获取-匿名队列', async done => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [UnnamedQueueRabbitMqService],
    }).compile();

    const app = module.createNestApplication();
    await app.init();
    const rabbitmqService = module.get<UnnamedQueueRabbitMqService>(UnnamedQueueRabbitMqService);
    await rabbitmqService.sendInfo();
    await app.close();
    done();
  });
});
