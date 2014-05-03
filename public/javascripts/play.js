var $side  = 'w';
var $piece = null;
var $chess = new Chess();

function selectPiece(el) {
  el.addClass('selected');
}

function unselectPiece(el) {
  el.removeClass('selected');
}

function isSelected(el) {
  return el ? el.hasClass('selected') : false;
}

function movePiece(from, to, promotion, rcvd) {
  var move = $chess.move({
    'from': from,
    'to': to,
    promotion: promotion
  });

  if (move) {
    var tdFrom = $('td.' + from.toUpperCase());
    var tdTo = $('td.' + to.toUpperCase());

    //highlight moves
    if ($('td').hasClass('last-target')){
      $('td').removeClass('last-target last-origin');
    }
    tdFrom.addClass('last-origin');
    tdTo.addClass('last-target');
    
    var piece = tdFrom.find('a'); // piece being moved
    var moveSnd = $("#moveSnd")[0];
    unselectPiece(piece.parent());
    
    if (tdTo.html() !== '') { //place captured piece next to the chessboard
      $('#captured-pieces')
        .find($chess.turn() === 'b' ? '.b' : '.w')
        .append('<li>' + tdTo.find('a').html() + '</li>');
    }
    
    tdTo.html(piece);

    $piece = null;

    // en passant move
    if (move.flags === 'e'){
      var enpassant = move.to.charAt(0) + move.from.charAt(1);
      $('td.' + enpassant.toUpperCase()).html('');
    }
    
    //kingside castling
    var rook;
    if (move.flags === 'k'){
      if (move.to === 'g1'){
        rook = $('td.H1').find('a');
        $('td.F1').html(rook);
      }
      else if (move.to === 'g8'){
        rook = $('td.H8').find('a');
        $('td.F8').html(rook);
      }
    }

    //queenside castling
    if (move.flags === 'q'){
      if (move.to === 'c1'){
        rook = $('td.A1').find('a');
        $('td.D1').html(rook);
      }
      else if (move.to === 'c8'){
        rook = $('td.A8').find('a');
        $('td.D8').html(rook);
      }
    }

    //promotion
    if (move.flags === 'np' || move.flags === 'cp'){
      var square = $('td.' + move.to.toUpperCase()).find('a');
      var option = move.promotion;
      var promotion_w = {
        'q': '&#9813;',
        'r': '&#9814;',
        'n': '&#9816;',
        'b': '&#9815;'
      };
      var promotion_b = {
        'q': '&#9819;',
        'r': '&#9820;',
        'n': '&#9822;',
        'b': '&#9821;'
      };
      if (square.hasClass('white')){
        square.html(promotion_w[option]);
      } else {
        square.html(promotion_b[option]);
      }
    }
    
    if ($('#sounds').is(':checked')) {
      moveSnd.play();
    }
    
    //feedback
    var fm = $('.feedback-move');
    var fs = $('.feedback-status');

    $chess.turn() === 'b' ? fm.text('Black to move.') : fm.text('White to move.');
    fm.parent().toggleClass('blackfeedback whitefeedback');

    $chess.in_check() ? fs.text(' Check.') : fs.text('');

    //game over
    if ($chess.game_over()) {
      fm.text('');
      var result = "";

      if ($chess.in_checkmate())
        result = $chess.turn() === 'b' ? 'Checkmate. White wins!' : 'Checkmate. Black wins!'
      else if ($chess.in_draw())
        result = "Draw.";
      else if ($chess.in_stalemate())
        result = "Stalemate.";
      else if ($chess.in_threefold_repetition())
        result = "Draw. (Threefold Repetition)";
      else if ($chess.insufficient_material())
        result = "Draw. (Insufficient Material)";
      fs.text(result);
    }

    /* Add all moves to the table */
    var pgn = $chess.pgn({ max_width: 5, newline_char: ',' });
    var moves = pgn.split(',');
    var last_move = moves.pop().split('.');
    var move_number = last_move[0];
    var move_pgn = $.trim(last_move[1]);

    if (move_pgn.indexOf(' ') != -1) {
      var moves = move_pgn.split(' ');
      move_pgn = moves[1];
    }

    $('#moves tbody tr').append('<td><strong>' + move_number + '</strong>. ' + move_pgn + '</td>');

    if (rcvd === undefined) {
      $socket.emit('new-move', {
        'token': $token,
        'move': move
      });
    }

    if ($chess.game_over()) {
      $('.resign').hide();
      alert(result);
    } else {
      if ($chess.turn() === 'b') {
        $socket.emit('timer-black', {
          'token': $token
        });
      } else {
        $socket.emit('timer-white', {
          'token': $token
        });
      }
    }
  }
}

