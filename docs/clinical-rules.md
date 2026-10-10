# MediTrack V3.1 — Clinical Contradiction Rules & Logic

This document specifies the rules, mathematical normalization, and clinical severity matrices employed by the **Contradiction Detection Engine** in [`contradictionEngine.ts`](file:///d:/meditrack-v2.0/Meditrack%20V3.1/contradictionEngine.ts).

---

## 1. Engine Objective

In healthcare longitudinal tracking, contradictory data between reports can stem from:
1. **Lab Error or Transcription Discrepancy**: Different reports on the same date with conflicting readings.
2. **Biological Invariants**: Static physiological traits that should never change (e.g., Blood Group).
3. **Extreme Unrealistic Velocity**: Physiological shifts that cannot occur naturally within short time intervals.

The engine must accurately flag genuine clinical conflicts **without** triggering false positives on equivalent numeric formatting (such as `120` vs `120.0`).

---

## 2. Normalization Rules

### Numeric Formatting
Values are compared numerically when possible:
- `120`, `120.0`, `120.00` are parsed via `parseFloat()` with an epsilon threshold of `1e-6`.
- Percentage representations (`5.7%` vs `5.7`) have unit suffixes stripped during normalization.

### Blood Pressure Splitting
Compound blood pressure strings (`130/80` vs `130/85`) are deconstructed:
- Systolic (`130`) and Diastolic (`80`) components are evaluated independently.
- Avoids treating minor diastolic changes as complete measurement invalidations.

### Case and Date Normalization
- Parameter names are trimmed, lowercased, and mapped to clinical canonical forms (e.g., `HbA1c`, `hba1c`, `Hemoglobin A1c` map to `hba1c`).
- Dates are normalized to ISO `YYYY-MM-DD` strings.

---

## 3. Severity Matrix & Evaluation Criteria

| Severity | Criteria | Example |
| :--- | :--- | :--- |
| **`CRITICAL`** | Mutated biological invariants or extreme contradictory values on the exact same date. | Blood Group `O+` vs `A+`, or Fasting Glucose `95` vs `280` on the same date. |
| **`HIGH`** | Significant conflicting classifications (e.g., `NORMAL` vs `CRITICAL HIGH`) within a 48-hour window. | Serum Potassium `4.1 mEq/L` (Normal) vs `6.8 mEq/L` (Severe Hyperkalemia) 24h apart. |
| **`MEDIUM`** | Noticeable longitudinal discrepancy without clinical progression explanation. | Total Cholesterol delta > 100 mg/dL over a 3-day interval. |
| **`LOW`** | Borderline classification mismatch or minor unit mismatch. | Fasting Glucose `99` (Normal) vs `101` (Prediabetic) within 7 days. |

---

## 4. Pair Deduplication Algorithm

When comparing multiple reports across a patient history:
- A conflict between Report A and Report B produces symmetric pairs `(A, B)` and `(B, A)`.
- The engine guarantees deduplication by ordering identifiers canonically (`min(id_a, id_b)` and `max(id_a, id_b)`).
- Ensures the user interface and database store exactly one unique conflict record per contradictory pair.

---

## 5. Verification Suite Coverage

The contradiction engine is covered by automated regression tests in `test_contradiction.ts`:
- **Test 1**: Same-date conflicting glucose levels flag as `CRITICAL`.
- **Test 2**: Identical numeric representations (`120` vs `120.0`) are evaluated as non-contradictory.
- **Test 3**: Biological invariant shifts (Blood Type) trigger invariant conflict.
- **Test 4**: Blood pressure compound comparisons accurately isolate systolic vs diastolic variations.
- **Test 5**: Symmetric pair deduplication eliminates duplicate records.
