'use strict';

import 'es6-shim';
import React from 'react';
import io from './io';
import GameInterface from './components/GameInterface';

let params = window.location.pathname.replace('/play/', '').split('/');
params[1] = parseInt(params[1], 10);
params[2] = parseInt(params[2], 10);

React.render(
  <GameInterface io={io} params={params} />,
  document.getElementById('container')
);