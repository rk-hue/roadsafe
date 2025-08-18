import React from "react";

const PredictHotspot = () => {
  const handlePredict = async () => {
    try {
      const response = await fetch("https://roadsafe-app.onrender.com/predict_hotspot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060,
          road_type: "highway",
          speed_limit: 55,
          weather: "clear",
          time_of_day: "night",
          animal_type: "deer",
        }),
      });

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();
      console.log("Hotspot Prediction:", data.prediction);
      alert(`Predicted Risk: ${data.prediction}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Prediction failed. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button onClick={handlePredict} style={{ padding: "0.5rem 1rem" }}>
        Predict Hotspot Risk
      </button>
    </div>
  );
};

export default PredictHotspot;
