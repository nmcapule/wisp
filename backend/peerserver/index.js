const express = require('express');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

console.log('Starting express peer server');

const app = express();
app.use(cors());

const http = require('http');

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});

app.use('/', peerServer);

server.listen(9000);

console.log('Listening express peer server');
