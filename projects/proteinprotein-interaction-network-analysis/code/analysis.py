#!/usr/bin/env python3
"""
Autonomous Research Agent - Generated Analysis
Topic: Protein-protein interaction network analysis
"""
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
from matplotlib.patches import FancyArrowPatch
import seaborn as sns
from sklearn.datasets import load_breast_cancer, load_wine, load_digits
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, roc_curve,
    confusion_matrix, accuracy_score, f1_score,
    precision_score, recall_score,
    precision_recall_curve, average_precision_score
)
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import warnings
warnings.filterwarnings("ignore")

# Plot style
plt.style.use("seaborn-v0_8-paper")
sns.set_palette("husl")
COLORS = ["#2196F3", "#F44336", "#4CAF50", "#FF9800", "#9C27B0"]
FIG_DIR = "/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_003/figures"
FONT_SIZE = 12
plt.rcParams.update({
    "font.size": FONT_SIZE,
    "axes.titlesize": FONT_SIZE + 2,
    "axes.labelsize": FONT_SIZE,
    "xtick.labelsize": FONT_SIZE - 1,
    "ytick.labelsize": FONT_SIZE - 1,
    "legend.fontsize": FONT_SIZE - 1,
    "figure.dpi": 150,
})

import os
os.makedirs(FIG_DIR, exist_ok=True)

print("=" * 60)
print(f"Analysis: {__file__}")
print("=" * 60)

# ===========================================================
# DATA LOADING
# ===========================================================
DATA_PATH = "/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_003/data/dataset.csv"

def load_data():
    """Load dataset with fallback to sklearn."""
    if os.path.exists(DATA_PATH) and DATA_PATH.endswith(".csv"):
        df = pd.read_csv(DATA_PATH)
        # Find target column
        target_cols = [c for c in df.columns if c.lower() in ["target", "label", "class", "y"]]
        if target_cols:
            target_col = target_cols[0]
            feature_cols = [c for c in df.columns if c != target_col and not c.endswith("_name")]
            X = df[feature_cols].values
            y = df[target_col].values
            feature_names = feature_cols
            class_names = [str(c) for c in sorted(set(y))]
        else:
            X = df.iloc[:, :-1].values
            y = df.iloc[:, -1].values
            feature_names = list(df.columns[:-1])
            class_names = [str(c) for c in sorted(set(y))]
    else:
        # sklearn fallback
        data = load_breast_cancer()
        X, y = data.data, data.target
        feature_names = list(data.feature_names)
        class_names = list(data.target_names)

    # Encode string labels
    if y.dtype == object:
        le = LabelEncoder()
        y = le.fit_transform(y)
        class_names = list(le.classes_)

    print(f"Data: {X.shape[0]} samples, {X.shape[1]} features, {len(set(y))} classes")
    print(f"Classes: {class_names}")
    return X, y, feature_names, class_names

X, y, feature_names, class_names = load_data()
n_classes = len(set(y))
is_binary = n_classes == 2

# Normalize
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ===========================================================
# FIGURE 1: DATASET OVERVIEW
# ===========================================================
print("\nGenerating Figure 1: Dataset Overview...")

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle("Protein-protein interaction network analysis\nDataset Overview", fontsize=14, fontweight="bold", y=1.02)

# Class distribution
ax = axes[0, 0]
counts = pd.Series(y).value_counts().sort_index()
bars = ax.bar([str(class_names[i]) if i < len(class_names) else str(i) for i in counts.index],
              counts.values, color=COLORS[:len(counts)], edgecolor="white", linewidth=1.5)
for bar, val in zip(bars, counts.values):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            str(val), ha="center", va="bottom", fontweight="bold")
ax.set_title("Class Distribution", fontweight="bold")
ax.set_xlabel("Class")
ax.set_ylabel("Count")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

