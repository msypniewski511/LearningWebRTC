const constraints = {
  video: {
    mandatory: {
      minWidth: 640,
      minHeight: 480
    }
  },
  audio: true
};
if (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|OperaMini/i.test(
    navigator.userAgent
  )
) {
  // The user is using a mobile device, lower or minimum resolution
  constraints = {
    video: {
      mandatory: {
        minWidth: 480,
        minHeight: 320,
        maxWidth: 1024,
        maxHeight: 768
      }
    },
    audio: true
  };
}

// Check browser compatbility
function hasUserMedia() {
  return !!(
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );
}

if (hasUserMedia()) {
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  navigator.getUserMedia(
    // {
    //   video: {
    //     mandatory: {
    //       minAspectRatio: 1.777,
    //       maxAspectRatio: 1.778
    //     },
    //     optional: [{ maxWidth: 640 }, { maxHeight: 480 }]
    //   },
    //   audio: true
    // },
    constraints,
    stream => {
      const $video = document.querySelector("video");
      $video.srcObject = stream;
    },
    err => {
      alert("Raised an error when capturing:", err);
    }
  );
} else {
  alert("Sorry, your browser does not support getUserMedia.");
}
