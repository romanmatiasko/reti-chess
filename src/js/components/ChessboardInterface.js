'use strict';

const React = require('react/addons');
const GameStore = require('../stores/GameStore');
const GameActions = require('../actions/GameActions');
const onGameChange = require('../mixins/onGameChange');
const Chessboard = require('./Chessboard');
const CapturedPieces = require('./CapturedPieces');
const TableOfMoves = require('./TableOfMoves');
const cx = require('classnames');

const ChessboardInterface = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    soundsEnabled: React.PropTypes.bool.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired
  },
  mixins: [React.addons.PureRenderMixin, onGameChange],

  getInitialState() {
    return GameStore.getState();
  },
  render() {
    const {promotion, turn, gameOver} = this.state;
    const cxFeedback = cx({
      feedback: true,
      whitefeedback: turn === 'w',
      blackfeedback: turn === 'b'
    });
    const goType = gameOver.get('type');
    const loser = gameOver.get('winner') === 'White' ? 'Black' : 'White';

    return (
      <div id="board-moves-wrapper" className="clearfix">
        
        <audio preload="auto" ref="moveSnd">
          <source src="/snd/move.mp3" />
        </audio>

        <div id="board-wrapper">
          <CapturedPieces />
          <Chessboard
            io={this.props.io}
            maybePlaySound={this._maybePlaySound}
            color={this.props.color} />
        </div>

        <TableOfMoves />

        <span className="promotion">
          <label>
            <span>Promotion: </span>
            <select value={promotion}
                    onChange={this._onPromotionChange}>
              <option value="q">Queen</option>
              <option value="r">Rook</option>
              <option value="n">Knight</option>
              <option value="b">Bishop</option>
            </select>
          </label>
        </span>

        <span className={cxFeedback}>
          {!gameOver.get('status') ? 
            <span className="feedback-move">
              {`${turn === 'w' ? 'White' : 'Black'} to move.`}
            </span> :

            <span className="feedback-status">
              {goType === 'checkmate' ?
                `Checkmate. ${gameOver.get('winner')} wins!`
              :goType === 'timeout' ?
                `${loser}‘s time is out. ${gameOver.get('winner')} wins!`
              :goType === 'resign' ?
                `${loser} has resigned. ${gameOver.get('winner')} wins!`
              :goType === 'draw' ?
                'Draw.'
              :goType === 'stalemate' ?
                'Draw (Stalemate).'
              :goType === 'threefoldRepetition' ?
                'Draw (Threefold Repetition).'
              :goType === 'insufficientMaterial' ?
                'Draw (Insufficient Material)'
              :null}
            </span>
          }
        </span>
      </div>
    );
  },
  _onGameChange() {
    this.setState(GameStore.getState());
  },
  _onPromotionChange(e) {
    GameActions.changePromotion(e.target.value);
  },
  _maybePlaySound() {
    if (this.props.soundsEnabled) {
      this.refs.moveSnd.getDOMNode().play();
    }
  }
});

module.exports = ChessboardInterface;