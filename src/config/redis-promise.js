import client from './redis';

const { promisify } = require('util');

const redis = {};

for (const method in client) {
  redis[method] = promisify(client[method]).bind(client);
}

// redis.set = promisify(client.set).bind(client);
// redis.get = promisify(client.get).bind(client);
// redis.zscore = promisify(client.zscore).bind(client);
// redis.zcard = promisify(client.zcard).bind(client);
// redis.zadd = promisify(client.zadd).bind(client);
// redis.zpopmin = promisify(client.zpopmin).bind(client);
// redis.zrange = promisify(client.zrange).bind(client);

export default redis;
