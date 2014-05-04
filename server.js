var express = require('express')
  , path    = require('path')
  , crypto  = require('crypto')
  , http    = require('http');

var app = express();

app.configure(function() {
  app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('45710b553b5b7293753d03bd3601f70a'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/about', function(req, res) {
  res.render('about');
});

app.get('/play/:token/:time/:increment', function(req, res) {
  res.render('play', {
    'token': req.params.token,
    'time': req.params.time,
    'increment': req.params.increment
  });
});

var server = http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

var games = {};
var timer;

/**
 * Sockets
 */
var io = require('socket.io').listen(server, {log: false});

if (process.env.OPENSHIFT_NODEJS_IP) {
  io.configure(function(){
    io.set('transports', ['websocket']);
  });
}

io.sockets.on('connection', function (socket) {
  
  socket.on('start', function (data) {
    var token;
    var b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    token = b.toString('base64').slice(12, 32);

    games[token] = {
      'creator': socket,
      'players': [],
      'interval': null
    };

    socket.emit('created', {
      'token': token
    });
  });

  socket.on('join', function (data) {
    var game, color, time = data.time;

    if (!(data.token in games)) {
      return;
    }
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
    } else {
      var colors = ['black', 'white'];

      color = colors[Math.floor(Math.random() * 2)];
    }

    //join room
    socket.join(data.token);
    
    games[data.token].players.push({
      'id': socket.id,
      'socket': socket,
      'color': color,
      'time': data.time - data.increment,
      'increment': data.increment
    });

    game.creator.emit('ready', {});

    socket.emit('joined', {
      'color': color
    });
  });

  socket.on('timer-white', function (data) {
    runTimer('white', data.token, socket);
  });

  socket.on('timer-black', function (data) {
    runTimer('black', data.token, socket);
  });

  socket.on('timer-clear-interval', function (data) {
    if (data.token in games) {
      clearInterval(games[data.token].interval);
    }
  });

  socket.on('new-move', function (data) {
    var receiver, game;

    if (!(data.token in games)) {
      return;
    }

    game = games[data.token];

    if (game.players[0].id == socket.id) {
      receiver = game.players[1].socket;
    } else if (game.players[1].id == socket.id) {
      receiver = game.players[0].socket;
    } else {
      return;
    }

    receiver.emit('move', {
      'move': data.move,
    });
  });

  socket.on('resign', function (data) {
    if (data.token in games) {
      clearInterval(games[data.token].interval);
      io.sockets.in(data.token).emit('player-resigned', {
        'color': data.color
      });
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
          opponent.socket.emit('opponent-disconnected');
          clearInterval(games[token].interval);
          delete games[token];
        }
      }
    }
  });

  socket.on('send-message', function (data) {
    if (data.token in games) {
      var opponent = getOpponent(data.token, socket);
      opponent.socket.emit('receive-message', data);
    }
  });
});

function runTimer(color, token, socket) {
  var player, time_left, game = games[token];

  if (!game) return;

  for (var i in game.players) {
    player = game.players[i];

    if (player.socket === socket && player.color === color) {

      clearInterval(games[token].interval);
      games[token].players[i].time += games[token].players[i].increment + 1;

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