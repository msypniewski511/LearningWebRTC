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
// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1
};

var yourVideo = document.querySelector("#yours"),
  theirVideo = document.querySelector("#theirs"),
  yourConnection,
  theirConnection;

if (hasUserMedia()) {
  navigator.getUserMedia(
    { video: true, audio: false },
    function(stream) {
      yourVideo.srcObject = stream;

      if (hasRTCPeerConnection()) {
        console.log("1 - Start connect");
        startPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    },
    function(error) {
      console.log(error);
    }
  );
} else {
  alert("Sorry, your browser does not support WebRTC.");
}

function startPeerConnection(stream) {
  const videoTrack = stream.getVideoTracks();
  console.log(videoTrack);
  var configuration = null;
  // {
  //   iceServers: [{ url: "stun:127.0.0.1:9876" }]
  // };
  yourConnection = new RTCPeerConnection(configuration);
  console.log("1a - Created local peer connection object localPeerConnection.");
  theirConnection = new RTCPeerConnection(configuration);
  console.log(
    "1b - Created remote peer connection object localPeerConnection."
  );

  // Setup ice handling
  // ----------------------------------------------------------------------//
  // The onicecandidate handler from step 1. is
  // called when network candidates become available.
  yourConnection.addEventListener("icecandidate", handleConnection);
  yourConnection.addEventListener(
    "iceconnectionstatechange",
    handleConnectionChange
  );
  theirConnection.addEventListener("icecandidate", handleConnection);
  theirConnection.addEventListener(
    "iceconnectionstatechange",
    handleConnectionChange
  );
  console.log("1c - Added event listeners to RTCPeerConections.");

  // Setup stream listening
  yourConnection.addStream(stream);
  console.log("2 - Added local stream to localPeerConnection.");
  theirConnection.addEventListener("addstream", function(event) {
    console.log("Added stream to remote connetion");
    theirVideo.srcObject = event.stream;
  });

  // yourConnection.onicecandidate = function(event) {
  //   if (event.candidate) {
  //     theirConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
  //   }
  // };

  // theirConnection.onicecandidate = function(event) {
  //   if (event.candidate) {
  //     yourConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
  //   }
  // };

  // Begin the offer
  console.log("5 - Strat SDP offer");
  yourConnection
    .createOffer(offerOptions)
    .then(createdOffer)
    .catch(err => {
      alert("During start SDP offer: " + err);
    });
}

// Connects with new peer candidate.
function handleConnection(event) {
  console.log("STEP 3 Network candidate become available. SIGNALING!!!");
  console.log("localPeerConnection object send serialized data to remote.");
  const peerCandidate = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    console.log("iceCandidate: " + iceCandidate.candidate);
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerCandidate);

    // Add candidate to remote peer description.
    console.log(
      "RemotePeerConnection object add the candidate to remote peer description"
    );
    otherPeer
      .addIceCandidate(newIceCandidate)
      .then(() => {
        console.log("Added candidate" + iceCandidate.candidate);
        // handleConnectionSuccess(peerConnection);
      })
      .catch(error => {
        // handleConnectionFailure(peerConnection, error);
      });
    // trace(`${getPeerName(peerConnection)} ICE candidate:\n` + `${event.candidate.candidate}.`);
  }
}

function handleConnectionChange(e) {
  const peerConnection = event.target;
  console.log("ICE state change event: ", event);
  console.log(e);
}

// Created offer
function createdOffer(description) {
  console.log(description.sdp);

  console.log("LocalPeerConnection setLocalDescription start.");
  yourConnection
    .setLocalDescription(description)
    .then(() => {
      console.log("2b - Set local description SDP success.");
    })
    .catch(err => {
      console.log("Blad w offer set local description" + err);
    });

  console.log("RemotePeerConnection setRemoteDescription start.");
  theirConnection
    .setRemoteDescription(description)
    .then(() => {
      console.log("2c - Set remote description SDP success");
    })
    .catch(err => {
      console.log("Blad w offer set remote description" + err);
    });

  console.log("remotePeerConnection createAnswer start.");
  theirConnection
    .createAnswer()
    .then(createdAnswer)
    .catch(err => {
      console.log("Blad w remotePeerConnection createAnswer start." + err);
    });
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
  console.log(`3 - Answer from remotePeerConnection:\n${description.sdp}.`);

  console.log("3a - remotePeerConnection setLocalDescription start.");
  theirConnection
    .setLocalDescription(description)
    .then(() => {
      console.log("3a - remotePeerConnection setLocalDescription success.");
    })
    .catch(err => {
      console.log("3a - remotePeerConnection setLocalDescription error." + err);
    });

  console.log("3b - localPeerConnection setLocalDescription start.");
  yourConnection
    .setRemoteDescription(description)
    .then(() => {
      console.log("3b - localPeerConnection setRemoteDescription success.");
    })
    .catch(err => {
      console.log("3b - localPeerConnection setRemoteDescription error." + err);
    });
}

// Define helper functions.

// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
  return peerConnection === yourConnection ? theirConnection : yourConnection;
}
