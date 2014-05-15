var $URL, $socket;
  
$(function () {
  //var ENV = 'openshift';
  var ENV = 'dev';
  var $WS;

  if (ENV === 'dev') {
    $URL = 'http://localhost:3000';
    $WS = $URL;
  } else if (ENV === 'openshift') {
    $URL = 'http://www.retichess.com';
    $WS = 'ws://www.retichess.com:8000/';
  }

  $socket = io.connect($WS);
});