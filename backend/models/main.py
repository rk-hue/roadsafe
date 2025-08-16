from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import joblib
import pandas as pd

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Allow all CORS (you can restrict it later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and imputer
model = joblib.load("hotspot_model.joblib")
imputer = joblib.load("imputer.joblib")

# Define the correct feature order that the model expects



@app.get("/")
def root():
    logger.info("Root endpoint was hit.")
    return {"message": "Hello from FastAPI"}

@app.post("/predict_hotspot")
async def predict_hotspot(request: Request):
    try:
        data = await request.json()
        logger.info(f"Received data: {data}")

        # Rename 'dayofweek' to 'day' if present
        if 'dayofweek' in data:
            data['day'] = data.pop('dayofweek')

        FEATURE_ORDER = ['latitude', 'longitude', 'hour', 'day', 'month']
        # Reorder features in correct order, raise KeyError if missing
        ordered_features = [data[feat] for feat in FEATURE_ORDER]

        # Create DataFrame in the exact order expected
        input_df = pd.DataFrame([ordered_features], columns=FEATURE_ORDER)

        print("Input df columns:", input_df.columns.tolist())
        print("Imputer features:", imputer.feature_names_in_.tolist())
        print("Model features:", model.feature_names_in_.tolist())
        
        # Impute missing values if any
        input_df_imputed = pd.DataFrame(imputer.transform(input_df), columns=FEATURE_ORDER)

        # Predict hotspot
        prediction_proba = model.predict_proba(input_df_imputed)[0]
        prediction = model.predict(input_df_imputed)[0]

        # Use probability of positive class (assumed index 1)
        prob_positive = prediction_proba[1] if len(prediction_proba) > 1 else prediction_proba[0]

        # Define risk levels and colors based on probability thresholds
        if prob_positive >= 0.66:
            risk = "High"
            color = "red"
        elif prob_positive >= 0.33:
            risk = "Medium"
            color = "orange"
        else:
            risk = "Low"
            color = "yellow"

        logger.info(f"Prediction: {prediction}, Probability: {prob_positive:.3f}, Risk Level: {risk}")

        return {
            "hotspot_prediction": int(prediction),
            "probability": prob_positive,
            "risk_level": risk,
            "color": color,
        }

    except KeyError as ke:
        error_msg = f"Missing expected feature in input: {ke}"
        logger.error(error_msg)
        return {"error": error_msg}
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    # For debugging, print expected features for imputer and model
    print("Imputer expects these features:")
    print(imputer.feature_names_in_)

    print("\nModel expects these features:")
    print(model.feature_names_in_)
@app.post("/predict_hotspot")
async def predict_hotspot(request: Request):
    try:
        data = await request.json()
        logger.info(f"Received data: {data}")

        # Define the correct feature order expected by your model
        FEATURE_ORDER = ['latitude', 'longitude', 'hour', 'month', 'day']

        # Reorder input data to match model expectation
        ordered_features = [data[feat] for feat in FEATURE_ORDER]
        input_df = pd.DataFrame([ordered_features], columns=FEATURE_ORDER)

        # Add debug prints here:
        print("Input df columns:", input_df.columns.tolist())
        print("Imputer features:", imputer.feature_names_in_.tolist())
        print("Model features:", model.feature_names_in_.tolist())

        # Impute and predict
        input_df_imputed = pd.DataFrame(imputer.transform(input_df), columns=FEATURE_ORDER)
        prediction = model.predict(input_df_imputed)

        logger.info(f"Prediction: {prediction.tolist()}")
        return {"hotspot_prediction": int(prediction[0])}
    
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return {"error": str(e)}
