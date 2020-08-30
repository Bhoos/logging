
export class SQS {
  messages = {};
  writer = 0;
  reader = 0;

  static instance:SQS;

  constructor() {
    SQS.instance = this;
  }

  reset() {
    this.reader = 0;
  }

  sendMessage(params: { MessageBody: string }) {
    return {
      promise: async () => {
        this.messages[++this.writer] = params.MessageBody;
        return {
          MessageId: `${this.writer}`
        };
      }
    }
  }

  receiveMessage(params: {}) {
    return {
      promise: async () => {
        return {
          Messages: Object.keys(this.messages).map(k => ({
            MessageId: k,
            Body: this.messages[k],
            ReceiptHandle: k,
          })),
        };
      }
    }
  }

  deleteMessageBatch(params: { Entries: Array<{ ReceiptHandle: string, Id: string }>}) {
    return {
      promise: async () => {
        params.Entries.forEach(k => {
          delete this.messages[k.ReceiptHandle];
        });
      }
    }
  }
}