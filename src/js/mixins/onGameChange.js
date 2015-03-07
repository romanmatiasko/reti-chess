const GameStore = require('../stores/GameStore');

module.exports = {
  componentDidMount() {
    GameStore.on('change', this._onGameChange);
  },
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  }
};