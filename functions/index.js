const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cors = require("cors")({ origin: true });

const CLIENT_ID = "8eafb21898ad4584a990e71f2e2327cc";
const CLIENT_SECRET = functions.config().spotify.secret;
const REDIRECT_URI = "https://faksapp-35376630-47413.web.app/";

exports.spotifyAuth = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { code } = req.query;
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("code", code);
    body.append("redirect_uri", REDIRECT_URI);

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
        body: body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${errorText}`);
      }

      const data = await response.json();
      res.send(data);
    } catch (error) {
      functions.logger.error("Error authenticating with Spotify:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});
