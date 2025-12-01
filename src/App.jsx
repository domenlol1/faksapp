import React, { useEffect, useState } from "react";
import SpotifyLogin from "./SpotifyLogin.jsx";

export default function App() {
  const [token, setToken] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      // Klic Firebase funkcije za pridobitev access tokena
      fetch(`https://us-central1-faksapp-35376630-47413.cloudfunctions.net/spotifyAuth?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setToken(data.access_token);
          } else {
            setError("Authentication failed. Please try again.");
          }
          window.history.pushState({}, null, "/"); // odstrani ?code= iz URL
        })
        .catch(() => setError("Failed to connect to the server."));
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchTopArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "An unknown error occurred with the Spotify API.");
        }

        const data = await response.json();
        
        if (data && Array.isArray(data.items)) {
          setArtists(data.items);
        } else {
          setArtists([]); 
        }

      } catch (err) {
        setError(err.message);
        console.error("Error fetching artists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopArtists();
  }, [token]);

  if (!token) return <SpotifyLogin />;

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">Tvoji top izvajalci 🎧</h1>
      
      {loading && <p className="text-lg">Loading your top artists...</p>}
      
      {error && <p className="text-red-500 mt-10">Error: {error}</p>}
      
      {!loading && !error && artists.length > 0 && (
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
      )}

      {!loading && !error && artists.length === 0 && (
          <p className="text-gray-500 mt-10">
              We couldn\'t find your top artists. Try listening to some more music on Spotify!
          </p>
      )}
    </div>
  );
}
