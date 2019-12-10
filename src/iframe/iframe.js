function hex(buffer) {
  let digest = '';
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // We use getUint32 to reduce the number of iterations (notice the `i += 4`)
    const value = view.getUint32(i);
    // toString(16) will transform the integer into the corresponding hex string
    // but will remove any initial "0"
    const stringValue = value.toString(16);
    // One Uint32 element is 4 bytes or 8 hex chars (it would also work with 4
    // chars for Uint16 and 2 chars for Uint8)
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    digest += paddedValue;
  }

  return digest;
}

function sha256(str) {
  const buffer = new TextEncoder('utf-8').encode(str);
  return crypto.subtle.digest('SHA-256', buffer).then((hash) => hex(hash));
}

function isJSON(s) {
  try {
    JSON.parse(s);
  } catch (e) {
    return false;
  }
  return true;
}

function getsetProgress(verb, event, parameters, hash) {
  const xhr = new XMLHttpRequest();

  const url = `/learners/me/worksheets/${hash}/progress`;
  xhr.open(verb, url);

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const body = JSON.parse(xhr.responseText);
        if (body && body.score) {
          event.source.postMessage({
            message: 'setProgress',
            parameters: { score: body.score },
          }, event.origin);
        }
      } catch (err) {
        throw new Error(`doenet iframe: ${err}`);
      }
    } else {
      throw new Error(`doenet iframe: Request failed to ${url} with status ${xhr.status}`);
    }
  };

  if (verb == 'PUT') {
    if (typeof parameters.score !== 'number') {
      throw new Error('doenet iframe: expecting score to be a number');
    }

    if (typeof parameters.title !== 'string') {
      throw new Error('doenet iframe: expecting window.title to be a string');
    }
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      score: parameters.score,
      url: parameters.worksheet,
      title: parameters.title,
    }));
  } else {
    xhr.send();
  }
}

function setProgress(event, parameters, hash) {
  getsetProgress('PUT', event, parameters, hash);
}

function getProgress(event, parameters, hash) {
  getsetProgress('GET', event, parameters, hash);
}

function recordStatement(event, parameters, hash) {
  const xhr = new XMLHttpRequest();

  const url = `/learners/me/worksheets/${hash}/statements`;
  xhr.open('POST', url);

  xhr.onload = function () {
    if (xhr.status !== 200) {
      throw new Error(`doenet iframe: Request failed to ${url} with status ${xhr.status}`);
    }
  };

  if (typeof parameters.statement !== 'string') {
    throw new Error('doenet iframe: expecting statement to be a string');
  }

  if (isJSON(parameters.statement)) {
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(parameters.statement);
  } else {
    throw new Error('doenet iframe: expecting statement to be JSON');
  }
}

function getLocalGlobalState(isLocal, event, parameters, hash) {
  const xhr = new XMLHttpRequest();

  if (typeof parameters.uuid !== 'string') {
    throw new Error('doenet iframe: expecting UUID to be a string');
  }

  const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  if (parameters.uuid.match(v4) === null) {
    throw new Error('doenet iframe: expecting UUID to be an RFC4122 version 4 UUID');
  }

  let url = `/worksheets/${hash}/state/${parameters.uuid}`;
  if (isLocal) url = `/learners/me${url}`;

  xhr.open('GET', url);

  xhr.onload = function () {
    if (xhr.status !== 200) {
      throw new Error(`doenet iframe: Request failed to ${url} with status ${xhr.status}`);
    } else {
      try {
        const body = JSON.parse(xhr.responseText);
        console.log(`doenet iframe: body = ${xhr.responseText}`);
        event.source.postMessage({
          message: isLocal ? 'setState' : 'setGlobalState',
          parameters: {
            state: body,
          },
        }, event.origin);
      } catch (err) {
        throw new Error(`doenet iframe: ${err}`);
      }
    }
  };

  xhr.send();
}

