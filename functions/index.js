const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cors = require("cors")({ origin: true });

const client_id = "8eafb21898ad4584a990e71f2e2327cc";
const client_secret = "7c86202ad9a74cf4aedaa3d8599cfb6e";
const redirect_uri = "https://faksapp-35376630.web.app/"; // npr. https://myapp.web.app/

exports.spotifyAuth = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const code = req.query.code;
    if (!code) {
      res.status(400).send("Missing authorization code.");
      return;
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        res.json(data);
      } else {
        res.status(response.status).json(data);
      }
    } catch (error) {
      functions.logger.error("Error exchanging Spotify code.", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
