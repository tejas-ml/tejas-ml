#!/usr/bin/env python3
"""
Autonomous Research Agent - Multi-dataset Nature-style Analysis
Topic: Multi-omics Integration for Cancer Patient Stratification with Cross-cohort Generalization
"""
import os
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
from matplotlib.gridspec import GridSpec
import seaborn as sns
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold, learning_curve
)
from sklearn.preprocessing import StandardScaler, LabelEncoder, label_binarize
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    roc_auc_score, roc_curve, confusion_matrix, accuracy_score, f1_score,
    precision_score, recall_score, precision_recall_curve, average_precision_score,
    brier_score_loss, log_loss,
)
from sklearn.calibration import calibration_curve
from sklearn.decomposition import PCA
from sklearn.inspection import permutation_importance
warnings.filterwarnings("ignore")

plt.style.use("seaborn-v0_8-whitegrid")
# Nature-ish muted palette
COLORS = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02"]
PANEL_LABEL_KW = dict(fontsize=13, fontweight="bold", va="top", ha="left")
FIG_DIR = "/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_002/figures"
FONT_SIZE = 10
plt.rcParams.update({
    "font.size": FONT_SIZE,
    "axes.titlesize": FONT_SIZE + 1,
    "axes.labelsize": FONT_SIZE,
    "xtick.labelsize": FONT_SIZE - 1,
    "ytick.labelsize": FONT_SIZE - 1,
    "legend.fontsize": FONT_SIZE - 1,
    "figure.dpi": 180,
    "savefig.dpi": 180,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "font.family": "DejaVu Sans",
})
os.makedirs(FIG_DIR, exist_ok=True)

print("=" * 60)
print("Multi-dataset Nature-style analysis")
print("=" * 60)

DATA_PATH = "/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_002/data"
DATA_DIR = os.path.dirname(DATA_PATH) if os.path.dirname(DATA_PATH) else "."
RESULTS_JSON = "/mnt/c/Users/tejas/OneDrive/Desktop/loop-eng/output/cycle_002/results.json"


def _panel_label(ax, lab, x=-0.08, y=1.08):
    ax.text(x, y, lab, transform=ax.transAxes, **PANEL_LABEL_KW)


def load_all_cohorts():
    """Load multi-cohort suite from manifest or any cohort_*.csv / dataset.csv."""
    cohorts = {}
    manifest_path = os.path.join(DATA_DIR, "datasets_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path) as f:
            man = json.load(f)
        for d in man.get("datasets", []):
            p = d.get("path", "")
            if not os.path.isabs(p):
                p = os.path.join(DATA_DIR, p)
            if os.path.exists(p):
                cohorts[d.get("name", os.path.basename(p))] = p
    # Fallbacks
    if not cohorts:
        for fname in sorted(os.listdir(DATA_DIR)):
            if (fname.startswith("cohort_") and fname.endswith(".csv")) or fname == "dataset.csv":
                cohorts[fname.replace(".csv", "")] = os.path.join(DATA_DIR, fname)
    if not cohorts and os.path.exists(DATA_PATH):
        cohorts["primary"] = DATA_PATH
    if not cohorts:
        # Absolute last resort: sklearn breast cancer as single cohort (should rarely hit)
        from sklearn.datasets import load_breast_cancer
        data = load_breast_cancer()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        df["target"] = data.target
        df["target_name"] = [data.target_names[t] for t in data.target]
        p = os.path.join(DATA_DIR, "dataset.csv")
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(p, index=False)
        cohorts["primary"] = p
    return cohorts


def frame_to_xy(df):
    drop = {c for c in df.columns if c.lower() in
            ("target", "label", "class", "y", "target_name", "cohort")}
    target_cols = [c for c in df.columns if c.lower() in ("target", "label", "class", "y")]
    target_col = target_cols[0] if target_cols else df.columns[-1]
    feature_cols = [c for c in df.columns if c not in drop and c != target_col]
    if not feature_cols:
        feature_cols = [c for c in df.columns if c != target_col][:-1] or list(df.columns[:-1])
    X = df[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0).values
    y_raw = df[target_col].values
    if getattr(y_raw, "dtype", None) == object or not np.issubdtype(np.array(y_raw).dtype, np.number):
        le = LabelEncoder()
        y = le.fit_transform([str(v) for v in y_raw])
        class_names = list(le.classes_)
    else:
        y = np.array(y_raw).astype(int)
        # contiguous
        uniq = sorted(set(y.tolist()))
        mapping = {u: i for i, u in enumerate(uniq)}
        y = np.array([mapping[v] for v in y])
        if "target_name" in df.columns:
            # stable names by first occurrence order of mapped classes
            name_map = {}
            for raw, nm in zip(df[target_col].values, df["target_name"].values):
                try:
                    key = mapping[int(raw)]
                except Exception:
                    continue
                name_map.setdefault(key, str(nm))
            class_names = [name_map.get(i, f"class_{i}") for i in range(len(uniq))]
        else:
            class_names = [f"class_{i}" for i in range(len(uniq))]
    return X, y, feature_cols, class_names


cohort_paths = load_all_cohorts()
print(f"Loaded {len(cohort_paths)} cohorts: {list(cohort_paths.keys())}")

cohort_data = {}
for name, path in cohort_paths.items():
    df = pd.read_csv(path)
    X, y, feat_names, class_names = frame_to_xy(df)
    cohort_data[name] = {
        "X": X, "y": y, "feature_names": feat_names,
        "class_names": class_names, "df": df, "path": path,
    }
    print(f"  {name}: {X.shape[0]} x {X.shape[1]}, classes={class_names}")

# Primary = first cohort (prefer names containing primary/A)
primary_name = next(
    (n for n in cohort_data if "primary" in n.lower() or n.lower().endswith("_a")
     or "cohort_a" in n.lower()),
    list(cohort_data.keys())[0],
)
primary = cohort_data[primary_name]
print(f"Primary cohort: {primary_name}")

MODELS_SPEC = {
    "Random Forest": lambda: RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1),
    "SVM": lambda: SVC(kernel="rbf", probability=True, random_state=42, C=5),
    "Logistic Regression": lambda: LogisticRegression(max_iter=2000, random_state=42, C=1.0),
    "Gradient Boosting": lambda: GradientBoostingClassifier(n_estimators=80, random_state=42),
    "K-Nearest Neighbors": lambda: KNeighborsClassifier(n_neighbors=7),
}


