var babel = require('babel');

module.exports.process = function(sourceText, sourcePath) {
  return babel.transform(sourceText).code;
};