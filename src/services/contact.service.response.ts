import { Contact, ContactResponseDto, ResolvedCluster } from '../types/contact.types';
import { deduplicateAndOrder } from './contact.service.helpers';

export function buildContactResponse(cluster: ResolvedCluster): ContactResponseDto {
  const { primary, secondaries } = cluster;
  return {
    contact: {
      primaryContactId: primary.id,
      emails: deduplicateAndOrder(primary, secondaries, 'email'),
      phoneNumbers: deduplicateAndOrder(primary, secondaries, 'phoneNumber'),
      secondaryContactIds: secondaries.map((s) => s.id).sort((a, b) => a - b),
    },
  };
}

export function buildResponseFromContacts(
  primary: Contact,
  secondaries: Contact[],
): ContactResponseDto {
  return buildContactResponse({ primary, secondaries });
}
