import { Module, OnModuleInit, OnModuleDestroy, DynamicModule, Global } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqConnectionOption, RabbitmqAsyncConnectionOption } from './rabbitmq.options';
import { getRabbitmqConnectionToken, getRabbitmqConnectionOptionsToken } from './utils';
import { rabbitmqConnectionFactory, rabbitmqConnectionAsyncFactory } from './rabbitmq.provider';
import { RabbitmqContainer } from './rabbitmq.container';
import { RabbitmqConnection } from './rabbitmq.connection';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {}

  async onModuleDestroy() {
    RabbitmqContainer.clearAndShutdown();
  }

  static register(options: RabbitmqConnectionOption): DynamicModule {
    return {
      module: RabbitmqModule,
      providers: [
        RabbitmqConnection,
        {
          provide: getRabbitmqConnectionOptionsToken(options.name),
          useValue: options,
        },
        rabbitmqConnectionFactory(options),
      ],
      exports: [getRabbitmqConnectionToken(options.name), RabbitmqConnection],
    };
  }

  static registerAsync(options: RabbitmqAsyncConnectionOption): DynamicModule {
    return {
      module: RabbitmqModule,
      imports: options.imports || [],
      providers: [
        RabbitmqConnection,
        {
          provide: getRabbitmqConnectionOptionsToken(options.name),
          inject: options['inject'],
          useFactory: options.useFactory,
        },
        rabbitmqConnectionAsyncFactory(options.name),
      ],
      exports: [getRabbitmqConnectionToken(options.name), RabbitmqConnection],
    };
  }
}
