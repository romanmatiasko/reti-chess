'use strict';

const React = require('react/addons');
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
      inc: inc
    };
  },
  componentDidMount() {
    let io = this.props.io;

    io.on('countdown', data => this.setState({
      [data.color]: data.time
    }));

    io.on('countdown-gameover', data => {
      // GameStore.gameOver({
      //   timeout: true,
      //   winner: data.color === 'black' ? 'White' : 'Black'
      // });
    });
  },
  render() {
    return (
      <ul id="clock">
        <Timer color="white" time={this.state.white} />
        <Timer color="black" time={this.state.black} />
      </ul>
    );
  }
});

const Timer = React.createClass({

  mixins: [PureRenderMixin],

  render() {
    let min = Math.floor(this.props.time / 60);
    let sec = this.props.time % 60;
    let timeLeft = `${min}:${sec < 10 ? '0' + sec : sec}`;

    return <li className={this.props.color}>{timeLeft}</li>;
  }
});

module.exports = Clock;