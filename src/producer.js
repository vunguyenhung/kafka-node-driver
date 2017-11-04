/*
3rd Party library imports
 */
const R = require('ramda');
const Task = require('folktale/concurrency/task');
const Result = require('folktale/result');
const { Producer, KafkaClient } = require('kafka-node');

/*
Project file imports
 */
const { storage } = require('./storage');

// createProducerInstance :: (options) -> Task Producer
const createProducerInstance = ({ clientOptions, producerOptions }) =>
  Task.task((r) => {
    const client = new KafkaClient(clientOptions);
    const newProducer = new Producer(client, producerOptions);
    r.resolve(newProducer);
  });

// waitForProducerReady :: Producer -> Task Producer
const waitForProducerReady = producer =>
  Task.task(r => producer.on('ready', () => r.resolve(producer)));

// getProducers :: () -> Task Array Producer
const getProducers = () => Task.of(storage.producers);

// findFirstEmptyPosition :: Array Producer -> Result (Error Array Producer) Number
const findFirstEmptyPosition = producers => {
  const nearestEmptyPos = R.findIndex(R.isNil)(producers);
  return nearestEmptyPos < 0 ? Result.Error(producers) : Result.Ok(nearestEmptyPos);
};

// fillEmptyPosition :: Array Producer -> Result Number
const fillEmptyPosition = (producers, producer) =>
  findFirstEmptyPosition(producers)
    .map(R.update(R.__, producer, producers));

// _insertProducer :: Array Producer -> Producer -> Array Producer
const _insertProducer = R.curry((producers, producer) =>
  fillEmptyPosition(producers, producer)
    .mapError(R.append(producer))
    .merge());

// insertProducer :: Options -> Array Producer -> Task Array Producer
const insertProducer = R.curry((options, producers) =>
  createProducerInstance(options)
    .chain(waitForProducerReady)
    .map(_insertProducer(producers)));

// pickReadyField :: Producer -> { ready :: Boolean } | null
const pickReadyField = R.ifElse(R.isNil, R.identity, R.pick(['ready']));

// updateProducers :: Array Producer -> Task
const updateProducers = producers => Task.task((r) => {
  const producersBefore = R.map(pickReadyField)(storage.producers);
  const producersAfter = R.map(pickReadyField)(producers);
  // Object.assign(storage.producers, producers);
  storage.producers = producers;
  r.resolve({
    producersBefore,
    producersAfter,
  });
});

const createProducer = (options) =>
  getProducers()
    .chain(insertProducer(options))
    .chain(updateProducers);

// getProducer :: Number -> Task Error Producer
const getProducer = index => Task.task((r) => {
  const producer = storage.producers[index];
  return producer ? r.resolve(producer) : r.reject(new Error('Producer not found'));
});

// validateIndex :: Number -> Array Producer -> Task Error Array Producer
const validateIndex = R.curry((index, producers) =>
  Task.task((r) => {
    if (typeof index !== 'number')
      r.reject(new Error('Invalid index type'));
    else if (R.isNil(producers[index]))
      r.reject(new Error('Producer[index] is nil'));
    else r.resolve(producers);
  }));

// closeProducer :: Number -> Array Producer -> Task Array Producer
const closeProducer = R.curry((index, producers) =>
  Task.task((r) =>
    producers[index].close(() => {
      r.resolve(producers);
    }),
  ),
);

// _removeProducer :: Array Producer -> Array Producer
const _removeProducer = R.update(R.__, null);

// removeProducer :: Number -> Task Array Producer
const removeProducer = producerIndex =>
  getProducers()
    .chain(validateIndex(producerIndex))
    .chain(closeProducer(producerIndex))
    .map(_removeProducer(producerIndex))
    .chain(updateProducers);

// Message :: { topic :: String, messages :: String, partition? :: Number }
// _send :: [Message] -> Producer -> Task Error String
const _send = R.curry((messages, producer) =>
  Task.fromNodeback(producer.send)(messages));

// send :: Message -> Number -> Task Error String
const send = R.curry((messages, producerIndex = 0) =>
  getProducer(producerIndex).chain(_send(messages)));

// createTopics :: Array String -> Producer -> Task Error Something
const createTopics = R.curry((topics, producer) =>
  Task.fromNodeback(producer.createTopics)(topics, true));

module.exports = {
  createProducer,
  removeProducer,
  send,
  createTopics,
};