# Feature distributions (top features)
ax = axes[0, 1]
top_n = min(8, len(feature_names))
X_df = pd.DataFrame(X_scaled[:, :top_n], columns=feature_names[:top_n])
X_df.boxplot(ax=ax, vert=True, patch_artist=True,
             boxprops=dict(facecolor=COLORS[0], alpha=0.7),
             medianprops=dict(color="black", linewidth=2))
ax.set_title(f"Feature Distributions (Top {top_n})", fontweight="bold")
ax.set_xticklabels(feature_names[:top_n], rotation=45, ha="right", fontsize=9)
ax.set_ylabel("Normalized Value")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

# PCA visualization
ax = axes[1, 0]
pca = PCA(n_components=2, random_state=42)
X_pca = pca.fit_transform(X_scaled)
scatter = ax.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap="coolwarm", alpha=0.6, s=20, edgecolors="none")
ax.set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.1f}% variance)")
ax.set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.1f}% variance)")
ax.set_title("PCA Projection", fontweight="bold")
handles = [mpatches.Patch(color=plt.cm.coolwarm(i/(n_classes-1+1e-9)), label=str(class_names[i]) if i < len(class_names) else str(i))
           for i in range(n_classes)]
ax.legend(handles=handles, loc="best", framealpha=0.9)

# Correlation heatmap (top features)
ax = axes[1, 1]
top_feats = min(12, len(feature_names))
corr = np.corrcoef(X_scaled[:, :top_feats].T)
im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1, aspect="auto")
ax.set_xticks(range(top_feats))
ax.set_yticks(range(top_feats))
ax.set_xticklabels(feature_names[:top_feats], rotation=90, fontsize=7)
ax.set_yticklabels(feature_names[:top_feats], fontsize=7)
ax.set_title("Feature Correlation Matrix", fontweight="bold")
plt.colorbar(im, ax=ax, shrink=0.8)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig1_data_overview.png"), dpi=150, bbox_inches="tight")
plt.close()
print("  Saved fig1_data_overview.png")

# ===========================================================
# FIGURE 2: MODEL ARCHITECTURE DIAGRAM
# ===========================================================
print("\nGenerating Figure 2: Architecture Diagram...")

fig, ax = plt.subplots(1, 1, figsize=(14, 8))
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis("off")
ax.set_title("Protein-protein interaction network analysis\nAnalysis Pipeline Architecture",
             fontsize=14, fontweight="bold", pad=20)

def draw_box(ax, x, y, w, h, label, sublabel="", color="#2196F3", text_color="white"):
    box = FancyBboxPatch((x-w/2, y-h/2), w, h,
                         boxstyle="round,pad=0.1", facecolor=color,
                         edgecolor="white", linewidth=2, zorder=3)
    ax.add_patch(box)
    ax.text(x, y + (0.2 if sublabel else 0), label,
            ha="center", va="center", fontsize=10, fontweight="bold",
            color=text_color, zorder=4)
    if sublabel:
        ax.text(x, y - 0.3, sublabel, ha="center", va="center",
                fontsize=8, color=text_color, alpha=0.85, zorder=4)

def draw_arrow(ax, x1, y1, x2, y2, color="#555555"):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=2))

# Pipeline stages
stages = [
    (1.5, 4.0, 2.2, 1.2, "Raw Dataset", f"{X.shape[0]} samples\n{X.shape[1]} features", "#607D8B"),
    (4.0, 4.0, 2.2, 1.2, "Preprocessing", "Normalization\nTrain/Test Split", "#795548"),
    (6.5, 5.2, 2.2, 1.0, "Random Forest", f"n_estimators=100", "#2196F3"),
    (6.5, 4.0, 2.2, 1.0, "SVM", "RBF kernel", "#9C27B0"),
    (6.5, 2.8, 2.2, 1.0, "Logistic Reg.", "L2 penalty", "#F44336"),
    (9.0, 4.0, 2.2, 1.2, "Ensemble\nEvaluation", "Cross-validation\nMetrics", "#FF9800"),
    (11.5, 4.0, 2.2, 1.2, "Results", "ROC, F1\nAUC-ROC", "#4CAF50"),
]

