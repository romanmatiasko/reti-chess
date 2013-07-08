var express = require('express')
  , path    = require('path')
  , crypto  = require('crypto')
  , http    = require('http');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
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

app.get('/play/:token', function(req, res) {
  res.render('play', {
    'token': req.params.token
  });
});

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

var games = {};

/**
 * Sockets
 */
var io = require('socket.io').listen(server, {log: false});

io.sockets.on('connection', function (socket) {
  socket.on('start', function (data) {
    var token;

    var b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    token = b.toString('base64').slice(12, 32);

    games[token] = {
      'creator': socket,
      'players': []
    };

    socket.emit('created', {
      'token': token
    });
  });

  socket.on('join', function (data) {
    var game, color;

    if (!(data.token in games)) {
      return;
    }

    game = games[data.token];

    if (game.players.length >= 2) {
      socket.emit('full');
      return;
    } else if (game.players.length == 1) {
      if (game.players[0].color == 'black') {
        color = 'white';
      } else {
        color = 'black';
      }
    } else {
      var colors = ['black', 'white'];

      color = colors[Math.floor(Math.random() * 2)];
    }

    games[data.token].players.push({
      'id': socket.id,
      'socket': socket,
      'color': color
    });

    game.creator.emit('ready', {});

    socket.emit('joined', {
      'color': color
    });
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

  socket.on('disconnect', function () {
    for (token in games) {
      var game = games[token];

      for (j in game.players) {
        var player = game.players[j];

        if (player.socket == socket) {
          var opponent = game.players[Math.abs(j - 1)];

          delete games[token];
          opponent.socket.emit('opponent-disconnected');
        }
      }
    }
  });
});
