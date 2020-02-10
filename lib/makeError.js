const AssertionError = require('assertion-error');

module.exports = function makeError(err, msg) {
  err = err || {};

  var assertMessage;
  if (msg) {
    assertMessage = `${msg}: ${err.message}`;
  } else {
    assertMessage = err.message;
  }

  var assertionError = new AssertionError(assertMessage);
  assertionError.stack =
    err.stack && err.stack.replace(assertionError.message, err.message);

  // quack a little more like an Unexpected error
  assertionError.originalError = err;
  assertionError.getErrorMessage = format => {
    var pen = assertionError.originalError.getErrorMessage(format);
    if (msg) {
      pen = pen
        .clone()
        .text(`${msg}: `)
        .append(pen);
    }
    return pen;
  };

  return assertionError;
};
