const amqp = require('amqplib');
const uuid = require('uuid').v4;
const JSON = require('./JSON');

function Client(options) {
  options = options || {};
  if (typeof options === 'string') {
    options = { url: options };
  }
  this.options = Object.assign({
    timeout: 30000,
  }, options);

  this.callbacks = new Map();
}

Client.prototype.connect = async function () {
  if (!this._channel) {
    const conn = await amqp.connect(this.options.url);
    conn.on('error', e => {
      this._channel = null;
      console.error('amqplib-rpc-client: ' + e);
    });
    const channel = await conn.createChannel();

    const q = await channel.assertQueue('', { exclusive: true, autoDelete: true });
    channel.consume(q.queue, (msg) => {
      var corrId = msg.properties.correlationId;
      this.callbacks.set(corrId, JSON.parse(msg.content));
    }, { noAck: true });

    this._channel = channel;
    this._queue = q.queue;
  }
  return { channel: this._channel, replyQueue: this._queue };
}

Client.prototype.call = async function (name, args) {
  const { channel, replyQueue } = await this.connect();
  const corrId = uuid();

  channel.sendToQueue(name, Buffer.from(JSON.stringify(args)), {
    correlationId: corrId,
    replyTo: replyQueue
  });

  return await this.wait(corrId);
}

Client.prototype.wait = function (corrId) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const t = setInterval(() => {
      let v = this.callbacks.get(corrId);
      if (v) {
        resolve(v);
        clearInterval(t);
        this.callbacks.delete(corrId);
      }
      if (Date.now() - start > this.options.timeout) {
        reject('timeout');
        clearInterval(t);
      }
    }, 100);
  });
}

module.exports = Client;