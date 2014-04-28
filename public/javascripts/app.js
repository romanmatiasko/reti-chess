var $URL, $WS, $token, $socket;
//var ENVIRONMENT = 'openshift';
var ENVIRONMENT = 'dev';

if (ENVIRONMENT === 'dev') {
  $URL = 'http://localhost:3000';
  $WS = $URL;
} else if (ENVIRONMENT === 'openshift') {
  $URL = 'http://retichess-rmn.rhcloud.com';
  $WS = 'ws://retichess-rmn.rhcloud.com:8000/';
}

$(document).ready(function () {
  $socket = io.connect($WS);
});
