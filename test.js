const { Server, Client } = require('./index');

const config = {
  url: "amqp://guest:guest@localhost",
};

const server = new Server(config);
const client = new Client(config);

server.on('calc', async (a, b) => {
  return a + b;
});

setInterval(() => {
  console.log(server.ready);

  client.call('calc', [1, 2]).then(sum => {
    console.log(sum);
  }).catch(e => {
    console.error(e);
  });
}, 3000);
