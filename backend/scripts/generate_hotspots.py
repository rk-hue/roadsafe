import pandas as pd
import matplotlib.pyplot as plt
import json

df = pd.read_csv('reports.csv')

df['location'] = df['location'].apply(json.loads)

df['latitude'] = df['location'].apply(lambda loc: loc['lat'])
df['longitude'] = df['location'].apply(lambda loc: loc['lng'])

df = df.dropna(subset=['latitude', 'longitude'])

plt.figure(figsize=(10, 6))
plt.scatter(df['longitude'], df['latitude'], alpha=0.6, color='green')
plt.title("All Reported Wildlife Locations")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.grid(True)
plt.show()

df['lat_bin'] = (df['latitude'] * 100).astype(int)
df['lon_bin'] = (df['longitude'] * 100).astype(int)

hotspot_counts = df.groupby(['lat_bin', 'lon_bin']).size().reset_index(name='count')

threshold = 1
hotspots = hotspot_counts[hotspot_counts['count'] >= threshold]

print(f"\nTotal grid cells: {len(hotspot_counts)}")
print(f"Hotspot cells (count ≥ {threshold}): {len(hotspots)}")
print(hotspots.head())

plt.figure(figsize=(10, 6))
plt.scatter(hotspots['lon_bin'] / 100, hotspots['lat_bin'] / 100,
            c=hotspots['count'], cmap='hot', s=100, edgecolors='k')
plt.colorbar(label='Report Count')
plt.title('Wildlife Collision Hotspots')
plt.xlabel('Longitude')
plt.ylabel('Latitude')
plt.grid(True)
plt.show()
