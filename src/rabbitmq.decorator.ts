import { SetMetadata } from '@nestjs/common';
import {
  RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTINGKEY_TOKEN,
} from './rabbitmq.constants';
import { ExchangeOption, QueueOption } from './rabbitmq.options';

export function RabbitmqSubscribe(
  exchangeOption: string,
  routingKey: string,
  queueOption?: QueueOption,
): MethodDecorator;
export function RabbitmqSubscribe(
  exchangeOption: ExchangeOption,
  routingKey: string,
  queueOption?: QueueOption,
): MethodDecorator;
export function RabbitmqSubscribe(exchangeOption: string, routingKey: string, queueOption?: string): MethodDecorator;
export function RabbitmqSubscribe(
  exchangeOption: ExchangeOption,
  routingKey: string,
  queueOption?: string,
): MethodDecorator;
export function RabbitmqSubscribe(
  exchangeOption: ExchangeOption | string,
  routingKey: string,
  queueOption?: QueueOption | string,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN, exchangeOption, descriptor.value);
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTINGKEY_TOKEN, routingKey, descriptor.value);
    Reflect.defineMetadata(RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN, queueOption, descriptor.value);
    return descriptor;
  };
}
