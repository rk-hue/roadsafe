import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

const WEATHER_API_KEY = '6862ae0671e10a322eefafcd55b3034b';

const ReportForm = () => {
  const { userLocation } = useAppContext();
  const [animalType, setAnimalType] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!animalType || !userLocation) {
      alert('Please select an animal and ensure your location is available.');
      return;
    }

    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const weatherData = await weatherRes.json();

      const weather = {
        temp: weatherData.main?.temp,
        condition: weatherData.weather?.[0]?.main,
        description: weatherData.weather?.[0]?.description,
      };

      const now = new Date();
      const jsDay = now.getDay();
      const weekday = jsDay === 0 ? 7 : jsDay;

      const report = {
        type: animalType,
        location: userLocation,
        time: now.toISOString(),
        hour: now.getHours(),
        dayOfWeek: weekday,
        month: now.getMonth() + 1,
        status,
        weather,
      };

      console.log('Submitting report:', report);

      const targetCollection = status === 'dead' ? 'deadReports' : 'aliveReports';
      await addDoc(collection(db, targetCollection), report);

      alert(`Report submitted to "${targetCollection}" successfully!`);
      console.log(`Report saved to Firestore collection "${targetCollection}".`);

      setAnimalType('');
      setStatus('alive');
    } catch (e) {
      console.error('Error adding document:', e.message || e);
      alert('Error submitting report. Check console for details.');
    }
  };

  return (
    <div className="report-container">
      <h2>Report Wildlife Hazard</h2>
      <p>Select An Animal</p>

      <div className="animal-buttons">
        <button onClick={() => setAnimalType('deer')} className={animalType === 'deer' ? 'selected' : ''}>🦌 Deer</button>
        <button onClick={() => setAnimalType('bird')} className={animalType === 'bird' ? 'selected' : ''}>🐦 Bird</button>
        <button onClick={() => setAnimalType('bigRodent')} className={animalType === 'bigRodent' ? 'selected' : ''}>🦝 Raccoon, Groundhog, etc.</button>
        <button onClick={() => setAnimalType('smallRodent')} className={animalType === 'smallRodent' ? 'selected' : ''}>🐿 Small Rodent</button>
        <button onClick={() => setAnimalType('dogOrCat')} className={animalType === 'dogOrCat' ? 'selected' : ''}>🐕 Dog/Cat</button>
        <button onClick={() => setAnimalType('other')} className={animalType === 'other' ? 'selected' : ''}>Other</button>
      </div>

      <div className="status-select">
        <p>Status of the animal:</p>
        <div className="status-buttons">
          <button
            onClick={() => setStatus('alive')}
            className={`status-button ${status === 'alive' ? 'selected' : ''}`}
          >
            Alive
          </button>
          <button
            onClick={() => setStatus('dead')}
            className={`status-button ${status === 'dead' ? 'selected' : ''}`}
          >
            Dead
          </button>
        </div>
      </div>

      <button onClick={handleSubmit} className="submit-button">📍 Submit Report</button>

    </div>
  );
};

export default ReportForm;