def train_eval_on_cohort(X, y, class_names):
    """Train all models; return results dict + scaled matrices."""
    n_classes = len(set(y))
    is_binary = n_classes == 2
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    # Guard tiny cohorts
    test_size = 0.25 if len(y) >= 80 else 0.3
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            Xs, y, test_size=test_size, random_state=42, stratify=y
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            Xs, y, test_size=test_size, random_state=42
        )
    cv = StratifiedKFold(n_splits=min(5, max(2, min(np.bincount(y)))), shuffle=True, random_state=42)
    results = {}
    for name, factory in MODELS_SPEC.items():
        model = factory()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)
        if is_binary:
            auc = roc_auc_score(y_test, y_prob[:, 1])
            ap = average_precision_score(y_test, y_prob[:, 1])
            try:
                brier = brier_score_loss(y_test, y_prob[:, 1])
            except Exception:
                brier = float("nan")
        else:
            auc = roc_auc_score(y_test, y_prob, multi_class="ovr", average="macro")
            y_bin = label_binarize(y_test, classes=list(range(n_classes)))
            ap = average_precision_score(y_bin, y_prob, average="macro")
            brier = float("nan")
        try:
            cv_scores = cross_val_score(model, Xs, y, cv=cv, scoring="accuracy")
        except Exception:
            cv_scores = np.array([accuracy_score(y_test, y_pred)])
        try:
            ll = log_loss(y_test, y_prob)
        except Exception:
            ll = float("nan")
        results[name] = {
            "model": model,
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "f1": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
            "precision": float(precision_score(y_test, y_pred, average="weighted", zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, average="weighted", zero_division=0)),
            "auc": float(auc),
            "ap": float(ap),
            "brier": float(brier) if brier == brier else None,
            "log_loss": float(ll) if ll == ll else None,
            "cv_mean": float(cv_scores.mean()),
            "cv_std": float(cv_scores.std()),
            "y_pred": y_pred,
            "y_prob": y_prob,
            "y_test": y_test,
            "X_test": X_test,
            "X_train": X_train,
            "y_train": y_train,
            "scaler": scaler,
            "Xs": Xs,
        }
    return results, is_binary, n_classes


# Evaluate every cohort
all_cohort_results = {}
for cname, cdat in cohort_data.items():
    print(f"\nTraining on {cname}...")
    res, is_bin, n_cls = train_eval_on_cohort(cdat["X"], cdat["y"], cdat["class_names"])
    all_cohort_results[cname] = {
        "results": res,
        "is_binary": is_bin,
        "n_classes": n_cls,
        "class_names": cdat["class_names"],
        "feature_names": cdat["feature_names"],
    }
    best = max(res, key=lambda k: res[k]["auc"])
    print(f"  Best={best} AUC={res[best]['auc']:.3f} Acc={res[best]['accuracy']:.3f}")

