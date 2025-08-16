import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# === Load feature-engineered dataset ===
print("📥 Loading features for training...")
df = pd.read_csv("features_for_training.csv")

# === Create binary target 'hotspot' from 'severity' ===
if 'severity' not in df.columns:
    raise ValueError("Column 'severity' is missing from features_for_training.csv!")

df['hotspot'] = (df['severity'] >= 3).astype(int)

# Drop 'severity' column now that we created 'hotspot'
df.drop(columns=['severity'], inplace=True)

# Check class distribution
print("Class distribution:")
print(df['hotspot'].value_counts(normalize=True))

# === Define features and target ===
X = df.drop(columns=['hotspot'])
y = df['hotspot']

print(f"Features shape: {X.shape}, Target shape: {y.shape}")

# === Train/test split with stratification ===
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# === Calculate scale_pos_weight for imbalance handling ===
num_pos = y_train.sum()
num_neg = len(y_train) - num_pos
scale_pos_weight = num_neg / num_pos
print(f"scale_pos_weight = {scale_pos_weight:.2f}")

# === Create LightGBM Dataset ===
train_data = lgb.Dataset(X_train, label=y_train)
test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

# === Set parameters ===
params = {
    'objective': 'binary',
    'metric': ['binary_logloss', 'auc'],
    'boosting_type': 'gbdt',
    'learning_rate': 0.05,
    'num_leaves': 31,
    'verbose': -1,
    'scale_pos_weight': scale_pos_weight
}

# === Train model with early stopping ===
print("🚀 Training LightGBM model...")
model = lgb.train(
    params,
    train_data,
    valid_sets=[test_data],
    callbacks=[
        lgb.log_evaluation(period=20),
        lgb.early_stopping(stopping_rounds=20),
    ]
)

# === Predict on test set ===
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob >= 0.5).astype(int)

# === Evaluation ===
print("🧾 Classification report:")
print(classification_report(y_test, y_pred))

# === Save model to file ===
model.save_model('roadsafe_lightgbm_model.txt')
print("💾 Model saved to roadsafe_lightgbm_model.txt")
