import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load cleaned data
df = pd.read_csv('cleaned_reports.csv')

# Show available columns to debug issues
print("🧾 Available columns:", df.columns.tolist())

# Preview data
print(df.head())

# Set seaborn style
sns.set(style="whitegrid")

# 1. Reports count by animal type (bar plot)
if 'type' in df.columns:
    plt.figure(figsize=(10, 6))
    sns.countplot(data=df, x='type', order=df['type'].value_counts().index)
    plt.title('Number of Reports by Animal Type')
    plt.xlabel('Animal Type')
    plt.ylabel('Number of Reports')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()
else:
    print("⚠️ Column 'type' not found in dataset.")

# 2. Reports by hour of day (bar plot)
if 'hour' in df.columns:
    plt.figure(figsize=(10, 6))
    sns.countplot(data=df, x='hour')
    plt.title('Reports by Hour of Day')
    plt.xlabel('Hour')
    plt.ylabel('Number of Reports')
    plt.tight_layout()
    plt.show()
else:
    print("⚠️ Column 'hour' not found in dataset.")

# 3. Scatter plot of report locations
if {'latitude', 'longitude'}.issubset(df.columns):
    plt.figure(figsize=(8, 8))
    hue_col = 'type' if 'type' in df.columns else None
    sns.scatterplot(data=df, x='longitude', y='latitude', hue=hue_col, alpha=0.7)
    plt.title('Report Locations by Animal Type')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    if hue_col:
        plt.legend(title='Animal Type', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.show()
else:
    print("⚠️ 'latitude' or 'longitude' columns not found.")