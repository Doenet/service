# A Distributed Hash Table

The below is an HTTP-based riff on Kademlia.

Requests and responses to any of the endpoints below also include
`Doenet-Node:` which is a URL to the Doenet node's DHT endpoint.  This
URL is converted to a node ID by computing the sha256 of its URL.
This must end in `DOENET_STRENGTH` many zero bits to be accepted on
Doenet.  This prevents nodes from freely choosing their ID (to prevent
an eclipse attack) and prevents an adversary from producing very large
numbers of nodes (to prevent a sybil attack).  This suggestion is
based off S/Kademlia.

## Environment variables

`DOENET_NODE` is the url for the node.

`DOENET_STRENGTH` is the number of zero bits required for a node ID to
be accepted on the network.  In particular, sha256 of `DOENET_NODE`
must end in `DOENET_STRENGTH` zero bits.

`DOENET_BOOTSTRAP` is a space-separated list of URLs which may be used
to bootstrap our node.

`DOENET_K` is the size of the k-buckets.  This defaults to 20.

`DOENET_ALPHA` is the desired concurrency parameter.  This defaults to 3.

## RPC endpoints

These endpoints are relative to `DOENET_NODE`.  For instance, in order to satisfy the `DOENET_STRENGTH` requirement, the server hosted at doenet.cloud may use the base `https://doenet.cloud/557935472` because as verified by
```
echo -ne https://doenet.cloud/557935472 | sha256sum
```
this URL ends with many zero bits.  One can ping this server via <https://doenet.cloud/557935472/ping>.

### GET /status

Some information about the status of the network.  Currently this
dumps information about the routing table.

### GET /ping

Verify that a Doenet node is alive.  This is used to update the
routing table, i.e., to decide whether to keep an long-running server
in the bucket, or to replace it with a newly seen node.

### GET /nodes/:id

This is Kademlia's `FIND_NODE`.  The `:id` is a 64-byte (hex-encoded)
node id.

The response is a JSON array of the `k` nodes with their `id` closest
to the given `id`, with each node represented by its URL.  The
`content-type` is `application/vnd.doenet.nodes+json`.

### PUT /keys/:key
=======
`DOENET_K` is the size of the k-buckets.

`DOENET_ALPHA` is the desired concurrency parameter.

## RPC endpoints

### GET /:name/status

Some information about the status of the network.

### GET /:name/ping

Verify that a Doenet node is alive.

### GET /:name/nodes/:id

This is Kademlia's `FIND_NODE`.  The `:id` is a 64-byte (hex-encoded) node id.

The response is a JSON array of the `k` nodes with their `id` closest
to the given `id`, with each node represented by its URL.

The `content-type` is `application/vnd.doenet.nodes+json`.

### PUT /:name/keys/:key

Store the request body (probably encoded as JSON) at the given `:key`,
which is a 64-byte (hex-encoded) id.

### GET /keys/:key

If there is previousy `PUT` content at the given key, return it with
content-type `application/json`.  Otherwise this amounts to a `GET
/nodes/:id`.

## Redis representation

The 256 buckets are stored as sorted sets.  Bucket `n` for node with
id `id` is stored with key `bucket:id:n` with the score being the
last-seen time.

`dht:key` stores the content.
