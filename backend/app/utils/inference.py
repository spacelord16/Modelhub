"""
inference.py — Load models and run predictions.

Supported formats:
  - joblib / pkl : scikit-learn models
  - onnx         : ONNX runtime models (lightweight, cross-framework)

PyTorch (.pt/.pth) and TensorFlow (.h5) are intentionally not included
in the base install — add them separately if needed.
"""
import os
import pickle
from typing import Any, Dict, List, Union

from fastapi import HTTPException


def get_model_file_path(s3_path: str, upload_dir: str) -> str:
    """
    Convert the DB-stored s3_path (e.g. 'models/3/uuid.joblib')
    to the actual local file path.
    """
    # s3_path is stored as "models/{user_id}/{filename}"
    # upload_dir is the root (e.g. "uploads/")
    relative = s3_path.replace("models/", "", 1)
    return os.path.join(upload_dir, relative)


def load_model(file_path: str, fmt: str) -> Any:
    """
    Load a model file from disk.

    Args:
        file_path: Absolute path to the model file
        fmt: Format string from DB (joblib, pkl, pickle, onnx)

    Returns:
        Loaded model object
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model file not found on server")

    fmt = fmt.lower().strip(".")

    if fmt in ("joblib",):
        try:
            import joblib
        except ImportError:
            raise HTTPException(status_code=500, detail="joblib not installed on server")
        return joblib.load(file_path)

    elif fmt in ("pkl", "pickle"):
        with open(file_path, "rb") as f:
            return pickle.load(f)

    elif fmt in ("onnx",):
        try:
            import onnxruntime as ort
        except ImportError:
            raise HTTPException(status_code=500, detail="onnxruntime not installed on server")
        return ort.InferenceSession(file_path)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model format '{fmt}'. Supported: joblib, pkl, onnx"
        )


def run_inference(model: Any, input_data: Any, fmt: str) -> Dict:
    """
    Run inference on a loaded model.

    Args:
        model: Loaded model object
        input_data: Input from the user (list or dict)
        fmt: Model format to determine how to call the model

    Returns:
        Dict with prediction results
    """
    fmt = fmt.lower().strip(".")

    # scikit-learn (loaded via joblib or pickle)
    if fmt in ("joblib", "pkl", "pickle"):
        import numpy as np
        X = np.array(input_data)
        if X.ndim == 1:
            X = X.reshape(1, -1)  # ensure 2D for sklearn

        prediction = model.predict(X).tolist()
        result = {"prediction": prediction}

        # Add probabilities if classifier supports it
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X).tolist()
            result["probabilities"] = proba

        return result

    # ONNX Runtime
    elif fmt in ("onnx",):
        import numpy as np
        input_name = model.get_inputs()[0].name
        X = np.array(input_data, dtype=np.float32)
        if X.ndim == 1:
            X = X.reshape(1, -1)

        outputs = model.run(None, {input_name: X})
        return {"prediction": outputs[0].tolist()}

    else:
        raise HTTPException(status_code=400, detail=f"Cannot run inference for format '{fmt}'")
