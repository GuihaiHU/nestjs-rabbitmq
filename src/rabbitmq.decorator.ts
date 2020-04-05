import { SetMetadata } from '@nestjs/common';
import {
  RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTERKEY_TOKEN,
} from './rabbitmq.constants';
import { ExchangeOption, QueueOption } from './rabbitmq.options';

export function RabbitmqSubscribe(
  exchangeOption: string,
  routerKey: string,
  queueOption?: QueueOption,
): MethodDecorator;
export function RabbitmqSubscribe(
  exchangeOption: ExchangeOption,
  routerKey: string,
  queueOption?: QueueOption,
): MethodDecorator;
export function RabbitmqSubscribe(
  exchangeOption: ExchangeOption | string,
  routerKey: string,
  queueOption?: QueueOption,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN, exchangeOption, descriptor.value);
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTERKEY_TOKEN, routerKey, descriptor.value);
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN, queueOption, descriptor.value);
    return descriptor;
  };
}
