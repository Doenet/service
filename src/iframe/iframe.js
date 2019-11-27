function setProgress( event, parameters ) {
  var xhr = new XMLHttpRequest();

  xhr.open('PUT', '/learners/me/progress');
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      var body = JSON.parse(xhr.responseText);
      if (body && body.score)
        window.parent.postMessage(body.score, parameters.worksheet);
    }
    else {
      console.log('Request failed.  Returned status of ' + xhr.status);
    }
  };

  xhr.setRequestHeader('X-Doenet-Referer', parameters.worksheet);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({score: parameters.score,
                           title: parameters.title}));
}

function getProgress( event, parameters ) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', '/learners/me/progress');
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      var body = JSON.parse(xhr.responseText);
      if (body && body.score)
        window.parent.postMessage(body.score, parameters.worksheet);
    }
    else {
      console.log('Request failed.  Returned status of ' + xhr.status);
    }
  };

  xhr.setRequestHeader('X-Doenet-Referer', parameters.worksheet)
  xhr.send();
}

var messages = {
  setProgress: setProgress,
  getProgress: getProgress
};

function receiveMessage(event) {
  // BADBAD: verify that event.origin matches pevent.data.parameters.worksheet
  
  if (event.data.message) {
    if (messages[event.data.message]) {
      (messages[event.data.message]) ( event, event.data.parameters );
    } else {
      console.log( "Unknown message ", event.data.message );
    }
  }
}

window.addEventListener("message", receiveMessage, false);
