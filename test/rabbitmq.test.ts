import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RabbitmqModule } from '@app/nestjs-rabbitmq';

describe('测试rabbitmq', () => {
  it('模块导入', async done => {
    @Injectable()
    class TestService {}

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RabbitmqModule.register({
          urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
        }),
      ],
      providers: [TestService],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    await app.close();
    done();
  });
});
