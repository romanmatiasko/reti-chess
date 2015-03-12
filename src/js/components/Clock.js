'use strict';

import React from 'react/addons';
import GameActions from '../actions/GameActions';

const PureRenderMixin = React.addons.PureRenderMixin;

const Clock = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    params: React.PropTypes.array.isRequired
  },
  mixins: [PureRenderMixin],

  getInitialState() {
    const [_, time, inc] = this.props.params;
    
    return {
      white: time * 60,
      black: time * 60,
      inc: inc,
      countdown: null
    };
  },
  componentDidMount() {
    const io = this.props.io;

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

    io.on('rematch-accepted', () => {
      this.setState({
        white: this.props.params[1] * 60,
        black: this.props.params[1] * 60
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
    const {time, color, countdown} = this.props;
    const min = Math.floor(time / 60);
    const sec = time % 60;
    const timeLeft = `${min}:${sec < 10 ? '0' + sec : sec}`;

    return (
      <li className={color + (color === countdown ? ' ticking' : '')}>
        {timeLeft}
      </li>
    );
  }
});

export default Clock;