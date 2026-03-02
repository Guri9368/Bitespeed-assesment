import { Prisma } from '@prisma/client';
import { Contact } from '../types/contact.types';

export type TransactionClient = Prisma.TransactionClient;

export interface CreatePrimaryContactInput {
  email: string | null;
  phoneNumber: string | null;
}

export interface CreateSecondaryContactInput {
  email: string | null;
  phoneNumber: string | null;
  linkedId: number;
}

export interface MergePrimaryContactsInput {
  winnerId: number;
  loserId: number;
}

export interface MergeResult {
  winner: Contact;
  loser: Contact;
  updatedSecondariesCount: number;
}

export interface FindByEmailOrPhoneInput {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface FindExactContactInput {
  email: string | null;
  phoneNumber: string | null;
  withinPrimaryId: number;
}
