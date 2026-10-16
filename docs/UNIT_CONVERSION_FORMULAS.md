# MEDITRACK UNIVERSAL UNIT CONVERSION & CLINICAL FORMULA SPECIFICATION

**Document Version:** 3.1.0-clinical  
**Authoritative Location:** `docs/UNIT_CONVERSION_FORMULAS.md`  
**Central Conversion Engine:** `src/lib/units/` (`registry.ts`, `converter.ts`, `types.ts`, `index.ts`)  
**Target Application:** MediTrack V3.1 Clinical Health Intelligence Platform  

---

## 1. PURPOSE AND SCOPE

The MediTrack Universal Unit Conversion System provides an authoritative, mathematically rigorous, clinically safe, and reversible unit conversion engine across all tiers of the MediTrack V3.1 platform. 

The primary objectives of this specification and implementation are:
1. **Clinical Safety First:** Prevent dangerous medical misinterpretations caused by improper unit conversions, incorrect analyte multipliers, or invalid dimension cross-conversions.
2. **Provenance & Auditability:** Preserve original laboratory-reported numerical values, raw units, and laboratory flags verbatim. Display conversions dynamically without mutating or destructively overwriting stored observations.
3. **Analyte Specificity:** Restrict concentration conversions (e.g., mg/dL to mmol/L) to analyte-specific molecular weights and validated constants. Under no circumstances is a universal multiplier applied across different chemical compounds.
4. **Architectural Centralization:** Eliminate duplicate conversion logic across isolated React components. A single authoritative engine in `src/lib/units/` executes all conversions and formatting rules.
5. **Reversibility and Precision:** Maintain full floating-point precision throughout intermediate calculations, applying clinical presentation rounding only at the user-facing display boundary.

---

## 2. SUPPORTED UNITS INVENTORY

The following inventory details every scientific and physical quantity supported across MediTrack:

| Parameter / Category | Supported Physical Units | Canonical Unit | Dimension | Clinical Role |
| :--- | :--- | :--- | :--- | :--- |
| **Height / Stature** | cm, mm, m, in, ft, compound (ft & in) | `cm` | Length | Biometric baseline, BSA, BMI calculation |
| **Body Weight** | kg, g, mg, µg, lb, oz | `kg` | Mass | Biometric baseline, drug dosing, BMI calculation |
| **Body Temperature** | °C, °F, K | `°C` | Temperature | Vital signs, infection & fever screening |
| **Blood Pressure** | mmHg, kPa, Pa, bar | `mmHg` | Pressure | Hemodynamic arterial monitoring (sys/dia) |
| **Heart Rate** | bpm, beats/min, min⁻¹ | `bpm` | Frequency | Cardiac cycle frequency |
| **Respiratory Rate** | breaths/min, min⁻¹ | `breaths/min` | Frequency | Pulmonary ventilation rate |
| **Oxygen Saturation** | % (SpO₂) | `%` | Proportion | Peripheral hemoglobin oxygen saturation |
| **Fasting Blood Glucose** | mg/dL, mmol/L, mg% | `mg/dL` | Concentration | Endocrine glycemic control, diabetes |
| **Serum / Random Glucose** | mg/dL, mmol/L, mg% | `mg/dL` | Concentration | Acute metabolic monitoring |
| **Total Cholesterol** | mg/dL, mmol/L | `mg/dL` | Concentration | Cardiovascular lipid screening |
| **HDL Cholesterol** | mg/dL, mmol/L | `mg/dL` | Concentration | Atheroprotective lipoprotein monitoring |
| **LDL Cholesterol** | mg/dL, mmol/L | `mg/dL` | Concentration | Atherogenic lipoprotein monitoring |
| **Serum Triglycerides** | mg/dL, mmol/L | `mg/dL` | Concentration | Circulating lipid and energy substrate |
| **Serum Creatinine** | mg/dL, µmol/L | `mg/dL` | Concentration | Renal glomerular filtration surrogate |
| **Blood Urea Nitrogen** | mg/dL, mmol/L | `mg/dL` | Concentration | Renal & protein catabolism evaluation |
| **Serum Urea** | mg/dL, mmol/L | `mg/dL` | Concentration | Intact urea excretory monitoring |
| **Urine Albumin/Creatinine** | mg/g, mg/mmol | `mg/g` | Substance Ratio | Diabetic nephropathy & microalbuminuria |
| **Hemoglobin** | g/dL, g/L, gm/dL, g% | `g/dL` | Concentration | Red cell oxygen delivery capacity |
| **Hematocrit (PCV)** | %, L/L (volume fraction) | `%` | Proportion | Erythrocyte blood volume proportion |
| **Platelet Count** | x10³/µL, lakh/µL, /µL, x10⁹/L | `x10³/µL` | Cell Count | Primary hemostasis & coagulation status |
| **White Blood Cells (WBC)** | /µL, x10³/µL, x10⁹/L | `/µL` | Cell Count | Immune status & infection surveillance |
| **Red Blood Cells (RBC)** | million/µL, x10¹²/L | `million/µL` | Cell Count | Erythrocyte absolute cellular count |
| **ALT (SGPT)** | U/L, IU/L | `U/L` | Enzymatic | Hepatocellular integrity biomarker |
| **AST (SGOT)** | U/L, IU/L | `U/L` | Enzymatic | Tissue injury & hepatocellular enzyme |
| **ALP & GGT** | U/L, IU/L | `U/L` | Enzymatic | Cholestatic & biliary tract enzymes |
| **Total / Direct Bilirubin** | mg/dL, µmol/L | `mg/dL` | Concentration | Hepatic uptake & biliary clearance |
| **Total Protein / Albumin** | g/dL, g/L | `g/dL` | Concentration | Oncotic pressure & nutritional status |
| **Electrolytes (Na⁺, K⁺, Cl⁻)** | mEq/L, mmol/L | `mEq/L` | Concentration | Fluid balance, neuromuscular conduction |
| **Calcium (Total)** | mg/dL, mmol/L | `mg/dL` | Concentration | Mineral metabolism, neuromuscular tone |
| **Magnesium** | mg/dL, mmol/L | `mg/dL` | Concentration | Enzymatic cofactor, cardiac stability |
| **Inorganic Phosphate** | mg/dL, mmol/L | `mg/dL` | Concentration | Bone metabolism & energy storage |
| **Uric Acid** | mg/dL, µmol/L | `mg/dL` | Concentration | Purine metabolism & gout assessment |
| **TSH** | µIU/mL, mIU/L | `µIU/mL` | Concentration | Anterior pituitary thyroid regulation |
| **25-OH Vitamin D** | ng/mL, nmol/L | `ng/mL` | Concentration | Bone density & systemic immune health |
| **Vitamin B12 (Cobalamin)** | pg/mL, pmol/L | `pg/mL` | Concentration | Hematopoiesis & neural myelin status |
| **Glycated Hemoglobin (HbA1c)** | % (NGSP), mmol/mol (IFCC) | `%` | Proportion | Long-term (3-month) glycemic control |
| **Body Mass Index (BMI)** | kg/m² | `kg/m²` | Clinical Index | Weight-for-height nutritional index |

