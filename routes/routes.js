'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const React = require('react');
const Index = require('../src/js/components/Index');
const GameInterface = require('../src/js/components/GameInterface');
let router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    content: React.renderToString(<Index />)
  });
});

router.get('/about', (req, res) => {
  res.render('about');
});

router.get('/play/:token/:time/:inc', (req, res) => {
  let params = [
    req.params.token,
    req.params.time,
    req.params.inc
  ];

  res.render('play', {
    content: React.renderToString(<GameInterface params={params} />)
  });
});

router.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, 'logs/games.log'), (err, data) => {
    if (err) {
      res.redirect('/');
    }
    res.set('Content-Type', 'text/plain');
    res.send(data);
  });
});

module.exports = router;