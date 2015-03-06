'use strict';

const React = require('react/addons');
const GameActions = require('../actions/GameActions');
const PureRenderMixin = React.addons.PureRenderMixin;

const Clock = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object,
    params: React.PropTypes.array.isRequired
  },
  mixins: [PureRenderMixin],

  getInitialState() {
    let [_, time, inc] = this.props.params;
    
    return {
      white: time * 60,
      black: time * 60,
      inc: inc,
      countdown: null
    };
  },
  componentDidMount() {
    let io = this.props.io;

    io.on('countdown', data => this.setState({
      [data.color]: data.time,
      countdown: data.color
    }));

    io.on('countdown-gameover', data => {
      this.setState({countdown: null});
      GameActions.gameOver({
        type: 'timeout',
        winner: data.color === 'black' ? 'White' : 'Black'
      });
    });
  },
  render() {
    return (
      <ul id="clock">
        <Timer
          color="white"
          time={this.state.white}
          countdown={this.state.countdown} />
        <Timer
          color="black"
          time={this.state.black}
          countdown={this.state.countdown} />
      </ul>
    );
  }
});

const Timer = React.createClass({

  mixins: [PureRenderMixin],

  render() {
    let {time, color, countdown} = this.props;
    let min = Math.floor(time / 60);
    let sec = time % 60;
    let timeLeft = `${min}:${sec < 10 ? '0' + sec : sec}`;

    return (
      <li className={color + (color === countdown ? ' ticking' : '')}>
        {timeLeft}
      </li>
    );
  }
});

module.exports = Clock;