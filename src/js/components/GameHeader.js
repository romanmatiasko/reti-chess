'use strict';

const React = require('react/addons');
const Clock = require('./Clock');

const GameHeader = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object,
    params: React.PropTypes.array.isRequired,
    color: React.PropTypes.string,
    toggleModal: React.PropTypes.func.isRequired
  },
  mixins: [React.addons.PureRenderMixin],

  render() {
    let [_, time, inc] = this.props.params;

    return (
      <header className="clearfix">

        <Clock
          io={this.props.io}
          params={this.props.params} />

        <span id="game-type">
          {`${time}|${inc}`}
        </span>

        <a className="btn" href="/">New game</a>

        <button type="button"
                className="btn btn--red resign"
                onClick={this._onResign}>
          Resign
        </button>

        <button type="button"
                className="btn btn--red rematch"
                onClick={this._onRematch}>
          Rematch
        </button>

        <a id="chat-icon"
           onClick={this._toggleChat}>
          <img id="bubble"
               src="/img/chat.svg"
               width="50"
               height="50" />
          Chat
        </a>
      </header>
    );
  },
  _onResign(e) {
    let {io, params, color} = this.props;

    io.emit('resign', {
      token: params[0],
      color: color
    });
    e.preventDefault();
  },
  _onRematch(e) {
    let {io, params, toggleModal} = this.props;

    io.emit('rematch-offer', {
      token: params[0]
    });
    toggleModal(true, 'Your offer has been sent.');
    e.preventDefault();
  },
  _toggleChat(e) {
    // ChatStore.toggleChat();
    e.preventDefault();
  }
});

module.exports = GameHeader;