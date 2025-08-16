import pandas as pd
import json
from datetime import datetime

# Load JSON file
df = pd.read_csv("reports.csv")

# Show first few rows
print("\n🔍 Preview of raw data:")
print(df.head())

# --- CLEANING STEPS ---

# Convert timestamp fields if they exist
if 'timestamp' in df.columns:
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

    # Extract time-based features (optional)
    df['hour'] = df['timestamp'].dt.hour
    df['weekday'] = df['timestamp'].dt.day_name()
    df['month'] = df['timestamp'].dt.month

# Flatten nested fields if any
# For example, flatten location: { latitude: ..., longitude: ... }
if 'location' in df.columns and isinstance(df['location'][0], dict):
    df['latitude'] = df['location'].apply(lambda x: x.get('latitude'))
    df['longitude'] = df['location'].apply(lambda x: x.get('longitude'))

# Drop unnecessary or complex fields (like full user object or image blobs)
df = df.drop(columns=[col for col in df.columns if isinstance(df[col][0], dict) or isinstance(df[col][0], list)], errors='ignore')

print("Columns in dataframe:", df.columns.tolist())

# Drop rows with missing location or timestamp only if columns exist
cols_to_check = [col for col in ['latitude', 'longitude', 'timestamp'] if col in df.columns]

if cols_to_check:
    df = df.dropna(subset=cols_to_check, how='any')
else:
    print("Warning: None of the columns latitude, longitude, or timestamp found.")

# --- OUTPUT ---

print("\n✅ Cleaned data shape:", df.shape)
print(df.head())

# Save to cleaned CSV
df.to_csv("cleaned_reports.csv", index=False)
print("\n📁 Cleaned data saved to cleaned_reports.csv")