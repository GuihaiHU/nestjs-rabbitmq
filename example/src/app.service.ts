import { Injectable } from '@nestjs/common';
import { RabbitmqConnection, RabbitmqSubscribe } from '@sevenfifteen/nestjs-rabbitmq'

@Injectable()
export class AppService {
  constructor(private readonly amqpConnection: RabbitmqConnection) {}

  async sendInfo() {
    await this.amqpConnection.publish('test', 'routingKey', { test: 'hello' });
  }

  getHello(): string {
    return 'Hello World!';
  }
 
  
  @RabbitmqSubscribe('exchangeName', 'routingKey', 'queueName')
  async getInfo(info: any) {
    console.log(`this is the info from producer ${info}`);
  }
}
