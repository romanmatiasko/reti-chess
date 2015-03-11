import {Dispatcher} from 'flux';

export default Object.assign(new Dispatcher(), {
  // @param {object} action The data coming from the view.
  handleViewAction: function(action) {
    this.dispatch({
      source: 'VIEW_ACTION',
      action: action
    });
  }
});