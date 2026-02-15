# Random Forest Test Model

This is a simple Random Forest classifier created for testing the Model Hub upload functionality.

## Model Details
- **Framework**: scikit-learn
- **Type**: RandomForestClassifier  
- **Accuracy**: 0.9750
- **Features**: 10
- **Training Samples**: 800

## Usage
```python
import joblib
import numpy as np

# Load the model
model = joblib.load('random_forest_classifier.joblib')

# Make predictions (example with random data)
X_sample = np.random.randn(1, 10)  # 1 sample, 10 features
prediction = model.predict(X_sample)
probability = model.predict_proba(X_sample)

print(f"Prediction: {prediction[0]}")
print(f"Probability: {probability[0]}")
```

## Model Info
- Created for testing Model Hub upload functionality
- Trained on synthetic classification dataset
- Ready for deployment and inference testing
