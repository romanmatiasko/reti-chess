'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const EventEmitter = require('eventemitter2').EventEmitter2; 
const ChatConstants = require('../constants/ChatConstants');
const Immutable = require('immutable');
const {List, Map} = Immutable;
const CHANGE_EVENT = 'change';
  
var _messages = List();
var _unseenCount = 0;
var _isChatHidden = true;

const ChatStore = Object.assign({}, EventEmitter.prototype, {
  getState() {
    return {
      messages: _messages,
      unseenCount: _unseenCount,
      isChatHidden: _isChatHidden
    };
  }
});

function toggleVisibility() {
  _isChatHidden = !_isChatHidden;
  _unseenCount = 0;
}

function submitMessage(message, className, received) {
  _messages = _messages.push(Map({
    message: message,
    className: className
  }));

  if (received && _isChatHidden) {
    _unseenCount += 1;
  }
}

AppDispatcher.register(payload => {
  const action = payload.action;

  switch (action.actionType) {
    case ChatConstants.TOGGLE_VISIBILITY:
      toggleVisibility();
      break;

    case ChatConstants.SUBMIT_MESSAGE:
      submitMessage(action.message, action.className, action.received);
      break;

    default:
      return true;
  }

  ChatStore.emit(CHANGE_EVENT);
  return true;
});

module.exports = ChatStore;