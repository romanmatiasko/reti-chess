'use strict';

const React = require('react/addons');
const GameHeader = require('./GameHeader');
const Immutable = require('immutable');
const {Map} = Immutable;
const Chess = require('chess.js');

const GameInterface = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object,
    params: React.PropTypes.array.isRequired
  },

  getInitialState() {
    return {
      modal: Map({open: false, message: ''}),
      soundsEnabled: false
    };
  },
  render() {
    return (
      <div>
        <GameHeader
          io={this.props.io}
          params={this.props.params}
          toggleModal={this._toggleModal} />

        <audio preload="auto" ref="moveSnd">
          <source src="/snd/move.mp3" />
          <source src="/snd/move.ogg" />
        </audio>
        <label id="sounds-label">
          <input type="checkbox"
                 checked={this.state.soundsEnabled}
                 onChange={this._toggleSounds} />
          <span> Enable sounds</span>
        </label>

      </div>
    );
  },
  _toggleModal(open, message) {
    this.setState({
      modal: Map({open: open, message: message})
    });
  },
  _toggleSounds() {
    this.setState({
      soundsEnabled: !this.state.soundsEnabled
    });
  }
});

module.exports = GameInterface;