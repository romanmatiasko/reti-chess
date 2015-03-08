module.exports = {
  _maybeReverse(iterable) {
    return this.props.color === 'black' ? iterable.reverse() : iterable;
  }
};