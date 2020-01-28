import client from '../config/redis-promise';
import url from 'url';
import crypto from 'crypto';

import axios from 'axios';

const bucketSize = parseInt(process.env.DOENET_K) || 20;
const concurrencyParameter = parseInt(process.env.DOENET_ALPHA) || 3;

let thisNode;
let axiosInstance;

// When we `rememberNode` we also end up calling `rpcPing` so we don't
// want to remember nodes just because we pinged them.
function rpcPing( node ) {
  return new Promise( (resolve, reject) => {
    axiosInstance.get( `${node}/ping` )
      .then( (response) => {
        resolve(true);
      })
      .catch( (error) => {
        resolve(false);
      });
  });
}

function rpcFindNode( node, needle ) {
  return new Promise( (resolve, reject) => {
    axiosInstance.get( `${node}/nodes/${needle}` )
      .then( (response) => {
        rememberNode(node);
        resolve(response.data);
      })
      .catch( (error) => {
        console.log(error);
        resolve([]);
      });
  });
}

function rpcFindValue( node, key ) {
  return new Promise( (resolve, reject) => {
    axiosInstance.get( `${node}/keys/${key}` )
      .then( (response) => {
        rememberNode(node);
        resolve(response.data);
      })
      .catch( (error) => {
        console.log(error);
        resolve('');
      });
  });
}

function rpcStore( node, key, value ) {
  return new Promise( (resolve, reject) => {
    axiosInstance.put( `${node}/keys/${key}`, { data: value } )
      .then( (response) => {
        console.log(`asking dht@${node}[${key}] = ${value}`);
        rememberNode(node);
        resolve(response.data);
      })
      .catch( (error) => {
        resolve({});
      });
  });
}

function commonBits(a, b) {
  const m = Math.min(a.length, b.length);

  let i = 0;
  while (i < m) {
    if (a[i] != b[i]) break;
    i++;
  }

  if (i == m) return m * 8;

  let result = i * 8 + 8;
  let diffA = a[i];
  let diffB = b[i];

  while (diffA != diffB) {
    diffA >>= 1;
    diffB >>= 1;
    result--;
  }

  return result;
}

function keyhash( node ) {
  const hash = crypto.createHash('sha256');
  hash.update(node);
  return hash.digest('hex');
}

// this is a fake hash just for testing
function hash( node ) {
  const hash = crypto.createHash('sha256');
  hash.update(node);
  let b = hash.digest();
  for( let i = 2; i < b.length; i++ ) {
    b[i] = 0;
  }
  return b.toString('hex');
}

function prefixLength( a, b ) {
  return commonBits( Buffer.from(hash(a), 'hex'), Buffer.from(hash(b), 'hex') );
}

const requiredStrength = parseInt(process.env.DOENET_STRENGTH) || 0;

function isValid(node) {
  try {
    if (url.parse(node).host === null) {
      return false;
    }
  } catch (err) {
    return false;
  }
  
  const d = Math.floor(requiredStrength / 8);
  const r = requiredStrength % 8;
  const filter = ((1 << r) - 1);

  const digest = Buffer.from(hash(node), 'hex');
  
  for (let i = 0; i < d; i++) {
    if (digest[digest.length - i - 1] != 0) return false;
  }
  
  return (digest[digest.length - d - 1] & filter) == 0;
}

// this is called whenever I encounter a node
async function rememberNode(node) {
  // Only remember valid nodes
  if (! isValid(node)) {
    return;
  }
  
  let bucket = prefixLength(thisNode, node);
  let bucketKey = `bucket:${hash(thisNode)}:${bucket}`;

  // Check if the node was present in our routing table before
  let score = await client.zscore( bucketKey, node );
  if (score !== null) {
    // if the node is present, update it.
    client.zadd( bucketKey, Date.now(), node );              
  } else {
    // The node isn't present.
    
    let cardinality = await client.zcard(bucketKey);
    
    // if the node wasn't present, and the bucket isn't full, add it.
    if (cardinality < bucketSize) {
      client.zadd( bucketKey, Date.now(), node );
    } else {
      // if the node wasn't present, and the bucket is full, ping the
      // oldest -- and update the oldest if it responds, else add the new
      // node.
      let oldest = (await client.zpopmin( bucketKey ))[0];
      
      if (await rpcPing( oldest ))
        // the old server is still up, so update it
        client.zadd( bucketKey, Date.now(), oldest );
      else
        // The old server is dead -- add the new one.
        client.zadd( bucketKey, Date.now(), node );          
    }
  }
}

async function rememberCaller(req) {
  const node = req.get('Doenet-Node');

  // FIXME: verify that node is a URL
  if (node)
    rememberNode(node);
}

export function bootstrap(server) {
  thisNode = `http://localhost:${server.address().port}/dht`;
  
  if (process.env.DOENET_NODE) {
    thisNode = process.env.DOENET_NODE;
  }

  axiosInstance = axios.create({
    timeout: 1000,
    headers: {'Doenet-Node': thisNode }
  });

  if (process.env.DOENET_BOOTSTRAP) {
    for( let peer of process.env.DOENET_BOOTSTRAP.split(' ')) {
      rpcPing( peer ).then( (response) => {
        rememberNode( peer );
        rpcFindNode( peer, hash(thisNode) ).then( (nodes) => {
          for( let node of nodes ) {
            rpcPing( node ).then( (response) => {
              rememberNode( node );
            });
          }
        });
      });
    }
  }
}

