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
    gameOver: React.PropTypes.bool.isRequired
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
    const [_, time, inc] = this.props.params;

    return (
      <header className="clearfix">

        <Clock
          io={this.props.io}
          params={this.props.params} />

        <span id="game-type">
          {`${time}|${inc}`}
        </span>

        <a className="btn" href="/">New game</a>

        {!this.props.gameOver ?
          <a className="btn btn--red resign"
              onClick={this._onResign}>
            Resign
          </a> :

          <a className="btn btn--red rematch"
             onClick={this._onRematch}>
            Rematch
          </a>
        }

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
    const {io, params, openModal} = this.props;

    io.emit('rematch-offer', {
      token: params[0]
    });
    openModal('info', 'Your offer has been sent.');
  }
});

module.exports = GameHeader;