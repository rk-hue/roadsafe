import joblib
import pandas as pd
import numpy as np

try:
    model = joblib.load('hotspot_model.pkl')
    print("model loaded")
    print("classes:", model.classes_)

    expected_features = [
        'latitude', 'longitude', 'month', 'hour', 'day', 'severity',
        'weather_3.0', 'weather_4.0', 'weather_5.0', 'weather_6.0', 'weather_7.0',
        'weather_10.0', 'weather_98.0', 'weather_99.0',
        'road_cond_2', 'road_cond_3', 'road_cond_6', 'road_cond_7', 'road_cond_8',
        'road_cond_9', 'road_cond_98', 'road_cond_99',
        'season_spring', 'season_summer', 'season_winter'
    ]

    def predict_hotspot(latitude, longitude, hour, dayofweek, month):

        input_dict = {feature: 0 for feature in expected_features}

        input_dict['latitude'] = latitude
        input_dict['longitude'] = longitude
        input_dict['hour'] = hour
        input_dict['day'] = dayofweek
        input_dict['month'] = month

        input_df = pd.DataFrame([input_dict], columns=expected_features)

        print("input df:\n", input_df)

        prediction = model.predict(input_df)[0]
        probs = model.predict_proba(input_df)[0]

        if len(probs) == 1:
            probability = 1.0 if model.classes_[0] == 1 else 0.0
        else:
            probability = probs[1]

        return prediction, probability

    if __name__ == "__main__":
        lat = 40.0868
        lng = -75.7005
        hour = 18
        dayofweek = 2
        month = 6

        pred, prob = predict_hotspot(lat, lng, hour, dayofweek, month)

        print(f"\nlocation: ({lat}, {lng})")
        print(f"time: Hour={hour}, Day={dayofweek}, Month={month}")
        print(f"hotspot: {'Yes' if pred == 1 else 'No'} (Probability: {prob:.2f})")

except Exception as e:
    print("error:", e)