---

## 3. UNIT IDENTIFIERS AND SYMBOLS

Each unit maintains a standardized primary display symbol and acceptable alias patterns:

```typescript
export interface UnitDefinition {
  id: string;              // Internal unique key (e.g. 'mg_dl', 'celsius')
  symbol: string;          // Display symbol (e.g. 'mg/dL', '°C')
  name: string;            // Descriptive name ('Milligrams per deciliter')
  dimension: MeasurementDimension;
  system: 'SI' | 'US_CUSTOMARY' | 'IMPERIAL' | 'CLINICAL' | 'CONVENTIONAL';
  aliases: string[];       // OCR/Report variations ('mg%', 'mg/100ml')
  defaultDecimals: number; // Clinically standard display precision
  allowNegative: boolean;  // Temperature allows negative; mass/length do not
  physicalMinimum?: number;// Minimum physical limit (e.g., 0 K)
}
```

### Normalization and Greek Letter Standardization
Laboratory reports regularly express units using distinct character encodings for the Greek letter micro:
- Unicode `U+03BC` (Greek Small Letter Mu: `μ`)
- Unicode `U+00B5` (Micro Sign: `µ`)
- ASCII equivalent (`u`)

The sanitizer automatically maps all variations to a canonical internal representation:
```typescript
clean = unit.trim().toLowerCase().replace(/[μµ]/g, 'u').replace(/\s+/g, ' ');
```

---

## 4. MEASUREMENT DIMENSIONS

Conversions are constrained by physical dimensions:
- `length`: Length, height, distance
- `mass`: Mass, weight
- `temperature`: Thermal equilibrium measurements
- `volume`: Fluid volume
- `pressure`: Force per unit area
- `frequency`: Reciprocal time, rates of recurrence
- `analyte_concentration`: Mass or molar concentration in biological fluid
- `proportion`: Percentages, fractions, ratios
- `enzymatic_activity`: Catalytic activity of clinical enzymes
- `cell_count`: Absolute or scaled count of biological cells per volume
- `substance_ratio`: Multi-component ratio (e.g., mass-to-mass, mass-to-mole)
- `clinical_index`: Derived mathematical multi-variable formulas (BMI)

**Dimensional Rule:** Direct conversion between different dimensions is mathematically impossible and clinically dangerous. Any attempt to convert across distinct dimensions (e.g., `kg` to `mmHg`, or `°C` to `kg`) throws an explicit error and is rejected.

---

## 5. CANONICAL STORAGE UNITS

To eliminate conversion compounding artifacts and prevent historical drift, MediTrack stores all normalized laboratory values in predefined Canonical Units:

1. **Biometrics:**
   - Stature: `cm`
   - Weight: `kg`
   - Temperature: `°C`
2. **Clinical Chemistry:**
   - Glucose: `mg/dL`
   - Lipids (Total Cholesterol, LDL, HDL, Triglycerides): `mg/dL`
   - Renal (Creatinine, BUN, Urea): `mg/dL`
   - Bilirubin, Calcium, Magnesium, Phosphate, Uric Acid: `mg/dL`
   - Electrolytes: `mEq/L`
3. **Hematology:**
   - Hemoglobin: `g/dL`
   - Hematocrit: `%`
   - Platelets: `x10³/µL`
   - Total WBC: `/µL`
   - RBC: `million/µL`
4. **Enzymes:**
   - ALT, AST, ALP, GGT: `U/L`
5. **Hormones & Vitamins:**
   - TSH: `µIU/mL`
   - Vitamin D: `ng/mL`
   - Vitamin B12: `pg/mL`
   - HbA1c: `%`

---

## 6. EXACT SI CONVERSION RELATIONSHIPS

The following conversion factors are exact mathematical constants defined by the International Bureau of Weights and Measures (BIPM) and NIST:

