import { getRabbitmqConnectionToken, getRabbitmqConnectionOptionsToken } from './utils';
import { connect, AmqpConnectionManager } from 'amqp-connection-manager';
import { FactoryProvider } from '@nestjs/common';
import { RabbitmqConnection } from './rabbitmq.connection';
import { RabbitmqConnectionOption } from './rabbitmq.options';
import { RabbitmqContainer } from './rabbitmq.container';

function checkConnection(connection: AmqpConnectionManager) {
  let hasConnect = false;
  connection.on('connect', () => {
    hasConnect = true;
  });
  setTimeout(() => {
    if (!hasConnect) {
      throw new Error('Rabbitmq not connect in 5 seconds. Please Check your connection options');
    }
  }, 5000);
}

export type ConnectionFactoryProvider = FactoryProvider<RabbitmqConnection | Promise<RabbitmqConnection>>;
export function rabbitmqConnectionFactory(connectionOptions: RabbitmqConnectionOption): ConnectionFactoryProvider {
  return {
    provide: getRabbitmqConnectionToken(connectionOptions.name),
    useFactory: async (rabbitmqConnection: RabbitmqConnection): Promise<RabbitmqConnection> => {
      return new Promise((resolve, reject) => {
        let hasConnect = false;
        const _rabbitmqConnection = connect(connectionOptions.urls, connectionOptions.options);
        _rabbitmqConnection.on('connect', () => {
          hasConnect = true;
        });
        rabbitmqConnection.setConnection(_rabbitmqConnection);
        RabbitmqContainer.set(connectionOptions.name, rabbitmqConnection);
        let _intercal = setInterval(() => {
          if (hasConnect) {
            resolve(rabbitmqConnection);
            clearInterval(_intercal);
          }
        }, 500);
        setTimeout(() => {
          if (!hasConnect) {
            reject('Rabbitmq not connect in 5 seconds. Please Check your connection options');
          }
        }, 5000);
      });
    },
    inject: [RabbitmqConnection],
  };
}

export function rabbitmqConnectionAsyncFactory(name: string): ConnectionFactoryProvider {
  return {
    provide: getRabbitmqConnectionToken(name),
    useFactory: async (
      rabbitmqConnection: RabbitmqConnection,
      connectionOptions: RabbitmqConnectionOption,
    ): Promise<RabbitmqConnection> => {
      return new Promise((resolve, reject) => {
        let hasConnect = false;
        const _rabbitmqConnection = connect(connectionOptions.urls, connectionOptions.options);
        _rabbitmqConnection.on('connect', () => {
          hasConnect = true;
        });
        rabbitmqConnection.setConnection(_rabbitmqConnection);
        RabbitmqContainer.set(connectionOptions.name, rabbitmqConnection);
        let _intercal = setInterval(() => {
          if (hasConnect) {
            resolve(rabbitmqConnection);
            clearInterval(_intercal);
          }
        }, 500);
        setTimeout(() => {
          if (!hasConnect) {
            clearInterval(_intercal);
            reject('Rabbitmq not connect in 5 seconds. Please Check your connection options');
          }
        }, 5000);
      });
    },
    inject: [RabbitmqConnection, getRabbitmqConnectionOptionsToken(name)],
  };
}
