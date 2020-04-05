import { RabbitmqConnection } from './rabbitmq.connection';

export class RabbitmqContainer {
  private static storage = new Map<string, RabbitmqConnection>();

  static set(name: string, connection: RabbitmqConnection) {
    RabbitmqContainer.storage.set(name, connection);
  }

  static get(name: string) {
    RabbitmqContainer.storage.get(name);
  }

  static async clearAndShutdown() {
    const shutdownTasks = [];
    RabbitmqContainer.storage.forEach((connection, name) => {
      shutdownTasks.push(
        new Promise(resolve => {
          connection.close().then(resolve);
        }),
      );
    });
    RabbitmqContainer.storage.clear();
  }
}
