import React, { useEffect, useState, useCallback } from "react";
import SpotifyLogin from "./SpotifyLogin.jsx";
import { db } from './FirebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import './App.css';

const ADMIN_EMAIL = 'domenkola@gmail.com';

export default function App() {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  
  const [timeRange, setTimeRange] = useState('medium_term');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('artists');

  const [pendingEmails, setPendingEmails] = useState([]);
  const isAdmin = userProfile?.email === ADMIN_EMAIL;

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('spotify_token');
    setUserProfile(null);
    setArtists([]);
    setTracks([]);
    setGenres([]);
    setRecentlyPlayed([]);
    setPlaylists([]);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setSearchQuery("");
    setSearchResults(null);
    setError(null);
    setActiveView('artists');
    setLoading(false);
  }, []);

  const fetchData = useCallback(async (url, formatter) => {
      if (!token) return null;
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
          setError("Network error. Please check your connection.");
          return null;
      }
  }, [token, logout]);

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
    
    const [profile, topArtists, topTracks, recentTracks, userPlaylists] = await Promise.all([
        fetchData("https://api.spotify.com/v1/me", data => data),
        fetchData(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=10`, data => data.items || []),
        fetchData(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=10`, data => data.items || []),
        fetchData("https://api.spotify.com/v1/me/player/recently-played?limit=50", data => data.items || []),
        fetchData("https://api.spotify.com/v1/me/playlists?limit=50", data => data.items || [])
    ]);

    if (profile) setUserProfile(profile);
    if (topArtists) {
        setArtists(topArtists);
        setGenres([...new Set(topArtists.flatMap(artist => artist.genres))]);
    }
    if (topTracks) setTracks(topTracks);
    if (recentTracks) setRecentlyPlayed(recentTracks);
    if (userPlaylists) setPlaylists(userPlaylists);

    setLoading(false);
  }, [token, timeRange, fetchData]);

  useEffect(() => {
    if (token) {
      fetchSpotifyData();
    }
  }, [token, fetchSpotifyData]);

  const handlePlaylistClick = async (playlist) => {
      if (selectedPlaylist?.id === playlist.id) {
          setSelectedPlaylist(null);
          setPlaylistTracks([]);
      } else {
          setLoading(true);
          setSelectedPlaylist(playlist);
          const tracksData = await fetchData(playlist.tracks.href, data => (data.items || []).map(item => item.track).filter(Boolean));
          if (tracksData) {
              setPlaylistTracks(tracksData);
          }
          setLoading(false);
      }
  };

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

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'pending_users'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const emails = [];
        querySnapshot.forEach((doc) => {
          emails.push({ id: doc.id, ...doc.data() });
        });
        setPendingEmails(emails);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleDeleteEmail = async (id) => {
    try {
      await deleteDoc(doc(db, 'pending_users', id));
    } catch (error) {
      console.error('Error deleting email: ', error);
    }
  };

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
                                  <span className="track-release-date">{track.album.release_date}</span>
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
                       <span className="track-release-date">{track.album.release_date}</span>
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
                                           <span className="track-release-date">{track.album.release_date}</span>
                                      </li>
                                  ))}
                          </ul>
                      ) : <p>Ni mogoče naložiti zgodovine predvajanja.</p>}
                  </div>
              );
            case 'playlists':
                return (
                    <div>
                        <h2 className="content-title">Tvoji Seznami Predvajanja</h2>
                        {playlists.length > 0 ? (
                            <ul className="list">
                                {playlists.map(playlist => (
                                    <li key={playlist.id} className={`list-item playlist-item ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`} onClick={() => handlePlaylistClick(playlist)}>
                                        <img src={playlist.images[0]?.url} alt={playlist.name} className="list-item-image" />
                                        <div className="track-details">
                                            <p className="track-name">{playlist.name}</p>
                                            <p className="track-artist">{playlist.tracks.total} pesmi</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Nimate nobenih seznamov predvajanja.</p>}
                        {selectedPlaylist && (
                            <div className="playlist-tracks-section">
                                <h3>Pesmi v: {selectedPlaylist.name}</h3>
                                {loading ? <p className="loading">Nalaganje pesmi...</p> : 
                                  playlistTracks.length > 0 ? (
                                      <ul className="list">
                                          {playlistTracks.map((track, index) => (
                                              track && <li key={track.id + index} className="list-item">
                                                  <span className="list-item-index">{index + 1}.</span>
                                                  <img src={track.album?.images[0]?.url} alt={track.name} className="list-item-image" />
                                                  <div className="track-details">
                                                      <p className="track-name">{track.name}</p>
                                                      <p className="track-artist">{track.artists.map(a => a.name).join(', ')}</p>
                                                  </div>
                                                  <span className="track-release-date">{track.album.release_date}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  ) : <p>Ta seznam predvajanja je prazen.</p>
                                }
                            </div>
                        )}
                    </div>
                );
        case 'admin':
          return (
            <div>
              <h2 className="content-title">Čakajoči uporabniki</h2>
              {pendingEmails.length > 0 ? (
                <ul className="admin-list">
                  {pendingEmails.map(email => (
                    <li key={email.id} className="admin-list-item">
                      <span>{email.email}</span>
                      <button onClick={() => handleDeleteEmail(email.id)} className="delete-button">
                        Dodaj in zbriši
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p>Ni čakajočih uporabnikov.</p>}
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
        <button onClick={() => { setSearchQuery(''); setActiveView('playlists'); setSelectedPlaylist(null); }} className={activeView === 'playlists' && !searchQuery ? 'active' : ''}>
          Seznami predvajanja
        </button>
        {isAdmin && (
          <button onClick={() => { setSearchQuery(''); setActiveView('admin'); }} className={activeView === 'admin' && !searchQuery ? 'active' : ''}>
            Administrator
          </button>
        )}
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
