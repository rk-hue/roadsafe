'''
first df:

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
'''

import pandas as pd

df = pd.read_csv("deer_crashes_final.csv")
print("data loaded")

df["season"] = df["month"].map({
    12: "winter", 1: "winter", 2: "winter",
    3: "spring", 4: "spring", 5: "spring",
    6: "summer", 7: "summer", 8: "summer",
    9: "fall", 10: "fall", 11: "fall"
})

df = pd.get_dummies(df, columns=["weather", "road_cond", "light_cond", "season"], drop_first=True)

df.drop(columns=["CRN", "year"], inplace=True)

print("final columns:", df.columns.tolist())
print(f"total rows: {len(df)}")

df.to_csv("features_for_training.csv", index=False)
print("saved features to features_for_training.csv")
