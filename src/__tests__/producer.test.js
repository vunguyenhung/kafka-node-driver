const { createProducer, removeProducer } = require('../producer');
const { storage } = require('../storage');

describe('Producer test', () => {
  const options = {
    clientOptions: { kafkaHost: 'kafka:9092' },
  };

  afterEach(async () => {
    // naive cleanup
    storage.producers = [];
  });

  it('[P01] should add one more producer to storage.producers when init a producer successfully',
    async () => {
      // GIVEN
      const expectedResult = { producersBefore: [], producersAfter: [{ ready: true }] };

      expect(storage.producers).toHaveLength(0);

      // WHEN
      const actualResult = await createProducer(options).run().promise();

      // THEN
      expect(actualResult).toEqual(expectedResult);
      expect(storage.producers).toHaveLength(1);
    });

  it('[P02] should return success status when init ceaselessly 2 producers successfully',
    async () => {
      // GIVEN
      const expectedResult1 = { producersBefore: [], producersAfter: [{ ready: true }] };
      const expectedResult2 = {
        producersBefore: [{ ready: true }],
        producersAfter: [{ ready: true }, { ready: true }],
      };

      // WHEN
      const actualResult1 = await createProducer(options).run().promise();
      const actualResult2 = await createProducer(options).run().promise();

      // THEN
      expect(actualResult1).toEqual(expectedResult1);
      expect(actualResult2).toEqual(expectedResult2);
    });

  it('[P03] should insert producer to an empty slot ' +
    'when insertProducer and storage.producers has an empty slot', async () => {
    // GIVEN
    const expectedResult = {
      producersBefore: [null, { ready: true }],
      producersAfter: [{ ready: true }, { ready: true }],
    };
    await createProducer(options).run().promise();
    await createProducer(options).run().promise();
    await removeProducer(0).run().promise();

    // WHEN
    const actualResult = await createProducer(options).run().promise();

    // THEN
    expect(actualResult).toEqual(expectedResult);
  });

  it('[P04] should replace a producer with null value in storage.producers ' +
    'when remove a producer successfully', async () => {
    // GIVEN
    const expectedResult = {
      producersBefore: [{ ready: true }, { ready: true }],
      producersAfter: [null, { ready: true }],
    };
    await createProducer(options).run().promise();
    await createProducer(options).run().promise();

    // WHEN
    const actualResult = await removeProducer(0).run().promise();

    // THEN
    expect(actualResult).toEqual(expectedResult);
  });

  it('[P05] should reject when removeProducer on an invalid Index', async () => {
    // GIVEN
    const expectedResult = new Error('Producer[index] is nil');
    await createProducer(options).run().promise();
    await removeProducer(0).run().promise();

    // WHEN
    const actualResult = await removeProducer(0).run().promise().catch(e => e);

    // THEN
    expect(actualResult).toEqual(expectedResult);
  });
});
