let name, connectedUser;
const connection = new WebSocket("ws://localhost:8888");

connection.onopen = () => {
  console.log("Connected to signaling server!");
};

// Handle all messages through this callback
connection.onmessage = message => {
  console.log("Got message: ", message.data);

  let data = JSON.parse(message.data);

  switch (data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onleave();
      break;
    default:
      break;
  }
};

connection.onerror = error => {
  console.log("Got error: ", error);
};

// Alias for sending message in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }
  connection.send(JSON.stringify(message));
}

// Page elements
const $loginPage = document.querySelector("#login-page"),
  $usernameInput = document.querySelector("#username"),
  $loginButton = document.querySelector("#login"),
  $theirUsernameInput = document.querySelector("#their-username"),
  $connectButton = document.querySelector("#connect"),
  $sharePage = document.querySelector("#share-page"),
  $sendButton = document.querySelector("#send"),
  $readyText = document.querySelector("#ready"),
  $statusText = document.querySelector("#status");

$sharePage.style.display = "none";
$readyText.style.display = "none";

// Login when the user click the button
$loginButton.addEventListener("click", () => {
  name = $usernameInput.value;

  if (name.length > 0) {
    send({
      type: "login",
      name: name
    });
  }
});

// Login message handler
function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    $loginPage.style.display = "none";
    $sharePage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
}

// Variables required to webrtc
let localConnection, dataChannel, currentFile, currentFileSize, currentFileMeta;

// Entry point to WebRTCPeerConnection
function startConnection() {
  if (hasRTCPeerConnection()) {
    setupPeerConnection();
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

// Prepare RTCPeerConnection object
function setupPeerConnection() {
  const configuration = {
    iceServers: [{ url: "stun:stun.1.google.com:19302 " }]
  };
  localConnection = new RTCPeerConnection(configuration, { optional: [] });
  console.log("RTCPeerConnection:", localConnection);

  // Setp ice handling
  localConnection.onicecandidate = event => {
    if (event.candidate) {
      console.log(event.candidate);
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  // Call to DataChannel
  openDataChannel();
}

// Prepare dataChannel object
function openDataChannel() {
  const dataChannelOptions = {
    ordered: true,
    reliable: true,
    negotiated: true,
    id: "myChannel"
  };
  dataChannel = localConnection.createDataChannel(dataChannelOptions);
  console.log("DataChannel: ", dataChannel);

  const handleDataChannelOpen = event => {
    console.log("Data Channel Open");
    $readyText.style.display = "inline-block";
  };

  const handleDataChannelError = error => {
    console.log("Data Channel Error: ", error);
  };

  const handleDataChannelMessageReceived = event => {
    // File receive code wil go here
  };

  const handleDataChannelClose = () => {
    $readyText.style.display = "none";
  };

  // DataChannel event handlers
  dataChannel.onopen = handleDataChannelOpen;
  dataChannel.onmessage = handleDataChannelMessageReceived;
  dataChannel.onerror = handleDataChannelError;
  dataChannel.onclose = handleDataChannelClose;
}

$connectButton.addEventListener("click", () => {
  let theirUsername = $theirUsernameInput.value;
  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

// Initiation of connection (you are inviter)
function startPeerConnection(user) {
  connectedUser = user;
  // Begin the offer
  localConnection.createOffer(
    offer => {
      send({
        type: "offer",
        offer: offer
      });
      localConnection.setLocalDescription(offer);
    },
    error => {
      alert("An error has occurred. " + error);
    }
  );
}

// If you are receiver invite to connection
function onOffer(offer, name) {
  connectedUser = name;
  localConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localConnection.createAnswer(
    answer => {
      localConnection.setLocalDescription(answer);

      send({
        type: "answer",
        answer: answer
      });
    },
    error => {
      alert("An error has occurred: " + error);
    }
  );
}

function onAnswer(answer) {
  localConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function onCandidate(candidate) {
  localConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function onleave() {
  connectedUser = null;
  localConnection.close();
  localConnection.onicecandidate = null;
  setupPeerConnection();
}

//                 Helper functions
/////////////////////////////////////////////////////////
function hasRTCPeerConnection() {
  window.RTCPeerConnection =
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection;
  window.RTCSessionDescription =
    window.RTCSessionDescription ||
    window.webkitRTCSessionDescription ||
    window.mozRTCSessionDescription;
  window.RTCIceCandidate =
    window.RTCIceCandidate ||
    window.webkitRTCIceCandidate ||
    window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}
function hasFileApi() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}