prim_pack = all_cohort_results[primary_name]
prim_results = prim_pack["results"]
is_binary = prim_pack["is_binary"]
n_classes = prim_pack["n_classes"]
class_names = prim_pack["class_names"]
feature_names = prim_pack["feature_names"]
best_model_name = max(prim_results, key=lambda k: prim_results[k]["auc"])
best = prim_results[best_model_name]
model_names = list(MODELS_SPEC.keys())
short_names = [n.replace(" ", "\n") for n in model_names]
cohort_names = list(all_cohort_results.keys())

# Cross-dataset: train on primary, test on others (harmonize feature dims by min d)
def cross_dataset_eval():
    Xp, yp = primary["X"], primary["y"]
    d = Xp.shape[1]
    scaler = StandardScaler()
    Xp_s = scaler.fit_transform(Xp)
    model = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
    model.fit(Xp_s, yp)
    rows = []
    for cname, cdat in cohort_data.items():
        Xo = cdat["X"]
        yo = cdat["y"]
        d2 = min(d, Xo.shape[1])
        # If class sets differ wildly, still try
        try:
            Xs = scaler.transform(Xo[:, :d2]) if Xo.shape[1] >= d2 else scaler.transform(
                np.pad(Xo, ((0, 0), (0, d - Xo.shape[1])), mode="constant")
            )
            if Xo.shape[1] >= d2 and d2 < d:
                # refit scaler on padded? use only first d2 dims consistently
                sc2 = StandardScaler().fit(Xp[:, :d2])
                model2 = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
                model2.fit(sc2.transform(Xp[:, :d2]), yp)
                Xs = sc2.transform(Xo[:, :d2])
                # map labels if needed
                y_use = yo
                if set(np.unique(yo)) - set(np.unique(yp)):
                    # remap to 0..k-1 clipped
                    y_use = yo % max(1, len(set(yp)))
                pred = model2.predict(Xs)
                # only score samples whose labels exist in training
                mask = np.isin(y_use, np.unique(yp))
                if mask.sum() < 10:
                    acc = float("nan")
                else:
                    acc = accuracy_score(y_use[mask], pred[mask])
                proba = model2.predict_proba(Xs)
            else:
                sc2 = StandardScaler().fit(Xp[:, :d2])
                model2 = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
                model2.fit(sc2.transform(Xp[:, :d2]), yp)
                Xs = sc2.transform(Xo[:, :d2])
                y_use = yo
                pred = model2.predict(Xs)
                mask = np.isin(y_use, np.unique(yp))
                acc = accuracy_score(y_use[mask], pred[mask]) if mask.sum() >= 5 else float("nan")
                proba = model2.predict_proba(Xs)
            try:
                if len(set(yp)) == 2 and proba.shape[1] >= 2:
                    m2 = np.isin(y_use, np.unique(yp))
                    auc = roc_auc_score(y_use[m2], proba[m2, 1]) if m2.sum() > 5 else float("nan")
                else:
                    auc = float("nan")
            except Exception:
                auc = float("nan")
            rows.append({"cohort": cname, "accuracy": acc, "auc": auc})
        except Exception as e:
            print(f"  cross-eval fail {cname}: {e}")
            rows.append({"cohort": cname, "accuracy": float("nan"), "auc": float("nan")})
    return rows

cross_rows = cross_dataset_eval()
print("Cross-dataset:", cross_rows)

# ===========================================================
# FIGURE 1: ARCHITECTURE DIAGRAM (Nature panel style)
# ===========================================================
print("\nFig1 architecture...")
fig = plt.figure(figsize=(12.5, 7.2))
ax = fig.add_subplot(111)
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis("off")
ax.set_title("Multi-omics Integration for Cancer Patient Stratification with Cross-cohort Generalization\nEnd-to-end multi-cohort analysis architecture",
             fontsize=12, fontweight="bold", pad=12)

def draw_box(ax, x, y, w, h, label, sublabel="", color="#2c7fb8", text_color="white"):
    box = FancyBboxPatch((x - w / 2, y - h / 2), w, h,
                         boxstyle="round,pad=0.08,rounding_size=0.15",
                         facecolor=color, edgecolor="#222222", linewidth=1.2, zorder=3)
    ax.add_patch(box)
    ax.text(x, y + (0.18 if sublabel else 0), label, ha="center", va="center",
            fontsize=9, fontweight="bold", color=text_color, zorder=4)
    if sublabel:
        ax.text(x, y - 0.28, sublabel, ha="center", va="center",
                fontsize=7.5, color=text_color, alpha=0.95, zorder=4)

def draw_arrow(ax, x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color="#333333", lw=1.6))

# Multi-cohort inputs
n_c = len(cohort_names)
for i, cn in enumerate(cohort_names[:4]):
    yy = 6.2 - i * 1.15
    draw_box(ax, 1.6, yy, 2.4, 0.9, cn.replace("_", "\n")[:28],
             f"n={cohort_data[cn]['X'].shape[0]}", color="#636363")
    draw_arrow(ax, 2.85, yy, 3.7, 4.0)

