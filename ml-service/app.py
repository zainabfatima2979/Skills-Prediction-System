from fastapi import FastAPI
from pydantic import BaseModel
import os
import joblib

app = FastAPI(title="Skill Prediction Service")

MODEL_PATH = "model/skill_model.joblib"
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)


class PredictionInput(BaseModel):
    years_experience: float
    manager_rating: int  # 1 to 5
    has_certification: int  # 0 or 1
    tools_count: int
    courses_completed: int


def bootstrap_formula(data: PredictionInput) -> float:
    # Used until enough data exists to train a real ML model.
    # Manager rating carries 60% weight, profile signals carry 40%.
    manager_component = data.manager_rating * 20 * 0.6
    profile_component = min(
        (data.years_experience * 5)
        + (data.has_certification * 10)
        + (data.tools_count * 3)
        + (data.courses_completed * 5),
        100,
    ) * 0.4
    return round(manager_component + profile_component, 2)


@app.post("/predict")
def predict_skill(data: PredictionInput):
    if model is not None:
        features = [[
            data.years_experience,
            data.manager_rating,
            data.has_certification,
            data.tools_count,
            data.courses_completed,
        ]]
        score = round(float(model.predict(features)[0]), 2)
        source = "ml_model"
    else:
        score = bootstrap_formula(data)
        source = "bootstrap_formula"

    if score <= 40:
        level = "Beginner"
    elif score <= 70:
        level = "Intermediate"
    else:
        level = "Advanced"

    return {"predicted_score": score, "predicted_level": level, "source": source}


@app.get("/")
def health_check():
    return {"status": "ML service running", "model_loaded": model is not None}
