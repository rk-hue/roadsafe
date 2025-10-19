import pandas as pd
import json
from datetime import datetime

df = pd.read_csv("reports.csv")

print("\nraw data:")
print(df.head())


if 'timestamp' in df.columns:
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

    df['hour'] = df['timestamp'].dt.hour
    df['weekday'] = df['timestamp'].dt.day_name()
    df['month'] = df['timestamp'].dt.month

if 'location' in df.columns and isinstance(df['location'][0], dict):
    df['latitude'] = df['location'].apply(lambda x: x.get('latitude'))
    df['longitude'] = df['location'].apply(lambda x: x.get('longitude'))

df = df.drop(columns=[col for col in df.columns if isinstance(df[col][0], dict) or isinstance(df[col][0], list)], errors='ignore')

print("df columns:", df.columns.tolist())

cols_to_check = [col for col in ['latitude', 'longitude', 'timestamp'] if col in df.columns]

if cols_to_check:
    df = df.dropna(subset=cols_to_check, how='any')
else:
    print("lat, lng, timestape not found")


print("\ncleaned data shape:", df.shape)
print(df.head())

# Save to cleaned CSV
df.to_csv("cleaned_reports.csv", index=False)
print("\ncleaned data saved to cleaned_reports.csv")