import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [reports, setReports] = useState([]);

  return (
    <AppContext.Provider value={{ userLocation, setUserLocation, reports, setReports }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);