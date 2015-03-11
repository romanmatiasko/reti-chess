jest
  .dontMock('chess.js')
  .dontMock('../GameStore')
  .dontMock('../../constants/GameConstants');

require('es6-shim');
const GameConstants = require('../../constants/GameConstants');
const AppDispatcher = require('../../dispatcher/AppDispatcher');
const GameStore = require('../GameStore');

describe('GameStore', () => {
  
  var actionMakeMove = {
    source: 'VIEW_ACTION',
    action: {
      actionType: GameConstants.MAKE_MOVE,
      from: 'e2',
      to: 'e4',
      capture: undefined,
      emitMove: true
    }
  };
  var actionChangePromotion = {
    source: 'VIEW_ACTION',
    action: {
      actionType: GameConstants.CHANGE_PROMOTION,
      promotion: 'b'
    }
  };
  var actionGameOver = {
    source: 'VIEW_ACTION',
    action: {
      actionType: GameConstants.GAME_OVER,
      options: {
        winner: 'White',
        type: 'timeout'
      }
    }
  };
  var actionRematch = {
    source: 'VIEW_ACTION',
    action: {
      actionType: GameConstants.REMATCH
    }
  };

  var state, chessboard, moves, cp;

  const callback = function(cb) {
    AppDispatcher.register.mock.calls[0][0](cb);
    state = GameStore.getState();
    chessboard = GameStore.getChessboardState();
    moves = GameStore.getMoves();
    cp = GameStore.getCapturedPieces();
  };

  it('should register a callback with the dispatcher', () => {
    expect(AppDispatcher.register.mock.calls.length).toBe(1);
  });

  it('should return initial store values', () => {
    state = GameStore.getState();
    chessboard = GameStore.getChessboardState();
    expect(state.gameOver.get('status')).toBeFalsy();
    expect(state.promotion).toBe('q');
    expect(state.turn).toBe('w');
    expect(state.check).toBeFalsy();
    expect(chessboard.lastMove.isEmpty()).toBeTruthy();
    expect(chessboard.fen)
      .toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('should make move', () => {
    callback(actionMakeMove);
    expect(state.turn).toBe('b');
    expect(chessboard.lastMove.get('from')).toBe('e2');
    expect(chessboard.lastMove.get('to')).toBe('e4');
    expect(moves.getIn([0, 0])).toBe('e4');
    expect(state.check).toBeFalsy();
  });

  it('should make more moves', () => {
    actionMakeMove.action.from = 'e7';
    actionMakeMove.action.to = 'e5';
    actionMakeMove.action.emitMove = false;
    callback(actionMakeMove);
    actionMakeMove.action.from = 'f2';
    actionMakeMove.action.to = 'f4';
    actionMakeMove.action.emitMove = true;
    callback(actionMakeMove);
    expect(state.turn).toBe('b');
    expect(moves.getIn([1, 0])).toBe('f4');
    expect(chessboard.fen)
      .toBe('rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2');
    expect(cp.get('w').isEmpty).toBeTruthy();
    expect(cp.get('b').isEmpty).toBeTruthy();
  });

  it('should not change any values if move is invalid', () => {
    actionMakeMove.action.from = 'a1';
    actionMakeMove.action.to = 'a3';
    callback(actionMakeMove);
    expect(state.turn).toBe('b');
    expect(moves.getIn([1, 0])).toBe('f4');
    expect(chessboard.fen)
      .toBe('rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2');
    expect(cp.get('w').isEmpty).toBeTruthy();
    expect(cp.get('b').isEmpty).toBeTruthy();
    expect(state.check).toBeFalsy();
  });

  it('should capture piece', () => {
    actionMakeMove.action.from = 'e5';
    actionMakeMove.action.to = 'f4';
    actionMakeMove.action.capture = 'P';
    actionMakeMove.action.emitMove = false;
    callback(actionMakeMove);
    expect(state.turn).toBe('w');
    expect(moves.getIn([1, 1])).toBe('exf4');
    expect(cp.get('w').first()).toBe('P');
  });

  it('should change promotion to bishop', () => {
    callback(actionChangePromotion);
    expect(state.promotion).toBe('b');
  });

  it('should finish the game', () => {
    callback(actionGameOver);
    expect(state.gameOver.get('status')).toBeTruthy();
    expect(state.gameOver.get('winner')).toBe('White');
    expect(state.gameOver.get('type')).toBe('timeout');
  });

  it('should put the store to initial state after rematch accepted', () => {
    callback(actionRematch);
    expect(state.gameOver.get('status')).toBeFalsy();
    expect(state.promotion).toBe('q');
    expect(state.turn).toBe('w');
    expect(state.check).toBeFalsy();
    expect(chessboard.lastMove.isEmpty()).toBeTruthy();
    expect(chessboard.fen)
      .toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(moves.size).toBe(0);
    expect(cp.get('w').isEmpty()).toBeTruthy();
    expect(cp.get('b').isEmpty()).toBeTruthy();
  });
});