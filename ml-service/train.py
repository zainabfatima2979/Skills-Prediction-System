# Run this once you have 30-50+ real records exported from MongoDB into
# data/training_data.csv (columns: years_experience, manager_rating,
# has_certification, tools_count, courses_completed, actual_score)

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

DATA_PATH = "data/training_data.csv"
MODEL_PATH = "model/skill_model.joblib"


def train():
    if not os.path.exists(DATA_PATH):
        print(f"No training data found at {DATA_PATH}. Collect more records first.")
        return

    df = pd.read_csv(DATA_PATH)
    X = df[[
        "years_experience",
        "manager_rating",
        "has_certification",
        "tools_count",
        "courses_completed",
    ]]
    y = df["actual_score"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    print("Model score on test data:", model.score(X_test, y_test))

    os.makedirs("model", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()
