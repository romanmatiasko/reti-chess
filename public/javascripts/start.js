$(document).ready(function () {
  var $token, $time, $increment;

  $socket.on('created', function (data) {
    $token = data.token;

    $('#game_link').val($URL + '/play/' + $token + '/' + $time + '/' + $increment); // create game link
    $('#game_link').click(function() {
      $(this).select(); // when clicked, link is automatically selected for convenience
    });
  });

  $socket.on('ready', function (data) {
    document.location = $URL + '/play/' + $token + '/' + $time + '/' + $increment;
  });

  $('#play').click(function (ev) {
    var min = parseInt($('#minutes').val());
    var sec = parseInt($('#seconds').val());
    if (!isNaN(min) && min > 0 && min <= 50 && !isNaN(sec) && sec >= 0 && sec <= 50) {
      $time = min;
      $increment = sec;
      $socket.emit('start');
      $('#waiting').slideDown(400); // show waiting for opponent message
      ev.preventDefault();
    }
  });
});
