'use strict';

const io = require('socket.io-client');
const URL = 'http://localhost:3000';
const WS = URL;

module.exports = io.connect(WS);