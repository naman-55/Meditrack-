import { evaluateCardiovascularRisk, evaluateMetabolicRisk, MeasurementRecord } from './riskEngine.js';
import * as assert from 'assert';

function runTests() {
  console.log('Running Risk Engine Unit Tests...');

  // Test 1: Missing Data -> GREY
  let cvResult = evaluateCardiovascularRisk([]);
  assert.strictEqual(cvResult.level, 'GREY', 'Missing data should return GREY');
  assert.strictEqual(cvResult.data_quality, 'INSUFFICIENT');

  // Test 2: Normal CV -> GREEN
  cvResult = evaluateCardiovascularRisk([
    { parameter: 'blood pressure', normalized_value: '110/70', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'ldl', normalized_value: '95', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(cvResult.level, 'GREEN');
  
  // Test 3: Elevated BP -> YELLOW
  cvResult = evaluateCardiovascularRisk([
    { parameter: 'blood pressure', normalized_value: '125/75', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'ldl', normalized_value: '95', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(cvResult.level, 'YELLOW');

  // Test 4: High BP -> RED
  cvResult = evaluateCardiovascularRisk([
    { parameter: 'blood pressure', normalized_value: '145/95', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'ldl', normalized_value: '95', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(cvResult.level, 'RED');

  // Test 5: High LDL -> RED
  cvResult = evaluateCardiovascularRisk([
    { parameter: 'blood pressure', normalized_value: '110/70', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'ldl', normalized_value: '170', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(cvResult.level, 'RED');

  // Test 6: Unvalidated Data -> GREY
  cvResult = evaluateCardiovascularRisk([
    { parameter: 'blood pressure', normalized_value: '145/95', validation_status: 'PENDING', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'ldl', normalized_value: '95', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(cvResult.level, 'GREY');
  assert.strictEqual(cvResult.data_quality, 'UNRELIABLE');

  // Test 7: Metabolic Normal -> GREEN
  let metResult = evaluateMetabolicRisk([
    { parameter: 'glucose', normalized_value: '90', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'hba1c', normalized_value: '5.2', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'bmi', normalized_value: '22', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(metResult.level, 'GREEN');

  // Test 8: Metabolic Pre-diabetes -> YELLOW
  metResult = evaluateMetabolicRisk([
    { parameter: 'glucose', normalized_value: '110', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'hba1c', normalized_value: '6.0', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'bmi', normalized_value: '22', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(metResult.level, 'YELLOW');

  // Test 9: Metabolic Diabetes -> RED
  metResult = evaluateMetabolicRisk([
    { parameter: 'glucose', normalized_value: '135', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'hba1c', normalized_value: '7.1', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' },
    { parameter: 'bmi', normalized_value: '28', validation_status: 'VALIDATED', report_date: '2023-01-01', report: 'test.pdf', page: '1' }
  ]);
  assert.strictEqual(metResult.level, 'RED');
  
  console.log('All tests passed successfully!');
}

runTests();
