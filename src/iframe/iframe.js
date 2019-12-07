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
      const body = JSON.parse(xhr.responseText);
      if (body && body.score) {
        event.source.postMessage({
          message: 'setProgress',
          parameters: { score: body.score },
        }, event.origin);
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

const messages = {
  setProgress,
  getProgress,
  recordStatement,
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
