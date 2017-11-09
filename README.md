Kafka Node Driver
=============
A thin layer wraps kafka-node library with some of modern Folktale and Rxjs data structures.

*__Note 1:__ Almost all exported functions of Kafka Node Driver return Folktale or RxJS data structure such as Task, Result, Observable, etc. 
For more information about how to use them, reference [Folktale](http://folktale.origamitower.com/) and [RxJS](http://reactivex.io/rxjs/)*

*__Note 2:__ Kafka Node Driver uses Haskell-like type signatures to describe the types of values. 
For more information, reference [here](https://sanctuary.js.org/#types).* 

Custom Types
----------
`Client Options`: Equivalent to [`options` in KafkaClient of Kafka Node](https://github.com/SOHU-Co/kafka-node#options)    
```
ClientOptions :: { 
    kafkaHost :: String, 
    connectTimeout :: Number, 
    requestTimeout :: Number,
    autoConnect :: Boolean,
    connectRetryOptions :: Object,
    idleConnection :: Number,
    maxAsyncRequests :: Number,
}
```
---
`Consumer Options`: Equivalent to [`options` in Consumer of Kafka Node](https://github.com/SOHU-Co/kafka-node#consumer)    
```
ConsumerOptions :: { 
    groupId :: String, 
    autoCommit :: Boolean, 
    autoCommitIntervalMs :: Number,
    fetchMaxWaitMs :: Number,
    fetchMinBytes :: Number,
    fromOffset :: Boolean,
    encoding :: String,
    keyEncoding :: String
}
```
---
`Producer Options`: Equivalent to [`options` in Producer of Kafka Node](https://github.com/SOHU-Co/kafka-node#producer)    
```
ProducerOptions :: { 
    requireAcks :: Number,
    ackTimeoutMs :: Number,
    partitionerType :: Number
}
```
---
`Message`: Equivalent to [`message` in the callback of Consumer's on('message') event of Kafka Node.](https://github.com/SOHU-Co/kafka-node#onmessage-onmessage)    
```
Message :: { 
    topic :: String, 
    value :: String, 
    offset :: Number,
    partition :: Number,
    highWaterOffset :: Number
}
```


Producer API
----------
`createProducer :: ({ clientOptions :: ClientOptions, producerOptions :: ProducerOptions }, [String]) -> Task Error [{ready :: Boolean}]`  
Create a producer and push it into internal producer storage. 
If there're nil values in internal producer storage, `createProducer` will replace the first nil value with the new producer, else it will append the new producer to the end. 
Then returns **a Task** which contains Error if there's error in the creation process or contains internal producer storage status if successfully.
```js
const { Producer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  }
};

Producer.createProducer(options)
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .then(console.log); 
//=> [{ ready: true }]
```
---
`removeProducer :: Number -> Task Error [{ready: true}]`  
Close a producer at the index is the provided number and replace its position with nil in the internal producer storage. 
Then returns **a Task** which contains Error if there's error in the removing process or contains internal producer storage status if successfully.
```js
const { Producer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  }
};

Producer.createProducer(options)
       .run() // run the task, this method return a TaskExecution
       .promise() // convert the TaskExecution into Promise
       .then(producersStatus => {
         console.log(producersStatus); //=> [{ ready: true }]
         Producer.removeProducer(0)
           .run() 
           .promise()
           .then(console.log); //=> [nil]
       });

// Another way
const trace = (something) => {
  console.log(something);
  return something;
};

Producer.createProducer(options)
  .map(trace)  //=> [{ ready: true }] // producersStatus after the creation
  .chain(() => Producer.removeProducer(0))
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .then(console.log);//=> [nil] // producersStatus after the removing
```
---
`send :: Message -> Number -> Task Error SendingResult`  
Use the producer at index is the provided number to send provided message to Kafka.
Then returns **a Task** which contains Error if there's error in the sending process or contains sending result if successfully.
```js
const { Producer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  }
};

Producer.createProducer(options)
       .run() // run the task, this method return a TaskExecution
       .promise() // convert the TaskExecution into Promise
       .then(producersStatus => {
         console.log(producersStatus); //=> [{ ready: true }]
         const message = {topic: 'valid-topic', messages: 'hello-there'};  
         Producer.send(0, message)
           .run() 
           .promise()
           .then(console.log); 
           //=> { 'valid-topic': { 0 : 1 } } // Message sent to valid-topic at partition 0, offset 1
       });
```
---
`createTopics :: [String] -> Number -> Task [String]`  
Use the producer at index is the provided number to send provided message to Kafka.
Then returns **a Task** contains sending result. If there's an error happened, onError will emit an item.
```js
const { Producer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  }
};

Producer.createProducer(options)
       .run() // run the task, this method return a TaskExecution
       .promise() // convert the TaskExecution into Promise
       .then(producersStatus => {
         console.log(producersStatus); //=> [{ ready: true }]
         const topics = ['valid-topic'];  
         Producer.createTopics(topics, 0)
           .run() 
           .promise()
           .then(console.log); 
           //=> ['valid-topic'] // valid topic created successfully
       });
```

Consumer API
-----------------
`createConsumer :: ({ clientOptions :: ClientOptions, consumerOptions :: ConsumerOptions }, [String]) -> Task Error [{ready :: Boolean}]`  
Create a consumer and push it into internal consumer storage. 
Then returns **a Task** which contains Error if there's error in the creation process or contains internal consumer storage status if successfully.
```js
const { Consumer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  },
  consumerOptions: {
    autoCommitIntervalMs: 1000,
    groupId: 'kafka-node-driver-group'
  }
};

Consumer.createConsumer(options, ['valid-topic'])
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .then(console.log); 
//=> [{ ready: true }]

Consumer.createConsumer(options, ['invalid-topic'])
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .catch(console.log); 
//=> TopicNotExistError: 'The topic(s) invalid-topic do not exist'
//                  at ...
//                  ...
```
----
`onMessage :: Number -> Observable Message`  
Take the consumer in internal consumer storage at the index is the provided argument, return an Observable emit item each time that consumer receive a message.
```js
const { Consumer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  },
  consumerOptions: {
    autoCommitIntervalMs: 1000,
    groupId: 'kafka-node-driver-group'
  }
};

Consumer.createConsumer(options, ['valid-topic'])
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .then(consumersStatus => {
    console.log(consumersStatus); //=> [{ ready: true }]
    Consumer.onMessage(0).subscribe(console.log);
    //=> { 
    //     topic: 'valid-topic',
    //     value: 'someMessage',
    //     offset: 1,
    //     partition: 0,
    //     highWaterOffset: 3,
    //     key: null 
    //   }  
  }); 
```
----
`onError :: Number -> Observable Error`  
Take the consumer in internal consumer storage at the index is the provided argument, return an Observable emit item each time that consumer receive an error.
```js
const { Consumer } = require('kafka-node-driver');

const options = {
  clientOptions: {
    kafkaHost: "localhost:9092"
  },
  consumerOptions: {
    autoCommitIntervalMs: 1000,
    groupId: 'kafka-node-driver-group'
  }
};

Consumer.createConsumer(options, ['invalid-topic'])
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .catch(err => {
    console.log(err);
    //=> TopicNotExistError: 'The topic(s) invalid-topic do not exist'
    //                  at ...
    //                  ...
    
    Consumer.onError(0).subscribe(console.log);
    //=> Incoming error of Consumer at index 0 will be logged here 
  }); 
``` 

Running The Test Suite
----------------------
### Prerequisite
1) Install [Docker](https://www.docker.com/)
2) Open your Terminal, change directory (cd) to kafka-node-driver

### Run
1) On your Terminal, run the following command:
```bash
bash run-test.sh
```