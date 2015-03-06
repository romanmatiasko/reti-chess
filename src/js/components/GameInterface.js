'use strict';

const React = require('react/addons');
const GameHeader = require('./GameHeader');
const Chat = require('./Chat');
const Modal = require('./Modal');
const GameActions = require('../actions/GameActions');
const GameStore = require('../stores/GameStore');
const Immutable = require('immutable');
const {Map} = Immutable;

const GameInterface = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object,
    params: React.PropTypes.array.isRequired
  },

  getInitialState() {
    return {
      color: 'white',
      modal: Map({
        open: false,
        message: '',
        type: 'info',
        callbacks: {
          hide: this._hideModal,
          accept: this._acceptRematch,
          decline: this._declineRematch
        }
      }),
      soundsEnabled: false,
      gameOver: GameStore.getState().gameOver
    };
  },
  componentDidMount() {
    let {io, params} = this.props;

    io.emit('join', {
      token: params[0],
      time: params[1] * 60,
      inc: params[2]
    });

    io.on('token-invalid', () => this.setState({
      modal: this.state.modal
        .set('open', true)
        .set('message', 'Game link is invalid or has expired')
        .set('type', 'info')
    }));

    io.on('joined', data => {
      if (data.color === 'white') {
        io.emit('timer-white', {
          token: params[0]
        });
      } else {
        this.setState({color: 'black'});
      }
    });

    io.on('full', () => {
      window.alert(
        'This game already has two players. You have to create a new one.');
      window.location = '/';
    });

    io.on('player-resigned', data => {
      let winner = data.color === 'black' ? 'White' : 'Black';
      let loser = winner === 'Black' ? 'White' : 'Black';

      GameActions.gameOver({
        type: 'resign',
        winner: winner
      });
      this._openModal('info', `${loser} has resigned. ${winner} wins!`);
    });

    io.on('rematch-offered', () => {
      this._openModal('offer', 'Your opponent has sent you a rematch offer.');
    });

    io.on('rematch-declined', () => {
      this._openModal('info', 'Rematch offer has been declined.');
    });

    io.on('rematch-confirmed', data => {
      GameActions.rematch();
      this.setState({
        color: this.state.color === 'white' ? 'black' : 'white',
        modal: this.state.modal.set('open', false)
      }, () => {
        if (this.state.color === 'white') {
          io.emit('timer-white', {
            token: this.props.params[0]
          });
        }
      });
    });
    GameStore.on('change', this._onGameChange);
  },
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  },
  render() {
    let {io, params} = this.props;
    let {color, soundsEnabled, gameOver} = this.state;

    return (
      <div>
        <GameHeader
          io={io}
          params={params}
          color={color}
          openModal={this._openModal}
          gameOver={gameOver.get('status')} />

        <audio preload="auto" ref="moveSnd">
          <source src="/snd/move.mp3" />
          <source src="/snd/move.ogg" />
        </audio>
        <label id="sounds-label">
          <input type="checkbox"
                 checked={soundsEnabled}
                 onChange={this._toggleSounds} />
          <span> Enable sounds</span>
        </label>

        <Chat
          io={io}
          token={params[0]}
          color={color}
          soundsEnabled={soundsEnabled} />

        <Modal data={this.state.modal} />
      </div>
    );
  },
  _onGameChange() {
    this.setState({gameOver: GameStore.getState().gameOver});
  },
  _openModal(type, message) {
    this.setState({
      modal: this.state.modal
        .set('open', true)
        .set('message', message)
        .set('type', type)
    });
  },
  _hideModal() {
    this.setState({modal: this.state.modal.set('open', false)});
  },
  _acceptRematch() {
    let {io, params} = this.props;

    io.emit('rematch-confirm', {
      token: params[0],
      time: params[1] * 60,
      inc: params[2]
    });
    this._hideModal();
  },
  _declineRematch() {
    let {io, params} = this.props;

    io.emit('rematch-decline', {
      token: params[0]
    });
    this._hideModal();
  },
  _toggleSounds() {
    this.setState({
      soundsEnabled: !this.state.soundsEnabled
    });
  },
});

module.exports = GameInterface;