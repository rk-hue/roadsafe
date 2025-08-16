'''
import pandas as pd

# === Load Deer Crash Data ===
print("📦 Loading cleaned deer crash data...")
df = pd.read_csv("C:/Users/rk092/OneDrive/Desktop/Rishika's Folder/RoadSafe Application/animal_crashes_cleaned.csv")

# === Drop Rows Without Location Info (just in case) ===
df = df.dropna(subset=["LATITUDE", "LONGITUDE"])

# === Select and Rename Relevant Columns ===
df = df[[
    "CRN", "DEC_LATITUDE", "DEC_LONGITUDE", "CRASH_YEAR", "CRASH_MONTH", 
    "HOUR_OF_DAY", "DAY_OF_WEEK", "WEATHER1", "ROAD_CONDITION", "ILLUMINATION", 
    "MAX_SEVERITY_LEVEL"
]].rename(columns={
    "DEC_LATITUDE": "latitude",
    "DEC_LONGITUDE": "longitude",
    "CRASH_YEAR": "year",
    "CRASH_MONTH": "month",
    "DAY_OF_WEEK": "day",
    "HOUR_OF_DAY": "hour",
    "WEATHER1": "weather",
    "ROAD_CONDITION": "road_cond",
    "ILLUMINATION": "light_cond",
    "MAX_SEVERITY_LEVEL": "severity"
})

# === Save the Final Clean File ===
df.to_csv("deer_crashes_final.csv", index=False)
print(f"✅ Saved deer crash data with {len(df)} records.")
'''

import pandas as pd

# === Load Cleaned Deer Crash Data ===
print("📥 Loading data...")
df = pd.read_csv("deer_crashes_final.csv")

# === Create Season Feature from Month ===
df["season"] = df["month"].map({
    12: "winter", 1: "winter", 2: "winter",
    3: "spring", 4: "spring", 5: "spring",
    6: "summer", 7: "summer", 8: "summer",
    9: "fall", 10: "fall", 11: "fall"
})

# === One-hot Encode Categorical Columns ===
df = pd.get_dummies(df, columns=["weather", "road_cond", "light_cond", "season"], drop_first=True)

# === Drop Columns We Don't Need ===
df.drop(columns=["CRN", "year"], inplace=True)

# === Final Output Check ===
print("✅ Final columns:", df.columns.tolist())
print(f"✅ Total rows: {len(df)}")

# === Save Feature Dataset ===
df.to_csv("features_for_training.csv", index=False)
print("✅ Saved features to features_for_training.csv")