| Quantity | Relationship | Exact Mathematical Definition |
| :--- | :--- | :--- |
| **Length** | Inch to Centimeter | $1\text{ in} = 2.54\text{ cm}$ (exact) |
| **Length** | Foot to Inch | $1\text{ ft} = 12\text{ in} = 30.48\text{ cm}$ (exact) |
| **Length** | Meter to Centimeter | $1\text{ m} = 100\text{ cm}$ (exact) |
| **Length** | Centimeter to Millimeter | $1\text{ cm} = 10\text{ mm}$ (exact) |
| **Mass** | Avoirdupois Pound to Kilogram | $1\text{ lb} = 0.45359237\text{ kg}$ (exact) |
| **Mass** | Kilogram to Gram | $1\text{ kg} = 1,000\text{ g}$ (exact) |
| **Mass** | Gram to Milligram | $1\text{ g} = 1,000\text{ mg}$ (exact) |
| **Mass** | Milligram to Microgram | $1\text{ mg} = 1,000\text{ µg}$ (exact) |
| **Mass** | Ounce to Gram | $1\text{ oz} = 28.349523125\text{ g}$ (exact) |
| **Volume** | Liter to Milliliter | $1\text{ L} = 1,000\text{ mL}$ (exact) |
| **Volume** | Deciliter to Milliliter | $1\text{ dL} = 100\text{ mL}$ (exact) |
| **Volume** | Milliliter to Microliter | $1\text{ mL} = 1,000\text{ µL}$ (exact) |
| **Volume** | US Fluid Ounce to Milliliter | $1\text{ US fl oz} = 29.5735295625\text{ mL}$ (exact) |
| **Volume** | US Customary Cup to Milliliter | $1\text{ US cup} = 236.5882365\text{ mL}$ (exact) |
| **Pressure** | Kilopascal to Pascal | $1\text{ kPa} = 1,000\text{ Pa}$ (exact) |
| **Pressure** | Bar to Pascal | $1\text{ bar} = 100,000\text{ Pa}$ (exact) |
| **Pressure** | Standard Atmosphere to Pascal | $1\text{ atm} = 101,325\text{ Pa}$ (exact) |
| **Pressure** | Conventional Millimeter of Mercury | $1\text{ mmHg} = 133.322387415\text{ Pa}$ |

---

## 7. LENGTH AND HEIGHT FORMULAS

### Formulas
- $\text{in} = \text{cm} / 2.54$
- $\text{cm} = \text{in} \times 2.54$
- $\text{ft} = \text{cm} / 30.48$
- $\text{cm} = \text{ft} \times 30.48$
- $\text{m} = \text{cm} / 100$

### Compound Feet and Inches
For clinical patient stature display:
- Total Inches: $I_{\text{total}} = \text{cm} / 2.54$
- Feet Component: $F = \lfloor I_{\text{total}} / 12 \rfloor$
- Inches Component: $I = \text{round}(I_{\text{total}} \pmod{12})$
- Rollover Rule: If $I = 12$, then $F = F + 1$ and $I = 0$.

Reverse compound conversion:
- $\text{cm} = (F \times 12 + I) \times 2.54$

**Worked Example:**
- Input: $175\text{ cm}$
- $175 / 2.54 = 68.8976\text{ in}$
- $F = \lfloor 68.8976 / 12 \rfloor = 5\text{ ft}$
- $I = \text{round}(68.8976 - 60) = 9\text{ in}$
- Result: **5 ft 9 in**

---

## 8. MASS AND WEIGHT FORMULAS

### Formulas
- $\text{lb} = \text{kg} / 0.45359237 \approx \text{kg} \times 2.20462262$
- $\text{kg} = \text{lb} \times 0.45359237$
- $\text{oz} = \text{g} / 28.349523125$

**Worked Example:**
- Input: $70\text{ kg}$
- Output: $70 / 0.45359237 = 154.32358\dots \to \mathbf{154.3\text{ lb}}$
- Reverse: $154.3 \times 0.45359237 = 69.9893\dots \to \mathbf{70.0\text{ kg}}$

---

## 9. TEMPERATURE FORMULAS

Temperature conversions involve affine transformations with scale multipliers and reference offsets:

- Celsius to Fahrenheit:
  $$T_{°\text{F}} = (T_{°\text{C}} \times \frac{9}{5}) + 32$$
- Fahrenheit to Celsius:
  $$T_{°\text{C}} = (T_{°\text{F}} - 32) \times \frac{5}{9}$$
- Celsius to Kelvin:
  $$T_{\text{K}} = T_{°\text{C}} + 273.15$$
- Kelvin to Celsius:
  $$T_{°\text{C}} = T_{\text{K}} - 273.15$$

### Physical Safety Constraints
- Absolute Zero: $0\text{ K} = -273.15\text{ °C} = -459.67\text{ °F}$.
- Any input temperature below absolute zero is physically impossible and is strictly rejected by the engine.
- Kelvin is restricted to scientific calculation boundaries and is excluded from clinical patient vitals cards.

**Worked Example:**
- Human Body Normothermia: $37.0\text{ °C}$
- Fahrenheit: $(37.0 \times 1.8) + 32 = \mathbf{98.6\text{ °F}}$
- Fever Threshold: $38.5\text{ °C} \to (38.5 \times 1.8) + 32 = \mathbf{101.3\text{ °F}}$

---

## 10. VOLUME FORMULAS

- $1\text{ L} = 1,000\text{ mL} = 10\text{ dL} = 1,000,000\text{ µL}$
- $1\text{ US fl oz} = 29.5735295625\text{ mL}$
- $1\text{ US cup} = 8\text{ US fl oz} = 236.5882365\text{ mL}$

Distinction: Imperial fluid ounces ($28.4130625\text{ mL}$) and Imperial cups are not interchangeable with US Customary units. MediTrack enforces standard US Customary volumetric measures.

---

## 11. PRESSURE FORMULAS

- $1\text{ kPa} = 1,000\text{ Pa}$
- $1\text{ mmHg} = 0.133322387415\text{ kPa}$
- $1\text{ kPa} = 7.50061683\text{ mmHg}$
- $1\text{ bar} = 100\text{ kPa} = 750.062\text{ mmHg}$

### Blood Pressure Dual-Scalar Structure
Arterial blood pressure is recorded as a compound systolic/diastolic pair:
$$\text{BP} = \text{Systolic} / \text{Diastolic } [\text{Unit}]$$

**Critical Safety Requirement:**
- Blood pressure is NEVER parsed as a single floating-point fraction or ratio.
- Both components are separated and converted independently.
- Converting units does not alter hypertension classifications (e.g., AHA Stage 1 / Stage 2).

**Worked Example:**
- Input: `120/80 mmHg` converted to `kPa`
- Systolic: $120 \times 0.1333224 = \mathbf{16.0\text{ kPa}}$
- Diastolic: $80 \times 0.1333224 = \mathbf{10.7\text{ kPa}}$
- Output Representation: `16.0/10.7 kPa`

