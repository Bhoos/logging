# logging
A api logging library made specifically for loggin WinZO logs for
a more reliable AWS SQS, to process the api call logs asynchronously

# Usage
```typescript
import { sqs } from '@bhoos/logging';

// Write logs
sqs.log('start_game', gamePayload);

// Read logs without deleting
sqs.peek(async (id, type, payload) => {

});

// Read logs an remove if successfully processed
const count = await sqs.read(async (id, type, payload) => {

  // return false; // If the log should not be removed from queue
  // throwing error will also avoid the log removal from queue
});
```