function patchLocalGlobalState(isLocal, event, parameters, hash) {
  const xhr = new XMLHttpRequest();

  if (typeof parameters.uuid !== 'string') {
    throw new Error('doenet iframe: expecting UUID to be a string');
  }

  const v4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
  if (parameters.uuid.match(v4) === null) {
    throw new Error('doenet iframe: expecting UUID to be an RFC4122 version 4 UUID');
  }

  let url = `/worksheets/${hash}/state/${parameters.uuid}`;
  if (isLocal) url = `/learners/me${url}`;

  xhr.open('PATCH', url);

  xhr.onload = function () {
    if (xhr.status !== 200) {
      // One common error is that the server could not apply the patch for some reason; we request the full state
      if (xhr.status === 204) {
        // we do nothing, because the received patch was empty so we are up to date
      } else if (xhr.status === 422) {
        getLocalGlobalState(isLocal, event, parameters, hash);
      } else {
        throw new Error(`doenet iframe: Request failed to ${url} with status ${xhr.status} ${xhr.responseText}`);
      }
    } else {
      try {
        const body = JSON.parse(xhr.responseText);
        event.source.postMessage({
          message: isLocal ? 'patchState' : 'patchGlobalState',
          parameters: {
            delta: body,
            checksum: xhr.getResponseHeader('Doenet-Shadow-Checksum'),
          },
        }, event.origin);
      } catch (err) {
        throw new Error(`doenet iframe: ${err}`);
      }
    }
  };

  if (typeof parameters.checksum !== 'string') {
    throw new Error('doenet iframe: expecting checksum to be a string');
  }

  if (parameters.checksum.match(new RegExp(/^[0-9A-F]{40}$/i)) === null) {
    throw new Error('doenet iframe: expecting checksum to be 40 hex digits');
  }

  xhr.setRequestHeader('Doenet-Shadow-Checksum', parameters.checksum);

  if (parameters.delta) {
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(parameters.delta));
  } else {
    // Sending an empty patch
    xhr.send('');
  }
}

function patchState(event, parameters, hash) {
  return patchLocalGlobalState(true, event, parameters, hash);
}
function getState(event, parameters, hash) {
  return getLocalGlobalState(true, event, parameters, hash);
}
function patchGlobalState(event, parameters, hash) {
  return patchLocalGlobalState(false, event, parameters, hash);
}
function getGlobalState(event, parameters, hash) {
  return getLocalGlobalState(false, event, parameters, hash);
}

const messages = {
  setProgress,
  getProgress,
  recordStatement,
  getState,
  patchState,
  getGlobalState,
  patchGlobalState,
};

function receiveMessage(event) {
  // "Having verified identity, however, you still should always
  // verify the syntax of the received message."
  if (event.data.parameters === undefined) {
    throw new Error('doenet iframe: expecting parameters in postMessage');
  }
  if (event.data.parameters.worksheet === undefined) {
    throw new Error('doenet iframe: expecting parameters.worksheet in postMessage');
  }

  // `new URL` is supported on everything but Internet Explorer
  const worksheetURL = new URL(event.data.parameters.worksheet);
  const originURL = new URL(event.origin);

  // "Two URLs have the same origin if the protocol, port (if
  // specified), and host are the same for both."
  if (worksheetURL.protocol !== originURL.protocol) {
    throw new Error('doenet iframe: protocol differs between event.data.parameters.worksheet and event.origin');
  }
  if (worksheetURL.hostname !== originURL.hostname) {
    throw new Error('doenet iframe: hostname differs between event.data.parameters.worksheet and event.origin');
  }
  if (worksheetURL.port !== originURL.port) {
    throw new Error('doenet iframe: port differs between event.data.parameters.worksheet and event.origin');
  }

  sha256(event.data.parameters.worksheet).then((hash) => {
    if (hash) {
      if (event.data.message) {
        if (messages[event.data.message]) {
          (messages[event.data.message])(event, event.data.parameters, hash);
        } else {
          throw new Error(`doenet iframe: Unknown message ${event.data.message}`);
        }
      }
    } else {
      throw new Error('doenet iframe: could not hash url');
    }
  }).catch((err) => {
    throw new Error(`doenet iframe: sha256 error: ${err}`);
  });
}

window.addEventListener('message', receiveMessage, false);
