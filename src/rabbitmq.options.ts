import { AmqpConnectionManagerOptions } from 'amqp-connection-manager';
import { Options } from 'amqplib';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { FactoryProvider } from '@nestjs/common';

export interface RabbitmqConnectionOption {
  name?: string;
  urls: string[];
  options?: AmqpConnectionManagerOptions;
}

export interface RabbitmqAsyncConnectionOption extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  inject?: FactoryProvider['inject'];
  useFactory: (...args: any[]) => RabbitmqConnectionOption | Promise<RabbitmqConnectionOption>;
}

export interface ExchangeOption {
  name: string;
  type?: string;
  options?: Options.AssertExchange;
}

export interface QueueOption {
  name?: string;
  options?: Options.AssertQueue;
}
