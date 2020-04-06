import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { OnModuleInit, Injectable, Scope } from '@nestjs/common';
import { ConfirmChannel, Replies } from 'amqplib';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import {
  RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN,
  RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTERKEY_TOKEN,
} from './rabbitmq.constants';
import { Logger } from '@nestjs/common';
import { ExchangeOption, QueueOption } from './rabbitmq.options';
import { Options } from 'amqplib';

@Injectable()
export class RabbitmqConnection implements OnModuleInit {
  private _connection: AmqpConnectionManager;
  private _publishChannels: { [exchange: string]: ChannelWrapper } = {};
  private _logger = new Logger();
  private _hasInit = false;
  constructor(private readonly discoveryService: DiscoveryService) {}

  setConnection(connection: AmqpConnectionManager) {
    this._connection = connection;
  }

  get connection(): AmqpConnectionManager {
    return this._connection;
  }

  async onModuleInit() {
    if (!this._hasInit) {
      this._hasInit = true;
      await this.registerSubscribe();
    }
  }

  async registerSubscribe() {
    const subscribMethods = await this.discoveryService.providerMethodsWithMetaAtKey(
      RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN,
    );
    for (const method of subscribMethods) {
      const originalHandler = method.discoveredMethod.handler;

      let exchangeOption: ExchangeOption;
      const _exchangeOption: ExchangeOption | string = Reflect.getMetadata(
        RABBITMQ_SUBSCRIBE_EXCHANGE_OPTIONS_TOKEN,
        originalHandler,
      );
      exchangeOption = typeof _exchangeOption === 'string' ? { name: _exchangeOption } : _exchangeOption;
      exchangeOption.type = exchangeOption.type || 'topic';
      exchangeOption.options = exchangeOption.options || { durable: false };

      const routerKey: string = Reflect.getMetadata(RABBITMQ_SUBSCRIBE_EXCHANGE_ROUTERKEY_TOKEN, originalHandler);
      let queueOptions: QueueOption = Reflect.getMetadata(RABBITMQ_SUBSCRIBE_QUEUE_OPTIONS_TOKEN, originalHandler);
      if (!queueOptions) {
        queueOptions = {};
      }
      queueOptions.options = Object.assign({ exclusive: true }, queueOptions.options);
      const $channel = this._connection.createChannel({
        json: true,
        setup: async function(channel: ConfirmChannel) {
          const assertExchange: Replies.AssertExchange = await channel.assertExchange(
            exchangeOption.name,
            exchangeOption.type,
            exchangeOption.options,
          );
          const assertQueue: Replies.AssertQueue = await channel.assertQueue(queueOptions.name, queueOptions.options);
          await channel.bindQueue(assertQueue.queue, assertExchange.exchange, routerKey);
          await channel.consume(assertQueue.queue, message => {
            const content = JSON.parse(message.content.toString());
            originalHandler
              .call(method.discoveredMethod.parentClass.instance, content)
              .then(() => {
                channel.ack(message);
              })
              .catch(error => {
                console.error(error);
                channel.ack(message);
              });
          });
        },
      });
      await $channel.waitForConnect();
      this._logger.log(
        `Found ${method.discoveredMethod.parentClass.name}#${method.discoveredMethod.methodName} using @RabbitmqSubscribe()`,
      );
    }
  }

  async publish(
    optionOrName: ExchangeOption | string,
    routerKey: string,
    content: any,
    publishOptions?: Options.Publish,
  ) {
    let exchangeOption: ExchangeOption;
    exchangeOption = typeof optionOrName === 'string' ? { name: optionOrName } : optionOrName;
    exchangeOption.type = exchangeOption.type || 'topic';
    exchangeOption.options = exchangeOption.options || { durable: false };

    if (!this._publishChannels[exchangeOption.name]) {
      this._publishChannels[exchangeOption.name] = this._connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => [
          channel.assertExchange(exchangeOption.name, exchangeOption.type, exchangeOption.options),
        ],
      });
      await this._publishChannels[exchangeOption.name].waitForConnect();
    }
    this._publishChannels[exchangeOption.name].publish(exchangeOption.name, routerKey, content, publishOptions);
  }

  async close() {
    if (this._connection) {
      await this._connection.close();
    }
  }
}
