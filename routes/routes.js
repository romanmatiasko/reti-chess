'use strict';

import express from 'express';
import path from 'path';
import fs from 'fs';
import React from 'react';
import Index from '../src/js/components/Index';
import GameInterface from '../src/js/components/GameInterface';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    content: React.renderToString(<Index io={{}} />)
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
    content: React.renderToString(<GameInterface params={params} io={{}} />)
  });
});

router.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, '../logs/games.log'), (err, data) => {
    if (err) {
      return res.redirect('/');
    }
    res.set('Content-Type', 'text/plain');
    res.send(data);
  });
});

export default router;