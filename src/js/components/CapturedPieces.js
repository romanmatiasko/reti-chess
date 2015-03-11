'use strict';

import React from 'react/addons';
import GameStore from '../stores/GameStore';
import onGameChange from '../mixins/onGameChange';

const CapturedPieces = React.createClass({
  
  mixins: [React.addons.PureRenderMixin, onGameChange],

  getInitialState() {
    return {
      capturedPieces: GameStore.getCapturedPieces()
    };
  },
  render() {
    const cp = this.state.capturedPieces;

    return (
      <div id="captured-pieces">
        {cp.map((pieces, color) => (
          <ul key={color}>
            {pieces.map((piece, i) => <li key={i}>{piece}</li>).toArray()}
          </ul>
        )).toArray()}
      </div>
    );
  },
  _onGameChange() {
    this.setState({
      capturedPieces: GameStore.getCapturedPieces()
    });
  }
});

export default CapturedPieces;