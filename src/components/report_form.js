import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

const WEATHER_API_KEY = '6862ae0671e10a322eefafcd55b3034b'; // 🔑 Replace this with your actual OpenWeatherMap API key

const ReportForm = () => {
  const { userLocation } = useAppContext();
  const [animalType, setAnimalType] = useState('');
  const [status, setStatus] = useState('alive'); // 'alive' or 'dead'

  const handleSubmit = async () => {
    if (!animalType || !userLocation) {
      alert('Please select an animal and ensure your location is available.');
      return;
    }

    try {
      // 1. Fetch weather data from OpenWeatherMap
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const weatherData = await weatherRes.json();

      const weather = {
        temp: weatherData.main?.temp,
        condition: weatherData.weather?.[0]?.main,
        description: weatherData.weather?.[0]?.description,
      };

      // 2. Build the report with time data
      const now = new Date();
      const jsDay = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
      const weekday = jsDay === 0 ? 7 : jsDay; // Convert Sunday (0) → 7

      const report = {
        type: animalType,
        location: userLocation,
        time: now.toISOString(),
        hour: now.getHours(),           // 0–23
        dayOfWeek: weekday,             // 1=Mon ... 7=Sun
        month: now.getMonth() + 1,      // 1–12
        status,
        weather,
      };

      console.log('Submitting report:', report);

      // 3. Submit to Firestore — choose collection based on status
      const targetCollection = status === 'dead' ? 'deadReports' : 'aliveReports';
      await addDoc(collection(db, targetCollection), report);

      alert(`✅ Report submitted to "${targetCollection}" successfully!`);
      console.log(`✅ Report saved to Firestore collection "${targetCollection}".`);

      // 4. Reset form
      setAnimalType('');
      setStatus('alive');
    } catch (e) {
      console.error('❌ Error adding document:', e.message || e);
      alert('❌ Error submitting report. Check console for details.');
    }
  };

  return (
    <div>
      <h2>Report Wildlife Hazard</h2>

      <div>
        <p>Select an animal:</p>
        <button onClick={() => setAnimalType('deer')} className={animalType === 'deer' ? 'selected' : ''}>🦌 Deer</button>
        <button onClick={() => setAnimalType('raccoon')} className={animalType === 'raccoon' ? 'selected' : ''}>🦝 Raccoon</button>
        <button onClick={() => setAnimalType('opossum')} className={animalType === 'opossum' ? 'selected' : ''}>🦡 Opossum</button>
        <button onClick={() => setAnimalType('squirrel')} className={animalType === 'squirrel' ? 'selected' : ''}>🐿 Squirrel</button>
      </div>

      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
        </select>
      </div>

      <br />

      <button onClick={handleSubmit}>📍 Submit Report</button>
    </div>
  );
};

export default ReportForm;
