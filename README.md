Reti Chess
==========

A lightweight, real-time chess app built in [Node](http://nodejs.org/), [Express](http://expressjs.com/), [Socket.IO](http://socket.io/), [React](http://facebook.github.io/react/), [Flux](http://facebook.github.io/flux/) and [Immutable](http://facebook.github.io/immutable-js/). Reti Chess also uses [chess.js](https://github.com/jhlywa/chess.js) for move validation and check/mate/draw detection.

You can play the game on [www.retichess.com](http://www.retichess.com/).

If you want to run it locally (with node **v0.12**):
* Clone the repo
* Install dependencies
```sh
npm install
```
* Set NODE_ENV to developement
```sh
export NODE_ENV=development
```
* Run the server
```sh
npm start
```
* Preferred way is to run the server with nodemon
```sh
npm install -g nodemon # if you don't have nodemon installed yet
nodemon --harmony bin/www
```
* Run gulp if you want to recompile static assets when you save a file
```sh
gulp
```
* App will run on **localhost:3000**

License
-------

Available under [the MIT License (MIT)](./LICENSE.md).