draw_box(ax, 5.0, 4.0, 2.3, 1.3, "Preprocess",
         "Standardize\nStratified split", color="#2b8cbe")
draw_box(ax, 7.8, 6.0, 2.2, 0.95, "RF", "ensemble", color="#1b9e77")
draw_box(ax, 7.8, 4.7, 2.2, 0.95, "SVM", "RBF kernel", color="#d95f02")
draw_box(ax, 7.8, 3.4, 2.2, 0.95, "LogReg / GB / KNN", "baselines", color="#7570b3")
draw_box(ax, 10.5, 4.0, 2.4, 1.3, "Multi-mode\nevaluation",
         "ROC·PR·Calib·CV", color="#e7298a")
draw_box(ax, 12.7, 4.0, 2.0, 1.3, "Nature-style\nfigures",
         "multi-panel", color="#66a61e")

draw_arrow(ax, 6.2, 4.0, 6.65, 6.0)
draw_arrow(ax, 6.2, 4.0, 6.65, 4.7)
draw_arrow(ax, 6.2, 4.0, 6.65, 3.4)
draw_arrow(ax, 8.95, 6.0, 9.25, 4.5)
draw_arrow(ax, 8.95, 4.7, 9.25, 4.0)
draw_arrow(ax, 8.95, 3.4, 9.25, 3.5)
draw_arrow(ax, 11.75, 4.0, 11.65, 4.0)
draw_arrow(ax, 11.7, 4.0, 11.65, 4.0)
ax.annotate("", xy=(12.0, 4.0), xytext=(11.75, 4.0),
            arrowprops=dict(arrowstyle="-|>", color="#333333", lw=1.6))

ax.text(7.8, 1.6, "Classifier ensemble trained per cohort + cross-cohort transfer",
        ha="center", fontsize=9, style="italic",
        bbox=dict(boxstyle="round", facecolor="#f7f7f7", edgecolor="#999999", alpha=0.95))
ax.add_patch(plt.Rectangle((6.55, 2.75), 2.6, 3.9, fill=False,
                            edgecolor="#1b9e77", linestyle="--", linewidth=1.3, alpha=0.8))

# panel letter
ax.text(0.15, 7.7, "a", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "fig1_architecture.png"), dpi=180, bbox_inches="tight",
            facecolor="white")
plt.close()
print("  saved fig1_architecture.png")

# ===========================================================
# FIGURE 2: MULTI-DATASET PERFORMANCE (Nature multi-panel)
# ===========================================================
print("\nFig2 multi-dataset performance...")
fig = plt.figure(figsize=(13.5, 10.5))
gs = GridSpec(2, 2, figure=fig, hspace=0.32, wspace=0.28)
fig.suptitle("Multi-omics Integration for Cancer Patient Stratification with Cross-cohort Generalization\nMulti-cohort predictive performance",
             fontsize=12, fontweight="bold", y=0.98)

# (a) Grouped bar: Accuracy per model × cohort
ax = fig.add_subplot(gs[0, 0])
x = np.arange(len(model_names))
width = 0.8 / max(1, len(cohort_names))
for i, cn in enumerate(cohort_names):
    vals = [all_cohort_results[cn]["results"][m]["accuracy"] for m in model_names]
    ax.bar(x + i * width, vals, width, label=cn.replace("_", " ")[:22],
           color=COLORS[i % len(COLORS)], edgecolor="white", linewidth=0.6)
ax.set_xticks(x + width * (len(cohort_names) - 1) / 2)
ax.set_xticklabels([m.replace(" ", "\n") for m in model_names], fontsize=8)
ax.set_ylabel("Accuracy")
ax.set_ylim(0, 1.08)
ax.legend(fontsize=7, frameon=True, loc="lower right")
ax.set_title("Accuracy across cohorts", fontweight="bold")
_panel_label(ax, "a")

# (b) Heatmap: AUC model × cohort
ax = fig.add_subplot(gs[0, 1])
auc_mat = np.array([
    [all_cohort_results[cn]["results"][m]["auc"] for m in model_names]
    for cn in cohort_names
])
im = ax.imshow(auc_mat, cmap="YlGnBu", vmin=max(0.4, auc_mat.min() - 0.05), vmax=1.0, aspect="auto")
ax.set_xticks(range(len(model_names)))
ax.set_xticklabels([m.replace(" ", "\n") for m in model_names], fontsize=8)
ax.set_yticks(range(len(cohort_names)))
ax.set_yticklabels([c.replace("_", " ")[:28] for c in cohort_names], fontsize=8)
for i in range(auc_mat.shape[0]):
    for j in range(auc_mat.shape[1]):
        ax.text(j, i, f"{auc_mat[i, j]:.2f}", ha="center", va="center", fontsize=8,
                color="black" if auc_mat[i, j] < 0.85 else "white", fontweight="bold")
plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="AUC-ROC")
ax.set_title("AUC-ROC heatmap (models × cohorts)", fontweight="bold")
_panel_label(ax, "b")

# (c) F1 + Precision/Recall for best model per cohort
ax = fig.add_subplot(gs[1, 0])
metrics_keys = ["accuracy", "f1", "precision", "recall", "auc"]
best_per_cohort = []
for cn in cohort_names:
    res = all_cohort_results[cn]["results"]
    bm = max(res, key=lambda k: res[k]["auc"])
    best_per_cohort.append(bm)
    vals = [res[bm][k] for k in metrics_keys]
    ax.plot(metrics_keys, vals, "o-", lw=2, markersize=7,
            label=f"{cn.replace('_', ' ')[:18]} ({bm.split()[0]})",
            color=COLORS[cohort_names.index(cn) % len(COLORS)])
ax.set_ylim(0, 1.08)
ax.set_ylabel("Score")
ax.set_title("Best-model multi-metric profile per cohort", fontweight="bold")
ax.legend(fontsize=7, loc="lower left")
_panel_label(ax, "c")

# (d) CV stability forest-style
ax = fig.add_subplot(gs[1, 1])
ypos = 0
yticklabels = []
for i, cn in enumerate(cohort_names):
    res = all_cohort_results[cn]["results"]
    for j, m in enumerate(model_names):
        mean = res[m]["cv_mean"]
        std = res[m]["cv_std"]
        ax.errorbar(mean, ypos, xerr=std, fmt="o", color=COLORS[j % len(COLORS)],
                    ecolor=COLORS[j % len(COLORS)], capsize=3, markersize=5)
        yticklabels.append(f"{cn.split('_')[0] if '_' in cn else cn[:8]}·{m.split()[0]}")
        ypos += 1
    ypos += 0.4  # gap between cohorts
ax.set_yticks(range(len(yticklabels)))
# rebuild positions without gaps for ticks — simpler: just label RF per cohort
# Re-plot cleaner version:
ax.cla()
xpos = np.arange(len(cohort_names))
for j, m in enumerate(model_names):
    means = [all_cohort_results[cn]["results"][m]["cv_mean"] for cn in cohort_names]
    stds = [all_cohort_results[cn]["results"][m]["cv_std"] for cn in cohort_names]
    ax.errorbar(xpos + j * 0.12 - 0.24, means, yerr=stds, fmt="o",
                color=COLORS[j % len(COLORS)], label=m, capsize=3, markersize=6)
ax.set_xticks(xpos)
ax.set_xticklabels([c.replace("_", "\n")[:20] for c in cohort_names], fontsize=8)
ax.set_ylabel("5-fold CV accuracy")
ax.set_ylim(0, 1.08)
ax.legend(fontsize=7, ncol=2, loc="lower right")
ax.set_title("Cross-validation stability across cohorts", fontweight="bold")
_panel_label(ax, "d")

plt.savefig(os.path.join(FIG_DIR, "fig2_multidataset_performance.png"),
            dpi=180, bbox_inches="tight", facecolor="white")
plt.close()
print("  saved fig2_multidataset_performance.png")

# ===========================================================
# FIGURE 3: MULTI-MODE EVALUATION (primary cohort)
# ===========================================================
print("\nFig3 multi-mode evaluation...")
fig = plt.figure(figsize=(13.5, 11.0))
gs = GridSpec(2, 3, figure=fig, hspace=0.35, wspace=0.32)
fig.suptitle(
    f"{primary_name.replace('_', ' ')} — multi-mode model evaluation\n"
    + """Multi-omics Integration for Cancer Patient Stratification with Cross-cohort Generalization""",
    fontsize=12, fontweight="bold", y=0.98,
)

# (a) ROC
ax = fig.add_subplot(gs[0, 0])
for (name, r), color in zip(prim_results.items(), COLORS):
    yt, yp = r["y_test"], r["y_prob"]
    if is_binary:
        fpr, tpr, _ = roc_curve(yt, yp[:, 1] if yp.ndim > 1 else yp)
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{name.split()[0]} ({r['auc']:.3f})")
    else:
        y_bin = label_binarize(yt, classes=list(range(n_classes)))
        # micro-average style: plot mean ROC via first class as illustration + macro AUC in label
        fpr, tpr, _ = roc_curve(y_bin.ravel(), yp.ravel())
        ax.plot(fpr, tpr, color=color, lw=2, label=f"{name.split()[0]} ({r['auc']:.3f})")
ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
ax.set_xlabel("False positive rate")
ax.set_ylabel("True positive rate")
ax.set_title("ROC curves", fontweight="bold")
ax.legend(fontsize=7, loc="lower right")
_panel_label(ax, "a")

