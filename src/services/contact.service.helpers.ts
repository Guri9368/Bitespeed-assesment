import { Contact } from '../types/contact.types';

export function resolveRootPrimaryId(contact: Contact): number {
  return contact.linkPrecedence === 'primary' ? contact.id : contact.linkedId!;
}

export function resolveDistinctPrimaryIds(contacts: Contact[]): number[] {
  const seen = new Set<number>();
  for (const c of contacts) {
    seen.add(resolveRootPrimaryId(c));
  }
  return Array.from(seen);
}

export function determineWinnerAndLoser(a: Contact, b: Contact) {
  const aTime = a.createdAt.getTime();
  const bTime = b.createdAt.getTime();
  if (aTime !== bTime) {
    return aTime < bTime ? { winner: a, loser: b } : { winner: b, loser: a };
  }
  return a.id < b.id ? { winner: a, loser: b } : { winner: b, loser: a };
}

export function isExactMatchInCluster(
  contacts: Contact[],
  email: string | null,
  phoneNumber: string | null,
): boolean {
  return contacts.some((c) => c.email === email && c.phoneNumber === phoneNumber);
}

export function deduplicateAndOrder(
  primary: Contact,
  secondaries: Contact[],
  field: 'email' | 'phoneNumber',
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const pVal = primary[field];
  if (pVal !== null) {
    seen.add(pVal);
    out.push(pVal);
  }

  for (const s of secondaries) {
    const val = s[field];
    if (val !== null && !seen.has(val)) {
      seen.add(val);
      out.push(val);
    }
  }

  return out;
}
