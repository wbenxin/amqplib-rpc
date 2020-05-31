# amqplib-rpc

基于```amqplib```实现的RPC服务. 具有以下特点:

* 基于```replyTo```和```correlationId```机制
* 服务端断线自动重连
* 客户端调用支持超时
* RabbitMQ

## 安装

```
npm i @wbenxin/amqplib-rpc
```

## 使用

### Server

```
const {Server} = require('@wbenxin/amqplib-rpc');

const server = new Server(config);
server.on('calc', async (a, b)=>{
  return a+b;
});
```

```config```的内容如下:
```
{
  url: 'string'
}
```

### Client

```
const {Client} = require('@wbenxin/amqplib-rpc');

const client = new Client(config);
client.call('calc', [1,2]).then(sum => {
  console.log(sum);
}).catch(e => {
  console.error(e);
});
```

```config```的内容如下:

```
{
  url: 'string',
  timeout: int,   // 可选. 默认30秒
}
```