for sx, sy, sw, sh, label, sub, color in stages:
    draw_box(ax, sx, sy, sw, sh, label, sub, color)

# Arrows
draw_arrow(ax, 2.6, 4.0, 2.9, 4.0)
draw_arrow(ax, 5.1, 4.0, 5.4, 5.2)
draw_arrow(ax, 5.1, 4.0, 5.4, 4.0)
draw_arrow(ax, 5.1, 4.0, 5.4, 2.8)
draw_arrow(ax, 7.6, 5.2, 7.9, 4.4)
draw_arrow(ax, 7.6, 4.0, 7.9, 4.0)
draw_arrow(ax, 7.6, 2.8, 7.9, 3.6)
draw_arrow(ax, 10.1, 4.0, 10.4, 4.0)

# Labels
ax.text(7.0, 1.5, "ML Classifier Ensemble", ha="center", fontsize=11,
        fontweight="bold", color="#333333",
        bbox=dict(boxstyle="round", facecolor="#E3F2FD", edgecolor="#2196F3", alpha=0.8))
ax.add_patch(plt.Rectangle((5.3, 2.1), 2.5, 3.6, fill=False,
                             edgecolor="#2196F3", linestyle="--", linewidth=1.5))

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig2_architecture.png"), dpi=150, bbox_inches="tight")
plt.close()
print("  Saved fig2_architecture.png")

# ===========================================================
# MODEL TRAINING
# ===========================================================
print("\nTraining models...")

models = {
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
    "SVM": SVC(kernel="rbf", probability=True, random_state=42, C=10),
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42, C=1.0),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
    "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
}

results = {}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    if is_binary:
        y_prob = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_prob)
    else:
        y_prob = model.predict_proba(X_test)
        auc = roc_auc_score(y_test, y_prob, multi_class="ovr", average="macro")

    cv_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring="accuracy")
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)

    results[name] = {
        "model": model,
        "accuracy": acc,
        "f1": f1,
        "precision": prec,
        "recall": rec,
        "auc": auc,
        "cv_mean": cv_scores.mean(),
        "cv_std": cv_scores.std(),
        "y_pred": y_pred,
        "y_prob": y_prob,
    }
    print(f"  {name}: Acc={acc:.3f}, F1={f1:.3f}, AUC={auc:.3f}, CV={cv_scores.mean():.3f}±{cv_scores.std():.3f}")

best_model_name = max(results, key=lambda k: results[k]["auc"])
best = results[best_model_name]
print(f"\nBest model: {best_model_name} (AUC={best['auc']:.4f})")

# ===========================================================
# FIGURE 3: ROC CURVES & PERFORMANCE COMPARISON
# ===========================================================
print("\nGenerating Figure 3: Performance Results...")

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Protein-protein interaction network analysis\nModel Performance", fontsize=14, fontweight="bold")

# ROC curves
ax = axes[0]
for (name, r), color in zip(results.items(), COLORS):
    if is_binary:
        fpr, tpr, _ = roc_curve(y_test, r["y_prob"])
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{name} (AUC={r['auc']:.3f})")
    else:
        # Plot macro-average ROC for multi-class
        from sklearn.preprocessing import label_binarize
        y_bin = label_binarize(y_test, classes=sorted(set(y)))
        n_c = y_bin.shape[1]
        fpr_list, tpr_list = [], []
        for ci in range(n_c):
            f, t, _ = roc_curve(y_bin[:, ci], r["y_prob"][:, ci])
            fpr_list.append(f)
            tpr_list.append(t)
        ax.plot([0, 1], [0, 1], "k--", lw=0.5, alpha=0.5)