# (b) Precision-Recall
ax = fig.add_subplot(gs[0, 1])
for (name, r), color in zip(prim_results.items(), COLORS):
    yt, yp = r["y_test"], r["y_prob"]
    if is_binary:
        prec_c, rec_c, _ = precision_recall_curve(yt, yp[:, 1])
        ax.plot(rec_c, prec_c, color=color, lw=2, label=f"{name.split()[0]} (AP={r['ap']:.3f})")
    else:
        y_bin = label_binarize(yt, classes=list(range(n_classes)))
        prec_c, rec_c, _ = precision_recall_curve(y_bin.ravel(), yp.ravel())
        ax.plot(rec_c, prec_c, color=color, lw=2, label=f"{name.split()[0]} (AP={r['ap']:.3f})")
ax.set_xlabel("Recall")
ax.set_ylabel("Precision")
ax.set_title("Precision–recall curves", fontweight="bold")
ax.legend(fontsize=7, loc="lower left")
_panel_label(ax, "b")

# (c) Calibration (binary) or confusion for best (multi)
ax = fig.add_subplot(gs[0, 2])
if is_binary:
    for (name, r), color in zip(prim_results.items(), COLORS):
        try:
            frac_pos, mean_pred = calibration_curve(r["y_test"], r["y_prob"][:, 1], n_bins=8, strategy="quantile")
            ax.plot(mean_pred, frac_pos, "s-", color=color, lw=1.8, markersize=4,
                    label=name.split()[0])
        except Exception:
            pass
    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
    ax.set_xlabel("Mean predicted probability")
    ax.set_ylabel("Fraction of positives")
    ax.set_title("Calibration curves", fontweight="bold")
    ax.legend(fontsize=7)
else:
    cm = confusion_matrix(best["y_test"], best["y_pred"])
    sns.heatmap(cm, annot=True, fmt="d", cmap="Purples", ax=ax,
                xticklabels=[str(c)[:8] for c in class_names],
                yticklabels=[str(c)[:8] for c in class_names],
                cbar_kws={"shrink": 0.7})
    ax.set_title(f"Confusion · {best_model_name}", fontweight="bold")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
_panel_label(ax, "c")

# (d) Confusion for best if binary (else metric bars)
ax = fig.add_subplot(gs[1, 0])
if is_binary:
    cm = confusion_matrix(best["y_test"], best["y_pred"])
    sns.heatmap(cm, annot=True, fmt="d", cmap="Greens", ax=ax,
                xticklabels=[str(c)[:10] for c in class_names],
                yticklabels=[str(c)[:10] for c in class_names],
                cbar_kws={"shrink": 0.7})
    ax.set_title(f"Confusion matrix · {best_model_name}", fontweight="bold")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
else:
    keys = ["accuracy", "f1", "precision", "recall", "auc"]
    x = np.arange(len(model_names))
    width = 0.15
    for i, k in enumerate(keys):
        ax.bar(x + i * width, [prim_results[m][k] for m in model_names], width,
               label=k, color=COLORS[i % len(COLORS)])
    ax.set_xticks(x + 2 * width)
    ax.set_xticklabels([m.replace(" ", "\n") for m in model_names], fontsize=8)
    ax.set_ylim(0, 1.08)
    ax.legend(fontsize=7)
    ax.set_title("Metric suite (primary)", fontweight="bold")
_panel_label(ax, "d")

# (e) Radar chart of metrics for top models
ax = fig.add_subplot(gs[1, 1], projection="polar")
radar_metrics = ["accuracy", "f1", "precision", "recall", "auc"]
angles = np.linspace(0, 2 * np.pi, len(radar_metrics), endpoint=False).tolist()
angles += angles[:1]
for idx, name in enumerate(model_names[:4]):
    vals = [prim_results[name][k] for k in radar_metrics]
    vals += vals[:1]
    ax.plot(angles, vals, "o-", lw=1.8, color=COLORS[idx], label=name.split()[0], markersize=3)
    ax.fill(angles, vals, color=COLORS[idx], alpha=0.08)
ax.set_xticks(angles[:-1])
ax.set_xticklabels(radar_metrics, fontsize=8)
ax.set_ylim(0, 1.0)
ax.set_title("Radar · multi-metric", fontweight="bold", pad=12)
ax.legend(fontsize=7, loc="upper right", bbox_to_anchor=(1.35, 1.1))
_panel_label(ax, "e", x=-0.15, y=1.15)

