const functions = require("firebase-functions");
const fetch = require("node-fetch");

const client_id = "8eafb21898ad4584a990e71f2e2327cc";
const client_secret = "7c86202ad9a74cf4aedaa3d8599cfb6e";
const redirect_uri = "https://faksapp-35376630.web.app/"; // npr. https://myapp.web.app/

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
