cat > src/lib/normalize.ts << 'EOF'
import * as XLSX from 'xlsx';
import { buildColumnMap } from './columns';

function toISO(d: any) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt as any)) return null as any;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2,'0');
  const dd = String(dt.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

export type Row = {
  created_date: string|null;
  referring_doctor: string|null;
  referring_doctor_npi: string|null;
  facility: string|null;
  primary_insurance: string|null;
  discipline: string|null;
  therapist: string|null;
  arrived_visits: number;
  scheduled_visits: number;
  initial_eval_date: string|null;
  first_scheduled_date: string|null;
  first_arrived_date: string|null;
  discharge_date: string|null;
  case_status: string|null;
};

export function normalizeWorkbook(buf: ArrayBuffer): Row[] {
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as any[];
  const headers = Object.keys(rows[0] || {});
  const map = buildColumnMap(headers);
  const pick = (row: any, key: string) => (map[key] ? row[map[key]] : undefined);

  return rows.map(row => ({
    created_date: toISO(pick(row,'created_date')) || toISO(pick(row,'initial_eval_date')) || null,
    referring_doctor: String(pick(row,'referring_doctor') ?? '').trim() || null,
    referring_doctor_npi: String(pick(row,'referring_doctor_npi') ?? '').trim() || null,
    facility: String(pick(row,'facility') ?? '').trim() || null,
    primary_insurance: String(pick(row,'primary_insurance') ?? '').trim() || null,
    discipline: String(pick(row,'discipline') ?? '').trim() || null,
    therapist: String(pick(row,'therapist') ?? '').trim() || null,
    arrived_visits: Number(pick(row,'arrived_visits') ?? 0) || 0,
    scheduled_visits: Number(pick(row,'scheduled_visits') ?? 0) || 0,
    initial_eval_date: toISO(pick(row,'initial_eval_date')) || null,
    first_scheduled_date: toISO(pick(row,'first_scheduled_date')) || null,
    first_arrived_date: toISO(pick(row,'first_arrived_date')) || null,
    discharge_date: toISO(pick(row,'discharge_date')) || null,
    case_status: String(pick(row,'case_status') ?? '').trim() || null,
  })).filter(r => r.created_date && r.referring_doctor);
}
EOF
