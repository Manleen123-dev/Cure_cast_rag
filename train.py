import pandas as pd
import pickle
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from catboost import CatBoostClassifier
import numpy as np

# -------------------------------
# 1. Load dataset
# -------------------------------
df = pd.read_csv("Disease and symptoms dataset.csv")

# -------------------------------
# 2. Filter >=50 samples per disease
# -------------------------------
counts = df['diseases'].value_counts()
df_filtered = df[df['diseases'].isin(counts[counts >= 50].index)]
print(f"Using {df_filtered['diseases'].nunique()} diseases")

# -------------------------------
# 3. Balance dataset (max 900 each)
# -------------------------------
balanced_df = (
    df_filtered.groupby('diseases', group_keys=False)
    .apply(lambda x: x.sample(n=min(len(x), 900), random_state=42))
    .reset_index(drop=True)
)

print("Balanced shape:", balanced_df.shape)

# -------------------------------
# 4. Feature matrix
# -------------------------------
X = balanced_df.drop('diseases', axis=1).fillna(0).astype(float)
y = balanced_df['diseases']

# -------------------------------
# 5. Encode labels
# -------------------------------
le = LabelEncoder()
y_enc = le.fit_transform(y)

# -------------------------------
# 6. Cross-validation Setup
# -------------------------------
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
accuracies = []
best_model = None
best_acc = 0

# -------------------------------
# 7. Train & Evaluate model
# -------------------------------
for fold, (train_idx, test_idx) in enumerate(skf.split(X, y_enc)):
    print(f"\n▶ Fold {fold+1}")
    
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y_enc[train_idx], y_enc[test_idx]
    
    model = CatBoostClassifier(
    iterations=750,          # Faster than 1100/1800 but still strong
    learning_rate=0.04,
    depth=8,
    l2_leaf_reg=2,
    random_strength=0.8,
    colsample_bylevel=0.8,
    border_count=220,
    bootstrap_type='Bernoulli',
    subsample=0.7,
    auto_class_weights="Balanced",
    eval_metric='Accuracy',
    random_seed=42,
    verbose=100,
    early_stopping_rounds=70
    )


    
    model.fit(X_train, y_train, eval_set=(X_test, y_test))
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Fold Accuracy: {acc:.4f}")
    
    accuracies.append(acc)
    
    if acc > best_acc:
        best_acc = acc
        best_model = model

final_accuracy = np.mean(accuracies)
print(f"\n🎯 Final Mean CV Accuracy: {final_accuracy:.4f}")

# -------------------------------
# 8. Save BEST model
# -------------------------------
with open("curecast_catboost_optimized.pkl", "wb") as f:
    pickle.dump({
        "model": best_model,
        "label_encoder": le,
        "symptoms": X.columns.tolist(),
        "accuracy": final_accuracy
    }, f)

print("💾 Best Model Saved as curecast_catboost_optimized.pkl")
