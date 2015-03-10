$(function() {

  /* socket.io */

  $socket.on('move', function (data) {
    movePiece(from=data.move.from, to=data.move.to, promotion=data.move.promotion, rcvd=true);

    if (typeof document.hidden === undefined) return;
    if (document.hidden) {
      var title = $('title').text();
      $('title').text('* ' + title);

      $(window).on('focus', removeAsterisk);

      function removeAsterisk(e) {
        $('title').text(title);
        $(window).off('focus', removeAsterisk);
      }
    }
  });

  function movePieceFromHandler(e) {
    var piece = $(this);
    if ((piece.hasClass('white') && $side !== 'w') ||
        (piece.hasClass('black') && $side !== 'b')) {
      if ($piece) {
        movePiece(
          from=$piece.parent().data('id').toLowerCase(),
          to=$(this).parent().data('id').toLowerCase(),
          promotion=$('#promotion option:selected').val()
        );
      }
    } else {
      if ($chess.turn() !== $side) {
        return false;
      }

      if (e && $piece && isSelected($(this).parent())) {
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

    if (e) { // only on click event, not drag and drop
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }


  function dndSupported() {
    return 'draggable' in document.createElement('span');
  }

  function dragstartHandler(e) {
    var el = $(this);
    $drgSrcEl = el;
    $drgSrcEl.parent().addClass('moving');
    e.originalEvent.dataTransfer.effectAllowed = 'move';
    e.originalEvent.dataTransfer.setData('text/html', el.html());
    movePieceFromHandler.call(this, undefined);
  }

  function dropHandler(e) {
    e.stopPropagation();
    e.preventDefault();
    movePieceToHandler.call(this, undefined);
  }

});
