import pandas as pd
import matplotlib.pyplot as plt
import json

# === Step 1: Load your report data ===
df = pd.read_csv('reports.csv')  # Make sure this file is in the same folder

# === Step 2: Parse JSON string in 'location' column ===
df['location'] = df['location'].apply(json.loads)

# === Step 3: Extract latitude and longitude ===
df['latitude'] = df['location'].apply(lambda loc: loc['lat'])
df['longitude'] = df['location'].apply(lambda loc: loc['lng'])

# === Step 4: Drop rows with missing coordinates (if any) ===
df = df.dropna(subset=['latitude', 'longitude'])

# === Step 5: Plot raw report locations ===
plt.figure(figsize=(10, 6))
plt.scatter(df['longitude'], df['latitude'], alpha=0.6, color='green')
plt.title("All Reported Wildlife Locations")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.grid(True)
plt.show()

# === Step 6: Create 1km x 1km grid bins ===
df['lat_bin'] = (df['latitude'] * 100).astype(int)
df['lon_bin'] = (df['longitude'] * 100).astype(int)

# === Step 7: Count reports per grid cell ===
hotspot_counts = df.groupby(['lat_bin', 'lon_bin']).size().reset_index(name='count')

# === Step 8: Define and filter hotspots (adjust threshold as needed) ===
threshold = 1  # Change to 5+ later for stricter hotspot filtering
hotspots = hotspot_counts[hotspot_counts['count'] >= threshold]

# === Step 9: Print summary ===
print(f"\nTotal grid cells: {len(hotspot_counts)}")
print(f"Hotspot cells (count ≥ {threshold}): {len(hotspots)}")
print(hotspots.head())

# === Step 10: Plot hotspot areas ===
plt.figure(figsize=(10, 6))
plt.scatter(hotspots['lon_bin'] / 100, hotspots['lat_bin'] / 100,
            c=hotspots['count'], cmap='hot', s=100, edgecolors='k')
plt.colorbar(label='Report Count')
plt.title('Wildlife Collision Hotspots')
plt.xlabel('Longitude')
plt.ylabel('Latitude')
plt.grid(True)
plt.show()