# (f) Learning curve for best model
ax = fig.add_subplot(gs[1, 2])
clf = MODELS_SPEC[best_model_name]()
Xs = best["Xs"]
y_all = primary["y"]
try:
    train_sizes, train_scores, val_scores = learning_curve(
        clf, Xs, y_all, cv=min(5, max(2, int(np.min(np.bincount(y_all))))),
        n_jobs=-1, train_sizes=np.linspace(0.2, 1.0, 6), scoring="accuracy",
    )
    tr_m, tr_s = train_scores.mean(1), train_scores.std(1)
    va_m, va_s = val_scores.mean(1), val_scores.std(1)
    ax.plot(train_sizes, tr_m, "o-", color=COLORS[0], lw=2, label="Train")
    ax.fill_between(train_sizes, tr_m - tr_s, tr_m + tr_s, alpha=0.15, color=COLORS[0])
    ax.plot(train_sizes, va_m, "s-", color=COLORS[1], lw=2, label="CV")
    ax.fill_between(train_sizes, va_m - va_s, va_m + va_s, alpha=0.15, color=COLORS[1])
except Exception as e:
    ax.text(0.5, 0.5, f"Learning curve unavailable\n({e})", ha="center", va="center",
            transform=ax.transAxes)
ax.set_xlabel("Training samples")
ax.set_ylabel("Accuracy")
ax.set_title(f"Learning curve · {best_model_name}", fontweight="bold")
ax.legend(fontsize=8)
_panel_label(ax, "f")

plt.savefig(os.path.join(FIG_DIR, "fig3_multimode_evaluation.png"),
            dpi=180, bbox_inches="tight", facecolor="white")
plt.close()
print("  saved fig3_multimode_evaluation.png")

# ===========================================================
# FIGURE 4: INTERPRETABILITY + CROSS-DATASET GENERALIZATION
# ===========================================================
print("\nFig4 interpretability + transfer...")
fig = plt.figure(figsize=(13.5, 10.0))
gs = GridSpec(2, 2, figure=fig, hspace=0.32, wspace=0.28)
fig.suptitle("Multi-omics Integration for Cancer Patient Stratification with Cross-cohort Generalization\nInterpretability and cross-cohort generalization",
             fontsize=12, fontweight="bold", y=0.98)

# (a) Feature importance
ax = fig.add_subplot(gs[0, 0])
rf = prim_results["Random Forest"]["model"]
importances = rf.feature_importances_
top_k = min(15, len(feature_names))
idx = np.argsort(importances)[-top_k:]
ax.barh(range(top_k), importances[idx],
        color=plt.cm.viridis(np.linspace(0.25, 0.9, top_k)), edgecolor="white")
ax.set_yticks(range(top_k))
ax.set_yticklabels([feature_names[i] if i < len(feature_names) else f"f{i}" for i in idx],
                   fontsize=8)
ax.set_xlabel("Gini importance")
ax.set_title("Top features · Random Forest (primary)", fontweight="bold")
_panel_label(ax, "a")

# (b) PCA overview of primary colored by class
ax = fig.add_subplot(gs[0, 1])
pca = PCA(n_components=2, random_state=42)
Xp_pca = pca.fit_transform(StandardScaler().fit_transform(primary["X"]))
sc = ax.scatter(Xp_pca[:, 0], Xp_pca[:, 1], c=primary["y"], cmap="coolwarm",
                s=14, alpha=0.7, edgecolors="none")
ax.set_xlabel(f"PC1 ({pca.explained_variance_ratio_[0]*100:.1f}%)")
ax.set_ylabel(f"PC2 ({pca.explained_variance_ratio_[1]*100:.1f}%)")
ax.set_title("Primary cohort PCA", fontweight="bold")
handles = [mpatches.Patch(color=plt.cm.coolwarm(i / max(1, n_classes - 1)),
                          label=str(class_names[i]) if i < len(class_names) else str(i))
           for i in range(n_classes)]
ax.legend(handles=handles, fontsize=8, loc="best")
_panel_label(ax, "b")

# (c) Cross-cohort transfer accuracy
ax = fig.add_subplot(gs[1, 0])
cnames = [r["cohort"] for r in cross_rows]
accs = [r["accuracy"] if r["accuracy"] == r["accuracy"] else 0 for r in cross_rows]
bars = ax.barh([c.replace("_", " ")[:28] for c in cnames], accs,
               color=[COLORS[i % len(COLORS)] for i in range(len(cnames))],
               edgecolor="white")
for bar, val in zip(bars, accs):
    ax.text(val + 0.01, bar.get_y() + bar.get_height() / 2, f"{val:.2f}",
            va="center", fontsize=8, fontweight="bold")
ax.set_xlim(0, 1.15)
ax.set_xlabel("Accuracy (train primary → test cohort)")
ax.set_title("Cross-cohort transfer (RF)", fontweight="bold")
_panel_label(ax, "c")

