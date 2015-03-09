module.exports = {
  _maybeReverse(iterable, color) {
    return this.props.color === (color || 'black') ?
      iterable.reverse() : iterable;
  }
};