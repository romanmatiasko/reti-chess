'use strict';

const React = require('react');
const GameStore = require('../stores/GameStore');
const GameActions = require('../actions/GameActions');
const ChessPieces = require('../constants/ChessPieces');
const onGameChange = require('../mixins/onGameChange');
const maybeReverse = require('../mixins/maybeReverse');
const Immutable = require('immutable');
const {Seq, Repeat} = Immutable;
const PureRenderMixin = React.addons.PureRenderMixin;

const Chessboard = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    maybePlaySound: React.PropTypes.func.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired
  },
  mixins: [PureRenderMixin, onGameChange, maybeReverse],

  getInitialState() {
    return {
      fen: GameStore.getFEN()
    };
  },
  render() {
    const fen = this.state.fen;
    const placement = fen.split(' ')[0];
    const rows = this._maybeReverse(placement.split('/'));

    return (
      <table className="chessboard">
        {rows.map((placement, i) =>
          <Row placement={placement} color={this.props.color} key={i} />)}
      </table>
    );
  },
  _onGameChange() {
    this.setState({
      fen: GameStore.getFEN()
    });
  }
});

const Row = React.createClass({

  propTypes: {
    placement: React.PropTypes.string.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired
  },
  mixins: [PureRenderMixin, maybeReverse],

  render() {
    const placement = this.props.placement;
    let pieces;

    if (placement.length < 8) {
      pieces = this._maybeReverse(
        Seq(placement).flatMap(piece => (
          /^\d$/.test(piece) ? Repeat('-', parseInt(piece, 10)) : piece
        ))
      ).toArray();
    } else {
      pieces = this._maybeReverse(placement.split(''));
    }
    return (
      <tr>
        {pieces.map((piece, i) =>
          <Column piece={piece} key={i} />)}
      </tr>
    );
  }
});

const Column = React.createClass({

  propTypes: {
    piece: React.PropTypes.string.isRequired
  },
  mixins: [PureRenderMixin],

  render() {
    return <td>{ChessPieces[this.props.piece]}</td>;
  }
});

module.exports = Chessboard;