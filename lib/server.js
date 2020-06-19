const amqp = require('amqplib');
const JSON = require('./JSON');

function Server(options) {
  options = options || {};
  if (typeof options === 'string') {
    options = { url: options };
  }
  this.options = options;

  this.handles = new Map();

  setImmediate(this.prepare.bind(this));
}

Server.prototype.prepare = async function () {
  try {
    this._conn = await amqp.connect(this.options.url);
    this._conn.on('error', e => {
      console.error('amqplib-rpc-server: ' + e);
      console.info('waiting for 3 seconds to try again');
      setTimeout(this.prepare.bind(this), 3000);
    });
    const ch = await this._conn.createChannel();

    this.handles.forEach(async (handler, name) => {
      await ch.assertQueue(name, {
        durable: true,
        autoDelete: true,
      });
      ch.consume(name, async function (msg) {
        let args = JSON.parse(msg.content);
        let result = await handler.apply(null, args);
        ch.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(result)), {
          correlationId: msg.properties.correlationId
        });
        ch.ack(msg);
      });
    });
  } catch (e) {
    console.error('amqplib-rpc-server: ' + e);
    console.info('waiting for 3 seconds to try again');
    setTimeout(this.prepare.bind(this), 3000);
  }
}

Server.prototype.close = async function () {
  if (this._conn) return await this._conn.close();
};

Server.prototype.on = function (name, handle) {
  this.handles.set(name, handle);
}

module.exports = Server;