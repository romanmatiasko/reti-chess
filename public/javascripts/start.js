$(document).ready(function () {
  $socket.on('created', function (data) {
    $token = data.token;
    $('#game_link').val($URL + '/play/' + $token); // create game link
    $('#game_link').click(function() {
      $(this).select(); // when clicked, link is automatically selected for convenience
    });
  });

  $socket.on('ready', function (data) {
    document.location = $URL + '/play/' + $token;
  });

  $('#play').click(function (ev) { 
    $socket.emit('start'); 
    $('#waiting').slideDown(400); // show waiting for opponent message
    ev.preventDefault();
  });
});