---

## 12. FREQUENCY AND RATE FORMULAS

- $\text{min}^{-1} = \text{s}^{-1} \times 60$
- $\text{s}^{-1} = \text{min}^{-1} / 60$

### Semantic Boundary Isolation
Heart rate (`bpm`) and respiratory rate (`breaths/min`) share identical physical dimensions ($T^{-1}$), but represent distinct physiological organ systems. The unit registry strictly disallows cross-converting cardiac pulses into pulmonary respirations.

---

## 13. BLOOD GLUCOSE FORMULAS

- Analyte: D-glucose ($\text{C}_6\text{H}_{12}\text{O}_6$)
- Molar Mass: $180.15588\text{ g/mol} \approx 180.156\text{ g/mol}$

### Conversion Factor Derivation
$$1\text{ mmol/L} = \frac{180.156\text{ mg}}{1\text{ L}} = \frac{180.156\text{ mg}}{10\text{ dL}} = 18.0156\text{ mg/dL}$$
Clinically standardized convention adopted by the American Diabetes Association (ADA) and International Federation of Clinical Chemistry (IFCC):
$$\mathbf{1\text{ mmol/L} = 18.0182\text{ mg/dL}}$$

### Formulas
$$\text{mg/dL} = \text{mmol/L} \times 18.0182$$
$$\text{mmol/L} = \frac{\text{mg/dL}}{18.0182} = \text{mg/dL} \times 0.05550$$

**Worked Example:**
- Fasting Glucose Normal Threshold: $5.0\text{ mmol/L}$
- Converted: $5.0 \times 18.0182 = 90.091\dots \to \mathbf{90.1\text{ mg/dL}}$
- Diabetes Diagnostic Cutoff: $126\text{ mg/dL}$
- Converted: $126 / 18.0182 = 6.9929\dots \to \mathbf{7.0\text{ mmol/L}}$

---

## 14. CHOLESTEROL AND LIPID FORMULAS

### Total Cholesterol, LDL, and HDL
- Analyte: Cholesterol ($\text{C}_{27}\text{H}_{46}\text{O}$)
- Average Molar Mass: $386.65\text{ g/mol}$

Conversion Factor:
$$1\text{ mmol/L} = \frac{386.65\text{ mg}}{10\text{ dL}} = 38.665\text{ mg/dL} \approx \mathbf{38.67\text{ mg/dL}}$$
Multiplier:
$$1\text{ mg/dL} = \frac{1}{38.67} \approx \mathbf{0.02586\text{ mmol/L}}$$

### Formulas (Cholesterol)
$$\text{mmol/L} = \text{mg/dL} \times 0.02586$$
$$\text{mg/dL} = \frac{\text{mmol/L}}{0.02586} = \text{mmol/L} \times 38.67$$

### Serum Triglycerides
- Analyte: Triolein standard ($\text{C}_{57}\text{H}_{104}\text{O}_6$)
- Average Molar Mass: $885.4\text{ g/mol}$

Conversion Factor:
$$1\text{ mmol/L} = \frac{885.4\text{ mg}}{10\text{ dL}} = 88.54\text{ mg/dL} \approx \mathbf{88.57\text{ mg/dL}}$$
Multiplier:
$$1\text{ mg/dL} = \frac{1}{88.57} \approx \mathbf{0.01129\text{ mmol/L}}$$

### Formulas (Triglycerides)
$$\text{mmol/L} = \text{mg/dL} \times 0.01129$$
$$\text{mg/dL} = \frac{\text{mmol/L}}{0.01129} = \text{mmol/L} \times 88.57$$

**Worked Example:**
- Total Cholesterol: $200\text{ mg/dL} \times 0.02586 = \mathbf{5.17\text{ mmol/L}}$
- Triglycerides: $150\text{ mg/dL} \times 0.01129 = \mathbf{1.69\text{ mmol/L}}$

---

## 15. HEMATOLOGY FORMULAS

### Hemoglobin
- Conventional Unit: $\text{g/dL}$
- SI Unit: $\text{g/L}$
$$\text{g/L} = \text{g/dL} \times 10$$
$$\text{g/dL} = \text{g/L} / 10$$
*Example:* $14.5\text{ g/dL} \times 10 = \mathbf{145\text{ g/L}}$.

### Hematocrit
- Conventional Unit: $\%$ (volume percentage)
- SI Unit: $\text{L/L}$ (fractional proportion)
$$\text{L/L} = \% / 100$$
$$\% = \text{L/L} \times 100$$
*Example:* $42\% = \mathbf{0.42\text{ L/L}}$.

### Platelet Count
- Canonical Unit: $\text{x}10^3/\text{µL}$ (thousands per microliter)
- South Asian Diagnostic Unit: $\text{lakh/µL}$ ($1\text{ lakh} = 100,000$)
- Raw Count: $\text{cells/µL}$ or $/\text{µL}$
- SI Equivalent: $\text{x}10^9/\text{L}$

$$1\text{ lakh/µL} = 100,000/\text{µL} = \mathbf{100 \times 10^3/\text{µL}}$$
$$1\text{ x}10^9/\text{L} = \mathbf{1 \times 10^3/\text{µL}}$$
$$\text{x}10^3/\text{µL} = \text{lakh/µL} \times 100$$
$$\text{lakh/µL} = (\text{x}10^3/\text{µL}) / 100$$
*Example:* $2.75\text{ lakh/µL} \times 100 = \mathbf{275 \times 10^3/\text{µL}} = \mathbf{275 \times 10^9/\text{L}}$.

