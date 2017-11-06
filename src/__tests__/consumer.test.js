/*
3rd Party library imports
 */
const log = require('debug')('consumer:test');
const config = require('config');

/*
Project file imports
 */
const { createConsumer } = require('../consumer');
const { createProducer, createTopics } = require('../producer');
const { storage } = require('../storage');

describe('Consumer tests', () => {
  // TODO: investigate how to create topic to test consumer

  const testTopics = [{ topic: 'knd-test1' }];
  const options = config.get('Kafka');

  beforeAll(async () => {
    await createProducer(options).run().promise();
    await createTopics(['knd-test1'], 0).run().promise(); // TODO: write test for this
  });

  afterEach(() => {
    // naive cleanup
    storage.consumers = [];
  });

  it('should connect successfully', async () => {
    // GIVEN
    const expectedResult = [{ ready: true }];

    // WHEN
    const actualResult = await createConsumer(options, testTopics).run().promise();

    // THEN
    expect(actualResult).toEqual(expectedResult);
  });

  it('should throw topic(s) not exist error ' +
    'when create a consumer which listen to not Existing topic', () => {
    // GIVEN
    const expectedError = new Error('The topic(s) knd-test2 do not exist');

    // WHEN
    return createConsumer(options, [{ topic: 'knd-test2' }])
      .run()
      .promise()
      .catch(error => {
        // THEN
        expect(error.message).toEqual(expectedError.message);
      });
  });

});
