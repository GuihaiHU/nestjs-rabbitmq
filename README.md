# 快速开始

该模块是对`amqplib`的封装，方便在`nestjs`快速使用`rabbitmq`的`topic`模式

### 安装

`npm i @sevenfifteen/nestjs-rabbitmq`

### 在 app.module 中引入

```typescript
import { RabbitmqModule } from '@sevenfifteen/nestjs-rabbitmq';
@Module({
  imports: [
    RabbitmqModule.register({
      urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
    }),
  ],
})
export class AppModule {}
```

### 消费者监听消息

```typescript
import { RabbitmqSubscribe } from '@sevenfifteen/nestjs-rabbitmq';
@Injectable()
class TestConsumer {
  @RabbitmqSubscribe('exchangeName', 'routingKey', 'queueName')
  async getInfo(info: any) {
    console.log(`this is the info from producer ${info}`);
  }
}
```

### 生产者发布消息

```typescript
import { RabbitmqConnection } from '@sevenfifteen/nestjs-rabbitmq';
@Injectable()
class ProducerService {
  constructor(private readonly amqpConnection: RabbitmqConnection) {}
  async sendInfo() {
    await this.amqpConnection.publish('test', 'routingKey', { test: 'hello' });
  }
}
```

# API

## 导入依赖

@sevenfifteen/nestjs-rabbitmq 采用全局导入，这样子用户不需要在各个 module 中再次导入该 module。它拥有同步导入和异步导入两种模式。

### 同步导入模式

函数`RabbitmqModule.register(options: RabbitmqConnectionOption):DynamicModule`,

|                参数名                | 必填 |                 描述                 |
| :----------------------------------: | :--: | :----------------------------------: |
|             options.name             |  N   |         rabbitmq 连接的名字          |
|             options.urls             |  Y   |       rabbitmq 的链接 url 数组       |
| options.AmqpConnectionManagerOptions |  N   | amqp 的 AmqpConnectionManagerOptions |

例如:

```typescript
@Module({
  imports: [
    RabbitmqModule.register({
      urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
    }),
  ],
})
export class AppModule {}
```

### 异步导入

函数`registerAsync(options: RabbitmqAsyncConnectionOption): DynamicModule`
| 参数名 | 必填 | 描述 |
| :----------------------------------: |:--:|:----------------------------------: |
| options.name | N |rabbitmq 连接的名字 |
| options.useFactory | Y | 返回`RabbitmqConnectionOption`的函数 |
| options.inject | N | useFactory 的依赖注入 |

例如

```typescript
@Injectable()
class ConfigService {
  get(key: string) {
    return {
      name: 'test',
      urls: ['amqp://server:123456@localhost:5672?heartbeat=60'],
    };
  }
}

@Module({
  imports: [
    RabbitmqModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('rabbitmq'),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## 消息订阅

本模块通过`RabbitmqSubscribe(exchangeOption: string|ExchangeOption, routingKey: string, queueOption?: string|QueueOption)`轻松实现消息订阅， 默认只有一个消费者受到消息
| 参数名 | 类型| 描述 |
| :----------------------------------: | :--: |:----------------------------------: |
| exchangeOption | string| exchange 名字 |
| exchangeOption.name | string | exchange 名字 |
| exchangeOption.type | string | exchange 类型，默认采用 topic 模式 |
| exchangeOption.options | object | amqplib Options.AssertExchange |
| routingKey | string | 路由名字 |
| queueOption | string | 队列名字 |
| queueOption.name | string | 列队名字，为空默认是 exchangeOption.name+routingKey |
| queueOption.options | object | amqplib Options.AssertQueue|

例如

```typescript
@Injectable()
class TestConsumer {
  @RabbitmqSubscribe('exchangeName', 'routingKey', 'queueName')
  async getInfo(info: any) {
    console.log(`this is the info from producer ${info}`);
  }
}
```

## 消息发布

由于`rabbitmqModule`已经全局引入了，所以消息发布只需要注入`RabbitmqConnection`依赖即可, 例如：

```typescript
@Injectable()
class ProducerService {
  constructor(private readonly amqpConnection: RabbitmqConnection) {}
  async sendInfo() {
    await this.amqpConnection.publish('test', 'routingKey', { test: 'hello' });
  }
}
```

`RabbitmqConnection.publish`
| 参数名 | 类型|描述 |
| :--------------------------:|:--------: | :----------------------------------: |
| optionOrName | string| exchange 名字 |
| exchangeOption.name | string | exchange 名字 |
| exchangeOption.type | string | exchange 类型，默认采用 topic 模式 |
| exchangeOption.options | object | amqplib Options.AssertExchange |
| routingKey | string | 路由名字 |
| content | any | 任意类型，`RabbitmqConnection`会用 JSON.stringify 转化为字符串 |
| publishOptions | object | amqplib Options.Publish|