export async function testFindNode(req, res, next) {
  let output = `<html><head><title>${thisNode}</title></head><body>`;
  let key = req.query.key;
  
  output += `<h1>${thisNode}</h1>`;
  output += `<p>looking up node ${key}</p>`;
  output += `<table>`;
  for (let node of (await nodeLookup( key ))) {
    let link = `<a href="${node}/status">${node}</a>`;
    output += `<tr><td>${link}</td><td>${hash(node)}</td></tr>`;
  }
  output += `</table>`;

  output += '</body>';
  res.status(200).contentType('text/html').send(output);
}

export async function testFindValue(req, res, next) {
  let output = `<html><head><title>${thisNode}</title></head><body>`;
  let key = keyhash(req.query.key);

  let value = await getItem( key );

  output += `<h1>${thisNode}</h1>`;
  output += `<h2>dht[${key}] = ${value}</h2>`;
  output += `<h2>my database</h2>`;
  output += `<table>`;
  
  for( let key of Object.keys(fakeDatabase) ) {
    output += `<tr><td>${key}</td><td>${fakeDatabase[key]}</td></tr>`;
  }
  output += `</table>`;

  output += '</body>';
  res.status(200).contentType('text/html').send(output);
}

export async function testStore(req, res, next) {
  let output = `<html><head><title>${thisNode}</title></head><body>`;
  let key = keyhash(req.query.key);
  let value = req.query.value;

  await setItem( key, value );

  output += `<h1>${thisNode}</h1>`;
  output += `<h2>dht[${key}] = ${value}</h2>`;  
  output += `<h2>my database</h2>`;
  output += `<table>`;
  
  for( let key of Object.keys(fakeDatabase) ) {
    output += `<tr><td>${key}</td><td>${fakeDatabase[key]}</td></tr>`;
  }
  output += `</table>`;

  output += '</body>';
  res.status(200).contentType('text/html').send(output);
}


export async function status(req, res, next) {
  try {
    rememberCaller(req);

    let buckets = [];
    let output = `<html><head><title>${thisNode}</title></head><body>`;
    output += `<h1>${thisNode}</h1>`;
    output += `<p>k = ${bucketSize}</p>`;
    output += `<p>alpha = ${concurrencyParameter}</p>`;
    output += `<p>strength = ${requiredStrength}</p>`;
    
    for( let bucket = 0; bucket < 256; bucket++ ) {
      buckets[bucket] = await client.zrange(`bucket:${hash(thisNode)}:${bucket}`, 0, -1 );
      if (buckets[bucket].length > 0) {
        output += `<h2>bucket ${bucket}</h2>`;
        output += '<table>';
        for( let b of buckets[bucket] ) {
          let link = `<a href="${b}/status">${b}</a>`;
          output += `<tr><td>${link}</td><td>${hash(b)}</td></tr>`;
        }
        output += '</table>';
      }
    }
    output += `<hr/>`
    output += `<h3>Find node</h3>`    
    output += `<form action="/test/find_node" method="get">`;
    output += `<input type="text" name="key">`;
    output += `<input type="submit" value="Submit">`;
    output += `</form>`;    

    output += `<hr/>`
    output += `<h3>Lookup key</h3>`    
    output += `<form action="/test/find_value" method="get">`;
    output += `<input type="text" name="key">`;
    output += `<input type="submit" value="Submit">`;
    output += `</form>`;    

    output += `<hr/>`
    output += `<h3>Store value</h3>`    
    output += `<form action="/test/store" method="get">`;
    output += `<input type="text" name="key">`;
    output += `<input type="text" name="value">`;
    output += `<input type="submit" value="Submit">`;
    output += `</form>`;    
    
    
    output += '</body>';
    
    res.status(200).contentType('text/html').send(output);
  } catch (error) {
    return next(error);
  }
}

export async function ping(req, res, next) {
  try {
    rememberCaller(req);
    res.status(200).send({ timestamp: Date.now() });
  } catch (error) {
    return next(error);
  }
}

async function* closestNodesToKey( key ) {
  let bucket = commonBits( Buffer.from(hash(thisNode), 'hex'),
                           Buffer.from(key, 'hex') );
  let nodes = [];

  while( bucket < 256 ) {
    let nodes = await client.zrange(`bucket:${hash(thisNode)}:${bucket}`, 0, -1);
    console.log(`@${thisNode} found ${nodes} in bucket ${bucket}`);
    yield* nodes;
    bucket++;
  }

  bucket = commonBits( Buffer.from(hash(thisNode), 'hex'),
                           Buffer.from(key, 'hex') );
  bucket--;
  
  while( bucket >= 0 ) {
    let nodes = await client.zrange(`bucket:${hash(thisNode)}:${bucket}`, 0, -1);
    console.log(`@${thisNode} found ${nodes} in bucket ${bucket}`);
    yield* nodes;
    bucket--;
  }
  
  return;
}

