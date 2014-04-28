var $URL = 'http://retichess-rmn.rhcloud.com';
var $token;
var $socket;

$(document).ready(function () {
  $socket = io.connect($URL);
});