### Total WBC Count
- Canonical Unit: $/\text{µL}$ (cells/µL)
- Scaled Unit: $\text{x}10^3/\text{µL}$ or $\text{x}10^9/\text{L}$
$$/\text{µL} = (\text{x}10^3/\text{µL}) \times 1,000$$
$$\text{x}10^3/\text{µL} = (/\text{µL}) / 1,000$$
*Example:* $7.5 \times 10^3/\text{µL} \times 1,000 = \mathbf{7,500/\text{µL}}$.

### Red Blood Cell Count (RBC)
- Canonical Unit: $\text{million/µL}$ ($\text{x}10^6/\text{µL}$)
- SI Unit: $\text{x}10^{12}/\text{L}$
$$1\text{ million/µL} = \mathbf{1 \times 10^{12}/\text{L}}$$
*Exact 1:1 numerical scale identity.*

---

## 16. KIDNEY-FUNCTION FORMULAS

### Serum Creatinine
- Analyte: Creatinine ($\text{C}_4\text{H}_7\text{N}_3\text{O}$)
- Molar Mass: $113.12\text{ g/mol}$

Conversion Factor:
$$1\text{ mg/dL} = \frac{10\text{ mg/L}}{113.12\text{ mg/mmol}} = 0.0884\text{ mmol/L} = \mathbf{88.4\text{ µmol/L}}$$

Formulas:
$$\text{µmol/L} = \text{mg/dL} \times 88.4$$
$$\text{mg/dL} = \frac{\text{µmol/L}}{88.4}$$

*Worked Example:*
- Baseline Normal: $1.0\text{ mg/dL} \times 88.4 = \mathbf{88.4\text{ µmol/L}}$
- Elevated: $150\text{ µmol/L} / 88.4 = \mathbf{1.70\text{ mg/dL}}$

### Blood Urea Nitrogen (BUN) vs. Serum Urea
- BUN measures only the nitrogen portion of urea ($2 \times 14.007 = 28.014\text{ g/mol}$).
- Serum Urea measures the complete intact urea molecule ($\text{NH}_2\text{CONH}_2 = 60.06\text{ g/mol}$).

Formulas:
$$\text{BUN (mmol/L urea nitrogen)} = \text{BUN (mg/dL)} \times 0.357$$
$$\text{Urea (mmol/L intact urea)} = \text{Urea (mg/dL)} \times 0.1665$$
$$\text{BUN (mg/dL)} = \text{Urea (mg/dL)} \times 0.467$$

**Critical Safety Requirement:** BUN and Urea are distinct physiological analytes. They are NEVER converted into one another by simply altering a suffix without applying the molecular nitrogen-to-urea ratio ($0.467$).

### Estimated Glomerular Filtration Rate (eGFR)
eGFR ($\text{mL/min/1.73m}^2$) is a derived clinical estimation modeled via multivariable clinical equations (such as CKD-EPI 2021 without race):
$$\text{eGFR} = 142 \times \min(S_{cr}/\kappa, 1)^\alpha \times \max(S_{cr}/\kappa, 1)^{-1.200} \times 0.9938^{\text{Age}} \times [1.012 \text{ if female}]$$
**Clinical Rule:** eGFR is NEVER computed via unit conversion. It is derived through clinical equations from serum creatinine, age, and sex.

### Urine Albumin-to-Creatinine Ratio (uACR)
- Ratio between urine albumin ($\text{mg}$) and urine creatinine ($\text{g}$ or $\text{mmol}$).
- $1\text{ g creatinine} = 8.84\text{ mmol creatinine}$.
- Therefore:
$$1\text{ mg/g} = \frac{1\text{ mg}}{8.84\text{ mmol}} \approx \mathbf{0.113\text{ mg/mmol}}$$
$$\text{mg/mmol} = \text{mg/g} \times 0.113$$
$$\text{mg/g} = \frac{\text{mg/mmol}}{0.113} = \text{mg/mmol} \times 8.84$$

---

## 17. LIVER-FUNCTION UNIT RULES

### Aminotransferases (ALT/AST), ALP, GGT
- Clinical Units: $\text{U/L}$ and $\text{IU/L}$.
- Both represent international enzyme units per liter, defining the catalytic activity that catalyzes the transformation of 1 micromole of substrate per minute under standard temperature ($37\text{ °C}$) and buffer conditions.
- **Relationship:** $\mathbf{1\text{ U/L} = 1\text{ IU/L}}$ (Exact 1:1 catalytic equivalent).

### Serum Bilirubin (Total and Direct)
- Analyte: Bilirubin ($\text{C}_{33}\text{H}_{36}\text{N}_4\text{O}_6$)
- Molar Mass: $584.66\text{ g/mol}$
- Conversion Factor: $1\text{ mg/dL} = \mathbf{17.104\text{ µmol/L}}$
$$\text{µmol/L} = \text{mg/dL} \times 17.104$$
$$\text{mg/dL} = \frac{\text{µmol/L}}{17.104}$$

### Total Protein and Albumin
- Standard: $1\text{ g/dL} = \mathbf{10\text{ g/L}}$

---

## 18. ELECTROLYTE AND CHEMISTRY FORMULAS

### Monovalent Electrolytes: Sodium ($\text{Na}^+$), Potassium ($\text{K}^+$), Chloride ($\text{Cl}^-$)
- Valence: $z = 1$.
- Milliequivalents per liter equals millimoles per liter:
$$\mathbf{1\text{ mEq/L} = 1\text{ mmol/L}}$$

### Serum Calcium ($\text{Ca}^{2+}$)
- Valence: $z = 2$.
- Molar Mass: $40.078\text{ g/mol}$.
- Factor: $1\text{ mmol/L} = 4.008\text{ mg/dL} = 2.0\text{ mEq/L}$.
$$\text{mmol/L} = \text{mg/dL} \times 0.2495$$
$$\text{mg/dL} = \text{mmol/L} \times 4.008$$

### Serum Magnesium ($\text{Mg}^{2+}$)
- Molar Mass: $24.305\text{ g/mol}$.
- Factor: $1\text{ mmol/L} = 2.43\text{ mg/dL}$.
$$\text{mmol/L} = \text{mg/dL} \times 0.4114$$
$$\text{mg/dL} = \text{mmol/L} \times 2.43$$

