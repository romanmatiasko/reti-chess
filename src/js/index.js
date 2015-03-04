'use strict';

const React = require('react');
const io = require('./io');
const Index = require('./components/Index');

React.render(
  <Index io={io} />,
  document.getElementById('container')
);