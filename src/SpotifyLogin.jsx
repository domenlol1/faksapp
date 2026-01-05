import React from 'react';
import './SpotifyLogin.css'; // Import the CSS file

export default function SpotifyLogin() {
  const CLIENT_ID = "8eafb21898ad4584a990e71f2e2327cc";
  const REDIRECT_URI = "https://faksapp-35376630-47413.web.app/"; 
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "code";
  const SCOPES = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-recently-played"
  ].join(" ");

  const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}&show_dialog=true`;

  return (
    <div className="login-container">
      <h1>Dobrodošel v svoji Spotify statistiki</h1>
      <p>Za ogled svojih statistik se moraš prijaviti v Spotify.</p>
      <a href={loginUrl} className="login-button">PRIJAVI SE S SPOTIFY</a>
    </div>
  );
}
