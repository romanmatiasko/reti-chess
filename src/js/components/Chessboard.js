'use strict';

const React = require('react');
const GameStore = require('../stores/GameStore');
const GameActions = require('../actions/GameActions');
const ChessPieces = require('../constants/ChessPieces');
const onGameChange = require('../mixins/onGameChange');
const maybeReverse = require('../mixins/maybeReverse');
const omit = require('lodash.omit');
const cx = require('classnames');
const Immutable = require('immutable');
const {Seq, Repeat, List} = Immutable;
const FILES = Seq.Indexed('abcdefgh');
const RANKS = Seq.Indexed('12345678');

const Chessboard = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    token: React.PropTypes.string.isRequired,
    maybePlaySound: React.PropTypes.func.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    gameOver: React.PropTypes.bool.isRequired,
    isOpponentAvailable: React.PropTypes.bool.isRequired
  },
  mixins: [React.addons.PureRenderMixin, maybeReverse],

  getInitialState() {
    const state = GameStore.getChessboardState();

    return {
      fen: state.fen,
      moveFrom: null,
      lastMove: state.lastMove
    };
  },
  componentDidMount() {
    const {io, token} = this.props;
    GameStore.on('change', this._onGameChange);
    GameStore.on('new-move', this._onNewMove);

    io.on('move', data => {
      GameActions.makeMove(data.from, data.to, data.capture, false);
      this.props.maybePlaySound();

      if (!data.gameOver) {
        this._runClock();
      }
    });

    io.on('rematch-confirmed', () => this.setState({moveFrom: null}));
  },
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
    GameStore.on('new-move', this._onNewMove);
  },
  render() {
    const {color, isOpponentAvailable, gameOver} = this.props;
    const fenArray = this.state.fen.split(' ');
    const placement = fenArray[0];
    const isItMyTurn = fenArray[1] === color.charAt(0);
    const rows = this._maybeReverse(placement.split('/'));
    const ranks = this._maybeReverse(RANKS, 'white');

    return (
      <table className="chessboard">
        {rows.map((placement, i) =>
          <Row
            key={i}
            rank={ranks.get(i)}
            placement={placement}
            color={color}
            isMoveable={isItMyTurn && isOpponentAvailable && !gameOver}
            moveFrom={this.state.moveFrom}
            lastMove={this.state.lastMove}
            setMoveFrom={this._setMoveFrom} />)}
      </table>
    );
  },
  _onGameChange(cb) {
    const state = GameStore.getChessboardState();
    this.setState({
      fen: state.fen,
      lastMove: state.lastMove
    }, cb);
  },
  _setMoveFrom(square) {
    this.setState({
      moveFrom: square
    });
  },
  _onNewMove(move) {
    const {io, token} = this.props;

    io.emit('new-move', {
      token: token,
      move: move
    });

    setTimeout(this.props.maybePlaySound, 0);
  },
  _runClock() {
    const {io, token, color} = this.props;

    io.emit('clock-run', {
      token: token,
      color: color
    });
  }
});

const Row = React.createClass({

  propTypes: {
    rank: React.PropTypes.oneOf(['1','2','3','4','5','6','7','8']).isRequired,
    placement: React.PropTypes.string.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    isMoveable: React.PropTypes.bool.isRequired,
    moveFrom: React.PropTypes.string,
    lastMove: React.PropTypes.object,
    setMoveFrom: React.PropTypes.func.isRequired
  },
  mixins: [maybeReverse],

  render() {
    const {rank, placement, color} = this.props;
    const files = this._maybeReverse(FILES);
    const pieces = this._maybeReverse(placement.length < 8 ?
      Seq(placement).flatMap(piece => (
        /^\d$/.test(piece) ? Repeat('-', parseInt(piece, 10)) : piece
      )).toArray() :

      placement.split('')
    );

    return (
      <tr>
        {pieces.map((piece, i) =>
          <Column
            key={i}
            square={files.get(i) + rank}
            piece={piece}
            {...omit(this.props, 'rank', 'placement')} />)}
      </tr>
    );
  }
});

const Column = React.createClass({

  propTypes: {
    square: React.PropTypes.string.isRequired,
    piece: React.PropTypes.string.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    isMoveable: React.PropTypes.bool.isRequired,
    moveFrom: React.PropTypes.string,
    lastMove: React.PropTypes.object,
    setMoveFrom: React.PropTypes.func.isRequired
  },

  render() {
    const {moveFrom, lastMove, square} = this.props;
    const piece = ChessPieces[this.props.piece];

    return piece ? 
      <td className={cx({
            selected: moveFrom === square,
            to: lastMove.get('to') === square
          })}>
        <a onClick={this._onClickSquare}>
          {piece}
        </a>
      </td> :
      <td className={lastMove.get('from') === square ? 'from' : null}
          onClick={this._onClickSquare} />;
  },
  _onClickSquare() {
    const {isMoveable, color, moveFrom, square, piece} = this.props;
    const rgx = color === 'white' ? /^[KQRBNP]$/ : /^[kqrbnp]$/;

    if (!isMoveable || (!moveFrom && !rgx.test(piece)))
      return;
    else if (moveFrom && moveFrom === square)
      this.props.setMoveFrom(null);
    else if (rgx.test(piece))
      this.props.setMoveFrom(square);
    else
      GameActions.makeMove(moveFrom, square, ChessPieces[piece], true);
  }
});

module.exports = Chessboard;