import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE
from sklearn.impute import SimpleImputer
import joblib
from sklearn.neighbors import BallTree

PROXIMITY_RADIUS_METERS = 100 
HOTSPOT_THRESHOLD = 2

def main():
    print("loading features_for_training.csv")
    features = pd.read_csv("backend/data/features_for_training.csv", index_col=False)
    
    print("Columns in features:", list(features.columns))
    print("First 5 rows of features:")
    print(features.head())

    print(f"Latitude min/max in features: {features['latitude'].min()} / {features['latitude'].max()}")
    print(f"Longitude min/max in features: {features['longitude'].min()} / {features['longitude'].max()}")

    print("loading deer_crashes_final.csv")
    reports = pd.read_csv("backend/data/deer_crashes_final.csv")

    missing_lat = reports['latitude'].isnull().sum()
    missing_lng = reports['longitude'].isnull().sum()
    print(f"missing latitudes in reports: {missing_lat}, Missing longitudes in reports: {missing_lng}")

    reports = reports.dropna(subset=['latitude', 'longitude'])
    print(f"reports after dropping NaNs: {len(reports)}")

    print("combining crash counts by rounded location...")
    reports['lat_rounded'] = reports['latitude'].round(4)
    reports['lng_rounded'] = reports['longitude'].round(4)
    crash_counts = reports.groupby(['lat_rounded', 'lng_rounded']).size().rename('count')
    print("Crash count stats:")
    print(crash_counts.describe())

    hotspots = crash_counts[crash_counts >= HOTSPOT_THRESHOLD]
    print(f"hotspots found (threshold={HOTSPOT_THRESHOLD}): {len(hotspots)}")
    print(hotspots)

    if hotspots.empty:
        print("*no hotspots with threshold*")
        return

    hotspot_locations = [(lat, lng) for lat, lng in hotspots.index]
    hotspot_lats = [lat for lat, lng in hotspot_locations]
    hotspot_lngs = [lng for lat, lng in hotspot_locations]
    print(f"hotspot lat range: {min(hotspot_lats)} to {max(hotspot_lats)}")
    print(f"hotspot lng range: {min(hotspot_lngs)} to {max(hotspot_lngs)}")

    missing_lat_feat = features['latitude'].isnull().sum()
    missing_lng_feat = features['longitude'].isnull().sum()
    print(f"missing lat/lng in features: {missing_lat_feat}/{missing_lng_feat}")

    features = features.dropna(subset=['latitude', 'longitude'])
    print(f"features after dropping NaNs: {len(features)}")

    print(f"feature lat range: {features['latitude'].min()} to {features['latitude'].max()}")
    print(f"feature lng range: {features['longitude'].min()} to {features['longitude'].max()}")

    features_coords = np.radians(features[['latitude', 'longitude']].to_numpy())
    hotspot_coords = np.radians(np.array(hotspot_locations))

    print("labeling hotspots w/ balltree")
    tree = BallTree(hotspot_coords, metric='haversine')

    radius_radians = PROXIMITY_RADIUS_METERS / 6371000  
    indices = tree.query_radius(features_coords, r=radius_radians)

    hotspot_labels = np.array([1 if len(idx_list) > 0 else 0 for idx_list in indices])
    features['hotspot'] = hotspot_labels

    print("hotspot labeling after balltree:")
    print(features['hotspot'].value_counts())


    cols_to_use = ['latitude', 'longitude', 'hour', 'day', 'month', 'hotspot']
    
    for col in ['hour', 'day', 'month']:
        if col not in features.columns:
            print(f"column '{col}' missing in features; adding 0 instead")
            features[col] = 0  # or choose a default/mean value

    features = features[cols_to_use]

    X = features.drop(columns=['hotspot'])
    y = features['hotspot']

    if y.nunique() < 2:
        print("only one class found after labeling; adjust radius or threshold to get positive samples")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, stratify=y, test_size=0.2, random_state=42
    )
    print(f"training samples: {len(X_train)}, testing samples: {len(X_test)}")

    imputer = SimpleImputer(strategy="mean")
    X_train_imputed = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train.columns, index=X_train.index)
    X_test_imputed = pd.DataFrame(imputer.transform(X_test), columns=X_test.columns, index=X_test.index)

    minority_count = y_train.value_counts().min()
    k_neighbors = min(5, minority_count - 1) if minority_count > 1 else 1
    print(f"applying smote oversampling to training data with k_neighbors={k_neighbors}...")
    smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
    X_train_res, y_train_res = smote.fit_resample(X_train_imputed, y_train)

    print(f"after smote, training samples: {len(X_train_res)}")

    print("training random forest classifier")
    clf = RandomForestClassifier(random_state=42)
    clf.fit(X_train_res, y_train_res)

    y_pred = clf.predict(X_test_imputed)
    print("evaluation:")
    print(classification_report(y_test, y_pred, digits=4))

    joblib.dump(clf, "hotspot_model.joblib")
    joblib.dump(imputer, "imputer.joblib")
    print("model + imputer saved")

if __name__ == "__main__":
    main()
