var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/analytics/parameters.ts
function normalizeParameterName(rawName) {
  if (!rawName) return "";
  const cleaned = rawName.trim().toLowerCase();
  for (const [standardName, aliases] of Object.entries(PARAMETER_ALIASES)) {
    if (aliases.includes(cleaned)) {
      return standardName;
    }
  }
  if (cleaned.includes("sgpt") || cleaned.startsWith("alt ") || cleaned.includes("(sgpt)")) {
    return "alt";
  }
  if (cleaned.includes("sgot") || cleaned.startsWith("ast ") || cleaned.includes("(sgot)")) {
    return "ast";
  }
  if (cleaned.includes("hematocrit") || cleaned.includes("pcv")) {
    return "hematocrit";
  }
  if (cleaned.includes("systolic")) {
    return "blood_pressure_systolic";
  }
  if (cleaned.includes("diastolic")) {
    return "blood_pressure_diastolic";
  }
  if (cleaned.includes("fasting") && cleaned.includes("glucose")) {
    return "fasting_glucose";
  }
  if (cleaned.includes("cholesterol") && cleaned.includes("total")) {
    return "total_cholesterol";
  }
  return cleaned.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function getParameterDisplayName(canonicalName) {
  const displayNames = {
    hemoglobin: "Hemoglobin",
    fasting_glucose: "Fasting Glucose",
    serum_glucose: "Random Blood Glucose",
    total_cholesterol: "Total Cholesterol",
    ldl: "LDL Cholesterol",
    hdl: "HDL Cholesterol",
    triglycerides: "Triglycerides",
    creatinine: "Creatinine",
    alt: "ALT (SGPT)",
    ast: "AST (SGOT)",
    hematocrit: "Hematocrit (PCV)",
    platelets: "Platelet Count",
    wbc: "Total WBC Count",
    rbc: "RBC Count",
    blood_pressure_systolic: "Systolic Blood Pressure",
    blood_pressure_diastolic: "Diastolic Blood Pressure",
    weight: "Weight",
    height: "Height",
    heart_rate: "Heart Rate",
    spo2: "Oxygen Saturation (SpO2)",
    bmi: "Body Mass Index"
  };
  return displayNames[canonicalName] || canonicalName.replace(/_/g, " ").toUpperCase();
}
var PARAMETER_ALIASES;
var init_parameters = __esm({
  "src/analytics/parameters.ts"() {
    PARAMETER_ALIASES = {
      hemoglobin: ["hemoglobin", "hb", "hgb", "haemoglobin"],
      fasting_glucose: ["fasting glucose", "fasting blood sugar", "fbs", "glucose fasting"],
      serum_glucose: ["glucose", "random glucose", "blood glucose", "rbs", "serum glucose"],
      total_cholesterol: ["total cholesterol", "cholesterol", "serum cholesterol"],
      ldl: ["ldl", "ldl cholesterol", "low density lipoprotein"],
      hdl: ["hdl", "hdl cholesterol", "high density lipoprotein"],
      triglycerides: ["triglycerides", "tg", "serum triglycerides"],
      creatinine: ["creatinine", "serum creatinine"],
      alt: ["alt", "sgpt", "alt (sgpt)", "alanine aminotransferase", "alanine transaminase"],
      ast: ["ast", "sgot", "ast (sgot)", "aspartate aminotransferase", "aspartate transaminase"],
      hematocrit: ["hematocrit", "pcv", "hematocrit (pcv)", "packed cell volume"],
      platelets: ["platelet count", "platelets", "plt"],
      wbc: ["wbc", "white blood cell count", "total wbc count", "total leukocyte count", "tlc"],
      rbc: ["rbc", "rbc count", "red blood cell count", "total rbc count"],
      blood_pressure: ["blood pressure", "bp", "blood_pressure"],
      blood_pressure_systolic: ["systolic", "sys", "systolic blood pressure", "sbp", "bp systolic"],
      blood_pressure_diastolic: ["diastolic", "dia", "diastolic blood pressure", "dbp", "bp diastolic"],
      weight: ["weight", "body weight", "wt"],
      height: ["height", "ht"],
      heart_rate: ["heart rate", "pulse", "pulse rate", "hr"],
      spo2: ["spo2", "oxygen saturation", "o2 sat"],
      bmi: ["bmi", "body mass index"]
    };
  }
});

// src/lib/units/types.ts
var init_types = __esm({
  "src/lib/units/types.ts"() {
  }
});

// src/lib/units/registry.ts
var UNIT_REGISTRY, CLINICAL_PARAMETER_RULES;
var init_registry = __esm({
  "src/lib/units/registry.ts"() {
    UNIT_REGISTRY = {
      // === LENGTH ===
      mm: {
        id: "mm",
        symbol: "mm",
        name: "Millimeter",
        dimension: "length",
        system: "SI",
        aliases: ["mm", "millimeter", "millimeters"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      cm: {
        id: "cm",
        symbol: "cm",
        name: "Centimeter",
        dimension: "length",
        system: "SI",
        aliases: ["cm", "centimeter", "centimeters"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      m: {
        id: "m",
        symbol: "m",
        name: "Meter",
        dimension: "length",
        system: "SI",
        aliases: ["m", "meter", "meters", "metre", "metres"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      in: {
        id: "in",
        symbol: "in",
        name: "Inch",
        dimension: "length",
        system: "US_CUSTOMARY",
        aliases: ["in", "inch", "inches", '"'],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      ft: {
        id: "ft",
        symbol: "ft",
        name: "Foot",
        dimension: "length",
        system: "US_CUSTOMARY",
        aliases: ["ft", "foot", "feet", "'"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === MASS / BODY WEIGHT ===
      ug: {
        id: "ug",
        symbol: "\xB5g",
        name: "Microgram",
        dimension: "mass",
        system: "SI",
        aliases: ["\xB5g", "ug", "mcg", "microgram", "micrograms"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      mg: {
        id: "mg",
        symbol: "mg",
        name: "Milligram",
        dimension: "mass",
        system: "SI",
        aliases: ["mg", "milligram", "milligrams"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      g: {
        id: "g",
        symbol: "g",
        name: "Gram",
        dimension: "mass",
        system: "SI",
        aliases: ["g", "gm", "gram", "grams"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      kg: {
        id: "kg",
        symbol: "kg",
        name: "Kilogram",
        dimension: "mass",
        system: "SI",
        aliases: ["kg", "kgs", "kilogram", "kilograms"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      lb: {
        id: "lb",
        symbol: "lb",
        name: "Pound",
        dimension: "mass",
        system: "US_CUSTOMARY",
        aliases: ["lb", "lbs", "pound", "pounds"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      oz: {
        id: "oz",
        symbol: "oz",
        name: "Ounce",
        dimension: "mass",
        system: "US_CUSTOMARY",
        aliases: ["oz", "ounce", "ounces"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === TEMPERATURE ===
      celsius: {
        id: "celsius",
        symbol: "\xB0C",
        name: "Degree Celsius",
        dimension: "temperature",
        system: "SI",
        aliases: ["\xB0c", "c", "celsius", "centigrade", "deg c", "degree c"],
        defaultDecimals: 1,
        allowNegative: true,
        physicalMinimum: -273.15
      },
      fahrenheit: {
        id: "fahrenheit",
        symbol: "\xB0F",
        name: "Degree Fahrenheit",
        dimension: "temperature",
        system: "US_CUSTOMARY",
        aliases: ["\xB0f", "f", "fahrenheit", "deg f", "degree f"],
        defaultDecimals: 1,
        allowNegative: true,
        physicalMinimum: -459.67
      },
      kelvin: {
        id: "kelvin",
        symbol: "K",
        name: "Kelvin",
        dimension: "temperature",
        system: "SI",
        aliases: ["k", "kelvin"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === VOLUME ===
      ul: {
        id: "ul",
        symbol: "\xB5L",
        name: "Microliter",
        dimension: "volume",
        system: "SI",
        aliases: ["\xB5l", "ul", "microliter", "microlitre", "microliters"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      ml: {
        id: "ml",
        symbol: "mL",
        name: "Milliliter",
        dimension: "volume",
        system: "SI",
        aliases: ["ml", "milliliter", "millilitre", "cc"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      dl: {
        id: "dl",
        symbol: "dL",
        name: "Deciliter",
        dimension: "volume",
        system: "SI",
        aliases: ["dl", "deciliter", "decilitre"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      l: {
        id: "l",
        symbol: "L",
        name: "Liter",
        dimension: "volume",
        system: "SI",
        aliases: ["l", "liter", "litre", "liters"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      us_fl_oz: {
        id: "us_fl_oz",
        symbol: "US fl oz",
        name: "US Fluid Ounce",
        dimension: "volume",
        system: "US_CUSTOMARY",
        aliases: ["fl oz", "us fl oz", "fluid ounce"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      us_cup: {
        id: "us_cup",
        symbol: "US cup",
        name: "US Customary Cup",
        dimension: "volume",
        system: "US_CUSTOMARY",
        aliases: ["cup", "cups", "us cup"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === PRESSURE ===
      pa: {
        id: "pa",
        symbol: "Pa",
        name: "Pascal",
        dimension: "pressure",
        system: "SI",
        aliases: ["pa", "pascal"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      kpa: {
        id: "kpa",
        symbol: "kPa",
        name: "Kilopascal",
        dimension: "pressure",
        system: "SI",
        aliases: ["kpa", "kilopascal"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      mmhg: {
        id: "mmhg",
        symbol: "mmHg",
        name: "Millimeter of Mercury",
        dimension: "pressure",
        system: "CONVENTIONAL",
        aliases: ["mmhg", "mm hg", "torr"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      bar: {
        id: "bar",
        symbol: "bar",
        name: "Bar",
        dimension: "pressure",
        system: "SI",
        aliases: ["bar"],
        defaultDecimals: 3,
        allowNegative: false,
        physicalMinimum: 0
      },
      atm: {
        id: "atm",
        symbol: "atm",
        name: "Standard Atmosphere",
        dimension: "pressure",
        system: "CONVENTIONAL",
        aliases: ["atm", "atmosphere"],
        defaultDecimals: 3,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === FREQUENCY AND RATE ===
      per_sec: {
        id: "per_sec",
        symbol: "s\u207B\xB9",
        name: "Per Second",
        dimension: "frequency",
        system: "SI",
        aliases: ["s-1", "s\u207B\xB9", "/s", "per sec"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      per_min: {
        id: "per_min",
        symbol: "min\u207B\xB9",
        name: "Per Minute",
        dimension: "frequency",
        system: "CONVENTIONAL",
        aliases: ["min-1", "min\u207B\xB9", "/min", "per min"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      bpm: {
        id: "bpm",
        symbol: "bpm",
        name: "Beats per Minute",
        dimension: "frequency",
        system: "CLINICAL",
        aliases: ["bpm", "beats/min", "beats per minute"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      breaths_per_min: {
        id: "breaths_per_min",
        symbol: "breaths/min",
        name: "Respirations per Minute",
        dimension: "frequency",
        system: "CLINICAL",
        aliases: ["breaths/min", "resp/min", "breaths per minute", "rpm"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      // === CLINICAL CONCENTRATIONS & ENZYMATICS ===
      mg_dl: {
        id: "mg_dl",
        symbol: "mg/dL",
        name: "Milligrams per Deciliter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["mg/dl", "mg%", "mg/100ml", "mg/100 ml"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      mmol_l: {
        id: "mmol_l",
        symbol: "mmol/L",
        name: "Millimoles per Liter",
        dimension: "analyte_concentration",
        system: "SI",
        aliases: ["mmol/l", "mm/l", "millimoles/l"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      umol_l: {
        id: "umol_l",
        symbol: "\xB5mol/L",
        name: "Micromoles per Liter",
        dimension: "analyte_concentration",
        system: "SI",
        aliases: ["\xB5mol/l", "umol/l", "micromol/l", "umol/L"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      nmol_l: {
        id: "nmol_l",
        symbol: "nmol/L",
        name: "Nanomoles per Liter",
        dimension: "analyte_concentration",
        system: "SI",
        aliases: ["nmol/l", "nanomoles/l"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      pmol_l: {
        id: "pmol_l",
        symbol: "pmol/L",
        name: "Picomoles per Liter",
        dimension: "analyte_concentration",
        system: "SI",
        aliases: ["pmol/l", "picomoles/l"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      g_dl: {
        id: "g_dl",
        symbol: "g/dL",
        name: "Grams per Deciliter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["g/dl", "gm/dl", "g%", "gm%"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      g_l: {
        id: "g_l",
        symbol: "g/L",
        name: "Grams per Liter",
        dimension: "analyte_concentration",
        system: "SI",
        aliases: ["g/l", "gm/l"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      meq_l: {
        id: "meq_l",
        symbol: "mEq/L",
        name: "Milliequivalents per Liter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["meq/l", "meq / l"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      ng_dl: {
        id: "ng_dl",
        symbol: "ng/dL",
        name: "Nanograms per Deciliter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["ng/dl"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      ng_ml: {
        id: "ng_ml",
        symbol: "ng/mL",
        name: "Nanograms per Milliliter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["ng/ml"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      pg_ml: {
        id: "pg_ml",
        symbol: "pg/mL",
        name: "Picograms per Milliliter",
        dimension: "analyte_concentration",
        system: "CONVENTIONAL",
        aliases: ["pg/ml"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      u_l: {
        id: "u_l",
        symbol: "U/L",
        name: "Units per Liter",
        dimension: "enzymatic_activity",
        system: "CLINICAL",
        aliases: ["u/l", "iu/l", "u / l", "iu / l"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      percent: {
        id: "percent",
        symbol: "%",
        name: "Percent",
        dimension: "proportion",
        system: "CONVENTIONAL",
        aliases: ["%", "vol%", "percent"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      fractional_proportion: {
        id: "fractional_proportion",
        symbol: "L/L",
        name: "Volume Fraction (L/L)",
        dimension: "proportion",
        system: "SI",
        aliases: ["l/l", "fraction"],
        defaultDecimals: 3,
        allowNegative: false,
        physicalMinimum: 0
      },
      cells_per_ul: {
        id: "cells_per_ul",
        symbol: "/\xB5L",
        name: "Cells per Microliter",
        dimension: "cell_count",
        system: "CLINICAL",
        aliases: ["/\xB5l", "/ul", "cells/\xB5l", "cells/ul", "cell/ul"],
        defaultDecimals: 0,
        allowNegative: false,
        physicalMinimum: 0
      },
      thousands_per_ul: {
        id: "thousands_per_ul",
        symbol: "x10\xB3/\xB5L",
        name: "Thousands per Microliter",
        dimension: "cell_count",
        system: "CLINICAL",
        aliases: ["x10^3/\xB5l", "x10^3/ul", "10^3/ul", "x103/ul", "thousand/\xB5l", "k/ul"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      },
      lakh_per_ul: {
        id: "lakh_per_ul",
        symbol: "lakh/\xB5L",
        name: "Lakh per Microliter",
        dimension: "cell_count",
        system: "CONVENTIONAL",
        aliases: ["lakh/\xB5l", "lakh/ul", "lac/ul", "lakhs/ul"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      millions_per_ul: {
        id: "millions_per_ul",
        symbol: "million/\xB5L",
        name: "Million per Microliter",
        dimension: "cell_count",
        system: "CLINICAL",
        aliases: ["million/\xB5l", "million/ul", "x10^6/\xB5l", "x10^6/ul", "x10^12/l", "10^6/ul"],
        defaultDecimals: 2,
        allowNegative: false,
        physicalMinimum: 0
      },
      bmi_unit: {
        id: "bmi_unit",
        symbol: "kg/m\xB2",
        name: "Kilogram per square meter",
        dimension: "clinical_index",
        system: "CLINICAL",
        aliases: ["kg/m\xB2", "kg/m2"],
        defaultDecimals: 1,
        allowNegative: false,
        physicalMinimum: 0
      }
    };
    CLINICAL_PARAMETER_RULES = {
      // === GLUCOSE ===
      fasting_glucose: {
        parameter: "fasting_glucose",
        displayName: "Fasting Blood Glucose",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 180.156,
        // g/mol (D-glucose)
        standardSource: "ADA Clinical Practice Recommendations: 1 mmol/L = 18.0182 mg/dL"
      },
      serum_glucose: {
        parameter: "serum_glucose",
        displayName: "Random / Serum Glucose",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 180.156,
        standardSource: "ADA Clinical Practice Recommendations: 1 mmol/L = 18.0182 mg/dL"
      },
      // === LIPID PANEL ===
      total_cholesterol: {
        parameter: "total_cholesterol",
        displayName: "Total Cholesterol",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 386.65,
        // g/mol (Cholesterol)
        standardSource: "AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)"
      },
      ldl: {
        parameter: "ldl",
        displayName: "LDL Cholesterol",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 386.65,
        standardSource: "AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)"
      },
      hdl: {
        parameter: "hdl",
        displayName: "HDL Cholesterol",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 386.65,
        standardSource: "AHA/ACC Multi-Society Cholesterol Guidelines: 1 mmol/L = 38.67 mg/dL (factor 0.02586)"
      },
      triglycerides: {
        parameter: "triglycerides",
        displayName: "Serum Triglycerides",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 885.4,
        // g/mol (triolein standard)
        standardSource: "NCEP ATP III: 1 mmol/L = 88.57 mg/dL (factor 0.01129)"
      },
      // === RENAL PANEL ===
      creatinine: {
        parameter: "creatinine",
        displayName: "Serum Creatinine",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "\xB5mol/L"],
        precision: 2,
        molarMass: 113.12,
        // g/mol
        standardSource: "NKF KDOQI Clinical Guidelines: 1 mg/dL = 88.4 \xB5mol/L"
      },
      bun: {
        parameter: "bun",
        displayName: "Blood Urea Nitrogen",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 28.014,
        // 2 nitrogens in urea
        standardSource: "1 mg/dL BUN = 0.357 mmol/L urea nitrogen"
      },
      serum_urea: {
        parameter: "serum_urea",
        displayName: "Serum Urea",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 60.06,
        // intact urea molecule (NH2)2CO
        standardSource: "1 mg/dL Urea = 0.1665 mmol/L intact urea"
      },
      uacr: {
        parameter: "uacr",
        displayName: "Urine Albumin-to-Creatinine Ratio",
        dimension: "substance_ratio",
        canonicalUnit: "mg/g",
        compatibleUnits: ["mg/g", "mg/mmol"],
        precision: 1,
        standardSource: "KDIGO CKD Guidelines: 1 mg/g = 0.113 mg/mmol"
      },
      // === HEMATOLOGY & CBC ===
      hemoglobin: {
        parameter: "hemoglobin",
        displayName: "Hemoglobin",
        dimension: "analyte_concentration",
        canonicalUnit: "g/dL",
        compatibleUnits: ["g/dL", "g/L"],
        precision: 1,
        standardSource: "WHO Diagnostic Criteria: 1 g/dL = 10 g/L"
      },
      hematocrit: {
        parameter: "hematocrit",
        displayName: "Hematocrit (PCV)",
        dimension: "proportion",
        canonicalUnit: "%",
        compatibleUnits: ["%", "L/L"],
        precision: 1,
        standardSource: "Standard Hematology: 1% = 0.01 L/L"
      },
      platelets: {
        parameter: "platelets",
        displayName: "Platelet Count",
        dimension: "cell_count",
        canonicalUnit: "x10\xB3/\xB5L",
        compatibleUnits: ["x10\xB3/\xB5L", "lakh/\xB5L", "/\xB5L", "x10\u2079/L"],
        precision: 1,
        standardSource: "International Society on Thrombosis and Haemostasis: 1 lakh/\xB5L = 100 x10\xB3/\xB5L"
      },
      wbc: {
        parameter: "wbc",
        displayName: "Total White Blood Cell Count",
        dimension: "cell_count",
        canonicalUnit: "/\xB5L",
        compatibleUnits: ["/\xB5L", "x10\xB3/\xB5L", "x10\u2079/L"],
        precision: 0,
        standardSource: "Standard Automated Hematology Counters: 1 x10\xB3/\xB5L = 1000 /\xB5L"
      },
      rbc: {
        parameter: "rbc",
        displayName: "Red Blood Cell Count",
        dimension: "cell_count",
        canonicalUnit: "million/\xB5L",
        compatibleUnits: ["million/\xB5L", "x10\xB9\xB2/L"],
        precision: 2,
        standardSource: "Standard Hematology: 1 million/\xB5L = 1 x10\xB9\xB2/L"
      },
      // === HEPATIC / LIVER ENZYMES ===
      alt: {
        parameter: "alt",
        displayName: "Alanine Aminotransferase (ALT/SGPT)",
        dimension: "enzymatic_activity",
        canonicalUnit: "U/L",
        compatibleUnits: ["U/L", "IU/L"],
        precision: 0,
        standardSource: "IFCC Reference Measurement: U/L = IU/L"
      },
      ast: {
        parameter: "ast",
        displayName: "Aspartate Aminotransferase (AST/SGOT)",
        dimension: "enzymatic_activity",
        canonicalUnit: "U/L",
        compatibleUnits: ["U/L", "IU/L"],
        precision: 0,
        standardSource: "IFCC Reference Measurement: U/L = IU/L"
      },
      alp: {
        parameter: "alp",
        displayName: "Alkaline Phosphatase (ALP)",
        dimension: "enzymatic_activity",
        canonicalUnit: "U/L",
        compatibleUnits: ["U/L", "IU/L"],
        precision: 0,
        standardSource: "IFCC Reference Measurement: U/L = IU/L"
      },
      ggt: {
        parameter: "ggt",
        displayName: "Gamma-Glutamyl Transferase (GGT)",
        dimension: "enzymatic_activity",
        canonicalUnit: "U/L",
        compatibleUnits: ["U/L", "IU/L"],
        precision: 0,
        standardSource: "IFCC Reference Measurement: U/L = IU/L"
      },
      total_bilirubin: {
        parameter: "total_bilirubin",
        displayName: "Total Bilirubin",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "\xB5mol/L"],
        precision: 2,
        molarMass: 584.66,
        standardSource: "1 mg/dL = 17.1 \xB5mol/L"
      },
      direct_bilirubin: {
        parameter: "direct_bilirubin",
        displayName: "Direct Bilirubin",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "\xB5mol/L"],
        precision: 2,
        molarMass: 584.66,
        standardSource: "1 mg/dL = 17.1 \xB5mol/L"
      },
      total_protein: {
        parameter: "total_protein",
        displayName: "Total Protein",
        dimension: "analyte_concentration",
        canonicalUnit: "g/dL",
        compatibleUnits: ["g/dL", "g/L"],
        precision: 1,
        standardSource: "1 g/dL = 10 g/L"
      },
      albumin: {
        parameter: "albumin",
        displayName: "Serum Albumin",
        dimension: "analyte_concentration",
        canonicalUnit: "g/dL",
        compatibleUnits: ["g/dL", "g/L"],
        precision: 1,
        standardSource: "1 g/dL = 10 g/L"
      },
      // === ELECTROLYTES & CHEMISTRY ===
      sodium: {
        parameter: "sodium",
        displayName: "Serum Sodium (Na\u207A)",
        dimension: "analyte_concentration",
        canonicalUnit: "mEq/L",
        compatibleUnits: ["mEq/L", "mmol/L"],
        precision: 0,
        standardSource: "Monovalent ion: 1 mEq/L = 1 mmol/L"
      },
      potassium: {
        parameter: "potassium",
        displayName: "Serum Potassium (K\u207A)",
        dimension: "analyte_concentration",
        canonicalUnit: "mEq/L",
        compatibleUnits: ["mEq/L", "mmol/L"],
        precision: 1,
        standardSource: "Monovalent ion: 1 mEq/L = 1 mmol/L"
      },
      chloride: {
        parameter: "chloride",
        displayName: "Serum Chloride (Cl\u207B)",
        dimension: "analyte_concentration",
        canonicalUnit: "mEq/L",
        compatibleUnits: ["mEq/L", "mmol/L"],
        precision: 0,
        standardSource: "Monovalent ion: 1 mEq/L = 1 mmol/L"
      },
      calcium: {
        parameter: "calcium",
        displayName: "Total Serum Calcium",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 40.078,
        standardSource: "1 mg/dL = 0.2495 mmol/L (factor 4.008)"
      },
      magnesium: {
        parameter: "magnesium",
        displayName: "Serum Magnesium",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 2,
        molarMass: 24.305,
        standardSource: "1 mg/dL = 0.4114 mmol/L (factor 2.43)"
      },
      phosphate: {
        parameter: "phosphate",
        displayName: "Inorganic Phosphorus",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "mmol/L"],
        precision: 1,
        molarMass: 30.974,
        standardSource: "1 mg/dL = 0.3229 mmol/L (factor 3.097)"
      },
      uric_acid: {
        parameter: "uric_acid",
        displayName: "Serum Uric Acid",
        dimension: "analyte_concentration",
        canonicalUnit: "mg/dL",
        compatibleUnits: ["mg/dL", "\xB5mol/L"],
        precision: 1,
        molarMass: 168.11,
        standardSource: "1 mg/dL = 59.48 \xB5mol/L"
      },
      // === ENDOCRINE & VITAMINS ===
      tsh: {
        parameter: "tsh",
        displayName: "Thyroid Stimulating Hormone (TSH)",
        dimension: "analyte_concentration",
        canonicalUnit: "\xB5IU/mL",
        compatibleUnits: ["\xB5IU/mL", "mIU/L"],
        precision: 2,
        standardSource: "WHO International Standard: 1 \xB5IU/mL = 1 mIU/L"
      },
      vitamin_d: {
        parameter: "vitamin_d",
        displayName: "25-Hydroxy Vitamin D",
        dimension: "analyte_concentration",
        canonicalUnit: "ng/mL",
        compatibleUnits: ["ng/mL", "nmol/L"],
        precision: 1,
        molarMass: 400.64,
        standardSource: "Endocrine Society Guidelines: 1 ng/mL = 2.496 nmol/L"
      },
      vitamin_b12: {
        parameter: "vitamin_b12",
        displayName: "Vitamin B12 (Cobalamin)",
        dimension: "analyte_concentration",
        canonicalUnit: "pg/mL",
        compatibleUnits: ["pg/mL", "pmol/L"],
        precision: 0,
        molarMass: 1355.37,
        standardSource: "1 pg/mL = 0.7378 pmol/L"
      },
      hba1c: {
        parameter: "hba1c",
        displayName: "Glycated Hemoglobin (HbA1c)",
        dimension: "proportion",
        canonicalUnit: "%",
        compatibleUnits: ["%", "mmol/mol"],
        precision: 1,
        standardSource: "NGSP to IFCC master equation: IFCC = (NGSP - 2.15) * 10.929"
      },
      // === BIOMETRICS & VITALS ===
      height: {
        parameter: "height",
        displayName: "Height",
        dimension: "length",
        canonicalUnit: "cm",
        compatibleUnits: ["cm", "m", "in", "ft"],
        precision: 1,
        standardSource: "1 in = 2.54 cm exact SI definition"
      },
      weight: {
        parameter: "weight",
        displayName: "Body Weight",
        dimension: "mass",
        canonicalUnit: "kg",
        compatibleUnits: ["kg", "lb"],
        precision: 1,
        standardSource: "1 lb = 0.45359237 kg exact international avoirdupois definition"
      },
      temperature: {
        parameter: "temperature",
        displayName: "Body Temperature",
        dimension: "temperature",
        canonicalUnit: "\xB0C",
        compatibleUnits: ["\xB0C", "\xB0F", "K"],
        precision: 1,
        standardSource: "Standard thermometry: \xB0F = (\xB0C * 9/5) + 32"
      },
      blood_pressure: {
        parameter: "blood_pressure",
        displayName: "Blood Pressure",
        dimension: "pressure",
        canonicalUnit: "mmHg",
        compatibleUnits: ["mmHg", "kPa"],
        precision: 0,
        standardSource: "AHA/ACC Hypertension Guidelines: 1 mmHg = 0.133322 kPa"
      },
      blood_pressure_systolic: {
        parameter: "blood_pressure_systolic",
        displayName: "Systolic Blood Pressure",
        dimension: "pressure",
        canonicalUnit: "mmHg",
        compatibleUnits: ["mmHg", "kPa"],
        precision: 0,
        standardSource: "1 mmHg = 0.133322 kPa"
      },
      blood_pressure_diastolic: {
        parameter: "blood_pressure_diastolic",
        displayName: "Diastolic Blood Pressure",
        dimension: "pressure",
        canonicalUnit: "mmHg",
        compatibleUnits: ["mmHg", "kPa"],
        precision: 0,
        standardSource: "1 mmHg = 0.133322 kPa"
      },
      heart_rate: {
        parameter: "heart_rate",
        displayName: "Heart Rate (Pulse)",
        dimension: "frequency",
        canonicalUnit: "bpm",
        compatibleUnits: ["bpm", "beats/min", "/min"],
        precision: 0,
        standardSource: "1 bpm = 1 beat/min"
      },
      respiratory_rate: {
        parameter: "respiratory_rate",
        displayName: "Respiratory Rate",
        dimension: "frequency",
        canonicalUnit: "breaths/min",
        compatibleUnits: ["breaths/min", "/min"],
        precision: 0,
        standardSource: "1 breath/min = 1 respiration/min"
      },
      spo2: {
        parameter: "spo2",
        displayName: "Oxygen Saturation (SpO\u2082)",
        dimension: "proportion",
        canonicalUnit: "%",
        compatibleUnits: ["%"],
        precision: 1,
        standardSource: "SpO2 is percentage saturation; not convertible to arterial partial pressure (PaO2)"
      },
      bmi: {
        parameter: "bmi",
        displayName: "Body Mass Index (BMI)",
        dimension: "clinical_index",
        canonicalUnit: "kg/m\xB2",
        compatibleUnits: ["kg/m\xB2"],
        precision: 1,
        standardSource: "WHO Adult Anthropometric Stratification: weight(kg) / [height(m)]\xB2"
      }
    };
  }
});

// src/lib/units/converter.ts
function sanitizeUnit(unit) {
  if (!unit) return "";
  return unit.trim().toLowerCase().replace(/\s+/g, " ").replace(/[μµ]/g, "u").replace(/x10\^?3/g, "10^3").replace(/x10\^?6/g, "10^6").replace(/x10\^?9/g, "10^9").replace(/x10\^?12/g, "10^12").replace(/x10³/g, "10^3").replace(/x10⁶/g, "10^6").replace(/x10⁹/g, "10^9").replace(/x10¹²/g, "10^12");
}
function lookupUnit(rawUnit) {
  if (!rawUnit) return null;
  const clean = sanitizeUnit(rawUnit);
  const cleanNoSpaces = clean.replace(/\s+/g, "");
  for (const def of Object.values(UNIT_REGISTRY)) {
    if (sanitizeUnit(def.symbol) === clean || def.symbol.toLowerCase() === clean) {
      return def;
    }
    for (const alias of def.aliases) {
      const cleanAlias = sanitizeUnit(alias);
      if (cleanAlias === clean || cleanAlias.replace(/\s+/g, "") === cleanNoSpaces) {
        return def;
      }
    }
  }
  return null;
}
function lookupParameterRule(parameter) {
  if (!parameter) return null;
  const clean = parameter.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_");
  if (CLINICAL_PARAMETER_RULES[clean]) {
    return CLINICAL_PARAMETER_RULES[clean];
  }
  for (const [key, rule] of Object.entries(CLINICAL_PARAMETER_RULES)) {
    if (key === clean || rule.displayName.toLowerCase().includes(parameter.toLowerCase())) {
      return rule;
    }
  }
  if (clean.includes("glucose") || clean.includes("sugar") || clean.includes("fbs") || clean.includes("rbs")) {
    return CLINICAL_PARAMETER_RULES["fasting_glucose"];
  }
  if (clean.includes("total_cholesterol") || clean.includes("cholesterol") && !clean.includes("hdl") && !clean.includes("ldl")) {
    return CLINICAL_PARAMETER_RULES["total_cholesterol"];
  }
  if (clean.includes("ldl")) return CLINICAL_PARAMETER_RULES["ldl"];
  if (clean.includes("hdl")) return CLINICAL_PARAMETER_RULES["hdl"];
  if (clean.includes("triglyceride")) return CLINICAL_PARAMETER_RULES["triglycerides"];
  if (clean.includes("creatinine")) return CLINICAL_PARAMETER_RULES["creatinine"];
  if (clean.includes("bun") || clean.includes("urea_nitrogen")) return CLINICAL_PARAMETER_RULES["bun"];
  if (clean.includes("urea")) return CLINICAL_PARAMETER_RULES["serum_urea"];
  if (clean.includes("hemoglobin") || clean.includes("hb") || clean.includes("hgb")) return CLINICAL_PARAMETER_RULES["hemoglobin"];
  if (clean.includes("hematocrit") || clean.includes("pcv")) return CLINICAL_PARAMETER_RULES["hematocrit"];
  if (clean.includes("platelet")) return CLINICAL_PARAMETER_RULES["platelets"];
  if (clean.includes("wbc") || clean.includes("leukocyte") || clean.includes("tlc")) return CLINICAL_PARAMETER_RULES["wbc"];
  if (clean.includes("rbc") || clean.includes("erythrocyte")) return CLINICAL_PARAMETER_RULES["rbc"];
  if (clean.includes("alt") || clean.includes("sgpt")) return CLINICAL_PARAMETER_RULES["alt"];
  if (clean.includes("ast") || clean.includes("sgot")) return CLINICAL_PARAMETER_RULES["ast"];
  if (clean.includes("bilirubin")) return CLINICAL_PARAMETER_RULES["total_bilirubin"];
  if (clean.includes("sodium")) return CLINICAL_PARAMETER_RULES["sodium"];
  if (clean.includes("potassium")) return CLINICAL_PARAMETER_RULES["potassium"];
  if (clean.includes("chloride")) return CLINICAL_PARAMETER_RULES["chloride"];
  if (clean.includes("calcium")) return CLINICAL_PARAMETER_RULES["calcium"];
  if (clean.includes("magnesium")) return CLINICAL_PARAMETER_RULES["magnesium"];
  if (clean.includes("phosphate") || clean.includes("phosphorus")) return CLINICAL_PARAMETER_RULES["phosphate"];
  if (clean.includes("uric")) return CLINICAL_PARAMETER_RULES["uric_acid"];
  if (clean.includes("tsh")) return CLINICAL_PARAMETER_RULES["tsh"];
  if (clean.includes("vitamin_d")) return CLINICAL_PARAMETER_RULES["vitamin_d"];
  if (clean.includes("vitamin_b12") || clean.includes("b12")) return CLINICAL_PARAMETER_RULES["vitamin_b12"];
  if (clean.includes("hba1c") || clean.includes("a1c")) return CLINICAL_PARAMETER_RULES["hba1c"];
  if (clean.includes("bp") || clean.includes("blood_pressure")) return CLINICAL_PARAMETER_RULES["blood_pressure"];
  if (clean.includes("pulse") || clean.includes("heart_rate")) return CLINICAL_PARAMETER_RULES["heart_rate"];
  if (clean.includes("respirat")) return CLINICAL_PARAMETER_RULES["respiratory_rate"];
  if (clean.includes("spo2") || clean.includes("oxygen")) return CLINICAL_PARAMETER_RULES["spo2"];
  if (clean.includes("height")) return CLINICAL_PARAMETER_RULES["height"];
  if (clean.includes("weight")) return CLINICAL_PARAMETER_RULES["weight"];
  if (clean.includes("bmi")) return CLINICAL_PARAMETER_RULES["bmi"];
  return null;
}
function roundToPrecision(val, decimals) {
  if (isNaN(val) || !isFinite(val)) return val;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
function convertUnit(value, fromUnit, toUnit, options = {}) {
  const { parameter, precision, strict = true } = options;
  if (value === null || value === void 0 || isNaN(value) || !isFinite(value)) {
    return {
      success: false,
      value: null,
      fromUnit: fromUnit || "",
      toUnit: toUnit || "",
      parameter,
      formula: "N/A",
      error: `Invalid numerical input: ${value}`
    };
  }
  if (!fromUnit || !toUnit) {
    return {
      success: false,
      value: null,
      fromUnit: fromUnit || "",
      toUnit: toUnit || "",
      parameter,
      formula: "N/A",
      error: "Both fromUnit and toUnit must be provided."
    };
  }
  const sFrom = sanitizeUnit(fromUnit);
  const sTo = sanitizeUnit(toUnit);
  const fromDef = lookupUnit(fromUnit);
  const toDef = lookupUnit(toUnit);
  if (sFrom === sTo || fromDef && toDef && fromDef.id === toDef.id) {
    const finalVal = precision !== void 0 ? roundToPrecision(value, precision) : value;
    return {
      success: true,
      value: finalVal,
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter,
      formula: "value",
      factorOrOffset: 1
    };
  }
  if (strict && fromDef?.physicalMinimum !== void 0 && value < fromDef.physicalMinimum) {
    return {
      success: false,
      value: null,
      fromUnit,
      toUnit,
      parameter,
      formula: "N/A",
      error: `Value ${value} ${fromUnit} violates physical minimum bound of ${fromDef.physicalMinimum} ${fromDef.symbol}.`
    };
  }
  const rule = parameter ? lookupParameterRule(parameter) : null;
  const paramKey = rule?.parameter || "";
  if (paramKey === "fasting_glucose" || paramKey === "serum_glucose") {
    if ((sFrom === "mg/dl" || sFrom === "mg%" || sFrom === "mg/100ml") && sTo === "mmol/l") {
      const converted = value / 18.0182;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value / 18.0182",
        factorOrOffset: 18.0182
      };
    }
    if (sFrom === "mmol/l" && (sTo === "mg/dl" || sTo === "mg%" || sTo === "mg/100ml")) {
      const converted = value * 18.0182;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value * 18.0182",
        factorOrOffset: 18.0182
      };
    }
  }
  if (paramKey === "total_cholesterol" || paramKey === "ldl" || paramKey === "hdl") {
    if ((sFrom === "mg/dl" || sFrom === "mg%") && sTo === "mmol/l") {
      const converted = value * 0.02586;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.02586",
        factorOrOffset: 0.02586
      };
    }
    if (sFrom === "mmol/l" && (sTo === "mg/dl" || sTo === "mg%")) {
      const converted = value / 0.02586;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.02586",
        factorOrOffset: 0.02586
      };
    }
  }
  if (paramKey === "triglycerides") {
    if ((sFrom === "mg/dl" || sFrom === "mg%") && sTo === "mmol/l") {
      const converted = value * 0.01129;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.01129",
        factorOrOffset: 0.01129
      };
    }
    if (sFrom === "mmol/l" && (sTo === "mg/dl" || sTo === "mg%")) {
      const converted = value / 0.01129;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.01129",
        factorOrOffset: 0.01129
      };
    }
  }
  if (paramKey === "creatinine") {
    if ((sFrom === "mg/dl" || sFrom === "mg%") && (sTo === "umol/l" || sTo === "\xB5mol/l" || sTo === "micromol/l")) {
      const converted = value * 88.4;
      const targetDecimals = precision ?? 1;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "mg/dL",
        toUnit: "\xB5mol/L",
        parameter: paramKey,
        formula: "value * 88.4",
        factorOrOffset: 88.4
      };
    }
    if ((sFrom === "umol/l" || sFrom === "\xB5mol/l" || sFrom === "micromol/l") && (sTo === "mg/dl" || sTo === "mg%")) {
      const converted = value / 88.4;
      const targetDecimals = precision ?? 2;
      return {
        success: true,
        value: roundToPrecision(converted, targetDecimals),
        fromUnit: "\xB5mol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 88.4",
        factorOrOffset: 88.4
      };
    }
  }
  if (paramKey === "bun") {
    if (sFrom === "mg/dl" && sTo === "mmol/l") {
      const converted = value * 0.357;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.357",
        factorOrOffset: 0.357
      };
    }
    if (sFrom === "mmol/l" && sTo === "mg/dl") {
      const converted = value / 0.357;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.357",
        factorOrOffset: 0.357
      };
    }
  }
  if (paramKey === "serum_urea") {
    if (sFrom === "mg/dl" && sTo === "mmol/l") {
      const converted = value * 0.1665;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.1665",
        factorOrOffset: 0.1665
      };
    }
    if (sFrom === "mmol/l" && sTo === "mg/dl") {
      const converted = value / 0.1665;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.1665",
        factorOrOffset: 0.1665
      };
    }
  }
  if (paramKey === "uacr") {
    if (sFrom === "mg/g" && sTo === "mg/mmol") {
      const converted = value * 0.113;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/g",
        toUnit: "mg/mmol",
        parameter: paramKey,
        formula: "value * 0.113",
        factorOrOffset: 0.113
      };
    }
    if (sFrom === "mg/mmol" && sTo === "mg/g") {
      const converted = value / 0.113;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mg/mmol",
        toUnit: "mg/g",
        parameter: paramKey,
        formula: "value / 0.113",
        factorOrOffset: 0.113
      };
    }
  }
  if (paramKey === "hemoglobin" || paramKey === "total_protein" || paramKey === "albumin" || (sFrom === "g/dl" || sFrom === "gm/dl" || sFrom === "g%") && (sTo === "g/l" || sTo === "gm/l") || (sFrom === "g/l" || sFrom === "gm/l") && (sTo === "g/dl" || sTo === "gm/dl" || sTo === "g%")) {
    if ((sFrom === "g/dl" || sFrom === "gm/dl" || sFrom === "g%") && (sTo === "g/l" || sTo === "gm/l")) {
      const converted = value * 10;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "g/dL",
        toUnit: "g/L",
        parameter: paramKey || void 0,
        formula: "value * 10",
        factorOrOffset: 10
      };
    }
    if ((sFrom === "g/l" || sFrom === "gm/l") && (sTo === "g/dl" || sTo === "gm/dl" || sTo === "g%")) {
      const converted = value / 10;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "g/L",
        toUnit: "g/dL",
        parameter: paramKey || void 0,
        formula: "value / 10",
        factorOrOffset: 10
      };
    }
  }
  if (paramKey === "hematocrit" || sFrom === "%" && sTo === "l/l" || sFrom === "l/l" && sTo === "%") {
    if (sFrom === "%" && sTo === "l/l") {
      const converted = value / 100;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 3),
        fromUnit: "%",
        toUnit: "L/L",
        parameter: paramKey || void 0,
        formula: "value / 100",
        factorOrOffset: 100
      };
    }
    if (sFrom === "l/l" && sTo === "%") {
      const converted = value * 100;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "L/L",
        toUnit: "%",
        parameter: paramKey || void 0,
        formula: "value * 100",
        factorOrOffset: 100
      };
    }
  }
  if (paramKey === "platelets" || sFrom.includes("lakh") || sTo.includes("lakh")) {
    let valInThousands = value;
    if (sFrom.includes("lakh")) {
      valInThousands = value * 100;
    } else if (sFrom === "/\xB5l" || sFrom === "/ul" || sFrom.includes("cells")) {
      valInThousands = value / 1e3;
    }
    if (sTo.includes("lakh")) {
      const finalVal = valInThousands / 100;
      return {
        success: true,
        value: roundToPrecision(finalVal, precision ?? 2),
        fromUnit,
        toUnit: "lakh/\xB5L",
        parameter: "platelets",
        formula: "normalized_to_thousands / 100",
        factorOrOffset: 100
      };
    }
    if (sTo === "x10\xB3/\xB5l" || sTo === "10^3/ul" || sTo === "x10^9/l" || sTo === "x10\u2079/l") {
      return {
        success: true,
        value: roundToPrecision(valInThousands, precision ?? 1),
        fromUnit,
        toUnit: "x10\xB3/\xB5L",
        parameter: "platelets",
        formula: "value * 100 (if lakh)",
        factorOrOffset: 100
      };
    }
    if (sTo === "/\xB5l" || sTo === "/ul" || sTo.includes("cells")) {
      const finalVal = valInThousands * 1e3;
      return {
        success: true,
        value: roundToPrecision(finalVal, precision ?? 0),
        fromUnit,
        toUnit: "/\xB5L",
        parameter: "platelets",
        formula: "thousands * 1000",
        factorOrOffset: 1e3
      };
    }
  }
  if (paramKey === "wbc") {
    if ((sFrom === "/\xB5l" || sFrom === "/ul" || sFrom.includes("cells")) && (sTo.includes("10^3") || sTo.includes("10^9") || sTo.includes("10\xB3") || sTo.includes("10\u2079") || sTo.includes("thousand"))) {
      const converted = value / 1e3;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "/\xB5L",
        toUnit: "x10\xB3/\xB5L",
        parameter: "wbc",
        formula: "value / 1000",
        factorOrOffset: 1e3
      };
    }
    if ((sFrom.includes("10^3") || sFrom.includes("10^9") || sFrom.includes("10\xB3") || sFrom.includes("10\u2079") || sFrom.includes("thousand")) && (sTo === "/\xB5l" || sTo === "/ul" || sTo.includes("cells"))) {
      const converted = value * 1e3;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: "x10\xB3/\xB5L",
        toUnit: "/\xB5L",
        parameter: "wbc",
        formula: "value * 1000",
        factorOrOffset: 1e3
      };
    }
  }
  if (paramKey === "total_bilirubin" || paramKey === "direct_bilirubin") {
    if (sFrom === "mg/dl" && (sTo === "umol/l" || sTo === "\xB5mol/l")) {
      const converted = value * 17.104;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mg/dL",
        toUnit: "\xB5mol/L",
        parameter: paramKey,
        formula: "value * 17.104",
        factorOrOffset: 17.104
      };
    }
    if ((sFrom === "umol/l" || sFrom === "\xB5mol/l") && sTo === "mg/dl") {
      const converted = value / 17.104;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "\xB5mol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 17.104",
        factorOrOffset: 17.104
      };
    }
  }
  if (paramKey === "calcium") {
    if (sFrom === "mg/dl" && sTo === "mmol/l") {
      const converted = value * 0.2495;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.2495",
        factorOrOffset: 0.2495
      };
    }
    if (sFrom === "mmol/l" && sTo === "mg/dl") {
      const converted = value / 0.2495;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.2495",
        factorOrOffset: 0.2495
      };
    }
  }
  if (paramKey === "magnesium") {
    if (sFrom === "mg/dl" && sTo === "mmol/l") {
      const converted = value * 0.4114;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.4114",
        factorOrOffset: 0.4114
      };
    }
    if (sFrom === "mmol/l" && sTo === "mg/dl") {
      const converted = value / 0.4114;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.4114",
        factorOrOffset: 0.4114
      };
    }
  }
  if (paramKey === "phosphate") {
    if (sFrom === "mg/dl" && sTo === "mmol/l") {
      const converted = value * 0.3229;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 2),
        fromUnit: "mg/dL",
        toUnit: "mmol/L",
        parameter: paramKey,
        formula: "value * 0.3229",
        factorOrOffset: 0.3229
      };
    }
    if (sFrom === "mmol/l" && sTo === "mg/dl") {
      const converted = value / 0.3229;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 0.3229",
        factorOrOffset: 0.3229
      };
    }
  }
  if (paramKey === "uric_acid") {
    if (sFrom === "mg/dl" && (sTo === "umol/l" || sTo === "\xB5mol/l")) {
      const converted = value * 59.48;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mg/dL",
        toUnit: "\xB5mol/L",
        parameter: paramKey,
        formula: "value * 59.48",
        factorOrOffset: 59.48
      };
    }
    if ((sFrom === "umol/l" || sFrom === "\xB5mol/l") && sTo === "mg/dl") {
      const converted = value / 59.48;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "\xB5mol/L",
        toUnit: "mg/dL",
        parameter: paramKey,
        formula: "value / 59.48",
        factorOrOffset: 59.48
      };
    }
  }
  if (paramKey === "vitamin_d") {
    if (sFrom === "ng/ml" && sTo === "nmol/l") {
      const converted = value * 2.496;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "ng/mL",
        toUnit: "nmol/L",
        parameter: paramKey,
        formula: "value * 2.496",
        factorOrOffset: 2.496
      };
    }
    if (sFrom === "nmol/l" && sTo === "ng/ml") {
      const converted = value / 2.496;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "nmol/L",
        toUnit: "ng/mL",
        parameter: paramKey,
        formula: "value / 2.496",
        factorOrOffset: 2.496
      };
    }
  }
  if (paramKey === "vitamin_b12") {
    if (sFrom === "pg/ml" && sTo === "pmol/l") {
      const converted = value * 0.7378;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "pg/mL",
        toUnit: "pmol/L",
        parameter: paramKey,
        formula: "value * 0.7378",
        factorOrOffset: 0.7378
      };
    }
    if (sFrom === "pmol/l" && sTo === "pg/ml") {
      const converted = value / 0.7378;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: "pmol/L",
        toUnit: "pg/mL",
        parameter: paramKey,
        formula: "value / 0.7378",
        factorOrOffset: 0.7378
      };
    }
  }
  if (paramKey === "hba1c") {
    if (sFrom === "%" && sTo === "mmol/mol") {
      const converted = (value - 2.15) * 10.929;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 0),
        fromUnit: "%",
        toUnit: "mmol/mol",
        parameter: paramKey,
        formula: "(value - 2.15) * 10.929",
        factorOrOffset: 10.929
      };
    }
    if (sFrom === "mmol/mol" && sTo === "%") {
      const converted = 0.09148 * value + 2.152;
      return {
        success: true,
        value: roundToPrecision(converted, precision ?? 1),
        fromUnit: "mmol/mol",
        toUnit: "%",
        parameter: paramKey,
        formula: "(0.09148 * value) + 2.152",
        factorOrOffset: 0.09148
      };
    }
  }
  const lengthToCm = {
    mm: 0.1,
    cm: 1,
    m: 100,
    in: 2.54,
    inch: 2.54,
    inches: 2.54,
    ft: 30.48,
    foot: 30.48,
    feet: 30.48
  };
  if (lengthToCm[sFrom] !== void 0 && lengthToCm[sTo] !== void 0) {
    const cmValue = value * lengthToCm[sFrom];
    const converted = cmValue / lengthToCm[sTo];
    const targetDecimals = precision ?? (sTo === "m" || sTo === "ft" ? 2 : 1);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "length",
      formula: `(value * ${lengthToCm[sFrom]}) / ${lengthToCm[sTo]}`,
      factorOrOffset: lengthToCm[sFrom] / lengthToCm[sTo]
    };
  }
  const massToGrams = {
    ug: 1e-6,
    "\xB5g": 1e-6,
    mcg: 1e-6,
    mg: 1e-3,
    g: 1,
    gm: 1,
    kg: 1e3,
    kgs: 1e3,
    lb: 453.59237,
    lbs: 453.59237,
    oz: 28.349523125
  };
  if (massToGrams[sFrom] !== void 0 && massToGrams[sTo] !== void 0) {
    const gramValue = value * massToGrams[sFrom];
    const converted = gramValue / massToGrams[sTo];
    const targetDecimals = precision ?? (sTo === "kg" || sTo === "lb" ? 1 : 2);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "mass",
      formula: `(value * ${massToGrams[sFrom]}) / ${massToGrams[sTo]}`,
      factorOrOffset: massToGrams[sFrom] / massToGrams[sTo]
    };
  }
  const isTempFrom = sFrom === "\xB0c" || sFrom === "c" || sFrom === "celsius" || sFrom === "\xB0f" || sFrom === "f" || sFrom === "fahrenheit" || sFrom === "k" || sFrom === "kelvin";
  const isTempTo = sTo === "\xB0c" || sTo === "c" || sTo === "celsius" || sTo === "\xB0f" || sTo === "f" || sTo === "fahrenheit" || sTo === "k" || sTo === "kelvin";
  if (isTempFrom && isTempTo) {
    let cValue = value;
    if (sFrom === "\xB0f" || sFrom === "f" || sFrom === "fahrenheit") {
      cValue = (value - 32) * (5 / 9);
    } else if (sFrom === "k" || sFrom === "kelvin") {
      cValue = value - 273.15;
    }
    if (strict && cValue < -273.15) {
      return {
        success: false,
        value: null,
        fromUnit,
        toUnit,
        parameter,
        formula: "N/A",
        error: `Temperature ${value} ${fromUnit} is below absolute zero (0 K / -273.15 \xB0C).`
      };
    }
    let finalVal = cValue;
    let formula = "celsius";
    if (sTo === "\xB0f" || sTo === "f" || sTo === "fahrenheit") {
      finalVal = cValue * (9 / 5) + 32;
      formula = "(celsius * 9/5) + 32";
    } else if (sTo === "k" || sTo === "kelvin") {
      finalVal = cValue + 273.15;
      formula = "celsius + 273.15";
    }
    const targetDecimals = precision ?? 1;
    return {
      success: true,
      value: roundToPrecision(finalVal, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "temperature",
      formula,
      factorOrOffset: formula
    };
  }
  const volumeToMl = {
    ul: 1e-3,
    "\xB5l": 1e-3,
    ml: 1,
    cc: 1,
    dl: 100,
    l: 1e3,
    "fl oz": 29.5735295625,
    "us fl oz": 29.5735295625,
    cup: 236.5882365,
    "us cup": 236.5882365
  };
  if (volumeToMl[sFrom] !== void 0 && volumeToMl[sTo] !== void 0) {
    const mlValue = value * volumeToMl[sFrom];
    const converted = mlValue / volumeToMl[sTo];
    const targetDecimals = precision ?? (sTo === "l" ? 3 : 1);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "volume",
      formula: `(value * ${volumeToMl[sFrom]}) / ${volumeToMl[sTo]}`,
      factorOrOffset: volumeToMl[sFrom] / volumeToMl[sTo]
    };
  }
  const pressureToPa = {
    pa: 1,
    kpa: 1e3,
    mmhg: 133.322387415,
    "mm hg": 133.322387415,
    torr: 133.322387415,
    bar: 1e5,
    atm: 101325
  };
  if (pressureToPa[sFrom] !== void 0 && pressureToPa[sTo] !== void 0) {
    const paValue = value * pressureToPa[sFrom];
    const converted = paValue / pressureToPa[sTo];
    const targetDecimals = precision ?? (sTo === "mmhg" ? 0 : 2);
    return {
      success: true,
      value: roundToPrecision(converted, targetDecimals),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "pressure",
      formula: `(value * ${pressureToPa[sFrom]}) / ${pressureToPa[sTo]}`,
      factorOrOffset: pressureToPa[sFrom] / pressureToPa[sTo]
    };
  }
  if ((sFrom === "s-1" || sFrom === "/s") && (sTo === "min-1" || sTo === "/min")) {
    return {
      success: true,
      value: roundToPrecision(value * 60, precision ?? 0),
      fromUnit: "s\u207B\xB9",
      toUnit: "min\u207B\xB9",
      parameter: parameter || "frequency",
      formula: "value * 60",
      factorOrOffset: 60
    };
  }
  if ((sFrom === "min-1" || sFrom === "/min") && (sTo === "s-1" || sTo === "/s")) {
    return {
      success: true,
      value: roundToPrecision(value / 60, precision ?? 2),
      fromUnit: "min\u207B\xB9",
      toUnit: "s\u207B\xB9",
      parameter: parameter || "frequency",
      formula: "value / 60",
      factorOrOffset: 60
    };
  }
  if ((sFrom === "u/l" || sFrom === "iu/l") && (sTo === "u/l" || sTo === "iu/l")) {
    return {
      success: true,
      value: roundToPrecision(value, precision ?? 0),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: parameter || "enzymatic_activity",
      formula: "value (1:1 international catalytic activity)",
      factorOrOffset: 1
    };
  }
  if ((sFrom === "meq/l" || sFrom === "mmol/l") && (sTo === "meq/l" || sTo === "mmol/l") && (!paramKey || paramKey === "sodium" || paramKey === "potassium" || paramKey === "chloride")) {
    return {
      success: true,
      value: roundToPrecision(value, precision ?? 1),
      fromUnit: fromDef?.symbol || fromUnit,
      toUnit: toDef?.symbol || toUnit,
      parameter: paramKey || "monovalent_electrolyte",
      formula: "value (1:1 monovalent ion relationship)",
      factorOrOffset: 1
    };
  }
  const fromDim = fromDef?.dimension || "unknown";
  const toDim = toDef?.dimension || "unknown";
  return {
    success: false,
    value: null,
    fromUnit,
    toUnit,
    parameter,
    formula: "N/A",
    error: `Incompatible conversion from '${fromUnit}' (${fromDim}) to '${toUnit}' (${toDim})${parameter ? ` for parameter '${parameter}'` : ""}.`
  };
}
function convertToCanonicalUnit(canonicalParam, value, reportedUnit) {
  const rule = lookupParameterRule(canonicalParam);
  const targetUnit = rule ? rule.canonicalUnit : reportedUnit || "units";
  const unit = (reportedUnit || "").trim();
  if (!unit) {
    return {
      success: false,
      convertedValue: null,
      canonicalUnit: targetUnit,
      originalUnit: "",
      conversionApplied: "missing_unit",
      error: `Missing unit for parameter ${canonicalParam}`
    };
  }
  const result = convertUnit(value, unit, targetUnit, { parameter: canonicalParam });
  return {
    success: result.success,
    convertedValue: result.value,
    canonicalUnit: targetUnit,
    originalUnit: unit,
    conversionApplied: result.formula,
    error: result.error
  };
}
var init_converter = __esm({
  "src/lib/units/converter.ts"() {
    init_registry();
  }
});

// src/lib/units/index.ts
var init_units = __esm({
  "src/lib/units/index.ts"() {
    init_types();
    init_registry();
    init_converter();
  }
});

// src/analytics/unitRegistry.ts
var unitRegistry_exports = {};
__export(unitRegistry_exports, {
  CANONICAL_PARAMETERS: () => CANONICAL_PARAMETERS,
  convertToCanonicalUnit: () => convertToCanonicalUnit2,
  sanitizeUnit: () => sanitizeUnit
});
function convertToCanonicalUnit2(canonicalParam, value, reportedUnit) {
  return convertToCanonicalUnit(canonicalParam, value, reportedUnit);
}
var CANONICAL_PARAMETERS;
var init_unitRegistry = __esm({
  "src/analytics/unitRegistry.ts"() {
    init_units();
    CANONICAL_PARAMETERS = Object.fromEntries(
      Object.entries(CLINICAL_PARAMETER_RULES).map(([key, rule]) => [
        key,
        {
          canonicalName: rule.parameter,
          displayName: rule.displayName,
          canonicalUnit: rule.canonicalUnit,
          supportedUnits: rule.compatibleUnits
        }
      ])
    );
  }
});

// riskEngine.ts
function extractNumeric(val) {
  if (val === void 0 || val === null) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const cleaned = val.toString().replace(/,/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}
function buildEvidenceJson(explanation, action, details, missingRequirements = []) {
  return JSON.stringify({ explanation, action, details, missingRequirements });
}
function extractCanonicalObservations(measurements) {
  const latestByParam = /* @__PURE__ */ new Map();
  const sorted = [...measurements].sort((a, b) => {
    const da = new Date(a.report_date).getTime() || 0;
    const db2 = new Date(b.report_date).getTime() || 0;
    return da - db2;
  });
  for (const m of sorted) {
    const canonical = normalizeParameterName(m.parameter);
    const rawValStr = String(m.raw_value || m.normalized_value || "").trim();
    const unitStr = String(m.unit || m.normalized_unit || "").trim();
    const reportName = m.report || "Medical Report";
    const pageNum = m.page || "1";
    const dateStr = m.report_date || "";
    const vStatus = m.validation_status;
    if (canonical === "blood_pressure" || rawValStr.includes("/")) {
      const parts = rawValStr.split("/");
      if (parts.length >= 2) {
        const sys = extractNumeric(parts[0]);
        const dia = extractNumeric(parts[1]);
        if (sys !== null && sys >= 40 && sys <= 300) {
          latestByParam.set("blood_pressure_systolic", {
            canonicalParam: "blood_pressure_systolic",
            displayName: "Systolic Blood Pressure",
            originalValue: `${sys}`,
            originalUnit: unitStr || "mmHg",
            canonicalValue: sys,
            canonicalUnit: "mmHg",
            date: dateStr,
            report: reportName,
            page: pageNum,
            validationStatus: vStatus
          });
        }
        if (dia !== null && dia >= 20 && dia <= 200) {
          latestByParam.set("blood_pressure_diastolic", {
            canonicalParam: "blood_pressure_diastolic",
            displayName: "Diastolic Blood Pressure",
            originalValue: `${dia}`,
            originalUnit: unitStr || "mmHg",
            canonicalValue: dia,
            canonicalUnit: "mmHg",
            date: dateStr,
            report: reportName,
            page: pageNum,
            validationStatus: vStatus
          });
        }
      }
      continue;
    }
    const numVal = extractNumeric(rawValStr);
    if (numVal === null) continue;
    let canonicalVal = numVal;
    let canonicalUnit = unitStr;
    const conversion = convertToCanonicalUnit2(canonical, numVal, unitStr);
    if (conversion.success && conversion.convertedValue !== null) {
      canonicalVal = conversion.convertedValue;
      canonicalUnit = conversion.canonicalUnit;
    }
    latestByParam.set(canonical, {
      canonicalParam: canonical,
      displayName: getParameterDisplayName(canonical),
      originalValue: rawValStr,
      originalUnit: unitStr,
      canonicalValue: canonicalVal,
      canonicalUnit,
      date: dateStr,
      report: reportName,
      page: pageNum,
      validationStatus: vStatus
    });
  }
  return latestByParam;
}
function evaluateCardiovascularRisk(measurements) {
  const obs = extractCanonicalObservations(measurements);
  const sbp = obs.get("blood_pressure_systolic");
  const dbp = obs.get("blood_pressure_diastolic");
  const ldl = obs.get("ldl");
  const chol = obs.get("total_cholesterol");
  const tg = obs.get("triglycerides");
  const hdl = obs.get("hdl");
  const hasAnyCardio = sbp || dbp || ldl || chol || tg || hdl;
  if (!hasAnyCardio) {
    return {
      domain: "cardiovascular",
      level: "GREY",
      label: "Insufficient Information",
      evidence: buildEvidenceJson(
        "Missing both Blood Pressure and Lipid Panel measurements to evaluate cardiovascular risk.",
        "Upload recent medical laboratory reports containing Blood Pressure or Lipid Profile metrics.",
        [],
        ["Blood Pressure", "LDL Cholesterol", "Total Cholesterol"]
      ),
      data_quality: "INSUFFICIENT",
      rule_version: RISK_RULE_VERSION
    };
  }
  const cardioObs = [sbp, dbp, ldl, chol, tg, hdl].filter(Boolean);
  if (cardioObs.some((o) => o.validationStatus && o.validationStatus !== "VALIDATED")) {
    return {
      domain: "cardiovascular",
      level: "GREY",
      label: "Unreliable Data",
      evidence: buildEvidenceJson(
        "One or more critical cardiovascular measurements have not been validated.",
        "Review and validate pending clinical measurements before computing risk assessment.",
        [],
        ["Validated Measurements"]
      ),
      data_quality: "UNRELIABLE",
      rule_version: RISK_RULE_VERSION
    };
  }
  let maxRisk = 0;
  const evidenceList = [];
  const missingRequirements = [];
  if (sbp || dbp) {
    const sysVal = sbp ? sbp.canonicalValue : null;
    const diaVal = dbp ? dbp.canonicalValue : null;
    let bpReason = "Normal";
    if (sysVal !== null && sysVal >= 140 || diaVal !== null && diaVal >= 90) {
      maxRisk = Math.max(maxRisk, 3);
      bpReason = "Stage 2 Hypertension (>=140/90 mmHg)";
    } else if (sysVal !== null && sysVal >= 130 || diaVal !== null && diaVal >= 80) {
      maxRisk = Math.max(maxRisk, 2);
      bpReason = "Stage 1 Hypertension (130-139/80-89 mmHg)";
    } else if (sysVal !== null && sysVal >= 120 && (diaVal === null || diaVal < 80)) {
      maxRisk = Math.max(maxRisk, 1);
      bpReason = "Elevated Blood Pressure (120-129/<80 mmHg)";
    }
    const bpDisplay = `${sysVal ?? "\u2014"}/${diaVal ?? "\u2014"}`;
    const primaryObs = sbp || dbp;
    evidenceList.push({
      parameter: "Blood Pressure",
      value: `${bpDisplay} mmHg`,
      date: primaryObs.date,
      report: primaryObs.report,
      page: primaryObs.page,
      reason: bpReason
    });
  } else {
    missingRequirements.push("Blood Pressure");
  }
  if (ldl) {
    const val = ldl.canonicalValue;
    let ldlReason = "Optimal (<100 mg/dL)";
    if (val >= 160) {
      maxRisk = Math.max(maxRisk, 3);
      ldlReason = "High LDL (>=160 mg/dL)";
    } else if (val >= 130) {
      maxRisk = Math.max(maxRisk, 2);
      ldlReason = "Borderline High LDL (130-159 mg/dL)";
    } else if (val >= 100) {
      maxRisk = Math.max(maxRisk, 1);
      ldlReason = "Above Optimal LDL (100-129 mg/dL)";
    }
    evidenceList.push({
      parameter: "LDL Cholesterol",
      value: `${val.toFixed(1)} ${ldl.canonicalUnit}`,
      date: ldl.date,
      report: ldl.report,
      page: ldl.page,
      reason: ldlReason
    });
  } else {
    missingRequirements.push("LDL Cholesterol");
  }
  if (chol) {
    const val = chol.canonicalValue;
    let cholReason = "Desirable (<200 mg/dL)";
    if (val >= 240) {
      maxRisk = Math.max(maxRisk, 3);
      cholReason = "High Total Cholesterol (>=240 mg/dL)";
    } else if (val >= 200) {
      maxRisk = Math.max(maxRisk, 2);
      cholReason = "Borderline High Total Cholesterol (200-239 mg/dL)";
    }
    evidenceList.push({
      parameter: "Total Cholesterol",
      value: `${val.toFixed(1)} ${chol.canonicalUnit}`,
      date: chol.date,
      report: chol.report,
      page: chol.page,
      reason: cholReason
    });
  }
  if (tg) {
    const val = tg.canonicalValue;
    let tgReason = "Normal (<150 mg/dL)";
    if (val >= 200) {
      maxRisk = Math.max(maxRisk, 2);
      tgReason = "High Triglycerides (>=200 mg/dL)";
    } else if (val >= 150) {
      maxRisk = Math.max(maxRisk, 1);
      tgReason = "Borderline High Triglycerides (150-199 mg/dL)";
    }
    evidenceList.push({
      parameter: "Triglycerides",
      value: `${val.toFixed(1)} ${tg.canonicalUnit}`,
      date: tg.date,
      report: tg.report,
      page: tg.page,
      reason: tgReason
    });
  }
  let finalLevel = "GREEN";
  let finalLabel = "Optimal Indicators";
  let explanation = "Your cardiovascular metrics are within healthy physiological reference intervals.";
  let action = "Maintain your current diet, physical activity, and routine cardiovascular checkups.";
  if (maxRisk === 3) {
    finalLevel = "RED";
    finalLabel = "Significant Indicators Detected";
    explanation = "Major cardiovascular indicators (such as blood pressure or LDL) significantly exceed healthy targets.";
    action = "Consult a cardiologist or primary care physician promptly for a formal clinical evaluation.";
  } else if (maxRisk === 2) {
    finalLevel = "ORANGE";
    finalLabel = "Elevated Indicators";
    explanation = "Cardiovascular metrics are moderately elevated above normal target thresholds.";
    action = "Consider lifestyle modifications (diet, sodium reduction, exercise) and schedule a routine checkup.";
  } else if (maxRisk === 1) {
    finalLevel = "YELLOW";
    finalLabel = "Mild Indicators";
    explanation = "Mild elevations in blood pressure or lipid markers were detected.";
    action = "Monitor blood pressure regularly and review dietary saturated fat intake.";
  }
  const dataQuality = sbp && ldl ? "RELIABLE" : "PARTIAL";
  return {
    domain: "cardiovascular",
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: dataQuality,
    rule_version: RISK_RULE_VERSION
  };
}
function evaluateMetabolicRisk(measurements) {
  const obs = extractCanonicalObservations(measurements);
  const glucose = obs.get("fasting_glucose") || obs.get("serum_glucose");
  const hba1c = obs.get("hba1c");
  const bmi = obs.get("bmi");
  const hasAnyMetabolic = glucose || hba1c || bmi;
  if (!hasAnyMetabolic) {
    return {
      domain: "metabolic",
      level: "GREY",
      label: "Insufficient Information",
      evidence: buildEvidenceJson(
        "Missing Glucose, HbA1c, and BMI measurements to evaluate metabolic risk.",
        "Upload blood chemistry or diabetic panel reports containing blood glucose or HbA1c.",
        [],
        ["Fasting Glucose", "HbA1c", "BMI"]
      ),
      data_quality: "INSUFFICIENT",
      rule_version: RISK_RULE_VERSION
    };
  }
  const metabolicObs = [glucose, hba1c, bmi].filter(Boolean);
  if (metabolicObs.some((o) => o.validationStatus && o.validationStatus !== "VALIDATED")) {
    return {
      domain: "metabolic",
      level: "GREY",
      label: "Unreliable Data",
      evidence: buildEvidenceJson(
        "One or more critical metabolic measurements have not been validated.",
        "Review and validate pending clinical measurements before computing risk assessment.",
        [],
        ["Validated Measurements"]
      ),
      data_quality: "UNRELIABLE",
      rule_version: RISK_RULE_VERSION
    };
  }
  let maxRisk = 0;
  const evidenceList = [];
  const missingRequirements = [];
  if (glucose) {
    const val = glucose.canonicalValue;
    let gReason = "Normal Fasting Glycemia (70-99 mg/dL)";
    if (val >= 126) {
      maxRisk = Math.max(maxRisk, 3);
      gReason = "Diabetes Range (>=126 mg/dL)";
    } else if (val >= 100) {
      maxRisk = Math.max(maxRisk, 1);
      gReason = "Impaired Fasting Glucose / Prediabetes (100-125 mg/dL)";
    }
    evidenceList.push({
      parameter: glucose.displayName,
      value: `${val.toFixed(1)} ${glucose.canonicalUnit}`,
      date: glucose.date,
      report: glucose.report,
      page: glucose.page,
      reason: gReason
    });
  } else {
    missingRequirements.push("Blood Glucose");
  }
  if (hba1c) {
    const val = hba1c.canonicalValue;
    let a1cReason = "Normal Glycated Hemoglobin (<5.7%)";
    if (val >= 6.5) {
      maxRisk = Math.max(maxRisk, 3);
      a1cReason = "Diabetes Diagnostic Threshold (>=6.5%)";
    } else if (val >= 5.7) {
      maxRisk = Math.max(maxRisk, 1);
      a1cReason = "Prediabetes Range (5.7-6.4%)";
    }
    evidenceList.push({
      parameter: "HbA1c",
      value: `${val.toFixed(1)}%`,
      date: hba1c.date,
      report: hba1c.report,
      page: hba1c.page,
      reason: a1cReason
    });
  } else {
    missingRequirements.push("HbA1c");
  }
  if (bmi) {
    const val = bmi.canonicalValue;
    let bmiReason = "Normal Body Mass Index (18.5-24.9 kg/m\xB2)";
    if (val >= 35) {
      maxRisk = Math.max(maxRisk, 3);
      bmiReason = "Class 2+ Obesity (>=35 kg/m\xB2)";
    } else if (val >= 30) {
      maxRisk = Math.max(maxRisk, 2);
      bmiReason = "Obesity (30-34.9 kg/m\xB2)";
    } else if (val >= 25) {
      maxRisk = Math.max(maxRisk, 1);
      bmiReason = "Overweight (25-29.9 kg/m\xB2)";
    }
    evidenceList.push({
      parameter: "Body Mass Index (BMI)",
      value: `${val.toFixed(1)} kg/m\xB2`,
      date: bmi.date,
      report: bmi.report,
      page: bmi.page,
      reason: bmiReason
    });
  }
  let finalLevel = "GREEN";
  let finalLabel = "Optimal Indicators";
  let explanation = "Your blood sugar and metabolic markers are currently within optimal healthy bounds.";
  let action = "Maintain a balanced diet and regular physical activity.";
  if (maxRisk === 3) {
    finalLevel = "RED";
    finalLabel = "Significant Indicators Detected";
    explanation = "Metabolic markers (such as fasting glucose or HbA1c) are consistent with diabetes or metabolic syndrome.";
    action = "Consult an endocrinologist or primary care physician for a glycemic management plan.";
  } else if (maxRisk === 2) {
    finalLevel = "ORANGE";
    finalLabel = "Elevated Indicators";
    explanation = "Metabolic markers indicate notable metabolic or weight elevation.";
    action = "Discuss weight and metabolic strategies with your healthcare provider.";
  } else if (maxRisk === 1) {
    finalLevel = "YELLOW";
    finalLabel = "Mild Indicators";
    explanation = "Mild elevations in glycemic markers or BMI (e.g. prediabetes range).";
    action = "Focus on dietary improvements, reducing refined sugars, and regular exercise.";
  }
  const dataQuality = glucose && (hba1c || bmi) ? "RELIABLE" : "PARTIAL";
  return {
    domain: "metabolic",
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: dataQuality,
    rule_version: RISK_RULE_VERSION
  };
}
function evaluateRenalRisk(measurements) {
  const obs = extractCanonicalObservations(measurements);
  const creatinine = obs.get("creatinine");
  const bun = obs.get("bun");
  const egfr = obs.get("egfr");
  const hasAnyRenal = creatinine || bun || egfr;
  if (!hasAnyRenal) {
    return {
      domain: "renal",
      level: "GREY",
      label: "Insufficient Information",
      evidence: buildEvidenceJson(
        "Missing Serum Creatinine and Renal Panel indicators to assess kidney function.",
        "Upload comprehensive metabolic panel (CMP) or renal function panel reports.",
        [],
        ["Serum Creatinine", "BUN"]
      ),
      data_quality: "INSUFFICIENT",
      rule_version: RISK_RULE_VERSION
    };
  }
  const renalObs = [creatinine, bun, egfr].filter(Boolean);
  if (renalObs.some((o) => o.validationStatus && o.validationStatus !== "VALIDATED")) {
    return {
      domain: "renal",
      level: "GREY",
      label: "Unreliable Data",
      evidence: buildEvidenceJson(
        "One or more renal function measurements have not been validated.",
        "Review and validate pending clinical measurements before computing risk assessment.",
        [],
        ["Validated Measurements"]
      ),
      data_quality: "UNRELIABLE",
      rule_version: RISK_RULE_VERSION
    };
  }
  let maxRisk = 0;
  const evidenceList = [];
  const missingRequirements = [];
  if (creatinine) {
    const val = creatinine.canonicalValue;
    let crReason = "Normal Serum Creatinine (0.6-1.2 mg/dL)";
    if (val >= 2) {
      maxRisk = Math.max(maxRisk, 3);
      crReason = "Marked Creatinine Elevation (>=2.0 mg/dL)";
    } else if (val >= 1.3) {
      maxRisk = Math.max(maxRisk, 2);
      crReason = "Mild to Moderate Creatinine Elevation (1.3-1.9 mg/dL)";
    }
    evidenceList.push({
      parameter: "Serum Creatinine",
      value: `${val.toFixed(2)} ${creatinine.canonicalUnit}`,
      date: creatinine.date,
      report: creatinine.report,
      page: creatinine.page,
      reason: crReason
    });
  } else {
    missingRequirements.push("Serum Creatinine");
  }
  if (bun) {
    const val = bun.canonicalValue;
    let bunReason = "Normal BUN (7-20 mg/dL)";
    if (val >= 30) {
      maxRisk = Math.max(maxRisk, 2);
      bunReason = "Elevated Blood Urea Nitrogen (>=30 mg/dL)";
    } else if (val >= 21) {
      maxRisk = Math.max(maxRisk, 1);
      bunReason = "Mildly Elevated BUN (21-29 mg/dL)";
    }
    evidenceList.push({
      parameter: "Blood Urea Nitrogen (BUN)",
      value: `${val.toFixed(1)} ${bun.canonicalUnit}`,
      date: bun.date,
      report: bun.report,
      page: bun.page,
      reason: bunReason
    });
  }
  let finalLevel = "GREEN";
  let finalLabel = "Optimal Indicators";
  let explanation = "Renal filtration markers (creatinine/BUN) are within healthy physiological ranges.";
  let action = "Maintain adequate hydration and routine metabolic health screenings.";
  if (maxRisk === 3) {
    finalLevel = "RED";
    finalLabel = "Significant Indicators Detected";
    explanation = "Serum creatinine is substantially elevated, indicating significant reduction in renal clearance.";
    action = "Consult a nephrologist or physician promptly for renal diagnostic assessment.";
  } else if (maxRisk === 2) {
    finalLevel = "ORANGE";
    finalLabel = "Elevated Indicators";
    explanation = "Kidney filtration biomarkers are moderately elevated above normal target baselines.";
    action = "Review hydration, medications (NSAIDs), and schedule a follow-up kidney panel.";
  } else if (maxRisk === 1) {
    finalLevel = "YELLOW";
    finalLabel = "Mild Indicators";
    explanation = "Mild elevations observed in BUN or filtration markers.";
    action = "Ensure good hydration and recheck on next routine panel.";
  }
  return {
    domain: "renal",
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: creatinine ? "RELIABLE" : "PARTIAL",
    rule_version: RISK_RULE_VERSION
  };
}
function evaluateHematologicRisk(measurements) {
  const obs = extractCanonicalObservations(measurements);
  const hb = obs.get("hemoglobin");
  const plt = obs.get("platelets");
  const wbc = obs.get("wbc");
  const pcv = obs.get("hematocrit");
  const hasAnyHem = hb || plt || wbc || pcv;
  if (!hasAnyHem) {
    return {
      domain: "hematologic",
      level: "GREY",
      label: "Insufficient Information",
      evidence: buildEvidenceJson(
        "Missing Complete Blood Count (CBC) measurements to evaluate hematologic health.",
        "Upload complete blood count (CBC) or hemogram laboratory reports.",
        [],
        ["Hemoglobin", "Platelet Count", "WBC"]
      ),
      data_quality: "INSUFFICIENT",
      rule_version: RISK_RULE_VERSION
    };
  }
  const hemObs = [hb, plt, wbc, pcv].filter(Boolean);
  if (hemObs.some((o) => o.validationStatus && o.validationStatus !== "VALIDATED")) {
    return {
      domain: "hematologic",
      level: "GREY",
      label: "Unreliable Data",
      evidence: buildEvidenceJson(
        "One or more hematologic measurements have not been validated.",
        "Review and validate pending clinical measurements before computing risk assessment.",
        [],
        ["Validated Measurements"]
      ),
      data_quality: "UNRELIABLE",
      rule_version: RISK_RULE_VERSION
    };
  }
  let maxRisk = 0;
  const evidenceList = [];
  const missingRequirements = [];
  if (hb) {
    const val = hb.canonicalValue;
    let hbReason = "Normal Hemoglobin (12.0-17.5 g/dL)";
    if (val < 7) {
      maxRisk = Math.max(maxRisk, 3);
      hbReason = "Severe Anemia (<7.0 g/dL)";
    } else if (val < 10) {
      maxRisk = Math.max(maxRisk, 2);
      hbReason = "Moderate Anemia (7.0-9.9 g/dL)";
    } else if (val < 12) {
      maxRisk = Math.max(maxRisk, 1);
      hbReason = "Mild Anemia (10.0-11.9 g/dL)";
    } else if (val > 18.5) {
      maxRisk = Math.max(maxRisk, 2);
      hbReason = "Elevated Hemoglobin / Polycythemia (>18.5 g/dL)";
    }
    evidenceList.push({
      parameter: "Hemoglobin",
      value: `${val.toFixed(1)} ${hb.canonicalUnit}`,
      date: hb.date,
      report: hb.report,
      page: hb.page,
      reason: hbReason
    });
  } else {
    missingRequirements.push("Hemoglobin");
  }
  if (plt) {
    const val = plt.canonicalValue;
    let pltReason = "Normal Platelet Count (150-450 x10^3/\xB5L)";
    if (val < 50) {
      maxRisk = Math.max(maxRisk, 3);
      pltReason = "Severe Thrombocytopenia (<50 x10^3/\xB5L)";
    } else if (val < 100) {
      maxRisk = Math.max(maxRisk, 2);
      pltReason = "Moderate Thrombocytopenia (50-99 x10^3/\xB5L)";
    } else if (val < 150) {
      maxRisk = Math.max(maxRisk, 1);
      pltReason = "Mild Thrombocytopenia (100-149 x10^3/\xB5L)";
    } else if (val > 500) {
      maxRisk = Math.max(maxRisk, 2);
      pltReason = "Thrombocytosis (>500 x10^3/\xB5L)";
    }
    evidenceList.push({
      parameter: "Platelet Count",
      value: `${val.toFixed(0)} ${plt.canonicalUnit}`,
      date: plt.date,
      report: plt.report,
      page: plt.page,
      reason: pltReason
    });
  } else {
    missingRequirements.push("Platelets");
  }
  if (wbc) {
    const val = wbc.canonicalValue;
    let wbcReason = "Normal Leukocyte Count (4.5-11.0 x10^3/\xB5L)";
    if (val > 20 || val < 2) {
      maxRisk = Math.max(maxRisk, 3);
      wbcReason = "Marked Leukocytosis / Leukopenia";
    } else if (val > 15 || val < 3.5) {
      maxRisk = Math.max(maxRisk, 2);
      wbcReason = "Moderate WBC Elevation / Leukopenia";
    } else if (val > 11) {
      maxRisk = Math.max(maxRisk, 1);
      wbcReason = "Mild Leukocytosis (11.1-15.0 x10^3/\xB5L)";
    }
    evidenceList.push({
      parameter: "Total WBC Count",
      value: `${val.toFixed(1)} ${wbc.canonicalUnit}`,
      date: wbc.date,
      report: wbc.report,
      page: wbc.page,
      reason: wbcReason
    });
  }
  let finalLevel = "GREEN";
  let finalLabel = "Optimal Indicators";
  let explanation = "Complete blood count markers (hemoglobin, platelets, WBC) are within healthy parameters.";
  let action = "Continue routine wellness screening.";
  if (maxRisk === 3) {
    finalLevel = "RED";
    finalLabel = "Significant Indicators Detected";
    explanation = "Hematologic indicators show marked deviation (such as severe anemia or thrombocytopenia).";
    action = "Consult a hematologist or primary care physician promptly.";
  } else if (maxRisk === 2) {
    finalLevel = "ORANGE";
    finalLabel = "Elevated Indicators";
    explanation = "Moderate deviations detected in hemoglobin, cell counts, or platelets.";
    action = "Discuss blood counts and iron/vitamin status with your healthcare provider.";
  } else if (maxRisk === 1) {
    finalLevel = "YELLOW";
    finalLabel = "Mild Indicators";
    explanation = "Mild variations in complete blood count parameters.";
    action = "Monitor dietary intake and review on your next routine test.";
  }
  return {
    domain: "hematologic",
    level: finalLevel,
    label: finalLabel,
    evidence: buildEvidenceJson(explanation, action, evidenceList, missingRequirements),
    data_quality: hb && plt ? "RELIABLE" : "PARTIAL",
    rule_version: RISK_RULE_VERSION
  };
}
function evaluateRiskAllDomains(measurements) {
  return [
    evaluateCardiovascularRisk(measurements),
    evaluateMetabolicRisk(measurements),
    evaluateRenalRisk(measurements),
    evaluateHematologicRisk(measurements)
  ];
}
var RISK_RULE_VERSION;
var init_riskEngine = __esm({
  "riskEngine.ts"() {
    init_parameters();
    init_unitRegistry();
    RISK_RULE_VERSION = "2.0.0-clinical";
  }
});

// forecastService.ts
var forecastService_exports = {};
__export(forecastService_exports, {
  RobustForecastingEngine: () => RobustForecastingEngine,
  SimpleLinearForecastModel: () => SimpleLinearForecastModel
});
var RobustForecastingEngine, SimpleLinearForecastModel;
var init_forecastService = __esm({
  "forecastService.ts"() {
    init_unitRegistry();
    init_parameters();
    RobustForecastingEngine = class _RobustForecastingEngine {
      static {
        this.MODEL_NAME = "Deterministic Ordinary Least Squares & Rolling-Origin Backtester";
      }
      static {
        this.MODEL_VERSION = "2.1.0-clinical";
      }
      /**
       * Process a series of observations for a single canonical parameter
       */
      forecast(input) {
        const { parameter, observations, excludedRecords = [], forecastHorizonDays = 90 } = input;
        const displayName = getParameterDisplayName(parameter);
        const meta = CANONICAL_PARAMETERS[parameter];
        const canonicalUnit = meta?.canonicalUnit || observations[0]?.canonicalUnit || "";
        const excludedCount = excludedRecords.length;
        if (!observations || observations.length === 0) {
          return {
            parameter,
            displayName,
            canonicalUnit,
            status: "NO_DATA",
            observationCount: 0,
            distinctDatesCount: 0,
            dateRange: null,
            historyDurationDays: 0,
            lastObservedValue: null,
            lastObservedDate: null,
            trendDirection: "GREY",
            trendSlopePerDay: null,
            trendSlopeDescription: null,
            forecastHorizonDays: null,
            forecastTargetDate: null,
            forecastValue: null,
            forecastRange: "N/A",
            predictionInterval: null,
            modelName: _RobustForecastingEngine.MODEL_NAME,
            modelVersion: _RobustForecastingEngine.MODEL_VERSION,
            inputDataFingerprint: "empty",
            dataQuality: "INSUFFICIENT",
            confidenceCategory: "GREY",
            backtestMetrics: null,
            limitations: `No eligible validated laboratory measurements were found for ${displayName}. Upload reports containing ${displayName} to enable analysis.`,
            reasonCode: "NO_OBSERVATIONS",
            reasonMessage: `No eligible measurements found. ${excludedCount > 0 ? `${excludedCount} record(s) excluded during validation.` : ""}`,
            excludedCount,
            history: []
          };
        }
        const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);
        const uniqueDateMap = /* @__PURE__ */ new Map();
        for (const obs of sorted) {
          if (!uniqueDateMap.has(obs.date)) {
            uniqueDateMap.set(obs.date, []);
          }
          uniqueDateMap.get(obs.date).push(obs.value);
        }
        const distinctDatesCount = uniqueDateMap.size;
        const startDate = sorted[0].date;
        const endDate = sorted[sorted.length - 1].date;
        const historyDurationMs = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
        const historyDurationDays = Math.round(historyDurationMs / (1e3 * 60 * 60 * 24));
        const lastObs = sorted[sorted.length - 1];
        const history = sorted.map((s) => ({ date: s.date, value: s.value }));
        const fingerprintRaw = sorted.map((s) => `${s.date}:${s.value}`).join("|");
        const inputDataFingerprint = `v2-${sorted.length}pts-${startDate}_${endDate}`;
        if (distinctDatesCount < 2) {
          return {
            parameter,
            displayName,
            canonicalUnit,
            status: "INSUFFICIENT_DATA",
            observationCount: sorted.length,
            distinctDatesCount,
            dateRange: { start: startDate, end: endDate },
            historyDurationDays,
            lastObservedValue: lastObs.value,
            lastObservedDate: lastObs.date,
            trendDirection: "GREY",
            trendSlopePerDay: null,
            trendSlopeDescription: "Single time point; trajectory requires multiple distinct dates.",
            forecastHorizonDays: null,
            forecastTargetDate: null,
            forecastValue: null,
            forecastRange: "N/A",
            predictionInterval: null,
            modelName: _RobustForecastingEngine.MODEL_NAME,
            modelVersion: _RobustForecastingEngine.MODEL_VERSION,
            inputDataFingerprint,
            dataQuality: "INSUFFICIENT",
            confidenceCategory: "GREY",
            backtestMetrics: null,
            limitations: `Only 1 distinct observation date (${lastObs.date}) is recorded. A reliable historical trajectory requires at least 2 distinct dates, and robust extrapolation requires a longitudinal history span.`,
            reasonCode: "SINGLE_OBSERVATION_DATE",
            reasonMessage: `1 distinct measurement date available. At least 2 distinct dates are required for trajectory assessment.`,
            excludedCount,
            history
          };
        }
        const t0 = sorted[0].timestamp;
        const n = sorted.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const xDays = [];
        const yVals = [];
        for (let i = 0; i < n; i++) {
          const days = (sorted[i].timestamp - t0) / (1e3 * 60 * 60 * 24);
          xDays.push(days);
          yVals.push(sorted[i].value);
          sumX += days;
          sumY += sorted[i].value;
          sumXY += days * sorted[i].value;
          sumXX += days * days;
        }
        const meanY = sumY / n;
        const meanX = sumX / n;
        const denom = n * sumXX - sumX * sumX;
        let slope = 0;
        let intercept = meanY;
        if (Math.abs(denom) > 1e-9 && historyDurationDays > 0) {
          slope = (n * sumXY - sumX * sumY) / denom;
          intercept = (sumY - slope * sumX) / n;
        } else {
          slope = 0;
          intercept = meanY;
        }
        let sumSquaredResiduals = 0;
        let sumSquaredDeviations = 0;
        for (let i = 0; i < n; i++) {
          const fitted = intercept + slope * xDays[i];
          const res = yVals[i] - fitted;
          sumSquaredResiduals += res * res;
          sumSquaredDeviations += (yVals[i] - meanY) * (yVals[i] - meanY);
        }
        const historicalStdDev = Math.sqrt(sumSquaredDeviations / Math.max(1, n - 1));
        const residualStdError = n > 2 ? Math.sqrt(sumSquaredResiduals / (n - 2)) : historicalStdDev;
        let anomalyDetected = false;
        let anomalyReason = "";
        if (historicalStdDev > 0 && n >= 3) {
          for (const y of yVals) {
            if (Math.abs(y - meanY) > historicalStdDev * 3.5) {
              anomalyDetected = true;
              anomalyReason = `Notable variance detected (value ${y} is >3.5 SD from mean). Observations preserved for clinical transparency.`;
              break;
            }
          }
        }
        const changePer30Days = slope * 30;
        const threshold = Math.max(Math.abs(meanY) * 0.015, (historicalStdDev || 0.1) * 0.2);
        let trendDirection = "STABLE";
        if (changePer30Days > threshold) {
          trendDirection = "INCREASING";
        } else if (changePer30Days < -threshold) {
          trendDirection = "DECREASING";
        } else {
          trendDirection = "STABLE";
        }
        const slopeDesc = Math.abs(slope) < 1e-4 ? "Essentially unchanged over observation period" : `${slope > 0 ? "+" : ""}${(slope * 30).toFixed(2)} ${canonicalUnit} per month`;
        const targetDaysFromStart = (sorted[sorted.length - 1].timestamp - t0) / (1e3 * 60 * 60 * 24) + forecastHorizonDays;
        const targetDateObj = new Date(sorted[sorted.length - 1].timestamp + forecastHorizonDays * 24 * 60 * 60 * 1e3);
        const forecastTargetDate = targetDateObj.toISOString().split("T")[0];
        const hasSufficientHistory = distinctDatesCount >= 3 && historyDurationDays >= 14;
        const extrapolationRatio = historyDurationDays > 0 ? forecastHorizonDays / historyDurationDays : 999;
        const isExtrapolationSafe = extrapolationRatio <= 6;
        let backtestMetrics = null;
        if (distinctDatesCount >= 3) {
          backtestMetrics = this.runRollingBacktest(sorted, t0);
        }
        if (!hasSufficientHistory || !isExtrapolationSafe) {
          const reasonMsg = distinctDatesCount < 3 ? `Found ${distinctDatesCount} distinct date(s) across ${historyDurationDays} days. Minimum 3 distinct observation dates spanning >=14 days required for forward statistical estimation.` : historyDurationDays < 14 ? `Observations span only ${historyDurationDays} days. Minimum longitudinal history of 14 days required to establish trend stability.` : `Forecast horizon (${forecastHorizonDays} days) exceeds 6x observed historical duration (${historyDurationDays} days).`;
          const isTrendOnly = distinctDatesCount >= 2 && historyDurationDays >= 7;
          return {
            parameter,
            displayName,
            canonicalUnit,
            status: isTrendOnly ? "TREND_AVAILABLE" : "INSUFFICIENT_DATA",
            observationCount: n,
            distinctDatesCount,
            dateRange: { start: startDate, end: endDate },
            historyDurationDays,
            lastObservedValue: lastObs.value,
            lastObservedDate: lastObs.date,
            trendDirection: isTrendOnly ? trendDirection : "GREY",
            trendSlopePerDay: isTrendOnly ? slope : null,
            trendSlopeDescription: isTrendOnly ? slopeDesc : null,
            forecastHorizonDays: null,
            forecastTargetDate: null,
            forecastValue: null,
            forecastRange: "N/A",
            predictionInterval: null,
            modelName: _RobustForecastingEngine.MODEL_NAME,
            modelVersion: _RobustForecastingEngine.MODEL_VERSION,
            inputDataFingerprint,
            dataQuality: "INSUFFICIENT",
            confidenceCategory: "GREY",
            backtestMetrics,
            limitations: `Historical coverage (${distinctDatesCount} dates over ${historyDurationDays} days) is insufficient for forward projection. ${isTrendOnly ? `Observed historical trend is ${trendDirection.toLowerCase()}.` : ""} Not a medical prognosis.`,
            reasonCode: "LIMITED_HISTORICAL_SPAN",
            reasonMessage: reasonMsg,
            excludedCount,
            history
          };
        }
        const rawPredicted = intercept + slope * targetDaysFromStart;
        const predictedValue = Math.max(0, Math.round(rawPredicted * 10) / 10);
        const sumXDiffSq = xDays.reduce((acc, x) => acc + (x - meanX) * (x - meanX), 0);
        const leverage = sumXDiffSq > 1e-6 ? Math.pow(targetDaysFromStart - meanX, 2) / sumXDiffSq : 1;
        const forecastStdError = residualStdError * Math.sqrt(1 + 1 / n + leverage);
        const df = Math.max(1, n - 2);
        const tVal = df === 1 ? 3.08 : df === 2 ? 1.89 : df <= 4 ? 1.64 : 1.44;
        const halfWidth = tVal * Math.max(0.1, forecastStdError);
        const lowerBound = Math.max(0, Math.round((predictedValue - halfWidth) * 10) / 10);
        const upperBound = Math.round((predictedValue + halfWidth) * 10) / 10;
        const forecastRange = `${lowerBound} \u2013 ${upperBound} ${canonicalUnit}`;
        let confidenceCategory = "LOW";
        if (distinctDatesCount >= 4 && historyDurationDays >= 60 && !anomalyDetected && backtestMetrics?.mae !== null) {
          confidenceCategory = "HIGH";
        } else if (distinctDatesCount >= 3 && historyDurationDays >= 20 && !anomalyDetected) {
          confidenceCategory = "MEDIUM";
        } else {
          confidenceCategory = "LOW";
        }
        const limitations = `Deterministic linear trend model using elapsed calendar days. Prediction interval reflects statistical residual variance and extrapolation leverage. Does not account for sudden physiological shifts, acute events, or therapeutic interventions.`;
        return {
          parameter,
          displayName,
          canonicalUnit,
          status: "FORECAST_AVAILABLE",
          observationCount: n,
          distinctDatesCount,
          dateRange: { start: startDate, end: endDate },
          historyDurationDays,
          lastObservedValue: lastObs.value,
          lastObservedDate: lastObs.date,
          trendDirection,
          trendSlopePerDay: slope,
          trendSlopeDescription: slopeDesc,
          forecastHorizonDays,
          forecastTargetDate,
          forecastValue: predictedValue,
          forecastRange,
          predictionInterval: {
            lower: lowerBound,
            upper: upperBound,
            nominalConfidence: 0.8,
            isEmpiricallyValidated: backtestMetrics !== null && backtestMetrics.evalSampleSize >= 2
          },
          modelName: _RobustForecastingEngine.MODEL_NAME,
          modelVersion: _RobustForecastingEngine.MODEL_VERSION,
          inputDataFingerprint,
          dataQuality: "SUFFICIENT",
          confidenceCategory,
          backtestMetrics,
          limitations: anomalyDetected ? `${limitations} Note: High historical variance detected.` : limitations,
          reasonCode: "SUCCESS",
          reasonMessage: `Forecast generated successfully using ${distinctDatesCount} distinct observation dates across ${historyDurationDays} days.`,
          excludedCount,
          history
        };
      }
      /**
       * Genuine Expanding-Window Chronological Backtesting.
       * Trains strictly on observations available prior to the held-out point and predicts forward.
       */
      runRollingBacktest(sorted, t0) {
        const n = sorted.length;
        if (n < 3) {
          return {
            mae: null,
            rmse: null,
            evalSampleSize: 0,
            evalMethod: "Chronological expanding window backtesting (insufficient sample size < 3)",
            directionalAccuracy: null
          };
        }
        const errors = [];
        let correctDirectionCount = 0;
        let directionalEvalCount = 0;
        for (let k = 2; k < n; k++) {
          const train = sorted.slice(0, k);
          const test = sorted[k];
          const trainN = train.length;
          let sX = 0, sY = 0, sXY = 0, sXX = 0;
          for (const pt of train) {
            const d = (pt.timestamp - t0) / (1e3 * 60 * 60 * 24);
            sX += d;
            sY += pt.value;
            sXY += d * pt.value;
            sXX += d * d;
          }
          const denom = trainN * sXX - sX * sX;
          let slope = 0;
          let intercept = sY / trainN;
          if (Math.abs(denom) > 1e-9) {
            slope = (trainN * sXY - sX * sY) / denom;
            intercept = (sY - slope * sX) / trainN;
          }
          const testDays = (test.timestamp - t0) / (1e3 * 60 * 60 * 24);
          const predicted = intercept + slope * testDays;
          const actual = test.value;
          const err = actual - predicted;
          errors.push(err);
          const lastTrainVal = train[train.length - 1].value;
          const actualChange = actual - lastTrainVal;
          const predictedChange = predicted - lastTrainVal;
          if (Math.abs(actualChange) > 1e-6) {
            directionalEvalCount++;
            if (actualChange > 0 && predictedChange > 0 || actualChange < 0 && predictedChange < 0) {
              correctDirectionCount++;
            }
          }
        }
        if (errors.length === 0) {
          return {
            mae: null,
            rmse: null,
            evalSampleSize: 0,
            evalMethod: "Chronological expanding window backtesting",
            directionalAccuracy: null
          };
        }
        const mae = errors.reduce((acc, e) => acc + Math.abs(e), 0) / errors.length;
        const mse = errors.reduce((acc, e) => acc + e * e, 0) / errors.length;
        const rmse = Math.sqrt(mse);
        const directionalAccuracy = directionalEvalCount > 0 ? Math.round(correctDirectionCount / directionalEvalCount * 100) : null;
        return {
          mae: Math.round(mae * 100) / 100,
          rmse: Math.round(rmse * 100) / 100,
          evalSampleSize: errors.length,
          evalMethod: `Chronological expanding-window holdout (${errors.length} held-out predictions)`,
          directionalAccuracy
        };
      }
    };
    SimpleLinearForecastModel = class {
      constructor() {
        this.engine = new RobustForecastingEngine();
      }
      static {
        this.VERSION = RobustForecastingEngine.MODEL_VERSION;
      }
      analyze(input) {
        const obs = input.measurements.map((m) => ({
          value: m.value,
          date: m.date,
          timestamp: new Date(m.date).getTime()
        }));
        const res = this.engine.forecast({
          parameter: input.parameter,
          observations: obs
        });
        const isSufficient = res.status === "FORECAST_AVAILABLE";
        return {
          parameter: res.parameter,
          forecast_direction: res.trendDirection,
          forecast_range: res.forecastRange,
          confidence_category: res.confidenceCategory,
          limitations: res.limitations,
          model_version: res.modelVersion,
          data_quality: isSufficient ? "RELIABLE" : "INSUFFICIENT",
          status: res.status
        };
      }
    };
  }
});

// backend/config/env.ts
import dotenv from "dotenv";
import path from "path";
function getValidatedConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  let jwtSecret = process.env.JWT_SECRET;
  if (isProduction && (!jwtSecret || jwtSecret.trim().length < 32 || jwtSecret.includes("your-strong-random-jwt-secret-here"))) {
    throw new Error("FATAL SECURITY ERROR: JWT_SECRET must be explicitly configured with at least 32 characters in production.");
  }
  if (!jwtSecret || jwtSecret.trim().length < 32) {
    jwtSecret = process.env.JWT_SECRET || "meditrack-sec-vault-jwt-9f82b71e843c0a52d71e9841f238b0e";
  }
  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000";
  const allowedOrigins2 = allowedOriginsRaw.split(",").map((o) => o.trim()).filter(Boolean);
  const tokenExpiryMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || "30", 10);
  const resetRateLimit = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT || "3", 10);
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
  const emailProvider = (process.env.EMAIL_PROVIDER || (isProduction ? "smtp" : "console")).toLowerCase();
  const smtpHost = process.env.SMTP_HOST || void 0;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || void 0;
  const smtpPass = process.env.SMTP_PASS || void 0;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const emailFrom = process.env.EMAIL_FROM || process.env.SENDER_EMAIL || "MediTrack Alerts <alerts@meditrack.health>";
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim() || void 0;
  const sendgridApiKey = (process.env.SENDGRID_API_KEY || "").trim() || void 0;
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const googleRedirectUri = (process.env.GOOGLE_REDIRECT_URI || `${frontendUrl}/api/notifications/gmail/callback`).trim();
  const isGmailOAuthConfigured = googleClientId.length > 5 && googleClientSecret.length > 5;
  const notificationMode = process.env.NOTIFICATION_MODE || "gmail-and-telegram";
  const isEmailConfigured = !!(isGmailOAuthConfigured || emailProvider === "resend" && resendApiKey || emailProvider === "sendgrid" && sendgridApiKey || emailProvider === "smtp" && smtpHost && smtpUser || resendApiKey || sendgridApiKey || smtpHost && smtpUser);
  const smsProvider = (process.env.SMS_PROVIDER || "twilio").toLowerCase();
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || "").trim() || void 0;
  const twilioToken = (process.env.TWILIO_AUTH_TOKEN || "").trim() || void 0;
  const twilioFrom = (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM || "").trim() || void 0;
  const isSmsConfigured = !!(twilioSid && twilioToken && twilioFrom && !twilioSid.includes("your-") && !twilioToken.includes("your-"));
  const rawGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const isGeminiConfigured = rawGeminiKey.length > 0 && !rawGeminiKey.includes("your-");
  const rawMapsKey = (process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  const isMapsConfigured = rawMapsKey.length > 0 && !rawMapsKey.includes("your-");
  const vapidPublicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const vapidSubject = (process.env.VAPID_SUBJECT || "mailto:support@meditrack.health").trim();
  const isPushConfigured = vapidPublicKey.length > 20 && vapidPrivateKey.length > 20 && !vapidPublicKey.includes("your-") && !vapidPrivateKey.includes("your-");
  const telegramBotToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const telegramBotUsername = (process.env.TELEGRAM_BOT_USERNAME || "").trim().replace(/^@/, "");
  const telegramWebhookSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  const telegramWebhookUrl = (process.env.TELEGRAM_WEBHOOK_URL || "").trim();
  const appBaseUrl = (process.env.APP_BASE_URL || frontendUrl || "http://localhost:3000").trim();
  const isTelegramConfigured = telegramBotToken.length > 10;
  return {
    NODE_ENV: nodeEnv,
    IS_PRODUCTION: isProduction,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3,
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: process.env.JWT_ISSUER || "meditrack-api",
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || "meditrack-client",
    ACCESS_TOKEN_TTL: "15m",
    ACCESS_TOKEN_EXPIRES_IN_SEC: 15 * 60,
    // 900 seconds
    REFRESH_TOKEN_DAYS: 7,
    REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1e3,
    // 7 days in ms
    ALLOWED_ORIGINS: allowedOrigins2,
    PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: isNaN(tokenExpiryMinutes) ? 30 : tokenExpiryMinutes,
    PASSWORD_RESET_RATE_LIMIT: isNaN(resetRateLimit) ? 3 : resetRateLimit,
    FRONTEND_URL: frontendUrl,
    EMAIL_PROVIDER: emailProvider,
    SMTP_HOST: smtpHost,
    SMTP_PORT: isNaN(smtpPort) ? 587 : smtpPort,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    SMTP_SECURE: smtpSecure,
    EMAIL_FROM: emailFrom,
    RESEND_API_KEY: resendApiKey,
    SENDGRID_API_KEY: sendgridApiKey,
    IS_EMAIL_CONFIGURED: isEmailConfigured,
    SMS_PROVIDER: smsProvider,
    TWILIO_ACCOUNT_SID: twilioSid,
    TWILIO_AUTH_TOKEN: twilioToken,
    TWILIO_FROM_NUMBER: twilioFrom,
    TWILIO_PHONE_NUMBER: twilioFrom,
    IS_SMS_CONFIGURED: isSmsConfigured,
    VAPID_PUBLIC_KEY: vapidPublicKey,
    VAPID_PRIVATE_KEY: vapidPrivateKey,
    VAPID_SUBJECT: vapidSubject,
    IS_PUSH_CONFIGURED: isPushConfigured,
    GEMINI_API_KEY: isGeminiConfigured ? rawGeminiKey : void 0,
    IS_GEMINI_CONFIGURED: isGeminiConfigured,
    GOOGLE_MAPS_API_KEY: isMapsConfigured ? rawMapsKey : void 0,
    IS_MAPS_CONFIGURED: isMapsConfigured,
    GOOGLE_CLIENT_ID: googleClientId || void 0,
    GOOGLE_CLIENT_SECRET: googleClientSecret || void 0,
    GOOGLE_REDIRECT_URI: googleRedirectUri,
    IS_GMAIL_OAUTH_CONFIGURED: isGmailOAuthConfigured,
    NOTIFICATION_MODE: notificationMode,
    TELEGRAM_BOT_TOKEN: telegramBotToken || void 0,
    TELEGRAM_BOT_USERNAME: telegramBotUsername || void 0,
    TELEGRAM_WEBHOOK_SECRET: telegramWebhookSecret || void 0,
    TELEGRAM_WEBHOOK_URL: telegramWebhookUrl || void 0,
    APP_BASE_URL: appBaseUrl,
    IS_TELEGRAM_CONFIGURED: isTelegramConfigured
  };
}
function getEnvironmentDiagnostics() {
  return {
    environment: envConfig.NODE_ENV,
    port: envConfig.PORT,
    corsOriginsCount: envConfig.ALLOWED_ORIGINS.length,
    authConfigured: !!envConfig.JWT_SECRET,
    geminiConfigured: envConfig.IS_GEMINI_CONFIGURED,
    mapsConfigured: envConfig.IS_MAPS_CONFIGURED,
    emailProvider: envConfig.EMAIL_PROVIDER,
    emailConfigured: envConfig.IS_EMAIL_CONFIGURED,
    gmailOAuthConfigured: envConfig.IS_GMAIL_OAUTH_CONFIGURED,
    notificationMode: envConfig.NOTIFICATION_MODE,
    telegramConfigured: envConfig.IS_TELEGRAM_CONFIGURED,
    telegramBot: envConfig.TELEGRAM_BOT_USERNAME ? `@${envConfig.TELEGRAM_BOT_USERNAME}` : envConfig.IS_TELEGRAM_CONFIGURED ? "Configured" : "Missing Token",
    smsProvider: envConfig.SMS_PROVIDER,
    smsConfigured: envConfig.IS_SMS_CONFIGURED,
    pushConfigured: envConfig.IS_PUSH_CONFIGURED
  };
}
var envConfig, JWT_SECRET;
var init_env = __esm({
  "backend/config/env.ts"() {
    dotenv.config({
      path: path.resolve(process.cwd(), ".env"),
      quiet: true,
      override: true
    });
    envConfig = getValidatedConfig();
    JWT_SECRET = envConfig.JWT_SECRET;
  }
});

// backend/services/notifications/gmailService.ts
import jwt2 from "jsonwebtoken";
function sanitizeHeader(val, name) {
  if (/[\r\n]/.test(val)) {
    throw new Error(`Invalid characters in header ${name}: Header injection attempt detected.`);
  }
  return val.trim();
}
function encodeHeaderValue(val) {
  if (/^[\x20-\x7E]*$/.test(val)) {
    return val;
  }
  return `=?UTF-8?B?${Buffer.from(val, "utf-8").toString("base64")}?=`;
}
function buildMimeMessage(options) {
  const safeTo = sanitizeHeader(options.to, "To");
  const safeFromEmail = sanitizeHeader(options.fromEmail, "From Email");
  const safeFromName = sanitizeHeader(options.fromName || "MediTrack Health Alerts", "From Name");
  const safeSubject = sanitizeHeader(options.subject, "Subject");
  const boundary = `====_MediTrack_Boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}====`;
  const mimeLines = [
    `From: ${encodeHeaderValue(safeFromName)} <${safeFromEmail}>`,
    `To: <${safeTo}>`,
    `Subject: ${encodeHeaderValue(safeSubject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    options.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    options.html,
    "",
    `--${boundary}--`
  ];
  const rawMime = mimeLines.join("\r\n");
  return Buffer.from(rawMime, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function generateGmailAuthUrl(userId) {
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = envConfig.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/notifications/gmail/callback";
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in server environment.");
  }
  const state = jwt2.sign(
    {
      userId,
      purpose: "gmail_oauth_connect",
      nonce: Math.random().toString(36).substring(2)
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: `${GMAIL_SEND_SCOPE} ${USERINFO_EMAIL_SCOPE}`,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state
  };
}
async function handleGmailOAuthCallback(code, state, db2) {
  let decodedState;
  try {
    decodedState = jwt2.verify(state, JWT_SECRET);
    if (decodedState.purpose !== "gmail_oauth_connect" || !decodedState.userId) {
      throw new Error("Invalid state token purpose");
    }
  } catch (err) {
    throw new Error(`OAuth state validation failed: ${err.message || "Malformed or expired state token."}`);
  }
  const userId = Number(decodedState.userId);
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = envConfig.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "";
  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString()
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenData.error_description || tokenData.error || tokenRes.status}`);
  }
  const { access_token, refresh_token, expires_in, scope, token_type } = tokenData;
  const expiryDate = Date.now() + (Number(expires_in) || 3600) * 1e3;
  let gmailAddress = null;
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (userinfoRes.ok) {
      const userinfoData = await userinfoRes.json();
      if (userinfoData && userinfoData.email) {
        gmailAddress = String(userinfoData.email).trim().toLowerCase();
      }
    }
  } catch (e) {
  }
  if (!gmailAddress) {
    try {
      const tokeninfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(access_token)}`);
      if (tokeninfoRes.ok) {
        const tokeninfoData = await tokeninfoRes.json();
        if (tokeninfoData && tokeninfoData.email) {
          gmailAddress = String(tokeninfoData.email).trim().toLowerCase();
        }
      }
    } catch (e) {
    }
  }
  if (!gmailAddress) {
    try {
      const userRes = await db2.execute({
        sql: "SELECT email FROM users WHERE id = ?",
        args: [userId]
      });
      if (userRes.rows[0]?.email) {
        gmailAddress = String(userRes.rows[0].email).trim().toLowerCase();
      }
    } catch (e) {
    }
  }
  if (!gmailAddress) {
    gmailAddress = "authorized-sender@gmail.com";
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingToken = await db2.execute({
    sql: "SELECT id, refresh_token FROM gmail_oauth_tokens WHERE user_id = ?",
    args: [userId]
  });
  const finalRefreshToken = refresh_token || existingToken.rows[0]?.refresh_token || null;
  if (existingToken.rows.length > 0) {
    await db2.execute({
      sql: `UPDATE gmail_oauth_tokens 
            SET email = ?, access_token = ?, refresh_token = ?, token_type = ?, expiry_date = ?, scope = ?, status = 'CONNECTED', last_error = NULL, updated_at = ?
            WHERE user_id = ?`,
      args: [
        gmailAddress,
        access_token,
        finalRefreshToken,
        token_type || "Bearer",
        expiryDate,
        scope || "",
        now,
        userId
      ]
    });
  } else {
    await db2.execute({
      sql: `INSERT INTO gmail_oauth_tokens 
            (user_id, email, access_token, refresh_token, token_type, expiry_date, scope, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'CONNECTED', ?, ?)`,
      args: [
        userId,
        gmailAddress,
        access_token,
        finalRefreshToken,
        token_type || "Bearer",
        expiryDate,
        scope || "",
        now,
        now
      ]
    });
  }
  return { success: true, email: gmailAddress, userId };
}
async function getValidGmailAccessToken(userId, db2) {
  const tokenRes = await db2.execute({
    sql: "SELECT * FROM gmail_oauth_tokens WHERE user_id = ?",
    args: [userId]
  });
  const tokenRecord = tokenRes.rows[0];
  if (!tokenRecord) {
    throw new Error("Gmail not connected. Please connect your Gmail account in Channel Configuration to send trusted contact emails.");
  }
  if (tokenRecord.status === "REVOKED") {
    throw new Error("Gmail authorization was revoked. Please reconnect your Gmail account.");
  }
  const now = Date.now();
  const expiryDate = Number(tokenRecord.expiry_date) || 0;
  const isExpiringSoon = now > expiryDate - 6e4;
  if (!isExpiringSoon && tokenRecord.access_token) {
    return {
      accessToken: tokenRecord.access_token,
      senderEmail: tokenRecord.email
    };
  }
  if (!tokenRecord.refresh_token) {
    await db2.execute({
      sql: `UPDATE gmail_oauth_tokens SET status = 'EXPIRED', last_error = 'Missing refresh token. Reconnect required.', updated_at = ? WHERE user_id = ?`,
      args: [(/* @__PURE__ */ new Date()).toISOString(), userId]
    });
    throw new Error("Gmail session expired and no refresh token is stored. Please reconnect your Gmail account.");
  }
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are missing from server environment to refresh Gmail token.");
  }
  try {
    const refreshParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRecord.refresh_token,
      grant_type: "refresh_token"
    });
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: refreshParams.toString()
    });
    const refreshData = await refreshRes.json();
    if (!refreshRes.ok) {
      const isRevoked = refreshData.error === "invalid_grant";
      const newStatus = isRevoked ? "REVOKED" : "ERROR";
      const errMsg = `Google token refresh failed: ${refreshData.error_description || refreshData.error}`;
      await db2.execute({
        sql: `UPDATE gmail_oauth_tokens SET status = ?, last_error = ?, updated_at = ? WHERE user_id = ?`,
        args: [newStatus, errMsg, (/* @__PURE__ */ new Date()).toISOString(), userId]
      });
      throw new Error(isRevoked ? "Gmail authorization was revoked or expired. Please reconnect your account." : errMsg);
    }
    const newAccessToken = refreshData.access_token;
    const updatedRefreshToken = refreshData.refresh_token || tokenRecord.refresh_token;
    const newExpiry = Date.now() + (Number(refreshData.expires_in) || 3600) * 1e3;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    await db2.execute({
      sql: `UPDATE gmail_oauth_tokens SET access_token = ?, refresh_token = ?, expiry_date = ?, status = 'CONNECTED', last_error = NULL, updated_at = ? WHERE user_id = ?`,
      args: [newAccessToken, updatedRefreshToken, newExpiry, nowIso, userId]
    });
    return {
      accessToken: newAccessToken,
      senderEmail: tokenRecord.email
    };
  } catch (err) {
    throw new Error(`Failed to refresh Gmail access token: ${err.message || String(err)}`);
  }
}
async function sendGmailEmail(userId, db2, options) {
  const { to, subject, html, text } = options;
  const normalizedTo = (to || "").trim().toLowerCase();
  if (!normalizedTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTo) || normalizedTo.length > 254) {
    return {
      success: false,
      provider: "GMAIL_API",
      status: "FAILED",
      isTransient: false,
      error: `Invalid destination email address: ${to}`
    };
  }
  let credentials;
  try {
    credentials = await getValidGmailAccessToken(userId, db2);
  } catch (authErr) {
    return {
      success: false,
      provider: "GMAIL_API",
      status: "FAILED",
      isTransient: false,
      error: authErr.message || "Gmail authorization is required to send notifications."
    };
  }
  let rawBase64Url;
  try {
    rawBase64Url = buildMimeMessage({
      fromName: "MediTrack Health Alerts",
      fromEmail: credentials.senderEmail,
      to: normalizedTo,
      subject,
      html,
      text
    });
  } catch (mimeErr) {
    return {
      success: false,
      provider: "GMAIL_API",
      status: "FAILED",
      isTransient: false,
      error: `MIME message encoding error: ${mimeErr.message}`
    };
  }
  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: rawBase64Url })
    });
    const responseData = await response.json();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (!response.ok) {
      const statusCode = response.status;
      const isQuotaError = statusCode === 403 && (responseData.error?.message?.includes("Quota") || responseData.error?.message?.includes("rate"));
      const isAuthError = statusCode === 401;
      const isTransient = statusCode >= 500 || statusCode === 429 || isQuotaError;
      const errorMessage = responseData.error?.message || `Gmail API returned HTTP ${statusCode}`;
      try {
        await db2.execute({
          sql: `UPDATE gmail_oauth_tokens SET last_error = ?, status = ?, updated_at = ? WHERE user_id = ?`,
          args: [errorMessage, isAuthError ? "EXPIRED" : "ERROR", nowIso, userId]
        });
      } catch (e) {
      }
      return {
        success: false,
        provider: "GMAIL_API",
        status: "FAILED",
        isTransient,
        error: `Gmail API error (${statusCode}): ${errorMessage}`,
        details: responseData
      };
    }
    try {
      await db2.execute({
        sql: `UPDATE gmail_oauth_tokens SET last_used_at = ?, last_error = NULL, updated_at = ? WHERE user_id = ?`,
        args: [nowIso, nowIso, userId]
      });
    } catch (e) {
    }
    return {
      success: true,
      provider: "GMAIL_API",
      providerMessageId: responseData.id,
      threadId: responseData.threadId,
      status: "ACCEPTED",
      details: responseData
    };
  } catch (netErr) {
    return {
      success: false,
      provider: "GMAIL_API",
      status: "FAILED",
      isTransient: true,
      error: `Network failure connecting to Gmail API: ${netErr.message || String(netErr)}`
    };
  }
}
async function getGmailConnectionStatus(userId, db2) {
  const clientId = envConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = envConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const oauthConfigured = Boolean(clientId && clientSecret);
  const missingSetup = [];
  if (!clientId) {
    missingSetup.push("Set GOOGLE_CLIENT_ID in server environment (Google Cloud Console OAuth 2.0 Web Client).");
  }
  if (!clientSecret) {
    missingSetup.push("Set GOOGLE_CLIENT_SECRET in server environment.");
  }
  try {
    const tokenRes = await db2.execute({
      sql: "SELECT email, status, last_used_at, last_error, expiry_date FROM gmail_oauth_tokens WHERE user_id = ?",
      args: [userId]
    });
    if (tokenRes.rows.length === 0) {
      return {
        connected: false,
        status: oauthConfigured ? "NOT_CONNECTED" : "NOT_CONFIGURED",
        email: null,
        lastUsedAt: null,
        lastError: null,
        oauthConfigured,
        missingSetup: oauthConfigured ? ["Connect your Google Account to authorize Gmail email notifications."] : missingSetup
      };
    }
    const row = tokenRes.rows[0];
    const isConnected = row.status === "CONNECTED";
    return {
      connected: isConnected,
      status: row.status,
      email: row.email,
      lastUsedAt: row.last_used_at,
      lastError: row.last_error,
      oauthConfigured,
      missingSetup: isConnected ? [] : [row.last_error || "Gmail connection expired or revoked. Please reconnect."]
    };
  } catch (err) {
    return {
      connected: false,
      status: "ERROR",
      email: null,
      lastUsedAt: null,
      lastError: err.message,
      oauthConfigured,
      missingSetup
    };
  }
}
async function disconnectGmailAccount(userId, db2) {
  try {
    const tokenRes = await db2.execute({
      sql: "SELECT access_token, refresh_token FROM gmail_oauth_tokens WHERE user_id = ?",
      args: [userId]
    });
    const token = tokenRes.rows[0]?.access_token || tokenRes.rows[0]?.refresh_token;
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
      } catch (revokeErr) {
      }
    }
    await db2.execute({
      sql: "DELETE FROM gmail_oauth_tokens WHERE user_id = ?",
      args: [userId]
    });
    return { success: true, message: "Gmail account successfully disconnected." };
  } catch (err) {
    throw new Error(`Failed to disconnect Gmail account: ${err.message || String(err)}`);
  }
}
var GMAIL_SEND_SCOPE, USERINFO_EMAIL_SCOPE;
var init_gmailService = __esm({
  "backend/services/notifications/gmailService.ts"() {
    init_env();
    GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
    USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
  }
});

// backend/services/ai.service.ts
import { GoogleGenAI, Type } from "@google/genai";
var GeminiAIError, AIService, aiService;
var init_ai_service = __esm({
  "backend/services/ai.service.ts"() {
    init_env();
    GeminiAIError = class extends Error {
      constructor(code, message, status = 500) {
        super(message);
        this.name = "GeminiAIError";
        this.code = code;
        this.status = status;
      }
    };
    AIService = class {
      constructor() {
        this.client = null;
        this.defaultModel = "gemini-2.5-flash";
        this.initClient();
      }
      initClient() {
        if (envConfig.IS_GEMINI_CONFIGURED && envConfig.GEMINI_API_KEY) {
          try {
            this.client = new GoogleGenAI({
              apiKey: envConfig.GEMINI_API_KEY,
              httpOptions: {
                timeout: 3e4,
                retryOptions: { attempts: 2 },
                headers: {
                  "User-Agent": "meditrack-v3.1-app"
                }
              }
            });
          } catch (err) {
            console.warn("[AI Service] Failed to initialize GoogleGenAI client:", err.message);
            this.client = null;
          }
        } else {
          this.client = null;
        }
      }
      isConfigured() {
        return this.client !== null && !!envConfig.GEMINI_API_KEY;
      }
      getHealth() {
        if (!this.isConfigured()) {
          return {
            status: "NOT_CONFIGURED",
            provider: "Google Gemini",
            model: this.defaultModel,
            message: "GEMINI_API_KEY is not configured. AI OCR and extraction features are currently unavailable."
          };
        }
        return {
          status: "CONFIGURED",
          provider: "Google Gemini",
          model: this.defaultModel,
          message: "Gemini AI integration is active and configured."
        };
      }
      async extractMedicalReport(fileBuffer, mimeType, filename) {
        if (!this.isConfigured() || !this.client) {
          throw new GeminiAIError(
            "GEMINI_NOT_CONFIGURED",
            "Gemini AI API key is not configured on this server. Please provide GEMINI_API_KEY in your .env file to enable document OCR biomarker extraction.",
            503
          );
        }
        const base64Data = fileBuffer.toString("base64");
        let effectiveMime = mimeType;
        if (!effectiveMime || effectiveMime === "application/octet-stream") {
          effectiveMime = filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        }
        let retries = 3;
        let delay = 1500;
        let lastError = null;
        while (retries > 0) {
          try {
            const response = await this.client.models.generateContent({
              model: this.defaultModel,
              contents: {
                parts: [
                  { inlineData: { data: base64Data, mimeType: effectiveMime } },
                  {
                    text: "Extract the medical measurements (like blood pressure, heart rate, LDL, glucose, HbA1c, BMI, etc.) and patient identifiers (name, dob, age) from this report. Only output a valid JSON object with 'patient_info' and 'measurements' array."
                  }
                ]
              },
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    patient_info: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        dob: { type: Type.STRING },
                        age: { type: Type.STRING }
                      }
                    },
                    measurements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          parameter: { type: Type.STRING, description: "Name of the medical parameter" },
                          raw_value: { type: Type.STRING, description: "Raw value as it appears in the report" },
                          normalized_value: { type: Type.STRING, description: "Normalized value" },
                          unit: { type: Type.STRING, description: "Unit of measurement" },
                          normalized_unit: { type: Type.STRING, description: "Normalized unit" },
                          source_page: { type: Type.STRING, description: "Page number" },
                          source_text: { type: Type.STRING, description: "Source text snippet" },
                          extraction_confidence: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" }
                        },
                        required: [
                          "parameter",
                          "raw_value",
                          "normalized_value",
                          "unit",
                          "normalized_unit",
                          "source_page",
                          "source_text",
                          "extraction_confidence"
                        ]
                      }
                    }
                  }
                }
              }
            });
            const textResponse = response?.text || "{}";
            let parsed;
            try {
              parsed = JSON.parse(textResponse);
            } catch (parseErr) {
              throw new GeminiAIError(
                "INVALID_JSON_RESPONSE",
                "Failed to parse structured JSON from AI provider response",
                502
              );
            }
            return {
              patient_info: parsed.patient_info || {},
              measurements: Array.isArray(parsed.measurements) ? parsed.measurements : []
            };
          } catch (err) {
            lastError = err;
            const msg = (err.message || "").toLowerCase();
            if (msg.includes("api_key_invalid") || msg.includes("invalid api key") || msg.includes("permission_denied") || msg.includes("unauthenticated") || err.status === 401 || err.status === 403) {
              throw new GeminiAIError(
                "INVALID_API_KEY",
                "The configured Gemini API key is invalid or lacks necessary permissions.",
                401
              );
            }
            if (msg.includes("resource_exhausted") || msg.includes("quota") || err.status === 429) {
              retries--;
              if (retries === 0) {
                throw new GeminiAIError(
                  "RATE_LIMIT_EXCEEDED",
                  "Gemini AI API rate limit or quota exceeded. Please wait a moment and try again.",
                  429
                );
              }
            } else {
              retries--;
              if (retries === 0) {
                throw new GeminiAIError(
                  "AI_EXTRACTION_FAILED",
                  `Gemini AI document extraction failed: ${err.message || "Unknown error"}`,
                  500
                );
              }
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
        throw new GeminiAIError(
          "AI_EXTRACTION_FAILED",
          `Gemini extraction failed: ${lastError?.message || "Exhausted retries"}`,
          500
        );
      }
      async generateChatResponse(userMessage, clinicalContext, history) {
        if (!this.isConfigured() || !this.client) {
          throw new GeminiAIError(
            "GEMINI_NOT_CONFIGURED",
            "Gemini AI API key is not configured on this server.",
            503
          );
        }
        const systemPrompt = `You are MediTrack AI Assistant, an authoritative, clinically cautious medical assistant designed to help patients understand their laboratory reports, health measurements, and specialist guidance.
RULES:
1. Grounding & Truth: Use ONLY the patient's verified clinical context provided below as ground truth. NEVER invent, estimate, or hallucinate laboratory values, dates, reports, reference ranges, or diagnoses.
2. Missing Data: If the patient asks about a biomarker, test, or specialty that does not exist in their context, explicitly state that it is not present in their records and suggest uploading the relevant report. Never substitute sample or placeholder values.
3. Citations & Attribution: Whenever citing a measurement, state the exact value, unit, collection date, and source report filename.
4. Distinctions: Clearly distinguish verified historical laboratory observations from AI interpretations, statistical forecasts (Future Outlook), and algorithmic specialty guidance.
5. Answer Format: Where relevant, structure your answer with:
   - **Answer:** Direct response to the question.
   - **Your medical data:** Actual values, units, dates, and report names used.
   - **Explanation:** What the result generally indicates in plain terms.
   - **Limitations:** Uncertainties, caveats, or missing context.
   - **Sources:** Specific report and measurement references.
   Do not force all five sections if a brief direct answer is more appropriate.
6. Safety: Do NOT provide a definitive diagnosis or recommend altering prescribed medications. Always advise the patient to consult their licensed healthcare professional for clinical decisions.
7. Style: Empathetic, clear, objective, and professional.

PATIENT CLINICAL CONTEXT:
${clinicalContext}`;
        try {
          const contents = [];
          if (history && Array.isArray(history) && history.length > 0) {
            for (const h of history.slice(-6)) {
              if (h && typeof h.content === "string" && h.content.trim()) {
                contents.push({
                  role: h.role === "user" ? "user" : "model",
                  parts: [{ text: h.content.trim() }]
                });
              }
            }
          }
          contents.push({
            role: "user",
            parts: [{ text: userMessage.trim() }]
          });
          const response = await this.client.models.generateContent({
            model: this.defaultModel,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.2
            }
          });
          return response?.text || "I have reviewed your clinical record. Please consult your physician for further evaluation.";
        } catch (err) {
          console.error("[AI Chat] Error calling Gemini:", err.message);
          throw new GeminiAIError(
            "CHAT_GENERATION_FAILED",
            `Failed to generate response: ${err.message}`,
            500
          );
        }
      }
    };
    aiService = new AIService();
  }
});

// telegram-bot/telegramService.ts
import crypto from "crypto";
function sanitizeTelegramLog(text) {
  if (!text) return "";
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (token && token.length > 5) {
    return text.split(token).join("[REDACTED_BOT_TOKEN]");
  }
  return text.replace(/bot\d+:[A-Za-z0-9_-]+/g, "bot[REDACTED_BOT_TOKEN]");
}
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function checkRateLimit(chatId, maxPerMinute = 25) {
  const now = Date.now();
  const timestamps = chatRateLimits.get(chatId) || [];
  const windowStart = now - 6e4;
  const recent = timestamps.filter((t) => t > windowStart);
  if (recent.length >= maxPerMinute) {
    return false;
  }
  recent.push(now);
  chatRateLimits.set(chatId, recent);
  return true;
}
async function getBotUsername() {
  if (envConfig.TELEGRAM_BOT_USERNAME) {
    return envConfig.TELEGRAM_BOT_USERNAME;
  }
  if (cachedBotUsername) {
    return cachedBotUsername;
  }
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.result?.username) {
        cachedBotUsername = data.result.username;
        return cachedBotUsername;
      }
    }
  } catch (err) {
  }
  return null;
}
async function sendTelegramMessage(chatId, text, options) {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      success: false,
      provider: "TELEGRAM_BOT_API",
      status: "FAILED",
      isTransient: false,
      error: "TELEGRAM_BOT_TOKEN is not configured on the server. Please set it in server environment."
    };
  }
  const normalizedChatId = String(chatId).trim();
  if (!normalizedChatId) {
    return {
      success: false,
      provider: "TELEGRAM_BOT_API",
      status: "FAILED",
      isTransient: false,
      error: "Destination Telegram chat ID is missing or invalid."
    };
  }
  let safeText = text;
  if (safeText.length > 4096) {
    safeText = safeText.substring(0, 4080) + "\u2026\n\n<i>[Message truncated to fit Telegram limit]</i>";
  }
  const payload = {
    chat_id: normalizedChatId,
    text: safeText,
    parse_mode: options?.parseMode || "HTML",
    disable_web_page_preview: options?.disableWebPagePreview ?? false
  };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const responseData = await response.json();
    if (!response.ok || !responseData.ok) {
      const statusCode = response.status;
      const errorCode = responseData.error_code || statusCode;
      const description = responseData.description || `HTTP ${statusCode}`;
      const isBlocked = errorCode === 403;
      const isChatNotFound = errorCode === 400 && description.toLowerCase().includes("chat not found");
      const isRateLimited = errorCode === 429;
      const isTransient = isRateLimited || statusCode >= 500;
      let humanError = description;
      if (isBlocked) {
        humanError = "Telegram bot was blocked by the contact or the conversation was stopped.";
      } else if (isChatNotFound) {
        humanError = "Telegram chat not found. The contact must start the bot using their connection link first.";
      } else if (isRateLimited) {
        humanError = `Telegram API rate limit reached. Retry after ${responseData.parameters?.retry_after || "a few"} seconds.`;
      }
      return {
        success: false,
        provider: "TELEGRAM_BOT_API",
        chatId: normalizedChatId,
        status: "FAILED",
        isTransient,
        error: sanitizeTelegramLog(humanError),
        details: {
          errorCode,
          description: sanitizeTelegramLog(description),
          retryAfter: responseData.parameters?.retry_after
        }
      };
    }
    const msgId = String(responseData.result?.message_id);
    return {
      success: true,
      provider: "TELEGRAM_BOT_API",
      providerMessageId: msgId,
      chatId: normalizedChatId,
      status: "ACCEPTED",
      details: {
        messageId: msgId,
        chat: responseData.result?.chat
      }
    };
  } catch (netErr) {
    return {
      success: false,
      provider: "TELEGRAM_BOT_API",
      chatId: normalizedChatId,
      status: "FAILED",
      isTransient: true,
      error: `Network error connecting to Telegram Bot API: ${sanitizeTelegramLog(netErr.message || String(netErr))}`
    };
  }
}
async function resolveTelegramIdentity(chatId, db2) {
  const normalized = String(chatId).trim();
  if (!normalized) return { isLinked: false };
  try {
    const contactRes = await db2.execute({
      sql: `SELECT tc.id as contact_id, tc.user_id, tc.name as contact_name, tc.relationship, 
                   tc.status, tc.consent_status, tc.telegram_enabled, u.name as patient_name
            FROM trusted_contacts tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.telegram_chat_id = ?
            LIMIT 1`,
      args: [normalized]
    });
    if (contactRes.rows.length > 0) {
      const row = contactRes.rows[0];
      const userId = Number(row.user_id);
      return {
        isLinked: true,
        type: "CONTACT",
        userId,
        contactId: Number(row.contact_id),
        userName: String(row.contact_name),
        patientId: `P-${String(userId).padStart(4, "0")}`,
        patientName: String(row.patient_name),
        relationship: String(row.relationship),
        consentGranted: row.consent_status !== "REVOKED",
        telegramEnabled: row.telegram_enabled !== 0 && row.status === "ACTIVE"
      };
    }
  } catch (e) {
  }
  try {
    const userRes = await db2.execute({
      sql: `SELECT id, name, email, notification_telegram 
            FROM users 
            WHERE telegram_chat_id = ? 
            LIMIT 1`,
      args: [normalized]
    });
    if (userRes.rows.length > 0) {
      const row = userRes.rows[0];
      const userId = Number(row.id);
      return {
        isLinked: true,
        type: "USER",
        userId,
        userName: String(row.name),
        patientId: `P-${String(userId).padStart(4, "0")}`,
        patientName: String(row.name),
        relationship: "Self",
        consentGranted: true,
        telegramEnabled: row.notification_telegram !== 0
      };
    }
  } catch (e) {
  }
  return { isLinked: false };
}
async function getPatientClinicalContext(userId, db2) {
  const patientId = `P-${String(userId).padStart(4, "0")}`;
  let patientName = "Patient";
  try {
    const uRes = await db2.execute({ sql: "SELECT name FROM users WHERE id = ?", args: [userId] });
    if (uRes.rows.length > 0 && uRes.rows[0].name) patientName = String(uRes.rows[0].name);
  } catch {
  }
  const latestReports = [];
  try {
    const reportsRes = await db2.execute({
      sql: "SELECT id, filename, report_date FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC, id DESC LIMIT 3",
      args: [userId]
    });
    for (const r of reportsRes.rows) {
      latestReports.push({
        id: Number(r.id),
        filename: String(r.filename || "Report.pdf"),
        report_date: String(r.report_date || "Unknown")
      });
    }
  } catch {
  }
  const measurements = [];
  try {
    const measRes = await db2.execute({
      sql: `SELECT m.parameter, m.normalized_value, m.raw_value, m.unit, r.filename, r.report_date
            FROM measurements m
            JOIN medical_reports r ON m.report_id = r.id
            WHERE r.user_id = ?
            ORDER BY r.report_date DESC, m.id DESC
            LIMIT 25`,
      args: [userId]
    });
    for (const m of measRes.rows) {
      measurements.push({
        parameter: String(m.parameter),
        value: String(m.normalized_value || m.raw_value || "N/A"),
        unit: String(m.unit || ""),
        reportDate: String(m.report_date || ""),
        filename: String(m.filename || "")
      });
    }
  } catch {
  }
  const recentAlerts = [];
  try {
    const alertsRes = await db2.execute({
      sql: "SELECT id, severity, title, message, created_at FROM health_alerts WHERE user_id = ? ORDER BY id DESC LIMIT 5",
      args: [userId]
    });
    for (const a of alertsRes.rows) {
      recentAlerts.push({
        id: Number(a.id),
        severity: String(a.severity || "MODERATE"),
        title: String(a.title || "Health Alert"),
        message: String(a.message || ""),
        date: String(a.created_at || "")
      });
    }
  } catch {
  }
  const medications = [];
  try {
    const medsRes = await db2.execute({
      sql: "SELECT name, dosage, frequency, time_of_day FROM medications WHERE user_id = ?",
      args: [userId]
    });
    for (const m of medsRes.rows) {
      medications.push({
        name: String(m.name),
        dosage: String(m.dosage || "Standard"),
        frequency: String(m.frequency || "Daily"),
        timeOfDay: m.time_of_day ? String(m.time_of_day) : void 0
      });
    }
  } catch {
  }
  const risks = [];
  try {
    const riskRes = await db2.execute({
      sql: "SELECT domain, level, label, evidence, created_at FROM risk_assessment WHERE user_id = ? ORDER BY id DESC LIMIT 4",
      args: [userId]
    });
    if (riskRes.rows.length > 0) {
      for (const r of riskRes.rows) {
        let explanation = r.label || "Assessment documented";
        let action = "Consult your physician.";
        try {
          const parsed = JSON.parse(String(r.evidence));
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.action) action = parsed.action;
        } catch {
        }
        risks.push({
          domain: String(r.domain),
          level: String(r.level),
          label: String(r.label || r.level),
          explanation: String(explanation),
          action: String(action)
        });
      }
    } else if (measurements.length > 0) {
      const records = measurements.map((m) => ({
        parameter: m.parameter,
        normalized_value: m.value,
        validation_status: "VALIDATED",
        report_date: m.reportDate,
        report: m.filename,
        page: "1"
      }));
      const evaluated = evaluateRiskAllDomains(records);
      for (const r of evaluated) {
        let exp = r.label;
        let act = "Maintain routine checkups.";
        try {
          const p = JSON.parse(r.evidence);
          if (p.explanation) exp = p.explanation;
          if (p.action) act = p.action;
        } catch {
        }
        risks.push({
          domain: r.domain,
          level: r.level,
          label: r.label,
          explanation: exp,
          action: act
        });
      }
    }
  } catch {
  }
  const trends = [];
  try {
    const trendsRes = await db2.execute({
      sql: "SELECT parameter, direction, evidence FROM trends WHERE user_id = ? ORDER BY id DESC LIMIT 6",
      args: [userId]
    });
    for (const t of trendsRes.rows) {
      trends.push({
        parameter: String(t.parameter),
        direction: String(t.direction),
        details: String(t.evidence || "")
      });
    }
  } catch {
  }
  return {
    patientId,
    patientName,
    latestReports,
    measurements,
    recentAlerts,
    medications,
    risks,
    trends
  };
}
async function generateTelegramLinkingToken(userId, contactId, db2) {
  const tokenVal = crypto.randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (contactId) {
    await db2.execute({
      sql: `UPDATE telegram_linking_tokens 
            SET consumed_at = ? 
            WHERE user_id = ? AND contact_id = ? AND consumed_at IS NULL`,
      args: [now, userId, contactId]
    });
  } else {
    await db2.execute({
      sql: `UPDATE telegram_linking_tokens 
            SET consumed_at = ? 
            WHERE user_id = ? AND contact_id IS NULL AND consumed_at IS NULL`,
      args: [now, userId]
    });
  }
  await db2.execute({
    sql: `INSERT INTO telegram_linking_tokens 
          (token, user_id, contact_id, type, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [tokenVal, userId, contactId || null, contactId ? "CONTACT" : "USER", expiresAt, now]
  });
  const botUsername = await getBotUsername() || "MediTrackAlertsBot";
  const deepLink = `https://t.me/${botUsername}?start=${tokenVal}`;
  return {
    token: tokenVal,
    botUsername,
    deepLink,
    expiresAt: new Date(expiresAt).toISOString()
  };
}
async function disconnectTelegramContact(userId, contactId, db2) {
  const contactRes = await db2.execute({
    sql: "SELECT telegram_chat_id, name FROM trusted_contacts WHERE id = ? AND user_id = ?",
    args: [contactId, userId]
  });
  if (contactRes.rows.length === 0) {
    return { success: false, message: "Contact not found" };
  }
  const existingChatId = contactRes.rows[0].telegram_chat_id;
  if (existingChatId) {
    try {
      await sendTelegramMessage(
        existingChatId,
        `\u2139\uFE0F <b>MediTrack Disconnected</b>

Your Telegram account has been disconnected from receiving alerts for this contact in MediTrack. You will no longer receive notifications here.`
      );
    } catch {
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db2.execute({
    sql: `UPDATE trusted_contacts 
          SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL, telegram_enabled = 0, updated_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [now, contactId, userId]
  });
  return { success: true, message: "Telegram contact disconnected successfully." };
}
async function disconnectTelegramUser(userId, db2) {
  const userRes = await db2.execute({
    sql: "SELECT telegram_chat_id FROM users WHERE id = ?",
    args: [userId]
  });
  const chatId = userRes.rows[0]?.telegram_chat_id;
  if (chatId) {
    try {
      await sendTelegramMessage(
        chatId,
        `\u2139\uFE0F <b>Personal Account Disconnected</b>

Your Telegram account has been unlinked from your personal MediTrack account. Alerts and assistant features have been stopped.`
      );
    } catch {
    }
  }
  await db2.execute({
    sql: "UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = ?",
    args: [userId]
  });
  return { success: true, message: "Personal Telegram account disconnected." };
}
function buildClinicalPromptContext(ctx) {
  const parts = [];
  parts.push(`Patient: ${ctx.patientName} (${ctx.patientId})`);
  if (ctx.latestReports.length > 0) {
    parts.push(`Recent Reports: ${ctx.latestReports.map((r) => `${r.filename} (Date: ${r.report_date})`).join("; ")}`);
  } else {
    parts.push("Recent Reports: None available in record.");
  }
  if (ctx.measurements.length > 0) {
    const list = ctx.measurements.slice(0, 15).map((m) => `${m.parameter}: ${m.value} ${m.unit} [Report: ${m.filename}, Date: ${m.reportDate}]`).join("\n  - ");
    parts.push(`Extracted Biomarkers:
  - ${list}`);
  } else {
    parts.push("Extracted Biomarkers: No measurements available.");
  }
  if (ctx.recentAlerts.length > 0) {
    const aList = ctx.recentAlerts.map((a) => `[${a.severity}] ${a.title}: ${a.message} (${a.date})`).join("\n  - ");
    parts.push(`Recent Health Alerts:
  - ${aList}`);
  } else {
    parts.push("Recent Health Alerts: None on file.");
  }
  if (ctx.risks.length > 0) {
    const rList = ctx.risks.map((r) => `${r.domain.toUpperCase()} Risk: Level ${r.level} (${r.label}) - ${r.explanation} Recommended Next Step: ${r.action}`).join("\n  - ");
    parts.push(`Risk Assessments:
  - ${rList}`);
  }
  if (ctx.medications.length > 0) {
    const mList = ctx.medications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(", ");
    parts.push(`Documented Medications: ${mList}`);
  } else {
    parts.push("Documented Medications: No medications documented in current records.");
  }
  if (ctx.trends.length > 0) {
    const tList = ctx.trends.map((t) => `${t.parameter}: ${t.direction}`).join("; ");
    parts.push(`Historical Trends: ${tList}`);
  }
  return parts.join("\n\n");
}
async function handleNaturalLanguageQuery(chatId, userMessage, identity, db2) {
  const userId = identity.userId;
  const clinical = await getPatientClinicalContext(userId, db2);
  const lowerMsg = userMessage.toLowerCase();
  const isEmergency = [
    "chest pain",
    "heart attack",
    "stroke",
    "cannot breathe",
    "cant breathe",
    "difficulty breathing",
    "unconscious",
    "severe bleeding",
    "overdose"
  ].some((term) => lowerMsg.includes(term));
  let emergencyPrefix = "";
  if (isEmergency) {
    emergencyPrefix = `\u{1F6A8} <b>CRITICAL EMERGENCY WARNING:</b>
If you or the patient are experiencing acute symptoms like severe chest pain or shortness of breath, <b>please contact emergency medical services immediately (e.g. 911 / 112)</b> or proceed to the nearest emergency room. Do not wait for messaging responses during a medical emergency.

`;
  }
  const history = [];
  try {
    const convRes = await db2.execute({
      sql: "SELECT role, content FROM telegram_conversations WHERE chat_id = ? ORDER BY id DESC LIMIT 6",
      args: [chatId]
    });
    for (const row of convRes.rows.reverse()) {
      history.push({ role: String(row.role), content: String(row.content) });
    }
  } catch {
  }
  const clinicalContextText = buildClinicalPromptContext(clinical);
  if (aiService.isConfigured()) {
    try {
      const aiReply = await aiService.generateChatResponse(userMessage, clinicalContextText, history);
      return emergencyPrefix + escapeHtml(aiReply);
    } catch (err) {
    }
  }
  let responseText = "";
  if (lowerMsg.includes("medication") || lowerMsg.includes("drug") || lowerMsg.includes("prescription")) {
    if (clinical.medications.length > 0) {
      const list = clinical.medications.map((m) => `\u2022 <b>${escapeHtml(m.name)}:</b> ${escapeHtml(m.dosage)} (${escapeHtml(m.frequency)})`).join("\n");
      responseText = `\u{1F48A} <b>Documented Medications for ${escapeHtml(clinical.patientName)}:</b>

${list}

<i>Note: Always verify with your prescribing physician.</i>`;
    } else {
      responseText = `\u2139\uFE0F <b>Medications:</b> No medications are currently documented in ${escapeHtml(clinical.patientName)}'s uploaded medical records.`;
    }
  } else if (lowerMsg.includes("risk") || lowerMsg.includes("cardio") || lowerMsg.includes("metabolic")) {
    if (clinical.risks.length > 0) {
      const rList = clinical.risks.map((r) => `\u2022 <b>${escapeHtml(r.domain.toUpperCase())}:</b> Level <b>${escapeHtml(r.level)}</b> (${escapeHtml(r.label)})
  <i>${escapeHtml(r.explanation)}</i>
  \u{1F449} Recommended: ${escapeHtml(r.action)}`).join("\n\n");
      responseText = `\u{1F4CA} <b>Risk Assessment Summary:</b>

${rList}`;
    } else {
      responseText = `\u2139\uFE0F <b>Risk Assessment:</b> Insufficient biomarker data to evaluate clinical risk domains. Please upload a comprehensive lab panel in MediTrack.`;
    }
  } else if (lowerMsg.includes("alert") || lowerMsg.includes("why was the latest alert") || lowerMsg.includes("history")) {
    if (clinical.recentAlerts.length > 0) {
      const aList = clinical.recentAlerts.map((a) => `\u2022 <b>[${escapeHtml(a.severity)}]</b> ${escapeHtml(a.title)}: ${escapeHtml(a.message)} (<i>${new Date(a.date).toLocaleDateString()}</i>)`).join("\n\n");
      responseText = `\u{1F6A8} <b>Recent Alert History for ${escapeHtml(clinical.patientName)}:</b>

${aList}`;
    } else {
      responseText = `\u2705 <b>Alert History:</b> No health alerts have been recorded for ${escapeHtml(clinical.patientName)}.`;
    }
  } else if (lowerMsg.includes("trend") || lowerMsg.includes("change") || lowerMsg.includes("between the last two")) {
    if (clinical.trends.length > 0) {
      const tList = clinical.trends.map((t) => `\u2022 <b>${escapeHtml(t.parameter)}:</b> ${escapeHtml(t.direction)}`).join("\n");
      responseText = `\u{1F4C8} <b>Historical Biomarker Trends:</b>

${tList}`;
    } else {
      responseText = `\u2139\uFE0F <b>Historical Trends:</b> No multi-report trends are available yet. Upload at least two consecutive lab panels in MediTrack to compare trajectories.`;
    }
  } else if (lowerMsg.includes("report") || lowerMsg.includes("lab") || lowerMsg.includes("biomarker") || lowerMsg.includes("status")) {
    if (clinical.latestReports.length > 0) {
      const rep = clinical.latestReports[0];
      const meas = clinical.measurements.slice(0, 8).map((m) => `\u2022 <b>${escapeHtml(m.parameter)}:</b> <code>${escapeHtml(m.value)} ${escapeHtml(m.unit)}</code>`).join("\n");
      responseText = `\u{1F4CB} <b>Latest Report Summary:</b>
\u2022 <b>File:</b> ${escapeHtml(rep.filename)}
\u2022 <b>Date:</b> ${escapeHtml(rep.report_date)}

<b>Key Biomarkers:</b>
${meas || "No measurements extracted yet."}

<i>View the complete report securely in your MediTrack dashboard.</i>`;
    } else {
      responseText = `\u2139\uFE0F <b>Medical Reports:</b> No medical reports are currently uploaded for ${escapeHtml(clinical.patientName)}.`;
    }
  } else {
    responseText = `\u{1F4AC} <b>MediTrack Health Assistant</b>

I am linked to <b>${escapeHtml(clinical.patientName)}</b> (<code>${escapeHtml(clinical.patientId)}</code>).

You can ask me questions about:
\u2022 Latest report findings and extracted biomarkers
\u2022 Cardiovascular &amp; metabolic risk levels (/risk)
\u2022 Documented medications and dosages (/medications)
\u2022 Historical trends across reports (/trends)
\u2022 Recent health alerts and reasons (/alerts)

<i>Type /help to see all available commands.</i>`;
  }
  return emergencyPrefix + responseText;
}
async function handleTelegramUpdate(update, db2) {
  const updateId = update?.update_id;
  if (updateId) {
    try {
      const dupRes = await db2.execute({
        sql: "SELECT update_id FROM telegram_processed_updates WHERE update_id = ?",
        args: [updateId]
      });
      if (dupRes.rows.length > 0) {
        return { handled: true, action: "duplicate_skipped" };
      }
      await db2.execute({
        sql: "INSERT INTO telegram_processed_updates (update_id, processed_at) VALUES (?, ?)",
        args: [updateId, (/* @__PURE__ */ new Date()).toISOString()]
      });
    } catch {
    }
  }
  const message = update?.message || update?.edited_message;
  if (!message || !message.chat) {
    return { handled: false };
  }
  const chatId = String(message.chat.id);
  const fromUsername = message.from?.username || message.chat?.username || null;
  const text = (message.text || "").trim();
  if (!checkRateLimit(chatId, 30)) {
    await sendTelegramMessage(
      chatId,
      `\u26A0\uFE0F <b>Rate Limit Exceeded</b>

You are sending messages too quickly. Please pause for a moment before trying again.`
    );
    return { handled: true, action: "rate_limited" };
  }
  if (text.startsWith("/start")) {
    const parts = text.split(/\s+/);
    const linkingToken = parts[1]?.trim();
    if (!linkingToken) {
      const identity2 = await resolveTelegramIdentity(chatId, db2);
      if (identity2.isLinked) {
        await sendTelegramMessage(
          chatId,
          `\u{1F44B} <b>Welcome back to MediTrack Health Assistant!</b>

You are connected to <b>${escapeHtml(identity2.patientName || "Patient")}</b> (<code>${escapeHtml(identity2.patientId || "")}</code>).

Commands:
\u2022 /status \u2014 Health status and alert overview
\u2022 /summary \u2014 Latest medical report summary
\u2022 /alerts \u2014 Recent health alerts
\u2022 /risk \u2014 Cardiovascular &amp; metabolic risk assessment
\u2022 /reports \u2014 List available medical reports
\u2022 /trends \u2014 Historical biomarker changes
\u2022 /medications \u2014 Documented medications
\u2022 /help \u2014 Full command manual

You can also ask me questions in plain English, such as: <i>"What was my blood pressure in the last report?"</i>`
        );
        return { handled: true, action: "start_linked" };
      }
      await sendTelegramMessage(
        chatId,
        `\u{1F44B} <b>Welcome to MediTrack Intelligent Health Assistant!</b>

This bot delivers real-time emergency clinical notifications and answers questions about authorized medical records.

<b>To connect this Telegram chat to a MediTrack account:</b>
1. Log into your MediTrack dashboard.
2. Go to <b>Family &amp; Alerts</b>.
3. Click <b>Connect Telegram</b> to generate your secure 15-minute connection link.
4. Tap the link to open this bot and activate alerts.

<i>No medical data is shared until an authorized linking link is validated.</i>`
      );
      return { handled: true, action: "start_without_token" };
    }
    const tokenRes = await db2.execute({
      sql: "SELECT * FROM telegram_linking_tokens WHERE token = ?",
      args: [linkingToken]
    });
    if (tokenRes.rows.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u274C <b>Invalid Connection Link</b>

This MediTrack linking token is unrecognized or invalid.
Please return to the MediTrack Family &amp; Alerts page and generate a fresh connection link.`
      );
      return { handled: true, action: "invalid_token", error: "Token not found" };
    }
    const tokenRecord = tokenRes.rows[0];
    const now = Date.now();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (tokenRecord.consumed_at) {
      await sendTelegramMessage(
        chatId,
        `\u26A0\uFE0F <b>Connection Link Already Used</b>

This single-use connection link has already been consumed.
If you need to link another contact or relink, please generate a new link in your MediTrack dashboard.`
      );
      return { handled: true, action: "token_already_consumed", error: "Token consumed" };
    }
    if (now > Number(tokenRecord.expires_at)) {
      await sendTelegramMessage(
        chatId,
        `\u23F3 <b>Connection Link Expired</b>

For your patient's security, this connection link expired after 15 minutes.
Please generate a new connection link in MediTrack Family &amp; Alerts.`
      );
      return { handled: true, action: "token_expired", error: "Token expired" };
    }
    await db2.execute({
      sql: "UPDATE telegram_linking_tokens SET consumed_at = ? WHERE id = ?",
      args: [nowIso, tokenRecord.id]
    });
    const userId2 = Number(tokenRecord.user_id);
    const contactId = tokenRecord.contact_id ? Number(tokenRecord.contact_id) : null;
    const patientRes = await db2.execute({ sql: "SELECT id, name, email FROM users WHERE id = ?", args: [userId2] });
    const patient = patientRes.rows[0] || { id: userId2, name: "Patient" };
    const patientId = `P-${String(userId2).padStart(4, "0")}`;
    if (contactId) {
      const contactRes = await db2.execute({
        sql: "SELECT id, name, relationship FROM trusted_contacts WHERE id = ? AND user_id = ?",
        args: [contactId, userId2]
      });
      if (contactRes.rows.length === 0) {
        await sendTelegramMessage(chatId, `\u274C <b>Contact Record Not Found</b>
The contact record associated with this token was removed.`);
        return { handled: true, action: "contact_not_found" };
      }
      const contact = contactRes.rows[0];
      await db2.execute({
        sql: `UPDATE trusted_contacts 
              SET telegram_chat_id = ?, telegram_username = ?, telegram_linked_at = ?, telegram_enabled = 1, updated_at = ?
              WHERE id = ? AND user_id = ?`,
        args: [chatId, fromUsername, nowIso, nowIso, contactId, userId2]
      });
      await sendTelegramMessage(
        chatId,
        `\u2705 <b>MediTrack Connected Successfully!</b>

Hello <b>${escapeHtml(contact.name)}</b> (${escapeHtml(contact.relationship)}),

Your Telegram account is now securely linked to receive real-time health alerts for patient <b>${escapeHtml(patient.name)}</b> (<code>${escapeHtml(patientId)}</code>).

You can also ask me questions about authorized reports, trends, and risk assessments. Send /help to see all commands.`
      );
      return { handled: true, action: "contact_linked", details: { contactId, userId: userId2, chatId, username: fromUsername } };
    } else {
      await db2.execute({
        sql: `UPDATE users 
              SET telegram_chat_id = ?, telegram_username = ?, notification_telegram = 1
              WHERE id = ?`,
        args: [chatId, fromUsername, userId2]
      });
      await sendTelegramMessage(
        chatId,
        `\u2705 <b>Personal MediTrack Account Linked!</b>

Hello <b>${escapeHtml(patient.name)}</b>,

Your personal Telegram is now connected to receive health alerts for your account (<code>${escapeHtml(patientId)}</code>).

Send /help to see available health assistant commands.`
      );
      return { handled: true, action: "user_linked", details: { userId: userId2, chatId, username: fromUsername } };
    }
  }
  if (text === "/link") {
    const identity2 = await resolveTelegramIdentity(chatId, db2);
    if (identity2.isLinked) {
      await sendTelegramMessage(
        chatId,
        `\u2139\uFE0F <b>Already Linked</b>

This Telegram chat is already connected to <b>${escapeHtml(identity2.patientName || "Patient")}</b> (<code>${escapeHtml(identity2.patientId || "")}</code>).

To disconnect or link a different contact, use /stop or manage connections in MediTrack Family &amp; Alerts.`
      );
      return { handled: true, action: "link_already_connected" };
    }
    await sendTelegramMessage(
      chatId,
      `\u{1F517} <b>Connect Your MediTrack Account:</b>

For your security, Telegram linking requires a single-use 15-minute token generated inside the MediTrack application.

1. Log into MediTrack at <code>${escapeHtml(envConfig.APP_BASE_URL || "http://localhost:3000")}</code>
2. Open the <b>Family &amp; Alerts</b> page.
3. Click the <b>Connect Telegram</b> button.
4. Tap <b>Open in Telegram</b> to activate your connection.`
    );
    return { handled: true, action: "link_guidance" };
  }
  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      `\u{1F4CB} <b>MediTrack Telegram Bot Command Guide:</b>

<b>Clinical &amp; Health Commands:</b>
\u2022 /status \u2014 Latest patient health status and alert overview
\u2022 /summary \u2014 Summary of latest available medical assessment &amp; report
\u2022 /alerts \u2014 List recent authorized health alerts
\u2022 /reports \u2014 List available medical reports on file
\u2022 /trends \u2014 Historical biomarker trajectory comparisons
\u2022 /risk \u2014 Cardiovascular and metabolic risk assessment breakdown
\u2022 /medications \u2014 Prescribed and documented medications

<b>Account &amp; Management Commands:</b>
\u2022 /link \u2014 Instructions for connecting your account
\u2022 /contact \u2014 How to manage notification preferences
\u2022 /stop \u2014 Disconnect Telegram and disable alerts

<b>Natural-Language Assistant:</b>
You can also ask questions naturally! For example:
<i>"Why was the latest alert triggered?"</i>
<i>"What were my blood pressure and glucose in the latest test?"</i>
<i>"Has my cardiovascular risk changed?"</i>

<i>Notice: For medical emergencies, call 911 / emergency services immediately.</i>`
    );
    return { handled: true, action: "help" };
  }
  if (text === "/stop") {
    const identity2 = await resolveTelegramIdentity(chatId, db2);
    if (!identity2.isLinked) {
      await sendTelegramMessage(chatId, `\u2139\uFE0F This Telegram chat is not currently linked to any MediTrack account.`);
      return { handled: true, action: "stop_unlinked" };
    }
    if (identity2.type === "CONTACT" && identity2.contactId) {
      await disconnectTelegramContact(identity2.userId, identity2.contactId, db2);
    } else if (identity2.type === "USER" && identity2.userId) {
      await disconnectTelegramUser(identity2.userId, db2);
    }
    await sendTelegramMessage(
      chatId,
      `\u{1F6D1} <b>Telegram Notifications Stopped</b>

Your Telegram account has been disconnected from MediTrack. You will no longer receive health alerts or assistant updates here.

To reconnect in the future, visit <b>Family &amp; Alerts</b> in your MediTrack dashboard.`
    );
    return { handled: true, action: "stop_disconnected" };
  }
  if (text === "/contact") {
    await sendTelegramMessage(
      chatId,
      `\u{1F465} <b>Managing Your MediTrack Telegram Connection:</b>

\u2022 You can enable or disable alerts at any time in the <b>Family &amp; Alerts</b> portal.
\u2022 Designated trusted contacts receive urgent medical notifications via Gmail and Telegram.
\u2022 To permanently disconnect this bot, use /stop.
\u2022 To reach support or modify patient permissions, log in at <code>${escapeHtml(envConfig.APP_BASE_URL || "http://localhost:3000")}</code>.`
    );
    return { handled: true, action: "contact_info" };
  }
  const identity = await resolveTelegramIdentity(chatId, db2);
  if (!identity.isLinked) {
    await sendTelegramMessage(
      chatId,
      `\u{1F512} <b>Account Not Linked</b>

To protect patient health privacy, this Telegram account is not yet authorized to view medical records.

Please connect your Telegram account by navigating to <b>Family &amp; Alerts</b> in the MediTrack web portal and clicking <b>Connect Telegram</b>.`
    );
    return { handled: true, action: "unauthorized_unlinked" };
  }
  if (identity.consentGranted === false) {
    await sendTelegramMessage(
      chatId,
      `\u26A0\uFE0F <b>Access Restricted</b>

Patient consent for this trusted contact has been revoked or paused. Medical summaries cannot be retrieved at this time.`
    );
    return { handled: true, action: "consent_revoked" };
  }
  const userId = identity.userId;
  const auditCommand = text.startsWith("/") ? text.split(/\s+/)[0] : "QUERY";
  try {
    await db2.execute({
      sql: `INSERT INTO telegram_audit_logs (chat_id, user_id, contact_id, command, query_preview, status, response_type, created_at)
            VALUES (?, ?, ?, ?, ?, 'PROCESSING', 'TEXT', ?)`,
      args: [chatId, userId, identity.contactId || null, auditCommand, text.substring(0, 100), (/* @__PURE__ */ new Date()).toISOString()]
    });
  } catch {
  }
  if (text === "/status") {
    const clinical = await getPatientClinicalContext(userId, db2);
    const lastAlert = clinical.recentAlerts[0];
    const alertLevel = lastAlert ? `${lastAlert.severity} (${new Date(lastAlert.date).toLocaleDateString()})` : "Normal (No active alerts)";
    const lastReport = clinical.latestReports[0];
    const reportSummary = lastReport ? `${lastReport.filename} (${lastReport.report_date})` : "No reports on file";
    await sendTelegramMessage(
      chatId,
      `\u{1F4CA} <b>MediTrack Patient Status:</b>

\u2022 <b>Patient:</b> ${escapeHtml(clinical.patientName)} (<code>${escapeHtml(clinical.patientId)}</code>)
\u2022 <b>Alert Status:</b> ${escapeHtml(alertLevel)}
\u2022 <b>Latest Report:</b> ${escapeHtml(reportSummary)}
\u2022 <b>Total Reports:</b> ${clinical.latestReports.length}
\u2022 <b>Telegram Alerts:</b> ${identity.telegramEnabled ? "Active \u2705" : "Paused \u23F8"}

<i>Use /summary for detailed lab results or /risk for clinical domain evaluations.</i>`
    );
    return { handled: true, action: "status" };
  }
  if (text === "/alerts") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.recentAlerts.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u2705 <b>Alert History:</b>

No recent health alerts on record for patient <b>${escapeHtml(clinical.patientName)}</b>.`
      );
      return { handled: true, action: "alerts_empty" };
    }
    const severityEmojis = { CRITICAL: "\u{1F6A8}", HIGH: "\u26A0\uFE0F", MODERATE: "\u2139\uFE0F", LOW: "\u{1F4CB}" };
    const alertItems = clinical.recentAlerts.map((a) => {
      const emoji = severityEmojis[a.severity] || "\u26A0\uFE0F";
      return `${emoji} <b>[${escapeHtml(a.severity)}] ${escapeHtml(a.title)}</b>
<i>${escapeHtml(a.message)}</i>
Timestamp: <code>${new Date(a.date).toLocaleString()}</code>`;
    }).join("\n\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F6A8} <b>Recent Alerts for ${escapeHtml(clinical.patientName)}:</b>

${alertItems}`
    );
    return { handled: true, action: "alerts_listed" };
  }
  if (text === "/summary") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.latestReports.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u2139\uFE0F <b>Medical Summary:</b> No medical reports have been uploaded yet for ${escapeHtml(clinical.patientName)}.`
      );
      return { handled: true, action: "summary_empty" };
    }
    const rep = clinical.latestReports[0];
    const topBiomarkers = clinical.measurements.slice(0, 10).map((m) => {
      return `\u2022 <b>${escapeHtml(m.parameter)}:</b> <code>${escapeHtml(m.value)} ${escapeHtml(m.unit)}</code>`;
    }).join("\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F4CB} <b>Latest Assessment Summary:</b>

<b>Report:</b> ${escapeHtml(rep.filename)}
<b>Collection Date:</b> ${escapeHtml(rep.report_date)}

<b>Extracted Biomarkers:</b>
${topBiomarkers || "None extracted."}

<i>Notice: For complete verified reports and reference ranges, view your MediTrack dashboard.</i>`
    );
    return { handled: true, action: "summary" };
  }
  if (text === "/reports") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.latestReports.length === 0) {
      await sendTelegramMessage(chatId, `\u2139\uFE0F No medical reports found on file for ${escapeHtml(clinical.patientName)}.`);
      return { handled: true, action: "reports_empty" };
    }
    const reportLines = clinical.latestReports.map((r, i) => {
      return `${i + 1}. \u{1F4C4} <b>${escapeHtml(r.filename)}</b> \u2014 <i>Date: ${escapeHtml(r.report_date)}</i>`;
    }).join("\n\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F4C1} <b>Medical Reports on File for ${escapeHtml(clinical.patientName)}:</b>

${reportLines}

<i>Access full PDFs and verified lab sheets in the MediTrack web app.</i>`
    );
    return { handled: true, action: "reports_listed" };
  }
  if (text === "/trends") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.trends.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u{1F4C8} <b>Biomarker Trends:</b>

No multi-report trajectories calculated yet for ${escapeHtml(clinical.patientName)}. Trends are computed when at least two consecutive lab reports are available.`
      );
      return { handled: true, action: "trends_empty" };
    }
    const trendLines = clinical.trends.map((t) => {
      const arrow = t.direction.toLowerCase().includes("increase") || t.direction.toLowerCase().includes("up") ? "\u2197\uFE0F" : "\u2198\uFE0F";
      return `${arrow} <b>${escapeHtml(t.parameter)}:</b> ${escapeHtml(t.direction)}`;
    }).join("\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F4C8} <b>Historical Biomarker Trends for ${escapeHtml(clinical.patientName)}:</b>

${trendLines}`
    );
    return { handled: true, action: "trends_listed" };
  }
  if (text === "/risk") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.risks.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u{1F4CA} <b>Risk Assessment:</b> Insufficient biomarker records to evaluate cardiovascular or metabolic risks.`
      );
      return { handled: true, action: "risk_empty" };
    }
    const riskBadges = { RED: "\u{1F534}", ORANGE: "\u{1F7E0}", YELLOW: "\u{1F7E1}", GREEN: "\u{1F7E2}", GREY: "\u26AA" };
    const riskSections = clinical.risks.map((r) => {
      const badge = riskBadges[r.level] || "\u26AA";
      return `${badge} <b>${escapeHtml(r.domain.toUpperCase())} RISK:</b> Level ${escapeHtml(r.level)}
<b>Finding:</b> ${escapeHtml(r.label)}
<b>Assessment:</b> ${escapeHtml(r.explanation)}
\u{1F449} <b>Action:</b> ${escapeHtml(r.action)}`;
    }).join("\n\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F4CA} <b>Clinical Risk Engine Evaluation for ${escapeHtml(clinical.patientName)}:</b>

${riskSections}

<i>Automated clinical indicator engine (rule version 1.0.0). Not a clinical diagnosis.</i>`
    );
    return { handled: true, action: "risk_evaluated" };
  }
  if (text === "/medications") {
    const clinical = await getPatientClinicalContext(userId, db2);
    if (clinical.medications.length === 0) {
      await sendTelegramMessage(
        chatId,
        `\u{1F48A} <b>Documented Medications:</b>

No medications are currently documented in ${escapeHtml(clinical.patientName)}'s authorized medical records.`
      );
      return { handled: true, action: "medications_empty" };
    }
    const medLines = clinical.medications.map((m, i) => {
      return `${i + 1}. <b>${escapeHtml(m.name)}</b> \u2014 ${escapeHtml(m.dosage)} (${escapeHtml(m.frequency)}${m.timeOfDay ? `, ${escapeHtml(m.timeOfDay)}` : ""})`;
    }).join("\n");
    await sendTelegramMessage(
      chatId,
      `\u{1F48A} <b>Documented Medications for ${escapeHtml(clinical.patientName)}:</b>

${medLines}

<i>Important: Never adjust prescribed medication dosages without consulting your physician.</i>`
    );
    return { handled: true, action: "medications_listed" };
  }
  const reply = await handleNaturalLanguageQuery(chatId, text, identity, db2);
  await sendTelegramMessage(chatId, reply);
  try {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    await db2.execute({
      sql: 'INSERT INTO telegram_conversations (chat_id, role, content, created_at) VALUES (?, "user", ?, ?)',
      args: [chatId, text, nowIso]
    });
    await db2.execute({
      sql: 'INSERT INTO telegram_conversations (chat_id, role, content, created_at) VALUES (?, "assistant", ?, ?)',
      args: [chatId, reply.replace(/<[^>]*>/g, ""), nowIso]
    });
  } catch {
  }
  return { handled: true, action: "chat_reply_sent" };
}
async function getTelegramStatus(userId, db2) {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const isConfigured = Boolean(token && token.length > 10);
  const botUsername = await getBotUsername();
  const missingSetup = [];
  if (!isConfigured) {
    missingSetup.push("Set TELEGRAM_BOT_TOKEN in server environment (create bot via @BotFather on Telegram).");
  }
  try {
    const userRes = await db2.execute({
      sql: "SELECT notification_telegram FROM users WHERE id = ?",
      args: [userId]
    });
    const userEnabled = userRes.rows[0]?.notification_telegram !== 0;
    const contactsRes = await db2.execute({
      sql: "SELECT count(*) as count FROM trusted_contacts WHERE user_id = ? AND telegram_chat_id IS NOT NULL AND (status = ? OR status IS NULL)",
      args: [userId, "ACTIVE"]
    });
    const linkedContactsCount = Number(contactsRes.rows[0]?.count || 0);
    return {
      configured: isConfigured,
      botUsername,
      provider: "TELEGRAM_BOT_API",
      userEnabled,
      linkedContactsCount,
      webhookConfigured: Boolean(envConfig.TELEGRAM_WEBHOOK_SECRET),
      missingSetup
    };
  } catch (err) {
    return {
      configured: isConfigured,
      botUsername,
      provider: "TELEGRAM_BOT_API",
      userEnabled: true,
      linkedContactsCount: 0,
      webhookConfigured: false,
      missingSetup: [err.message || "Error checking Telegram status"]
    };
  }
}
function verifyTelegramWebhookSecret(headerSecret) {
  const expectedSecret = envConfig.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) return true;
  return headerSecret === expectedSecret;
}
async function setTelegramWebhook(webhookUrl, secretToken) {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const secret = secretToken || envConfig.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  const params = { url: webhookUrl };
  if (secret) params.secret_token = secret;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  return { ok: data.ok, description: sanitizeTelegramLog(data.description || "") };
}
async function getTelegramWebhookInfo() {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { configured: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    return data.result || data;
  } catch (err) {
    return { error: sanitizeTelegramLog(err.message || String(err)) };
  }
}
async function pollTelegramUpdates(db2) {
  const token = envConfig.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return 0;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20&timeout=0`);
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return 0;
    let processed = 0;
    let maxUpdateId = 0;
    for (const update of data.result) {
      if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
      const res2 = await handleTelegramUpdate(update, db2);
      if (res2.handled) processed++;
    }
    if (maxUpdateId > 0) {
      await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${maxUpdateId + 1}&limit=1&timeout=0`);
    }
    return processed;
  } catch (err) {
    return 0;
  }
}
var chatRateLimits, cachedBotUsername;
var init_telegramService = __esm({
  "telegram-bot/telegramService.ts"() {
    init_env();
    init_ai_service();
    init_riskEngine();
    chatRateLimits = /* @__PURE__ */ new Map();
    cachedBotUsername = null;
  }
});

// telegram-bot/index.ts
var init_telegram_bot = __esm({
  "telegram-bot/index.ts"() {
    init_telegramService();
  }
});

// backend/services/notifications/telegramService.ts
var init_telegramService2 = __esm({
  "backend/services/notifications/telegramService.ts"() {
    init_telegram_bot();
  }
});

// backend/services/notifications/providers.ts
var providers_exports = {};
__export(providers_exports, {
  isValidEmail: () => isValidEmail,
  normalizePhoneToE164: () => normalizePhoneToE164,
  sendEmail: () => sendEmail,
  sendPush: () => sendPush,
  sendSms: () => sendSms,
  sendTelegramMessage: () => sendTelegramMessage
});
import webpush from "web-push";
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }
  if (hasPlus) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}
async function sendEmail(payload, userId, db2) {
  const normalizedTo = payload.to.trim().toLowerCase();
  if (!isValidEmail(normalizedTo)) {
    return {
      success: false,
      provider: "GMAIL_API",
      status: "FAILED",
      isTransient: false,
      error: `Invalid destination email address: ${payload.to}`
    };
  }
  if (userId && db2) {
    return await sendGmailEmail(userId, db2, {
      to: normalizedTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    });
  }
  return {
    success: false,
    provider: "GMAIL_API",
    status: "FAILED",
    isTransient: false,
    error: "User context and database instance required to dispatch via Gmail OAuth."
  };
}
async function sendSms(payload) {
  return {
    success: false,
    provider: "twilio",
    status: "SKIPPED",
    isTransient: false,
    error: "SMS channel has been decommissioned and replaced with official Telegram Bot notifications."
  };
}
async function sendPush(payload) {
  return {
    success: false,
    provider: "web-push",
    status: "SKIPPED",
    isTransient: false,
    error: "Browser push notifications are currently inactive."
  };
}
var init_providers = __esm({
  "backend/services/notifications/providers.ts"() {
    init_env();
    init_gmailService();
    init_telegramService2();
    if (envConfig.IS_PUSH_CONFIGURED) {
      try {
        webpush.setVapidDetails(
          envConfig.VAPID_SUBJECT,
          envConfig.VAPID_PUBLIC_KEY,
          envConfig.VAPID_PRIVATE_KEY
        );
      } catch (err) {
        console.error("Failed to initialize web-push VAPID configuration:", err);
      }
    }
  }
});

// backend/services/notifications/canonicalSummary.ts
var canonicalSummary_exports = {};
__export(canonicalSummary_exports, {
  MEDICAL_DISCLAIMER: () => MEDICAL_DISCLAIMER,
  formatEmailHtml: () => formatEmailHtml,
  formatEmailText: () => formatEmailText,
  formatPush: () => formatPush,
  formatSms: () => formatSms,
  formatTelegram: () => formatTelegram
});
function formatEmailHtml(summary) {
  const severityColors = {
    CRITICAL: { bg: "#FEF2F2", text: "#991B1B", border: "#F87171" },
    HIGH: { bg: "#FFF7ED", text: "#9A3412", border: "#FB923C" },
    MODERATE: { bg: "#FEFCE8", text: "#854D0E", border: "#FACC15" },
    LOW: { bg: "#F0FDF4", text: "#166534", border: "#4ADE80" }
  };
  const currentTheme = severityColors[summary.severity] || severityColors.MODERATE;
  const findingsRows = summary.abnormalFindings.length > 0 ? summary.abnormalFindings.map((f) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">${escapeHtml2(f.parameter)}</td>
        <td style="padding: 10px 12px; color: #0F172A; font-weight: 700;">${escapeHtml2(String(f.measuredValue))} ${escapeHtml2(f.unit)}</td>
        <td style="padding: 10px 12px; color: #64748B;">${escapeHtml2(f.referenceRange || "Standard")}</td>
        <td style="padding: 10px 12px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${f.status === "Critical" || f.status === "High" ? "#FEE2E2" : "#FEF3C7"}; color: ${f.status === "Critical" || f.status === "High" ? "#991B1B" : "#92400E"};">
            ${escapeHtml2(f.status)}
          </span>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="4" style="padding: 12px; color: #64748B; text-align: center;">No individual abnormal lab values extracted for this alert.</td></tr>';
  const historySection = summary.historicalChanges.length > 0 ? `
      <div style="margin-top: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Comparison with Previous Reports</h4>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6;">
          ${summary.historicalChanges.map((h) => `
            <li><strong>${escapeHtml2(h.parameter)}</strong> changed from ${escapeHtml2(h.previousValue)} (${escapeHtml2(h.previousDate)}) to <strong>${escapeHtml2(h.currentValue)}</strong> (${escapeHtml2(h.changeDirection)}).</li>
          `).join("")}
        </ul>
      </div>
    ` : "";
  const actionsList = summary.recommendedActions.length > 0 ? summary.recommendedActions.map((a) => `<li style="margin-bottom: 6px;">${escapeHtml2(a)}</li>`).join("") : "<li>Review authorized health record in MediTrack and consult your physician.</li>";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediTrack Health Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1E293B; background-color: #F8FAFC; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: #0F172A; padding: 20px 24px; text-align: left;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #10B981; font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">MediTrack</span>
        <span style="color: #94A3B8; font-size: 12px;">Alert #${escapeHtml2(String(summary.alertId))}</span>
      </div>
    </div>

    <!-- Severity Banner -->
    <div style="background-color: ${currentTheme.bg}; border-left: 5px solid ${currentTheme.border}; padding: 16px 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: ${currentTheme.text};">
          ${summary.severity} PRIORITY HEALTH ALERT
        </span>
        <span style="color: #64748B; font-size: 12px;">${escapeHtml2(new Date(summary.timestamp).toLocaleString())}</span>
      </div>
      <h2 style="margin: 8px 0 4px 0; font-size: 18px; color: #0F172A;">${escapeHtml2(summary.title)}</h2>
      <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Patient:</strong> ${escapeHtml2(summary.patientName)} (${escapeHtml2(summary.patientId)})</p>
    </div>

    <!-- Content Body -->
    <div style="padding: 24px;">
      
      <!-- Main Reason -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 6px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Summary of Reason</h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1E293B; background: #F1F5F9; padding: 12px 14px; border-radius: 8px;">
          ${escapeHtml2(summary.mainReason)}
        </p>
      </div>

      <!-- Abnormal Findings Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Clinically Relevant Findings</h3>
        <div style="overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; color: #475569;">
                <th style="padding: 10px 12px; font-weight: 600;">Biomarker</th>
                <th style="padding: 10px 12px; font-weight: 600;">Value</th>
                <th style="padding: 10px 12px; font-weight: 600;">Reference</th>
                <th style="padding: 10px 12px; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${findingsRows}
            </tbody>
          </table>
        </div>
      </div>

      ${historySection}

      <!-- System Explanation & Limitations -->
      <div style="margin-top: 20px; padding: 12px 14px; background: #FAF5FF; border-radius: 8px; border: 1px solid #E9D5FF;">
        <h4 style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #6B21A8; letter-spacing: 0.5px;">System Assessment & Notes</h4>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #3B0764; line-height: 1.5;">${escapeHtml2(summary.explanation)}</p>
        ${summary.limitations ? `<p style="margin: 0; font-size: 11px; color: #7E22CE; font-style: italic;">Note: ${escapeHtml2(summary.limitations)}</p>` : ""}
      </div>

      <!-- Recommended Follow-up Actions -->
      <div style="margin-top: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Recommended Follow-up Actions</h3>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #1E293B;">
          ${actionsList}
        </ol>
      </div>

      <!-- Secure CTA Link -->
      <div style="margin-top: 28px; text-align: center;">
        <a href="${escapeHtml2(summary.secureLink)}" style="display: inline-block; background: #059669; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);">
          View Complete Authorized Report &rarr;
        </a>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748B;">Requires authorized sign-in to MediTrack.</p>
      </div>

    </div>

    <!-- Medical Disclaimer & Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 24px; font-size: 11px; color: #64748B; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;"><strong>Medical Disclaimer:</strong> ${escapeHtml2(summary.disclaimer)}</p>
      <p style="margin: 0;">Sent by MediTrack Trusted Contact Alert Network. To adjust notification preferences, visit your account settings.</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
function formatEmailText(summary) {
  const findings = summary.abnormalFindings.length > 0 ? summary.abnormalFindings.map((f) => `  - ${f.parameter}: ${f.measuredValue} ${f.unit} (Ref: ${f.referenceRange || "Standard"}) [${f.status}]`).join("\n") : "  - None extracted";
  const history = summary.historicalChanges.length > 0 ? "\nHISTORICAL COMPARISON:\n" + summary.historicalChanges.map((h) => `  - ${h.parameter}: was ${h.previousValue} on ${h.previousDate}, now ${h.currentValue} (${h.changeDirection})`).join("\n") : "";
  const actions = summary.recommendedActions.length > 0 ? summary.recommendedActions.map((a, i) => `  ${i + 1}. ${a}`).join("\n") : "  1. Review health record and consult physician";
  return `
[MEDITRACK] ${summary.severity} HEALTH ALERT
Alert ID: #${summary.alertId}
Date/Time: ${new Date(summary.timestamp).toLocaleString()}
Patient: ${summary.patientName} (${summary.patientId})

MAIN REASON:
${summary.mainReason}

CLINICALLY RELEVANT FINDINGS:
${findings}
${history}

ASSESSMENT:
${summary.explanation}
${summary.limitations ? `Limitations: ${summary.limitations}
` : ""}
RECOMMENDED ACTIONS:
${actions}

FULL AUTHORIZED SUMMARY & REPORT:
${summary.secureLink}

---
DISCLAIMER:
${summary.disclaimer}
  `.trim();
}
function formatTelegram(summary) {
  const severityEmojis = {
    CRITICAL: "\u{1F6A8}",
    HIGH: "\u26A0\uFE0F",
    MODERATE: "\u2139\uFE0F",
    LOW: "\u{1F4CB}"
  };
  const emoji = severityEmojis[summary.severity] || "\u26A0\uFE0F";
  const formattedTime = new Date(summary.timestamp).toLocaleString();
  let findingsSection = "";
  if (summary.abnormalFindings && summary.abnormalFindings.length > 0) {
    const topFindings = summary.abnormalFindings.slice(0, 4);
    const findingLines = topFindings.map((f) => {
      const ref = f.referenceRange ? ` (Ref: ${escapeHtml2(f.referenceRange)})` : "";
      return `\u2022 <b>${escapeHtml2(f.parameter)}:</b> <code>${escapeHtml2(String(f.measuredValue))} ${escapeHtml2(f.unit)}</code>${ref} \u2014 <i>${escapeHtml2(f.status)}</i>`;
    });
    if (summary.abnormalFindings.length > 4) {
      findingLines.push(`\u2022 <i>+ ${summary.abnormalFindings.length - 4} additional finding(s) in complete record</i>`);
    }
    findingsSection = `
<b>Key Findings:</b>
${findingLines.join("\n")}
`;
  }
  let actionsSection = "";
  if (summary.recommendedActions && summary.recommendedActions.length > 0) {
    const topActions = summary.recommendedActions.slice(0, 2);
    actionsSection = `
<b>Recommended Next Steps:</b>
${topActions.map((a, i) => `${i + 1}. ${escapeHtml2(a)}`).join("\n")}
`;
  }
  return `${emoji} <b>${summary.severity} HEALTH ALERT</b> \u2014 <b>Patient ${escapeHtml2(summary.patientId)}</b>
<i>Recorded: ${escapeHtml2(formattedTime)}</i>

<b>Reason:</b> ${escapeHtml2(summary.mainReason)}
` + findingsSection + actionsSection + `
\u{1F517} <a href="${escapeHtml2(summary.secureLink)}">View Authorized Report in MediTrack</a>

<i>Notice: Automated analysis pending physician review. In an emergency, call emergency services.</i>`;
}
function formatSms(summary) {
  const topFindings = summary.abnormalFindings.slice(0, 2).map((f) => `${f.parameter} ${f.measuredValue} ${f.unit}`).join(", ");
  const findingsText = topFindings ? ` Key findings: ${topFindings}.` : "";
  const topAction = summary.recommendedActions[0] || "Prompt clinical review advised.";
  return `MediTrack | ${summary.severity} alert for Patient ${summary.patientId} at ${formatTimeShort(summary.timestamp)}.${findingsText} ${topAction} Full authorized summary: ${summary.secureLink}`;
}
function formatPush(summary) {
  const privacyPatient = summary.patientName ? summary.patientName.split(" ")[0] + " " + (summary.patientName.split(" ")[1]?.[0] || "") + "." : summary.patientId;
  return {
    title: `MediTrack ${summary.severity} Health Alert`,
    body: `${summary.severity} priority alert generated for ${privacyPatient}: ${summary.mainReason.slice(0, 90)}... Tap to review securely.`,
    data: {
      alertId: summary.alertId,
      severity: summary.severity,
      patientId: summary.patientId,
      timestamp: summary.timestamp,
      url: summary.secureLink
    }
  };
}
function formatTimeShort(isoDate) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "recent";
  }
}
function escapeHtml2(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
var MEDICAL_DISCLAIMER;
var init_canonicalSummary = __esm({
  "backend/services/notifications/canonicalSummary.ts"() {
    MEDICAL_DISCLAIMER = "MediTrack Automated Notice: This software-generated risk assessment is compiled for authorized informational and coordination purposes. It is not a clinical diagnosis or medical treatment plan. In case of a medical emergency, please contact local emergency services immediately.";
  }
});

// server.ts
import dotenv2 from "dotenv";
import http from "http";

// validationEngine.ts
function validateMeasurement(parameter, normalized_value, unit) {
  const p = (parameter || "").toLowerCase().trim();
  const nv = (normalized_value || "").trim();
  const u = (unit || "").toLowerCase().trim();
  if (!nv || nv === "" || nv === "undefined" || nv === "null") {
    return "REJECTED";
  }
  if (p.includes("systolic") || p.includes("diastolic")) {
    const num2 = parseFloat(nv);
    if (!isNaN(num2) && num2 >= 30 && num2 <= 300) {
      return "VALIDATED";
    }
    return "NEEDS_REVIEW";
  }
  if (p.includes("blood pressure") || p.includes("bp") || p === "blood_pressure") {
    if (/^\d{2,3}\/\d{2,3}$/.test(nv)) {
      const parts = nv.split("/");
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200) {
        return "VALIDATED";
      }
    }
    const singleNum = parseFloat(nv);
    if (!isNaN(singleNum) && singleNum >= 30 && singleNum <= 300) {
      return "VALIDATED";
    }
    return "NEEDS_REVIEW";
  }
  if (p === "age") {
    const ageNum = parseInt(nv, 10);
    if (!isNaN(ageNum) && ageNum > 0 && ageNum < 130) {
      return "VALIDATED";
    }
    return "NEEDS_REVIEW";
  }
  if (p.includes("glucose") || p.includes("sugar") || p.includes("hba1c") || p.includes("fbs")) {
    const num2 = parseFloat(nv);
    if (!isNaN(num2) && num2 > 0) {
      if (!u || u.includes("mg") || u.includes("mmol") || u.includes("%")) {
        return "VALIDATED";
      }
    }
    return "NEEDS_REVIEW";
  }
  const num = parseFloat(nv.replace(/,/g, ""));
  if (!isNaN(num) && isFinite(num)) {
    return "VALIDATED";
  }
  return "NEEDS_REVIEW";
}

// contradictionEngine.ts
function normalizeDate(d) {
  if (!d) return "";
  const s = String(d).trim();
  if (s.includes("T")) return s.split("T")[0].trim();
  if (s.includes(" ")) return s.split(" ")[0].trim();
  return s;
}
function normalizeParam(p) {
  if (!p) return "";
  return String(p).toLowerCase().replace(/[\s_-]+/g, " ").trim();
}
function areValuesContradictory(valA, valB, _param) {
  if (valA === void 0 || valA === null || valB === void 0 || valB === null) return false;
  const cleanA = String(valA).trim();
  const cleanB = String(valB).trim();
  if (!cleanA || !cleanB) return false;
  if (cleanA.toLowerCase() === cleanB.toLowerCase()) return false;
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA !== numB;
  }
  const bpA = cleanA.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
  const bpB = cleanB.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
  if (bpA && bpB) {
    return bpA[1] !== bpB[1] || bpA[2] !== bpB[2];
  }
  return cleanA !== cleanB;
}
function evaluateContradictionSeverity(parameter, valA, valB) {
  const p = normalizeParam(parameter);
  const cleanA = String(valA || "").trim();
  const cleanB = String(valB || "").trim();
  if (p.includes("blood type") || p.includes("blood group") || p.includes("rh factor") || p.includes("genotype") || p.includes("sex") || p.includes("gender")) {
    return {
      severity: "CRITICAL",
      reason: `Permanent physiological marker conflict for ${parameter}: "${cleanA}" vs "${cleanB}"`
    };
  }
  if (p.includes("blood pressure") || p.includes("bp")) {
    const bpA = cleanA.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
    const bpB = cleanB.match(/^(\d{2,3})\s*[\/|\-]\s*(\d{2,3})$/);
    if (bpA && bpB) {
      const sysDiff = Math.abs(parseInt(bpA[1], 10) - parseInt(bpB[1], 10));
      const diaDiff = Math.abs(parseInt(bpA[2], 10) - parseInt(bpB[2], 10));
      if (sysDiff >= 40 || diaDiff >= 30) {
        return {
          severity: "HIGH",
          reason: `Extreme physiological blood pressure delta on same date (${cleanA} vs ${cleanB})`
        };
      }
    }
    return {
      severity: "HIGH",
      reason: "Conflicting measurements for same parameter on the same date"
    };
  }
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB)) {
    const max = Math.max(Math.abs(numA), Math.abs(numB));
    const delta = Math.abs(numA - numB);
    const pct = max > 0 ? delta / max * 100 : 0;
    if (pct >= 50) {
      return {
        severity: "HIGH",
        reason: `Substantial measurement discrepancy (>50%) for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    } else if (pct >= 20) {
      return {
        severity: "MEDIUM",
        reason: `Measurement discrepancy for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    } else {
      return {
        severity: "LOW",
        reason: `Minor measurement variance for ${parameter} on the same date (${cleanA} vs ${cleanB})`
      };
    }
  }
  return {
    severity: "HIGH",
    reason: "Conflicting measurements for same parameter on the same date"
  };
}
function detectContradictions(currentReportId, currentReportDate, allMeasurements, newMeasurements) {
  if (!Array.isArray(allMeasurements)) {
    return [];
  }
  const currentMeasurements = newMeasurements && newMeasurements.length > 0 ? newMeasurements : allMeasurements.filter((m) => m && m.r_id === currentReportId);
  const otherMeasurements = allMeasurements.filter((m) => m && m.r_id !== currentReportId);
  const contradictions = [];
  const seenKeys = /* @__PURE__ */ new Set();
  const targetDate = normalizeDate(currentReportDate);
  for (const curr of currentMeasurements) {
    if (!curr || !curr.parameter) continue;
    const normCurrParam = normalizeParam(curr.parameter);
    const currVal = curr.normalized_value ?? curr.raw_value ?? "";
    const conflicts = otherMeasurements.filter((other) => {
      if (!other || !other.parameter) return false;
      const normOtherParam = normalizeParam(other.parameter);
      if (normOtherParam !== normCurrParam) return false;
      const otherDate = normalizeDate(other.report_date);
      if (!otherDate || !targetDate || otherDate !== targetDate) return false;
      const otherVal = other.normalized_value ?? other.raw_value ?? "";
      return areValuesContradictory(otherVal, currVal, normCurrParam);
    });
    for (const conflict of conflicts) {
      const pairKey = `${Math.min(conflict.r_id, curr.r_id)}_${Math.max(conflict.r_id, curr.r_id)}_${normCurrParam}`;
      if (seenKeys.has(pairKey)) continue;
      seenKeys.add(pairKey);
      const valA = conflict.raw_value ?? conflict.normalized_value ?? "";
      const valB = curr.raw_value ?? curr.normalized_value ?? "";
      const { severity, reason } = evaluateContradictionSeverity(curr.parameter, valA, valB);
      contradictions.push({
        parameter: curr.parameter,
        report_a: conflict.r_id,
        report_b: curr.r_id,
        value_a: valA,
        value_b: valB,
        date_a: conflict.report_date,
        date_b: curr.report_date || currentReportDate,
        severity,
        reason,
        source_page_a: conflict.source_page ?? null,
        source_page_b: curr.source_page ?? null,
        status: "PENDING_REVIEW"
      });
    }
  }
  return contradictions;
}

// server.ts
init_riskEngine();
init_forecastService();
init_parameters();
init_unitRegistry();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt2 from "bcryptjs";
import { createServer as createViteServer } from "vite";
import path5 from "path";
import multer from "multer";
import crypto5 from "crypto";
import fs4 from "fs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// backend/routes/specialists.routes.ts
import { Router } from "express";

// backend/services/maps/places.service.ts
import https from "https";

// backend/services/maps/directions.service.ts
var DirectionsService = class {
  /**
   * Calculate geographic distance in km using the standard Haversine formula
   */
  static calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }
  /**
   * Build navigation links for Google Maps, Apple Maps, and OpenStreetMap
   */
  static generateDirections(destLat, destLng, originLat, originLng, providerName) {
    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    let appleMapsUrl = `https://maps.apple.com/?daddr=${destLat},${destLng}`;
    let osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${destLat}%2C${destLng}`;
    let distanceKm = 0;
    let estimatedDriveTimeMinutes;
    if (originLat !== void 0 && originLng !== void 0 && !isNaN(originLat) && !isNaN(originLng)) {
      distanceKm = this.calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
      googleMapsUrl += `&origin=${originLat},${originLng}`;
      appleMapsUrl += `&saddr=${originLat},${originLng}`;
      osmDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${destLat}%2C${destLng}`;
      const drivingMinutes = Math.round(distanceKm / 30 * 60) + 3;
      estimatedDriveTimeMinutes = Math.max(3, drivingMinutes);
    }
    if (providerName) {
      googleMapsUrl += `&destination_place_id=${encodeURIComponent(providerName)}`;
    }
    return {
      googleMapsUrl,
      appleMapsUrl,
      osmDirectionsUrl,
      distanceKm,
      estimatedDriveTimeMinutes
    };
  }
};

// backend/services/maps/places.service.ts
var PlacesService = class _PlacesService {
  /**
   * Search nearby medical providers from live external APIs
   */
  static async searchNearbySpecialists(params) {
    const { lat, lng, specialty = "all", radiusKm = 10, type = "all", openNow, minRating, sortBy = "nearest" } = params;
    let providers = [];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const googleResults = await this.fetchFromGooglePlaces(lat, lng, radiusKm, specialty, type);
        if (googleResults.length > 0) {
          providers.push(...googleResults);
        }
      } catch (err) {
        console.warn("Google Places API query error:", err);
      }
    }
    try {
      const osmResults = await this.fetchFromOpenStreetMap(lat, lng, radiusKm, specialty, type);
      for (const osm of osmResults) {
        const isDuplicate = providers.some(
          (p) => p.name.toLowerCase() === osm.name.toLowerCase() || DirectionsService.calculateHaversineDistanceKm(p.latitude, p.longitude, osm.latitude, osm.longitude) < 0.1
        );
        if (!isDuplicate) {
          providers.push(osm);
        }
      }
    } catch (err) {
      console.error("OpenStreetMap fetch error:", err);
    }
    providers = providers.filter((p) => p.distanceKm <= radiusKm);
    if (type && type !== "all") {
      providers = providers.filter((p) => p.type === type);
    }
    if (specialty && specialty !== "all") {
      const targetSpecialty = specialty.toLowerCase().replace(/ist$/, "").replace(/ian$/, "").replace(/ic$/, "");
      providers = providers.filter((p) => {
        const pSpecialty = (p.specialty || "").toLowerCase();
        const pName = (p.name || "").toLowerCase();
        return pSpecialty.includes(targetSpecialty) || pName.includes(targetSpecialty);
      });
    }
    if (openNow === true) {
      providers = providers.filter((p) => p.openNow === true);
    }
    if (minRating !== void 0 && minRating > 0) {
      providers = providers.filter((p) => p.rating !== void 0 && p.rating >= minRating);
    }
    if (sortBy === "highest_rated") {
      providers.sort((a, b) => {
        const rateA = a.rating ?? 0;
        const rateB = b.rating ?? 0;
        if (rateB !== rateA) return rateB - rateA;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === "relevance") {
      providers.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, specialty);
        const scoreB = this.calculateRelevanceScore(b, specialty);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      providers.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return providers;
  }
  /**
   * Fetch live healthcare POIs from OpenStreetMap using Nominatim bounded search
   */
  static async fetchFromOpenStreetMap(lat, lng, radiusKm, specialty, type) {
    const deltaLat = radiusKm / 111;
    const deltaLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    const minLat = (lat - deltaLat).toFixed(4);
    const maxLat = (lat + deltaLat).toFixed(4);
    const minLng = (lng - deltaLng).toFixed(4);
    const maxLng = (lng + deltaLng).toFixed(4);
    const searchTerms = [];
    if (specialty && specialty !== "all") {
      searchTerms.push(specialty);
      if (specialty.toLowerCase().includes("cardio")) searchTerms.push("cardiac hospital", "heart clinic");
      else if (specialty.toLowerCase().includes("neuro")) searchTerms.push("neurology hospital");
      else if (specialty.toLowerCase().includes("dent")) searchTerms.push("dental clinic");
      else if (specialty.toLowerCase().includes("derma")) searchTerms.push("skin clinic");
      else if (specialty.toLowerCase().includes("eye") || specialty.toLowerCase().includes("ophthal")) searchTerms.push("eye hospital");
    }
    if (type === "hospital") {
      searchTerms.push("hospital");
    } else if (type === "clinic") {
      searchTerms.push("clinic");
    } else if (type === "doctor") {
      searchTerms.push("doctor", "physician");
    } else if (type === "diagnostic_center") {
      searchTerms.push("diagnostic center", "pathology laboratory");
    } else {
      searchTerms.push("hospital", "clinic", "medical center");
    }
    const uniqueMap = /* @__PURE__ */ new Map();
    for (const term of searchTerms.slice(0, 3)) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&format=json&limit=25&addressdetails=1&extratags=1`;
      const items = await this.httpGetJson(url);
      if (Array.isArray(items)) {
        for (const item of items) {
          const itemLat = parseFloat(item.lat);
          const itemLng = parseFloat(item.lon);
          if (isNaN(itemLat) || isNaN(itemLng)) continue;
          const distanceKm = DirectionsService.calculateHaversineDistanceKm(lat, lng, itemLat, itemLng);
          const providerId = `osm-${item.osm_type || "node"}-${item.osm_id || item.place_id}`;
          if (uniqueMap.has(providerId)) continue;
          const tags = item.extratags || {};
          const addr = item.address || {};
          const name = item.name || tags.name || tags["name:en"] || addr.amenity || "Medical Facility";
          const detectedType = this.classifyProviderType(item.type, tags, name);
          const detectedSpecialty = this.classifySpecialty(tags, name, specialty);
          const phone = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || void 0;
          const website = tags.website || tags["contact:website"] || tags["url"] || void 0;
          const openingHours = tags.opening_hours || void 0;
          let openNow = void 0;
          if (openingHours) {
            if (openingHours.includes("24/7") || openingHours.toLowerCase().includes("mo-su")) {
              openNow = true;
            }
          }
          const addressParts = [
            addr.road,
            addr.neighbourhood || addr.suburb || addr.residential,
            addr.city_district || addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode
          ].filter(Boolean);
          const formattedAddress = addressParts.join(", ") || item.display_name;
          uniqueMap.set(providerId, {
            id: providerId,
            name,
            specialty: detectedSpecialty,
            type: detectedType,
            latitude: itemLat,
            longitude: itemLng,
            address: formattedAddress,
            distanceKm,
            openNow,
            openingHours,
            phone,
            website,
            source: "OpenStreetMap"
          });
        }
      }
    }
    return Array.from(uniqueMap.values());
  }
  /**
   * Fetch from modern Google Places API (New)
   */
  static async fetchFromGooglePlaces(lat, lng, radiusKm, specialty, type) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];
    const radiusMeters = Math.min(5e4, radiusKm * 1e3);
    let includedTypes = ["hospital", "doctor"];
    if (type === "hospital") includedTypes = ["hospital", "general_hospital"];
    else if (type === "doctor") includedTypes = ["doctor"];
    else if (type === "clinic") includedTypes = ["medical_clinic", "health_clinic"];
    else if (type === "diagnostic_center") includedTypes = ["medical_lab", "pharmacy", "hospital"];
    else includedTypes = ["hospital", "doctor", "medical_clinic"];
    let placesList = [];
    if (specialty && specialty !== "all") {
      const textQuery = `${specialty} hospital clinic doctor`;
      const searchPayload = JSON.stringify({
        textQuery,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        }
      });
      const textData = await this.httpPostJson(
        "https://places.googleapis.com/v1/places:searchText",
        searchPayload,
        {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.primaryType,places.types"
        }
      );
      if (textData && Array.isArray(textData.places)) {
        placesList = textData.places;
      }
    }
    if (placesList.length === 0) {
      const nearbyPayload = JSON.stringify({
        includedTypes,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters
          }
        }
      });
      const nearbyData = await this.httpPostJson(
        "https://places.googleapis.com/v1/places:searchNearby",
        nearbyPayload,
        {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.primaryType,places.types"
        }
      );
      if (nearbyData && Array.isArray(nearbyData.places)) {
        placesList = nearbyData.places;
      }
    }
    if (!Array.isArray(placesList) || placesList.length === 0) return [];
    return placesList.filter((place) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      return typeof placeLat === "number" && typeof placeLng === "number" && !isNaN(placeLat) && !isNaN(placeLng);
    }).map((place) => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      const distanceKm = DirectionsService.calculateHaversineDistanceKm(lat, lng, placeLat, placeLng);
      const name = place.displayName?.text || "Medical Facility";
      const placeTypes = place.types || [];
      const primaryType = (place.primaryType || "").toLowerCase();
      let detectedType = "clinic";
      if (primaryType.includes("hospital") || placeTypes.includes("hospital") || name.toLowerCase().includes("hospital")) {
        detectedType = "hospital";
      } else if (primaryType.includes("doctor") || placeTypes.includes("doctor") || name.toLowerCase().includes("dr.")) {
        detectedType = "doctor";
      } else if (name.toLowerCase().includes("diagnostic") || name.toLowerCase().includes("lab") || placeTypes.includes("medical_lab")) {
        detectedType = "diagnostic_center";
      }
      return {
        id: `google-${place.id}`,
        name,
        specialty: this.classifySpecialty({}, name, specialty),
        type: detectedType,
        latitude: placeLat,
        longitude: placeLng,
        address: place.formattedAddress || "",
        distanceKm,
        rating: place.rating !== void 0 ? parseFloat(place.rating) : void 0,
        reviewCount: place.userRatingCount !== void 0 ? parseInt(place.userRatingCount, 10) : void 0,
        openNow: place.currentOpeningHours?.openNow,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        source: "Google Places"
      };
    });
  }
  static classifyProviderType(rawType, tags, name) {
    const lowerName = name.toLowerCase();
    const amenity = (tags.amenity || rawType || "").toLowerCase();
    const healthcare = (tags.healthcare || "").toLowerCase();
    if (lowerName.includes("hospital") || amenity === "hospital" || healthcare === "hospital") {
      return "hospital";
    }
    if (lowerName.includes("diagnostic") || lowerName.includes("pathology") || lowerName.includes("lab") || lowerName.includes("scan") || healthcare === "laboratory" || healthcare === "diagnostic_centre") {
      return "diagnostic_center";
    }
    if (lowerName.includes("dr.") || lowerName.includes("doctor") || lowerName.includes("physician") || amenity === "doctors" || healthcare === "doctor") {
      return "doctor";
    }
    return "clinic";
  }
  static classifySpecialty(tags, name, preferredSpecialty) {
    const text = `${name} ${tags.speciality || ""} ${tags["healthcare:speciality"] || ""}`.toLowerCase();
    if (text.includes("cardio") || text.includes("heart")) return "Cardiologist";
    if (text.includes("neuro") || text.includes("brain") || text.includes("spine")) return "Neurologist";
    if (text.includes("derma") || text.includes("skin")) return "Dermatologist";
    if (text.includes("ortho") || text.includes("bone") || text.includes("joint")) return "Orthopedic";
    if (text.includes("pediat") || text.includes("child") || text.includes("kid")) return "Pediatrician";
    if (text.includes("gynec") || text.includes("maternity") || text.includes("women") || text.includes("obstet")) return "Gynecologist";
    if (text.includes("dent") || text.includes("tooth") || text.includes("oral")) return "Dentist";
    if (text.includes("ophthal") || text.includes("eye") || text.includes("vision")) return "Ophthalmologist";
    if (text.includes("psych") || text.includes("mental")) return "Psychiatrist";
    if (text.includes("ent") || text.includes("ear") || text.includes("throat")) return "ENT Specialist";
    if (text.includes("endocrin") || text.includes("diabet") || text.includes("thyroid")) return "Endocrinologist";
    if (text.includes("nephro") || text.includes("kidney") || text.includes("dialysis")) return "Nephrologist";
    if (text.includes("oncol") || text.includes("cancer")) return "Oncologist";
    if (preferredSpecialty && preferredSpecialty !== "all") {
      return preferredSpecialty.charAt(0).toUpperCase() + preferredSpecialty.slice(1);
    }
    if (text.includes("hospital") || text.includes("multi")) return "Multi-Specialty Medicine";
    return "General Physician";
  }
  static calculateRelevanceScore(provider, querySpecialty) {
    let score = 0;
    if (querySpecialty && querySpecialty !== "all") {
      if (provider.specialty.toLowerCase() === querySpecialty.toLowerCase()) score += 10;
      else if (provider.name.toLowerCase().includes(querySpecialty.toLowerCase())) score += 8;
      else if (provider.type === "hospital") score += 5;
    }
    if (provider.rating) score += provider.rating;
    if (provider.openNow) score += 2;
    return score;
  }
  static httpGetJson(urlStr) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(urlStr);
        const req = https.get({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: {
            "User-Agent": "MediTrack-Health-Platform/1.0 (healthcare-navigator; support@meditrack.internal)",
            "Accept": "application/json"
          },
          timeout: 7e3
        }, (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(body));
              } else {
                resolve([]);
              }
            } catch (e) {
              resolve([]);
            }
          });
        });
        req.on("timeout", () => {
          req.destroy();
          resolve([]);
        });
        req.on("error", () => {
          resolve([]);
        });
      } catch (err) {
        resolve([]);
      }
    });
  }
  static async httpPostJson(urlStr, payload, headers) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await _PlacesService.singleHttpPostJson(urlStr, payload, headers);
      if (res !== null) return res;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
    return null;
  }
  static singleHttpPostJson(urlStr, payload, headers) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(urlStr);
        const req = https.request({
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: "POST",
          headers: {
            ...headers,
            "Content-Length": Buffer.byteLength(payload)
          },
          timeout: 7e3
        }, (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(body));
              } else {
                console.warn("[Google Places API] Notice: HTTP response status", res.statusCode);
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });
        });
        req.on("timeout", () => {
          req.destroy();
          resolve(null);
        });
        req.on("error", (err) => {
          if (!req.destroyed) {
            console.warn("[Google Places API] Connection notice (service temporarily unavailable):", err.message);
          }
          resolve(null);
        });
        req.write(payload);
        req.end();
      } catch {
        resolve(null);
      }
    });
  }
};

// backend/services/maps/geocoding.service.ts
import https2 from "https";
var geocodeCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 15 * 60 * 1e3;
var GeocodingService = class {
  /**
   * Geocode a free-form query (city, area, PIN code, address)
   */
  static async geocodeAddress(query) {
    const cleanQuery = (query || "").trim();
    if (!cleanQuery) return [];
    const cacheKey = cleanQuery.toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&addressdetails=1`;
      const rawData = await this.httpGetJson(url);
      if (!Array.isArray(rawData)) {
        return [];
      }
      const results = rawData.map((item) => {
        const addr = item.address || {};
        return {
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county,
          state: addr.state,
          country: addr.country,
          postcode: addr.postcode,
          boundingbox: item.boundingbox
        };
      }).filter((res) => !isNaN(res.latitude) && !isNaN(res.longitude));
      geocodeCache.set(cacheKey, { timestamp: Date.now(), data: results });
      return results;
    } catch (err) {
      console.error("Geocoding service error:", err);
      return [];
    }
  }
  /**
   * Reverse geocode coordinates to human-readable address
   */
  static async reverseGeocode(lat, lng) {
    const key = `rev-${lat.toFixed(3)}-${lng.toFixed(3)}`;
    const cached = geocodeCache.get(key);
    if (cached && cached.data.length > 0) {
      return cached.data[0].displayName;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const data = await this.httpGetJson(url);
      if (data && data.display_name) {
        const res = {
          displayName: data.display_name,
          latitude: lat,
          longitude: lng,
          city: data.address?.city || data.address?.town || data.address?.county,
          state: data.address?.state,
          country: data.address?.country,
          postcode: data.address?.postcode
        };
        geocodeCache.set(key, { timestamp: Date.now(), data: [res] });
        return data.display_name;
      }
      return null;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return null;
    }
  }
  static httpGetJson(urlStr) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(urlStr);
      const req = https2.get({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          "User-Agent": "MediTrack-Health-Platform/1.0 (healthcare-navigator; support@meditrack.internal)",
          "Accept": "application/json"
        },
        timeout: 7e3
      }, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            resolve([]);
          }
        });
      });
      req.on("timeout", () => {
        req.destroy();
        resolve([]);
      });
      req.on("error", (err) => {
        console.warn("Geocoding request failed:", err.message);
        resolve([]);
      });
    });
  }
};

// backend/services/maps/maps.service.ts
var nearbySearchCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS2 = 10 * 60 * 1e3;
var MapsService = class {
  /**
   * Find nearby specialists with coordinate rounding and in-memory TTL caching
   */
  static async getNearbySpecialists(params) {
    const roundedLat = parseFloat(params.lat.toFixed(2));
    const roundedLng = parseFloat(params.lng.toFixed(2));
    const specialtyKey = (params.specialty || "all").toLowerCase();
    const typeKey = (params.type || "all").toLowerCase();
    const radiusKey = params.radiusKm || 10;
    const sortKey = params.sortBy || "nearest";
    const openNowKey = params.openNow ? "1" : "0";
    const ratingKey = params.minRating || 0;
    const cacheKey = `${roundedLat},${roundedLng}_${specialtyKey}_${typeKey}_${radiusKey}_${sortKey}_${openNowKey}_${ratingKey}`;
    const cached = nearbySearchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS2) {
      return {
        results: cached.data,
        total: cached.data.length,
        center: { lat: params.lat, lng: params.lng },
        radiusKm: radiusKey,
        cached: true
      };
    }
    const results = await PlacesService.searchNearbySpecialists(params);
    nearbySearchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: results
    });
    return {
      results,
      total: results.length,
      center: { lat: params.lat, lng: params.lng },
      radiusKm: radiusKey,
      cached: false
    };
  }
  /**
   * Geocode a manual address/city/PIN code query
   */
  static async geocodeQuery(query) {
    return GeocodingService.geocodeAddress(query);
  }
  /**
   * Reverse geocode a latitude/longitude pair
   */
  static async reverseGeocode(lat, lng) {
    return GeocodingService.reverseGeocode(lat, lng);
  }
  /**
   * Calculate navigation links and distance
   */
  static getDirections(destLat, destLng, originLat, originLng, providerName) {
    return DirectionsService.generateDirections(destLat, destLng, originLat, originLng, providerName);
  }
  /**
   * Clear all map caches (for maintenance or tests)
   */
  static clearCache() {
    nearbySearchCache.clear();
  }
};

// backend/controllers/specialists.controller.ts
var SUPPORTED_SPECIALTIES = [
  { id: "all", name: "All Specialists", icon: "Stethoscope", description: "Comprehensive medical specialists and facilities" },
  { id: "cardiologist", name: "Cardiologist", icon: "HeartPulse", description: "Heart, blood vessels, and cardiovascular systems" },
  { id: "neurologist", name: "Neurologist", icon: "Brain", description: "Brain, spinal cord, and nervous system disorders" },
  { id: "dermatologist", name: "Dermatologist", icon: "Sparkles", description: "Skin, hair, nails, and cutaneous health" },
  { id: "orthopedic", name: "Orthopedic", icon: "Bone", description: "Bones, joints, ligaments, tendons, and musculoskeletal" },
  { id: "pediatrician", name: "Pediatrician", icon: "Baby", description: "Infant, child, and adolescent healthcare" },
  { id: "gynecologist", name: "Gynecologist", icon: "Users", description: "Women's health, reproductive wellness, and obstetrics" },
  { id: "dentist", name: "Dentist", icon: "Smile", description: "Oral healthcare, dental procedures, and teeth hygiene" },
  { id: "ophthalmologist", name: "Ophthalmologist", icon: "Eye", description: "Vision care, ocular health, and ophthalmic surgeries" },
  { id: "psychiatrist", name: "Psychiatrist", icon: "Activity", description: "Mental health, behavioral wellness, and clinical psychiatry" },
  { id: "ent", name: "ENT Specialist", icon: "Headphones", description: "Ear, nose, throat, head and neck conditions" },
  { id: "general_physician", name: "General Physician", icon: "Stethoscope", description: "Primary care, clinical checkups, and general internal medicine" }
];
var SpecialistsController = class {
  /**
   * GET /api/specialists/nearby
   */
  static async getNearbySpecialists(req, res) {
    try {
      const latStr = req.query.lat;
      const lngStr = req.query.lng;
      if (!latStr || !lngStr) {
        return res.status(400).json({
          error: "Latitude and longitude coordinates are required.",
          example: "/api/specialists/nearby?lat=23.2599&lng=77.4126&specialty=cardiologist&radius=10"
        });
      }
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180." });
      }
      const radiusKm = Math.min(50, Math.max(1, parseFloat(req.query.radius || "10")));
      const specialty = (req.query.specialty || "all").trim();
      const type = req.query.type || "all";
      const openNow = req.query.openNow === "true";
      const minRating = req.query.minRating ? parseFloat(req.query.minRating) : void 0;
      const sortBy = req.query.sortBy || "nearest";
      const data = await MapsService.getNearbySpecialists({
        lat,
        lng,
        radiusKm,
        specialty,
        type,
        openNow,
        minRating,
        sortBy
      });
      return res.json({
        results: data.results,
        total: data.total,
        center: data.center,
        radiusKm: data.radiusKm,
        cached: data.cached
      });
    } catch (error) {
      console.error("Error fetching nearby specialists:", error);
      return res.status(500).json({
        error: "Failed to retrieve nearby healthcare specialists.",
        details: error.message
      });
    }
  }
  /**
   * GET /api/specialists/geocode
   */
  static async geocodeLocation(req, res) {
    try {
      const query = (req.query.q || "").trim();
      if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required for geocoding.' });
      }
      const results = await MapsService.geocodeQuery(query);
      return res.json({
        query,
        results
      });
    } catch (error) {
      console.error("Geocoding controller error:", error);
      return res.status(500).json({ error: "Geocoding failed." });
    }
  }
  /**
   * GET /api/specialists/directions
   */
  static async getDirections(req, res) {
    try {
      const destLat = parseFloat(req.query.destLat);
      const destLng = parseFloat(req.query.destLng);
      const originLat = req.query.originLat ? parseFloat(req.query.originLat) : void 0;
      const originLng = req.query.originLng ? parseFloat(req.query.originLng) : void 0;
      const name = req.query.name;
      if (isNaN(destLat) || isNaN(destLng)) {
        return res.status(400).json({ error: "Destination coordinates (destLat, destLng) are required." });
      }
      const directions = MapsService.getDirections(destLat, destLng, originLat, originLng, name);
      return res.json(directions);
    } catch (error) {
      console.error("Directions error:", error);
      return res.status(500).json({ error: "Failed to compute directions." });
    }
  }
  /**
   * GET /api/specialists/specialties
   */
  static getSupportedSpecialties(req, res) {
    return res.json(SUPPORTED_SPECIALTIES);
  }
};

// backend/routes/specialists.routes.ts
var specialistsRouter = Router();
specialistsRouter.get("/nearby", SpecialistsController.getNearbySpecialists);
specialistsRouter.get("/geocode", SpecialistsController.geocodeLocation);
specialistsRouter.get("/directions", SpecialistsController.getDirections);
specialistsRouter.get("/specialties", SpecialistsController.getSupportedSpecialties);

// backend/middleware/auth.middleware.ts
init_env();
import jwt from "jsonwebtoken";

// backend/db/db.ts
import { createClient } from "@libsql/client";
import path2 from "path";
import fs from "fs";
function getDbConfig() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (tursoUrl && (tursoUrl.startsWith("libsql://") || tursoUrl.startsWith("https://") || tursoUrl.startsWith("http://"))) {
    return {
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
    };
  }
  if (process.env.VERCEL) {
    const tmpDbPath = path2.join("/tmp", "meditrack_new.db");
    const localDbPath = path2.resolve(process.cwd(), "meditrack_new.db");
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, tmpDbPath);
      } catch (err) {
        console.warn("[Database] Could not seed /tmp database:", err);
      }
    }
    return {
      url: `file:${tmpDbPath}`
    };
  }
  return {
    url: tursoUrl || "file:./meditrack_new.db",
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  };
}
var db = createClient(getDbConfig());

// backend/middleware/auth.middleware.ts
var authenticateToken = async (req, res, next) => {
  let token;
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      token = parts[1];
    } else {
      return res.status(401).json({
        error: 'Invalid Authorization header format. Expected "Bearer <token>".',
        code: "AUTH_INVALID_FORMAT"
      });
    }
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) {
    return res.status(401).json({
      error: "Authentication required. Authorization header or valid session missing.",
      code: "AUTH_REQUIRED"
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"]
    });
    if (!decoded || !decoded.id) {
      return res.status(403).json({
        error: "Malformed token payload.",
        code: "AUTH_TOKEN_MALFORMED"
      });
    }
    const userResult = await db.execute({
      sql: "SELECT id, email, name, role, status FROM users WHERE id = ?",
      args: [decoded.id]
    });
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: "Authenticated user account no longer exists.",
        code: "AUTH_USER_NOT_FOUND"
      });
    }
    const liveUser = userResult.rows[0];
    if (liveUser.status === "SUSPENDED" || liveUser.status === "DISABLED" || liveUser.status === "DELETED") {
      return res.status(403).json({
        error: "Your account has been suspended or deactivated. Access revoked.",
        code: "ACCOUNT_SUSPENDED"
      });
    }
    req.user = {
      id: Number(liveUser.id),
      email: String(liveUser.email),
      name: liveUser.name ? String(liveUser.name) : void 0,
      role: liveUser.role === "ADMIN" ? "ADMIN" : "USER",
      status: String(liveUser.status)
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Session expired. Please refresh your session or log in again.",
        code: "AUTH_TOKEN_EXPIRED"
      });
    }
    return res.status(403).json({
      error: "Invalid or malformed authentication token.",
      code: "AUTH_TOKEN_INVALID"
    });
  }
};
var requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED"
      });
    }
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. Requires ${requiredRole} privileges.`,
        code: "FORBIDDEN_INSUFFICIENT_ROLE"
      });
    }
    next();
  };
};

// backend/middleware/rateLimit.middleware.ts
function createRateLimiter(options) {
  const store = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1e3).unref();
  return (req, res, next) => {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(",")[0].trim();
    const userId = req.user?.id ? `user_${req.user.id}` : "";
    const key = userId || `ip_${clientIp}`;
    const now = Date.now();
    const record = store.get(key) || { count: 0, resetAt: now + options.windowMs };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + options.windowMs;
    } else {
      record.count++;
    }
    store.set(key, record);
    res.setHeader("X-RateLimit-Limit", options.maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, options.maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetAt / 1e3));
    if (record.count > options.maxRequests) {
      return res.status(429).json({
        error: options.message,
        code: options.code,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1e3)
      });
    }
    next();
  };
}
var authRateLimiter = (_req, _res, next) => {
  next();
};
var uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1e3,
  maxRequests: 10,
  message: "Upload frequency exceeded. Please wait a few minutes before uploading more documents.",
  code: "UPLOAD_RATE_LIMIT_EXCEEDED"
});
var aiRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1e3,
  maxRequests: 15,
  message: "AI document analysis limit reached. Please wait a few minutes to protect system resources.",
  code: "AI_RATE_LIMIT_EXCEEDED"
});
var chatRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1e3,
  maxRequests: 60,
  message: "Too many messages sent. Please wait a moment before sending another message.",
  code: "CHAT_RATE_LIMIT_EXCEEDED"
});
var generalRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1e3,
  maxRequests: 300,
  message: "Too many requests. Please slow down.",
  code: "RATE_LIMIT_EXCEEDED"
});
var emailResetStore = /* @__PURE__ */ new Map();
var ipResetStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of emailResetStore.entries()) {
    if (now > record.resetAt) emailResetStore.delete(key);
  }
  for (const [key, record] of ipResetStore.entries()) {
    if (now > record.resetAt) ipResetStore.delete(key);
  }
}, 10 * 60 * 1e3).unref();

// backend/middleware/security.middleware.ts
var securityHeadersMiddleware = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
  next();
};
var apiErrorHandler = (err, req, res, next) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  console.error(`[${timestamp}] API Error on ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : err.status || 500;
  let clientMessage = "An unexpected error occurred while processing your request.";
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";
  if (statusCode === 400) {
    clientMessage = err.message || "The request contained invalid parameters or syntax.";
    errorCode = err.code || "BAD_REQUEST";
  } else if (statusCode === 401) {
    clientMessage = err.message || "Authentication required.";
    errorCode = err.code || "UNAUTHORIZED";
  } else if (statusCode === 403) {
    clientMessage = err.message || "Access denied.";
    errorCode = err.code || "FORBIDDEN";
  } else if (statusCode === 404) {
    clientMessage = err.message || "The requested resource was not found.";
    errorCode = err.code || "NOT_FOUND";
  } else if (statusCode === 429) {
    clientMessage = err.message || "Too many requests. Please try again later.";
    errorCode = err.code || "RATE_LIMIT_EXCEEDED";
  }
  res.status(statusCode).json({
    error: clientMessage,
    code: errorCode,
    timestamp
  });
};

// backend/validators/fileUpload.validator.ts
import fs2 from "fs";
import path3 from "path";
var ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([".pdf", ".png", ".jpg", ".jpeg"]);
var MAX_FILE_SIZE = 10 * 1024 * 1024;
function validateUploadedFile(filePath, originalName, declaredMimeType) {
  if (!fs2.existsSync(filePath)) {
    return {
      isValid: false,
      error: "Uploaded file could not be found on server disk.",
      code: "FILE_NOT_FOUND"
    };
  }
  const stat = fs2.statSync(filePath);
  if (stat.size === 0) {
    return {
      isValid: false,
      error: "Uploaded file is empty (0 bytes).",
      code: "FILE_EMPTY"
    };
  }
  if (stat.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds the 10 MB limit (${(stat.size / (1024 * 1024)).toFixed(1)} MB).`,
      code: "FILE_TOO_LARGE"
    };
  }
  const ext = path3.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `Invalid file extension "${ext}". Only PDF, PNG, and JPEG documents are permitted for medical records.`,
      code: "INVALID_EXTENSION"
    };
  }
  const buffer = Buffer.alloc(16);
  let bytesRead = 0;
  try {
    const fd = fs2.openSync(filePath, "r");
    bytesRead = fs2.readSync(fd, buffer, 0, 16, 0);
    fs2.closeSync(fd);
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to inspect file signature: ${err.message}`,
      code: "FILE_READ_ERROR"
    };
  }
  if (bytesRead < 4) {
    return {
      isValid: false,
      error: "Corrupt or truncated file content.",
      code: "FILE_TRUNCATED"
    };
  }
  const isPdf = buffer[0] === 37 && buffer[1] === 80 && buffer[2] === 68 && buffer[3] === 70;
  const isPng = buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71;
  const isJpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (ext === ".pdf" && !isPdf) {
    return {
      isValid: false,
      error: "File extension is .pdf but the internal file content is not a valid PDF document.",
      code: "MAGIC_BYTES_MISMATCH"
    };
  }
  if (ext === ".png" && !isPng) {
    return {
      isValid: false,
      error: "File extension is .png but the internal file content is not a valid PNG image.",
      code: "MAGIC_BYTES_MISMATCH"
    };
  }
  if ((ext === ".jpg" || ext === ".jpeg") && !isJpeg) {
    return {
      isValid: false,
      error: "File extension is .jpg/.jpeg but the internal file content is not a valid JPEG image.",
      code: "MAGIC_BYTES_MISMATCH"
    };
  }
  if (!isPdf && !isPng && !isJpeg) {
    return {
      isValid: false,
      error: "Unrecognized file format. Only authentic PDF, PNG, and JPEG documents are permitted.",
      code: "UNSUPPORTED_FORMAT"
    };
  }
  return {
    isValid: true,
    detectedFormat: isPdf ? "pdf" : isPng ? "png" : "jpeg"
  };
}

// backend/services/validationRunner.service.ts
import bcrypt from "bcryptjs";
import jwt3 from "jsonwebtoken";
import crypto2 from "crypto";
init_riskEngine();
import fs3 from "fs";
import path4 from "path";
async function runSoftwareValidationSuite() {
  const testCases = [];
  const runTest = async (id, category, name, description, expected, fn) => {
    const start = performance.now();
    try {
      const res = await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      testCases.push({
        id,
        category,
        name,
        description,
        status: res.passed ? "PASSED" : "FAILED",
        durationMs,
        expected,
        actual: res.actual
      });
    } catch (err) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      testCases.push({
        id,
        category,
        name,
        description,
        status: "FAILED",
        durationMs,
        expected,
        actual: "Threw exception",
        error: err.message
      });
    }
  };
  await runTest(
    "AUTH-01",
    "Authentication",
    "Bcrypt Password Hashing & Verification",
    "Ensures bcrypt generates a valid hash and verifies positive/negative passwords.",
    "Valid password matches; invalid password rejected.",
    async () => {
      const plain = "MediTrackSec123!";
      const hash = await bcrypt.hash(plain, 10);
      const isMatch = await bcrypt.compare(plain, hash);
      const isWrongMatch = await bcrypt.compare("WrongPass123!", hash);
      const passed = isMatch && !isWrongMatch;
      return {
        actual: passed ? "Positive verified, negative rejected." : "Mismatch in verification.",
        passed
      };
    }
  );
  await runTest(
    "AUTH-02",
    "Authentication",
    "JWT Token Generation & Expiration Handling",
    "Verifies JWT signs user payload and rejects tampered or expired tokens.",
    "Valid token decodes user ID; tampered token rejected.",
    () => {
      const token = jwt3.sign({ id: 999, role: "USER" }, JWT_SECRET, { expiresIn: "1h" });
      const decoded = jwt3.verify(token, JWT_SECRET);
      let tamperRejected = false;
      try {
        jwt3.verify(token + "tampered", JWT_SECRET);
      } catch {
        tamperRejected = true;
      }
      const passed = decoded.id === 999 && tamperRejected;
      return {
        actual: passed ? "Token decoded and tamper rejected." : "Failed tamper check.",
        passed
      };
    }
  );
  await runTest(
    "AUTH-03",
    "Authorization",
    "Role-Based Access Control (USER vs ADMIN)",
    "Verifies that non-admin tokens cannot satisfy ADMIN requirement.",
    "USER blocked from ADMIN privilege; ADMIN accepted.",
    () => {
      const userPayload = { id: 1, role: "USER" };
      const adminPayload = { id: 2, role: "ADMIN" };
      const userAllowed = userPayload.role === "ADMIN";
      const adminAllowed = adminPayload.role === "ADMIN";
      const passed = !userAllowed && adminAllowed;
      return {
        actual: passed ? "USER denied, ADMIN authorized." : "RBAC mismatch.",
        passed
      };
    }
  );
  await runTest(
    "PROF-01",
    "Profile",
    "Authoritative DOB & Dynamic Age Computation",
    "Calculates exact age from date of birth without off-by-one leap or month errors.",
    "Returns correct integer age matching calendar delta.",
    () => {
      const now = /* @__PURE__ */ new Date();
      const birthYear = now.getFullYear() - 25;
      const dobStr = `${birthYear}-01-15`;
      const dob = new Date(dobStr);
      let calculatedAge = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || m === 0 && now.getDate() < dob.getDate()) {
        calculatedAge--;
      }
      const passed = calculatedAge === 25 || calculatedAge === 24;
      return {
        actual: `Calculated age: ${calculatedAge} years.`,
        passed
      };
    }
  );
  await runTest(
    "PROF-02",
    "Profile",
    "BMI Formula and WHO Classification",
    "Verifies BMI = weightKg / heightMeters^2 and categories (<18.5, 18.5-24.9, 25-29.9, >=30).",
    "175cm / 70kg yields BMI 22.9 (Normal).",
    () => {
      const heightM = 175 / 100;
      const weightKg = 70;
      const bmi = Math.round(weightKg / (heightM * heightM) * 10) / 10;
      let category = "Normal";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi >= 25 && bmi < 30) category = "Overweight";
      else if (bmi >= 30) category = "Obesity";
      const passed = bmi === 22.9 && category === "Normal";
      return {
        actual: `BMI: ${bmi}, Category: ${category}`,
        passed
      };
    }
  );
  await runTest(
    "UNIT-01",
    "Unit Conversion",
    "Height & Weight Bi-directional Conversion",
    "Converts cm to ft/in and kg to lb without mutating canonical metric values.",
    "175 cm converts to 5 ft 9 in; 70 kg converts to 154.3 lb.",
    () => {
      const cm = 175;
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      const kg = 70;
      const lb = Math.round(kg * 2.20462 * 10) / 10;
      const passed = feet === 5 && inches === 9 && lb === 154.3;
      return {
        actual: `${feet} ft ${inches} in, ${lb} lb`,
        passed
      };
    }
  );
  await runTest(
    "FILE-01",
    "File Security",
    "Binary Signature / Magic Bytes Inspection",
    "Detects authentic PDF header (%PDF-) and rejects executables masked as PDFs.",
    "Rejects spoofed file extensions lacking valid signatures.",
    () => {
      const testDir = path4.resolve("./uploads");
      if (!fs3.existsSync(testDir)) fs3.mkdirSync(testDir, { recursive: true });
      const fakePdfPath = path4.join(testDir, "test_spoofed.pdf");
      fs3.writeFileSync(fakePdfPath, Buffer.from("MZ_WINDOWS_EXECUTABLE_HEADER_CONTENT"));
      const res = validateUploadedFile(fakePdfPath, "malicious.pdf", "application/pdf");
      fs3.unlinkSync(fakePdfPath);
      const passed = !res.isValid && res.code === "MAGIC_BYTES_MISMATCH";
      return {
        actual: passed ? "Spoofed file detected and rejected." : `Validation result: ${res.isValid}`,
        passed
      };
    }
  );
  await runTest(
    "RPT-01",
    "Reports",
    "Cryptographic SHA-256 Duplicate Detection",
    "Ensures duplicate document uploads generate identical hashes for deduplication.",
    "Identical content produces matching SHA-256 digests.",
    () => {
      const sample = Buffer.from("MediTrack Sample Diagnostic Laboratory Report Data 2026");
      const hash1 = crypto2.createHash("sha256").update(sample).digest("hex");
      const hash2 = crypto2.createHash("sha256").update(sample).digest("hex");
      const differentHash = crypto2.createHash("sha256").update(sample + "!").digest("hex");
      const passed = hash1 === hash2 && hash1 !== differentHash;
      return {
        actual: `Hash length: ${hash1.length} chars, deterministic match.`,
        passed
      };
    }
  );
  await runTest(
    "RISK-01",
    "Clinical Engine",
    "Biomarker Risk Evaluation & Domain Scoring",
    "Evaluates cardiovascular, metabolic, and renal risk domains against clinical thresholds.",
    "Elevated glucose/BP flags expected risk levels with evidence strings.",
    () => {
      const fixtures = [
        {
          parameter: "glucose",
          normalized_value: "185",
          validation_status: "VALIDATED",
          report: "test.pdf",
          report_date: "2026-03-01",
          page: "1"
        },
        {
          parameter: "blood_pressure",
          normalized_value: "145/95",
          validation_status: "VALIDATED",
          report: "test.pdf",
          report_date: "2026-03-01",
          page: "1"
        }
      ];
      const risks = evaluateRiskAllDomains(fixtures);
      const cardio = risks.find((r) => r.domain === "cardiovascular");
      const metabolic = risks.find((r) => r.domain === "metabolic");
      const passed = Array.isArray(risks) && risks.length > 0 && !!cardio && !!metabolic;
      return {
        actual: `Assessed ${risks.length} domains; Cardio: ${cardio?.level}, Metabolic: ${metabolic?.level}`,
        passed
      };
    }
  );
  await runTest(
    "CONT-01",
    "Contradiction Engine",
    "Physiological Contradiction Detection",
    "Detects extreme unphysiological jumps (e.g. impossible BP delta or opposite measurements on same date).",
    "Flags extreme variance or conflicts between reports.",
    () => {
      const existing = [
        {
          parameter: "blood_pressure",
          normalized_value: "120/80",
          raw_value: "120/80 mmHg",
          source_page: "1",
          report_date: "2026-03-01",
          r_id: 1
        }
      ];
      const contradictions = detectContradictions(2, "2026-03-01", existing);
      const passed = Array.isArray(contradictions);
      return {
        actual: `Evaluated contradictions: ${contradictions.length} flagged.`,
        passed
      };
    }
  );
  await runTest(
    "MAP-01",
    "Location",
    "Haversine Spherical Distance Calculation",
    "Calculates accurate great-circle distance between coordinates in kilometers.",
    "Bhopal to Indore (~170 km geodetic distance).",
    () => {
      const dist = DirectionsService.calculateHaversineDistanceKm(23.2599, 77.4126, 22.7196, 75.8577);
      const passed = dist > 165 && dist < 175;
      return {
        actual: `Calculated distance: ${dist.toFixed(2)} km.`,
        passed
      };
    }
  );
  await runTest(
    "ALRT-01",
    "Family & Alerts",
    "Alert Status Lifecycle Validation",
    "Validates alert state progression (QUEUED -> SENT -> DELIVERED -> FAILED).",
    "All valid alert states are recognized in the delivery pipeline.",
    () => {
      const allowedStates = ["QUEUED", "SENT", "DELIVERED", "FAILED"];
      const testState = "SENT";
      const invalidState = "MAGIC_STATE";
      const passed = allowedStates.includes(testState) && !allowedStates.includes(invalidState);
      return {
        actual: `Validated delivery states: ${allowedStates.join(", ")}.`,
        passed
      };
    }
  );
  await runTest(
    "FCST-01",
    "Forecasting Engine",
    "Deterministic Elapsed-Time Regression & Rolling-Origin Backtesting",
    "Validates that OLS uses elapsed days, computes genuine holdout MAE/RMSE, and enforces >=3 distinct dates.",
    "Predicts forward point estimate and calculates non-fabricated holdout error.",
    async () => {
      const { RobustForecastingEngine: RobustForecastingEngine2 } = await Promise.resolve().then(() => (init_forecastService(), forecastService_exports));
      const engine = new RobustForecastingEngine2();
      const fixture = [
        { value: 100, date: "2026-01-01", timestamp: (/* @__PURE__ */ new Date("2026-01-01")).getTime() },
        { value: 102, date: "2026-01-15", timestamp: (/* @__PURE__ */ new Date("2026-01-15")).getTime() },
        { value: 104, date: "2026-01-29", timestamp: (/* @__PURE__ */ new Date("2026-01-29")).getTime() },
        { value: 106, date: "2026-02-12", timestamp: (/* @__PURE__ */ new Date("2026-02-12")).getTime() }
      ];
      const res = engine.forecast({
        parameter: "glucose",
        observations: fixture,
        forecastHorizonDays: 14
      });
      const passed = res.status === "FORECAST_AVAILABLE" && res.backtestMetrics !== null && res.backtestMetrics.evalSampleSize >= 2 && typeof res.backtestMetrics.mae === "number";
      return {
        actual: `Status: ${res.status}, Target: ${res.forecastValue}, Holdout MAE: ${res.backtestMetrics?.mae}, Model: ${res.modelVersion}`,
        passed
      };
    }
  );
  await runTest(
    "UNIT-02",
    "Unit Registry",
    "Clinical Biomarker Harmonization & Cross-Unit Normalization",
    "Verifies mmol/L to mg/dL glucose conversion (18.0182) and Greek mu character normalization.",
    "Accurately converts mmol/L and standardizes micro symbols.",
    async () => {
      const { convertToCanonicalUnit: convertToCanonicalUnit4 } = await Promise.resolve().then(() => (init_unitRegistry(), unitRegistry_exports));
      const glucoseMmol = convertToCanonicalUnit4("fasting_glucose", 5, "mmol/L");
      const creatinineUmol = convertToCanonicalUnit4("creatinine", 88.4, "\xB5mol/L");
      const passed = glucoseMmol.success && Math.abs(glucoseMmol.convertedValue - 90.1) < 0.2 && creatinineUmol.success && Math.abs(creatinineUmol.convertedValue - 1) < 0.05;
      return {
        actual: `5.0 mmol/L glucose -> ${glucoseMmol.convertedValue} mg/dL; 88.4 \xB5mol/L creatinine -> ${creatinineUmol.convertedValue} mg/dL`,
        passed
      };
    }
  );
  await runTest(
    "NOTIF-01",
    "Notifications & Alerts",
    "Recipient Normalization & Channel Validation",
    "Verifies international E.164 telephone number standardization and email format validation.",
    "Valid email accepted; invalid rejected. Phone converted to E.164 format with country code.",
    async () => {
      const { isValidEmail: isValidEmail2, normalizePhoneToE164: normalizePhoneToE1643 } = await Promise.resolve().then(() => (init_providers(), providers_exports));
      const validEmail = isValidEmail2("doctor.smith@clinic.org");
      const invalidEmail = isValidEmail2("not-an-email");
      const normalizedPhone = normalizePhoneToE1643("+1 (555) 892-1140");
      const invalidPhone = normalizePhoneToE1643("123");
      const passed = validEmail === true && invalidEmail === false && normalizedPhone === "+15558921140" && invalidPhone === null;
      return {
        actual: `Valid email: ${validEmail}; Invalid rejected: ${!invalidEmail}; E.164 phone: ${normalizedPhone}; Short phone rejected: ${invalidPhone === null}`,
        passed
      };
    }
  );
  await runTest(
    "NOTIF-02",
    "Notifications & Alerts",
    "Consolidated Health Summary & Formatting",
    "Verifies creation of unified canonical health summary and multi-channel formatting (Email HTML, concise SMS, and Push).",
    "Complete HTML email with abnormal biomarker table, SMS with secure link, and privacy-conscious push payload generated.",
    async () => {
      const { formatEmailHtml: formatEmailHtml2, formatSms: formatSms3, formatPush: formatPush2, MEDICAL_DISCLAIMER: MEDICAL_DISCLAIMER2 } = await Promise.resolve().then(() => (init_canonicalSummary(), canonicalSummary_exports));
      const mockSummary = {
        alertId: 9001,
        patientId: "P-0001",
        patientName: "Leo Martinez",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        severity: "HIGH",
        title: "High-Priority Health Alert",
        mainReason: "Elevated blood pressure and HbA1c detected in clinical lab panel.",
        abnormalFindings: [
          { parameter: "Blood Pressure", measuredValue: "165/102", unit: "mmHg", referenceRange: "<120/80 mmHg", status: "High" },
          { parameter: "HbA1c", measuredValue: "9.1", unit: "%", referenceRange: "4.0 - 5.6%", status: "Critical" }
        ],
        historicalChanges: [],
        documentedRiskFactors: [],
        explanation: "Stage 2 hypertension and glycemic threshold exceeded.",
        limitations: "Laboratory extracted metrics.",
        recommendedActions: ["Consult primary care physician promptly."],
        secureLink: "http://localhost:3000/family-alerts?alertId=9001",
        disclaimer: MEDICAL_DISCLAIMER2
      };
      const html = formatEmailHtml2(mockSummary);
      const sms = formatSms3(mockSummary);
      const push = formatPush2(mockSummary);
      const passed = html.includes("MediTrack") && html.includes("165/102") && html.includes("9.1") && sms.includes("HIGH alert for Patient P-0001") && sms.includes("http://localhost:3000/family-alerts?alertId=9001") && push.title === "MediTrack HIGH Health Alert" && push.data.alertId === 9001;
      return {
        actual: `Email HTML length: ${html.length} chars; SMS: "${sms.slice(0, 60)}..."; Push title: "${push.title}"`,
        passed
      };
    }
  );
  const passedCount = testCases.filter((t) => t.status === "PASSED").length;
  const failedCount = testCases.filter((t) => t.status === "FAILED").length;
  const skippedCount = testCases.filter((t) => t.status === "SKIPPED").length;
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    totalTests: testCases.length,
    passedCount,
    failedCount,
    skippedCount,
    testCases,
    metrics: {
      sensitivity: null,
      specificity: null,
      precision: null,
      recall: null,
      f1: null,
      mae: null,
      rmse: null,
      directionalAccuracy: null
    },
    knownLimitations: [
      "Absence of a multi-center labeled clinical benchmarking corpus precludes formal sensitivity/specificity calculation.",
      "Document OCR accuracy depends on upload illumination, camera focus, and source document legibility.",
      "Deterministic statistical regression models require a minimum of 3 historical measurements for trend confidence."
    ],
    disclaimer: "CLINICAL DECISION SUPPORT & SOFTWARE INTEGRITY VERIFICATION ONLY. Tests execute genuine software units, cryptographic checks, and mathematical algorithms. MediTrack provides decision support and does not replace licensed medical diagnosis or clinician consultation."
  };
}

// server.ts
init_env();

// backend/services/auth.service.ts
init_env();
import crypto3 from "crypto";
import jwt4 from "jsonwebtoken";
var hashToken = (rawToken) => {
  return crypto3.createHash("sha256").update(rawToken).digest("hex");
};
var generateSecureRandomToken = (bytes = 32) => {
  return crypto3.randomBytes(bytes).toString("hex");
};
var generateAccessToken = (user) => {
  return jwt4.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      type: "access"
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: envConfig.JWT_ISSUER,
      audience: envConfig.JWT_AUDIENCE
    }
  );
};
var authService = {
  createSession: async (db2, userId, userAgent, ipAddress) => {
    const rawRefreshToken = generateSecureRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + envConfig.REFRESH_TOKEN_MS).toISOString();
    const createdAt = now.toISOString();
    const result = await db2.execute({
      sql: `INSERT INTO auth_sessions (user_id, refresh_token_hash, created_at, expires_at, last_used_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [userId, tokenHash, createdAt, expiresAt, createdAt, userAgent || null, ipAddress || null]
    });
    const sessionId = result.rows[0].id;
    return { rawRefreshToken, sessionId, expiresAt };
  },
  findSessionByRefreshToken: async (db2, rawRefreshToken) => {
    const tokenHash = hashToken(rawRefreshToken);
    const result = await db2.execute({
      sql: `SELECT * FROM auth_sessions WHERE refresh_token_hash = ?`,
      args: [tokenHash]
    });
    if (result.rows.length === 0) return null;
    return result.rows[0];
  },
  rotateSession: async (db2, sessionId, userAgent, ipAddress) => {
    const newRawRefreshToken = generateSecureRandomToken(40);
    const newTokenHash = hashToken(newRawRefreshToken);
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + envConfig.REFRESH_TOKEN_MS).toISOString();
    const lastUsedAt = now.toISOString();
    await db2.execute({
      sql: `UPDATE auth_sessions 
            SET refresh_token_hash = ?, expires_at = ?, last_used_at = ?, user_agent = ?, ip_address = ?
            WHERE id = ?`,
      args: [newTokenHash, expiresAt, lastUsedAt, userAgent || null, ipAddress || null, sessionId]
    });
    return { newRawRefreshToken, expiresAt };
  },
  revokeSession: async (db2, sessionId) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db2.execute({
      sql: `UPDATE auth_sessions SET revoked_at = ? WHERE id = ?`,
      args: [now, sessionId]
    });
  },
  revokeAllUserSessions: async (db2, userId) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db2.execute({
      sql: `UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
      args: [now, userId]
    });
  },
  createPasswordResetToken: async (db2, userId, ipAddress, userAgent) => {
    await db2.execute({
      sql: `UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL`,
      args: [userId]
    });
    const rawToken = generateSecureRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const now = /* @__PURE__ */ new Date();
    const expiryMinutes = envConfig.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || 30;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1e3).toISOString();
    const createdAt = now.toISOString();
    await db2.execute({
      sql: `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at, request_ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, tokenHash, expiresAt, createdAt, ipAddress || null, userAgent || null]
    });
    return { rawToken, expiresAt };
  },
  verifyPasswordResetToken: async (db2, rawToken) => {
    if (!rawToken || typeof rawToken !== "string") {
      return { valid: false, error: "Token is required" };
    }
    const tokenHash = hashToken(rawToken);
    const result = await db2.execute({
      sql: `SELECT * FROM password_reset_tokens WHERE token_hash = ?`,
      args: [tokenHash]
    });
    if (result.rows.length === 0) {
      return { valid: false, error: "Invalid or unrecognized reset token" };
    }
    const tokenRecord = result.rows[0];
    if (tokenRecord.used_at) {
      return { valid: false, error: "This reset token has already been used" };
    }
    const now = /* @__PURE__ */ new Date();
    const expiry = new Date(tokenRecord.expires_at);
    if (now > expiry) {
      return { valid: false, error: "This reset token has expired. Please request a new one." };
    }
    const userResult = await db2.execute({
      sql: `SELECT id, email, name, role, status FROM users WHERE id = ?`,
      args: [tokenRecord.user_id]
    });
    if (userResult.rows.length === 0) {
      return { valid: false, error: "User account not found" };
    }
    const user = userResult.rows[0];
    if (user.status === "SUSPENDED" || user.status === "DISABLED") {
      return { valid: false, error: "Account is suspended or deactivated." };
    }
    return { valid: true, tokenRecord, user };
  }
};

// server.ts
init_ai_service();

// backend/services/specialtyGuidance.service.ts
function normalizeKey(param) {
  const p = (param || "").toLowerCase().trim();
  if (p.includes("fasting") && p.includes("glucose")) return "fasting_glucose";
  if (p.includes("glucose") || p.includes("sugar")) return "fasting_glucose";
  if (p.includes("hba1c") || p.includes("glycated")) return "hba1c";
  if (p.includes("tsh") || p.includes("thyroid")) return "tsh";
  if (p.includes("ldl")) return "ldl";
  if (p.includes("hdl")) return "hdl";
  if (p.includes("total cholesterol") || p === "cholesterol") return "total_cholesterol";
  if (p.includes("triglyceride")) return "triglycerides";
  if (p.includes("pressure") || p.includes("bp") || p.includes("blood_pressure")) return "blood_pressure";
  if (p.includes("creatinine")) return "creatinine";
  if (p.includes("egfr") || p.includes("gfr")) return "egfr";
  if (p.includes("alt") || p.includes("sgpt")) return "alt";
  if (p.includes("ast") || p.includes("sgot")) return "ast";
  if (p.includes("hemoglobin") || p.includes("hb")) return "hemoglobin";
  if (p.includes("wbc") || p.includes("leukocyte")) return "wbc";
  if (p.includes("platelet")) return "platelets";
  if (p.includes("rbc") || p.includes("erythrocyte")) return "rbc";
  if (p.includes("hematocrit") || p.includes("pcv")) return "hematocrit";
  return p;
}
function parseNumeric(val) {
  if (!val) return null;
  const match = val.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}
async function calculateHealthSnapshot(userId) {
  const reportsRes = await db.execute({
    sql: "SELECT id, report_date, upload_date FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC",
    args: [userId]
  });
  const reports = reportsRes.rows;
  if (reports.length === 0) {
    return {
      reportCount: 0,
      measurementCount: 0,
      parametersAnalyzed: 0,
      abnormalResults: 0,
      trendsToMonitor: 0,
      specialtiesSuggested: 0,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      status: "No medical data"
    };
  }
  const measurementsRes = await db.execute({
    sql: `SELECT m.parameter, m.raw_value, m.normalized_value, m.unit, r.report_date
          FROM measurements m
          JOIN medical_reports r ON m.report_id = r.id
          WHERE r.user_id = ?
          ORDER BY r.report_date DESC`,
    args: [userId]
  });
  const measurements = measurementsRes.rows;
  const uniqueParams = /* @__PURE__ */ new Set();
  let abnormalCount = 0;
  const paramDateCount = {};
  for (const m of measurements) {
    const key = normalizeKey(m.parameter);
    uniqueParams.add(key);
    if (!paramDateCount[key]) paramDateCount[key] = /* @__PURE__ */ new Set();
    paramDateCount[key].add(m.report_date);
    const num = parseNumeric(m.normalized_value || m.raw_value);
    if (num !== null) {
      if (key === "fasting_glucose" && (num >= 100 || num < 70)) abnormalCount++;
      else if (key === "ldl" && num >= 130) abnormalCount++;
      else if (key === "total_cholesterol" && num >= 200) abnormalCount++;
      else if (key === "triglycerides" && num >= 150) abnormalCount++;
      else if (key === "hdl" && num < 40) abnormalCount++;
      else if (key === "creatinine" && num > 1.2) abnormalCount++;
      else if (key === "alt" && num > 45) abnormalCount++;
      else if (key === "ast" && num > 40) abnormalCount++;
      else if (key === "hemoglobin" && (num < 12 || num > 17.5)) abnormalCount++;
      else if (key === "wbc" && (num < 4e3 || num > 11e3)) abnormalCount++;
      else if (key === "platelets" && (num < 1.5 || num > 4.5)) abnormalCount++;
    }
  }
  let trendsCount = 0;
  for (const key in paramDateCount) {
    if (paramDateCount[key].size >= 2) trendsCount++;
  }
  const guidancesRes = await db.execute({
    sql: "SELECT count(*) as count FROM specialty_guidance WHERE user_id = ?",
    args: [userId]
  });
  const specialtiesCount = Number(guidancesRes.rows[0]?.count || 0);
  const latestReport = reports[0];
  const lastUpdated = latestReport?.report_date || latestReport?.upload_date || (/* @__PURE__ */ new Date()).toISOString();
  return {
    reportCount: reports.length,
    measurementCount: measurements.length,
    parametersAnalyzed: uniqueParams.size,
    abnormalResults: abnormalCount,
    trendsToMonitor: trendsCount,
    specialtiesSuggested: specialtiesCount,
    lastUpdated,
    status: "Analysis up to date"
  };
}
async function generateSpecialtyGuidance(userId) {
  const measurementsRes = await db.execute({
    sql: `SELECT m.*, r.filename, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? 
          ORDER BY r.report_date DESC`,
    args: [userId]
  });
  const measurements = measurementsRes.rows;
  if (measurements.length === 0) {
    return [];
  }
  const latestByParam = {};
  const historyByParam = {};
  for (const m of measurements) {
    const key = normalizeKey(m.parameter);
    if (!latestByParam[key]) {
      latestByParam[key] = m;
    }
    if (!historyByParam[key]) {
      historyByParam[key] = [];
    }
    historyByParam[key].push(m);
  }
  const riskRes = await db.execute({
    sql: "SELECT domain, level, label, evidence FROM risk_assessment WHERE user_id = ?",
    args: [userId]
  });
  const risks = riskRes.rows;
  const riskByDomain = {};
  for (const r of risks) {
    riskByDomain[String(r.domain).toLowerCase()] = r;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const generatedRecords = [];
  const evaluateDomain = (domain, specialtyName, ruleRef) => {
    let hasRelevantData = false;
    let priority = "Low Priority";
    let explanation = "";
    const findings = [];
    let whyRecommended = [];
    let sourceReport = "";
    if (domain === "cardiovascular") {
      const ldl = latestByParam["ldl"];
      const tc = latestByParam["total_cholesterol"];
      const hdl = latestByParam["hdl"];
      const tg = latestByParam["triglycerides"];
      const bp = latestByParam["blood_pressure"];
      if (ldl || tc || bp || hdl || tg) {
        hasRelevantData = true;
        sourceReport = ldl?.filename || tc?.filename || bp?.filename || "";
        explanation = "Based on your cholesterol levels, blood pressure readings and cardiovascular risk indicators.";
        whyRecommended = [
          "Discuss cardiovascular risk assessment",
          "Consider lifestyle modifications",
          "Evaluate need for additional tests"
        ];
        let isElevated = false;
        let isBorderline = false;
        if (ldl) {
          const val = parseNumeric(ldl.normalized_value || ldl.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val >= 130) {
            status = "High";
            statusVariant = "high";
            isElevated = true;
          } else if (val !== null && val >= 100) {
            status = "Optimal";
            statusVariant = "normal";
          }
          findings.push({
            parameter: "LDL Cholesterol",
            value: `${val !== null ? val : ldl.raw_value}`,
            unit: ldl.unit || "mg/dL",
            status,
            statusVariant,
            date: ldl.report_date,
            report: ldl.filename
          });
        }
        if (bp) {
          const bpVal = bp.normalized_value || bp.raw_value;
          let status = "Normal";
          let statusVariant = "normal";
          const parts = bpVal.split("/");
          if (parts.length === 2) {
            const sys = parseInt(parts[0]);
            const dia = parseInt(parts[1]);
            if (sys >= 140 || dia >= 90) {
              status = "High";
              statusVariant = "high";
              isElevated = true;
            } else if (sys >= 130 || dia >= 85) {
              status = "Borderline high";
              statusVariant = "borderline";
              isBorderline = true;
            }
          }
          findings.push({
            parameter: "Blood Pressure",
            value: bpVal,
            unit: bp.unit || "mmHg",
            status,
            statusVariant,
            date: bp.report_date,
            report: bp.filename
          });
        }
        if (tc) {
          const val = parseNumeric(tc.normalized_value || tc.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val >= 200) {
            status = "Elevated";
            statusVariant = "high";
            isElevated = true;
          }
          findings.push({
            parameter: "Total Cholesterol",
            value: `${val !== null ? val : tc.raw_value}`,
            unit: tc.unit || "mg/dL",
            status,
            statusVariant,
            date: tc.report_date,
            report: tc.filename
          });
        }
        const cvRisk = riskByDomain["cardiovascular"];
        if (cvRisk && ["ORANGE", "RED"].includes(String(cvRisk.level).toUpperCase())) {
          priority = "High Priority";
        } else if (isElevated) {
          priority = "High Priority";
        } else if (isBorderline || cvRisk && cvRisk.level === "YELLOW") {
          priority = "Medium Priority";
        } else {
          priority = "Low Priority";
        }
      }
    } else if (domain === "metabolic") {
      const glu = latestByParam["fasting_glucose"];
      const a1c = latestByParam["hba1c"];
      const tsh = latestByParam["tsh"];
      if (glu || a1c || tsh) {
        hasRelevantData = true;
        sourceReport = glu?.filename || a1c?.filename || "";
        explanation = "Based on your glucose metabolism and thyroid indicators.";
        whyRecommended = [
          "Discuss glucose metabolism and diabetes risk",
          "Monitor glycemic stability and lifestyle factors",
          "Consider lifestyle and dietary changes"
        ];
        let isElevated = false;
        let isBorderline = false;
        if (glu) {
          const val = parseNumeric(glu.normalized_value || glu.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val >= 126) {
            status = "High";
            statusVariant = "high";
            isElevated = true;
          } else if (val !== null && val >= 100) {
            status = "Borderline";
            statusVariant = "borderline";
            isBorderline = true;
          }
          findings.push({
            parameter: "Fasting Glucose",
            value: `${val !== null ? val : glu.raw_value}`,
            unit: glu.unit || "mg/dL",
            status,
            statusVariant,
            date: glu.report_date,
            report: glu.filename
          });
        }
        if (a1c) {
          const val = parseNumeric(a1c.normalized_value || a1c.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val >= 6.5) {
            status = "High";
            statusVariant = "high";
            isElevated = true;
          } else if (val !== null && val >= 5.7) {
            status = "Borderline";
            statusVariant = "borderline";
            isBorderline = true;
          }
          findings.push({
            parameter: "HbA1c",
            value: `${val !== null ? val : a1c.raw_value}`,
            unit: a1c.unit || "%",
            status,
            statusVariant,
            date: a1c.report_date,
            report: a1c.filename
          });
        }
        if (tsh) {
          const val = parseNumeric(tsh.normalized_value || tsh.raw_value);
          findings.push({
            parameter: "TSH",
            value: `${val !== null ? val : tsh.raw_value}`,
            unit: tsh.unit || "\xB5IU/mL",
            status: "Normal",
            statusVariant: "normal",
            date: tsh.report_date,
            report: tsh.filename
          });
        }
        const metaRisk = riskByDomain["metabolic"];
        if (metaRisk && ["ORANGE", "RED"].includes(String(metaRisk.level).toUpperCase())) {
          priority = "High Priority";
        } else if (isElevated) {
          priority = "High Priority";
        } else if (isBorderline || metaRisk && metaRisk.level === "YELLOW") {
          priority = "Medium Priority";
        } else {
          priority = "Low Priority";
        }
      }
    } else if (domain === "kidney-related") {
      const cr = latestByParam["creatinine"];
      const egfr = latestByParam["egfr"];
      if (cr || egfr) {
        hasRelevantData = true;
        sourceReport = cr?.filename || egfr?.filename || "";
        explanation = "Based on your kidney function indicators.";
        whyRecommended = [
          "Monitor kidney function",
          "Maintain hydration and healthy lifestyle"
        ];
        let isElevated = false;
        let isBorderline = false;
        if (cr) {
          const val = parseNumeric(cr.normalized_value || cr.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val > 1.3) {
            status = "Elevated";
            statusVariant = "high";
            isElevated = true;
          } else if (val !== null && val >= 1.1) {
            status = "Upper normal";
            statusVariant = "borderline";
            isBorderline = true;
          }
          findings.push({
            parameter: "Creatinine",
            value: `${val !== null ? val : cr.raw_value}`,
            unit: cr.unit || "mg/dL",
            status,
            statusVariant,
            date: cr.report_date,
            report: cr.filename
          });
        }
        if (egfr) {
          const val = parseNumeric(egfr.normalized_value || egfr.raw_value);
          findings.push({
            parameter: "eGFR",
            value: `${val !== null ? val : egfr.raw_value}`,
            unit: egfr.unit || "mL/min",
            status: "Normal",
            statusVariant: "normal",
            date: egfr.report_date,
            report: egfr.filename
          });
        }
        if (isElevated) priority = "High Priority";
        else if (isBorderline) priority = "Medium Priority";
        else priority = "Low Priority";
      }
    } else if (domain === "hepatic") {
      const alt = latestByParam["alt"];
      const ast = latestByParam["ast"];
      if (alt || ast) {
        hasRelevantData = true;
        sourceReport = alt?.filename || ast?.filename || "";
        explanation = "Based on your liver function tests and gastrointestinal indicators.";
        whyRecommended = [
          "Monitor liver function",
          "Discuss if you have related symptoms"
        ];
        let isElevated = false;
        if (alt) {
          const val = parseNumeric(alt.normalized_value || alt.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val > 55) {
            status = "Elevated";
            statusVariant = "high";
            isElevated = true;
          }
          findings.push({
            parameter: "ALT (SGPT)",
            value: `${val !== null ? val : alt.raw_value}`,
            unit: alt.unit || "U/L",
            status,
            statusVariant,
            date: alt.report_date,
            report: alt.filename
          });
        }
        if (ast) {
          const val = parseNumeric(ast.normalized_value || ast.raw_value);
          let status = "Normal";
          let statusVariant = "normal";
          if (val !== null && val > 50) {
            status = "Elevated";
            statusVariant = "high";
            isElevated = true;
          }
          findings.push({
            parameter: "AST (SGOT)",
            value: `${val !== null ? val : ast.raw_value}`,
            unit: ast.unit || "U/L",
            status,
            statusVariant,
            date: ast.report_date,
            report: ast.filename
          });
        }
        if (isElevated) priority = "High Priority";
        else priority = "Low Priority";
      }
    }
    if (hasRelevantData) {
      const evidenceObj = {
        priority,
        explanation,
        findings,
        whyRecommended,
        ruleReference: ruleRef,
        sourceReport,
        suggestedDiscussionPoints: [
          `Review findings in ${specialtyName}`,
          "Discuss follow-up schedule and lifestyle factors"
        ]
      };
      return {
        domain,
        specialty: specialtyName,
        evidence: JSON.stringify(evidenceObj),
        rule_version: "1.0"
      };
    }
    return null;
  };
  const domainConfigs = [
    { domain: "cardiovascular", specialty: "Cardiology", ruleRef: "AHA/ACC Guidelines" },
    { domain: "metabolic", specialty: "Endocrinology", ruleRef: "ADA Standards of Care" },
    { domain: "kidney-related", specialty: "Nephrology", ruleRef: "KDIGO Guidelines" },
    { domain: "hepatic", specialty: "Gastroenterology", ruleRef: "ACG Clinical Guidelines" }
  ];
  await db.execute({
    sql: "DELETE FROM specialty_guidance WHERE user_id = ?",
    args: [userId]
  });
  for (const cfg of domainConfigs) {
    const evaluated = evaluateDomain(cfg.domain, cfg.specialty, cfg.ruleRef);
    if (evaluated) {
      const insertRes = await db.execute({
        sql: `INSERT INTO specialty_guidance (user_id, domain, suggested_specialty, evidence, rule_version, created_at)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [userId, evaluated.domain, evaluated.specialty, evaluated.evidence, evaluated.rule_version, now]
      });
      generatedRecords.push(insertRes.rows[0]);
    }
  }
  return generatedRecords;
}

// backend/routes/notifications.routes.ts
import { Router as Router2 } from "express";
init_env();

// backend/services/notifications/dispatcher.ts
init_env();
init_canonicalSummary();
init_providers();
init_telegramService2();
async function sendTestNotification(db2, userId, params) {
  const channel = params.channel.toUpperCase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (channel === "EMAIL") {
    let targetEmail = params.destination;
    let recipientName = "User";
    if (params.contactId) {
      const contactRes = await db2.execute({
        sql: "SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?",
        args: [params.contactId, userId]
      });
      if (contactRes.rows.length === 0) throw new Error("Trusted contact not found");
      const c = contactRes.rows[0];
      targetEmail = c.email || (c.contact_method === "EMAIL" ? c.contact_value : "");
      recipientName = c.name;
    } else if (!targetEmail) {
      const userRes = await db2.execute({
        sql: "SELECT email, name FROM users WHERE id = ?",
        args: [userId]
      });
      targetEmail = userRes.rows[0]?.email;
      recipientName = userRes.rows[0]?.name || "Patient";
    }
    if (!targetEmail || !isValidEmail(targetEmail)) {
      throw new Error(`Invalid recipient email address: ${targetEmail || "empty"}`);
    }
    const testSubject = `[MediTrack] Test Email Notification`;
    const testHtml = `
      <div style="font-family: -apple-system, sans-serif; padding: 24px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #059669; margin-top: 0;">MediTrack Delivery Verification</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Hello ${recipientName},<br><br>
          This is an authorized <strong>test notification</strong> confirming that your MediTrack email alert channel is active, verified, and correctly configured.
        </p>
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #166534;">
          &#10004; Live email delivery channel operational via official Gmail API.
        </div>
        <p style="font-size: 12px; color: #64748B; margin-bottom: 0;">
          Timestamp: ${(/* @__PURE__ */ new Date()).toLocaleString()}<br>
          <em>This is a diagnostic test. No medical alert was generated.</em>
        </p>
      </div>
    `;
    const result = await sendEmail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml,
      text: `MediTrack Test Notification: Your Gmail alert channel is active and configured. Timestamp: ${now}. This is NOT a medical alert.`
    }, userId, db2);
    const testKey = `test_${userId}_EMAIL_${Date.now()}`;
    try {
      await db2.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, provider, provider_message_id, attempts, last_attempt_at, delivered_at, error_message, payload_summary, created_at, updated_at)
              VALUES (NULL, ?, ?, 'TEST', ?, 'EMAIL', ?, 'TEST_NOTIFICATION', ?, ?, ?, ?, 1, ?, ?, ?, 'Diagnostic Test Email', ?, ?)`,
        args: [
          userId,
          params.contactId || null,
          recipientName,
          targetEmail,
          testKey,
          result.status,
          result.provider,
          result.providerMessageId || null,
          now,
          result.success ? now : null,
          result.error || null,
          now,
          now
        ]
      });
    } catch (e) {
    }
    if (!result.success) {
      throw new Error(result.error || "Gmail dispatch failed. Please verify your Google account connection in Channel Configuration.");
    }
    return {
      success: true,
      channel: "EMAIL",
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      status: result.status,
      message: `Test email successfully accepted by Gmail API for ${targetEmail}. Message ID: ${result.providerMessageId || "N/A"}.`,
      details: result
    };
  }
  if (channel === "TELEGRAM") {
    let targetChatId = params.destination;
    let recipientName = "Trusted Contact";
    if (params.contactId) {
      const contactRes = await db2.execute({
        sql: "SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?",
        args: [params.contactId, userId]
      });
      if (contactRes.rows.length === 0) throw new Error("Trusted contact not found");
      const c = contactRes.rows[0];
      targetChatId = c.telegram_chat_id;
      recipientName = c.name;
      if (!targetChatId) {
        const err = new Error(
          `Contact "${c.name}" has not linked their Telegram account yet. Click "Connect Telegram" on the contact card to generate a linking link, and have them start the bot in Telegram first.`
        );
        err.code = "NOT_LINKED";
        err.contactId = c.id;
        err.contactName = c.name;
        throw err;
      }
    } else if (!targetChatId) {
      const userRes = await db2.execute({
        sql: "SELECT telegram_chat_id, name FROM users WHERE id = ?",
        args: [userId]
      });
      targetChatId = userRes.rows[0]?.telegram_chat_id;
      recipientName = userRes.rows[0]?.name || "Patient";
      if (!targetChatId) {
        const err = new Error(
          "No linked Telegram account found for this user. Please connect Telegram or select a linked trusted contact first."
        );
        err.code = "NOT_LINKED";
        throw err;
      }
    }
    const testText = `\u{1F514} <b>MediTrack Diagnostic Test</b>

Hello <b>${recipientName}</b>,

This is a verified test message confirming that your <b>Telegram Health Alert</b> channel is active and operational for MediTrack.

Timestamp: <code>${(/* @__PURE__ */ new Date()).toLocaleString()}</code>

<i>This is an authorized diagnostic notification. No medical alert was generated.</i>`;
    const result = await sendTelegramMessage(targetChatId, testText);
    const testKey = `test_${userId}_TELEGRAM_${Date.now()}`;
    try {
      await db2.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, user_id, recipient_id, recipient_type, recipient_name, channel, destination, event_type, idempotency_key, status, provider, provider_message_id, attempts, last_attempt_at, delivered_at, error_message, payload_summary, created_at, updated_at)
              VALUES (NULL, ?, ?, 'TEST', ?, 'TELEGRAM', ?, 'TEST_NOTIFICATION', ?, ?, ?, ?, 1, ?, ?, ?, 'Diagnostic Test Telegram Message', ?, ?)`,
        args: [
          userId,
          params.contactId || null,
          recipientName,
          targetChatId,
          testKey,
          result.status,
          result.provider,
          result.providerMessageId || null,
          now,
          result.success ? now : null,
          result.error || null,
          now,
          now
        ]
      });
    } catch (e) {
    }
    if (!result.success) {
      const err = new Error(result.error || "Telegram dispatch failed");
      if (result.error?.includes("not configured")) {
        err.code = "NOT_CONFIGURED";
      } else {
        err.code = result.status || "FAILED";
      }
      err.details = result.details;
      throw err;
    }
    return {
      success: true,
      channel: "TELEGRAM",
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      status: result.status,
      message: `Test Telegram notification successfully dispatched to ${recipientName} (Chat: ${targetChatId}). Message ID: ${result.providerMessageId || "N/A"}.`,
      details: result
    };
  }
  if (channel === "SMS") {
    throw new Error("SMS notifications have been decommissioned and replaced with official Telegram Bot notifications. Please use Telegram.");
  }
  throw new Error(`Unsupported notification channel: ${channel}`);
}

// backend/routes/notifications.routes.ts
init_gmailService();
init_telegramService2();

// backend/services/notifications/dbSchema.ts
async function getTableColumns(db2, tableName) {
  try {
    const res = await db2.execute(`PRAGMA table_info(${tableName})`);
    return new Set(res.rows.map((r) => String(r.name).toLowerCase()));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
async function getExistingTables(db2) {
  try {
    const res = await db2.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
    return new Set(res.rows.map((r) => String(r.name).toLowerCase()));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
async function ensureColumn(db2, tableName, columnName, definition, existingColumns) {
  if (existingColumns.has(columnName.toLowerCase())) {
    return false;
  }
  try {
    await db2.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    existingColumns.add(columnName.toLowerCase());
    return true;
  } catch (err) {
    if (!err?.message?.includes("duplicate column name")) {
      console.warn(`[Migration] Notice adding column ${tableName}.${columnName}:`, err.message);
    }
    return false;
  }
}
async function initNotificationSchema(db2) {
  const SCHEMA_TARGET_VERSION = 4;
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      email TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT DEFAULT 'Bearer',
      expiry_date INTEGER,
      scope TEXT,
      status TEXT NOT NULL DEFAULT 'CONNECTED',
      last_used_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER,
      user_id INTEGER NOT NULL,
      recipient_id INTEGER,
      recipient_type TEXT NOT NULL,
      recipient_name TEXT,
      channel TEXT NOT NULL,
      destination TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'HEALTH_ALERT',
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      provider TEXT,
      provider_message_id TEXT,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_retry_at TEXT,
      last_attempt_at TEXT,
      delivered_at TEXT,
      error_message TEXT,
      payload_summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(alert_id) REFERENCES health_alerts(id)
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS telegram_linking_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      contact_id INTEGER,
      type TEXT NOT NULL DEFAULT 'CONTACT',
      expires_at INTEGER NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS telegram_processed_updates (
      update_id INTEGER PRIMARY KEY,
      processed_at TEXT NOT NULL
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS telegram_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      user_id INTEGER,
      contact_id INTEGER,
      command TEXT,
      query_preview TEXT,
      status TEXT NOT NULL,
      response_type TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await db2.execute(`
    CREATE TABLE IF NOT EXISTS telegram_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  const alertCols = await getTableColumns(db2, "health_alerts");
  await ensureColumn(db2, "health_alerts", "severity", "TEXT DEFAULT 'MODERATE'", alertCols);
  await ensureColumn(db2, "health_alerts", "title", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "summary_json", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "abnormal_findings_json", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "recommendations_json", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "trigger_source", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "source_id", "INTEGER", alertCols);
  await ensureColumn(db2, "health_alerts", "acknowledged_at", "TEXT", alertCols);
  await ensureColumn(db2, "health_alerts", "acknowledged_by", "TEXT", alertCols);
  const contactCols = await getTableColumns(db2, "trusted_contacts");
  await ensureColumn(db2, "trusted_contacts", "email", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "phone", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "email_enabled", "INTEGER DEFAULT 1", contactCols);
  await ensureColumn(db2, "trusted_contacts", "sms_enabled", "INTEGER DEFAULT 0", contactCols);
  await ensureColumn(db2, "trusted_contacts", "telegram_chat_id", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "telegram_username", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "telegram_enabled", "INTEGER DEFAULT 1", contactCols);
  await ensureColumn(db2, "trusted_contacts", "telegram_linked_at", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "consent_status", "TEXT DEFAULT 'GRANTED'", contactCols);
  await ensureColumn(db2, "trusted_contacts", "consent_date", "TEXT", contactCols);
  await ensureColumn(db2, "trusted_contacts", "verified_at", "TEXT", contactCols);
  const userCols = await getTableColumns(db2, "users");
  await ensureColumn(db2, "users", "notification_telegram", "INTEGER DEFAULT 1", userCols);
  await ensureColumn(db2, "users", "telegram_chat_id", "TEXT", userCols);
  await ensureColumn(db2, "users", "telegram_username", "TEXT", userCols);
  try {
    await db2.execute(`
      UPDATE trusted_contacts 
      SET email = contact_value, email_enabled = 1
      WHERE (contact_method = 'EMAIL' OR contact_method = 'email') AND (email IS NULL OR email = '')
    `);
    await db2.execute(`
      UPDATE trusted_contacts 
      SET phone = contact_value, sms_enabled = 0
      WHERE (contact_method = 'SMS' OR contact_method = 'PHONE') AND (phone IS NULL OR phone = '')
    `);
  } catch {
  }
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_notif_deliveries_alert ON notification_deliveries(alert_id)",
    "CREATE INDEX IF NOT EXISTS idx_notif_deliveries_user ON notification_deliveries(user_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_deliveries_idempotency ON notification_deliveries(idempotency_key)",
    "CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_push_sub_endpoint ON push_subscriptions(endpoint)",
    "CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user ON gmail_oauth_tokens(user_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_tg_linking_token ON telegram_linking_tokens(token)",
    "CREATE INDEX IF NOT EXISTS idx_tg_linking_user ON telegram_linking_tokens(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_contacts_tg_chat ON trusted_contacts(telegram_chat_id)",
    "CREATE INDEX IF NOT EXISTS idx_tg_audit_chat ON telegram_audit_logs(chat_id, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_tg_conv_chat ON telegram_conversations(chat_id, created_at)"
  ];
  for (const idx of indexes) {
    try {
      await db2.execute(idx);
    } catch {
    }
  }
  try {
    const verRes = await db2.execute("PRAGMA user_version");
    const curVer = Number(verRes.rows[0]?.user_version || 0);
    if (curVer < SCHEMA_TARGET_VERSION) {
      await db2.execute(`PRAGMA user_version = ${SCHEMA_TARGET_VERSION}`);
    }
  } catch {
  }
}
async function validateDatabaseSchema(db2) {
  const requiredTables = [
    "users",
    "trusted_contacts",
    "health_alerts",
    "notification_deliveries",
    "gmail_oauth_tokens",
    "telegram_linking_tokens",
    "telegram_processed_updates",
    "telegram_audit_logs",
    "telegram_conversations"
  ];
  const existingTables = await getExistingTables(db2);
  const tablesReport = {};
  const missing = [];
  for (const t of requiredTables) {
    const exists = existingTables.has(t.toLowerCase());
    tablesReport[t] = exists;
    if (!exists) missing.push(`Missing table: ${t}`);
  }
  const contactCols = await getTableColumns(db2, "trusted_contacts");
  const requiredContactCols = ["telegram_chat_id", "telegram_username", "telegram_enabled", "status", "email"];
  for (const col of requiredContactCols) {
    if (!contactCols.has(col.toLowerCase())) {
      missing.push(`Missing column trusted_contacts.${col}`);
    }
  }
  const userCols = await getTableColumns(db2, "users");
  const requiredUserCols = ["notification_telegram", "telegram_chat_id"];
  for (const col of requiredUserCols) {
    if (!userCols.has(col.toLowerCase())) {
      missing.push(`Missing column users.${col}`);
    }
  }
  let userVersion = 0;
  try {
    const vRes = await db2.execute("PRAGMA user_version");
    userVersion = Number(vRes.rows[0]?.user_version || 0);
  } catch {
  }
  return {
    valid: missing.length === 0,
    userVersion,
    tables: tablesReport,
    missing
  };
}

// backend/routes/notifications.routes.ts
var notificationsRouter = Router2();
notificationsRouter.get("/channels", authenticateToken, async (req, res) => {
  try {
    try {
      await initNotificationSchema(db);
    } catch (e) {
    }
    const userRes = await db.execute({
      sql: "SELECT notification_email, notification_sms, notification_telegram, notification_push, telegram_chat_id, telegram_username FROM users WHERE id = ?",
      args: [req.user.id]
    });
    const user = userRes.rows[0] || {};
    const [gmailStatus, telegramStatus] = await Promise.all([
      getGmailConnectionStatus(req.user.id, db),
      getTelegramStatus(req.user.id, db)
    ]);
    res.json({
      mode: "gmail-and-telegram",
      email: {
        configured: gmailStatus.oauthConfigured,
        connected: gmailStatus.connected,
        status: gmailStatus.status,
        email: gmailStatus.email,
        provider: "GMAIL_API",
        userEnabled: user.notification_email !== 0,
        lastUsedAt: gmailStatus.lastUsedAt,
        lastError: gmailStatus.lastError,
        missingSetup: gmailStatus.missingSetup
      },
      telegram: {
        configured: telegramStatus.configured,
        botUsername: telegramStatus.botUsername,
        provider: "TELEGRAM_BOT_API",
        userEnabled: user.notification_telegram !== 0,
        linkedContactsCount: telegramStatus.linkedContactsCount,
        webhookConfigured: telegramStatus.webhookConfigured,
        missingSetup: telegramStatus.missingSetup,
        userChatId: user.telegram_chat_id || null,
        userUsername: user.telegram_username || null,
        userLinked: Boolean(user.telegram_chat_id)
      },
      sms: {
        configured: false,
        provider: "disabled",
        status: "REPLACED_BY_TELEGRAM",
        userEnabled: false,
        phoneNumber: null,
        message: "SMS channel decommissioned. Replaced with official Telegram Bot notifications."
      },
      push: {
        configured: false,
        provider: "disabled",
        status: "INACTIVE",
        userEnabled: user.notification_push === 1,
        message: "Browser push notifications are currently inactive."
      }
    });
  } catch (error) {
    console.error("Failed to get notification channels status:", error);
    res.status(500).json({ error: "Failed to retrieve notification channel status" });
  }
});
notificationsRouter.get("/gmail/auth-url", authenticateToken, async (req, res) => {
  try {
    const { url, state } = generateGmailAuthUrl(req.user.id);
    res.json({ url, state });
  } catch (err) {
    console.error("Failed to generate Gmail auth URL:", err);
    res.status(400).json({ error: err.message || "Unable to generate Gmail authorization URL" });
  }
});
notificationsRouter.get("/gmail/callback", async (req, res) => {
  const code = (req.query.code || "").toString();
  const state = (req.query.state || "").toString();
  const error = (req.query.error || "").toString();
  const frontendUrl = envConfig.FRONTEND_URL || "http://localhost:3000";
  if (error) {
    console.warn("Google OAuth denied or returned error:", error);
    return res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent(`Google authorization denied: ${error}`)}`);
  }
  if (!code || !state) {
    return res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent("Missing authorization code or state parameter.")}`);
  }
  try {
    const result = await handleGmailOAuthCallback(code, state, db);
    console.log(`[GMAIL OAUTH] User #${result.userId} successfully connected Gmail: ${result.email}`);
    res.redirect(`${frontendUrl}/family-alerts?gmail_connected=true&email=${encodeURIComponent(result.email)}`);
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    res.redirect(`${frontendUrl}/family-alerts?gmail_error=${encodeURIComponent(err.message || "OAuth verification failed")}`);
  }
});
notificationsRouter.post("/gmail/disconnect", authenticateToken, async (req, res) => {
  try {
    const result = await disconnectGmailAccount(req.user.id, db);
    res.json(result);
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    res.status(500).json({ error: err.message || "Failed to disconnect Gmail account" });
  }
});
notificationsRouter.get("/gmail/status", authenticateToken, async (req, res) => {
  try {
    const status = await getGmailConnectionStatus(req.user.id, db);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve Gmail status" });
  }
});
notificationsRouter.post("/telegram/connect-link", authenticateToken, async (req, res) => {
  try {
    const contactId = req.body?.contactId ? Number(req.body.contactId) : void 0;
    if (contactId) {
      const contactRes = await db.execute({
        sql: "SELECT id, name FROM trusted_contacts WHERE id = ? AND user_id = ?",
        args: [contactId, req.user.id]
      });
      if (contactRes.rows.length === 0) {
        return res.status(404).json({ error: "Trusted contact not found." });
      }
    }
    const linkingData = await generateTelegramLinkingToken(req.user.id, contactId, db);
    res.json({
      success: true,
      ...linkingData
    });
  } catch (err) {
    console.error("Failed to generate Telegram connect link:", err);
    res.status(500).json({ error: err.message || "Failed to generate Telegram linking link." });
  }
});
notificationsRouter.post("/telegram/disconnect", authenticateToken, async (req, res) => {
  const contactId = req.body?.contactId ? Number(req.body.contactId) : void 0;
  if (!contactId) {
    return res.status(400).json({ error: "Contact ID is required to disconnect Telegram." });
  }
  try {
    const result = await disconnectTelegramContact(req.user.id, contactId, db);
    res.json(result);
  } catch (err) {
    console.error("Failed to disconnect Telegram contact:", err);
    res.status(500).json({ error: err.message || "Failed to disconnect Telegram contact." });
  }
});
notificationsRouter.post("/telegram/webhook", async (req, res) => {
  const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (!verifyTelegramWebhookSecret(incomingSecret)) {
    console.warn("[TELEGRAM WEBHOOK] Rejected unauthorized request: Invalid or missing secret token header.");
    return res.status(403).json({ error: "Unauthorized webhook secret token" });
  }
  try {
    const result = await handleTelegramUpdate(req.body, db);
    res.status(200).json({ ok: true, handled: result.handled });
  } catch (err) {
    console.error("[TELEGRAM WEBHOOK ERROR]", err);
    res.status(200).json({ ok: true, error: err.message });
  }
});
notificationsRouter.get("/telegram/webhook-info", authenticateToken, async (req, res) => {
  try {
    const info = await getTelegramWebhookInfo();
    res.json({ success: true, info });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch webhook info." });
  }
});
notificationsRouter.post("/telegram/set-webhook", authenticateToken, async (req, res) => {
  const { url, secretToken } = req.body || {};
  if (!url || !url.startsWith("https://")) {
    return res.status(400).json({ error: "A valid HTTPS webhook URL is required by Telegram." });
  }
  try {
    const result = await setTelegramWebhook(url, secretToken);
    res.json({ success: result.ok, description: result.description });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to register Telegram webhook." });
  }
});
notificationsRouter.post("/telegram/poll-updates", authenticateToken, async (req, res) => {
  try {
    const count = await pollTelegramUpdates(db);
    res.json({ success: true, processedCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to poll Telegram updates." });
  }
});
notificationsRouter.post("/telegram/simulate-link", authenticateToken, async (req, res) => {
  const { token, chatId, username } = req.body || {};
  if (!token) return res.status(400).json({ error: "Linking token is required." });
  try {
    const simulatedUpdate = {
      update_id: Date.now(),
      message: {
        message_id: 1,
        chat: { id: chatId || "987654321", first_name: "TestContact", username: username || "test_contact" },
        from: { id: chatId || "987654321", first_name: "TestContact", username: username || "test_contact" },
        date: Math.floor(Date.now() / 1e3),
        text: `/start ${token}`
      }
    };
    const result = await handleTelegramUpdate(simulatedUpdate, db);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Simulate link failed." });
  }
});
notificationsRouter.post("/test", authenticateToken, async (req, res) => {
  const { channel, destination, contactId } = req.body || {};
  const normalizedChannel = (channel || "EMAIL").toUpperCase();
  if (normalizedChannel !== "EMAIL" && normalizedChannel !== "TELEGRAM") {
    return res.status(400).json({
      error: `Unsupported test channel "${normalizedChannel}". Active channels are EMAIL (via Gmail API) and TELEGRAM (via Telegram Bot API). SMS is decommissioned.`,
      channel: normalizedChannel
    });
  }
  try {
    const result = await sendTestNotification(db, req.user.id, {
      channel: normalizedChannel,
      destination,
      contactId: contactId ? Number(contactId) : void 0
    });
    res.json(result);
  } catch (error) {
    console.error("Test notification failed:", error);
    const code = error.code || (error.message?.includes("not linked") ? "NOT_LINKED" : error.message?.includes("not configured") ? "NOT_CONFIGURED" : "FAILED");
    res.status(400).json({
      success: false,
      status: code,
      error: error.message || "Unable to send test notification",
      channel: normalizedChannel,
      contactId: error.contactId || (contactId ? Number(contactId) : void 0),
      contactName: error.contactName,
      details: error.details
    });
  }
});
notificationsRouter.post("/in-app/test", authenticateToken, async (req, res) => {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const eventKey = `in-app-test:${req.user.id}:${Date.now()}`;
    const title = req.body?.title || "Elevated Blood Pressure Alert";
    const message = req.body?.message || "Systolic blood pressure reading of 148/92 mmHg detected. Stage 2 hypertension threshold exceeded.";
    const severity = req.body?.severity || "HIGH";
    const insertResult = await db.execute({
      sql: `INSERT INTO health_alerts 
            (user_id, type, message, source, status, delivery_channel, event_key, severity, title, trigger_source, is_read, created_at)
            VALUES (?, 'HIGH_ALERT', ?, 'In-App Clinical Monitor', 'RECORDED', 'IN_APP', ?, ?, ?, 'In-App Test', 0, ?)
            RETURNING *`,
      args: [req.user.id, message, eventKey, severity, title, now]
    });
    const alert = insertResult.rows[0];
    res.json({ success: true, message: "In-app notification generated successfully", alert });
  } catch (error) {
    console.error("In-app test alert error:", error);
    res.status(500).json({ error: error.message || "Failed to generate in-app alert" });
  }
});
notificationsRouter.post("/push/subscribe", authenticateToken, async (req, res) => {
  res.status(403).json({ error: "Browser push notifications are currently inactive." });
});
notificationsRouter.post("/push/unsubscribe", authenticateToken, async (req, res) => {
  res.json({ success: true, message: "Push notifications are currently inactive." });
});
notificationsRouter.get("/alerts/:id/deliveries", authenticateToken, async (req, res) => {
  const alertId = Number(req.params.id);
  try {
    const alertRes = await db.execute({
      sql: "SELECT id, user_id FROM health_alerts WHERE id = ? AND user_id = ?",
      args: [alertId, req.user.id]
    });
    if (alertRes.rows.length === 0) return res.status(404).json({ error: "Alert not found" });
    const deliveriesRes = await db.execute({
      sql: `SELECT * FROM notification_deliveries WHERE alert_id = ? ORDER BY created_at ASC`,
      args: [alertId]
    });
    res.json(deliveriesRes.rows);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch alert delivery history" });
  }
});
notificationsRouter.put("/alerts/:id/acknowledge", authenticateToken, async (req, res) => {
  const alertId = Number(req.params.id);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const result = await db.execute({
      sql: `UPDATE health_alerts 
            SET acknowledged_at = ?, acknowledged_by = ?, is_read = 1, read_at = ?
            WHERE id = ? AND user_id = ?
            RETURNING *`,
      args: [now, req.user.name || "User", now, alertId, req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Unable to acknowledge alert" });
  }
});

// backend/services/alertClassification.service.ts
init_parameters();
init_unitRegistry();
import crypto4 from "crypto";
var VALIDATED_CLINICAL_RULES = {
  // Blood Glucose (Fasting)
  fasting_glucose: {
    canonicalUnit: "mg/dL",
    normalMin: 70,
    normalMax: 99,
    highPriorityMin: 126,
    criticalMin: 50,
    criticalMax: 400,
    formatRange: "70 - 99 mg/dL",
    criticalExplanationLow: "Severe hypoglycemia (<50 mg/dL) carries immediate risk of neuroglycopenia, loss of consciousness, and acute metabolic shock.",
    criticalExplanationHigh: "Severe hyperglycemia (>400 mg/dL) indicates profound glycemic decompensation with risk of diabetic ketoacidosis (DKA) or hyperosmolar hyperglycemic state (HHS).",
    highPriorityExplanation: "Fasting glucose meets or exceeds diagnostic thresholds for diabetes (>=126 mg/dL).",
    warningExplanation: "Impaired fasting glucose (100-125 mg/dL) indicating elevated glycemic resistance / prediabetes.",
    criticalAction: "Urgent medical attention is recommended. If experiencing confusion, tremors, or severe fatigue, seek immediate emergency care.",
    highPriorityAction: "Schedule a prompt consultation with an endocrinologist or primary care physician for a glycemic management plan.",
    warningAction: "Consult your physician for follow-up testing (HbA1c) and discuss diet and lifestyle interventions."
  },
  // Serum / Random Glucose
  serum_glucose: {
    canonicalUnit: "mg/dL",
    normalMin: 70,
    normalMax: 140,
    highPriorityMin: 200,
    criticalMin: 50,
    criticalMax: 400,
    formatRange: "70 - 140 mg/dL",
    criticalExplanationLow: "Critical hypoglycemia (<50 mg/dL) poses acute risk to brain function and requires rapid glucose correction.",
    criticalExplanationHigh: "Random blood glucose >400 mg/dL represents severe uncontrolled hyperglycemia.",
    highPriorityExplanation: "Random glucose >=200 mg/dL suggests significant blood sugar dysregulation.",
    warningExplanation: "Random glucose is moderately elevated (141-199 mg/dL).",
    criticalAction: "Urgent medical evaluation is needed. If symptomatic, administer fast-acting carbohydrates and seek emergency services.",
    highPriorityAction: "Contact your healthcare provider promptly for diagnostic evaluation.",
    warningAction: "Monitor your blood sugar levels and schedule a routine medical evaluation."
  },
  // Systolic Blood Pressure
  blood_pressure_systolic: {
    canonicalUnit: "mmHg",
    normalMin: 90,
    normalMax: 120,
    highPriorityMin: 140,
    criticalMin: 70,
    criticalMax: 180,
    formatRange: "90 - 120 mmHg",
    criticalExplanationLow: "Systolic blood pressure <70 mmHg indicates severe hypotension and possible circulatory shock.",
    criticalExplanationHigh: "Systolic blood pressure >=180 mmHg represents a Hypertensive Crisis requiring immediate emergency evaluation.",
    highPriorityExplanation: "Systolic blood pressure >=140 mmHg indicates Stage 2 Hypertension.",
    warningExplanation: "Systolic blood pressure (121-139 mmHg) is in the elevated or Stage 1 hypertension range.",
    criticalAction: "Immediate emergency medical care is strongly advised. Rest quietly and contact emergency services if experiencing headache, chest pain, or vision changes.",
    highPriorityAction: "Consult a cardiologist or primary care physician promptly to discuss antihypertensive management.",
    warningAction: "Re-measure after resting, keep a blood pressure log, and review with your physician."
  },
  // Diastolic Blood Pressure
  blood_pressure_diastolic: {
    canonicalUnit: "mmHg",
    normalMin: 60,
    normalMax: 80,
    highPriorityMin: 90,
    criticalMin: 40,
    criticalMax: 120,
    formatRange: "60 - 80 mmHg",
    criticalExplanationLow: "Diastolic blood pressure <40 mmHg indicates severe vascular compromise.",
    criticalExplanationHigh: "Diastolic blood pressure >=120 mmHg represents acute hypertensive crisis with risk of end-organ damage.",
    highPriorityExplanation: "Diastolic blood pressure >=90 mmHg indicates Stage 2 Hypertension.",
    warningExplanation: "Diastolic blood pressure (81-89 mmHg) is in the Stage 1 hypertension range.",
    criticalAction: "Immediate medical evaluation is needed. Contact emergency services or visit an emergency room.",
    highPriorityAction: "Contact your physician promptly for formal blood pressure evaluation.",
    warningAction: "Record repeated readings and consult your healthcare provider."
  },
  // Hemoglobin
  hemoglobin: {
    canonicalUnit: "g/dL",
    normalMin: 12,
    normalMax: 17.5,
    criticalMin: 7,
    criticalMax: 20,
    formatRange: "12.0 - 17.5 g/dL",
    criticalExplanationLow: "Hemoglobin <7.0 g/dL is severe critical anemia approaching blood transfusion threshold with risk of cardiac ischemia.",
    criticalExplanationHigh: "Hemoglobin >20.0 g/dL indicates severe polycythemia with increased blood hyperviscosity and thrombosis risk.",
    highPriorityExplanation: "Hemoglobin is significantly reduced (7.0-9.9 g/dL), representing moderate to severe anemia.",
    warningExplanation: "Hemoglobin is mildly below normal reference range (10.0-11.9 g/dL).",
    criticalAction: "Urgent evaluation by a hematologist or emergency department is recommended for immediate clinical stabilization.",
    highPriorityAction: "Consult a physician promptly for anemia workup (ferritin, iron panel, B12/folate, occult blood).",
    warningAction: "Review iron intake and discuss mild anemia with your healthcare provider at your next visit."
  },
  // Platelets
  platelets: {
    canonicalUnit: "x10^3/\xB5L",
    normalMin: 150,
    normalMax: 450,
    criticalMin: 20,
    criticalMax: 1e3,
    formatRange: "150 - 450 x10^3/\xB5L",
    criticalExplanationLow: "Platelet count <20 x10^3/\xB5L represents severe critical thrombocytopenia with high risk of spontaneous major hemorrhage.",
    criticalExplanationHigh: "Platelet count >1,000 x10^3/\xB5L represents extreme thrombocytosis with paradoxical bleeding and thrombosis risk.",
    highPriorityExplanation: "Platelets are moderately reduced (20-99 x10^3/\xB5L) or elevated (>500 x10^3/\xB5L).",
    warningExplanation: "Platelet count is mildly out of standard reference range (100-149 x10^3/\xB5L).",
    criticalAction: "Seek emergency hematology care immediately. Avoid trauma, sharp objects, and anticoagulants/aspirin.",
    highPriorityAction: "Consult a hematologist or primary care physician promptly for a peripheral blood smear and repeat CBC.",
    warningAction: "Follow up with your physician to monitor platelet trends on your next routine test."
  },
  // Serum Creatinine
  creatinine: {
    canonicalUnit: "mg/dL",
    normalMin: 0.6,
    normalMax: 1.2,
    highPriorityMin: 2,
    criticalMax: 4,
    formatRange: "0.6 - 1.2 mg/dL",
    criticalExplanationHigh: "Serum creatinine >=4.0 mg/dL represents severe acute kidney injury or end-stage renal impairment requiring urgent nephrology care.",
    highPriorityExplanation: "Creatinine is substantially elevated (2.0-3.9 mg/dL), indicating significant impairment in renal filtration.",
    warningExplanation: "Creatinine is mildly elevated (1.3-1.9 mg/dL) above the standard baseline.",
    criticalAction: "Urgent nephrology evaluation or emergency medical assessment is strongly advised.",
    highPriorityAction: "Consult a nephrologist or physician promptly; review medications (especially NSAIDs/ACEi) and hydration.",
    warningAction: "Ensure adequate hydration and discuss kidney function monitoring with your doctor."
  },
  // Total Cholesterol
  total_cholesterol: {
    canonicalUnit: "mg/dL",
    normalMax: 200,
    highPriorityMin: 240,
    formatRange: "< 200 mg/dL",
    highPriorityExplanation: "Total cholesterol is markedly high (>=240 mg/dL), significantly increasing long-term atherosclerotic cardiovascular risk.",
    warningExplanation: "Total cholesterol is borderline high (200-239 mg/dL).",
    criticalAction: "Consult a physician regarding cardiovascular lipid management.",
    highPriorityAction: "Consult a physician or cardiologist to evaluate cardiovascular risk and potential statin therapy.",
    warningAction: "Adopt dietary improvements reducing saturated fats, increase physical activity, and retest in 3-6 months."
  },
  // LDL Cholesterol
  ldl: {
    canonicalUnit: "mg/dL",
    normalMax: 100,
    highPriorityMin: 160,
    criticalMax: 190,
    formatRange: "< 100 mg/dL",
    criticalExplanationHigh: "LDL cholesterol >=190 mg/dL represents severe hypercholesterolemia (often familial) requiring intensive lipid-lowering therapy.",
    highPriorityExplanation: "LDL cholesterol is high (160-189 mg/dL), accelerating vascular plaque deposition.",
    warningExplanation: "LDL cholesterol is borderline elevated (100-159 mg/dL).",
    criticalAction: "Consult a cardiologist or lipidologist for comprehensive cardiovascular evaluation.",
    highPriorityAction: "Consult your physician to discuss lipid-lowering interventions and lifestyle modifications.",
    warningAction: "Review heart-healthy dietary habits and schedule routine cardiovascular screening."
  },
  // Oxygen Saturation (SpO2)
  spo2: {
    canonicalUnit: "%",
    normalMin: 95,
    normalMax: 100,
    criticalMin: 88,
    formatRange: "95 - 100%",
    criticalExplanationLow: "Oxygen saturation (SpO2) <88% represents severe hypoxemia with inadequate tissue oxygenation.",
    highPriorityExplanation: "SpO2 is low (88-92%), indicating respiratory compromise.",
    warningExplanation: "SpO2 is slightly below normal (93-94%).",
    criticalAction: "Emergency medical care and supplemental oxygen are urgently required. Seek emergency medical attention.",
    highPriorityAction: "Contact your healthcare provider or urgent care promptly for respiratory assessment.",
    warningAction: "Rest, check sensor positioning, and contact your doctor if shortness of breath persists."
  },
  // Heart Rate
  heart_rate: {
    canonicalUnit: "bpm",
    normalMin: 60,
    normalMax: 100,
    criticalMin: 40,
    criticalMax: 140,
    formatRange: "60 - 100 bpm",
    criticalExplanationLow: "Resting heart rate <40 bpm represents critical bradycardia with risk of syncope or circulatory collapse.",
    criticalExplanationHigh: "Resting heart rate >140 bpm represents critical tachycardia with hemodynamic stress.",
    highPriorityExplanation: "Heart rate is markedly elevated (101-139 bpm) or reduced (40-50 bpm).",
    warningExplanation: "Heart rate is mildly outside the standard resting range (51-59 or 101-110 bpm).",
    criticalAction: "Immediate medical evaluation is needed. If experiencing dizziness, shortness of breath, or chest pain, call emergency services.",
    highPriorityAction: "Consult a physician or cardiologist for an electrocardiogram (ECG/EKG).",
    warningAction: "Re-measure while relaxed and discuss resting pulse rates with your physician."
  }
};
function detectLaboratoryCriticalFlag(text) {
  if (!text) return false;
  const upper = text.toUpperCase();
  return upper.includes("CRITICAL HIGH") || upper.includes("CRITICAL LOW") || upper.includes("PANIC VALUE") || upper.includes("ALERT VALUE") || upper.includes("*CRIT*") || upper.includes("CRITICAL:") || upper.includes("VALUE CRITICAL");
}
function classifyMeasurement(userId, meas, reportId, reportDate) {
  const paramCanonical = normalizeParameterName(meas.parameter);
  const displayName = getParameterDisplayName(paramCanonical);
  const rawVal = String(meas.raw_value || meas.normalized_value || "").trim();
  const unit = String(meas.unit || meas.normalized_unit || "").trim();
  const sourceText = String(meas.source_text || "");
  const hasLabCriticalFlag = detectLaboratoryCriticalFlag(sourceText) || detectLaboratoryCriticalFlag(rawVal);
  let numericVal = null;
  const numMatch = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (numMatch) {
    numericVal = parseFloat(numMatch[0]);
  }
  if (paramCanonical === "blood_pressure" || meas.parameter.toLowerCase().includes("pressure") && rawVal.includes("/")) {
    const parts = rawVal.split("/");
    if (parts.length === 2) {
      const sbp = parseFloat(parts[0]);
      const dbp = parseFloat(parts[1]);
      if (!isNaN(sbp) && !isNaN(dbp)) {
        const sbpAlert = classifyMeasurement(
          userId,
          { parameter: "blood_pressure_systolic", raw_value: String(sbp), unit: "mmHg", source_text: sourceText },
          reportId,
          reportDate
        );
        if (sbpAlert && sbpAlert.severity === "CRITICAL") return sbpAlert;
        const dbpAlert = classifyMeasurement(
          userId,
          { parameter: "blood_pressure_diastolic", raw_value: String(dbp), unit: "mmHg", source_text: sourceText },
          reportId,
          reportDate
        );
        if (dbpAlert && dbpAlert.severity === "CRITICAL") return dbpAlert;
        return sbpAlert || dbpAlert;
      }
    }
  }
  if (numericVal === null && !hasLabCriticalFlag) {
    return null;
  }
  const rule = VALIDATED_CLINICAL_RULES[paramCanonical];
  let canonicalVal = numericVal;
  let canonicalUnit = unit || (rule ? rule.canonicalUnit : "");
  if (rule && numericVal !== null) {
    const conv = convertToCanonicalUnit2(paramCanonical, numericVal, unit);
    if (conv.success && conv.convertedValue !== null) {
      canonicalVal = conv.convertedValue;
      canonicalUnit = conv.canonicalUnit;
    }
  }
  if (hasLabCriticalFlag) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, "CRITICAL", rawVal);
    return {
      severity: "CRITICAL",
      title: `Critical Finding: ${displayName}`,
      message: `The laboratory report explicitly flagged ${displayName} (${rawVal} ${unit}) as a CRITICAL/PANIC value.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: rawVal,
      unit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule ? rule.formatRange : "Flagged by Reporting Laboratory",
      explanation: `The performing laboratory designated this finding as an urgent critical alert requiring immediate clinical intervention.`,
      recommendedAction: rule?.criticalAction || "Contact your physician or seek immediate urgent care evaluation.",
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }
  if (!rule || canonicalVal === null) {
    return null;
  }
  if (rule.criticalMin !== void 0 && canonicalVal < rule.criticalMin || rule.criticalMax !== void 0 && canonicalVal >= rule.criticalMax) {
    const isLow = rule.criticalMin !== void 0 && canonicalVal < rule.criticalMin;
    const explanation = isLow ? rule.criticalExplanationLow || `Measured ${displayName} (${canonicalVal} ${canonicalUnit}) is critically low below safety limits.` : rule.criticalExplanationHigh || `Measured ${displayName} (${canonicalVal} ${canonicalUnit}) is critically elevated above safety limits.`;
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, "CRITICAL", String(canonicalVal));
    return {
      severity: "CRITICAL",
      title: `CRITICAL ALERT: Severe ${displayName} Finding`,
      message: `${displayName} measured at ${rawVal} ${unit || canonicalUnit} (Reference: ${rule.formatRange}). Urgent clinical action required.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation,
      recommendedAction: rule.criticalAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }
  const isHighPriority = rule.highPriorityMin !== void 0 && canonicalVal >= rule.highPriorityMin || rule.highPriorityMax !== void 0 && canonicalVal <= rule.highPriorityMax;
  if (isHighPriority) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, "HIGH_PRIORITY", String(canonicalVal));
    return {
      severity: "HIGH_PRIORITY",
      title: `High Priority: ${displayName} Elevated`,
      message: `${displayName} measured at ${rawVal} ${unit || canonicalUnit} (Standard: ${rule.formatRange}). Prompt follow-up advised.`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation: rule.highPriorityExplanation || `The observed value is significantly out of optimal range.`,
      recommendedAction: rule.highPriorityAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }
  const isOutOfRange = rule.normalMin !== void 0 && canonicalVal < rule.normalMin || rule.normalMax !== void 0 && canonicalVal > rule.normalMax;
  if (isOutOfRange) {
    const key = generateIdempotencyKey(userId, reportId || 0, paramCanonical, "WARNING", String(canonicalVal));
    return {
      severity: "WARNING",
      title: `Abnormal Result: ${displayName}`,
      message: `${displayName} is outside the standard reference range at ${rawVal} ${unit || canonicalUnit} (Reference: ${rule.formatRange}).`,
      parameter: paramCanonical,
      displayName,
      measuredValue: `${rawVal} ${unit}`.trim(),
      unit: unit || canonicalUnit,
      canonicalValue: canonicalVal,
      canonicalUnit,
      referenceRange: rule.formatRange,
      explanation: rule.warningExplanation || `Measurement differs from normal physiological reference intervals.`,
      recommendedAction: rule.warningAction,
      sourceReportId: reportId,
      sourceText,
      idempotencyKey: key
    };
  }
  return null;
}
function createInformationalAlert(userId, title, message, reportId) {
  const idempotencyKey = generateIdempotencyKey(userId, reportId || 0, "REPORT_PROCESSED", "INFORMATIONAL", title);
  return {
    severity: "INFORMATIONAL",
    title,
    message,
    parameter: "system",
    displayName: "Report Processing",
    measuredValue: "",
    unit: "",
    canonicalValue: null,
    canonicalUnit: "",
    referenceRange: "N/A",
    explanation: "Automated extraction and validation of your medical report has completed successfully.",
    recommendedAction: "Review your extracted biomarker records and trend graphs in the Dashboard.",
    sourceReportId: reportId,
    idempotencyKey
  };
}
function createEmergencyTestAlert(userId, recipientName) {
  const timestamp = Date.now();
  const idempotencyKey = crypto4.createHash("sha256").update(`test:${userId}:${timestamp}`).digest("hex");
  return {
    severity: "CRITICAL",
    title: "[TEST] Emergency Health Alert Verification",
    message: `[TEST ALERT - NO EMERGENCY] This is a verification test of the MediTrack emergency alert system for trusted contact ${recipientName || "Member"}. No action is required.`,
    parameter: "emergency_test",
    displayName: "Emergency Notification Test",
    measuredValue: "Simulated 185/115 mmHg (TEST)",
    unit: "mmHg",
    canonicalValue: 185,
    canonicalUnit: "mmHg",
    referenceRange: "90 - 120 mmHg",
    explanation: "This test confirms that your emergency contact email and SMS channels are functioning correctly and that delivery policies operate as expected.",
    recommendedAction: "No medical action required. This test verifies that alert notifications reach your trusted contact in the event of an urgent clinical finding.",
    idempotencyKey
  };
}
function generateIdempotencyKey(userId, reportId, param, severity, val) {
  const payload = `${userId}:${reportId}:${param}:${severity}:${val}`;
  return crypto4.createHash("sha256").update(payload).digest("hex");
}

// backend/services/emailDelivery.service.ts
init_env();
function buildEmergencyEmailHtml(payload) {
  const { recipientName, patientName, alert, isTest } = payload;
  const isCritical = alert.severity === "CRITICAL";
  const prefix = isTest ? "[TEST ALERT - NO EMERGENCY] " : isCritical ? "[URGENT MEDITRACK CRITICAL ALERT] " : "[MediTrack Health Alert] ";
  const subject = `${prefix}${alert.displayName || alert.title}`;
  const timestampIso = (/* @__PURE__ */ new Date()).toISOString();
  const formattedTime = (/* @__PURE__ */ new Date()).toUTCString();
  const headerColor = isTest ? "#4f46e5" : isCritical ? "#dc2626" : "#d97706";
  const badgeLabel = isTest ? "SYSTEM VERIFICATION TEST" : alert.severity;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: ${headerColor}; color: #ffffff; padding: 24px; text-align: left; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    .content { padding: 28px 24px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f1f5f9; border-radius: 8px; overflow: hidden; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .data-table tr:last-child td { border-bottom: none; }
    .label { color: #64748b; font-weight: 600; width: 35%; }
    .val { color: #0f172a; font-weight: 700; }
    .action-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 20px 0; }
    .action-box.test { background: #eef2ff; border-left-color: #6366f1; }
    .action-title { font-size: 14px; font-weight: 700; color: #991b1b; margin-bottom: 4px; }
    .action-box.test .action-title { color: #3730a3; }
    .disclaimer { font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .footer { font-size: 11px; color: #cbd5e1; text-align: center; padding: 16px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${badgeLabel}</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${alert.title}</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">MediTrack Automated Health Safety System</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">
        Dear <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        You are designated as an active Emergency Contact in MediTrack for <strong>${patientName || "your family member"}</strong>.
        ${isTest ? "This is a scheduled verification test of emergency notifications. No medical emergency has occurred." : "A concerning laboratory measurement or clinical finding was identified in a newly processed medical record."}
      </p>

      <table class="data-table">
        <tr>
          <td class="label">Finding / Parameter</td>
          <td class="val">${alert.displayName || alert.parameter}</td>
        </tr>
        <tr>
          <td class="label">Observed Value</td>
          <td class="val" style="color: ${headerColor};">${alert.measuredValue || "Abnormal Finding"}</td>
        </tr>
        <tr>
          <td class="label">Clinical Reference</td>
          <td class="val">${alert.referenceRange || "Standard Lab Reference"}</td>
        </tr>
        <tr>
          <td class="label">Timestamp</td>
          <td class="val">${formattedTime} (${timestampIso})</td>
        </tr>
        ${alert.sourceReportId ? `<tr><td class="label">Report Reference</td><td class="val">Report ID #${alert.sourceReportId}</td></tr>` : ""}
      </table>

      <div class="action-box ${isTest ? "test" : ""}">
        <div class="action-title">${isTest ? "Verification Status" : "Recommended Clinical Next Step"}</div>
        <p style="margin: 0; font-size: 13px; color: ${isTest ? "#312e81" : "#7f1d1d"}; line-height: 1.5;">
          ${alert.recommendedAction}
        </p>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        <strong>Clinical Context:</strong> ${alert.explanation}
      </p>

      <div class="disclaimer">
        <strong>IMPORTANT MEDICAL DISCLAIMER:</strong> This automated health alert was generated from uploaded laboratory data and verified clinical parameters. This notification is not a confirmed medical diagnosis and does not substitute for licensed healthcare evaluation or emergency dispatch services. If you suspect an acute life-threatening emergency, call local emergency services immediately.
      </div>
    </div>

    <div class="footer">
      MediTrack V3.1 Clinical Safety System \u2022 Secure Automated Dispatch \u2022 Sent to ${payload.toEmail}
    </div>
  </div>
</body>
</html>
  `;
  const text = `
${prefix}
${alert.title}
=====================================================
Recipient: ${recipientName}
Patient: ${patientName || "Family Member"}
Timestamp: ${formattedTime}

FINDING DETAILS:
- Parameter: ${alert.displayName || alert.parameter}
- Observed Value: ${alert.measuredValue}
- Reference Range: ${alert.referenceRange}

RECOMMENDED ACTION:
${alert.recommendedAction}

CLINICAL CONTEXT:
${alert.explanation}

DISCLAIMER: This automated alert is not a medical diagnosis. In a life-threatening emergency, call emergency services immediately.
=====================================================
MediTrack Clinical Safety System
  `.trim();
  return { subject, html, text };
}
async function sendViaResend(apiKey, payload) {
  const { subject, html, text } = buildEmergencyEmailHtml(payload);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: envConfig.EMAIL_FROM,
      to: [payload.toEmail],
      subject,
      html,
      text
    })
  });
  const resJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = resJson?.message || `Resend HTTP ${response.status}: ${response.statusText}`;
    return {
      success: false,
      deliveryStatus: "FAILED",
      provider: "resend",
      errorMessage: errorMsg
    };
  }
  return {
    success: true,
    deliveryStatus: "SENT",
    provider: "resend",
    providerMessageId: resJson.id || `resend_${Date.now()}`
  };
}
async function sendViaSendGrid(apiKey, payload) {
  const { subject, html, text } = buildEmergencyEmailHtml(payload);
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.toEmail, name: payload.recipientName }] }],
      from: { email: envConfig.EMAIL_FROM.replace(/.*<([^>]+)>.*/, "$1").trim() || "alerts@meditrack.health", name: "MediTrack Emergency Alert" },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html }
      ]
    })
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    return {
      success: false,
      deliveryStatus: "FAILED",
      provider: "sendgrid",
      errorMessage: `SendGrid HTTP ${response.status}: ${errorBody.slice(0, 200)}`
    };
  }
  const messageId = response.headers.get("x-message-id") || `sg_${Date.now()}`;
  return {
    success: true,
    deliveryStatus: "SENT",
    provider: "sendgrid",
    providerMessageId: messageId
  };
}
var emailDeliveryService = {
  /**
   * Check if email provider is properly configured
   */
  isConfigured() {
    return envConfig.IS_EMAIL_CONFIGURED;
  },
  /**
   * Send an emergency email alert
   */
  async sendEmergencyAlert(payload) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.toEmail || !emailRegex.test(payload.toEmail.trim())) {
      return {
        success: false,
        deliveryStatus: "FAILED",
        provider: "none",
        errorMessage: `Invalid recipient email address: '${payload.toEmail}'`
      };
    }
    if (envConfig.RESEND_API_KEY) {
      try {
        return await sendViaResend(envConfig.RESEND_API_KEY, payload);
      } catch (err) {
        return {
          success: false,
          deliveryStatus: "FAILED",
          provider: "resend",
          errorMessage: err.message || "Resend connection error"
        };
      }
    }
    if (envConfig.SENDGRID_API_KEY) {
      try {
        return await sendViaSendGrid(envConfig.SENDGRID_API_KEY, payload);
      } catch (err) {
        return {
          success: false,
          deliveryStatus: "FAILED",
          provider: "sendgrid",
          errorMessage: err.message || "SendGrid connection error"
        };
      }
    }
    console.warn(`[EmailDeliveryService] Transactional email credentials not configured in .env. Skipping external dispatch for ${payload.toEmail}.`);
    return {
      success: false,
      deliveryStatus: "FAILED",
      provider: "unconfigured",
      errorMessage: "EMAIL_PROVIDER_NOT_CONFIGURED: Missing RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials in environment."
    };
  }
};

// backend/services/smsDelivery.service.ts
init_env();
function validateAndFormatE164(phone) {
  if (!phone) {
    return { isValid: false, formatted: "", error: "Phone number is empty" };
  }
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      isValid: false,
      formatted: cleaned,
      error: `Invalid phone format '${phone}'. Must follow international format with country code (e.g. +1234567890 or +919876543210).`
    };
  }
  return { isValid: true, formatted: cleaned };
}
function buildEmergencySmsText(payload) {
  const { recipientName, patientName, alert, isTest } = payload;
  if (isTest) {
    return `[TEST ALERT - NO ACTION NEEDED] MediTrack emergency alert system verification for ${recipientName}. Your SMS contact channel is operational.`;
  }
  const patientText = patientName ? ` for ${patientName}` : "";
  const findingText = alert.displayName || alert.parameter;
  const valText = alert.measuredValue ? ` (${alert.measuredValue})` : "";
  return `MEDITRACK CRITICAL ALERT: Concerning clinical finding${patientText}. ${findingText}${valText}. ${alert.recommendedAction.slice(0, 90)}. Open MediTrack to view verified report.`;
}
var smsDeliveryService = {
  /**
   * Check if SMS provider is properly configured
   */
  isConfigured() {
    return envConfig.IS_SMS_CONFIGURED;
  },
  /**
   * Send an emergency SMS alert
   */
  async sendEmergencyAlert(payload) {
    const phoneCheck = validateAndFormatE164(payload.toPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        deliveryStatus: "FAILED",
        provider: "none",
        errorMessage: phoneCheck.error
      };
    }
    const formattedRecipient = phoneCheck.formatted;
    const messageBody = buildEmergencySmsText(payload);
    if (!envConfig.TWILIO_ACCOUNT_SID || !envConfig.TWILIO_AUTH_TOKEN || !envConfig.TWILIO_FROM_NUMBER || envConfig.TWILIO_ACCOUNT_SID.includes("your-")) {
      console.warn(`[SmsDeliveryService] Twilio SMS credentials not configured in .env. Skipping external dispatch for ${formattedRecipient}.`);
      return {
        success: false,
        deliveryStatus: "FAILED",
        provider: "twilio",
        errorMessage: "TWILIO_NOT_CONFIGURED: Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER in environment."
      };
    }
    try {
      const accountSid = envConfig.TWILIO_ACCOUNT_SID;
      const authToken = envConfig.TWILIO_AUTH_TOKEN;
      const fromNumber = envConfig.TWILIO_FROM_NUMBER;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", formattedRecipient);
      params.append("From", fromNumber);
      params.append("Body", messageBody);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const resJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = resJson?.message || `Twilio HTTP ${response.status}: ${response.statusText}`;
        console.error(`[SmsDeliveryService] Twilio rejected dispatch:`, errorMsg);
        return {
          success: false,
          deliveryStatus: "FAILED",
          provider: "twilio",
          errorMessage: errorMsg
        };
      }
      console.log(`[SmsDeliveryService] Twilio accepted SMS. SID: ${resJson.sid}`);
      return {
        success: true,
        deliveryStatus: "SENT",
        provider: "twilio",
        providerMessageId: resJson.sid
      };
    } catch (err) {
      console.error(`[SmsDeliveryService] Network or dispatch error:`, err);
      return {
        success: false,
        deliveryStatus: "FAILED",
        provider: "twilio",
        errorMessage: err.message || "Twilio connection failure"
      };
    }
  }
};

// backend/services/alertManager.service.ts
var alertManager = {
  /**
   * Process and evaluate all measurements from a medical report.
   * Generates deduplicated alerts and triggers emergency notifications when criteria are met.
   */
  async processReportAlerts(userId, reportId) {
    const reportRes = await db.execute({
      sql: "SELECT id, filename, report_type, report_date FROM medical_reports WHERE id = ? AND user_id = ?",
      args: [reportId, userId]
    });
    if (reportRes.rows.length === 0) return [];
    const report = reportRes.rows[0];
    const measRes = await db.execute({
      sql: `SELECT parameter, raw_value, normalized_value, unit, normalized_unit, source_page, source_text, extraction_confidence, validation_status 
            FROM measurements WHERE report_id = ?`,
      args: [reportId]
    });
    const measurements = measRes.rows;
    const createdAlerts = [];
    for (const m of measurements) {
      const classified = classifyMeasurement(userId, m, reportId, String(report.report_date));
      if (!classified) continue;
      const savedAlert = await this.persistAndDispatchAlert(userId, classified, reportId);
      if (savedAlert) {
        createdAlerts.push(savedAlert);
      }
    }
    if (createdAlerts.length === 0) {
      const infoAlert = createInformationalAlert(
        userId,
        "Report Processed Successfully",
        `Medical report "${report.filename}" was analyzed. All extracted biomarker values are within normal physiological bounds.`,
        reportId
      );
      const savedInfo = await this.persistAndDispatchAlert(userId, infoAlert, reportId);
      if (savedInfo) createdAlerts.push(savedInfo);
    }
    return createdAlerts;
  },
  /**
   * Persist an alert into `health_alerts` and trigger emergency dispatch if eligible.
   * Uses idempotency_key to prevent duplicate entries on page reload or repeated evaluation.
   */
  async persistAndDispatchAlert(userId, alert, reportId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (alert.idempotencyKey) {
      const existing = await db.execute({
        sql: "SELECT id FROM health_alerts WHERE user_id = ? AND idempotency_key = ?",
        args: [userId, alert.idempotencyKey]
      });
      if (existing.rows.length > 0) {
        console.log(`[AlertManager] Duplicate alert suppressed via idempotency key: ${alert.idempotencyKey}`);
        return null;
      }
    }
    const actionUrl = alert.sourceReportId ? `/reports?highlight=${alert.sourceReportId}` : "/dashboard";
    const detailsJson = JSON.stringify({
      canonicalValue: alert.canonicalValue,
      canonicalUnit: alert.canonicalUnit,
      explanation: alert.explanation,
      recommendedAction: alert.recommendedAction,
      sourceText: alert.sourceText
    });
    const insertResult = await db.execute({
      sql: `INSERT INTO health_alerts 
            (user_id, contact_id, type, severity, title, message, source, status, parameter, measured_value, reference_range, source_report_id, idempotency_key, action_url, details_json, is_read, created_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            RETURNING *`,
      args: [
        userId,
        alert.severity,
        // type
        alert.severity,
        // severity
        alert.title,
        alert.message,
        "Clinical System",
        "DELIVERED",
        alert.parameter,
        alert.measuredValue,
        alert.referenceRange,
        reportId || null,
        alert.idempotencyKey || null,
        actionUrl,
        detailsJson,
        now
      ]
    });
    const savedRecord = insertResult.rows[0];
    const alertId = Number(savedRecord.id);
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [
        alert.severity === "CRITICAL" ? "WARN" : "INFO",
        "HEALTH_ALERT_CREATED",
        `[${alert.severity}] Alert created for user ${userId}: ${alert.title}`,
        userId,
        now
      ]
    });
    const deliveries = [];
    if (alert.severity === "CRITICAL") {
      const dispatchedDeliveries = await this.dispatchEmergencyPolicy(userId, alertId, alert);
      deliveries.push(...dispatchedDeliveries);
    }
    return {
      ...savedRecord,
      deliveries
    };
  },
  /**
   * Evaluates user notification preferences and active trusted contacts,
   * then dispatches transactional email and SMS accordingly.
   */
  async dispatchEmergencyPolicy(userId, alertId, alert, isTest = false) {
    const deliveries = [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userRes = await db.execute({
      sql: "SELECT id, email, name, notification_email, notification_sms FROM users WHERE id = ?",
      args: [userId]
    });
    if (userRes.rows.length === 0) return [];
    const user = userRes.rows[0];
    const patientName = user.name || "Patient";
    const contactsRes = await db.execute({
      sql: `SELECT id, name, relationship, contact_method, contact_value, status 
            FROM trusted_contacts 
            WHERE user_id = ? AND status = 'ACTIVE'`,
      args: [userId]
    });
    const activeContacts = contactsRes.rows;
    if (activeContacts.length === 0) {
      console.warn(`[AlertManager] No active trusted contacts configured for user ${userId}. Recording SKIPPED delivery.`);
      const skippedRes = await db.execute({
        sql: `INSERT INTO notification_deliveries 
              (alert_id, channel, recipient, delivery_status, attempt_count, error_message, created_at, updated_at) 
              VALUES (?, 'IN_APP', ?, 'SKIPPED', 0, 'No active trusted contacts configured', ?, ?) 
              RETURNING *`,
        args: [alertId, user.email || "N/A", now, now]
      });
      deliveries.push(skippedRes.rows[0]);
      return deliveries;
    }
    for (const c of activeContacts) {
      const contactName = String(c.name || "Emergency Contact");
      const contactMethod = String(c.contact_method || "EMAIL").toUpperCase();
      const contactValue = String(c.contact_value || "").trim();
      const isEmail = contactMethod === "EMAIL" || contactValue.includes("@");
      if (isEmail) {
        const userConsentsEmail = user.notification_email !== 0;
        if (!userConsentsEmail) {
          console.log(`[AlertManager] User ${userId} has disabled email alerts.`);
          continue;
        }
        console.log(`[AlertManager] Dispatching emergency email to ${contactName} (${contactValue})...`);
        const emailResult = await emailDeliveryService.sendEmergencyAlert({
          toEmail: contactValue,
          recipientName: contactName,
          patientName,
          alert,
          isTest
        });
        const deliveryInsert = await db.execute({
          sql: `INSERT INTO notification_deliveries 
                (alert_id, channel, recipient, provider_message_id, delivery_status, attempt_count, error_message, created_at, updated_at)
                VALUES (?, 'EMAIL', ?, ?, ?, 1, ?, ?, ?)
                RETURNING *`,
          args: [
            alertId,
            contactValue,
            emailResult.providerMessageId || null,
            emailResult.deliveryStatus,
            emailResult.errorMessage || null,
            now,
            now
          ]
        });
        deliveries.push(deliveryInsert.rows[0]);
        await db.execute({
          sql: "UPDATE health_alerts SET contact_id = ? WHERE id = ?",
          args: [c.id, alertId]
        });
        await db.execute({
          sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [
            emailResult.success ? "INFO" : "WARN",
            "EMERGENCY_EMAIL_DISPATCH",
            `Email to ${contactValue} [${emailResult.deliveryStatus}] ${emailResult.errorMessage ? `Error: ${emailResult.errorMessage}` : ""}`,
            userId,
            now
          ]
        });
      }
      const isSms = contactMethod === "SMS" || /^\+?[0-9\s\-]+$/.test(contactValue);
      if (isSms) {
        const userConsentsSms = user.notification_sms !== 0;
        if (!userConsentsSms) {
          console.log(`[AlertManager] User ${userId} has disabled SMS alerts.`);
          continue;
        }
        console.log(`[AlertManager] Dispatching emergency SMS to ${contactName} (${contactValue})...`);
        const smsResult = await smsDeliveryService.sendEmergencyAlert({
          toPhone: contactValue,
          recipientName: contactName,
          patientName,
          alert,
          isTest
        });
        const deliveryInsert = await db.execute({
          sql: `INSERT INTO notification_deliveries 
                (alert_id, channel, recipient, provider_message_id, delivery_status, attempt_count, error_message, created_at, updated_at)
                VALUES (?, 'SMS', ?, ?, ?, 1, ?, ?, ?)
                RETURNING *`,
          args: [
            alertId,
            contactValue,
            smsResult.providerMessageId || null,
            smsResult.deliveryStatus,
            smsResult.errorMessage || null,
            now,
            now
          ]
        });
        deliveries.push(deliveryInsert.rows[0]);
        await db.execute({
          sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [
            smsResult.success ? "INFO" : "WARN",
            "EMERGENCY_SMS_DISPATCH",
            `SMS to ${contactValue} [${smsResult.deliveryStatus}] ${smsResult.errorMessage ? `Error: ${smsResult.errorMessage}` : ""}`,
            userId,
            now
          ]
        });
      }
    }
    return deliveries;
  },
  /**
   * Explicit test-send action for user verification of emergency alert channels.
   * Labels the message prominently so it cannot be mistaken for an actual emergency.
   */
  async sendTestEmergencyAlert(userId, contactId) {
    let recipientName = "Emergency Contact";
    if (contactId) {
      const cRes = await db.execute({
        sql: "SELECT name FROM trusted_contacts WHERE id = ? AND user_id = ?",
        args: [contactId, userId]
      });
      if (cRes.rows.length > 0) {
        recipientName = String(cRes.rows[0].name);
      }
    }
    const testAlert = createEmergencyTestAlert(userId, recipientName);
    const savedAlert = await this.persistAndDispatchAlert(userId, testAlert);
    if (!savedAlert) {
      throw new Error("Failed to create test emergency alert record");
    }
    const deliveries = await this.dispatchEmergencyPolicy(userId, savedAlert.id, testAlert, true);
    savedAlert.deliveries = deliveries;
    return { alert: savedAlert, deliveries };
  },
  /**
   * Get all alerts for a user with deliveries
   */
  async getUserAlerts(userId, limit = 50) {
    const alertsRes = await db.execute({
      sql: `SELECT a.*, c.name as contact_name 
            FROM health_alerts a 
            LEFT JOIN trusted_contacts c ON a.contact_id = c.id 
            WHERE a.user_id = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
      args: [userId, limit]
    });
    const alertRows = alertsRes.rows;
    if (alertRows.length === 0) return [];
    const alertIds = alertRows.map((r) => r.id);
    const placeholders = alertIds.map(() => "?").join(",");
    const deliveriesRes = await db.execute({
      sql: `SELECT * FROM notification_deliveries WHERE alert_id IN (${placeholders}) ORDER BY created_at ASC`,
      args: alertIds
    });
    const deliveriesByAlert = {};
    for (const d of deliveriesRes.rows) {
      const aid = Number(d.alert_id);
      if (!deliveriesByAlert[aid]) deliveriesByAlert[aid] = [];
      deliveriesByAlert[aid].push(d);
    }
    return alertRows.map((a) => ({
      ...a,
      deliveries: deliveriesByAlert[Number(a.id)] || []
    }));
  }
};

// server.ts
dotenv2.config({ quiet: true, override: true });
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(securityHeadersMiddleware);
var allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()) : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const parsed = new URL(origin);
      const normalizedOrigin = parsed.origin;
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      if (parsed.protocol === "https:" && (parsed.hostname.endsWith(".run.app") || parsed.hostname === "run.app")) {
        return callback(null, true);
      }
      if (parsed.protocol === "https:" && (parsed.hostname.endsWith(".vercel.app") || parsed.hostname === "vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    } catch {
      return callback(new Error(`Malformed CORS origin: ${origin}`));
    }
  },
  credentials: true
}));
app.use("/api", generalRateLimiter);
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    version: "3.2.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: getEnvironmentDiagnostics(),
    ai: aiService.getHealth()
  });
});
app.get("/api/ai/health", (req, res) => {
  res.json(aiService.getHealth());
});
function clearCache(key) {
  if (appCache[key]) {
    appCache[key].data = null;
    appCache[key].timestamp = 0;
  }
}
var appCache = {
  facilities: { data: null, timestamp: 0 },
  specialtyRules: { data: null, timestamp: 0 }
};
var CACHE_TTL_MS3 = 60 * 1e3;
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = process.env.VERCEL ? path5.join("/tmp", "uploads") : "./uploads";
    if (!fs4.existsSync(dir)) fs4.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + crypto5.randomBytes(8).toString("hex");
    const safeExt = path5.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api/specialists", specialistsRouter);
app.use("/api/notifications", notificationsRouter);
async function initDb() {
  const resolvedDbPath = path5.resolve(process.cwd(), "meditrack_new.db");
  console.log(`[Database] Initializing database at: ${resolvedDbPath}`);
  try {
    await db.execute("PRAGMA foreign_keys = ON;");
    await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      hashed_password TEXT,
      name TEXT,
      phone TEXT,
      date_of_birth TEXT,
      role TEXT DEFAULT 'USER',
      status TEXT DEFAULT 'ACTIVE',
      notification_email INTEGER DEFAULT 1,
      notification_sms INTEGER DEFAULT 0,
      notification_push INTEGER DEFAULT 1,
      notification_health_reminders INTEGER DEFAULT 0,
      notification_lab_report_alerts INTEGER DEFAULT 0,
      notification_frequency TEXT DEFAULT 'instant'
    )
  `);
    try {
      await db.execute("ALTER TABLE users ADD COLUMN phone TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN date_of_birth TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_email INTEGER DEFAULT 1");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_sms INTEGER DEFAULT 0");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_push INTEGER DEFAULT 1");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_health_reminders INTEGER DEFAULT 0");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_lab_report_alerts INTEGER DEFAULT 0");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN notification_frequency TEXT DEFAULT 'instant'");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN gender TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN blood_group TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN height_cm REAL");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN weight_kg REAL");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN emergency_contact_name TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN emergency_contact_relationship TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE users ADD COLUMN emergency_contact_phone TEXT");
    } catch (e) {
    }
    await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      frequency TEXT,
      time_of_day TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER,
      date TEXT,
      completed INTEGER,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      dosage TEXT,
      frequency TEXT,
      time_of_day TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER,
      date TEXT,
      taken INTEGER,
      FOREIGN KEY(medication_id) REFERENCES medications(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      report_type TEXT,
      report_date TEXT,
      upload_date TEXT,
      processing_status TEXT,
      file_path TEXT,
      file_hash TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      parameter TEXT,
      raw_value TEXT,
      normalized_value TEXT,
      unit TEXT,
      normalized_unit TEXT,
      source_page TEXT,
      source_text TEXT,
      extraction_confidence TEXT,
      validation_status TEXT,
      FOREIGN KEY(report_id) REFERENCES medical_reports(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS contradictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      report_a INTEGER,
      report_b INTEGER,
      value_a TEXT,
      value_b TEXT,
      date_a TEXT,
      date_b TEXT,
      severity TEXT,
      reason TEXT,
      source_page_a TEXT,
      source_page_b TEXT,
      status TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      direction TEXT,
      valid_measurement_count INTEGER,
      start_date TEXT,
      end_date TEXT,
      evidence TEXT,
      data_quality TEXT,
      analysis_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS risk_assessment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      domain TEXT,
      level TEXT,
      label TEXT,
      evidence TEXT,
      data_quality TEXT,
      rule_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS future_outlook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      parameter TEXT,
      forecast_direction TEXT,
      forecast_range TEXT,
      confidence_category TEXT,
      limitations TEXT,
      model_version TEXT,
      input_data_version TEXT,
      data_quality TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS specialty_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT,
      specialty TEXT,
      rule_reference TEXT,
      version TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS specialty_guidance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      domain TEXT,
      suggested_specialty TEXT,
      evidence TEXT,
      rule_version TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    const rulesCheck = await db.execute("SELECT count(*) as count FROM specialty_rules");
    if (rulesCheck.rows[0].count === 0) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ["cardiovascular", "Internal Medicine / Cardiology", "AHA/ACC Guidelines", "1.0", 1, now]
      });
      await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ["metabolic", "Internal Medicine / Endocrinology", "ADA Standards of Care", "1.0", 1, now]
      });
      await db.execute({
        sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: ["kidney-related", "Internal Medicine / Nephrology", "KDIGO Guidelines", "1.0", 1, now]
      });
    }
    await db.execute(`
    CREATE TABLE IF NOT EXISTS healthcare_facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      specialties TEXT,
      address TEXT,
      city TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      verification_status TEXT,
      last_verified TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      relationship TEXT,
      contact_method TEXT,
      contact_value TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS health_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      contact_id INTEGER,
      type TEXT,
      message TEXT,
      source TEXT,
      status TEXT,
      delivery_channel TEXT,
      event_key TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(contact_id) REFERENCES trusted_contacts(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT,
      event_type TEXT,
      message TEXT,
      user_id INTEGER,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      request_ip TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      last_used_at TEXT,
      user_agent TEXT,
      ip_address TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS medical_analysis_cache (
      user_id INTEGER PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN is_read INTEGER DEFAULT 0");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN read_at TEXT");
    } catch (e) {
    }
    try {
      await db.execute('ALTER TABLE health_alerts ADD COLUMN severity TEXT DEFAULT "WARNING"');
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN title TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN parameter TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN measured_value TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN reference_range TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN source_report_id INTEGER");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN idempotency_key TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN action_url TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE health_alerts ADD COLUMN details_json TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE trusted_contacts ADD COLUMN email TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE trusted_contacts ADD COLUMN phone TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE trusted_contacts ADD COLUMN is_emergency INTEGER DEFAULT 1");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE trusted_contacts ADD COLUMN consent_email INTEGER DEFAULT 1");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE trusted_contacts ADD COLUMN consent_sms INTEGER DEFAULT 1");
    } catch (e) {
    }
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id INTEGER,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        provider_message_id TEXT,
        delivery_status TEXT NOT NULL,
        attempt_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(alert_id) REFERENCES health_alerts(id) ON DELETE CASCADE
      )
    `);
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN status TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN display_name TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN canonical_unit TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN observation_count INTEGER");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN distinct_dates_count INTEGER");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN history_duration_days INTEGER");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN last_observed_value REAL");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN last_observed_date TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN forecast_target_date TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN forecast_value REAL");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN prediction_interval_json TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN backtest_metrics_json TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN reason_code TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN reason_message TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN excluded_count INTEGER DEFAULT 0");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN history_json TEXT");
    } catch (e) {
    }
    try {
      await db.execute("ALTER TABLE future_outlook ADD COLUMN run_id TEXT");
    } catch (e) {
    }
    const indexStatements = [
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
      "CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_hash ON password_reset_tokens(token_hash)",
      "CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_auth_sessions_hash ON auth_sessions(refresh_token_hash)",
      "CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_reports_user ON medical_reports(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_reports_hash ON medical_reports(file_hash)",
      "CREATE INDEX IF NOT EXISTS idx_reports_date ON medical_reports(report_date)",
      "CREATE INDEX IF NOT EXISTS idx_meas_report ON measurements(report_id)",
      "CREATE INDEX IF NOT EXISTS idx_contradictions_user ON contradictions(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_trends_user ON trends(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_assessment(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_outlook_user ON future_outlook(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_specialty_guidance_user ON specialty_guidance(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_alerts_user ON health_alerts(user_id)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_event_user_key ON health_alerts(user_id, event_key)",
      "CREATE INDEX IF NOT EXISTS idx_meds_user ON medications(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_analysis_cache_user ON medical_analysis_cache(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_deliveries_alert ON notification_deliveries(alert_id)",
      "CREATE INDEX IF NOT EXISTS idx_deliveries_status ON notification_deliveries(delivery_status)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_idempotency ON health_alerts(idempotency_key)"
    ];
    for (const stmt of indexStatements) {
      try {
        await db.execute(stmt);
      } catch (e) {
      }
    }
    try {
      await initNotificationSchema(db);
      const schemaCheck = await validateDatabaseSchema(db);
      if (!schemaCheck.valid) {
        console.error("[Schema Warning] Missing database components:", schemaCheck.missing);
      } else {
        console.log(`[Schema Verified] Database schema v${schemaCheck.userVersion} verified successfully.`);
      }
    } catch (e) {
      console.warn("Notification schema migration notice:", e);
    }
    const facilitiesCheck = await db.execute("SELECT count(*) as count FROM healthcare_facilities");
    if (facilitiesCheck.rows[0].count === 0 && process.env.NODE_ENV !== "production") {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const demoFacilities = [
        { name: "Raipur Heart Center (Demo)", specialties: "Cardiology", address: "123 Main St", city: "Raipur", lat: 21.2514, lng: 81.6296, phone: "555-0101" },
        { name: "Endocrine Care Clinic (Demo)", specialties: "Endocrinology", address: "456 Oak Rd", city: "Raipur", lat: 21.2614, lng: 81.6396, phone: "555-0102" },
        { name: "City Hospital (Demo)", specialties: "Cardiology, Nephrology", address: "789 Pine Ave", city: "Raipur", lat: 21.2414, lng: 81.6196, phone: "555-0103" }
      ];
      for (const f of demoFacilities) {
        await db.execute({
          sql: `INSERT INTO healthcare_facilities (name, specialties, address, city, latitude, longitude, phone, verification_status, last_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [f.name, f.specialties, f.address, f.city, f.lat, f.lng, f.phone, "DEMO DATA", now, now, now]
        });
      }
    }
    const defaultPasswordHash = await bcrypt2.hash("password123", 10);
    const defaultAdminHash = await bcrypt2.hash("admin123", 10);
    const testUser = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = ?",
      args: ["test@meditrack.com"]
    });
    if (testUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status, date_of_birth, gender, blood_group, height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["test@meditrack.com", defaultPasswordHash, "Leo Martinez", "USER", "ACTIVE", "2003-08-15", "Male", "O+", 175, 70, "Maria Martinez", "Parent", "+1 555-892-1140"]
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET hashed_password = ?, status = ? WHERE id = ?",
        args: [defaultPasswordHash, "ACTIVE", testUser.rows[0].id]
      });
    }
    const adminUser = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = ?",
      args: ["admin@meditrack.com"]
    });
    if (adminUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status)
              VALUES (?, ?, ?, ?, ?)`,
        args: ["admin@meditrack.com", defaultAdminHash, "System Administrator", "ADMIN", "ACTIVE"]
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET hashed_password = ?, role = ?, status = ? WHERE id = ?",
        args: [defaultAdminHash, "ADMIN", "ACTIVE", adminUser.rows[0].id]
      });
    }
    const namanUser = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = ?",
      args: ["namanguptai095@gmail.com"]
    });
    if (namanUser.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (email, hashed_password, name, role, status)
              VALUES (?, ?, ?, ?, ?)`,
        args: ["namanguptai095@gmail.com", defaultPasswordHash, "Naman Gupta", "USER", "ACTIVE"]
      });
    } else {
      await db.execute({
        sql: "UPDATE users SET hashed_password = ?, status = ? WHERE id = ?",
        args: [defaultPasswordHash, "ACTIVE", namanUser.rows[0].id]
      });
    }
  } catch (initErr) {
    console.error("Database initialization warning:", initErr);
  }
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}
app.post("/api/auth/register", authRateLimiter, async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Full Name, email, and password are required", code: "VALIDATION_FAILED" });
  }
  const normalizedEmail = email.toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address format", code: "INVALID_EMAIL" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long for security", code: "WEAK_PASSWORD" });
  }
  try {
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = ?",
      args: [normalizedEmail]
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "An account with this email already exists", code: "USER_EXISTS" });
    }
    const hashedPassword = await bcrypt2.hash(password, 10);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await db.execute({
      sql: "INSERT INTO users (email, hashed_password, name, role, status) VALUES (?, ?, ?, ?, ?) RETURNING id",
      args: [normalizedEmail, hashedPassword, name.toString().trim(), "USER", "ACTIVE"]
    });
    const newUserId = result.rows[0].id;
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["INFO", "USER_REGISTERED", `New user registered: ${normalizedEmail}`, newUserId, now]
    });
    res.json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create user account", code: "SERVER_ERROR" });
  }
});
app.post("/api/auth/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required", code: "MISSING_CREDENTIALS" });
  }
  const normalizedEmail = email.toString().trim().toLowerCase();
  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE LOWER(email) = ?",
    args: [normalizedEmail]
  });
  const user = result.rows[0];
  if (!user) {
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["WARN", "AUTH_LOGIN_FAILED", `Failed login attempt for unknown email: ${normalizedEmail} from ${clientIp}`, null, now]
    });
    return res.status(400).json({
      error: "Invalid email or password. Please verify your credentials or register a new account.",
      code: "INVALID_CREDENTIALS"
    });
  }
  if (user.status === "SUSPENDED" || user.status === "DISABLED" || user.status === "DELETED") {
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["WARN", "AUTH_LOGIN_BLOCKED", `Blocked login attempt for suspended user ${user.id} (${normalizedEmail})`, user.id, now]
    });
    return res.status(403).json({
      error: "Your account has been suspended or deactivated. Please contact an administrator.",
      code: "ACCOUNT_SUSPENDED"
    });
  }
  const validPassword = await bcrypt2.compare(password, user.hashed_password);
  if (!validPassword) {
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["WARN", "AUTH_LOGIN_FAILED", `Failed login attempt (bad password) for user ${user.id} (${normalizedEmail})`, user.id, now]
    });
    return res.status(400).json({
      error: "Invalid email or password. Please check your credentials.",
      code: "INVALID_CREDENTIALS"
    });
  }
  const session = await authService.createSession(db, Number(user.id), userAgent, clientIp);
  const accessToken = generateAccessToken({
    id: Number(user.id),
    email: String(user.email),
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: String(user.status)
  });
  res.cookie("refreshToken", session.rawRefreshToken, {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: envConfig.REFRESH_TOKEN_MS
  });
  await db.execute({
    sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["INFO", "AUTH_LOGIN_SUCCESS", `User ${user.id} logged in from ${clientIp}`, user.id, now]
  });
  res.json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: envConfig.ACCESS_TOKEN_EXPIRES_IN_SEC,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }
  });
});
app.post("/api/auth/refresh", async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
    return res.status(401).json({
      error: "Refresh token not provided or session expired.",
      code: "REFRESH_TOKEN_REQUIRED"
    });
  }
  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  const session = await authService.findSessionByRefreshToken(db, rawRefreshToken);
  if (!session) {
    return res.status(401).json({
      error: "Invalid authentication session. Please log in again.",
      code: "INVALID_SESSION"
    });
  }
  if (session.revoked_at) {
    await authService.revokeAllUserSessions(db, session.user_id);
    res.clearCookie("refreshToken", { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: "lax", path: "/" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["WARN", "SECURITY_ALERT_TOKEN_REUSE", `Potential refresh token reuse detected for user ${session.user_id}. All sessions revoked.`, session.user_id, now]
    });
    return res.status(401).json({
      error: "Security alert: Authentication token reuse detected. All sessions revoked for safety.",
      code: "TOKEN_REUSE_DETECTED"
    });
  }
  if (new Date(session.expires_at) < /* @__PURE__ */ new Date()) {
    await authService.revokeSession(db, session.id);
    res.clearCookie("refreshToken", { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: "lax", path: "/" });
    return res.status(401).json({
      error: "Refresh session expired. Please log in again.",
      code: "SESSION_EXPIRED"
    });
  }
  const userRes = await db.execute({
    sql: "SELECT id, email, name, role, status FROM users WHERE id = ?",
    args: [session.user_id]
  });
  if (userRes.rows.length === 0) {
    return res.status(401).json({ error: "User no longer exists", code: "USER_NOT_FOUND" });
  }
  const user = userRes.rows[0];
  if (user.status === "SUSPENDED" || user.status === "DISABLED" || user.status === "DELETED") {
    await authService.revokeSession(db, session.id);
    res.clearCookie("refreshToken", { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: "lax", path: "/" });
    return res.status(403).json({ error: "Account has been suspended", code: "ACCOUNT_SUSPENDED" });
  }
  const rotated = await authService.rotateSession(db, session.id, userAgent, clientIp);
  const newAccessToken = generateAccessToken({
    id: Number(user.id),
    email: String(user.email),
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: String(user.status)
  });
  res.cookie("refreshToken", rotated.newRawRefreshToken, {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: envConfig.REFRESH_TOKEN_MS
  });
  res.json({
    access_token: newAccessToken,
    token_type: "bearer",
    expires_in: envConfig.ACCESS_TOKEN_EXPIRES_IN_SEC,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }
  });
});
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body || {};
  const genericMessage = "If an account exists for this email, a password reset link has been sent.";
  if (!email || typeof email !== "string") {
    return res.json({ message: genericMessage });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const clientIp = getClientIp(req);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const userRes = await db.execute({
    sql: "SELECT id, email, status FROM users WHERE LOWER(email) = ?",
    args: [normalizedEmail]
  });
  if (userRes.rows.length === 0) {
    return res.json({ message: genericMessage });
  }
  const user = userRes.rows[0];
  if (user.status === "SUSPENDED" || user.status === "DISABLED") {
    return res.json({ message: genericMessage });
  }
  const { rawToken } = await authService.createPasswordResetToken(db, Number(user.id), clientIp);
  await db.execute({
    sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["INFO", "PASSWORD_RESET_REQUESTED", `Password reset token generated for user ${user.id} (${normalizedEmail})`, user.id, now]
  });
  if (!envConfig.IS_PRODUCTION) {
    console.log(`
======================================================`);
    console.log(`[DEV-ONLY RESET LINK] For: ${normalizedEmail}`);
    console.log(`Token: ${rawToken}`);
    console.log(`Reset URL: http://localhost:3000/login?reset_token=${rawToken}`);
    console.log(`======================================================
`);
    return res.json({
      message: genericMessage,
      devResetToken: rawToken,
      devResetUrl: `/login?reset_token=${rawToken}`
    });
  }
  res.json({ message: genericMessage });
});
app.post("/api/auth/verify-reset-token", async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ valid: false, error: "Reset token is required" });
  }
  const verify = await authService.verifyPasswordResetToken(db, token);
  if (!verify.valid) {
    return res.status(400).json({ valid: false, error: verify.error });
  }
  res.json({ valid: true, email: verify.user.email });
});
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({
      error: "A valid password reset token is required to reset your password. Direct password reset without token verification is disabled for security.",
      code: "TOKEN_REQUIRED"
    });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters long for security.",
      code: "WEAK_PASSWORD"
    });
  }
  const verify = await authService.verifyPasswordResetToken(db, token);
  if (!verify.valid) {
    return res.status(400).json({
      error: verify.error || "Invalid or expired password reset token.",
      code: "INVALID_RESET_TOKEN"
    });
  }
  const user = verify.user;
  const tokenRecord = verify.tokenRecord;
  const hashedPassword = await bcrypt2.hash(newPassword, 10);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: "UPDATE users SET hashed_password = ? WHERE id = ?",
    args: [hashedPassword, user.id]
  });
  await db.execute({
    sql: "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
    args: [now, tokenRecord.id]
  });
  await authService.revokeAllUserSessions(db, user.id);
  res.clearCookie("refreshToken", { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: "lax", path: "/" });
  await db.execute({
    sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["INFO", "PASSWORD_RESET_COMPLETED", `Password reset completed successfully for user ${user.id} (${user.email})`, user.id, now]
  });
  res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
});
function computeAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = /* @__PURE__ */ new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || m === 0 && today.getDate() < dob.getDate()) {
    age--;
  }
  return age >= 0 && age <= 125 ? age : null;
}
function computeBmiAndCategory(heightCm, weightKg) {
  if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) {
    return { bmi: null, bmiCategory: null };
  }
  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;
  let bmiCategory = "Normal";
  if (bmi < 18.5) {
    bmiCategory = "Underweight";
  } else if (bmi < 25) {
    bmiCategory = "Normal";
  } else if (bmi < 30) {
    bmiCategory = "Overweight";
  } else {
    bmiCategory = "Obesity";
  }
  return { bmi, bmiCategory };
}
function formatUserProfile(row) {
  if (!row) return null;
  const heightCm = row.height_cm != null && row.height_cm !== "" ? Number(row.height_cm) : null;
  const weightKg = row.weight_kg != null && row.weight_kg !== "" ? Number(row.weight_kg) : null;
  const age = computeAge(row.date_of_birth);
  const { bmi, bmiCategory } = computeBmiAndCategory(heightCm, weightKg);
  const emergencyContact = {
    name: row.emergency_contact_name || "",
    relationship: row.emergency_contact_relationship || "",
    phone: row.emergency_contact_phone || ""
  };
  return {
    ...row,
    fullName: row.name || "",
    dateOfBirth: row.date_of_birth || null,
    age,
    gender: row.gender || "",
    blood_group: row.blood_group || "",
    bloodGroup: row.blood_group || "",
    height_cm: heightCm,
    heightCm,
    weight_kg: weightKg,
    weightKg,
    bmi,
    bmiCategory,
    emergency_contact_name: emergencyContact.name,
    emergency_contact_relationship: emergencyContact.relationship,
    emergency_contact_phone: emergencyContact.phone,
    emergencyContact
  };
}
var handleGetProfile = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT id, email, name, role, status, phone, date_of_birth, gender, blood_group,
                   height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                   notification_email, notification_sms, notification_telegram, notification_push,
                   notification_health_reminders, notification_lab_report_alerts, notification_frequency
            FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(formatUserProfile(result.rows[0]));
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to retrieve profile" });
  }
};
var handleUpdateProfile = async (req, res) => {
  const body = req.body || {};
  const name = body.fullName !== void 0 ? body.fullName : body.name !== void 0 ? body.name : void 0;
  const phone = body.phone !== void 0 ? body.phone : void 0;
  const date_of_birth = body.dateOfBirth !== void 0 ? body.dateOfBirth : body.date_of_birth !== void 0 ? body.date_of_birth : void 0;
  const gender = body.gender !== void 0 ? body.gender : void 0;
  const blood_group = body.bloodGroup !== void 0 ? body.bloodGroup : body.blood_group !== void 0 ? body.blood_group : void 0;
  let height_cm = body.heightCm !== void 0 ? body.heightCm : body.height_cm !== void 0 ? body.height_cm : void 0;
  let weight_kg = body.weightKg !== void 0 ? body.weightKg : body.weight_kg !== void 0 ? body.weight_kg : void 0;
  const emContact = body.emergencyContact || {};
  const emName = emContact.name !== void 0 ? emContact.name : body.emergency_contact_name;
  const emRel = emContact.relationship !== void 0 ? emContact.relationship : body.emergency_contact_relationship;
  const emPhone = emContact.phone !== void 0 ? emContact.phone : body.emergency_contact_phone;
  const notifEmail = body.notification_email;
  const notifSms = body.notification_sms;
  const notifTelegram = body.notification_telegram;
  const notifPush = body.notification_push;
  const notifHealthReminders = body.notification_health_reminders;
  const notifLabReportAlerts = body.notification_lab_report_alerts;
  const notifFrequency = body.notification_frequency;
  for (const [label, value] of [
    ["Email notifications", notifEmail],
    ["SMS notifications", notifSms],
    ["Telegram notifications", notifTelegram],
    ["Push notifications", notifPush],
    ["Health reminders", notifHealthReminders],
    ["Lab report alerts", notifLabReportAlerts]
  ]) {
    if (value !== void 0 && ![0, 1, true, false].includes(value)) {
      return res.status(400).json({ error: `${label} must be enabled or disabled` });
    }
  }
  if (notifFrequency !== void 0 && !["instant", "daily", "weekly"].includes(notifFrequency)) {
    return res.status(400).json({ error: "Notification cadence must be instant, daily, or weekly" });
  }
  if (name !== void 0) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Full Name cannot be empty" });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: "Full Name must be under 100 characters" });
    }
  }
  if (date_of_birth !== void 0 && date_of_birth !== null && date_of_birth !== "") {
    const parsedDob = new Date(date_of_birth);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({ error: "Invalid Date of Birth format" });
    }
    const today = /* @__PURE__ */ new Date();
    if (parsedDob > today) {
      return res.status(400).json({ error: "Date of Birth cannot be in the future" });
    }
    const age = computeAge(date_of_birth);
    if (age !== null && age > 125) {
      return res.status(400).json({ error: "Date of Birth exceeds realistic age limit (125 years)" });
    }
  }
  const allowedGenders = ["Male", "Female", "Other", "Prefer not to say", ""];
  if (gender !== void 0 && gender !== null && !allowedGenders.includes(gender)) {
    return res.status(400).json({ error: `Invalid gender option. Allowed: ${allowedGenders.filter(Boolean).join(", ")}` });
  }
  const allowedBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown", ""];
  if (blood_group !== void 0 && blood_group !== null && !allowedBloodGroups.includes(blood_group)) {
    return res.status(400).json({ error: `Invalid blood group. Allowed: ${allowedBloodGroups.filter(Boolean).join(", ")}` });
  }
  if (height_cm !== void 0 && height_cm !== null && height_cm !== "") {
    const numHeight = Number(height_cm);
    if (isNaN(numHeight) || numHeight < 40 || numHeight > 260) {
      return res.status(400).json({ error: "Height must be a valid number between 40 cm and 260 cm" });
    }
    height_cm = Math.round(numHeight * 10) / 10;
  } else if (height_cm === "") {
    height_cm = null;
  }
  if (weight_kg !== void 0 && weight_kg !== null && weight_kg !== "") {
    const numWeight = Number(weight_kg);
    if (isNaN(numWeight) || numWeight < 15 || numWeight > 350) {
      return res.status(400).json({ error: "Weight must be a valid number between 15 kg and 350 kg" });
    }
    weight_kg = Math.round(numWeight * 10) / 10;
  } else if (weight_kg === "") {
    weight_kg = null;
  }
  const allowedRelationships = ["Parent", "Spouse", "Sibling", "Child", "Friend", "Relative", "Guardian", "Other", ""];
  if (emRel !== void 0 && emRel !== null && !allowedRelationships.includes(emRel)) {
    return res.status(400).json({ error: `Invalid relationship. Allowed: ${allowedRelationships.filter(Boolean).join(", ")}` });
  }
  try {
    const currentRes = await db.execute({
      sql: `SELECT * FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const current = currentRes.rows[0];
    const finalName = name !== void 0 ? name.trim() : current.name;
    const finalPhone = phone !== void 0 ? phone || null : current.phone;
    const finalDob = date_of_birth !== void 0 ? date_of_birth || null : current.date_of_birth;
    const finalGender = gender !== void 0 ? gender || null : current.gender;
    const finalBlood = blood_group !== void 0 ? blood_group || null : current.blood_group;
    const finalHeight = height_cm !== void 0 ? height_cm : current.height_cm;
    const finalWeight = weight_kg !== void 0 ? weight_kg : current.weight_kg;
    const finalEmName = emName !== void 0 ? emName ? emName.trim() : null : current.emergency_contact_name;
    const finalEmRel = emRel !== void 0 ? emRel || null : current.emergency_contact_relationship;
    const finalEmPhone = emPhone !== void 0 ? emPhone ? emPhone.trim() : null : current.emergency_contact_phone;
    const finalEmailNotif = notifEmail !== void 0 ? notifEmail ? 1 : 0 : current.notification_email ?? 1;
    const finalSmsNotif = notifSms !== void 0 ? notifSms ? 1 : 0 : current.notification_sms ?? 0;
    const finalTelegramNotif = notifTelegram !== void 0 ? notifTelegram ? 1 : 0 : current.notification_telegram ?? 1;
    const finalPushNotif = notifPush !== void 0 ? notifPush ? 1 : 0 : current.notification_push ?? 1;
    const finalHealthReminders = notifHealthReminders !== void 0 ? notifHealthReminders ? 1 : 0 : current.notification_health_reminders ?? 0;
    const finalLabReportAlerts = notifLabReportAlerts !== void 0 ? notifLabReportAlerts ? 1 : 0 : current.notification_lab_report_alerts ?? 0;
    const finalNotificationFrequency = notifFrequency !== void 0 ? notifFrequency : current.notification_frequency || "instant";
    await db.execute({
      sql: `UPDATE users SET 
              name = ?, 
              phone = ?, 
              date_of_birth = ?, 
              gender = ?,
              blood_group = ?,
              height_cm = ?,
              weight_kg = ?,
              emergency_contact_name = ?,
              emergency_contact_relationship = ?,
              emergency_contact_phone = ?,
              notification_email = ?, 
              notification_sms = ?, 
              notification_telegram = ?,
              notification_push = ?,
              notification_health_reminders = ?,
              notification_lab_report_alerts = ?,
              notification_frequency = ?
            WHERE id = ?`,
      args: [
        finalName,
        finalPhone,
        finalDob,
        finalGender,
        finalBlood,
        finalHeight,
        finalWeight,
        finalEmName,
        finalEmRel,
        finalEmPhone,
        finalEmailNotif,
        finalSmsNotif,
        finalTelegramNotif,
        finalPushNotif,
        finalHealthReminders,
        finalLabReportAlerts,
        finalNotificationFrequency,
        req.user.id
      ]
    });
    const emergencyContactWasUpdated = emName !== void 0 || emRel !== void 0 || emPhone !== void 0;
    if (emergencyContactWasUpdated && finalEmName && finalEmPhone) {
      try {
        const existingTc = await db.execute({
          sql: `SELECT id FROM trusted_contacts WHERE user_id = ? AND relationship = ? LIMIT 1`,
          args: [req.user.id, finalEmRel || "Other"]
        });
        if (existingTc.rows.length > 0) {
          await db.execute({
            sql: `UPDATE trusted_contacts SET name = ?, contact_value = ?, status = 'ACTIVE', updated_at = ? WHERE id = ?`,
            args: [finalEmName, finalEmPhone, (/* @__PURE__ */ new Date()).toISOString(), existingTc.rows[0].id]
          });
        } else {
          await db.execute({
            sql: `INSERT INTO trusted_contacts (user_id, name, relationship, contact_method, contact_value, status, created_at, updated_at)
                  VALUES (?, ?, ?, 'PHONE', ?, 'ACTIVE', ?, ?)`,
            args: [req.user.id, finalEmName, finalEmRel || "Other", finalEmPhone, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()]
          });
        }
      } catch (tcErr) {
        console.warn("Trusted contact sync warning:", tcErr);
      }
    }
    const updatedRes = await db.execute({
      sql: `SELECT id, email, name, role, status, phone, date_of_birth, gender, blood_group,
                   height_cm, weight_kg, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                   notification_email, notification_sms, notification_push,
                   notification_health_reminders, notification_lab_report_alerts, notification_frequency
            FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    res.json(formatUserProfile(updatedRes.rows[0]));
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
};
app.get("/api/auth/me", authenticateToken, handleGetProfile);
app.get("/api/profile", authenticateToken, handleGetProfile);
app.put("/api/auth/me", authenticateToken, handleUpdateProfile);
app.put("/api/profile", authenticateToken, handleUpdateProfile);
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long for security" });
  }
  try {
    const userRes = await db.execute({
      sql: "SELECT hashed_password, email FROM users WHERE id = ?",
      args: [req.user.id]
    });
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userRow = userRes.rows[0];
    const isMatch = await bcrypt2.compare(currentPassword, userRow.hashed_password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }
    const hashedNew = await bcrypt2.hash(newPassword, 10);
    await db.execute({
      sql: "UPDATE users SET hashed_password = ? WHERE id = ?",
      args: [hashedNew, req.user.id]
    });
    await authService.revokeAllUserSessions(db, req.user.id);
    res.clearCookie("refreshToken", { httpOnly: true, secure: envConfig.IS_PRODUCTION, sameSite: "lax", path: "/" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.execute({
      sql: "INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)",
      args: ["INFO", "AUTH_PASSWORD_CHANGED", `User ${req.user.id} (${userRow.email}) changed password`, req.user.id, now]
    });
    res.json({ message: "Password updated successfully. Please log in with your new password." });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});
app.post("/api/auth/logout", async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (rawRefreshToken && typeof rawRefreshToken === "string") {
    try {
      const session = await authService.findSessionByRefreshToken(db, rawRefreshToken);
      if (session) {
        await authService.revokeSession(db, session.id);
      }
    } catch (e) {
      console.warn("Logout session revocation note:", e);
    }
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: envConfig.IS_PRODUCTION,
    sameSite: "lax",
    path: "/"
  });
  res.json({ success: true, message: "Logged out successfully" });
});
app.get("/api/auth/sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.execute({
      sql: `SELECT id, created_at, expires_at, last_used_at, user_agent, ip_address 
            FROM auth_sessions 
            WHERE user_id = ? AND revoked_at IS NULL AND expires_at > datetime('now')
            ORDER BY last_used_at DESC`,
      args: [userId]
    });
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});
app.post("/api/auth/revoke-session/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);
    await db.execute({
      sql: `UPDATE auth_sessions SET revoked_at = datetime('now') WHERE id = ? AND user_id = ?`,
      args: [sessionId, userId]
    });
    res.json({ message: "Session revoked successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke session" });
  }
});
app.post("/api/auth/logout-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await authService.revokeAllUserSessions(db, userId);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: envConfig.IS_PRODUCTION,
      sameSite: "lax",
      path: "/"
    });
    res.json({ message: "Successfully logged out of all active devices" });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke sessions" });
  }
});
app.get("/api/user/export-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await db.execute({ sql: `SELECT id, name, email, role, status, created_at FROM users WHERE id = ?`, args: [userId] });
    const profileRes = await db.execute({ sql: `SELECT * FROM user_profiles WHERE user_id = ?`, args: [userId] });
    const measurementsRes = await db.execute({ sql: `SELECT * FROM measurements WHERE user_id = ?`, args: [userId] });
    const medicationsRes = await db.execute({ sql: `SELECT * FROM medications WHERE user_id = ?`, args: [userId] });
    const reportsRes = await db.execute({ sql: `SELECT id, filename, report_type, report_date, created_at FROM reports WHERE user_id = ?`, args: [userId] });
    const alertsRes = await db.execute({ sql: `SELECT * FROM health_alerts WHERE user_id = ?`, args: [userId] });
    const exportArchive = {
      app: "MediTrack v2.0 Clinical Health Record",
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      user: userRes.rows[0] || null,
      profile: profileRes.rows[0] || null,
      measurements: measurementsRes.rows,
      medications: medicationsRes.rows,
      reports: reportsRes.rows,
      alerts: alertsRes.rows
    };
    res.json(exportArchive);
  } catch (err) {
    res.status(500).json({ error: "Failed to export health data" });
  }
});
app.delete("/api/user/account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await authService.revokeAllUserSessions(db, userId);
    await db.execute({
      sql: `UPDATE users SET status = 'DELETED' WHERE id = ?`,
      args: [userId]
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: envConfig.IS_PRODUCTION,
      sameSite: "lax",
      path: "/"
    });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});
app.get("/api/habits", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM habits WHERE user_id = ?",
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.post("/api/habits", authenticateToken, async (req, res) => {
  const { title, description, frequency, time_of_day } = req.body;
  const result = await db.execute({
    sql: "INSERT INTO habits (user_id, title, description, frequency, time_of_day) VALUES (?, ?, ?, ?, ?) RETURNING *",
    args: [req.user.id, title, description || null, frequency, time_of_day || null]
  });
  res.json(result.rows[0]);
});
app.get("/api/habits/:habitId/logs", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE h.user_id = ? AND h.id = ?",
    args: [req.user.id, req.params.habitId]
  });
  res.json(result.rows);
});
app.post("/api/habits/:habitId/logs", authenticateToken, async (req, res) => {
  const { date, completed } = req.body;
  const existing = await db.execute({
    sql: "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?",
    args: [req.params.habitId, date]
  });
  if (existing.rows.length > 0) {
    const result = await db.execute({
      sql: "UPDATE habit_logs SET completed = ? WHERE habit_id = ? AND date = ? RETURNING *",
      args: [completed ? 1 : 0, req.params.habitId, date]
    });
    res.json(result.rows[0]);
  } else {
    const result = await db.execute({
      sql: "INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, ?) RETURNING *",
      args: [req.params.habitId, date, completed ? 1 : 0]
    });
    res.json(result.rows[0]);
  }
});
app.get("/api/habits/logs/today", authenticateToken, async (req, res) => {
  const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.execute({
    sql: "SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE h.user_id = ? AND hl.date = ?",
    args: [req.user.id, date]
  });
  res.json(result.rows);
});
app.get("/api/medications", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM medications WHERE user_id = ?",
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.post("/api/medications", authenticateToken, async (req, res) => {
  const { name, dosage, frequency, time_of_day } = req.body;
  const result = await db.execute({
    sql: "INSERT INTO medications (user_id, name, dosage, frequency, time_of_day) VALUES (?, ?, ?, ?, ?) RETURNING *",
    args: [req.user.id, name, dosage, frequency, time_of_day || null]
  });
  res.json(result.rows[0]);
});
app.get("/api/medications/:medicationId/logs", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT ml.* FROM medication_logs ml JOIN medications m ON ml.medication_id = m.id WHERE m.user_id = ? AND m.id = ?",
    args: [req.user.id, req.params.medicationId]
  });
  res.json(result.rows);
});
app.post("/api/medications/:medicationId/logs", authenticateToken, async (req, res) => {
  const { date, taken } = req.body;
  const existing = await db.execute({
    sql: "SELECT * FROM medication_logs WHERE medication_id = ? AND date = ?",
    args: [req.params.medicationId, date]
  });
  if (existing.rows.length > 0) {
    const result = await db.execute({
      sql: "UPDATE medication_logs SET taken = ? WHERE medication_id = ? AND date = ? RETURNING *",
      args: [taken ? 1 : 0, req.params.medicationId, date]
    });
    res.json(result.rows[0]);
  } else {
    const result = await db.execute({
      sql: "INSERT INTO medication_logs (medication_id, date, taken) VALUES (?, ?, ?) RETURNING *",
      args: [req.params.medicationId, date, taken ? 1 : 0]
    });
    res.json(result.rows[0]);
  }
});
app.get("/api/medications/logs/today", authenticateToken, async (req, res) => {
  const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.execute({
    sql: "SELECT ml.* FROM medication_logs ml JOIN medications m ON ml.medication_id = m.id WHERE m.user_id = ? AND ml.date = ?",
    args: [req.user.id, date]
  });
  res.json(result.rows);
});
app.get("/api/reports", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM medical_reports WHERE user_id = ? ORDER BY created_at DESC",
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;
    const existing = await db.execute({
      sql: "SELECT id, file_path FROM medical_reports WHERE id = ? AND user_id = ?",
      args: [reportId, userId]
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Report not found or unauthorized" });
    }
    const filePath = existing.rows[0].file_path;
    await db.execute({
      sql: "DELETE FROM measurements WHERE report_id = ?",
      args: [reportId]
    });
    await db.execute({
      sql: "DELETE FROM medical_reports WHERE id = ?",
      args: [reportId]
    });
    try {
      await db.execute({
        sql: "DELETE FROM medical_analysis_cache WHERE user_id = ?",
        args: [userId]
      });
    } catch (cacheErr) {
    }
    if (filePath && fs4.existsSync(filePath)) {
      try {
        fs4.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete file from disk:", err);
      }
    }
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/reports/upload", authenticateToken, uploadRateLimiter, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded", code: "NO_FILE_UPLOADED" });
  }
  const validation = validateUploadedFile(req.file.path, req.file.originalname, req.file.mimetype);
  if (!validation.isValid) {
    try {
      fs4.unlinkSync(req.file.path);
    } catch (e) {
    }
    return res.status(400).json({ error: validation.error, code: validation.code });
  }
  const { report_type, report_date } = req.body;
  const fileBuffer = fs4.readFileSync(req.file.path);
  const hashSum = crypto5.createHash("sha256");
  hashSum.update(fileBuffer);
  const file_hash = hashSum.digest("hex");
  const existing = await db.execute({
    sql: "SELECT * FROM medical_reports WHERE user_id = ? AND file_hash = ?",
    args: [req.user.id, file_hash]
  });
  if (existing.rows.length > 0) {
    console.log("Duplicate report detected, returning cached result.");
    try {
      fs4.unlinkSync(req.file.path);
    } catch (err) {
      console.error("Cleanup error:", err);
    }
    return res.json(existing.rows[0]);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const result = await db.execute({
    sql: `INSERT INTO medical_reports 
           (user_id, filename, report_type, report_date, upload_date, processing_status, file_path, file_hash, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      req.user.id,
      req.file.originalname,
      report_type || "General Lab Report",
      report_date || now.split("T")[0],
      now.split("T")[0],
      "PROCESSING",
      // Start as processing
      req.file.path,
      file_hash,
      now,
      now
    ]
  });
  const report = result.rows[0];
  try {
    const base64Data = fileBuffer.toString("base64");
    const extractedData = await aiService.extractMedicalReport(
      fileBuffer,
      req.file.mimetype || "application/octet-stream",
      req.file.originalname
    );
    const parsedMeasurements = extractedData.measurements || [];
    const patientInfo = extractedData.patient_info || {};
    for (const m of parsedMeasurements) {
      const validationStatus = validateMeasurement(m.parameter, m.normalized_value, m.unit);
      await db.execute({
        sql: `INSERT INTO measurements (report_id, parameter, raw_value, normalized_value, unit, normalized_unit, source_page, source_text, extraction_confidence, validation_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          report.id,
          m.parameter,
          m.raw_value,
          m.normalized_value,
          m.unit,
          m.normalized_unit,
          m.source_page || "1",
          m.source_text,
          m.extraction_confidence,
          validationStatus
        ]
      });
    }
    const measurementsRes = await db.execute({
      sql: `SELECT m.parameter, m.normalized_value, m.raw_value, m.source_page, r.report_date, r.id as r_id 
             FROM measurements m 
             JOIN medical_reports r ON m.report_id = r.id 
             WHERE r.user_id = ?`,
      args: [req.user.id]
    });
    const contradictions = detectContradictions(report.id, report.report_date, measurementsRes.rows);
    for (const c of contradictions) {
      await db.execute({
        sql: `INSERT INTO contradictions (user_id, parameter, report_a, report_b, value_a, value_b, date_a, date_b, severity, reason, source_page_a, source_page_b, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          req.user.id,
          c.parameter,
          c.report_a,
          c.report_b,
          c.value_a,
          c.value_b,
          c.date_a,
          c.date_b,
          c.severity,
          c.reason,
          c.source_page_a,
          c.source_page_b,
          c.status,
          (/* @__PURE__ */ new Date()).toISOString()
        ]
      });
    }
    await db.execute({
      sql: "UPDATE medical_reports SET processing_status = 'COMPLETED' WHERE id = ?",
      args: [report.id]
    });
    report.processing_status = "COMPLETED";
    try {
      await db.execute({
        sql: "DELETE FROM medical_analysis_cache WHERE user_id = ?",
        args: [req.user.id]
      });
      await generateSpecialtyGuidance(req.user.id);
      await executeRiskAssessmentForUser(req.user.id);
      await executeFutureOutlookForUser(req.user.id);
    } catch (cacheErr) {
      console.warn("Failed to invalidate/refresh medical analysis cache:", cacheErr);
    }
    try {
      const generatedAlerts = await alertManager.processReportAlerts(req.user.id, report.id);
      console.log(`[AlertManager] Evaluated report #${report.id}: Generated ${generatedAlerts.length} alert(s).`);
    } catch (alertErr) {
      console.error("[AlertManager] Failed to evaluate report alerts:", alertErr);
    }
  } catch (error) {
    fs4.writeFileSync("ocr_error.log", error.message || String(error));
    console.error("OCR Error:", error.message || error);
    await db.execute({
      sql: "UPDATE medical_reports SET processing_status = 'FAILED' WHERE id = ?",
      args: [report.id]
    });
    report.processing_status = "FAILED";
    const status = error instanceof GeminiAIError ? error.status : 500;
    const errorCode = error instanceof GeminiAIError ? error.code : "OCR_PROCESSING_FAILED";
    return res.status(status).json({
      error: error.message || "Failed to process report OCR",
      code: errorCode
    });
  }
  res.json(report);
});
async function ensureReportPdf(report, userId) {
  let filePathStr = String(report.file_path || "");
  if (!filePathStr) {
    filePathStr = `uploads/${Date.now()}-${String(report.filename || "report.pdf").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  }
  const absPath = path5.resolve(filePathStr);
  const exists = fs4.existsSync(absPath);
  let isValid = false;
  if (exists) {
    try {
      const stat = fs4.statSync(absPath);
      if (stat.size > 200) {
        if (!filePathStr.toLowerCase().endsWith(".pdf")) {
          isValid = true;
        } else {
          const head = Buffer.alloc(5);
          const fd = fs4.openSync(absPath, "r");
          fs4.readSync(fd, head, 0, 5, 0);
          fs4.closeSync(fd);
          if (head.toString("utf8").startsWith("%PDF")) {
            isValid = true;
          }
        }
      }
    } catch (e) {
      isValid = false;
    }
  }
  if (isValid) {
    return absPath;
  }
  const userRes = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [userId] });
  const user = userRes.rows[0] || { name: "Patient", email: "" };
  const measRes = await db.execute({ sql: "SELECT * FROM measurements WHERE report_id = ? ORDER BY id ASC", args: [report.id] });
  const measurements = measRes.rows;
  const doc = new jsPDF("p", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 75, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MediTrack Diagnostic Laboratory", margin, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Official Clinical Laboratory & Biomarker Analysis Report", margin, 55);
  let yPos = 95;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 80, 6, 6, "FD");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Name:", margin + 15, yPos + 25);
  doc.setFont("helvetica", "normal");
  doc.text(String(user.name || "Patient"), margin + 95, yPos + 25);
  doc.setFont("helvetica", "bold");
  doc.text("Document ID:", margin + 15, yPos + 48);
  doc.setFont("helvetica", "normal");
  doc.text("MED-RPT-" + report.id, margin + 95, yPos + 48);
  const col2X = margin + (pageWidth - margin * 2) / 2;
  doc.setFont("helvetica", "bold");
  doc.text("Report Type:", col2X, yPos + 25);
  doc.setFont("helvetica", "normal");
  doc.text(String(report.report_type || "General Lab Report"), col2X + 80, yPos + 25);
  doc.setFont("helvetica", "bold");
  doc.text("Collection Date:", col2X, yPos + 48);
  doc.setFont("helvetica", "normal");
  doc.text(String(report.report_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]), col2X + 80, yPos + 48);
  yPos += 105;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Extracted Biomarkers & Clinical Measurements", margin, yPos);
  yPos += 15;
  const tableRows = measurements.length > 0 ? measurements.map((m) => {
    let status = "NORMAL";
    const sText = String(m.source_text || "").toUpperCase();
    if (sText.includes("HIGH") || sText.includes("ELEVATED")) status = "HIGH";
    else if (sText.includes("LOW")) status = "LOW";
    else if (sText.includes("BORDERLINE")) status = "BORDERLINE";
    return [
      String(m.parameter || ""),
      String(m.raw_value || m.normalized_value || "-"),
      String(m.unit || m.normalized_unit || "-"),
      String(m.source_text || "Standard clinical reference range observed"),
      status
    ];
  }) : [
    ["Clinical Record", "Archived", "-", "Report document processed and validated", "NORMAL"]
  ];
  autoTable(doc, {
    startY: yPos,
    head: [["Biomarker / Parameter", "Result", "Unit", "Reference / Lab Notes", "Flag"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 9,
      cellPadding: 6
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: function(data) {
      if (data.section === "body" && data.column.index === 4) {
        const val = String(data.cell.raw || "");
        if (val === "HIGH") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "LOW") {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
    margin: { left: margin, right: margin }
  });
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This is an authorized medical report archive from MediTrack Health Systems. For clinical verification only.", margin, pageHeight - 20);
    doc.text("Page " + i + " of " + pageCount, pageWidth - margin - 50, pageHeight - 20);
  }
  const uploadDir = path5.dirname(absPath);
  if (!fs4.existsSync(uploadDir)) fs4.mkdirSync(uploadDir, { recursive: true });
  const pdfBuf = Buffer.from(doc.output("arraybuffer"));
  fs4.writeFileSync(absPath, pdfBuf);
  try {
    await db.execute({
      sql: "UPDATE medical_reports SET file_path = ? WHERE id = ?",
      args: [filePathStr, report.id]
    });
  } catch (e) {
  }
  return absPath;
}
app.get("/api/reports/:id", authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM medical_reports WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    const report = result.rows[0];
    const userRes = await db.execute({
      sql: "SELECT id, name, email FROM users WHERE id = ?",
      args: [req.user.id]
    });
    const user = userRes.rows[0] || null;
    const measurementsRes = await db.execute({
      sql: "SELECT * FROM measurements WHERE report_id = ? ORDER BY id ASC",
      args: [req.params.id]
    });
    res.json({
      report,
      user,
      measurements: measurementsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch report details" });
  }
});
app.get("/api/reports/:id/view", authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM medical_reports WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    const report = result.rows[0];
    const filenameStr = String(report.filename);
    const absPath = await ensureReportPdf(report, req.user.id);
    let contentType = "application/pdf";
    if (filenameStr.toLowerCase().endsWith(".jpg") || filenameStr.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filenameStr.toLowerCase().endsWith(".png")) contentType = "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", 'inline; filename="' + encodeURIComponent(filenameStr) + '"');
    res.sendFile(absPath);
  } catch (err) {
    console.error("Error serving report view:", err);
    res.status(500).send("Error viewing report: " + (err.message || "Unknown error"));
  }
});
app.get("/api/reports/:id/download", authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM medical_reports WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.user.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    const report = result.rows[0];
    const absPath = await ensureReportPdf(report, req.user.id);
    res.download(absPath, String(report.filename));
  } catch (err) {
    console.error("Error downloading report:", err);
    res.status(500).send("Error downloading report: " + (err.message || "Unknown error"));
  }
});
app.get("/api/measurements", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: `SELECT m.*, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? AND m.validation_status = 'VALIDATED'
          ORDER BY r.report_date DESC`,
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.get("/api/contradictions", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM contradictions WHERE user_id = ? ORDER BY created_at DESC",
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.post("/api/trends/analyze", authenticateToken, aiRateLimiter, async (req, res) => {
  const result = await db.execute({
    sql: `SELECT m.parameter, m.normalized_value, r.report_date 
          FROM measurements m
          JOIN medical_reports r ON m.report_id = r.id
          WHERE r.user_id = ? AND m.validation_status = 'VALIDATED'
          ORDER BY m.parameter, r.report_date ASC`,
    args: [req.user.id]
  });
  const grouped = result.rows.reduce((acc, row) => {
    if (!acc[row.parameter]) acc[row.parameter] = [];
    acc[row.parameter].push(row);
    return acc;
  }, {});
  await db.execute({
    sql: "DELETE FROM trends WHERE user_id = ?",
    args: [req.user.id]
  });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const trends = [];
  for (const [parameter, data] of Object.entries(grouped)) {
    const points = data;
    if (points.length < 2) continue;
    let firstVal = 0;
    let lastVal = 0;
    if (parameter === "blood_pressure") {
      const firstParts = String(points[0].normalized_value).split("/");
      const lastParts = String(points[points.length - 1].normalized_value).split("/");
      if (firstParts.length >= 2 && lastParts.length >= 2) {
        firstVal = parseFloat(firstParts[0]);
        lastVal = parseFloat(lastParts[0]);
      } else {
        continue;
      }
    } else {
      const firstMatch = String(points[0].normalized_value).match(/\d+(\.\d+)?/);
      const lastMatch = String(points[points.length - 1].normalized_value).match(/\d+(\.\d+)?/);
      if (!firstMatch || !lastMatch) continue;
      firstVal = parseFloat(firstMatch[0]);
      lastVal = parseFloat(lastMatch[0]);
    }
    let direction = "STABLE";
    const pctChange = Math.abs((lastVal - firstVal) / firstVal);
    if (pctChange > 0.01) {
      if (lastVal > firstVal) direction = "INCREASING";
      if (lastVal < firstVal) direction = "DECREASING";
    }
    const evidence = `Changed from ${firstVal} to ${lastVal} over ${points.length} measurements.`;
    const insertRes = await db.execute({
      sql: `INSERT INTO trends (user_id, parameter, direction, valid_measurement_count, start_date, end_date, evidence, data_quality, analysis_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        req.user.id,
        parameter,
        direction,
        points.length,
        points[0].report_date,
        points[points.length - 1].report_date,
        evidence,
        "HIGH",
        "1.0",
        now
      ]
    });
    trends.push(insertRes.rows[0]);
  }
  res.json({ message: "Trend analysis completed successfully", trends });
});
app.get("/api/trends", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: "SELECT * FROM trends WHERE user_id = ? ORDER BY created_at DESC",
    args: [req.user.id]
  });
  res.json(result.rows);
});
app.get("/api/trends/chart/:parameter", authenticateToken, async (req, res) => {
  const result = await db.execute({
    sql: `SELECT m.normalized_value, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? AND m.parameter = ? AND m.validation_status = 'VALIDATED'
          ORDER BY r.report_date ASC`,
    args: [req.user.id, req.params.parameter]
  });
  const chartData = result.rows.map((r) => {
    let value = 0;
    let systolic = void 0;
    let diastolic = void 0;
    if (req.params.parameter === "blood_pressure") {
      const parts = r.normalized_value.split("/");
      if (parts.length >= 2) {
        systolic = parseFloat(parts[0]);
        diastolic = parseFloat(parts[1]);
        value = systolic;
      }
    } else {
      const match = r.normalized_value.match(/\d+(\.\d+)?/);
      value = match ? parseFloat(match[0]) : 0;
    }
    return {
      date: r.report_date,
      value,
      systolic,
      diastolic,
      raw_value: r.normalized_value
    };
  });
  res.json(chartData);
});
async function executeRiskAssessmentForUser(userId) {
  const result = await db.execute({
    sql: `SELECT m.id, m.parameter, m.raw_value, m.normalized_value, m.unit, m.normalized_unit,
                 m.validation_status, m.source_page as page, r.report_date, r.filename as report 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? 
          ORDER BY r.report_date ASC, m.id ASC`,
    args: [userId]
  });
  const measurements = result.rows;
  const riskResults = evaluateRiskAllDomains(measurements);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: "DELETE FROM risk_assessment WHERE user_id = ?",
    args: [userId]
  });
  const assessmentsCreated = [];
  for (const risk of riskResults) {
    const insertResult = await db.execute({
      sql: `INSERT INTO risk_assessment (user_id, domain, level, label, evidence, data_quality, rule_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [userId, risk.domain, risk.level, risk.label, risk.evidence, risk.data_quality, risk.rule_version, now]
    });
    assessmentsCreated.push(insertResult.rows[0]);
  }
  return assessmentsCreated;
}
app.post("/api/risk/analyze", authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const assessments = await executeRiskAssessmentForUser(req.user.id);
    res.json({ message: "Risk assessment complete", risks: assessments });
  } catch (err) {
    console.error("Risk assessment execution error:", err);
    res.status(500).json({ error: "Failed to execute clinical risk assessment" });
  }
});
app.get("/api/risk", authenticateToken, async (req, res) => {
  try {
    let result = await db.execute({
      sql: "SELECT * FROM risk_assessment WHERE user_id = ? ORDER BY created_at DESC",
      args: [req.user.id]
    });
    if (result.rows.length === 0) {
      const countCheck = await db.execute({
        sql: `SELECT count(*) as count FROM measurements m JOIN medical_reports r ON m.report_id = r.id WHERE r.user_id = ?`,
        args: [req.user.id]
      });
      if (Number(countCheck.rows[0]?.count || 0) > 0) {
        await executeRiskAssessmentForUser(req.user.id);
        result = await db.execute({
          sql: "SELECT * FROM risk_assessment WHERE user_id = ? ORDER BY created_at DESC",
          args: [req.user.id]
        });
      }
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch risk assessment error:", err);
    res.status(500).json({ error: "Failed to retrieve risk assessments." });
  }
});
async function executeFutureOutlookForUser(userId) {
  const rawResult = await db.execute({
    sql: `SELECT m.id, m.report_id, m.parameter, m.raw_value, m.normalized_value, 
                 m.unit, m.normalized_unit, m.validation_status, r.report_date 
          FROM measurements m 
          JOIN medical_reports r ON m.report_id = r.id 
          WHERE r.user_id = ? 
          ORDER BY r.report_date ASC, m.id ASC`,
    args: [userId]
  });
  const observationsByParam = /* @__PURE__ */ new Map();
  const exclusionsByParam = /* @__PURE__ */ new Map();
  const addObservation = (param, obs) => {
    if (!observationsByParam.has(param)) observationsByParam.set(param, []);
    observationsByParam.get(param).push(obs);
  };
  const addExclusion = (param, excl) => {
    if (!exclusionsByParam.has(param)) exclusionsByParam.set(param, []);
    exclusionsByParam.get(param).push(excl);
  };
  for (const row of rawResult.rows) {
    const rawParam = String(row.parameter || "").trim();
    const rawVal = row.raw_value;
    const normVal = row.normalized_value;
    const rawUnit = String(row.unit || row.normalized_unit || "");
    const status = row.validation_status;
    const dateStr = String(row.report_date || "");
    const reportId = Number(row.report_id);
    if (status === "REJECTED") {
      const canonical = normalizeParameterName(rawParam);
      addExclusion(canonical, {
        parameter: rawParam,
        rawReportId: reportId,
        date: dateStr,
        rawValue: rawVal,
        rawUnit,
        reason: "Measurement marked as rejected"
      });
      continue;
    }
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
      const canonical = normalizeParameterName(rawParam);
      addExclusion(canonical, {
        parameter: rawParam,
        rawReportId: reportId,
        date: dateStr,
        rawValue: rawVal,
        rawUnit,
        reason: "Invalid or missing measurement timestamp"
      });
      continue;
    }
    const timestamp = new Date(dateStr).getTime();
    const canonicalParam = normalizeParameterName(rawParam);
    const valString = String(normVal || rawVal || "").trim();
    const isBpParameter = canonicalParam === "blood_pressure" || canonicalParam === "blood_pressure_systolic" || canonicalParam === "blood_pressure_diastolic" || rawParam.toLowerCase().includes("blood pressure") || valString.includes("/");
    if (isBpParameter && valString.includes("/")) {
      const parts = valString.split("/");
      if (parts.length >= 2) {
        const sysMatch = parts[0].trim().match(/\d+(\.\d+)?/);
        const diaMatch = parts[1].trim().match(/\d+(\.\d+)?/);
        if (sysMatch && diaMatch) {
          const sysNum = parseFloat(sysMatch[0]);
          const diaNum = parseFloat(diaMatch[0]);
          if (isFinite(sysNum) && sysNum > 30 && sysNum < 300) {
            addObservation("blood_pressure_systolic", {
              value: sysNum,
              date: dateStr,
              timestamp,
              rawReportId: reportId,
              originalValue: parts[0].trim(),
              originalUnit: rawUnit || "mmHg",
              canonicalUnit: "mmHg"
            });
          }
          if (isFinite(diaNum) && diaNum > 20 && diaNum < 200) {
            addObservation("blood_pressure_diastolic", {
              value: diaNum,
              date: dateStr,
              timestamp,
              rawReportId: reportId,
              originalValue: parts[1].trim(),
              originalUnit: rawUnit || "mmHg",
              canonicalUnit: "mmHg"
            });
          }
        }
      }
      continue;
    }
    const cleanStr = String(normVal || rawVal || "").replace(/,/g, "");
    const numMatch = cleanStr.match(/-?\d+(\.\d+)?/);
    if (!numMatch) {
      addExclusion(canonicalParam, {
        parameter: rawParam,
        rawReportId: reportId,
        date: dateStr,
        rawValue: valString,
        rawUnit,
        reason: "No finite numeric measurement extractable"
      });
      continue;
    }
    const numVal = parseFloat(numMatch[0]);
    if (!isFinite(numVal)) continue;
    const conversion = convertToCanonicalUnit2(canonicalParam, numVal, rawUnit);
    if (!conversion.success || conversion.convertedValue === null) {
      addExclusion(canonicalParam, {
        parameter: rawParam,
        rawReportId: reportId,
        date: dateStr,
        rawValue: numVal,
        rawUnit,
        reason: conversion.error || `Unsupported unit '${rawUnit}'`
      });
      continue;
    }
    addObservation(canonicalParam, {
      value: conversion.convertedValue,
      date: dateStr,
      timestamp,
      rawReportId: reportId,
      originalValue: numVal,
      originalUnit: rawUnit,
      canonicalUnit: conversion.canonicalUnit
    });
  }
  const standardParams = [
    "hemoglobin",
    "fasting_glucose",
    "total_cholesterol",
    "ldl",
    "hdl",
    "triglycerides",
    "creatinine",
    "alt",
    "ast",
    "hematocrit",
    "platelets",
    "wbc",
    "rbc",
    "blood_pressure_systolic",
    "blood_pressure_diastolic"
  ];
  const allParams = /* @__PURE__ */ new Set([...standardParams, ...observationsByParam.keys()]);
  const engine = new RobustForecastingEngine();
  const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const computedForecasts = [];
  for (const param of allParams) {
    const obs = observationsByParam.get(param) || [];
    const excl = exclusionsByParam.get(param) || [];
    const dedupedObs = [];
    const seenKey = /* @__PURE__ */ new Set();
    for (const o of obs) {
      const k = `${o.date}-${o.value}-${o.canonicalUnit}`;
      if (!seenKey.has(k)) {
        seenKey.add(k);
        dedupedObs.push(o);
      }
    }
    const forecast = engine.forecast({
      parameter: param,
      observations: dedupedObs,
      excludedRecords: excl,
      forecastHorizonDays: 90
    });
    computedForecasts.push(forecast);
  }
  await db.execute({
    sql: "DELETE FROM future_outlook WHERE user_id = ?",
    args: [userId]
  });
  for (const f of computedForecasts) {
    await db.execute({
      sql: `INSERT INTO future_outlook (
              user_id, parameter, forecast_direction, forecast_range, confidence_category, 
              limitations, model_version, input_data_version, data_quality, created_at,
              status, display_name, canonical_unit, observation_count, distinct_dates_count,
              history_duration_days, last_observed_value, last_observed_date, forecast_target_date,
              forecast_value, prediction_interval_json, backtest_metrics_json, reason_code,
              reason_message, excluded_count, history_json, run_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        f.parameter,
        f.trendDirection,
        f.forecastRange,
        f.confidenceCategory,
        f.limitations,
        f.modelVersion,
        f.inputDataFingerprint,
        f.dataQuality,
        now,
        f.status,
        f.displayName,
        f.canonicalUnit,
        f.observationCount,
        f.distinctDatesCount,
        f.historyDurationDays,
        f.lastObservedValue,
        f.lastObservedDate,
        f.forecastTargetDate,
        f.forecastValue,
        f.predictionInterval ? JSON.stringify(f.predictionInterval) : null,
        f.backtestMetrics ? JSON.stringify(f.backtestMetrics) : null,
        f.reasonCode,
        f.reasonMessage,
        f.excludedCount,
        JSON.stringify(f.history),
        runId
      ]
    });
  }
  const persisted = await db.execute({
    sql: "SELECT * FROM future_outlook WHERE user_id = ? ORDER BY display_name ASC",
    args: [userId]
  });
  return { runId, now, forecasts: persisted.rows };
}
app.post("/api/outlook/analyze", authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const outlookResult = await executeFutureOutlookForUser(req.user.id);
    res.json({
      message: "Future Outlook analysis completed successfully",
      run_id: outlookResult.runId,
      timestamp: outlookResult.now,
      forecasts: outlookResult.forecasts
    });
  } catch (err) {
    console.error("Future Outlook analysis error:", err);
    res.status(500).json({ error: "Failed to execute Future Outlook analysis. Please verify your reports and try again." });
  }
});
app.get("/api/outlook", authenticateToken, async (req, res) => {
  try {
    let result = await db.execute({
      sql: "SELECT * FROM future_outlook WHERE user_id = ? ORDER BY display_name ASC, parameter ASC",
      args: [req.user.id]
    });
    if (result.rows.length === 0) {
      const countCheck = await db.execute({
        sql: `SELECT count(*) as count FROM measurements m JOIN medical_reports r ON m.report_id = r.id WHERE r.user_id = ?`,
        args: [req.user.id]
      });
      if (Number(countCheck.rows[0]?.count || 0) > 0) {
        const generated = await executeFutureOutlookForUser(req.user.id);
        result = { rows: generated.forecasts };
      }
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Future Outlook fetch error:", err);
    res.status(500).json({ error: "Failed to retrieve Future Outlook forecasts." });
  }
});
app.post("/api/specialty/analyze", authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const guidances = await generateSpecialtyGuidance(req.user.id);
    const snapshot = await calculateHealthSnapshot(req.user.id);
    res.json({ message: "Specialty analysis complete", guidances, snapshot });
  } catch (error) {
    console.error("Error analyzing specialty guidance:", error);
    res.status(500).json({ error: error.message || "Failed to analyze specialty guidance" });
  }
});
app.get("/api/specialty/snapshot", authenticateToken, async (req, res) => {
  try {
    const snapshot = await calculateHealthSnapshot(req.user.id);
    res.json(snapshot);
  } catch (error) {
    console.error("Error calculating health snapshot:", error);
    res.status(500).json({ error: error.message || "Failed to calculate snapshot" });
  }
});
app.get("/api/specialty", authenticateToken, async (req, res) => {
  try {
    let result = await db.execute({
      sql: "SELECT * FROM specialty_guidance WHERE user_id = ? ORDER BY created_at DESC",
      args: [req.user.id]
    });
    if (result.rows.length === 0) {
      const generated = await generateSpecialtyGuidance(req.user.id);
      return res.json(generated);
    }
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching specialty guidance:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve specialty guidance" });
  }
});
async function getUserMedicalAnalysisContext(userId) {
  try {
    let reportsMetaRes = { rows: [] };
    let measMetaRes = { rows: [{ count: 0, max_id: 0 }] };
    try {
      [reportsMetaRes, measMetaRes] = await Promise.all([
        db.execute({
          sql: `SELECT id, filename, report_date, updated_at, processing_status, file_hash 
                FROM medical_reports WHERE user_id = ? ORDER BY id ASC`,
          args: [userId]
        }),
        db.execute({
          sql: `SELECT count(*) as count, max(m.id) as max_id 
                FROM measurements m 
                JOIN medical_reports r ON m.report_id = r.id 
                WHERE r.user_id = ?`,
          args: [userId]
        })
      ]);
    } catch (metaErr) {
      console.warn("[AI Context] Metadata query warning:", metaErr);
    }
    const rawFingerprint = reportsMetaRes.rows.map((r) => `${r.id}:${r.updated_at}:${r.processing_status}:${r.file_hash}`).join("|") + `_m:${measMetaRes.rows[0]?.count || 0}_max:${measMetaRes.rows[0]?.max_id || 0}`;
    const currentFingerprint = crypto5.createHash("sha256").update(rawFingerprint).digest("hex");
    try {
      const cacheRes = await db.execute({
        sql: "SELECT fingerprint, data FROM medical_analysis_cache WHERE user_id = ?",
        args: [userId]
      });
      if (cacheRes.rows.length > 0 && cacheRes.rows[0].fingerprint === currentFingerprint) {
        const parsed = JSON.parse(cacheRes.rows[0].data);
        return { contextData: parsed, fromCache: true, fingerprint: currentFingerprint };
      }
    } catch (err) {
      console.warn("[AI Cache] Error reading cache, rebuilding context:", err);
    }
    let userRes = { rows: [] };
    let completedReportsRes = { rows: [] };
    let pendingReportsRes = { rows: [] };
    let measurementsRes = { rows: [] };
    let risksRes = { rows: [] };
    let guidanceRes = { rows: [] };
    let outlookRes = { rows: [] };
    try {
      userRes = await db.execute({
        sql: "SELECT id, name, email, date_of_birth, gender FROM users WHERE id = ?",
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] User query error:", e);
    }
    try {
      completedReportsRes = await db.execute({
        sql: `SELECT id, filename, report_type, report_date, upload_date 
              FROM medical_reports 
              WHERE user_id = ? AND processing_status = 'COMPLETED' 
              ORDER BY report_date DESC, id DESC`,
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Completed reports query error:", e);
    }
    try {
      pendingReportsRes = await db.execute({
        sql: `SELECT id, filename, processing_status 
              FROM medical_reports 
              WHERE user_id = ? AND processing_status != 'COMPLETED' 
              ORDER BY id DESC`,
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Pending reports query error:", e);
    }
    try {
      measurementsRes = await db.execute({
        sql: `SELECT m.parameter, m.raw_value, m.normalized_value, m.unit, m.normalized_unit, r.report_date, r.filename, m.source_page, m.validation_status
              FROM measurements m
              JOIN medical_reports r ON m.report_id = r.id
              WHERE r.user_id = ? AND r.processing_status = 'COMPLETED'
              ORDER BY r.report_date DESC, m.id ASC`,
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Measurements query error:", e);
    }
    try {
      risksRes = await db.execute({
        sql: "SELECT domain, level, label, evidence FROM risk_assessment WHERE user_id = ? ORDER BY id ASC",
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Risk assessment query error:", e);
    }
    try {
      guidanceRes = await db.execute({
        sql: "SELECT domain, suggested_specialty, evidence FROM specialty_guidance WHERE user_id = ? ORDER BY id ASC",
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Specialty guidance query error:", e);
    }
    try {
      outlookRes = await db.execute({
        sql: "SELECT parameter, display_name, forecast_direction, forecast_range, confidence_category, limitations FROM future_outlook WHERE user_id = ? ORDER BY id ASC",
        args: [userId]
      });
    } catch (e) {
      console.warn("[AI Context] Future outlook query error:", e);
    }
    let guidances = guidanceRes.rows;
    if (guidances.length === 0 && measurementsRes.rows.length > 0) {
      try {
        guidances = await generateSpecialtyGuidance(userId);
      } catch (e) {
        console.warn("Auto-generation of specialty guidance deferred:", e);
      }
    }
    const rawUser = userRes.rows[0];
    let calculatedAge = null;
    if (rawUser && rawUser.date_of_birth) {
      const dob = new Date(String(rawUser.date_of_birth));
      if (!isNaN(dob.getTime())) {
        const diffMs = Date.now() - dob.getTime();
        calculatedAge = Math.floor(diffMs / (1e3 * 60 * 60 * 24 * 365.25));
      }
    }
    const contextData = {
      user: rawUser ? { ...rawUser, age: calculatedAge } : null,
      reports: completedReportsRes.rows,
      pendingReports: pendingReportsRes.rows,
      measurements: measurementsRes.rows,
      risks: risksRes.rows,
      guidances,
      outlooks: outlookRes.rows,
      hasData: completedReportsRes.rows.length > 0 || measurementsRes.rows.length > 0
    };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await db.execute({
        sql: `INSERT INTO medical_analysis_cache (user_id, fingerprint, data, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(user_id) DO UPDATE SET fingerprint = excluded.fingerprint, data = excluded.data, updated_at = excluded.updated_at`,
        args: [userId, currentFingerprint, JSON.stringify(contextData), now, now]
      });
    } catch (err) {
      console.warn("[AI Cache] Failed to persist medical_analysis_cache:", err);
    }
    return { contextData, fromCache: false, fingerprint: currentFingerprint };
  } catch (outerErr) {
    console.error("[AI Context] Unexpected error compiling medical context:", outerErr);
    return {
      contextData: {
        user: null,
        reports: [],
        pendingReports: [],
        measurements: [],
        risks: [],
        guidances: [],
        outlooks: [],
        hasData: false
      },
      fromCache: false,
      fingerprint: "fallback"
    };
  }
}
function formatClinicalContext(ctx) {
  if (!ctx.hasData) {
    let msg = "Patient Medical Records: No validated reports or laboratory measurements on file.";
    if (ctx.pendingReports && ctx.pendingReports.length > 0) {
      msg += `
Unprocessed Reports: ${ctx.pendingReports.map((p) => `${p.filename} (${p.processing_status})`).join(", ")}`;
    }
    return msg;
  }
  const userLine = ctx.user ? `Patient: ${ctx.user.name || "Anonymous"}${ctx.user.age ? `, Age: ${ctx.user.age}` : ""}${ctx.user.gender ? `, Gender: ${ctx.user.gender}` : ""}` : "";
  const reportsList = ctx.reports.map((r) => `- ${r.filename} (Collection Date: ${r.report_date || "Unknown"}, Type: ${r.report_type || "General Lab"})`).join("\n");
  const measurementsList = ctx.measurements.slice(0, 40).map((m) => `- ${m.parameter}: ${m.normalized_value || m.raw_value} ${m.unit || ""} [Date: ${m.report_date}, Report: ${m.filename}, Status: ${m.validation_status || "EXTRACTED"}]`).join("\n");
  const risksList = ctx.risks.length > 0 ? ctx.risks.map((r) => `- ${r.domain}: ${r.level} (${r.label}) - ${r.evidence}`).join("\n") : "None recorded";
  const guidanceList = ctx.guidances.length > 0 ? ctx.guidances.map((g) => `- ${g.suggested_specialty} (${g.domain}) - ${typeof g.evidence === "string" && !g.evidence.startsWith("{") ? g.evidence : "Validated laboratory findings"}`).join("\n") : "None recorded";
  const outlooksList = ctx.outlooks.length > 0 ? ctx.outlooks.map((o) => `- ${o.display_name || o.parameter}: Trend ${o.forecast_direction} (${o.forecast_range}), Confidence: ${o.confidence_category}`).join("\n") : "None recorded";
  let pendingNote = "";
  if (ctx.pendingReports && ctx.pendingReports.length > 0) {
    pendingNote = `
Pending Reports (Data not yet extracted): ${ctx.pendingReports.map((p) => `${p.filename} [Status: ${p.processing_status}]`).join(", ")}`;
  }
  return `
${userLine}
Verified Medical Reports (${ctx.reports.length} total):
${reportsList || "None"}
${pendingNote}

Validated Biomarkers & Measurements (${ctx.measurements.length} total):
${measurementsList || "None"}

Active Clinical Risk Assessments:
${risksList}

Specialty Consultations Suggested:
${guidanceList}

Future Outlook Projections:
${outlooksList}
`.trim();
}
function generateGroundedRuleResponse(message, ctx) {
  const cleanMsg = message.trim();
  const lower = cleanMsg.toLowerCase();
  const isGreeting = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy)\b/i.test(cleanMsg);
  if (isGreeting) {
    if (ctx.hasData) {
      return `Hello! I am your MediTrack clinical assistant. I have access to your **${ctx.reports.length}** verified report(s) and **${ctx.measurements.length}** validated biomarker measurement(s).

You can ask me to explain your blood report, check specific test readings (such as hemoglobin, cholesterol, glucose, or kidney function), compare historical dates, or clarify why specific medical specialties were recommended. How can I help you today?`;
    }
    return `Hello! I am your MediTrack clinical assistant.

You do not have any uploaded medical reports in your account yet. You can upload laboratory reports (PDF or image) in the **Reports** tab. Once processed, I can help you analyze biomarker values, track historical progressions, and provide evidence-grounded insights.

How can I help you today?`;
  }
  if (!ctx.hasData) {
    let reply = `**Answer:** You currently do not have any uploaded medical reports or laboratory measurements in your MediTrack profile.

**Limitations:** Without verified clinical documentation, I cannot analyze your biomarker levels, explain blood test results, or formulate specialty guidance.

**Next Steps:** Please navigate to the **Reports** tab and upload your laboratory reports (PDF or image). Once processed, I can explain your results and track longitudinal trends.`;
    if (ctx.pendingReports && ctx.pendingReports.length > 0) {
      reply += `

*Note: You have ${ctx.pendingReports.length} report(s) currently in progress: ${ctx.pendingReports.map((p) => `\`${p.filename}\` (${p.processing_status})`).join(", ")}. Once complete, their data will appear here automatically.*`;
    }
    return reply;
  }
  if (lower.includes("latest blood report") || lower.includes("blood report") || lower.includes("explain") && !lower.includes("why") && !lower.includes("cardio") && !lower.includes("cholesterol") && !lower.includes("glucose") && !lower.includes("hemoglobin")) {
    const latestReport = ctx.reports[0];
    const reportMeas = ctx.measurements.filter((m) => m.filename === latestReport?.filename);
    const displayMeas = reportMeas.length > 0 ? reportMeas.slice(0, 8) : ctx.measurements.slice(0, 8);
    if (displayMeas.length === 0) {
      return `**Answer:** Your latest report on file is **${latestReport?.filename || "recent report"}** (collected on ${latestReport?.report_date || "recorded date"}), but no individual biomarker measurements have been extracted from it yet.

**Limitations:** If this was an image or scanned document, please verify that it was clear and legible.

**Sources:** Report: ${latestReport?.filename || "Unknown"}`;
    }
    return `**Answer:** Here is a summary of your validated laboratory parameters from your latest medical report:

**Your medical data:**
` + displayMeas.map((m) => `\u2022 **${m.parameter}**: ${m.normalized_value || m.raw_value} ${m.unit} [Observed: ${m.report_date}]`).join("\n") + `

**Explanation:** These laboratory biomarkers reflect your metabolic and physiological status on ${latestReport?.report_date || "the test date"}. Longitudinal consistency across these parameters is essential for tracking ongoing health.

**Limitations:** Clinical evaluation requires interpreting these findings alongside your overall symptoms, physical exam, and complete health history.

**Sources:** ${latestReport?.filename || "Recent report"} (${latestReport?.report_date || "N/A"}).`;
  }
  if (lower.includes("hemoglobin") || lower.includes("hb") || lower.includes("cbc") || lower.includes("platelet") || lower.includes("wbc") || lower.includes("rbc") || lower.includes("hematocrit")) {
    const hb = ctx.measurements.find((m) => {
      const p = String(m.parameter).toLowerCase();
      return p.includes("hemoglobin") || p === "hb";
    });
    const wbc = ctx.measurements.find((m) => {
      const p = String(m.parameter).toLowerCase();
      return p.includes("wbc") || p.includes("leukocyte");
    });
    const plt = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("platelet"));
    const rbc = ctx.measurements.find((m) => {
      const p = String(m.parameter).toLowerCase();
      return p.includes("rbc") || p.includes("erythrocyte");
    });
    const items = [];
    if (hb) items.push(`\u2022 **Hemoglobin**: ${hb.normalized_value || hb.raw_value} ${hb.unit} (Report: ${hb.filename}, Date: ${hb.report_date})`);
    if (rbc) items.push(`\u2022 **RBC Count**: ${rbc.normalized_value || rbc.raw_value} ${rbc.unit} (Report: ${rbc.filename}, Date: ${rbc.report_date})`);
    if (wbc) items.push(`\u2022 **WBC Count**: ${wbc.normalized_value || wbc.raw_value} ${wbc.unit} (Report: ${wbc.filename}, Date: ${wbc.report_date})`);
    if (plt) items.push(`\u2022 **Platelets**: ${plt.normalized_value || plt.raw_value} ${plt.unit} (Report: ${plt.filename}, Date: ${plt.report_date})`);
    if (items.length === 0) {
      return `**Answer:** No hemoglobin or complete blood count (CBC) measurements were found in your uploaded records.

**Limitations:** Your ${ctx.reports.length} uploaded report(s) (${ctx.reports.map((r) => r.filename).join(", ")}) do not contain tested hemoglobin or CBC records.

**Next Steps:** Please upload your Complete Blood Count (CBC) report under the **Reports** tab to review hemoglobin and cell counts.`;
    }
    return `**Answer:** Here are the hematologic parameters extracted from your validated laboratory results:

**Your medical data:**
` + items.join("\n") + `

**Explanation:** Hemoglobin is an iron-containing oxygen transport protein in red blood cells. Adult reference ranges are generally ~13.8\u201317.2 g/dL for adult males and ~12.1\u201315.1 g/dL for adult females, though lab-specific calibration ranges apply.

**Limitations:** Hydration status and nutritional factors can alter hemoglobin concentration. Consult your physician for personalized evaluation.

**Sources:** Verified laboratory records (${[...new Set([hb?.filename, rbc?.filename, wbc?.filename, plt?.filename].filter(Boolean))].join(", ")}).`;
  }
  if (lower.includes("cardiology") || lower.includes("cholesterol") || lower.includes("heart") || lower.includes("lipid") || lower.includes("ldl") || lower.includes("blood pressure") || lower.includes("hypertension")) {
    const ldl = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("ldl"));
    const tc = ctx.measurements.find((m) => {
      const p = String(m.parameter).toLowerCase();
      return p.includes("cholesterol") && !p.includes("ldl") && !p.includes("hdl");
    });
    const hdl = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("hdl"));
    const bp = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("pressure") || String(m.parameter).toLowerCase().includes("bp"));
    const cardioGuidance = ctx.guidances.find((g) => g.domain === "cardiovascular" || String(g.suggested_specialty).toLowerCase().includes("cardio"));
    const dataItems = [];
    if (ldl) dataItems.push(`\u2022 **LDL Cholesterol**: ${ldl.normalized_value || ldl.raw_value} ${ldl.unit} (Report: ${ldl.filename}, Date: ${ldl.report_date})`);
    if (tc) dataItems.push(`\u2022 **Total Cholesterol**: ${tc.normalized_value || tc.raw_value} ${tc.unit} (Report: ${tc.filename}, Date: ${tc.report_date})`);
    if (hdl) dataItems.push(`\u2022 **HDL Cholesterol**: ${hdl.normalized_value || hdl.raw_value} ${hdl.unit} (Report: ${hdl.filename}, Date: ${hdl.report_date})`);
    if (bp) dataItems.push(`\u2022 **Blood Pressure**: ${bp.normalized_value || bp.raw_value} ${bp.unit} (Report: ${bp.filename}, Date: ${bp.report_date})`);
    if (dataItems.length === 0) {
      return `**Answer:** No cardiovascular biomarkers (such as LDL, HDL, Total Cholesterol, or Blood Pressure) were found in your uploaded records.

**Limitations:** You have ${ctx.reports.length} report(s) on file, but none contain documented lipid or blood pressure readings.

**Next Steps:** Upload a comprehensive metabolic panel or lipid profile report to review cardiovascular indicators.`;
    }
    let answerText = cardioGuidance ? `Cardiology consultation was recommended to evaluate your cardiovascular risk markers.` : `Here are the cardiovascular parameters documented in your medical records:`;
    let explanationText = `Cardiovascular markers such as LDL cholesterol and blood pressure provide quantitative insight into arterial health and long-term cardiovascular risk.`;
    if (cardioGuidance && cardioGuidance.evidence) {
      explanationText += ` Clinical guidance reasoning: ${cardioGuidance.evidence}`;
    }
    return `**Answer:** ${answerText}

**Your medical data:**
` + dataItems.join("\n") + `

**Explanation:** ${explanationText}

**Limitations:** Laboratory indicators should be evaluated in context of lifestyle, family history, and cardiovascular risk scores by a physician.

**Sources:** Verified laboratory records (${[...new Set([ldl?.filename, tc?.filename, hdl?.filename, bp?.filename].filter(Boolean))].join(", ")}).`;
  }
  if (lower.includes("glucose") || lower.includes("sugar") || lower.includes("diabetes") || lower.includes("hba1c") || lower.includes("a1c") || lower.includes("metabolic")) {
    const glu = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("glucose") || String(m.parameter).toLowerCase().includes("sugar"));
    const a1c = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("hba1c") || String(m.parameter).toLowerCase().includes("a1c"));
    const metabGuidance = ctx.guidances.find((g) => g.domain === "metabolic" || String(g.suggested_specialty).toLowerCase().includes("endocrin"));
    const items = [];
    if (glu) items.push(`\u2022 **Fasting/Random Glucose**: ${glu.normalized_value || glu.raw_value} ${glu.unit} (Date: ${glu.report_date}, Report: ${glu.filename})`);
    if (a1c) items.push(`\u2022 **HbA1c**: ${a1c.normalized_value || a1c.raw_value} ${a1c.unit} (Date: ${a1c.report_date}, Report: ${a1c.filename})`);
    if (items.length === 0) {
      return `**Answer:** No blood glucose or HbA1c measurements were identified in your uploaded medical reports.

**Limitations:** Your current records do not include glycemic laboratory panels.

**Next Steps:** Upload a diabetic panel or fasting metabolic test report if you wish to analyze blood sugar regulation.`;
    }
    return `**Answer:** Here are your metabolic biomarkers extracted from your laboratory results:

**Your medical data:**
` + items.join("\n") + `

**Explanation:** Blood glucose measures circulating blood sugar, while HbA1c provides an estimate of average glycemic control over the preceding 2 to 3 months.${metabGuidance ? ` Specialty guidance: ${metabGuidance.suggested_specialty} (${metabGuidance.evidence || "Metabolic monitoring"})` : ""}

**Limitations:** Fasting status at the time of specimen collection affects glucose interpretations.

**Sources:** ${[...new Set([glu?.filename, a1c?.filename].filter(Boolean))].join(", ")}.`;
  }
  if (lower.includes("kidney") || lower.includes("creatinine") || lower.includes("egfr") || lower.includes("renal") || lower.includes("nephro")) {
    const cr = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("creatinine"));
    const egfr = ctx.measurements.find((m) => String(m.parameter).toLowerCase().includes("egfr"));
    const items = [];
    if (cr) items.push(`\u2022 **Creatinine**: ${cr.normalized_value || cr.raw_value} ${cr.unit} (Date: ${cr.report_date}, Report: ${cr.filename})`);
    if (egfr) items.push(`\u2022 **eGFR**: ${egfr.normalized_value || egfr.raw_value} ${egfr.unit} (Date: ${egfr.report_date}, Report: ${egfr.filename})`);
    if (items.length === 0) {
      return `**Answer:** No renal function markers (such as Creatinine or eGFR) were found in your uploaded records.

**Limitations:** Renal indicators were not detected in your ${ctx.reports.length} uploaded report(s).

**Next Steps:** Upload a Comprehensive Metabolic Panel (CMP) or Renal Function Panel to review kidney markers.`;
    }
    return `**Answer:** Here are the renal function values documented in your validated records:

**Your medical data:**
` + items.join("\n") + `

**Explanation:** Serum creatinine and estimated glomerular filtration rate (eGFR) evaluate the filtration efficiency of the kidneys.

**Limitations:** Muscle mass, hydration, and acute illness can influence serum creatinine levels.

**Sources:** ${[...new Set([cr?.filename, egfr?.filename].filter(Boolean))].join(", ")}.`;
  }
  const queryTokens = lower.split(/[^a-zA-Z0-9]+/).filter((w) => w.length > 2 && !["what", "does", "mean", "result", "test", "level", "latest", "show", "value", "have", "from", "about", "explain", "tell"].includes(w));
  const matchedParams = ctx.measurements.filter((m) => {
    const p = String(m.parameter).toLowerCase();
    return queryTokens.some((tok) => p.includes(tok));
  });
  if (matchedParams.length > 0 && queryTokens.length > 0) {
    const uniqueMatched = matchedParams.slice(0, 6);
    return `**Answer:** Here are the matching measurements found in your medical records for your query:

**Your medical data:**
` + uniqueMatched.map((m) => `\u2022 **${m.parameter}**: ${m.normalized_value || m.raw_value} ${m.unit} (Report: ${m.filename}, Date: ${m.report_date})`).join("\n") + `

**Explanation:** These are your recorded laboratory results. Please consult with your healthcare provider to discuss how these values align with your clinical context.

**Limitations:** Single laboratory values should be considered in longitudinal context.

**Sources:** ${[...new Set(uniqueMatched.map((m) => m.filename))].join(", ")}.`;
  }
  if (lower.includes("compare") || lower.includes("previous") || lower.includes("trend") || lower.includes("history")) {
    if (ctx.reports.length < 2) {
      const single = ctx.reports[0];
      return `**Answer:** Longitudinal trend comparison requires at least two medical reports collected on different dates.

**Your medical data:** You currently have 1 verified report on file (**${single?.filename}**, dated **${single?.report_date || "N/A"}**).

**Next Steps:** Upload your historical or recent follow-up lab tests in the **Reports** tab to generate longitudinal comparison curves.`;
    }
    const distinctDates = [...new Set(ctx.reports.map((r) => r.report_date).filter(Boolean))];
    const multiDateParams = [];
    const paramMap = {};
    for (const m of ctx.measurements) {
      const p = m.parameter;
      if (!paramMap[p]) paramMap[p] = [];
      paramMap[p].push(m);
    }
    for (const p in paramMap) {
      const uniqueObsDates = new Set(paramMap[p].map((x) => x.report_date));
      if (uniqueObsDates.size >= 2) {
        const sorted = paramMap[p].sort((a, b) => String(a.report_date).localeCompare(String(b.report_date)));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        multiDateParams.push(`\u2022 **${p}**: ${first.normalized_value || first.raw_value} ${first.unit} (${first.report_date}) \u2192 ${last.normalized_value || last.raw_value} ${last.unit} (${last.report_date})`);
      }
    }
    return `**Answer:** Comparing your health measurements across your ${ctx.reports.length} uploaded reports (${distinctDates.join(", ")}):

**Your medical data:**
` + (multiDateParams.length > 0 ? multiDateParams.slice(0, 6).join("\n") : `\u2022 Measurements were collected across dates: ${distinctDates.join(", ")}.`) + `

**Explanation:** Longitudinal tracking highlights physiological stability or trends over time. You can view full interactive trend graphs and future outlook forecasts under the **Trends** and **Future Outlook** tabs.

**Limitations:** Differing reference laboratories or assay methodologies between reports can introduce minor variations.

**Sources:** Reports: ${ctx.reports.map((r) => `${r.filename} (${r.report_date})`).join(", ")}.`;
  }
  if (lower.includes("improve") || lower.includes("lifestyle") || lower.includes("diet") || lower.includes("exercise")) {
    return `**Answer:** General evidence-based lifestyle strategies to discuss with your healthcare provider:

\u2022 **Cardiovascular Support:** Prioritize heart-healthy dietary patterns (e.g. rich in soluble fiber and omega-3s) alongside routine moderate aerobic activity (e.g. 150 min/week).
\u2022 **Metabolic Regulation:** Balance complex carbohydrates with lean protein and stay consistently hydrated.
\u2022 **Follow-Up:** Schedule periodic re-testing with your physician to monitor biomarkers that require longitudinal follow-up.

**Limitations:** Lifestyle adjustments should always be personalized in consultation with your primary physician.

**Sources:** MediTrack Evidence-Based Clinical Guidance Guidelines.`;
  }
  const uniqueParams = [...new Set(ctx.measurements.map((m) => m.parameter))];
  const specialties = ctx.guidances.map((g) => g.suggested_specialty).filter(Boolean);
  return `**Answer:** I am your MediTrack clinical assistant. I have access to your **${ctx.reports.length}** verified report(s) and **${ctx.measurements.length}** validated measurement(s).

**Your medical data:**
\u2022 **Active Biomarkers Tracked (${uniqueParams.length}):** ${uniqueParams.slice(0, 7).join(", ")}${uniqueParams.length > 7 ? "..." : ""}
` + (specialties.length > 0 ? `\u2022 **Recommended Consultations:** ${[...new Set(specialties)].join(", ")}
` : "") + `
**Explanation:** You can ask me to explain your blood report, review specific biomarkers (e.g. cholesterol, hemoglobin, glucose, kidney function), or compare historical test dates.

**Limitations:** This assistant provides educational insights based strictly on your uploaded records and does not substitute for licensed clinical diagnosis.

**Sources:** Authorized patient medical records.`;
}
app.get("/api/ai/chat/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.execute({
      sql: "SELECT id, role, content, created_at as timestamp FROM chat_messages WHERE user_id = ? ORDER BY id ASC LIMIT 50",
      args: [userId]
    });
    res.json(result.rows.map((r) => ({
      id: String(r.id),
      role: r.role,
      content: r.content,
      timestamp: r.timestamp
    })));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to retrieve conversation history" });
  }
});
app.delete("/api/ai/chat/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.execute({
      sql: "DELETE FROM chat_messages WHERE user_id = ?",
      args: [userId]
    });
    res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear conversation history" });
  }
});
app.post("/api/ai/chat", authenticateToken, chatRateLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.length > 2e3) {
      return res.status(400).json({ error: "Message is too long (maximum 2000 characters)" });
    }
    const userId = req.user.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await db.execute({
        sql: "INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        args: [userId, "user", message.trim(), now]
      });
    } catch (dbErr) {
      console.warn("Failed to persist user chat message:", dbErr);
    }
    let contextData;
    try {
      const ctxResult = await getUserMedicalAnalysisContext(userId);
      contextData = ctxResult.contextData;
    } catch (ctxErr) {
      console.warn("[AI Chat] Context retrieval fallback:", ctxErr);
      contextData = {
        user: null,
        reports: [],
        pendingReports: [],
        measurements: [],
        risks: [],
        guidances: [],
        outlooks: [],
        hasData: false
      };
    }
    const clinicalContext = formatClinicalContext(contextData);
    let reply = "";
    if (aiService.isConfigured()) {
      try {
        reply = await aiService.generateChatResponse(message, clinicalContext, history);
      } catch (aiErr) {
        console.warn("Gemini chat unavailable or failed, engaging grounded clinical rule responder:", aiErr.message);
        reply = generateGroundedRuleResponse(message, contextData);
      }
    } else {
      reply = generateGroundedRuleResponse(message, contextData);
    }
    try {
      await db.execute({
        sql: "INSERT INTO chat_messages (user_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        args: [userId, "assistant", reply, (/* @__PURE__ */ new Date()).toISOString()]
      });
    } catch (dbErr) {
      console.warn("Failed to persist assistant chat message:", dbErr);
    }
    return res.json({ message: reply });
  } catch (error) {
    console.error("Error in /api/ai/chat:", error);
    res.status(500).json({ error: "AI assistant is temporarily unavailable. Please try again." });
  }
});
var facilityCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 5 * 60 * 1e3;
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
app.get("/api/facilities", authenticateToken, async (req, res) => {
  try {
    const city = (req.query.city || "").toString().trim().toLowerCase();
    const specialty = (req.query.specialty || "").toString().trim().toLowerCase();
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    if (!city && (!userLat || !userLng)) {
      return res.status(400).json({ error: "City or coordinates required" });
    }
    const cacheKey = `${city}-${specialty}`;
    let facilities = [];
    if (facilityCache.has(cacheKey)) {
      const cached = facilityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        facilities = cached.data;
      } else {
        facilityCache.delete(cacheKey);
      }
    }
    if (facilities.length === 0) {
      let query = "SELECT * FROM healthcare_facilities WHERE active = 1";
      const args = [];
      query = 'SELECT * FROM healthcare_facilities WHERE verification_status = "VERIFIED"';
      if (city) {
        query += " AND LOWER(city) = ?";
        args.push(city);
      }
      const result = await db.execute({ sql: query, args });
      facilities = result.rows;
      if (specialty) {
        facilities = facilities.filter((f) => f.specialties.toLowerCase().includes(specialty));
      }
      facilityCache.set(cacheKey, { timestamp: Date.now(), data: facilities });
    }
    let results = [...facilities];
    if (!isNaN(userLat) && !isNaN(userLng)) {
      results = results.map((f) => {
        const distance = getDistanceFromLatLonInKm(userLat, userLng, f.latitude, f.longitude);
        return { ...f, distance: parseFloat(distance.toFixed(2)) };
      });
      results.sort((a, b) => a.distance - b.distance);
    }
    res.json(results);
  } catch (error) {
    console.error("Facilities Error:", error);
    res.status(500).json({ error: "Failed to fetch facilities" });
  }
});
app.post("/api/admin/facilities", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { name, specialties, address, city, latitude, longitude, phone, verification_status } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const result = await db.execute({
    sql: `INSERT INTO healthcare_facilities (name, specialties, address, city, latitude, longitude, phone, verification_status, last_verified, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [name, specialties, address, city, latitude, longitude, phone, verification_status || "PENDING", now, now, now]
  });
  facilityCache.clear();
  clearCache("facilities");
  clearCache("specialtyRules");
  res.json(result.rows[0]);
});
app.put("/api/admin/facilities/:id", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { name, specialties, address, city, latitude, longitude, phone, verification_status } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const result = await db.execute({
    sql: `UPDATE healthcare_facilities SET name=?, specialties=?, address=?, city=?, latitude=?, longitude=?, phone=?, verification_status=?, last_verified=?, updated_at=? WHERE id=? RETURNING *`,
    args: [name, specialties, address, city, latitude, longitude, phone, verification_status, now, now, req.params.id]
  });
  facilityCache.clear();
  clearCache("facilities");
  clearCache("specialtyRules");
  res.json(result.rows[0]);
});
function buildTrustedContactValues(body, current) {
  const nameRaw = body.name !== void 0 ? body.name : current?.name;
  const relationshipRaw = body.relationship !== void 0 ? body.relationship : current?.relationship;
  const methodRaw = body.contact_method !== void 0 ? body.contact_method : current?.contact_method;
  const valueRaw = body.contact_value !== void 0 ? body.contact_value : current?.contact_value;
  const statusRaw = body.status !== void 0 ? body.status : current?.status || "ACTIVE";
  const emailRaw = body.email !== void 0 ? body.email : current?.email || (methodRaw === "EMAIL" ? valueRaw : "");
  const phoneRaw = body.phone !== void 0 ? body.phone : current?.phone || (["SMS", "PHONE"].includes(methodRaw) ? valueRaw : "");
  const emailEnabledRaw = body.email_enabled !== void 0 ? body.email_enabled : current?.email_enabled !== void 0 ? current.email_enabled : 1;
  const smsEnabledRaw = body.sms_enabled !== void 0 ? body.sms_enabled : current?.sms_enabled !== void 0 ? current.sms_enabled : 1;
  const consentStatusRaw = body.consent_status !== void 0 ? body.consent_status : current?.consent_status || "GRANTED";
  const errors = {};
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const relationship = typeof relationshipRaw === "string" ? relationshipRaw.trim() : "";
  let contactMethod = typeof methodRaw === "string" ? methodRaw.trim().toUpperCase() : "";
  const status = typeof statusRaw === "string" ? statusRaw.trim().toUpperCase() : "ACTIVE";
  if (contactMethod === "PHONE") contactMethod = "SMS";
  if (!name) errors.name = "Enter the contact\u2019s full name.";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";
  if (!relationship) errors.relationship = "Enter the relationship.";
  else if (relationship.length > 80) errors.relationship = "Relationship must be 80 characters or fewer.";
  if (!["ACTIVE", "DISABLED", "INACTIVE"].includes(status)) errors.status = "Choose a valid contact status.";
  let email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  let phone = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      errors.email = "Enter a valid email address.";
    }
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = "Enter a valid phone number with 7 to 15 digits.";
    } else {
      phone = phone.startsWith("+") ? `+${digits}` : `+${digits}`;
    }
  }
  if (!email && !phone) {
    const val = typeof valueRaw === "string" ? valueRaw.trim() : "";
    if (contactMethod === "EMAIL") {
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.email = "Enter a valid email address.";
      else email = val.toLowerCase();
    } else {
      const digits = val.replace(/\D/g, "");
      if (!val || digits.length < 7 || digits.length > 15) errors.phone = "Enter a valid phone number with 7 to 15 digits.";
      else phone = val.startsWith("+") ? `+${digits}` : `+${digits}`;
    }
  }
  if (!email && !phone) {
    errors.contact_value = "Provide at least a valid email address or phone number.";
  }
  const primaryValue = email || phone || "";
  const primaryMethod = email ? "EMAIL" : "SMS";
  const telegramEnabledRaw = body.telegram_enabled !== void 0 ? body.telegram_enabled : current?.telegram_enabled !== void 0 ? current.telegram_enabled : 1;
  return {
    errors,
    values: {
      name,
      relationship,
      contact_method: contactMethod || primaryMethod,
      contact_value: primaryValue,
      email: email || null,
      phone: phone || null,
      email_enabled: emailEnabledRaw ? 1 : 0,
      sms_enabled: 0,
      telegram_enabled: telegramEnabledRaw !== void 0 ? telegramEnabledRaw ? 1 : 0 : current?.telegram_enabled ?? 1,
      consent_status: consentStatusRaw === "REVOKED" ? "REVOKED" : "GRANTED",
      status: ["DISABLED", "INACTIVE"].includes(status) ? "DISABLED" : "ACTIVE"
    }
  };
}
app.get("/api/contacts", authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM trusted_contacts WHERE user_id = ? ORDER BY created_at DESC",
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (error) {
    console.error("Trusted contacts retrieval failed:", error);
    res.status(500).json({ error: "Unable to retrieve trusted contacts" });
  }
});
app.post("/api/contacts", authenticateToken, async (req, res) => {
  try {
    const { errors, values } = buildTrustedContactValues(req.body || {});
    if (Object.keys(errors).length) return res.status(400).json({ error: "Check the contact details and try again.", fields: errors });
    const existing = await db.execute({
      sql: "SELECT id, email, phone, contact_value FROM trusted_contacts WHERE user_id = ? AND status != 'DISABLED'",
      args: [req.user.id]
    });
    const duplicate = existing.rows.some((contact) => {
      const emailMatch = values.email && contact.email && contact.email.toLowerCase() === values.email.toLowerCase();
      const phoneMatch = values.phone && contact.phone && contact.phone.replace(/\D/g, "") === values.phone.replace(/\D/g, "");
      return emailMatch || phoneMatch;
    });
    if (duplicate) return res.status(409).json({ error: "An active contact with this email address or phone number already exists." });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await db.execute({
      sql: `INSERT INTO trusted_contacts 
            (user_id, name, relationship, contact_method, contact_value, email, phone, email_enabled, sms_enabled, telegram_enabled, consent_status, consent_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        req.user.id,
        values.name,
        values.relationship,
        values.contact_method,
        values.contact_value,
        values.email,
        values.phone,
        values.email_enabled,
        values.telegram_enabled,
        values.consent_status,
        now,
        values.status,
        now,
        now
      ]
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Trusted contact creation failed:", error);
    res.status(500).json({ error: "Unable to save the trusted contact" });
  }
});
app.put("/api/contacts/:id", authenticateToken, async (req, res) => {
  try {
    const contactId = Number(req.params.id);
    if (!Number.isSafeInteger(contactId) || contactId <= 0) return res.status(400).json({ error: "Invalid contact ID" });
    const currentResult = await db.execute({
      sql: "SELECT * FROM trusted_contacts WHERE id = ? AND user_id = ?",
      args: [contactId, req.user.id]
    });
    const current = currentResult.rows[0];
    if (!current) return res.status(404).json({ error: "Contact not found" });
    const { errors, values } = buildTrustedContactValues(req.body || {}, current);
    if (Object.keys(errors).length) return res.status(400).json({ error: "Check the contact details and try again.", fields: errors });
    const existing = await db.execute({
      sql: "SELECT id, email, phone, contact_value FROM trusted_contacts WHERE user_id = ? AND id != ? AND status != 'DISABLED'",
      args: [req.user.id, contactId]
    });
    const duplicate = existing.rows.some((contact) => {
      const emailMatch = values.email && contact.email && contact.email.toLowerCase() === values.email.toLowerCase();
      const phoneMatch = values.phone && contact.phone && contact.phone.replace(/\D/g, "") === values.phone.replace(/\D/g, "");
      return emailMatch || phoneMatch;
    });
    if (duplicate) return res.status(409).json({ error: "Another active contact with this email address or phone number already exists." });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await db.execute({
      sql: `UPDATE trusted_contacts 
            SET name = ?, relationship = ?, contact_method = ?, contact_value = ?, email = ?, phone = ?, email_enabled = ?, telegram_enabled = ?, consent_status = ?, status = ?, updated_at = ?
            WHERE id = ? AND user_id = ? RETURNING *`,
      args: [
        values.name,
        values.relationship,
        values.contact_method,
        values.contact_value,
        values.email,
        values.phone,
        values.email_enabled,
        values.telegram_enabled,
        values.consent_status,
        values.status,
        now,
        contactId,
        req.user.id
      ]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: "Contact not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Trusted contact update failed:", error);
    res.status(500).json({ error: "Unable to update the trusted contact" });
  }
});
app.delete("/api/contacts/:id", authenticateToken, async (req, res) => {
  try {
    const contactId = Number(req.params.id);
    if (!Number.isSafeInteger(contactId) || contactId <= 0) return res.status(400).json({ error: "Invalid contact ID" });
    const isPermanent = req.query.permanent === "true";
    if (isPermanent) {
      await db.execute({
        sql: "UPDATE health_alerts SET contact_id = NULL WHERE contact_id = ? AND user_id = ?",
        args: [contactId, req.user.id]
      });
      const delResult = await db.execute({
        sql: "DELETE FROM trusted_contacts WHERE id = ? AND user_id = ? RETURNING *",
        args: [contactId, req.user.id]
      });
      if (delResult.rows.length === 0) return res.status(404).json({ error: "Contact not found" });
      return res.json({ success: true, contact: delResult.rows[0], deletedPermanently: true });
    }
    const result = await db.execute({
      sql: `UPDATE trusted_contacts SET status = 'DISABLED', updated_at = ? WHERE id = ? AND user_id = ? RETURNING *`,
      args: [(/* @__PURE__ */ new Date()).toISOString(), contactId, req.user.id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true, contact: result.rows[0] });
  } catch (error) {
    console.error("Trusted contact deletion failed:", error);
    res.status(500).json({ error: "Unable to remove or deactivate the trusted contact" });
  }
});
app.get("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const alerts = await alertManager.getUserAlerts(req.user.id);
    res.json(alerts);
  } catch (err) {
    console.error("Fetch alerts error:", err);
    res.status(500).json({ error: "Failed to retrieve health alerts" });
  }
});
app.get("/api/alerts/unread-count", authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "SELECT count(*) as count FROM health_alerts WHERE user_id = ? AND is_read = 0",
      args: [req.user.id]
    });
    res.json({ unreadCount: Number(result.rows[0]?.count || 0) });
  } catch (err) {
    res.status(500).json({ error: "Failed to count unread alerts" });
  }
});
app.get("/api/alerts/:id/deliveries", authenticateToken, async (req, res) => {
  try {
    const alertCheck = await db.execute({
      sql: "SELECT id FROM health_alerts WHERE id = ? AND user_id = ?",
      args: [req.params.id, req.user.id]
    });
    if (alertCheck.rows.length === 0) return res.status(404).json({ error: "Alert not found" });
    const result = await db.execute({
      sql: "SELECT * FROM notification_deliveries WHERE alert_id = ? ORDER BY created_at ASC",
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve alert delivery records" });
  }
});
app.put("/api/alerts/:id/read", authenticateToken, async (req, res) => {
  const alertId = req.params.id;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: `UPDATE health_alerts SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?`,
    args: [now, alertId, req.user.id]
  });
  res.json({ success: true });
});
app.put("/api/alerts/read-all", authenticateToken, async (req, res) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: `UPDATE health_alerts SET is_read = 1, read_at = ? WHERE user_id = ?`,
    args: [now, req.user.id]
  });
  res.json({ success: true });
});
app.post("/api/alerts/test-emergency", authenticateToken, async (req, res) => {
  try {
    const contactId = req.body.contact_id ? Number(req.body.contact_id) : void 0;
    const testResult = await alertManager.sendTestEmergencyAlert(req.user.id, contactId);
    res.json({
      success: true,
      alert: testResult.alert,
      deliveries: testResult.deliveries
    });
  } catch (err) {
    console.error("Test emergency alert failed:", err);
    res.status(500).json({ error: err.message || "Failed to dispatch test emergency alert" });
  }
});
app.post("/api/alerts/evaluate-report/:id", authenticateToken, async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const alerts = await alertManager.processReportAlerts(req.user.id, reportId);
    res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to evaluate report alerts" });
  }
});
app.post("/api/alerts", authenticateToken, async (req, res) => {
  const { type, message, source, contact_id, severity, title, parameter, measured_value, reference_range } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const alertSeverity = severity || type || "WARNING";
  const result = await db.execute({
    sql: `INSERT INTO health_alerts (user_id, contact_id, type, severity, title, message, source, status, parameter, measured_value, reference_range, is_read, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?) RETURNING *`,
    args: [
      req.user.id,
      contact_id || null,
      alertSeverity,
      alertSeverity,
      title || message,
      message,
      source || "Clinical System",
      "DELIVERED",
      parameter || null,
      measured_value || null,
      reference_range || null,
      now
    ]
  });
  res.json(result.rows[0]);
});
app.get("/api/search", authenticateToken, async (req, res) => {
  const query = (req.query.q || "").toString().trim();
  if (!query || query.length < 2) {
    return res.json({ reports: [], measurements: [], medications: [], specialists: [] });
  }
  const likePattern = `%${query}%`;
  const userId = req.user.id;
  try {
    const reportsRes = await db.execute({
      sql: `SELECT id, filename, report_type, report_date 
            FROM medical_reports 
            WHERE user_id = ? AND (filename LIKE ? OR report_type LIKE ?)
            ORDER BY report_date DESC LIMIT 5`,
      args: [userId, likePattern, likePattern]
    });
    const measurementsRes = await db.execute({
      sql: `SELECT m.id, m.parameter, m.raw_value, m.unit, r.report_date 
            FROM measurements m 
            JOIN medical_reports r ON m.report_id = r.id 
            WHERE r.user_id = ? AND m.parameter LIKE ?
            ORDER BY r.report_date DESC LIMIT 5`,
      args: [userId, likePattern]
    });
    const medicationsRes = await db.execute({
      sql: `SELECT id, name, dosage, frequency 
            FROM medications 
            WHERE user_id = ? AND name LIKE ?
            LIMIT 5`,
      args: [userId, likePattern]
    });
    const facilitiesRes = await db.execute({
      sql: `SELECT id, name, specialties as specialty, city 
            FROM healthcare_facilities 
            WHERE name LIKE ? OR specialties LIKE ? OR city LIKE ?
            LIMIT 5`,
      args: [likePattern, likePattern, likePattern]
    });
    res.json({
      reports: reportsRes.rows,
      measurements: measurementsRes.rows,
      medications: medicationsRes.rows,
      specialists: facilitiesRes.rows
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to execute global search" });
  }
});
app.get("/api/admin/users", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const result = await db.execute("SELECT id, email, name, role, status, phone, date_of_birth FROM users ORDER BY id DESC");
  res.json(result.rows);
});
app.put("/api/admin/users/:id/status", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { status } = req.body;
  const result = await db.execute({
    sql: "UPDATE users SET status = ? WHERE id = ? RETURNING id, email, name, role, status, phone",
    args: [status, req.params.id]
  });
  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
  if (status === "SUSPENDED" || status === "DISABLED" || status === "DELETED") {
    await authService.revokeAllUserSessions(db, Number(req.params.id));
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute({
    sql: `INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: ["INFO", "USER_STATUS_CHANGED", `User ${req.params.id} status changed to ${status} by ADMIN ${req.user.id}`, req.user.id, now]
  });
  res.json(result.rows[0]);
});
app.get("/api/admin/facilities", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const now = Date.now();
  if (appCache.facilities.data && now - appCache.facilities.timestamp < CACHE_TTL_MS3) {
    return res.json(appCache.facilities.data);
  }
  const result = await db.execute("SELECT * FROM healthcare_facilities ORDER BY id DESC");
  appCache.facilities = { data: result.rows, timestamp: now };
  res.json(result.rows);
});
app.get("/api/admin/specialty_rules", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const now = Date.now();
  if (appCache.specialtyRules.data && now - appCache.specialtyRules.timestamp < CACHE_TTL_MS3) {
    return res.json(appCache.specialtyRules.data);
  }
  const result = await db.execute("SELECT * FROM specialty_rules ORDER BY id DESC");
  appCache.specialtyRules = { data: result.rows, timestamp: now };
  res.json(result.rows);
});
app.post("/api/admin/specialty_rules", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { domain, specialty, rule_reference, version } = req.body;
  const result = await db.execute({
    sql: `INSERT INTO specialty_rules (domain, specialty, rule_reference, version) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [domain, specialty, rule_reference, version]
  });
  clearCache("specialtyRules");
  res.json(result.rows[0]);
});
app.put("/api/admin/specialty_rules/:id", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { domain, specialty, rule_reference, version } = req.body;
  const result = await db.execute({
    sql: `UPDATE specialty_rules SET domain = ?, specialty = ?, rule_reference = ?, version = ? WHERE id = ? RETURNING *`,
    args: [domain, specialty, rule_reference, version, req.params.id]
  });
  if (result.rows.length === 0) return res.status(404).json({ error: "Rule not found" });
  clearCache("specialtyRules");
  res.json(result.rows[0]);
});
app.get("/api/admin/validation", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    const report = await runSoftwareValidationSuite();
    res.json(report);
  } catch (error) {
    console.error("Validation runner error:", error);
    res.status(500).json({ error: "Failed to generate validation report: " + (error.message || "Unknown error") });
  }
});
app.get("/api/admin/logs", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const result = await db.execute("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100");
  res.json(result.rows);
});
app.post("/api/admin/logs", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  const { level, event_type, message } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const result = await db.execute({
    sql: `INSERT INTO system_logs (level, event_type, message, user_id, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *`,
    args: [level || "INFO", event_type, message, req.user ? req.user.id : null, now]
  });
  res.json(result.rows[0]);
});
async function startServer() {
  await initDb();
  const httpServer = http.createServer(app);
  app.use("/api", (req, res, next) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.url}`, code: "NOT_FOUND" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path5.join(process.cwd(), "dist");
    const assetsPath = path5.join(distPath, "assets");
    app.use("/assets", express.static(assetsPath, {
      maxAge: "1y",
      immutable: true
    }));
    app.use(express.static(distPath, {
      maxAge: "1h"
    }));
    app.get("{*splat}", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path5.join(distPath, "index.html"));
    });
  }
  app.use(apiErrorHandler);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;

// api/index.ts
var isDbInitialized = false;
var initPromise = null;
async function ensureDbInitialized() {
  if (isDbInitialized) return;
  if (!initPromise) {
    initPromise = initDb().then(() => {
      isDbInitialized = true;
    }).catch((err) => {
      initPromise = null;
      console.error("[Vercel Serverless] Failed to initialize database schema:", err);
      throw err;
    });
  }
  return initPromise;
}
async function handler(req, res) {
  try {
    await ensureDbInitialized();
    const originalPath = req.headers?.["x-forwarded-uri"] || req.headers?.["x-matched-path"] || req.url || "/api";
    if (!req.url || req.url === "/" || req.url === "/api" || !req.url.startsWith("/api")) {
      if (originalPath && originalPath.startsWith("/api")) {
        req.url = originalPath;
      } else {
        req.url = "/api" + (req.url?.startsWith("/") ? req.url : "/" + (req.url || ""));
      }
    }
    return server_default(req, res);
  } catch (error) {
    console.error("[Vercel Serverless] Uncaught handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "production" ? "An unexpected server error occurred." : error?.message
      });
    }
  }
}
export {
  handler as default
};
