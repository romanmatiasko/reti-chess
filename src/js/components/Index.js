'use strict';

const React = require('react');
const CreateGameForm = require('./CreateGameForm');
const io = require('../io');

const Index = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object
  },

  getInitialState() {
    return {
      link: '',
      hasExpired: false,
      time: '30',
      inc: '0'
    };
  },
  componentDidMount() {
    let io = this.props.io;

    /**
     * Socket.IO events
     */
    io.on('created', data => {
      let {time, inc} = this.state;

      this.setState({
        link: `${document.location.origin}/play/${data.token}/${time}/${inc}`
      });
    });
    io.on('ready', () => {
      window.location = this.state.link;
    });
    io.on('token-expired', () => this.setState({hasExpired: true}));
  },
  render() {
    return (
      <div>
        <img src="/img/knight.png"
             width="122"
             height="122"
             className="knight" />
        <h1>Reti Chess</h1>
        <p style={{margin: '50px 0'}} className="center">
          A lightweight real-time chess app build in Node, Express, 
          Socket.IO and React.
        </p>

        <div id="create-game">
          <CreateGameForm
            link={this.state.link}
            time={this.state.time}
            inc={this.state.inc}
            onChangeForm={this._onChangeForm}
            createGame={this._createGame} />
          <p id="game-status">
            {this.state.link ?
              'Waiting for opponent to connect'
            :this.state.hasExpired ?
              'Game link has expired, generate a new one'
            :null}
          </p>
        </div>

        <p>
          Click the button to create a game. Send the link to your friend.
          Once the link is opened your friend‘s browser, game should begin 
          shortly. Colours are picked randomly by computer.
        </p>
        <p>
          <a href="/about" className="alpha">Read more about Reti Chess</a>
        </p>
      </div>
    );
  },

  _onChangeForm(e) {
    this.setState({[e.target.name]: e.target.value});
  },
  _createGame(e) {
    e.preventDefault();
    let {time, inc} = this.state;
    let isInvalid = [time, inc].some(val => {
      val = parseInt(val, 10);
      return isNaN(val) || val < 0 || val > 50;
    });

    if (isInvalid) {
      // fallback for old browsers
      return window.alert('Form is invalid.');
    } else {
      this.props.io.emit('start');
    }
  }
});

module.exports = Index;