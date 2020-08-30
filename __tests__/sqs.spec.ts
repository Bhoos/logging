import { sqs } from '../src';
import { SQS } from 'aws-sdk';

// @ts-ignore;
const sqsMock: any = SQS.instance;


// Make sure you run the jest with following environment
// AWS_SQS_LOGGING_QUEUE=https://sqs.ap-southeast-1.amazonaws.com/577116128241/logging-test
// AWS_PROFILE=<aws profile with sqs access>
describe('Check SQS Logging', () => {
  it('Check all sql function', async () => {
    const msgId = await sqs.log('ex1', 'ex1-payload');
    const len = await sqs.read(async (id, type, payload) => {
      if (id === msgId) {
        expect(type).toBe('ex1');
        expect(payload).toBe('ex1-payload');
      }
    });
    expect(len).toBeGreaterThanOrEqual(1);
  });

  it('check message persists on error', async () => {
    // Write log
    const mid = await sqs.log('ex2', 'ex2-payload');

    // Peek the log
    await sqs.peek(async(id, type, payload) => {
      expect(id).toBe(mid);
      expect(type).toBe('ex2');
      expect(payload).toBe('ex2-payload');
    });

    // Read the log and return false to avoid deletion
    let len = await sqs.read(async (id, type, payload) => {
      expect(id).toBe(mid);
      expect(type).toBe('ex2');
      expect(payload).toBe('ex2-payload');
      return false;
    });
    expect(len).toBe(0);

    sqsMock.reset();

    // Read the log and throw error to avoid deletion
    len = await sqs.read(async (id, type, payload) => {
      expect(id).toBe(mid);
      expect(type).toBe('ex2');
      expect(payload).toBe('ex2-payload');
      throw new Error('avoid consuming');
    });
    expect(len).toBe(0);

    // Read the load and allow deletion
    len = await sqs.read(async (id, type, payload) => {
      expect(id).toBe(mid);
      expect(type).toBe('ex2');
      expect(payload).toBe('ex2-payload');
      return true;
    });
    expect(len).toBe(1);

    sqsMock.reset();
    // Expect no log at the end
    len = await sqs.read(async (id, type, payload) => {

    });
    expect(len).toBe(0);
  });
});

