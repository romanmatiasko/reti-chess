'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const EventEmitter = require('eventemitter2').EventEmitter2; 
const GameConstants = require('../constants/GameConstants');
const Chess = require('chess.js').Chess;
const Immutable = require('immutable');
const {List, Map, OrderedMap, Set} = Immutable;
const CHANGE_EVENT = 'change';
const MOVE_EVENT = 'new-move';
  
var _gameOver;
var _capturedPieces;
var _moves;
var _promotion;
var _turn;
var _check;
var _lastMove;
var _chess;

setInitialState();

const GameStore = Object.assign({}, EventEmitter.prototype, {
  getState() {
    return {
      gameOver: _gameOver,
      promotion: _promotion,
      turn: _turn
    };
  },
  getCapturedPieces() {
    return _capturedPieces;
  },
  getMoves() {
    return _moves;
  },
  getChessboardState() {
    return {
      fen: _chess.fen(),
      lastMove: _lastMove
    };
  }
});

function setInitialState() {
  _gameOver = Map({
    status: false,
    type: null,
    winner: null
  });
  _capturedPieces = OrderedMap([
    ['w', List()],
    ['b', List()]
  ]);
  _moves = List([List()]);
  _promotion = 'q';
  _turn = 'w';
  _check = false;
  _lastMove = Map();
  _chess = new Chess();
}

function makeMove(from, to, capture, emitMove) {
  const move = _chess.move({
    from: from,
    to: to,
    promotion: _promotion
  });

  if (!move) {
    // move is not valid, return false and don't emit any event.
    return false;
  }

  _turn = _chess.turn();
  _check = _chess.in_check();
  _lastMove = _lastMove.set('from', from).set('to', to);
  _moves = _moves.last().size === 2 ?
    _moves.push(List([move.san])) :
    _moves.update(_moves.size - 1, list => list.push(move.san));

  if (capture || move.flags === 'e') {
    const capturedPiece = capture || _turn === 'w' ? 'P' : 'p';

    _capturedPieces = _capturedPieces
      .update(_turn, list => list.push(capturedPiece));
  }

  if (_chess.game_over()) {
    const type = _chess.in_checkmate() ? 'checkmate' :
      _chess.in_draw() ? 'draw' :
      _chess.in_stalemate() ? 'stalemate' :
      _chess.in_threefold_repetition() ? 'threefoldRepetition' :
      _chess.insufficient_material() ? 'insufficientMaterial' : null;

    _gameOver = _gameOver
      .set('status', true)
      .set('winner', _turn === 'w' ? 'White' : 'Black')
      .set('type', type);
  }

  if (emitMove) {
    GameStore.emit(MOVE_EVENT, {
      from: from,
      to: to,
      capture: capture,
      gameOver: _chess.game_over(),
      turn: _turn
    });
  }

  return true;
}

function gameOver(options) {
  _gameOver = _gameOver
    .set('status', true)
    .set('winner', options.winner)
    .set('type', options.type);
}

AppDispatcher.register(payload => {
  var action = payload.action;
  var emitEvent = true;

  switch (action.actionType) {
    case GameConstants.MAKE_MOVE:
      emitEvent = makeMove(
        action.from, action.to, action.capture, action.emitMove);
      break;

    case GameConstants.REMATCH:
      setInitialState();
      break;

    case GameConstants.GAME_OVER:
      gameOver(action.options);
      break;

    case GameConstants.CHANGE_PROMOTION:
      _promotion = action.promotion;
      break;

    default:
      return true;
  }

  if (emitEvent) {
    GameStore.emit(CHANGE_EVENT);
  }
  return true;
});

module.exports = GameStore;