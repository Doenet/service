import redis from 'redis';

const options = {};

if (process.env.REDIS_PORT) options.port = process.env.REDIS_PORT;
if (process.env.REDIS_HOST) options.host = process.env.REDIS_HOST;
if (process.env.REDIS_PASS) options.auth_pass = process.env.REDIS_PASS;

const client = redis.createClient(options);

export default client;
