let name, connectedUser, yourConnection, stream, dataChannel;
const $loginPage = document.getElementById("login-page"),
  $callPage = document.getElementById("call-page"),
  $usernameInput = document.getElementById("username"),
  $theirUsernameInput = document.getElementById("their-username"),
  $loginButton = document.getElementById("login"),
  $callButton = document.getElementById("call"),
  $hangUpButton = document.getElementById("hang-up"),
  $yourVide = document.getElementById("yours"),
  $theirsVideo = document.getElementById("theirs");

// Data channel elements
const $received = document.getElementById("received"),
  $sendButton = document.getElementById("send"),
  $messageInput = document.getElementById("message");

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

  openDataChannel();

  // /////////////////////////////////////////////////////////////

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

  // openDataChannel();
}

// ////////////////////////////////
///////////////////////////////
////////////////////////////
function openDataChannel() {
  // /////////////////////////////////////////////////////

  const handleDataChannelOpen = event => {
    console.log("dataChannel.OnOpen", event);
    let message = "Hello";
    let val = JSON.stringify({
      origin: name,
      message: message
    });
    sendChannel.send(val);
  };

  const handleDataChannelMessageReceived = event => {
    console.log("Got Data Channel Message: ", event);
    let data = JSON.parse(event.data);
    $received.innerHTML += data.origin + ": " + data.message + "<br />";
    $received.scrollTop = $received.scrollHeight;
  };

  const handleDataChannelError = error => {
    console.log("dataChannel.OnError:", error);
  };

  const handleDataChannelClose = event => {
    console.log("dataChannel.OnClose", event);
  };

  let sendChannel = yourConnection.createDataChannel("text", {});
  sendChannel.onopen = handleDataChannelOpen;
  sendChannel.onmessage = handleDataChannelMessageReceived;
  sendChannel.onerror = handleDataChannelError;
  sendChannel.onclose = handleDataChannelClose;

  yourConnection.ondatachannel = event => {
    console.log("on data channel");
    let receiveChannel = event.channel;
    receiveChannel.onopen = handleDataChannelOpen;
    receiveChannel.onmessage = handleDataChannelMessageReceived;
    receiveChannel.onerror = handleDataChannelError;
    receiveChannel.onclose = handleDataChannelClose;

    $sendButton.addEventListener("click", function(event) {
      let message = $messageInput.value;

      let val = JSON.stringify({
        origin: name,
        message: message
      });
      $received.innerHTML += name + ": " + message + "<br />";
      $received.scrollTop = $received.scrollHeight;
      receiveChannel.send(val);
    });
  };
}

//////////////////////////////////////////
//////////////////////////////////////////
////////////////////////////////////////

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

// -------------------- Data channel -----------------------------------------------//
// function openDataChanel() {
//   alert("w gowniw");
//   const dataChannelOptions = {
//     optional: [{ RtpDataChannels: true }],
//     reliable: true
//   };

//   dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);
//   console.log(dataChannel);
//   // This listener will catch any connection issues detected.
//   dataChannel.onerror = err => {
//     console.log("Data Channel Error: ", error);
//   };

//   // This listener will receive messages from the other user.
//   dataChannel.onmessage = event => {
//     alert("message");
//     console.log("Got Data Channel Message: ", event.data);

//     $received.innerHTML += "recv: " + event.data + "<br />";
//     $received.scrollTop = $received.scrollHeight;
//   };

//   // This listener will tell us when the other user has connected.
//   dataChannel.onopen = () => {
//     alert("Connected");
//     dataChannel.send(name + " has connected");
//   };

//   // This listener will tell us when the other user disconnects.
//   dataChannel.onclose = () => {
//     console.log("The Data Channel is Closed!");
//   };
// }

// // bind our text input and received rea
// $sendButton.addEventListener("click", e => {
//   let val = $messageInput.value;
//   $received.innerHTML += "send: " + val + "<br/>";
//   $received.scrollTop = $received.scrollHeight;
//   dataChannel.send(val);
// });
