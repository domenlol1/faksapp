import React, { useEffect, useState } from "react";
import SpotifyLogin from "./SpotifyLogin.jsx";

export default function App() {
  const [token, setToken] = useState(null);
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      // Klic Firebase funkcije za pridobitev access tokena
      fetch(`https://us-central1-faksapp-35376630-47413.cloudfunctions.net/spotifyAuth?code=${code}`)
        .then(res => res.json())
        .then(data => {
          setToken(data.access_token);
          window.history.pushState({}, null, "/"); // odstrani ?code= iz URL
        });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setArtists(data.items));
  }, [token]);

  if (!token) return <SpotifyLogin />;

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">Tvoji top izvajalci 🎧</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map(artist => (
          <div key={artist.id} className="shadow-md p-4 rounded-xl bg-gray-100">
            <img
              src={artist.images[0]?.url}
              alt={artist.name}
              className="w-full rounded-lg mb-3"
            />
            <h2 className="font-semibold text-lg">{artist.name}</h2>
            <p className="text-sm text-gray-600">
              Žanri: {artist.genres.slice(0, 3).join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