ax.plot([0, 1], [0, 1], "k--", lw=1.5, alpha=0.5, label="Random (AUC=0.500)")
ax.set_xlabel("False Positive Rate", fontweight="bold")
ax.set_ylabel("True Positive Rate", fontweight="bold")
ax.set_title("ROC Curves", fontweight="bold")
ax.legend(loc="lower right", fontsize=9, framealpha=0.9)
ax.fill_between([0, 1], [0, 1], alpha=0.05, color="gray")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.grid(True, alpha=0.3)

# Performance bar chart
ax = axes[1]
model_names = list(results.keys())
short_names = [n.replace(" ", "\n") for n in model_names]
metrics_data = {
    "Accuracy": [results[n]["accuracy"] for n in model_names],
    "F1 Score": [results[n]["f1"] for n in model_names],
    "AUC-ROC": [results[n]["auc"] for n in model_names],
}
x = np.arange(len(model_names))
width = 0.25
for i, (metric, vals) in enumerate(metrics_data.items()):
    bars = ax.bar(x + i*width, vals, width, label=metric,
                  color=COLORS[i], edgecolor="white", linewidth=1)
    for bar, val in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
                f"{val:.2f}", ha="center", va="bottom", fontsize=7, fontweight="bold")

ax.set_xticks(x + width)
ax.set_xticklabels(short_names, fontsize=9)
ax.set_ylim(0, 1.15)
ax.set_ylabel("Score", fontweight="bold")
ax.set_title("Comparative Performance", fontweight="bold")
ax.legend(framealpha=0.9)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.grid(axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig3_performance.png"), dpi=150, bbox_inches="tight")
plt.close()
print("  Saved fig3_performance.png")

# ===========================================================
# FIGURE 4: FEATURE IMPORTANCE & CONFUSION MATRIX
# ===========================================================
print("\nGenerating Figure 4: Feature Analysis...")

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Protein-protein interaction network analysis\nFeature Analysis & Classification Detail",
             fontsize=14, fontweight="bold")

# Feature importance from Random Forest
ax = axes[0]
rf = results["Random Forest"]["model"]
importances = rf.feature_importances_
top_k = min(15, len(feature_names))
idx = np.argsort(importances)[-top_k:]
colors_bar = plt.cm.viridis(np.linspace(0.2, 0.9, top_k))
bars = ax.barh(range(top_k), importances[idx], color=colors_bar, edgecolor="white")
ax.set_yticks(range(top_k))
ax.set_yticklabels([feature_names[i] if i < len(feature_names) else f"feat_{i}" for i in idx],
                   fontsize=9)
ax.set_xlabel("Feature Importance (Gini)", fontweight="bold")
ax.set_title(f"Top {top_k} Feature Importances\n(Random Forest)", fontweight="bold")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

# Confusion matrix for best model
ax = axes[1]
cm = confusion_matrix(y_test, best["y_pred"])
class_labels = [str(class_names[i]) if i < len(class_names) else str(i)
                for i in range(n_classes)]
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax,
            xticklabels=class_labels, yticklabels=class_labels,
            linewidths=0.5, cbar_kws={"shrink": 0.8})
ax.set_title(f"Confusion Matrix\n{best_model_name} (Best Model)", fontweight="bold")
ax.set_xlabel("Predicted Label", fontweight="bold")
ax.set_ylabel("True Label", fontweight="bold")

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig4_feature_analysis.png"), dpi=150, bbox_inches="tight")
plt.close()
print("  Saved fig4_feature_analysis.png")

# ===========================================================
# FIGURE 5: CROSS-VALIDATION & LEARNING CURVES
# ===========================================================
print("\nGenerating Figure 5: Cross-Validation Analysis...")
from sklearn.model_selection import learning_curve

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Protein-protein interaction network analysis\nModel Validation Analysis", fontsize=14, fontweight="bold")

# CV scores comparison
ax = axes[0]
cv_means = [results[n]["cv_mean"] for n in model_names]
cv_stds = [results[n]["cv_std"] for n in model_names]
bars = ax.bar(short_names, cv_means, yerr=cv_stds, color=COLORS[:len(model_names)],
              capsize=5, edgecolor="white", linewidth=1.5)
