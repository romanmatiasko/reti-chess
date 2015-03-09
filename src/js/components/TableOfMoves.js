'use strict';

const React = require('react/addons');
const GameStore = require('../stores/GameStore');
const onGameChange = require('../mixins/onGameChange');

const TableOfMoves = React.createClass({
  
  mixins: [React.addons.PureRenderMixin, onGameChange],

  getInitialState() {
    return {
      moves: GameStore.getMoves()
    };
  },
  render() {
    return (
      <table id="moves" className="clearfix">
        <thead>
          <tr>
            <th>Table of moves</th>
          </tr>
        </thead>
        <tbody>
          {this.state.moves.map((row, i) => (
            <tr key={i}>
              <td>
                <strong>{`${i + 1}.`}</strong>
              </td>
              {row.map((move, j) => (
                <td key={j}>
                  <span>{move}</span>
                </td>
              )).toArray()}
            </tr>
          )).toArray()}
        </tbody>
      </table>
    );
  },
  _onGameChange() {
    this.setState({
      moves: GameStore.getMoves()
    });
  }
});

module.exports = TableOfMoves;