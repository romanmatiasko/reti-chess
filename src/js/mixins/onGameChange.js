import GameStore from '../stores/GameStore';

const onGameChange = {
  componentDidMount() {
    GameStore.on('change', this._onGameChange);
  },
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  }
};

export default onGameChange;