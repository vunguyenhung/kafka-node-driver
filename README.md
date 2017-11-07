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
    keyEncoding ::String
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
TODO

Consumer API
-----------------
`createConsumer :: ({ clientOptions :: ClientOptions, consumerOptions :: ConsumerOptions }, [String]) -> Task Error [{ready :: Boolean}]`  
Create a consumer and push it into internal consumer storage. 
Then returns **a Task** which contains Error if there's error in the creation process or contains internal consumer storage status if successfully.
```js
createConsumer(options, ['valid-topic'])
  .run() // run the task, this method return a TaskExecution
  .promise() // convert the TaskExecution into Promise
  .then(console.log); 
//=> [{ ready: true }]
```
```js
createConsumer(options, ['invalid-topic'])
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
onMessage(0).subscribe(console.log);
//=> { 
//     topic: 'example-topic',
//     value: 'someMessage',
//     offset: 1,
//     partition: 0,
//     highWaterOffset: 3,
//     key: null 
//   } 
```
----
`onError :: Number -> Observable Error`  
Take the consumer in internal consumer storage at the index is the provided argument, return an Observable emit item each time that consumer receive an error.
```js
onError(0).subscribe(console.log);
//=> TopicNotExistError: 'The topic(s) invalid-topic do not exist'
//                  at ...
//                  ...
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