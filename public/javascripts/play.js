var $side  = 'w';
var $piece = null;
var $chess = new Chess();

function selectPiece(el) { // add html class which highlights the square according to css
  el.addClass('selected');
}

function unselectPiece(el) { // remove highlighting 
  el.removeClass('selected');
}

function isSelected(el) { // function checks if chess piece is selected
  if (el) {
    return el.hasClass('selected');
  } else {
    return false;
  }
}

function movePiece(from, to, promotion, rcvd) { // function moves the piece
  var move = $chess.move({
    'from': from,
    'to': to,
    promotion: promotion
  });

  if (move) {
    var tdFrom = $('td.' + from.toUpperCase());
    var tdTo = $('td.' + to.toUpperCase());

    //check if last moves are highlighted
    if($('td').hasClass('last-target')){
      //if so, remove highlight of last move
      //and highlight current move instead
      $('td').removeClass('last-target');
      $('td').removeClass('last-origin');
      tdFrom.addClass('last-origin');
      tdTo.addClass('last-target');
    } else{
      // otherwise highlight current move
      tdFrom.addClass('last-origin');
      tdTo.addClass('last-target');
    }
    var piece = tdFrom.find('a'); // find out what piece is being moved
    var moveSnd = $("#moveSnd")[0]; // sound file variable
    unselectPiece(piece.parent()); 
    tdTo.html(piece); // replace td attributes

    $piece = null;

    // en passant move
    if (move.flags == 'e'){
      var enpassant = move.to.charAt(0) + move.from.charAt(1);
      $('td.' + enpassant.toUpperCase()).html('');
    }
    
    //kingside castling
    if (move.flags == 'k'){
      if (move.to == 'g1'){
        var rook = $('td.H1').find('a');
        $('td.F1').html(rook);
      }
      else if (move.to == 'g8'){
        var rook = $('td.H8').find('a');
        $('td.F8').html(rook);
      }
    }

    //queenside castling
    if (move.flags == 'q'){
      if (move.to == 'c1'){
        var rook = $('td.A1').find('a');
        $('td.D1').html(rook);
      }
      else if (move.to == 'c8'){
        var rook = $('td.A8').find('a');
        $('td.D8').html(rook);
      }
    }

    
    //promotion
    if (move.flags == 'np' || move.flags == 'cp'){
      var square = $('td.' + move.to.toUpperCase()).find('a');
      var option = move.promotion;
      if (square.hasClass('white')){
        switch(true){
          case(option == 'q'):
            square.html('&#9813;');
            break;
          case(option == 'r'):
            square.html('&#9814;');
            break;
          case(option == 'n'):
            square.html('&#9816;');
            break;
          case(option == 'b'):
            square.html('&#9815;');
            break;
        }
      } else {
        switch(true){
          case(option == 'q'):
            square.html('&#9819;');
            break;
          case(option == 'r'):
            square.html('&#9820;');
            break;
          case(option == 'n'):
            square.html('&#9822;');
            break;
          case(option == 'b'):
            square.html('&#9821;');
            break;
        }
      }
    }
    
    if ($('#sounds').is(':checked')) { // if enable sounds checkbox is ticked, play sounds
      moveSnd.play();
    }
    
    
    if ($chess.turn() == 'b') { // if black's turn
      var f = $('.feedback-move');

      f.text('Black to move.'); // display black to move text
      f.parent().removeClass('whitefeedback');
      f.parent().addClass('blackfeedback');
    } else { // otherwise display white to move
      var f = $('.feedback-move');

      f.text('White to move.');
      f.parent().removeClass('blackfeedback');
      f.parent().addClass('whitefeedback');
    }

    if ($chess.in_check()) {
      $('.feedback-status').text(' Check.');
    } else{
      $('.feedback-status').text('');
    }

    if ($chess.game_over()) {
      $('.feedback-move').text('');
      var result = "";

      if ($chess.in_checkmate()) {
        result = $chess.turn() == 'b' ? 'Checkmate. White wins!' : 'Checkmate. Black wins!'
      
      } else if ($chess.in_draw()) {
        result = "Draw.";
      } else if ($chess.in_stalemate()) {
        result = "Stalemate.";
      } else if ($chess.in_threefold_repetition()) {
        result = "Draw. (Threefold Repetition)";
      } else if ($chess.insufficient_material()) {
        result = "Draw. (Insufficient Material)";
      }
      $('.feedback-status').text(result);
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
  }
}

/* socket.io */
$(document).ready(function () {

  $socket.emit('join', {
    'token': $token
  });

  $socket.on('joined', function (data) {
    if (data.color == 'white') {
      $side = 'w';
      $('.chess_board.black').remove();
    } else {
      $side = 'b';

      $('.chess_board.white').remove();
      $('.chess_board.black').show();
    }
  });

  $socket.on('move', function (data) {
    movePiece(from=data.move.from, to=data.move.to, promotion=data.move.promotion, rcvd=true);
  });

  $socket.on('opponent-disconnected', function (data) {
    alert("Your opponent has disconnected.");
    window.location = '/';
  });

  $socket.on('full', function (data) {
    alert("This game already has two players. You have to create a new one.");
    window.location = '/';
  });
});

/* gameplay */
$(document).ready(function () {
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
});
