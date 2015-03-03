var io = require('socket.io-client');
var URL = 'http://localhost:3000';
var WS = URL;

window.$socket = io.connect(WS);
window.$URL = URL;