### Inorganic Phosphorus / Phosphate
- Molar Mass: $30.974\text{ g/mol}$ (calculated as elemental phosphorus).
- Factor: $1\text{ mmol/L} = 3.097\text{ mg/dL}$.
$$\text{mmol/L} = \text{mg/dL} \times 0.3229$$
$$\text{mg/dL} = \text{mmol/L} \times 3.097$$

### Uric Acid
- Analyte: Uric acid ($\text{C}_5\text{H}_4\text{N}_4\text{O}_3$, MW: $168.11\text{ g/mol}$).
- Factor: $1\text{ mg/dL} = \mathbf{59.48\text{ µmol/L}}$.
$$\text{µmol/L} = \text{mg/dL} \times 59.48$$
$$\text{mg/dL} = \frac{\text{µmol/L}}{59.48}$$

### Thyroid Stimulating Hormone (TSH)
- Standard: $\mathbf{1\text{ µIU/mL} = 1\text{ mIU/L}}$ (Exact 1:1 international biological reference equivalent).

### 25-Hydroxy Vitamin D
- Molar Mass: $400.64\text{ g/mol}$.
- Factor: $1\text{ ng/mL} = \mathbf{2.496\text{ nmol/L}}$.
$$\text{nmol/L} = \text{ng/mL} \times 2.496$$
$$\text{ng/mL} = \frac{\text{nmol/L}}{2.496}$$

### Vitamin B12 (Cobalamin)
- Molar Mass: $1355.37\text{ g/mol}$.
- Factor: $1\text{ pg/mL} = \mathbf{0.7378\text{ pmol/L}}$.
$$\text{pmol/L} = \text{pg/mL} \times 0.7378$$
$$\text{pg/mL} = \frac{\text{pmol/L}}{0.7378}$$

### Glycated Hemoglobin (HbA1c)
The relationship between NGSP ($\%$) and IFCC ($\text{mmol/mol}$) is defined by the Master Consensus Equation:
$$\text{IFCC} = (\text{NGSP} - 2.15) \times 10.929$$
$$\text{NGSP} = (0.09148 \times \text{IFCC}) + 2.152$$
*Example:* $7.0\% \text{ HbA1c} = (7.0 - 2.15) \times 10.929 = \mathbf{53\text{ mmol/mol}}$.

---

## 19. BMI FORMULAS

Body Mass Index is an anthropometric indicator:

- Metric Formula:
  $$\text{BMI} = \frac{\text{Weight (kg)}}{[\text{Height (m)}]^2} = \frac{\text{Weight (kg)}}{[\text{Height (cm)} / 100]^2}$$

- Imperial Formula:
  $$\text{BMI} = 703 \times \frac{\text{Weight (lb)}}{[\text{Height (in)}]^2}$$

### WHO Adult Stratification
- Underweight: $< 18.5\text{ kg/m}^2$
- Normal Healthy Weight: $18.5 - 24.9\text{ kg/m}^2$
- Overweight: $25.0 - 29.9\text{ kg/m}^2$
- Obesity: $\ge 30.0\text{ kg/m}^2$

**Invariance Guarantee:** Changing the patient's displayed height unit between `cm` and `ft & in`, or weight unit between `kg` and `lb`, does NOT alter the underlying stored metric measurement or the calculated BMI value.

---

## 20. UNSUPPORTED AND INCOMPATIBLE CONVERSIONS

To protect clinical patient data, the following conversions are rejected with explicit errors:

1. **Cross-Dimensional Physical Quantities:**
   - Mass to Pressure (e.g., `kg` to `mmHg`) $\to$ **REJECTED**
   - Temperature to Length (e.g., `°C` to `cm`) $\to$ **REJECTED**
   - Volume to Mass (without substance density) $\to$ **REJECTED**
2. **Clinical Oxygen Parameters:**
   - Peripheral Oxygen Saturation (`SpO₂` in `%`) to Arterial Oxygen Partial Pressure (`PaO₂` in `mmHg`) $\to$ **STRICTLY REJECTED**.
   - *Clinical Reason:* SpO₂ measures the percentage of oxygenated hemoglobin molecules via spectrophotometry. PaO₂ measures the physical partial pressure of dissolved oxygen in arterial blood. They are governed by the sigmoidal oxygen-hemoglobin dissociation curve, which shifts dynamically with pH, 2,3-DPG, temperature, and $p\text{CO}_2$.
3. **Cross-Analyte Concentration Transfers:**
   - Converting Cholesterol using the Glucose factor ($18.0182$) $\to$ **STRICTLY REJECTED**.
   - Converting Creatinine using the Cholesterol factor ($38.67$) $\to$ **STRICTLY REJECTED**.
4. **Physically Impossible Values:**
   - Temperatures below absolute zero ($< 0\text{ K}$, $< -273.15\text{ °C}$, $< -459.67\text{ °F}$) $\to$ **REJECTED**.
   - Negative concentrations, heights, weights, or cell counts $\to$ **REJECTED**.
5. **Algorithmic Clinical Scores as Conversions:**
   - eGFR from Creatinine via a simple multiplier $\to$ **REJECTED**.

---

## 21. PRECISION AND ROUNDING POLICY

- **Intermediate Calculations:** All intermediate conversions preserve IEEE 754 double-precision floating-point resolution. No rounding is applied mid-calculation.
- **Presentation Rounding:** Results are rounded exclusively at the presentation boundary according to clinically appropriate standards:
  - Height: $1$ decimal place ($0.1\text{ cm}$)
  - Weight: $1$ decimal place ($0.1\text{ kg}$ / $0.1\text{ lb}$)
  - Temperature: $1$ decimal place ($0.1\text{ °C}$ / $0.1\text{ °F}$)
  - Blood Pressure: Integer rounding ($1\text{ mmHg}$) or $1$ decimal place ($0.1\text{ kPa}$)
  - Glucose: $1$ decimal for $\text{mg/dL}$, $2$ decimals for $\text{mmol/L}$
  - Lipids: $1$ decimal for $\text{mg/dL}$, $2$ decimals for $\text{mmol/L}$
  - Creatinine: $2$ decimals for $\text{mg/dL}$, $1$ decimal for $\text{µmol/L}$
  - Hemoglobin: $1$ decimal for $\text{g/dL}$, integer for $\text{g/L}$
  - Cell counts (Platelets, WBC): $1$ decimal for scaled counts, integer for raw $/\text{µL}$
