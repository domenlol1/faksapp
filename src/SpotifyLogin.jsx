import React from "react";

const CLIENT_ID = "8eafb21898ad4584a990e71f2e2327cc";
const REDIRECT_URI = "https://faksapp-35376630-47413.web.app/"; // npr. https://myapp.web.app/
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "code";

export default function SpotifyLogin() {
  const handleLogin = () => {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-top-read`;
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl mb-4 font-bold">Poveži se s Spotify</h1>
      <button
        onClick={handleLogin}
        className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600"
      >
        Prijava s Spotify
      </button>
    </div>
  );
}
