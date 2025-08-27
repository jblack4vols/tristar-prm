mkdir -p src/lib
cat > src/lib/columns.ts << 'EOF'
export const COLUMN_CANDIDATES: Record<string, string[]> = {
  created_date: ["Created Date","created_date","created","Case Created","Date Created","createddate"],
  referring_doctor: ["Referring Doctor","referring_doctor","Doctor","Physician","Referrer"],
  referring_doctor_npi: ["Referring Doctor NPI","referring_doctor_npi","NPI"],
  facility: ["Case Facility","Facility","Location","clinic","facility"],
  primary_insurance: ["Primary Insurance","primary_insurance","Insurance","Plan","Payer"],
  discipline: ["Discipline","discipline","Dept","Department"],
  therapist: ["Case Therapist","Therapist","Provider"],
  arrived_visits: ["Arrived Visits","arrived_visits"],
  scheduled_visits: ["Scheduled Visits","scheduled_visits"],
  initial_eval_date: ["Date of Initial Eval","Initial Eval","IE Date"],
  first_scheduled_date: ["Date of First Scheduled Visit"],
  first_arrived_date: ["Date of First Arrived Visit"],
  discharge_date: ["Discharge Date"],
  case_status: ["Case Status"],
};
export function buildColumnMap(headers: string[]) {
  const lower = headers.map(h => String(h||'').trim());
  const map: Record<string,string> = {};
  for (const [key, cands] of Object.entries(COLUMN_CANDIDATES)) {
    const idx = lower.findIndex(h => cands.some(c => h.toLowerCase() === String(c).toLowerCase()));
    if (idx !== -1) map[key] = headers[idx];
  }
  return map;
}
EOF