- **Classification Invariance:** Clinical alert and threshold comparisons evaluate against normalized reference bounds before presentation rounding to ensure borderline measurements never jump clinical classifications due to rounding.

---

## 22. REFERENCE-RANGE CONVERSION RULES

Reference ranges are clinical values with units, not dimensionless numbers.

When converting a clinical biomarker:
1. Identify the source reported unit and target display unit.
2. Verify that both units are compatible for that specific parameter.
3. Parse structured boundaries:
   - Interval ranges (e.g., `70 – 99`, `13.0 – 17.0`)
   - Unilateral thresholds (e.g., `< 200`, `> 40`, `≥ 18.5`)
4. Apply the exact same analyte-specific mathematical transformation to the reference range bounds as applied to the patient's measured value.
5. If the reference range format cannot be parsed safely, preserve the original authenticated laboratory range text and append the source unit for clarity.

---

## 23. ORIGINAL-VALUE PRESERVATION

Auditability is essential for medical software integrity:

1. **Database Immutability:** Uploaded and extracted laboratory observations retain `raw_value`, `unit`, and `source_text` unaltered in persistent storage.
2. **Display Provenance:** Whenever a converted unit is chosen for display, the UI provides a provenance indicator (e.g., `Orig: 95 mg/dL`) so clinicians and patients can immediately verify the authentic reported value.
3. **No Cascading Conversions:** Conversions always transform from the verified baseline source measurement or canonical representation, never from an already-converted and rounded display value.

---

## 24. CONVERSION-ENGINE API

Located at `src/lib/units/index.ts`:

```typescript
// Core Conversion Function
function convertUnit(
  value: number | null | undefined,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
  options?: ConversionOptions
): ConversionResult;

// Compatibility & Registry Queries
function areUnitsCompatible(fromUnit: string, toUnit: string, parameter?: string): boolean;
function getCompatibleUnits(parameter: string): string[];
function getCanonicalUnit(parameter: string): string;
function getSupportedUnits(): string[];

// Clinical Formatters & Specialized Conversions
function formatConvertedValue(value: number, unit: string, options?: FormatOptions): string;
function convertBloodPressure(bp: string, fromUnit?: string, toUnit?: string): BloodPressureConversionResult;
function convertReferenceRange(range: string, fromUnit: string, toUnit: string, param?: string): ReferenceRangeConversionResult;
function convertToCanonicalUnit(param: string, value: number, reportedUnit: string): ConversionResult;

// Anthropometric & Temperature Calculations
function calculateBmi(heightCm: number, weightKg: number): BmiResult;
function cmToFtIn(cm: number): { feet: number; inches: number };
function ftInToCm(feet: number, inches: number): number;
function kgToLb(kg: number): number | null;
function lbToKg(lb: number): number | null;
function celsiusToFahrenheit(c: number): number;
function fahrenheitToCelsius(f: number): number;
function formatHeightDisplay(cm: number, unit?: string): string;
function formatWeightDisplay(kg: number, unit?: string): string;
function formatTemperatureDisplay(c: number, unit?: string): string;
```

---

## 25. UNIT-REGISTRY SCHEMA

The central registry schema comprises two decoupled dictionaries:

1. `UNIT_REGISTRY: Record<string, UnitDefinition>`: Defines physical dimensions, display symbols, system of origin, OCR aliases, decimal rules, and physical bounds.
2. `CLINICAL_PARAMETER_RULES: Record<string, ParameterUnitRule>`: Defines canonical parameters, friendly titles, compatible unit lists, molecular weights, and clinical justification standards.

---

## 26. UI INTEGRATION RULES

- **Patient Profile (`Profile.tsx`):**
  - Height toggle between `cm` and `ft / in`. Stored in DB as canonical `height_cm`.
  - Weight toggle between `kg` and `lb`. Stored in DB as canonical `weight_kg`.
  - BMI displayed with dynamic WHO strata needle bar.
- **Laboratory Reports (`Reports.tsx`):**
  - Displays authenticated report values and units verbatim.
  - Interactive per-row unit dropdown for compatible biomarkers.
  - Displays `Orig: [value] [unit]` when converted.
- **Trends & Historical Graphs (`Trends.tsx`, `MetricCard.tsx`, `MetricDetailModal.tsx`):**
  - Interactive unit switcher pill buttons on biomarker cards.
  - Historical observation points convert harmoniously before rendering the Recharts AreaChart.
  - Converted reference ranges displayed alongside original values in detail modals.
- **Dashboard (`Dashboard.tsx`, `SummaryCards.tsx`):**
  - Trend summary widgets and vital charts format observations according to user preferences.
- **Specialty Guidance (`SpecialtyCard.tsx`):**
  - Clinical recommendation rules evaluate canonical values to prevent display toggles from altering specialist guidance.
- **Settings (`Settings.tsx`, `SettingsDrawer.tsx`):**
  - Persists preferences for Height, Weight, Temperature, Glucose, Lipids, Creatinine, and Hemoglobin.

---

## 27. HISTORICAL-CHART AND FORECASTING RULES

