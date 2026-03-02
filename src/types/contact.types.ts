import { Contact, LinkPrecedence } from '@prisma/client';

export type { Contact, LinkPrecedence };

export interface IdentifyRequestDto {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface ContactResponseDto {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export interface ResolvedCluster {
  primary: Contact;
  secondaries: Contact[];
}
