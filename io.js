'use strict';

/**
 * Socket.IO
 */

var io = require('socket.io').listen();
var winston = require('./winston');
var games = {};
var timer;

io.sockets.on('connection', function (socket) {
  
  socket.on('start', function (data) {
    var token;
    var b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    token = b.toString('base64').slice(12, 32);

    // token is valid for 5 minutes
    var timeout = setTimeout(function () {
      if (games[token].players.length === 0) {
        delete games[token];
        socket.emit('token-expired');
      }
    }, 5 * 60 * 1000);

    games[token] = {
      'creator': socket,
      'players': [],
      'interval': null,
      'timeout': timeout
    };

    socket.emit('created', {
      'token': token
    });
  });

  socket.on('join', function (data) {
    var game, color, time = data.time;

    if (!(data.token in games)) {
      socket.emit('token-invalid');
      return;
    }

    clearTimeout(games[data.token].timeout);
    game = games[data.token];

    if (game.players.length >= 2) {
      socket.emit('full');
      return;
    } else if (game.players.length === 1) {
      if (game.players[0].color === 'black') {
        color = 'white';
      } else {
        color = 'black';
      }
      winston.log('info', 'Number of currently running games', { '#': Object.keys(games).length });
    } else {
      var colors = ['black', 'white'];

      color = colors[Math.floor(Math.random() * 2)];
    }

    // join room
    socket.join(data.token);

    games[data.token].players.push({
      'id': socket.id,
      'socket': socket,
      'color': color,
      'time': data.time - data.inc + 1,
      'inc': data.inc
    });

    game.creator.emit('ready', {});

    socket.emit('joined', {
      'color': color
    });
  });

  socket.on('clock-run', function (data) {
    runClock(data.color, data.token, socket);
  });

  socket.on('new-move', function (data) {
    var opponent;

    if (data.token in games) {
      opponent = getOpponent(data.token, socket);
      if (opponent) {
        opponent.socket.emit('move', data.move);
      }
      if (data.move.gameOver) {
        clearInterval(games[data.token].interval);
      }
    }
  });

  socket.on('resign', function (data) {
    if (data.token in games) {
      clearInterval(games[data.token].interval);
      io.sockets.in(data.token).emit('player-resigned', {
        'color': data.color
      });
    }
  });

  socket.on('rematch-offer', function (data) {
    var opponent;
    
    if (data.token in games) {
      opponent = getOpponent(data.token, socket);
      if (opponent) {
        opponent.socket.emit('rematch-offered');
      }
    }
  });

  socket.on('rematch-decline', function (data) {
    var opponent;

    if (data.token in games) {
      opponent = getOpponent(data.token, socket);
      if (opponent) {
        opponent.socket.emit('rematch-declined');
      }
    }
  });

  socket.on('rematch-confirm', function (data) {
    var opponent;

    if (data.token in games) {

      for(var j in games[data.token].players) {
        games[data.token].players[j].time = data.time - data.inc + 1;
        games[data.token].players[j].inc = data.inc;
        games[data.token].players[j].color = games[data.token].players[j].color === 'black' ? 'white' : 'black';
      }

      opponent = getOpponent(data.token, socket);
      if (opponent) {
        io.sockets.in(data.token).emit('rematch-confirmed');
      }
    }
  });

  socket.on('disconnect', function (data) {
    var player, opponent, game;
    for (var token in games) {
    game = games[token];

      for (var j in game.players) {
        player = game.players[j];

        if (player.socket === socket) {
          opponent = game.players[Math.abs(j - 1)];
          if (opponent) {
            opponent.socket.emit('opponent-disconnected');
          }
          clearInterval(games[token].interval);
          delete games[token];
        }
      }
    }
  });

  socket.on('send-message', function (data) {
    if (data.token in games) {
      var opponent = getOpponent(data.token, socket);
      if (opponent) {
        opponent.socket.emit('receive-message', data);
      }
    }
  });
});

function runClock(color, token, socket) {
  var player, time_left, game = games[token];

  if (!game) return;

  for (var i in game.players) {
    player = game.players[i];
    if (player.socket === socket && player.color === color) {
      clearInterval(games[token].interval);
      games[token].players[i].time += games[token].players[i].inc;

      return games[token].interval = setInterval(function() {
        games[token].players[i].time -= 1;
        time_left = games[token].players[i].time;

        if (time_left >= 0) {
          io.sockets.in(token).emit('countdown', {
            'time': time_left,
            'color': color
          });
        } else {
          io.sockets.in(token).emit('countdown-gameover', {
            'color': color
          });
          clearInterval(games[token].interval);
        }
      }, 1000);
    }
  }
}

function getOpponent(token, socket) {
  var player, game = games[token];

  for (var j in game.players) {
    player = game.players[j];

    if (player.socket === socket) {
      var opponent = game.players[Math.abs(j - 1)];

      return opponent;
    }
  }
}

module.exports = io;