/*
3rd Party library imports
 */
const log = require('debug')('src:common');
const R = require('ramda');
const Result = require('folktale/result');

const trace = R.curry(log);

// findFirstEmptyPosition :: Array a -> Result (Error Array a) Number
const findFirstEmptyPosition = arr => {
  const nearestEmptyPos = R.findIndex(R.isNil)(arr);
  return nearestEmptyPos < 0 ? Result.Error(arr) : Result.Ok(nearestEmptyPos);
};

// fillEmptyPosition :: (Array a, a) -> Result Error Array a
const fillEmptyPosition = (arr, element) =>
  findFirstEmptyPosition(arr)
    .map(R.update(R.__, element, arr));

// replaceNullOrAppendToEnd :: Array a -> a -> Array a
const replaceNullOrAppendToEnd = R.curry((arr, element) =>
  fillEmptyPosition(arr, element)
    .mapError(R.append(element))
    .merge(),
);

module.exports = {
  trace,
  replaceNullOrAppendToEnd,
};