- **Harmonized Time-Series:** When plotting longitudinal laboratory data across reports from multiple facilities, observations are normalized to canonical units in `normalizeMeasurements()` before computing trends.
- **No Artificial Spikes:** Eliminates artifactual chart spikes (e.g., $95\text{ mg/dL}$ dropping to $5.2\text{ mmol/L}$ on the same axis).
- **Forecasting (Future Outlook):** The deterministic Ordinary Least Squares engine in `forecastService.ts` trains and forecasts strictly on validated canonical observations. Forecast values and prediction intervals are presented with explicit canonical unit provenance.

---

## 28. MEDICAL-DATA SAFETY CONSIDERATIONS

1. **No Silent Zero Coercion:** Invalid, corrupted, or unparsable strings (e.g., `">1000"`, `"TRACE"`, `"POSITIVE"`) are never silently coerced to `0`. They are marked as unconvertible and preserved in original raw text.
2. **Missing Unit Guard:** If a report records a number without a unit, the converter refuses to guess and reports `missing_unit`.
3. **AI Assistant Grounding:** The MediTrack AI assistant is provided with explicit value, unit, collection date, and source report citations. It is instructed never to hallucinate or guess arbitrary unit conversions.

---

## 29. WORKED CONVERSION EXAMPLES

| Category | Input Value & Unit | Target Unit | Mathematical Formula | Intermediate Result | Output Display |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Glucose** | $95\text{ mg/dL}$ | $\text{mmol/L}$ | $\text{value} / 18.0182$ | $5.27244\dots$ | **5.27 mmol/L** |
| **Glucose** | $6.5\text{ mmol/L}$ | $\text{mg/dL}$ | $\text{value} \times 18.0182$ | $117.1183\dots$ | **117.1 mg/dL** |
| **Cholesterol** | $210\text{ mg/dL}$ | $\text{mmol/L}$ | $\text{value} \times 0.02586$ | $5.4306\dots$ | **5.43 mmol/L** |
| **Triglycerides** | $160\text{ mg/dL}$ | $\text{mmol/L}$ | $\text{value} \times 0.01129$ | $1.8064\dots$ | **1.81 mmol/L** |
| **Creatinine** | $1.2\text{ mg/dL}$ | $\text{µmol/L}$ | $\text{value} \times 88.4$ | $106.08$ | **106.1 µmol/L** |
| **Creatinine** | $88.4\text{ µmol/L}$ | $\text{mg/dL}$ | $\text{value} / 88.4$ | $1.000$ | **1.00 mg/dL** |
| **Height** | $178\text{ cm}$ | $\text{ft & in}$ | $\text{cm} / 2.54 \to \text{feet & inches}$ | $70.0787\text{ in}$ | **5 ft 10 in** |
| **Weight** | $72\text{ kg}$ | $\text{lb}$ | $\text{value} / 0.45359237$ | $158.7328\dots$ | **158.7 lb** |
| **Temperature** | $37.2\text{ °C}$ | $\text{°F}$ | $(\text{value} \times 9/5) + 32$ | $98.96$ | **99.0 °F** |
| **Blood Pressure**| $130/85\text{ mmHg}$| $\text{kPa}$ | $\text{value} \times 0.1333224$ | $17.33 / 11.33$ | **17.3/11.3 kPa** |
| **BMI** | $175\text{ cm}, 70\text{ kg}$ | $\text{kg/m}²$ | $70 / (1.75)^2$ | $22.857\dots$ | **22.9 kg/m² (Normal)** |

---

## 30. ERROR HANDLING

When a conversion cannot be performed safely, `convertUnit` returns a structured failure object without throwing unhandled exceptions:

```typescript
{
  success: false,
  value: null,
  fromUnit: 'mg/dL',
  toUnit: 'mmHg',
  formula: 'N/A',
  error: "Incompatible conversion from 'mg/dL' (analyte_concentration) to 'mmHg' (pressure)."
}
```

Caller components check `result.success` and display fallback original values with clear diagnostic messages.

---

## 31. VALIDATION AND IMPLEMENTATION NOTES

- Tested under genuine cryptographic and algorithmic check suites (`backend/services/validationRunner.service.ts` tests `UNIT-01` and `UNIT-02`).
- 100% synchronized with `CANONICAL_PARAMETERS` in `src/analytics/unitRegistry.ts` and `CLINICAL_REFERENCE_RANGES` in `src/components/Trends/clinicalRules.ts`.
- Zero third-party unit-conversion dependencies introduced.

---

## 32. REFERENCES FOR MEDICAL AND SCIENTIFIC CONVERSION CONSTANTS

1. **American Diabetes Association (ADA):** *Standards of Care in Diabetes—2024*. Glucose molecular weight ($180.156\text{ g/mol}$) and conventional conversion factor ($1\text{ mmol/L} = 18.0182\text{ mg/dL}$).
2. **National Cholesterol Education Program (NCEP) / AHA / ACC:** *Guideline on the Management of Blood Cholesterol*. Cholesterol factor ($0.02586\text{ mmol/L per mg/dL}$), Triglycerides triolein factor ($0.01129\text{ mmol/L per mg/dL}$).
3. **National Kidney Foundation (NKF) / KDQI / KDIGO:** *Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease*. Serum creatinine molar mass ($113.12\text{ g/mol}$, factor $88.4\text{ µmol/L per mg/dL}$), uACR conversion ratio ($1\text{ mg/g} = 0.113\text{ mg/mmol}$).
4. **International Federation of Clinical Chemistry and Laboratory Medicine (IFCC):** Standardization of enzymatic catalytic activity ($\text{U/L} = \text{IU/L}$) and Master Consensus Equation for HbA1c ($\text{IFCC} = [\text{NGSP} - 2.15] \times 10.929$).
5. **World Health Organization (WHO):** *Physical Status: The Use and Interpretation of Anthropometry* (WHO Technical Report Series 854). Adult Body Mass Index cutoff stratification.
6. **National Institute of Standards and Technology (NIST):** *Special Publication 811: Guide for the Use of the International System of Units (SI)*. Exact avoirdupois and customary definitions ($1\text{ in} = 2.54\text{ cm}$, $1\text{ lb} = 0.45359237\text{ kg}$).
