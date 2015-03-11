'use strict';

import React from 'react/addons';
import Clock from './Clock';
import ChatStore from '../stores/ChatStore';
import ChatActions from '../actions/ChatActions';
import omit from 'lodash.omit';

const GameHeader = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    params: React.PropTypes.array.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    openModal: React.PropTypes.func.isRequired,
    gameOver: React.PropTypes.bool.isRequired,
    isOpponentAvailable: React.PropTypes.bool.isRequired
  },
  mixins: [React.addons.PureRenderMixin],

  getInitialState() {
    return omit(ChatStore.getState(), 'messages');
  },
  componentDidMount() {
    ChatStore.on('change', this._onChatChange);
  },
  componentWillUnmount() {
    ChatStore.off('change', this._onChatChange);
  },
  render() {
    const {io, params, gameOver, isOpponentAvailable} = this.props;
    const unseenCount = this.state.unseenCount;

    return (
      <header className="clearfix">

        <Clock
          io={io}
          params={params} />

        <span id="game-type">
          {`${params[1]}|${params[2]}`}
        </span>

        <a className="btn" href="/">New game</a>

        {!gameOver && isOpponentAvailable ?
          <a className="btn btn--red resign"
              onClick={this._onResign}>
            Resign
          </a>
        :gameOver ?
          <a className="btn btn--red rematch"
             onClick={this._onRematch}>
            Rematch
          </a>
        :null}

        <a id="chat-icon"
           onClick={ChatActions.toggleVisibility}>
          {unseenCount ?
            <span id="chat-counter">
              {unseenCount < 9 ? unseenCount : '9+'}
            </span>
          :null}
          <img src="/img/chat.svg"
               width="50"
               height="50" />
          Chat
        </a>
      </header>
    );
  },
  _onChatChange() {
    this.setState(omit(ChatStore.getState(), 'messages'));
  },
  _onResign() {
    const {io, params, color} = this.props;

    io.emit('resign', {
      token: params[0],
      color: color
    });
  },
  _onRematch() {
    const {io, params, openModal, isOpponentAvailable} = this.props;

    if (!isOpponentAvailable) {
      openModal('info', 'Your opponent has disconnected. You need to ' +
        'generate a new link.');
      return;
    }

    io.emit('rematch-offer', {
      token: params[0]
    });
    openModal('info', 'Your offer has been sent.');
  }
});

export default GameHeader;