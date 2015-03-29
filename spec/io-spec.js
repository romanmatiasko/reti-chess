const server = require('../io');
const client = require('socket.io-client');
const url = 'http://127.0.0.1:5000';
const options = {
  transports: ['websocket'],
  'force new connection': true
};

server.io.listen(5000);

var p1, p2, p3, c1, c2, games, token;

function getGames() {
  games = server.getGames();
}

describe('io', () => {
  
  it('should create new game', done => {
    p1 = client.connect(url, options);

    p1.on('connect', data => {
      p1.emit('start');
    });

    p1.on('created', data => {
      getGames();
      token = data.token;
      expect(games.has(token)).toBeTruthy();
      expect(games.getIn([token, 'players']).isEmpty()).toBeTruthy();
      expect(games.getIn([token, 'timeout'])).toBeDefined();
      done();
    });
  });

  it('should join player to the game and emit events to both of them', done => {
    p2 = client.connect(url, options);

    p2.on('connect', data => {
      p2.emit('join', {
        token: token,
        time: 10 * 60,
        inc: 5
      });
    });

    p1.on('ready', () => {
      p1.emit('join', {
        token: token,
        time: 10 * 60,
        inc: 5
      });
    });

    p1.on('joined', data => {
      c1 = data.color;
      expect(data.color === 'white' || data.color === 'black').toBeTruthy();
    });

    p2.on('joined', data => {
      c2 = data.color;
      expect(data.color === 'white' || data.color === 'black').toBeTruthy();
    });

    p1.on('both-joined', data => {
      getGames();
      var players = games.getIn([token, 'players']);
      expect(games.size).toBe(1);
      expect(players.size).toBe(2);
      expect(players.getIn([0, 'color']) !== players.getIn([1, 'color']))
        .toBeTruthy();
      expect(players.getIn([0, 'inc'])).toBe(5);
      done();
    });
  });

  it('should emit that game is full to third player', done => {
    p3 = client.connect(url, options);

    p3.on('connect', data => {
      p3.emit('join', {
        token: token,
        time: 10,
        inc: 5
      });
    });

    p3.on('full', () => {
      getGames();
      expect(games.getIn([token, 'players']).size).toBe(2);
      done();
    });
  });

  it('should run clock', done => {
    p1.emit('clock-run', {
      token: token,
      color: c1
    });

    p1.on('countdown', data => {
      expect(data.color).toBe(c1);
      expect(data.time).toBe(600);
      done();
    });
  });

  it('should make new move', done => {
    p1.emit('new-move', {
      token: token,
      color: c1,
      move: {
        from: 'd2',
        to: 'd4',
        capture: undefined,
        gameOver: false
      },
    });

    p2.on('move', data => {
      expect(data.from).toBe('d2');
      expect(data.to).toBe('d4');
      expect(data.gameOver).toBeFalsy();
      done();
    });
  });

  it('should send and receive messages', done => {
    p1.emit('send-message', {
      token: token,
      color: c1,
      message: 'hi there'
    });

    p2.on('receive-message', data => {
      expect(data.message).toBe('hi there');
      p2.emit('send-message', {
        token: token,
        color: c2,
        message: 'hello!'
      });
    });

    p1.on('receive-message', data => {
      expect(data.message).toBe('hello!');
      done();
    });
  });

  it('should resign the game', done => {
    p2.emit('resign', {
      token: token,
      color: c2
    });

    p1.on('player-resigned', data => {
      expect(data.color).toBe(c2);
      done();
    });
  });

  it('should offer rematch and decline', done => {
    p1.emit('rematch-offer', {
      token: token
    });

    p2.on('rematch-offered', () => {
      p2.emit('rematch-decline', {
        token: token
      });
    });

    p1.on('rematch-declined', () => {
      done();
    });
  });

  it('should offer rematch and accept', done => {
    p1.emit('rematch-offer', {
      token: token
    });

    p2.on('rematch-offered', () => {
      p2.emit('rematch-accept', {
        token: token,
        time: 10 * 60,
        inc: 5
      });
    });

    p1.on('rematch-accepted', () => {
      getGames();
      expect(games.getIn([token, 'players', 0, 'time'])).toBe(600 - 5 + 1);
      expect(games.getIn([token, 'players', 1, 'time'])).toBe(600 - 5 + 1);
      done();
    });
  });

  it('should disconnect player and delete game', done => {
    p2.disconnect();

    p1.on('opponent-disconnected', () => {
      getGames();
      expect(games.size).toBe(0);
      done();
    });
  });

  it('should delete game with only one player on disconnect', done => {
    p3 = client.connect(url, options);
    p3.on('connect', () => p3.emit('start'));
    p3.on('created', data => p3.emit('join', {
      token: data.token,
      time: 10 * 60,
      inc: 5
    }));

    p3.on('joined', () => {
      getGames();
      expect(games.size).toBe(1);
      p3.disconnect();
      setTimeout(() => {
        getGames();
        expect(games.size).toBe(0);
        done();
      }, 0);
    });
  });
});