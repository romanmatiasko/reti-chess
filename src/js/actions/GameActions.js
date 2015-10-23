import GameConstants from '../constants/GameConstants';
import AppDispatcher from '../dispatcher/AppDispatcher';


const GameActions = {
  makeMove(from, to, capture, emitMove) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.MAKE_MOVE,
      from,
      to,
      capture,
      emitMove
    });
  },
  rematch() {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.REMATCH
    });
  },
  gameOver(options) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.GAME_OVER,
      options
    });
  },
  changePromotion(promotion) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.CHANGE_PROMOTION,
      promotion
    });
  }
};

export default GameActions;
