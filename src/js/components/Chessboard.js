'use strict';

const React = require('react');
const GameStore = require('../stores/GameStore');
const GameActions = require('../actions/GameActions');
const onGameChange = require('../mixins/onGameChange');

const Chessboard = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    maybePlaySound: React.PropTypes.func.isRequired
  },
  mixins: [React.addons.PureRenderMixin, onGameChange],

  getInitialState() {
    return {
      fen: GameStore.getFEN()
    };
  },
  render() {
    return (
      <table className="chessboard">
      </table>
    );
  },
  _onGameChange() {
    this.setState({
      fen: GameStore.getFEN()
    });
  }
});

module.exports = Chessboard;