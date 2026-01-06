import React, { useState } from 'react';
import './SpotifyLogin.css'; // Import the CSS file
import { db } from './FirebaseConfig'; // Import firestore instance
import { collection, addDoc } from 'firebase/firestore';

const Popup = ({ message, onClose }) => (
  <div className="popup-overlay">
    <div className="popup-content">
      <p>{message}</p>
      <button onClick={onClose} className="popup-close-button">Zapri</button>
    </div>
  </div>
);

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

  const [email, setEmail] = useState('');
  const [popup, setPopup] = useState({ visible: false, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        await addDoc(collection(db, 'pending_users'), {
          email: email,
          timestamp: new Date(),
        });
        setPopup({ visible: true, message: 'Hvala! Vaš zahtevek je bil poslan v odobritev.' });
        setEmail('');
      } catch (error) {
        console.error('Napaka pri shranjevanju e-pošte: ', error);
        setPopup({ visible: true, message: 'Prišlo je do napake. Poskusite znova.' });
      }
    }
  };

  const closePopup = () => {
    setPopup({ visible: false, message: '' });
  }

  return (
    <div className="login-container">
      {popup.visible && <Popup message={popup.message} onClose={closePopup} />}

      <h1>Dobrodošli!</h1>
      <p>Prijavite se s Spotify računom za dostop do vaše glasbene statistike.</p>
      <a href={loginUrl} className="login-button">PRIJAVI SE S SPOTIFY</a>
      
      <div className="first-time-user">
        <h2>Nov uporabnik?</h2>
        <p>Vnesite svoj Spotify e-naslov, da vam odobrimo dostop.</p>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Vaš Spotify e-naslov"
            className="email-input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="submit-button">Zahtevaj dostop</button>
        </form>
      </div>
    </div>
  );
}
