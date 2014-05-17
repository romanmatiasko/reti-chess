$(function () {
  var $token, $time, $increment;

  $socket.on('created', function (data) {
    $token = data.token;
    $('#waiting').text('Wating for opponent to connect.');

    $('#game_link').val($URL + '/play/' + $token + '/' + $time + '/' + $increment); // create game link
    $('#game_link').click(function() {
      $(this).select(); // when clicked, link is automatically selected for convenience
    });
  });

  $socket.on('ready', function (data) {
    document.location = $URL + '/play/' + $token + '/' + $time + '/' + $increment;
  });

  $socket.on('token-expired', function (data) {
    $('#waiting').text('Game link has expired, generate a new one.');
  });

  $('#play').click(function (ev) {
    var min = parseInt($('#minutes').val());
    var sec = parseInt($('#seconds').val());
    if (!isNaN(min) && min > 0 && min <= 50 && !isNaN(sec) && sec >= 0 && sec <= 50) {
      $time = min;
      $increment = sec;
      $socket.emit('start');
      $('#waiting').text('Generating game link').slideDown(400);
      ev.preventDefault();
    }
  });
});
