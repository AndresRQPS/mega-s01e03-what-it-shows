// The problems #4471 really holds. causes.ts tells parser from hint by tenant; it cannot see a
// report whose dates moved by one day, not by a swap. The desk read those (desk-notes.json), so a
// report the desk listed there is its own problem here, not a footnote under its tenant's cause.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export const PROBLEMS: Record<Problem, { name: string; what: string }> = {
  parser: {
    name: 'Shared parser reads day-first dates month first',
    what: 'Day and month swap. Every channel, every day-first tenant.',
  },
  hint: {
    name: 'booking-v3 form hint asks for MM/DD/YYYY',
    what: 'Day and month swap. Only through the booking-v3 form.',
  },
  'one-day': {
    name: 'Dates move by one day',
    what: 'Same month, the day before or after. Not a swap.',
  },
  unplaced: {
    name: 'No tenant on file',
    what: 'The desk cannot tell the cause without the tenant.',
  },
};

// A report counts where the desk files it (its cause), as the desk's own table counts it. A report
// the desk read as a one-day move counts there too, as a problem of its own.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem[] {
  const filed: Problem = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'one-day'] : [filed];
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    for (const p of problemsOf(r, tenantOf(r), oneDayMove)) by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
