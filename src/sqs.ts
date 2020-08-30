import { SQS } from 'aws-sdk';

/**
 * SQS based logging for reliably logging the api calls made to winzo.
 * This was an experimental logging system, which kind of seems would
 * be much expensive in longer time and will require alternates, like
 * CloudWatchLogs or may be even the api call logging needs to be
 * handled differently with a separate database system entirely.
 */

const sqs = new SQS();
const queue = process.env.AWS_SQS_LOGGING_QUEUE || 'https://sqs.ap-southeast-1.amazonaws.com/577116128241/logging';

/**
 * Create log, with api name and the payload
 * @param type
 * @param payload
 */
export async function log(type: string, payload: any) {
  const res = await sqs.sendMessage({
    MessageBody: JSON.stringify([type, payload]),
    QueueUrl: queue,
  }).promise();
  return res.MessageId as string;
}

/**
 * Read the log without removing them from the queue. It is
 * possible to get the same log twice in this scenario
 * @param fn
 */
export async function peek(fn: (msgId: string, type: string, payload: any) => Promise<boolean | void>) {
  const res = await sqs.receiveMessage({
    QueueUrl: queue,
    MaxNumberOfMessages: 10,
  }).promise();

  if (!res.Messages) return [];

  return (await Promise.all(res.Messages.map(async (k) => {
    const [type, payload] = JSON.parse(k.Body);
    try {
      if (await fn(k.MessageId, type, payload) === false) return null;
      return { Id: k.MessageId, ReceiptHandle: k.ReceiptHandle };
    } catch (err) {
      return null;
    }
  }))).filter(k => k !== null);
}

/**
 * Read the logs and remove them from the queue when successfully
 * processed
 * @param fn The function to process the logs. If this function doesn't
 *           return false or throw's an error. The log is removed
 *           from the queue.
 *
 */
export async function read(fn: (msgId: string, type: string, payload: any) => Promise<boolean | void>) {
  const res = await peek(fn);

  if (res.length) {
    await sqs.deleteMessageBatch({
      Entries: res,
      QueueUrl: queue,
    }).promise();
  }

  return res.length;
}
