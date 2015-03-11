'use strict';

import io from 'socket.io-client';
const ORIGIN = 'http://localhost:3000';
const WS = ORIGIN;

export default io.connect(WS);