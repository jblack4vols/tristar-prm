// Column mapping utilities for Excel workbook normalization

export interface ColumnMap {
  [key: string]: string;
}

/**
 * Build a mapping from normalized column keys to actual Excel column headers
 * This allows for flexible column name matching across different Excel files
 */
export function buildColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  
  // Normalize headers to lowercase and remove special characters for matching
  const normalizeHeader = (header: string): string => {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Define possible variations for each expected column
  const columnVariations: Record<string, string[]> = {
    created_date: ['created_date', 'createddate', 'created date', 'date_created', 'datecreated'],
    referring_doctor: ['referring_doctor', 'referringdoctor', 'referring doctor', 'doctor', 'physician', 'referring_physician'],
    referring_doctor_npi: ['referring_doctor_npi', 'referringdoctornpi', 'referring doctor npi', 'doctor_npi', 'npi', 'physician_npi'],
    facility: ['facility', 'location', 'clinic', 'center', 'case facility', 'casefacility'],
    primary_insurance: ['primary_insurance', 'primaryinsurance', 'primary insurance', 'insurance', 'payer'],
    discipline: ['discipline', 'therapy_type', 'therapytype', 'treatment_type'],
    therapist: ['therapist', 'provider', 'clinician', 'treating_therapist', 'case therapist', 'casetherapist'],
    arrived_visits: ['arrived_visits', 'arrivedvisits', 'arrived visits', 'completed_visits', 'visits_completed'],
    scheduled_visits: ['scheduled_visits', 'scheduledvisits', 'scheduled visits', 'total_visits', 'visits_scheduled'],
    initial_eval_date: ['initial_eval_date', 'initialevaldate', 'date of initial eval', 'eval_date', 'evaluation_date'],
    first_scheduled_date: ['first_scheduled_date', 'firstscheduleddate', 'date of first scheduled visit', 'first_visit_date'],
    first_arrived_date: ['first_arrived_date', 'firstarriveddate', 'date of first arrived visit', 'first_treatment_date'],
    discharge_date: ['discharge_date', 'dischargedate', 'discharge date', 'end_date', 'completion_date'],
    case_status: ['case_status', 'casestatus', 'case status', 'status', 'treatment_status']
  };

  // Match headers to normalized column names
  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    
    for (const [columnKey, variations] of Object.entries(columnVariations)) {
      for (const variation of variations) {
        if (normalizedHeader === normalizeHeader(variation)) {
          map[columnKey] = header;
          break;
        }
      }
    }
  }

  return map;
}

/**
 * Get available columns from headers
 */
export function getAvailableColumns(headers: string[]): string[] {
  const map = buildColumnMap(headers);
  return Object.keys(map);
}

/**
 * Validate that required columns are present
 */
export function validateRequiredColumns(headers: string[]): { isValid: boolean; missing: string[] } {
  const map = buildColumnMap(headers);
  const required = ['created_date', 'referring_doctor'];
  const missing = required.filter(col => !map[col]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
}
