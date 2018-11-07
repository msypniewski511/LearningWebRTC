let name, connectedUser, yourConnection, stream;
const $loginPage = document.getElementById("login-page"),
  $callPage = document.getElementById("call-page"),
  $usernameInput = document.getElementById("username"),
  $theirUsernameInput = document.getElementById("their-username"),
  $loginButton = document.getElementById("login"),
  $callButton = document.getElementById("call"),
  $hangUpButton = document.getElementById("hang-up"),
  $yourVide = document.getElementById("yours"),
  $theirsVideo = document.getElementById("theirs");

$callPage.style.display = "none";

const connection = new WebSocket("ws://localhost:8888");

connection.onopen = function() {
  console.log("Connected");
};

// Handle all messages throughthis callback
connection.onmessage = message => {
  console.log("Got message", message.data);

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
      onLeave();
      break;
    default:
      break;
  }
};

connection.onerror = error => {
  console.log("Got error ", error);
};

// Alias for sedning messages in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }

  connection.send(JSON.stringify(message));
}

// --------------------------------------------------------//
// Login when the user clicks the button
$loginButton.addEventListener("click", e => {
  name = $usernameInput.value;

  if (name.length > 0) {
    send({
      type: "login",
      name: name
    });
  }
});

function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    $loginPage.style.display = "none";
    $callPage.style.display = "block";

    // Get the plumbing ready for a call
    startConnection();
  }
}

function startConnection() {
  if (hasUserMedia()) {
    navigator.getUserMedia(
      { video: true, audio: false },
      myStream => {
        stream = myStream;
        $yourVide.srcObject = stream;
        if (hasRTCPeerConnection()) {
          setUpPeerConnection(stream);
        } else {
          alert("Sorry, your browser does not support WebRTC.");
        }
      },
      error => {
        console.log(error);
      }
    );
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

function setUpPeerConnection(stream) {
  let configuration = {
    iceServers: [{ url: "stun:stun.1.google.com:19302" }]
  };
  yourConnection = new RTCPeerConnection(configuration);
  console.log(yourConnection);

  // Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = e => {
    $theirsVideo.srcObject = e.stream;
  };

  // Setp ice handling
  yourConnection.onicecandidate = e => {
    console.log(e.candidate);
    if (e.candidate) {
      send({
        type: "candidate",
        candidate: e.candidate
      });
    }
  };
}

// Initiating call
// Now that we have set everything up properly, we are ready to initiate a call with a
// remote user. Sending the offer to another user starts all this. Once a user gets the
// offer , he/she will create a response and start trading ICE candidates, until he/
// she successfully connects.

$callButton.addEventListener("click", e => {
  alert("Click");
  let theirUsername = $theirUsernameInput.value;
  if (theirUsername.length > 0) {
    startPeerConnection(theirUsername);
  }
});

function startPeerConnection(user) {
  connectedUser = user;

  // Begin offer
  yourConnection.createOffer(
    offer => {
      send({
        type: "offer",
        offer: offer
      });
      yourConnection.setLocalDescription(offer);
    },
    error => {
      console.log(error);
      alert("An error has occurred " + error);
    }
  );
}

// Get offer
function onOffer(offer, name) {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

  yourConnection.createAnswer(
    answer => {
      yourConnection.setLocalDescription(answer);
      send({
        type: "answer",
        answer: answer
      });
    },
    error => {
      alert("An error has occurred " + error);
    }
  );
}

function onAnswer(answer) {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function onCandidate(candidate) {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Hanging up a call
$hangUpButton.addEventListener("click", e => {
  send({
    type: "leave"
  });

  onLeave();
});

function onLeave() {
  connectedUser = null;
  $theirsVideo.srcObject = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  setUpPeerConnection(stream);
}

// Helper functions
function hasUserMedia() {
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

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
