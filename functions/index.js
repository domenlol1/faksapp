const functions = require("firebase-functions");
const fetch = require("node-fetch");

const client_id = "YOUR_SPOTIFY_CLIENT_ID";
const client_secret = "YOUR_SPOTIFY_CLIENT_SECRET";
const redirect_uri = "YOUR_FIREBASE_HOSTING_URL"; // npr. https://myapp.web.app/

exports.spotifyAuth = functions.https.onRequest(async (req, res) => {
  const code = req.query.code;
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
    }),
  });

  const data = await response.json();
  res.json(data);
});
