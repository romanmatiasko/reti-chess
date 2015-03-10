'use strict';

const AppDispatcher = require('../dispatcher/AppDispatcher');
const EventEmitter = require('eventemitter2').EventEmitter2; 
const ChatConstants = require('../constants/ChatConstants');
const Immutable = require('immutable');
const {List, Map} = Immutable;
const CHANGE_EVENT = 'change';
  
var _messages = List();
var _isChatHidden = true;

const ChatStore = Object.assign({}, EventEmitter.prototype, {
  getState() {
    return {
      messages: _messages,
      isChatHidden: _isChatHidden
    };
  }
});

AppDispatcher.register(payload => {
  let action = payload.action;

  switch (action.actionType) {

    case ChatConstants.TOGGLE_CHAT:
      _isChatHidden = !_isChatHidden;
      break;

    case ChatConstants.SUBMIT_MESSAGE:
      _messages = _messages.push(Map({
        message: action.message,
        className: action.className
      }));
      break;

    default:
      return true;
  }

  ChatStore.emit(CHANGE_EVENT);
  return true;
});

module.exports = ChatStore;