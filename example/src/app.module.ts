import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitmqModule } from '@sevenfifteen/nestjs-rabbitmq'

@Module({
  imports: [RabbitmqModule.register({urls: ['amqp://server:123456@localhost:5672?heartbeat=60']})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