/* socket.io */
$(document).ready(function () {

  $socket.emit('join', {
    'token': $token,
    'time': $time * 60,
    'increment': $increment
  });

  $socket.on('joined', function (data) {
    if (data.color === 'white') {
      $side = 'w';
      $('.chess_board.black').remove();
      $socket.emit('timer-white', {
        'token': $token
      });
    } else {
      $side = 'b';
      $('.chess_board.white').remove();
      $('.chess_board.black').show();
    }

    $('#sendMessage').find('input').addClass($side === 'b' ? 'black' : 'white');
  });

  $socket.on('move', function (data) {
    movePiece(from=data.move.from, to=data.move.to, promotion=data.move.promotion, rcvd=true);
  });

  $socket.on('opponent-disconnected', function (data) {
    alert("Your opponent has disconnected.");
    window.location = '/';
  });

  $socket.on('opponent-resigned', function (data) {
    alert("Your opponent has resigned. You won!");
    window.location = '/';
  });

  $socket.on('full', function (data) {
    alert("This game already has two players. You have to create a new one.");
    window.location = '/';
  });

  $socket.on('receive-message', function (data) {
    var chat = $('ul#chat');
    var chat_node = $('ul#chat')[0];
    var messageSnd = $("#messageSnd")[0];

    chat.append('<li class="' + data.color + ' left" >' + data.message + '</li>');

    if (chat.is(':visible') && chat_node.scrollHeight > 300) {
      setTimeout(function() { chat_node.scrollTop = chat_node.scrollHeight; }, 50);
    } else if (!chat.is(':visible') && !$('.new-message').is(':visible')) {
      $('#bubble').before('<span class="new-message">You have a new message!</span>');
    }

    if ($('#sounds').is(':checked')) {
      messageSnd.play();
    }
  });

  $socket.on('countdown', function (data) {
    var color = data.color;
    var opp_color = color === 'black' ? 'white' : 'black';
    var min = Math.floor(data.time / 60);
    var sec = data.time % 60;
    if (sec.toString().length === 1) {
      sec = '0' + sec;
    }
    $('#clock li.' + opp_color).removeClass('ticking');
    $('#clock li.' + color).addClass('ticking').text(min + ':' + sec);
  });

  $socket.on('countdown-gameover', function (data) {
    var loser = data.color === 'black' ? 'Black' : 'White';
    var winner = data.color === 'black' ? 'White' : 'Black';
    $('.resign').hide();
    alert(loser + "'s time is out. " + winner + " won.");
    window.location = '/';
  });

});

/* gameplay */
$(document).ready(function () {

  $('#clock li').each(function() {
    $(this).text($time + ':00');
  });
  $('#game-type').text($time + '|' + $increment);

  $('.chess_board a').click(function (e) {
    var piece = $(this);
    if ((piece.hasClass('white') && $side != 'w') ||
        (piece.hasClass('black') && $side != 'b')) {
      if ($piece) {
        movePiece(
          from=$piece.parent().data('id').toLowerCase(),
          to=$(this).parent().data('id').toLowerCase(),
          promotion=$('#promotion option:selected').val()
        )
      }
    } else {
      if ($chess.turn() != $side) {
        return false;
      }

      if ($piece && isSelected($(this).parent())) {
        unselectPiece($piece.parent());
        $piece = null;
      } else {
        if ($piece) {
          unselectPiece($piece.parent());
          $piece = null;
        }
        $piece = $(this);
        selectPiece($piece.parent());
      }
    }

    e.stopImmediatePropagation();
    e.preventDefault();
  });

  $('.chess_board td').click(function (e) {
    if ($piece) {
      movePiece(
        from=$piece.parent().data('id').toLowerCase(),
        to=$(this).data('id').toLowerCase(),
        promotion=$('#promotion option:selected').val()
      )
    }
  });

  $('.resign').click(function (e) {
    $socket.emit('resign', {
      'token': $token
    });
    alert('You resigned.');
    window.location = '/';
  });

  $('a.chat').click(function (e) {
    $('#chat-wrapper').toggle();
    $('.new-message').remove();
    var chat_node = $('ul#chat')[0];
    if (chat_node.scrollHeight > 300) {
      setTimeout(function() { chat_node.scrollTop = chat_node.scrollHeight; }, 50);
    }
  });

  $('#chat-wrapper .close').click(function (e) {
    $('#chat-wrapper').hide();
  });

  $('#sendMessage').submit(function (e) {
    e.preventDefault();
    var input = $(this).find('input');
    var message = input.val();
    var color = $side === 'b' ? 'black' : 'white';

    if (!/^\W*$/.test(message)) {
      input.val('');
      $('ul#chat').append('<li class="' + color + ' right" >' + message + '</li>');

      var chat_node = $('ul#chat')[0];
      if (chat_node.scrollHeight > 300) {
        setTimeout(function() { chat_node.scrollTop = chat_node.scrollHeight; }, 50);
      }

      $socket.emit('send-message', {
        'message': message,
        'color': color,
        'token': $token
      });
    }
  });

});
