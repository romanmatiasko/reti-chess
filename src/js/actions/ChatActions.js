const ChatConstants = require('../constants/ChatConstants');
const AppDispatcher = require('../dispatcher/AppDispatcher');

const ChatActions = {
  toggleChat() {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.TOGGLE_CHAT
    });
  },
  submitMessage(message, className) {
    AppDispatcher.handleViewAction({
      actionType: ChatConstants.SUBMIT_MESSAGE,
      message: message,
      className: className
    });
  }
};

module.exports = ChatActions;