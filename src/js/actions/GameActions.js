const GameConstants = require('../constants/GameConstants');
const AppDispatcher = require('../dispatcher/AppDispatcher');

const GameActions = {
  rematch() {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.REMATCH
    });
  },
  gameOver(options) {
    AppDispatcher.handleViewAction({
      actionType: GameConstants.GAME_OVER,
      options: options
    });
  }
};

module.exports = GameActions;