// Check browser compatibilty.
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
  return !!window.RTCPeerConnection;
}

if (!hasUserMedia) {
  alert("Your's browser doesn't support getUserMedia!!!");
}
if (!hasRTCPeerConnection) {
  alert("Your's browser doesn't support RTCPeerConnection!!!");
}

// ////////////////////////////////////////////////////////////
const $yourVideo = document.getElementById("yours"),
  $theirVideo = document.getElementById("theirs");
let yourConnection, theirConnection;

if (hasUserMedia) {
  navigator.getUserMedia(
    { video: true, audio: false },
    stream => {
      $yourVideo.srcObject = stream;
      if (hasRTCPeerConnection) {
        alert("It has RTCPeerConnection");
        startPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    },
    err => {
      alert("Sorry, we failed to capture your camera, please try again.");
    }
  );
} else {
  alert("Sorry, your browser does not support WebRTC.");
}

function startPeerConnection(stream) {
  console.log(stream);
  const configuration = {
    // Uncomment this code to add custom iceServers
    iceServers: [{ url: "stun:stun.1.google.com:19302" }]
  };
  yourConnection = new webkitRTCPeerConnection(configuration);
  console.log(yourConnection);
  theirConnection = new webkitRTCPeerConnection(configuration);
  console.log(theirConnection);

  // Setup stream listening
  yourConnection.addStream(stream);
  console.log(yourConnection);
  theirConnection.onaddstream = e => {
    $theirVideo.src = window.URL.createObjectURL(e.stream);
    alert("Dodalem stream");
  };

  // Setup ice handling
  yourConnection.onicecandidate = event => {
    console.log("cojest");
    if (event.candidate) {
      theirConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  };

  theirConnection.onicecandidate = event => {
    if (event.candidate) {
      yourConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  };

  // Begin the offer
  yourConnection.createOffer(offer => {
    yourConnection.setLocalDescription(offer);

    console.log(yourConnection);
    theirConnection.setRemoteDescription(offer);
    console.log(yourConnection);
    theirConnection.createAnswer(offer => {
      theirConnection.setLocalDescription(offer);
      yourConnection.setRemoteDescription(offer);
    });
  });
}
