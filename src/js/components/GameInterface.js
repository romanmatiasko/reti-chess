'use strict';

import React from 'react/addons';
import GameHeader from './GameHeader';
import Chat from './Chat';
import Modal from './Modal';
import GameActions from '../actions/GameActions';
import GameStore from '../stores/GameStore';
import ChessboardInterface from './ChessboardInterface';
import {Map} from 'immutable';

const GameInterface = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    params: React.PropTypes.array.isRequired
  },

  getInitialState() {
    return {
      isOpponentAvailable: false,
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
    const {io, params} = this.props;

    io.on('token-invalid', () => this.setState({
      modal: this.state.modal
        .set('open', true)
        .set('message', 'Game link is invalid or has expired')
        .set('type', 'info')
    }));

    io.emit('join', {
      token: params[0],
      time: params[1] * 60,
      inc: params[2]
    });

    io.on('joined', data => {
      if (data.color === 'black') {
        this.setState({color: 'black'});
      }
    });

    io.on('both-joined', () =>
      this.setState({isOpponentAvailable: true}, () => {
        if (this.state.color === 'white') {
          io.emit('clock-run', {
            token: params[0],
            color: 'white'
          });
        }
      }));

    io.on('full', () => {
      window.alert(
        'This game already has two players. You have to create a new one.');
      window.location = '/';
    });

    io.on('player-resigned', data => {
      GameActions.gameOver({
        type: 'resign',
        winner: data.color === 'black' ? 'White' : 'Black'
      });
    });

    io.on('rematch-offered', () =>
      this._openModal('offer', 'Your opponent has sent you a rematch offer.'));

    io.on('rematch-declined', () =>
      this._openModal('info', 'Rematch offer has been declined.'));

    io.on('rematch-confirmed', () => {
      GameActions.rematch();
      this.setState({
        color: this.state.color === 'white' ? 'black' : 'white',
        modal: this.state.modal.set('open', false)
      }, () => {
        if (this.state.color === 'white') {
          io.emit('clock-run', {
            token: this.props.params[0],
            color: 'white'
          });
        }
      });
    });

    io.on('opponent-disconnected', () =>  {
      if (!this.state.gameOver.get('status')) {
        this._openModal('info', 'Your opponent has disconnected.');
      }

      this.setState({isOpponentAvailable: false});
    });

    GameStore.on('change', this._onGameChange);
  },
  componentWillUnmount() {
    GameStore.off('change', this._onGameChange);
  },
  render() {
    const {io, params} = this.props;
    const {color, soundsEnabled, gameOver, isOpponentAvailable} = this.state;
    const commonProps = {
      io: io,
      color: color,
      openModal: this._openModal,
      isOpponentAvailable: isOpponentAvailable
    };

    return (
      <div>
        <GameHeader
          {...commonProps}
          params={params}
          gameOver={gameOver.get('status')} />

        <label id="sounds-label">
          <input type="checkbox"
                 checked={soundsEnabled}
                 onChange={this._toggleSounds} />
          <span> Enable sounds</span>
        </label>

        <Chat
          {...commonProps}
          token={params[0]}
          soundsEnabled={soundsEnabled} />

        <ChessboardInterface
          {...commonProps}
          token={params[0]}
          soundsEnabled={soundsEnabled}
          gameOver={gameOver} />

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
    const {io, params} = this.props;

    io.emit('rematch-confirm', {
      token: params[0],
      time: params[1] * 60,
      inc: params[2]
    });
    this._hideModal();
  },
  _declineRematch() {
    const {io, params} = this.props;

    io.emit('rematch-decline', {
      token: params[0]
    });
    this._hideModal();
  },
  _toggleSounds(e) {
    this.setState({
      soundsEnabled: !this.state.soundsEnabled
    });
  },
});

export default GameInterface;