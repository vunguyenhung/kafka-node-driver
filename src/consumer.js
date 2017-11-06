/*
3rd Party library imports
 */
const { KafkaClient, Consumer } = require('kafka-node');
const Task = require('folktale/concurrency/task');
const R = require('ramda');
const Rx = require('rxjs');

/*
Project file imports
 */
const { storage } = require('./storage');
const { replaceNullOrAppendToEnd, toReadyStatus } = require('./common');

// _onError :: Consumer -> Observable Message
const _onError = consumer =>
  Rx.Observable.fromEvent(consumer, 'error');

// _onMessage :: Consumer -> Observable Message
const _onMessage = consumer =>
  Rx.Observable.fromEvent(consumer, 'message');

// waitForTimeout :: Number -> Task
const waitForTimeout = (millisecond) =>
  Task.task((r) => {
    const timerId = setTimeout(r.resolve, millisecond);
    r.cleanup(() => {
      clearTimeout(timerId);
    });
  });

// waitForNextError :: Consumer -> Task Error
const waitForNextError = R.curry((consumer) =>
  Task.task((r) => {
    _onError(consumer)
      .first() // we only need the next error
      .subscribe(r.reject);
  }));

// waitForTimeoutOrNextError :: (Number, Consumer) -> Task Error Consumer
const waitForTimeoutOrNextError = R.curry((millisecond, consumer) =>
  Task.waitAny([
    waitForTimeout(millisecond),
    waitForNextError(consumer),
  ]).map(() => consumer));

// createConsumerInstance :: (Options, Array Topic) -> Task Consumer
const createConsumerInstance = ({ clientOptions, consumerOptions }, topics) =>
  Task.task((r) => {
    const client = new KafkaClient(clientOptions);
    const consumer = new Consumer(client, topics, consumerOptions);
    r.resolve(consumer);
  });

// getConsumers :: () -> Task Array Consumer
const getConsumers = () => Task.of(storage.consumers);

// insertConsumer :: Options -> Topics -> Array Consumer -> Array Consumer
const insertConsumer = R.curry((options, topics, consumers) =>
  createConsumerInstance(options, topics)
    .chain(waitForTimeoutOrNextError(500))
    .map(replaceNullOrAppendToEnd(consumers)),
);

// updateConsumers :: Array Consumer -> Array Consumer
const updateConsumers = consumers =>
  Task.task((r) => {
    storage.consumers = consumers;
    r.resolve(consumers);
  });

const createConsumer = (options, topics) =>
  getConsumers()
    .chain(insertConsumer(options, topics))
    .chain(updateConsumers)
    .map(toReadyStatus);

const getConsumerObservable = consumerIndex =>
  Rx.Observable.just(storage.consumers[consumerIndex]);

const onMessage = consumerIndex =>
  getConsumerObservable(consumerIndex).flatMap(_onMessage);

const onError = consumerIndex =>
  getConsumerObservable(consumerIndex).flatMap(_onError);

module.exports = {
  createConsumer,
  onMessage,
  onError,
};
