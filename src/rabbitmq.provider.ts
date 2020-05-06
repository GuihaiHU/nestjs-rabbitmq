import { getRabbitmqConnectionToken, getRabbitmqConnectionOptionsToken } from './utils';
import { connect } from 'amqp-connection-manager';
import { FactoryProvider } from '@nestjs/common';
import { RabbitmqConnection } from './rabbitmq.connection';
import { RabbitmqConnectionOption } from './rabbitmq.options';
import { RabbitmqContainer } from './rabbitmq.container';

export type ConnectionFactoryProvider = FactoryProvider<RabbitmqConnection | Promise<RabbitmqConnection>>;
export function rabbitmqConnectionFactory(connectionOptions: RabbitmqConnectionOption): ConnectionFactoryProvider {
  return {
    provide: getRabbitmqConnectionToken(connectionOptions.name),
    useFactory: async (rabbitmqConnection: RabbitmqConnection): Promise<RabbitmqConnection> => {
      let hasConnect = false
      const connection = connect(connectionOptions.urls, connectionOptions.options);
      connection.on('connect', () => {
        hasConnect = true
      });
      setTimeout(() => {
        if (!hasConnect) {
          throw new Error('Rabbitmq not connect in 5 seconds. Please Check')
        }
      }, 5000);
      rabbitmqConnection.setConnection(connection);
      RabbitmqContainer.set(connectionOptions.name, rabbitmqConnection);
      return rabbitmqConnection;
    },
    inject: [RabbitmqConnection],
  };
}

// export function rabbitmqConnectionAsyncFactory(name: string): ConnectionFactoryProvider {
//   return {
//     provide: getRabbitmqConnectionToken(name),
//     useFactory: async (rabbitmqConnection: RabbitmqConnection, connectionOptions: RabbitmqConnectionOption): Promise<RabbitmqConnection> => {
//       const connection = connect(connectionOptions.urls, connectionOptions.options);
//       rabbitmqConnection.setConnection(connection);
//       RabbitmqContainer.set(connectionOptions.name, rabbitmqConnection);
//       return rabbitmqConnection;
//     },
//     inject: [RabbitmqConnection, getRabbitmqConnectionOptionsToken(name)],
//   };
// }
