'use strict';

require('es6-shim');
const React = require('react');
const io = require('./io');
const GameInterface = require('./components/GameInterface');
const params = window.location.pathname.replace('/play/', '').split('/');

React.render(
  <GameInterface io={io} params={params} />,
  document.getElementById('container')
);