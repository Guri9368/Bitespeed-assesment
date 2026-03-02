import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { Contact } from '../types/contact.types';
import {
  TransactionClient,
  FindByEmailOrPhoneInput,
  CreatePrimaryContactInput,
  CreateSecondaryContactInput,
  MergePrimaryContactsInput,
  MergeResult,
} from './contact.repository.types';

const contactSelect = {
  id: true,
  email: true,
  phoneNumber: true,
  linkedId: true,
  linkPrecedence: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.ContactSelect;

const notDeleted = { deletedAt: null } satisfies Prisma.ContactWhereInput;

const db = (tx?: TransactionClient) => tx ?? prisma;

const findContactsByEmailOrPhone = async (
  input: FindByEmailOrPhoneInput,
  tx?: TransactionClient,
): Promise<Contact[]> => {
  const { email, phoneNumber } = input;
  const orConditions: Prisma.ContactWhereInput[] = [];

  if (email) orConditions.push({ email });
  if (phoneNumber) orConditions.push({ phoneNumber });
  if (orConditions.length === 0) return [];

  return db(tx).contact.findMany({
    where: { ...notDeleted, OR: orConditions },
    select: contactSelect,
    orderBy: { createdAt: 'asc' },
  });
};

const findPrimaryById = async (
  primaryId: number,
  tx?: TransactionClient,
): Promise<Contact | null> => {
  return db(tx).contact.findFirst({
    where: { id: primaryId, linkPrecedence: 'primary', ...notDeleted },
    select: contactSelect,
  });
};

const findExactContact = async (
  input: { email: string | null; phoneNumber: string | null; withinPrimaryId: number },
  tx?: TransactionClient,
): Promise<Contact | null> => {
  return db(tx).contact.findFirst({
    where: {
      email: input.email,
      phoneNumber: input.phoneNumber,
      ...notDeleted,
      OR: [
        { id: input.withinPrimaryId },
        { linkedId: input.withinPrimaryId },
      ],
    },
    select: contactSelect,
  });
};

const findContactChain = async (
  contactId: number,
  tx?: TransactionClient,
): Promise<{ primary: Contact; secondaries: Contact[] } | null> => {
  const contact = await db(tx).contact.findFirst({
    where: { id: contactId, ...notDeleted },
    select: contactSelect,
  });

  if (!contact) return null;

  const rootId = contact.linkPrecedence === 'primary' ? contact.id : contact.linkedId!;

  const cluster = await db(tx).contact.findMany({
    where: {
      ...notDeleted,
      OR: [{ id: rootId }, { linkedId: rootId }],
    },
    select: contactSelect,
    orderBy: { createdAt: 'asc' },
  });

  const primary = cluster.find((c) => c.id === rootId);
  if (!primary) return null;

  return {
    primary,
    secondaries: cluster.filter((c) => c.id !== rootId),
  };
};

const createPrimaryContact = async (
  input: CreatePrimaryContactInput,
  tx?: TransactionClient,
): Promise<Contact> => {
  return db(tx).contact.create({
    data: {
      email: input.email,
      phoneNumber: input.phoneNumber,
      linkPrecedence: 'primary',
    },
    select: contactSelect,
  });
};

const createSecondaryContact = async (
  input: CreateSecondaryContactInput,
  tx?: TransactionClient,
): Promise<Contact> => {
  return db(tx).contact.create({
    data: {
      email: input.email,
      phoneNumber: input.phoneNumber,
      linkedId: input.linkedId,
      linkPrecedence: 'secondary',
    },
    select: contactSelect,
  });
};

const mergePrimaryContacts = async (
  input: MergePrimaryContactsInput,
  tx?: TransactionClient,
): Promise<MergeResult> => {
  const { winnerId, loserId } = input;

  const demoted = await db(tx).contact.update({
    where: { id: loserId },
    data: { linkPrecedence: 'secondary', linkedId: winnerId },
    select: contactSelect,
  });

  const { count } = await updateSecondaryLinks(
    { fromPrimaryId: loserId, toPrimaryId: winnerId },
    tx,
  );

  const winner = await db(tx).contact.findUniqueOrThrow({
    where: { id: winnerId },
    select: contactSelect,
  });

  return { winner, loser: demoted, updatedSecondariesCount: count };
};

const updateSecondaryLinks = async (
  input: { fromPrimaryId: number; toPrimaryId: number },
  tx?: TransactionClient,
): Promise<Prisma.BatchPayload> => {
  return db(tx).contact.updateMany({
    where: { linkedId: input.fromPrimaryId, ...notDeleted },
    data: { linkedId: input.toPrimaryId },
  });
};

export const contactRepository = {
  findContactsByEmailOrPhone,
  findPrimaryById,
  findExactContact,
  findContactChain,
  createPrimaryContact,
  createSecondaryContact,
  mergePrimaryContacts,
  updateSecondaryLinks,
};
