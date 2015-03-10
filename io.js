'use strict';

const io = require('socket.io').listen();
const winston = require('./winston');
const Immutable = require('immutable');
const {Map, List} = Immutable;
var games = Map();

io.sockets.on('connection', socket => {
  
  socket.on('start', data => {
    let token;
    const b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    token = b.toString('base64').slice(12, 32);

    // token is valid for 5 minutes
    const timeout = setTimeout(() => {
      if (games.getIn([token, 'players']).isEmpty()) {
        games = games.delete(token);
        socket.emit('token-expired');
      }
    }, 5 * 60 * 1000);

    games = games.set(token, Map({
      creator: socket,
      players: List(),
      interval: null,
      timeout: timeout
    }));

    socket.emit('created', {token: token});
  });

  socket.on('join', data => {
    const game = games.get(data.token);
    const colors = ['black', 'white'];
    let color;

    if (!game) {
      socket.emit('token-invalid');
      return;
    }

    clearTimeout(game.get('timeout'));

    if (game.get('players').size >= 2) {
      socket.emit('full');
      return;
    } else if (game.get('players').size === 1) {
      if (game.getIn(['players', 0, 'color']) === 'black')
        color = 'white';
      else
        color = 'black';

      winston.log('info', 'Number of currently running games', {
        '#': games.size
      });
    } else {
      color = colors[Math.floor(Math.random() * 2)];
    }

    // join room
    socket.join(data.token);

    games = games.updateIn([data.token, 'players'], players =>
      players.push(Map({
        id: socket.id,
        socket: socket,
        color: color,
        time: data.time - data.inc + 1,
        inc: data.inc
      })));

    game.get('creator').emit('ready');
    socket.emit('joined', {color: color});
  });

  socket.on('clock-run', data => runClock(data.color, data.token, socket));

  socket.on('new-move', data => {
    maybeEmit('move', data.move, data.token, socket);
    if (data.move.gameOver) {
      clearInterval(games.getIn([data.token, 'interval']));
    }
  });

  socket.on('resign', data => {
    if (!games.has(data.token)) return;
    clearInterval(games.getIn([data.token, 'interval']));

    io.sockets.in(data.token).emit('player-resigned', {
      color: data.color
    });
  });

  socket.on('rematch-offer', data =>
    maybeEmit('rematch-offered', {}, data.token, socket));

  socket.on('rematch-decline', data =>
    maybeEmit('rematch-declined', {}, data.token, socket));

  socket.on('rematch-confirm', data => {
    if (!games.has(data.token)) return;

    games = games.updateIn([data.token, 'players'], players =>
      players.map(player => player
        .set('time', data.time - data.inc + 1)
        .set('inc', data.inc)
        .update('color', color => color === 'black' ? 'white' : 'black')));

    io.sockets.in(data.token).emit('rematch-confirmed');
  });

  socket.on('disconnect', data => {
    let tokenToDelete;

    games.forEach((game, token) => {
      const opponent = getOpponent(token, socket);

      if (opponent) {
        opponent.get('socket').emit('opponent-disconnected');
        clearInterval(game.get('interval'));
        tokenToDelete = token;

        return false;
      }
    });

    if (tokenToDelete) {
      games = games.delete(tokenToDelete);
    }
  });

  socket.on('send-message', data =>
    maybeEmit('receive-message', data, data.token, socket));
});

function maybeEmit(event, data, token, socket) {
  if (!games.has(token)) return;

  const opponent = getOpponent(token, socket);
  if (opponent) {
    opponent.get('socket').emit(event, data);
  }
}

function runClock(color, token, socket) {
  if (!games.has(token)) return;

  games.getIn([token, 'players']).forEach((player, idx) => {
    if (player.get('socket') === socket && player.get('color') === color) {
      clearInterval(games.getIn([token, 'interval']));
      
      games = games
        .updateIn([token, 'players', idx, 'time'], time =>
          time += player.get('inc'))
        .setIn([token, 'interval'], setInterval(() => {
          let timeLeft = 0;
          games = games.updateIn([token, 'players', idx, 'time'], time => {
            timeLeft = time - 1;
            return time - 1;
          });

          if (timeLeft >= 0) {
            io.sockets.in(token).emit('countdown', {
              time: timeLeft,
              color: color
            });
          } else {
            io.sockets.in(token).emit('countdown-gameover', {
              color: color
            });
            clearInterval(games.getIn([token, 'interval']));
          }
        }, 1000));

      return false;
    }
  });
}

function getOpponent(token, socket) {
  let index = null;

  games.getIn([token, 'players']).forEach((player, idx) => {
    if (player.get('socket') === socket) {
      index = Math.abs(idx - 1);

      return false;
    }
  });

  if (index !== null) {
    return games.getIn([token, 'players', index]);
  }
}

module.exports = io;