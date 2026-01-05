import React, { useEffect, useState, useCallback } from "react";
import SpotifyLogin from "./SpotifyLogin.jsx";
import './App.css';

export default function App() {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  
  const [globalTracks, setGlobalTracks] = useState([]);
  const [globalArtists, setGlobalArtists] = useState([]);
  const [globalGenres, setGlobalGenres] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  
  const [timeRange, setTimeRange] = useState('medium_term');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('artists');

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('spotify_token');
    setUserProfile(null);
    setArtists([]);
    setTracks([]);
    setGenres([]);
    setRecentlyPlayed([]);
    setGlobalTracks([]);
    setGlobalArtists([]);
    setGlobalGenres([]);
    setSearchQuery("");
    setSearchResults(null);
    setError(null);
    setActiveView('artists');
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('spotify_token');
    const code = new URLSearchParams(window.location.search).get("code");

    if (storedToken) {
      setToken(storedToken);
    } else if (code) {
      fetch(`https://us-central1-faksapp-35376630-47413.cloudfunctions.net/spotifyAuth?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token);
            setToken(data.access_token);
          } else {
            setError("Authentication failed. Please try again.");
            setLoading(false);
          }
          window.history.pushState({}, null, "/");
        })
        .catch(() => {
            setError("Failed to connect to the server.");
            setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, []);

  const fetchSpotifyData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const fetchData = async (url, formatter) => {
        try {
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (response.status === 401) {
                logout();
                return null;
            }
            if (!response.ok) {
                console.error(`Request failed for ${url} with status: ${response.status}`);
                return null;
            }
            const data = await response.json();
            return formatter(data);
        } catch (err) {
            console.error(`Failed to fetch from ${url}:`, err);
            return null;
        }
    };
    
    const [profile, topArtists, topTracks, recentTracks] = await Promise.all([
        fetchData("https://api.spotify.com/v1/me", data => data),
        fetchData(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=10`, data => data.items || []),
        fetchData(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10`, data => data.items || []),
        fetchData("https://api.spotify.com/v1/me/player/recently-played?limit=50", data => data.items || []),
    ]);

    if (profile) setUserProfile(profile);
    if (topArtists) {
        setArtists(topArtists);
        setGenres([...new Set(topArtists.flatMap(artist => artist.genres))]);
    }
    if (topTracks) setTracks(topTracks);
    if (recentTracks) setRecentlyPlayed(recentTracks);

    const globalPlaylistId = '37i9dQZEVXbMDoHDwVN2tF';
    const globalTracksData = await fetchData(`https://api.spotify.com/v1/playlists/${globalPlaylistId}/tracks?limit=10`, data => (data.items || []).map(item => item.track).filter(Boolean));

    if (globalTracksData && globalTracksData.length > 0) {
        setGlobalTracks(globalTracksData);
        const artistIds = [...new Set(globalTracksData.flatMap(track => track.artists.map(artist => artist.id)))].slice(0, 50);
        
        if (artistIds.length > 0) {
            const artistsDetails = await fetchData(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, data => data.artists || []);
            if (artistsDetails) {
                const validArtists = artistsDetails.filter(Boolean);
                setGlobalArtists(validArtists);
                setGlobalGenres([...new Set(validArtists.flatMap(artist => artist.genres))]);
            }
        }
    }

    setLoading(false);
  }, [token, logout, timeRange]);

  useEffect(() => {
    if (token) {
      fetchSpotifyData();
    }
  }, [token, fetchSpotifyData]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(null);
      return;
    }
    const handleSearch = async () => {
      if (!token) return;
      try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist,track&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { if (response.status === 401) logout(); throw new Error('Search failed.'); }
        const data = await response.json();
        setSearchResults(data);
      } catch (err) { console.error(err); }
    };
    const debounceTimeout = setTimeout(() => { handleSearch(); }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, token, logout]);

  if (!token && !loading) return <SpotifyLogin />;

  const renderTimeRangeSelector = () => (
    <div className="time-range-selector">
      <button onClick={() => setTimeRange('short_term')} className={timeRange === 'short_term' ? 'active' : ''}>
        Zadnje 4 tedne
      </button>
      <button onClick={() => setTimeRange('medium_term')} className={timeRange === 'medium_term' ? 'active' : ''}>
        Zadnjih 6 mesecev
      </button>
      <button onClick={() => setTimeRange('long_term')} className={timeRange === 'long_term' ? 'active' : ''}>
        Ves čas
      </button>
    </div>
  );

  const renderContent = () => {
    if (loading && !userProfile) return <p className="loading">Nalaganje podatkov...</p>;
    if (error) return <p className="error">{error}</p>;

    if (searchResults) {
      return (
          <div>
              <h2 className="content-title">Rezultati Iskanja za "{searchQuery}"</h2>
              <div className="search-results-section">
                  <h3>Najdene Pesmi</h3>
                  {searchResults.tracks?.items.length > 0 ? (
                      <ul className="list">
                          {searchResults.tracks.items.map(track => (
                              <li key={track.id} className="list-item">
                                  <img src={track.album.images[0]?.url} alt={track.name} className="list-item-image" />
                                  <div className="track-details">
                                      <p className="track-name">{track.name}</p>
                                      <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : <p>Nobena pesem ne ustreza iskanju.</p>}
              </div>
              <div className="search-results-section">
                  <h3>Najdeni Izvajalci</h3>
                  {searchResults.artists?.items.length > 0 ? (
                      <ul className="list">
                          {searchResults.artists.items.map(artist => (
                              <li key={artist.id} className="list-item">
                                  <img src={artist.images[0]?.url} alt={artist.name} className="list-item-image artist-image" />
                                  <span className="list-item-name">{artist.name}</span>
                              </li>
                          ))}
                      </ul>
                  ) : <p>Noben izvajalec ne ustreza iskanju.</p>}
              </div>
          </div>
      );
    }

    switch (activeView) {
        case 'artists':
          return (
            <div>
              <h2 className="content-title">Tvoji Top 10 Izvajalci</h2>
              {renderTimeRangeSelector()}
              {artists.length > 0 ? (
                <ul className="list">
                  {artists.map((artist, index) => (
                    <li key={artist.id} className="list-item">
                      <span className="list-item-index">{index + 1}.</span>
                      <img src={artist.images[0]?.url} alt={artist.name} className="list-item-image artist-image" />
                      <span className="list-item-name">{artist.name}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>Ni mogoče naložiti tvojih top izvajalcev.</p>}
            </div>
          );
        case 'tracks':
          return (
            <div>
              <h2 className="content-title">Tvoje Top 10 Pesmi</h2>
              {renderTimeRangeSelector()}
              {tracks.length > 0 ? (
                <ul className="list">
                  {tracks.map((track, index) => (
                     <li key={track.id} className="list-item">
                       <span className="list-item-index">{index + 1}.</span>
                       <img src={track.album.images[0]?.url} alt={track.name} className="list-item-image" />
                       <div className="track-details">
                         <p className="track-name">{track.name}</p>
                         <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
                       </div>
                     </li>
                  ))}
                </ul>
              ) : <p>Ni mogoče naložiti tvojih top pesmi.</p>}
            </div>
          );
        case 'genres':
          return (
            <div>
              <h2 className="content-title">Tvoji Top Žanri</h2>
              {renderTimeRangeSelector()}
              {genres.length > 0 ? (
                <div className="genre-list">
                  {genres.slice(0, 10).map(genre => (
                    <li key={genre} className="genre-item">
                      {genre}
                    </li>
                  ))}
                </div>
              ) : <p>Ni mogoče naložiti tvojih top žanrov.</p>}
            </div>
          );
          case 'recently-played':
              return (
                  <div>
                      <h2 className="content-title">Nazadnje Predvajano</h2>
                      {recentlyPlayed.length > 0 ? (
                          <ul className="list">
                              {recentlyPlayed
                                  .filter(item => item.track) 
                                  .map(({ track, played_at }) => (
                                      <li key={played_at + track.id} className="list-item">
                                          <img src={track.album?.images[0]?.url} alt={track.name} className="list-item-image" />
                                          <div className="track-details">
                                              <p className="track-name">{track.name}</p>
                                              <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
                                          </div>
                                          <span className="played-at">{new Date(played_at).toLocaleString()}</span>
                                      </li>
                                  ))}
                          </ul>
                      ) : <p>Ni mogoče naložiti zgodovine predvajanja.</p>}
                  </div>
              );
          case 'global':
              return (
                  <div>
                      <h2 className="content-title">Globalne Lestvice</h2>
                      <div className="global-section">
                          <h3>Top 10 Pesmi na Svetu</h3>
                          {globalTracks.length > 0 ? (
                              <ul className="list">
                                  {globalTracks.map((track, index) => (
                                      <li key={track.id} className="list-item">
                                          <span className="list-item-index">{index + 1}.</span>
                                          <img src={track.album.images[0]?.url} alt={track.name} className="list-item-image" />
                                          <div className="track-details">
                                              <p className="track-name">{track.name}</p>
                                              <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                          ) : <p>Globalne pesmi trenutno niso na voljo.</p>}
                      </div>
                      <div className="global-section">
                          <h3>Top 10 Izvajalcev na Svetu</h3>
                          {globalArtists.length > 0 ? (
                               <ul className="list">
                                  {globalArtists.slice(0, 10).map((artist, index) => (
                                  <li key={artist.id} className="list-item">
                                      <span className="list-item-index">{index + 1}.</span>
                                      <img src={artist.images[0]?.url} alt={artist.name} className="list-item-image artist-image" />
                                      <span className="list-item-name">{artist.name}</span>
                                  </li>
                                  ))}
                              </ul>
                          ) : <p>Globalni izvajalci trenutno niso na voljo.</p>}
                      </div>
                      <div className="global-section">
                          <h3>Top 10 Žanrov na Svetu</h3>
                          {globalGenres.length > 0 ? (
                               <div className="genre-list">
                                  {globalGenres.slice(0, 10).map(genre => (
                                    <li key={genre} className="genre-item">
                                      {genre}
                                    </li>
                                  ))}
                              </div>
                          ) : <p>Globalni žanri trenutno niso na voljo.</p>}
                      </div>
                  </div>
              );
        default:
            return null;
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Tvoja Spotify Statistika</h1>
        <div className="profile-section">
          {userProfile && (
            <>
              <img src={userProfile.images[0]?.url} alt="Profile" className="profile-image" />
              <span className="profile-name">{userProfile.display_name}</span>
            </>
          )}
          <button onClick={logout} className="logout-button">
            Odjava
          </button>
        </div>
      </header>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Išči pesmi ali izvajalce..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <nav className="navigation">
        <button onClick={() => { setSearchQuery(''); setActiveView('artists'); }} className={activeView === 'artists' && !searchQuery ? 'active' : ''}>
          Izvajalci
        </button>
        <button onClick={() => { setSearchQuery(''); setActiveView('tracks'); }} className={activeView === 'tracks' && !searchQuery ? 'active' : ''}>
          Pesmi
        </button>
        <button onClick={() => { setSearchQuery(''); setActiveView('genres'); }} className={activeView === 'genres' && !searchQuery ? 'active' : ''}>
          Žanri
        </button>
        <button onClick={() => { setSearchQuery(''); setActiveView('recently-played'); }} className={activeView === 'recently-played' && !searchQuery ? 'active' : ''}>
          Nedavno Predvajano
        </button>
        <button onClick={() => { setSearchQuery(''); setActiveView('global'); }} className={activeView === 'global' && !searchQuery ? 'active' : ''}>
          Globalno
        </button>
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
