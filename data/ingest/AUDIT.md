# Data audit v2: DATA.zip

## What was added
- 20 processed tables (PSI-25, 39, 69, 99, 101, 102, 107, 115, 117, 142, 159), copied unchanged.
- 6 hand-collected context tables (incidents, atmospheres, gravity, literature cross-check, MSL-1 heptane, fuel properties).
- 2 raw experimental workbooks (PSI-101 SAME-R xlsx) and 1 raw table (PSI-102 SAME).
- 1 raw telemetry workbook (Saffire 2017, 11,450 rows), not yet identified.
- Reports: SAME final report (68 pages), 1976 and 1982 PDFs, Apollo 204 review board web page, ISS video.
- A model (FLEX extinction), recommendations, objectives, and verification log.

## Nothing in the website was changed
The new data is in `ingest/` only. No existing catalog file, page, or feature was edited. The app reads
`data/real/` and `public/data/`; none of these files are imported by the new package.

## What was checked
- FLEX processed table = raw FLEX table: 274 rows, same O2 sequence, same 197 extinction diameters. **Verified.**
- Apollo 204 atmosphere (16.7 psia, 100 % O2): found in the review board text. **Verified.**
- Apollo 204 date (1967-01-27), Mir (1997-02-24), Bondarenko (1961): not in the loaded documents. **Not verified.**
- Two statements in the recommendations overstated the counts; corrected after recomputation from the raw table.

## Problems found
1. **1982.pdf is not a flammability study.** It is the NASA Spinoff 1982 magazine (OCR confirmed).
2. **1976.pdf** is the NASA Bicentennial technology utilization report. No combustion dataset found.
3. **The O2 and pressure flammability study** is best matched by PSI-25 (materials catalogue, 129 tests).
   It varies O2 but has no total-pressure column. Pressure cannot be modelled from it.
4. **The 2017 telemetry workbook** (Saffire_Data_Table2017) has no run label in the files. Identify before use.
5. **PSI-102 duplicate:** two copies of the same SAME table; one removed from the package.
6. **Rights:** all PSI tables and the SAME report are marked UNKNOWN_CONFIRM. Confirm before publishing.
7. **reports_corpus.csv** (3,097 rows of extracted text from copyrighted documents) is excluded from the package. Only its manifest entry is kept.
8. **ISS video** is listed but not analysed.

## Model result (FLEX extinction vs completion)
- 213 tests (186 extinction, 27 completion); disruptions excluded.
- Logistic regression, 5-fold x 10 repeats: accuracy 0.875 ± 0.024 vs majority baseline 0.873. AUC 0.82 ± 0.10.
- **Conclusion:** the model does not beat the majority class on accuracy. It is descriptive only.

## Next steps
1. Confirm rights for PSI tables and the SAME report.
2. Identify the 2017 telemetry run and reconcile it with SAFFIRE-III or Saffire-I/II.
3. Build a SAME-R detection model once the detection label is confirmed in psi101_detection.csv.
4. Extract facts from the SAME final report (68 pages) with page citations.
5. Decide where the ingest data appears in the website. Adding it to Explore or Insights changes existing features, so it needs your approval.
