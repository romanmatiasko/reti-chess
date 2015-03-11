jest
  .dontMock('../ChatStore')
  .dontMock('../../constants/ChatConstants');

require('es6-shim');
const ChatConstants = require('../../constants/ChatConstants');
const AppDispatcher = require('../../dispatcher/AppDispatcher');
const ChatStore = require('../ChatStore');

describe('ChatStore', () => {
  
  var actionToggleVisibility = {
    source: 'VIEW_ACTION',
    action: {
      actionType: ChatConstants.TOGGLE_VISIBILITY
    }
  };
  var actionSubmitMessage = {
    source: 'VIEW_ACTION',
    action: {
      actionType: ChatConstants.SUBMIT_MESSAGE,
      message: 'hi there',
      className: 'white right',
      received: false
    }
  };

  var state;

  const callback = function(cb) {
    AppDispatcher.register.mock.calls[0][0](cb);
    state = ChatStore.getState();
  };

  it('should register a callback with the dispatcher', () => {
    expect(AppDispatcher.register.mock.calls.length).toBe(1);
  });

  it('should return initial data from chat store', () => {
    state = ChatStore.getState();
    expect(state.messages.isEmpty()).toBe(true);
    expect(state.isChatHidden).toBe(true);
    expect(state.unseenCount).toBe(0);
  });

  it('should toggle visibility', () => {
    callback(actionToggleVisibility);
    expect(state.isChatHidden).toBe(false);
  });

  it('should store submitted message', () => {
    callback(actionSubmitMessage);
    expect(state.messages.size).toBe(1);
    expect(state.messages.getIn([0, 'message'])).toBe('hi there');
    expect(state.unseenCount).toBe(0);
  });

  it('should increase unseen count if chat is hidden', () => {
    callback(actionToggleVisibility);
    actionSubmitMessage.action.received = true;
    actionSubmitMessage.action.message = 'hello';
    actionSubmitMessage.action.className = 'black left';
    callback(actionSubmitMessage);
    callback(actionSubmitMessage);
    callback(actionSubmitMessage);
    expect(state.messages.size).toBe(4);
    expect(state.unseenCount).toBe(3);
    expect(state.isChatHidden).toBe(true);
    // also check the order of the messages
    expect(state.messages.getIn([0, 'message'])).toBe('hi there');
    expect(state.messages.getIn([3, 'message'])).toBe('hello');
    expect(state.messages.getIn([3, 'className'])).toBe('black left');
  });

  it('should set unseen count to 0 when chat becomes visible', () => {
    callback(actionToggleVisibility);
    expect(state.unseenCount).toBe(0);
  });
});