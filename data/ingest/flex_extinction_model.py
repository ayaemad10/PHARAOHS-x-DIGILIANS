"""FLEX droplet: predict extinction vs completion from initial conditions.

Data: processed FLEX burns (psi69_all_burns.csv), 274 tests, reconciled against the raw FLEX table
already in the catalog. Target: 'Extinction' (1) vs 'Completion' (0). 'Disruption' tests are
excluded from training because they do not state whether the flame extinguished or finished.
Model: standardized logistic regression (interpretable, coefficients can be reported).
Evaluation: stratified 5-fold cross-validation, repeated 10 times, against a majority-class baseline.
"""
import json, numpy as np, pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, accuracy_score, roc_auc_score
from sklearn.dummy import DummyClassifier

SRC = '/home/claude/data_in/DATA/data/processed/psi69_all_burns.csv'
df = pd.read_csv(SRC)
d = df[df['test_end'].isin(['Extinction', 'Completion'])].copy()
d['y'] = (d['test_end'] == 'Extinction').astype(int)
d['fuel_heptane'] = (d['fuel'].str.lower() == 'heptane').astype(int)
FEATURES = ['o2_frac', 'pressure_mmhg', 'd0_mm', 'n2_frac', 'he_frac', 'co2_frac', 'fuel_heptane']
X = d[FEATURES].astype(float).fillna(0.0).values
y = d['y'].values

cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=10, random_state=0)
scoring = {'accuracy': 'accuracy', 'roc_auc': 'roc_auc'}
logit = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, C=1.0))
base = DummyClassifier(strategy='most_frequent')
res_m = cross_validate(logit, X, y, cv=cv, scoring=scoring)
res_b = cross_validate(base, X, y, cv=cv, scoring=scoring)
metrics = {
  'n_train': int(len(d)), 'n_extinction': int(y.sum()), 'n_completion': int((1 - y).sum()),
  'model_cv_accuracy_mean': round(float(res_m['test_accuracy'].mean()), 3),
  'model_cv_accuracy_sd': round(float(res_m['test_accuracy'].std()), 3),
  'model_cv_auc_mean': round(float(res_m['test_roc_auc'].mean()), 3),
  'model_cv_auc_sd': round(float(res_m['test_roc_auc'].std()), 3),
  'baseline_cv_accuracy_mean': round(float(res_b['test_accuracy'].mean()), 3),
  'folds': '5-fold x 10 repeats, stratified',
}

# Fit on all data for the reported coefficients and the sensitivity statements
logit.fit(X, y)
coef = logit[-1].coef_[0] / logit[0].scale_   # back to raw units per feature
intercept = logit[-1].intercept_[0]                 # standardized scale
intercept_raw = intercept - float((coef * logit[0].mean_).sum())  # raw units, pairs with coef
coefficients = {f: {'per_unit': round(float(c), 4)} for f, c in zip(FEATURES, coef)}

# Sensitivity at the median test: change in predicted P(extinction) per +1 % O2 and per +10 mmHg
med = d[FEATURES].astype(float).median()
def p_at(row):
    return float(logit.predict_proba(pd.DataFrame([row], columns=FEATURES).values)[0, 1])
base_p = p_at(med)
o2_up = med.copy(); o2_up['o2_frac'] = med['o2_frac'] + 0.01
p_up = p_at(o2_up)
pr_up = med.copy(); pr_up['pressure_mmhg'] = med['pressure_mmhg'] + 10
p_pr = p_at(pr_up)
sens = {
  'median_conditions': {k: round(float(v), 4) for k, v in med.items()},
  'p_extinction_at_median': round(base_p, 3),
  'change_per_plus_1pct_O2': round(p_up - base_p, 3),
  'change_per_plus_10mmHg_pressure': round(p_pr - base_p, 3),
}

# Extinction rate by O2 bin, measured, for the recommendation text
d['o2_pct'] = (d['o2_frac'] * 100).round(0)
bins = d.groupby('o2_pct')['y'].agg(['count', 'mean']).reset_index()
bins_out = [{'o2_pct': float(r.o2_pct), 'tests': int(r['count']), 'extinction_share_pct': round(float(r['mean']) * 100, 1)} for _, r in bins.iterrows()]

out = {'target': 'Extinction vs Completion (Disruption excluded)', 'features': FEATURES,
       'metrics': metrics, 'coefficients_raw_units': coefficients, 'intercept': round(float(intercept), 4), 'intercept_raw_units': round(intercept_raw, 4),
       'sensitivity': sens, 'extinction_by_o2_pct': bins_out,
       'limitations': [
         'Only 274 tests, one droplet configuration family (methanol and heptane).',
         'Disruption tests (61) are excluded; their outcome is not a clean extinction or completion.',
         'Pressure varies little in this table, so its coefficient is poorly determined.',
         'Model describes this test campaign, not flames in general or in other spacecraft.']}
json.dump(out, open('/home/claude/model/flex_extinction_model.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps(metrics, indent=1)); print(json.dumps(sens, indent=1)); print(json.dumps(bins_out, indent=0)[:600])