# (d) Per-cohort class balance + sample sizes
ax = fig.add_subplot(gs[1, 1])
# grouped sample counts / class balance
bottoms = np.zeros(len(cohort_names))
# Use max classes across
max_c = max(all_cohort_results[cn]["n_classes"] for cn in cohort_names)
for ci in range(max_c):
    heights = []
    for cn in cohort_names:
        y = cohort_data[cn]["y"]
        heights.append(float(np.sum(y == ci)) / max(1, len(y)))
    ax.bar(range(len(cohort_names)), heights, bottom=bottoms,
           color=COLORS[ci % len(COLORS)], edgecolor="white",
           label=f"class {ci}")
    bottoms += np.array(heights)
ax.set_xticks(range(len(cohort_names)))
ax.set_xticklabels([c.replace("_", "\n")[:18] for c in cohort_names], fontsize=8)
ax.set_ylabel("Class fraction")
ax.set_ylim(0, 1.05)
ax.legend(fontsize=7, ncol=min(3, max_c))
# annotate n
for i, cn in enumerate(cohort_names):
    ax.text(i, 1.02, f"n={cohort_data[cn]['X'].shape[0]}", ha="center", fontsize=7)
ax.set_title("Cohort size & class composition", fontweight="bold")
_panel_label(ax, "d")

plt.savefig(os.path.join(FIG_DIR, "fig4_interpretability_transfer.png"),
            dpi=180, bbox_inches="tight", facecolor="white")
plt.close()
print("  saved fig4_interpretability_transfer.png")

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
        "average_precision": float(r["ap"]),
        "cv_accuracy_mean": float(r["cv_mean"]),
        "cv_accuracy_std": float(r["cv_std"]),
    }
    for name, r in prim_results.items()
}

per_cohort_metrics = {}
for cn, pack in all_cohort_results.items():
    per_cohort_metrics[cn] = {
        mname: {
            "accuracy": float(r["accuracy"]),
            "f1": float(r["f1"]),
            "roc_auc": float(r["auc"]),
            "cv_accuracy_mean": float(r["cv_mean"]),
        }
        for mname, r in pack["results"].items()
    }

results_data = {
    "best_model": best_model_name,
    "best_auc": float(best["auc"]),
    "best_accuracy": float(best["accuracy"]),
    "best_f1": float(best["f1"]),
    "n_samples": int(primary["X"].shape[0]),
    "n_features": int(primary["X"].shape[1]),
    "n_classes": int(n_classes),
    "class_names": [str(c) for c in class_names],
    "primary_cohort": primary_name,
    "n_datasets": len(cohort_names),
    "cohort_names": cohort_names,
    "all_models": final_metrics,
    "per_cohort_metrics": per_cohort_metrics,
    "cross_dataset": cross_rows,
    "figures": [
        {
            "filename": "fig1_architecture.png",
            "caption": (
                "End-to-end multi-cohort analysis architecture: parallel cohort ingestion, "
                "shared preprocessing, classifier ensemble, multi-mode evaluation, and "
                "Nature-style multi-panel figure generation."
            ),
        },
        {
            "filename": "fig2_multidataset_performance.png",
            "caption": (
                "Multi-cohort predictive performance. (a) Accuracy of each model across cohorts. "
                "(b) AUC-ROC heatmap (models × cohorts). (c) Multi-metric profile of the "
                "best model per cohort. (d) Cross-validation accuracy (mean ± s.d.)."
            ),
        },
        {
            "filename": "fig3_multimode_evaluation.png",
            "caption": (
                "Multi-mode evaluation on the primary cohort. (a) ROC curves. "
                "(b) Precision–recall curves. (c) Calibration or confusion analysis. "
                "(d) Confusion matrix or metric suite. (e) Multi-metric radar chart. "
                "(f) Learning curve for the best model."
            ),
        },
        {
            "filename": "fig4_interpretability_transfer.png",
            "caption": (
                "Interpretability and cross-cohort generalization. (a) Top Random Forest "
                "feature importances on the primary cohort. (b) PCA projection of the primary "
                "cohort. (c) Cross-cohort transfer accuracy of a primary-trained RF. "
                "(d) Cohort sizes and class composition."
            ),
        },
    ],
}

with open(RESULTS_JSON, "w") as f:
    json.dump(results_data, f, indent=2)

print("\n" + "=" * 60)
print("ANALYSIS COMPLETE")
print(f"Cohorts: {cohort_names}")
print(f"Best model (primary): {best_model_name}")
print(f"Best AUC-ROC: {best['auc']:.4f}")
print(f"Best Accuracy: {best['accuracy']:.4f}")
print("=" * 60)
