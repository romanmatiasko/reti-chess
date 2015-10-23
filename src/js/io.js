import io from 'socket.io-client';


const HOST = 'http://localhost:3000';

export default io.connect(HOST);