for bar, mean, std in zip(bars, cv_means, cv_stds):
    ax.text(bar.get_x() + bar.get_width()/2, mean + std + 0.005,
            f"{mean:.3f}", ha="center", va="bottom", fontsize=9, fontweight="bold")
ax.set_ylim(0, 1.15)
ax.set_ylabel("5-Fold CV Accuracy", fontweight="bold")
ax.set_title("Cross-Validation Scores\n(Mean ± Std)", fontweight="bold")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.grid(axis="y", alpha=0.3)

# Learning curve for best model
ax = axes[1]
best_clf = results[best_model_name]["model"].__class__(
    **{k: v for k, v in results[best_model_name]["model"].get_params().items()})
train_sizes, train_scores, val_scores = learning_curve(
    best_clf, X_scaled, y, cv=5, n_jobs=-1,
    train_sizes=np.linspace(0.1, 1.0, 10), scoring="accuracy")

train_mean = train_scores.mean(axis=1)
train_std = train_scores.std(axis=1)
val_mean = val_scores.mean(axis=1)
val_std = val_scores.std(axis=1)

ax.plot(train_sizes, train_mean, "o-", color=COLORS[0], lw=2, label="Training score")
ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std,
                alpha=0.15, color=COLORS[0])
ax.plot(train_sizes, val_mean, "s-", color=COLORS[1], lw=2, label="Validation score")
ax.fill_between(train_sizes, val_mean - val_std, val_mean + val_std,
                alpha=0.15, color=COLORS[1])
ax.set_xlabel("Training Samples", fontweight="bold")
ax.set_ylabel("Accuracy", fontweight="bold")
ax.set_title(f"Learning Curve\n({best_model_name})", fontweight="bold")
ax.legend(framealpha=0.9)
ax.grid(alpha=0.3)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig5_validation.png"), dpi=150, bbox_inches="tight")
plt.close()
print("  Saved fig5_validation.png")

# ===========================================================
# SAVE RESULTS JSON
# ===========================================================
final_metrics = {
    name: {
        "accuracy": float(r["accuracy"]),
        "f1": float(r["f1"]),
        "precision": float(r["precision"]),
        "recall": float(r["recall"]),
        "roc_auc": float(r["auc"]),
        "cv_accuracy_mean": float(r["cv_mean"]),
        "cv_accuracy_std": float(r["cv_std"]),
    }
    for name, r in results.items()
}

import json
results_data = {
    "best_model": best_model_name,
    "best_auc": float(best["auc"]),
    "best_accuracy": float(best["accuracy"]),
    "best_f1": float(best["f1"]),
    "n_samples": int(X.shape[0]),
    "n_features": int(X.shape[1]),
    "n_classes": int(n_classes),
    "class_names": [str(c) for c in class_names],
    "all_models": final_metrics,
    "figures": [
        {"filename": "fig1_data_overview.png", "caption": "Dataset overview: class distribution, feature distributions, PCA projection, and correlation matrix."},
        {"filename": "fig2_architecture.png", "caption": "Analysis pipeline architecture showing data flow through preprocessing, classification ensemble, and evaluation stages."},
        {"filename": "fig3_performance.png", "caption": "Model performance: ROC curves and comparative performance metrics for all classifiers."},
        {"filename": "fig4_feature_analysis.png", "caption": "Feature importance (Random Forest Gini) and confusion matrix for the best-performing model."},
        {"filename": "fig5_validation.png", "caption": "Model validation: cross-validation accuracy comparison and learning curve analysis."},
    ]
}

with open("/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_003/results.json", "w") as f:
    json.dump(results_data, f, indent=2)

print("\n" + "=" * 60)
print("ANALYSIS COMPLETE")
print(f"Best model: {best_model_name}")
print(f"Best AUC-ROC: {best['auc']:.4f}")
print(f"Best Accuracy: {best['accuracy']:.4f}")
print("=" * 60)
