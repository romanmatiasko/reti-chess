$(function() {

  var from, to, promotion, rcvd;
  var $side  = 'w';
  var $piece = null;
  var $chess = new Chess();
  var $gameOver = false;
  var $chessboardWhite = $('.chess_board.white').clone();
  var $chessboardBlack = $('.chess_board.black').clone();

  function modalKeydownHandler(e) {
    e.preventDefault();
    if (e.which === 13 || e.which === 27) {
      hideModal();
    }
  }

  function offerKeydownHandler(e) {
    e.preventDefault();
    if (e.which === 13) {
      hideOffer();
      e.data.accept();
    } else if (e.which === 27) {
      hideOffer();
      e.data.decline(); 
    }
  }

  function showModal(message) {
    $('#modal-message').text(message);
    $('#modal-mask').fadeIn(200);
    $(document).on('keyup', modalKeydownHandler);
  }

  function hideModal() {
    $('#modal-mask').fadeOut(200);
    $(document).off('keyup', modalKeydownHandler);
  }

  function showOffer(offer, options) {
    $('#offer-message').text(offer);
    $('#offer-mask').fadeIn(200);
    $(document).on('keyup', options, offerKeydownHandler);
  }

  function hideOffer() {
    $('#offer-mask').fadeOut(200);
    $(document).off('keyup', offerKeydownHandler);
  }

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

    if (move && !$gameOver) {
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

      if (move_pgn.indexOf(' ') !== -1) {
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
        $gameOver = true;
        $socket.emit('timer-clear-interval', {
          'token': $token
        });

        $('.resign').hide();
        $('.rematch').show();
        showModal(result);
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

  function rematchAccepted() {
    $socket.emit('rematch-confirm', {
      'token': $token,
      'time': $time * 60,
      'increment': $increment
    });
  }

  function rematchDeclined() {
    $socket.emit('rematch-decline', {
      'token': $token
    });
  }

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
    $('.resign').off().remove();
    $('.chess_board a').off('click', movePieceFromHandler);
    $('.chess_board td').off('click', movePieceToHandler);

    $('#sendMessage').off();
    $('#sendMessage').submit(function (e) {
      e.preventDefault();
      showModal("Your opponent has disconnected. You can't send messages.");
    });
    $('.rematch').off();
    $('.rematch').click(function (e) {
      e.preventDefault();
      showModal('Your opponent has disconnected. You need to generate a new link.');
    })

    if (!$gameOver) {
      showModal("Your opponent has disconnected.");
    }
  });

  $socket.on('player-resigned', function (data) {
    $gameOver = true;
    $('.resign').hide();
    $('.rematch').show();
    $('.chess_board a').off('click', movePieceFromHandler);
    $('.chess_board td').off('click', movePieceToHandler);
    var winner = data.color === 'w' ? 'Black' : 'White';
    var loser = data.color === 'w' ? 'White' : 'Black';
    var message = loser + ' resigned. ' + winner + ' wins.';
    showModal(message);
    $('.feedback-move').text('');
    $('.feedback-status').text(message);
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
    $gameOver = true;
    $('.chess_board a').off('click', movePieceFromHandler);
    $('.chess_board td').off('click', movePieceToHandler);
    var loser = data.color === 'black' ? 'Black' : 'White';
    var winner = data.color === 'black' ? 'White' : 'Black';
    var message = loser + "'s time is out. " + winner + " wins.";
    $('.resign').hide();
    $('.rematch').show();
    showModal(message);
    $('.feedback-move').text('');
    $('.feedback-status').text(message);
  });

  $socket.on('rematch-offered', function (data) {
    hideModal();
    showOffer('Your opponent sent you a rematch offer.', {
      accept: rematchAccepted,
      decline: rematchDeclined
    });
  });

  $socket.on('rematch-declined', function (data) {
    showModal('Rematch offer was declined.');
  });

  $socket.on('rematch-confirmed', function (data) {
    hideModal();
    $side = $side === 'w' ? 'b' : 'w'; //swap sides
    $piece = null;
    $chess = new Chess();
    $gameOver = false;

    $('#clock li').each(function () {
    $(this).text($time + ':00');
    });

    $('#moves tbody tr').empty();
    $('#captured-pieces ul').each(function () {
      $(this).empty();
    })

    $('.rematch').hide();
    $('.resign').show();

    if ($side === 'w') {
      $('.chess_board.black').remove();
      $('#board_wrapper').append($chessboardWhite.clone());

      $socket.emit('timer-white', {
        'token': $token
      });
    } else {
      $('.chess_board.white').remove();
      $('#board_wrapper').append($chessboardBlack.clone());
      $('.chess_board.black').show();
    }

    $('.chess_board a').on('click', movePieceFromHandler);
    $('.chess_board td').on('click', movePieceToHandler);
    $('#sendMessage').find('input').removeClass('white black').addClass($side === 'b' ? 'black' : 'white');
  });

  /* gameplay */

  $('#clock li').each(function() {
    $(this).text($time + ':00');
  });
  $('#game-type').text($time + '|' + $increment);

  function movePieceFromHandler(e) {
    var piece = $(this);
    if ((piece.hasClass('white') && $side !== 'w') ||
        (piece.hasClass('black') && $side !== 'b')) {
      if ($piece) {
        movePiece(
          from=$piece.parent().data('id').toLowerCase(),
          to=$(this).parent().data('id').toLowerCase(),
          promotion=$('#promotion option:selected').val()
        )
      }
    } else {
      if ($chess.turn() !== $side) {
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
  }

  function movePieceToHandler(e) {
    if ($piece) {
      movePiece(
        from=$piece.parent().data('id').toLowerCase(),
        to=$(this).data('id').toLowerCase(),
        promotion=$('#promotion option:selected').val()
      )
    }
  }

  $('.chess_board a').on('click', movePieceFromHandler);
  $('.chess_board td').on('click', movePieceToHandler);

  $('#modal-mask, #modal-ok').click(function (e) {
    e.preventDefault();
    hideModal();
  });

  $('#offer-accept').click(function (e) {
    e.preventDefault();
    hideOffer();
    rematchAccepted();
  });

  $('#offer-decline').click(function (e) {
    e.preventDefault();
    hideOffer();
    rematchDeclined();
  });

  $('#modal-window, #offer-window').click(function (e) {
    e.stopPropagation();
  });

  $('.resign').click(function (e) {
    e.preventDefault();

    $socket.emit('resign', {
      'token': $token,
      'color': $side
    });
  });

  $('.rematch').click(function (e) {
    e.preventDefault();
    showModal('Your offer has been sent.');

    $socket.emit('rematch-offer', {
      'token': $token
    });
  })

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
