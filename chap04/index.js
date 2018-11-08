const WebSocketServer = require("ws").Server,
  wss = new WebSocketServer({
    port: 8888
  }),
  users = {};

wss.on("connection", connection => {
  connection.on("message", message => {
    let data;

    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Error parsing JSON" + e);
      data = {};
    }

    switch (data.type) {
      case "login":
        console.log("User logged in as", data.name);
        // If user name is logged already.
        if (users[data.name]) {
          sendTo(connection, {
            type: "login",
            success: false
          });
        } else {
          users[data.name] = connection;
          connection.name = data.name;
          sendTo(connection, {
            type: "login",
            success: true
          });
        }
        break;

      // Initiating a call
      // Making a offer
      case "offer":
        console.log("Sending offer to :", data.name);
        // Get connection of the user we are trying to call
        conn = users[data.name];
        // Check user existence
        if (conn != null) {
          // Add other user name property to ours connection
          connection.otherName = data.name;
          sendTo(conn, {
            type: "offer",
            offer: data.offer,
            name: connection.name
          });
        }
        break;

      // Answering a call
      case "answer":
        console.log("Sending answer to: ", data.name);
        conn = users[data.name];

        if (conn != null) {
          connection.otherName = data.name;
          sendTo(conn, {
            type: "answer",
            answer: data.answer
          });
        }
        break;

      // Handling ICE candiates
      case "candidate":
        console.log("Sending candidate to: ", data.name);
        conn = users[data.name];

        if (conn != null) {
          sendTo(conn, {
            type: "candidate",
            candidate: data.candidate
          });
        }
        break;

      // Hanging up call
      case "leave":
        console.log("Disconnecting user from: ", data.name);
        conn = users[data.name];
        conn.otherName = null;

        if (conn != null) {
          sendTo(conn, {
            type: "leave"
          });
        }
        break;

      default:
        sendTo(connection, {
          type: "error",
          message: "Unrecognaized command: " + data.type
        });
        break;
    }
  });

  // clean up client connections when they disconnect
  connection.on("close", () => {
    if (connection.name) {
      delete users[connection.name];

      if (connection.otherName) {
        console.log("Disconnecting user from ", connection.otherName);
        conn = users[connection.otherName];
	if(conn.otherName) {
        	conn.otherName = null;
	}
        if (conn != null) {
          sendTo(conn, {
            type: "leave"
          });
        }
      }
    }
  });
});

// Helper functions

function sendTo(conn, message) {
  conn.send(JSON.stringify(message));
}
wss.on("listening", () => {
  console.log("Server started on port:8888...");
});
