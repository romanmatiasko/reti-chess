var $URL, $socket;
  
$(function () {
  //var ENVIRONMENT = 'openshift';
  var ENVIRONMENT = 'dev';
  var $WS;

  if (ENVIRONMENT === 'dev') {
    $URL = 'http://localhost:3000';
    $WS = $URL;
  } else if (ENVIRONMENT === 'openshift') {
    $URL = 'http://retichess-rmn.rhcloud.com';
    $WS = 'ws://retichess-rmn.rhcloud.com:8000/';
  }

  $socket = io.connect($WS);
});