async function takeAsync(asyncIterable, count=Infinity) {
  const result = [];
  const iterator = asyncIterable[Symbol.asyncIterator]();
  while (result.length < count) {
    const {value,done} = await iterator.next();
    if (done) break;
    result.push(value);
  }
  return result;
}

// router.get('/nodes/:id', dht.findNode);
export async function findNode(req, res, next) {
  try {
    rememberCaller(req);

    const key = Buffer.from(req.params.id, 'hex').toString('hex');

    if (key.length != 64) {
      throw new Error('A node ID is 256-bits long');
    }

    let result = JSON.stringify(await takeAsync( closestNodesToKey(key), bucketSize ));
    res.contentType('application/vnd.doenet.nodes+json').send(result);
  } catch (error) {
    return next(error);
  }
}

let fake = {};
let fakeDatabase = {};
fake.get = async function( key ) {
  return new Promise((resolve, reject) => {
    setTimeout( function() {
      if (fakeDatabase[key])
        resolve(fakeDatabase[key]);
      else
        resolve(null);
    }, 250) 
  });
};
fake.set = async function( key, value ) {
  return new Promise((resolve, reject) => {
    setTimeout( function() {
      fakeDatabase[key] = value;
      resolve(1);
    }, 250) 
  });
};


// router.put('/keys/:key', dht.store);
export async function store(req, res, next) {
  try {
    rememberCaller(req);
    
    const key = Buffer.from(req.params.key, 'hex').toString('hex');

    if (key.length != 64) {
      throw new Error('Keys must be 256-bits long');
    }

    let stringified = JSON.stringify(req.body.data);
    
    if (stringified.length > 1024) {
      throw new Error('Unwilling to store more than 1kb of data in the DHT');
    }

    console.log(`setting dht@${thisNode}[${key}] = ${stringified}`);
    await client.set(`dht:${key}`, stringified, 'EX', 86400 * 7);
      
    res.status(200).send({});
  } catch (error) {
    return next(error);
  }    
}

// router.get('/keys/:key', dht.findValue);
export async function findValue(req, res, next) {
  try {
    rememberCaller(req);

    const key = Buffer.from(req.params.key, 'hex').toString('hex');

    if (key.length != 64) {
      res.status(500).send('Keys must be 256-bits long');
      return;
    }

    let value = await client.get(`dht:${key}`);

    if (value) {
      res.status(200).contentType('application/json').send(value);
    } else {
      findNode(req, res, next);
    }
  } catch (error) {
    next(error);
  }  
}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

async function nodeLookup(key) {
  function nearToKey(a,b) {
    let va = commonBits( Buffer.from(hash(a), 'hex'), Buffer.from(key,'hex') );
    let vb = commonBits( Buffer.from(hash(b), 'hex'), Buffer.from(key,'hex') );
    return - (va - vb);
  }
  
  let totalFetches = 0;

  let fetched = {};
  let fetches = [];
  let nodes = [];
  
  let concurrentCount = 0;
  for await (let node of closestNodesToKey( key )) {
    fetched[node] = true;
    console.log(`asking @${node} for ${key}`);
    fetches.push( rpcFindNode( node, key ) );
    concurrentCount++;
    totalFetches++;
    if (concurrentCount > concurrencyParameter) break;
  }

  for( ;; ) {
    let results = await Promise.all( fetches );
    nodes = nodes.concat(...results).filter( onlyUnique );
    let nodesToFetch = nodes.filter( (node) => !(fetched[node]) ).sort(nearToKey);
    
    if ((totalFetches >= bucketSize) || (nodesToFetch.length == 0)) {
      return nodes.sort(nearToKey).slice(0, bucketSize);
    }
    
    fetches = [];
    for( let node of nodesToFetch.slice(0, concurrencyParameter) ) {
      fetched[node] = true;
      fetches.push( rpcFindNode( node, key ) );
      totalFetches++;
    }
  }

  return [];
}

export async function setItem(key, value) {
  key = Buffer.from(key, 'hex').toString('hex');

  if (key.length != 64) {
    throw new Error('Keys must be 256-bits long');
    return undefined;
  }

  // Find the k closest nodes to key, and store the value there
  let count = 0;
  let puts = [];

  console.log(`Searching @${thisNode} for nodes near ${key}`);
  for (let node of (await nodeLookup( key ))) {
    console.log(`found node ${node}`);
    puts.push( rpcStore( node, key, value ) );
    count++;    
    if (count > bucketSize) break;
  }

  return await Promise.all(puts);
}

export async function getItem(key) {
  // FIXME this could be faster by properly using find_value 
  key = Buffer.from(key, 'hex').toString('hex');

  if (key.length != 64) {
    throw new Error('Keys must be 256-bits long');
    return undefined;
  }

  // Find the k closest nodes to key, and try to get the value there
  let count = 0;
  let puts = [];
  for (let node of (await nodeLookup( key ))) {
    puts.push( rpcFindValue( node, key ) );
    count++;    
    if (count > bucketSize) break;
  }

  return await Promise.all(puts);
}


// FIXME: also need to republish keys from time to time

