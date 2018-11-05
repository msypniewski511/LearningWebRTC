const constraints = {
  video: {
    mandatory: {
      minWidth: 640,
      minHeight: 480
    }
  },
  audio: false
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
    audio: false
  };
}

const $video = document.querySelector("video");
const $canvas = document.querySelector("canvas");

let streaming = false;
const filters = ["", "grayscale", "sepia", "invert"];
let currentFilter = 0;

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
      $video.srcObject = stream;
      streaming = true;
    },
    err => {
      alert("Raised an error when capturing:", err);
    }
  );
  document.querySelector("#capture").addEventListener("click", capturToCanvas);
  $canvas.addEventListener("click", changeFilter);
} else {
  alert("Sorry, your browser does not support getUserMedia.");
}

function capturToCanvas() {
  if (streaming) {
    $canvas.width = $video.videoWidth;
    $canvas.height = $video.videoHeight;
    const context = $canvas.getContext("2d");
    context.drawImage($video, 0, 0);

    context.fillStyle = "white";
    context.fillText("Hello World!", 50, 50);
  }
}
function changeFilter() {
  currentFilter++;
  if (currentFilter > filters.length - 1) currentFilter = 0;
  $canvas.className = filters[currentFilter];
}
