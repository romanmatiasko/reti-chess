'use strict';

const React = require('react/addons');
const Clock = require('./Clock');
const ChatStore = require('../stores/ChatStore');
const ChatActions = require('../actions/ChatActions');

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
    return {
      isChatHidden: ChatStore.getState().isChatHidden,
      newMessage: false
    };
  },
  componentDidMount() {
    const io = this.props.io;

    io.on('receive-message', () => {
      if (this.state.isChatHidden) {
        this.setState({newMessage: true});
      }
    });
    ChatStore.on('change', this._onChatStoreChange);
  },
  componentWillUnmount() {
    ChatStore.off('change', this._onChatStoreChange);
  },
  render() {
    const {io, params, gameOver, isOpponentAvailable} = this.props;

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
           onClick={this._toggleChat}>
          {this.state.newMessage ?
            <span className="new-message">You have a new message!</span>
          :null}
          <img src="/img/chat.svg"
               width="50"
               height="50" />
          Chat
        </a>
      </header>
    );
  },
  _onChatStoreChange() {
    this.setState({
      isChatHidden: ChatStore.getState().isChatHidden
    });
  },
  _toggleChat() {
    this.setState({newMessage: false});
    ChatActions.toggleChat();
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

module.exports = GameHeader;