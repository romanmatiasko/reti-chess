'use strict';

const React = require('react/addons');
const GameStore = require('../stores/GameStore');
const GameActions = require('../actions/GameActions');
const onGameChange = require('../mixins/onGameChange');
const Chessboard = require('./Chessboard');
const CapturedPieces = require('./CapturedPieces');
const TableOfMoves = require('./TableOfMoves');
const cx = require('classnames');
const omit = require('lodash.omit');

const ChessboardInterface = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    token: React.PropTypes.string.isRequired,
    soundsEnabled: React.PropTypes.bool.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    gameOver: React.PropTypes.object.isRequired,
    isOpponentAvailable: React.PropTypes.bool.isRequired
  },
  mixins: [React.addons.PureRenderMixin, onGameChange],

  getInitialState() {
    return GameStore.getState();
  },
  componentDidUpdate(prevProps) {
    if (this.props.gameOver.get('status') &&
        !prevProps.gameOver.get('status')) {
      this.props.openModal('info', this._getGameOverMessage());
    }
  },
  render() {
    const {promotion, turn, gameOver, check} = this.state;
    const cxFeedback = cx({
      feedback: true,
      white: turn === 'w',
      black: turn === 'b'
    });

    return (
      <div id="board-moves-wrapper" className="clearfix">
        
        <audio preload="auto" ref="moveSnd">
          <source src="/snd/move.mp3" />
        </audio>
        <audio preload="auto" ref="checkSnd">
          <source src="/snd/check.mp3" />
        </audio>

        <div id="board-wrapper">
          <CapturedPieces />
          <Chessboard
            {...omit(this.props, 'soundsEnabled', 'gameOver')}
            gameOver={gameOver.get('status')}
            maybePlaySound={this._maybePlaySound} />
        </div>

        <TableOfMoves />

        <span className="promotion">
          <label>
            <span>Promotion: </span>
            <select value={promotion}
                    onChange={this._onPromotionChange}>
              <option value="q">Queen</option>
              <option value="r">Rook</option>
              <option value="b">Bishop</option>
              <option value="n">Knight</option>
            </select>
          </label>
        </span>

        <span className={cxFeedback}>
          {!gameOver.get('status') ? 
            <span>
              {`${turn === 'w' ? 'White' : 'Black'} to move.`}
              {check ? <strong> Check.</strong> : null}
            </span> :

            <strong>
              {this._getGameOverMessage()}
            </strong>
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
      this.refs[this.state.check ? 'checkSnd' : 'moveSnd'].getDOMNode().play();
    }
  },
  _getGameOverMessage() {
    const type = this.props.gameOver.get('type');
    const winner = this.props.gameOver.get('winner');
    const loser = winner === 'White' ? 'Black' : 'White';

    return type === 'checkmate' ? `Checkmate. ${winner} wins!` :
      type === 'timeout' ? `${loser}‘s time is out. ${winner} wins!` :
      type === 'resign' ? `${loser} has resigned. ${winner} wins!` :
      type === 'draw' ? 'Draw.' :
      type === 'stalemate' ? 'Draw (Stalemate).' :
      type === 'threefoldRepetition' ? 'Draw (Threefold Repetition).' :
      type === 'insufficientMaterial' ? 'Draw (Insufficient Material)' : '';
  }
});

module.exports = ChessboardInterface;