var $URL = 'http://localhost:3000';
var $token;
var $socket;

$(document).ready(function () {
  $socket = io.connect($URL);
});
