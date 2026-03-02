import { prisma } from '../config/database';
import { env } from '../config/env';
import { createServiceLogger, redactSensitive } from '../utils/logger';
import { badRequest } from '../middlewares/errorHandler';
import { ContactResponseDto, IdentifyRequestDto, Contact } from '../types/contact.types';
import { contactRepository } from '../repositories/contact.repository';
import { TransactionClient } from '../repositories/contact.repository.types';
import { resolveDistinctPrimaryIds } from './contact.service.helpers';
import { buildResponseFromContacts } from './contact.service.response';

const log = createServiceLogger('contact-service');

function normaliseInput(input: IdentifyRequestDto) {
  const email = input.email?.trim() || null;
  const phoneNumber = input.phoneNumber?.trim() || null;

  if (!email && !phoneNumber) {
    throw badRequest('At least one of email or phoneNumber must be provided');
  }

  return { email, phoneNumber };
}

async function handleNoMatch(input: {
  email: string | null;
  phoneNumber: string | null;
}): Promise<ContactResponseDto> {
  log.info('no existing contact, creating primary', {
    email: redactSensitive(input.email),
  });

  const primary = await contactRepository.createPrimaryContact({
    email: input.email,
    phoneNumber: input.phoneNumber,
  });

  return buildResponseFromContacts(primary, []);
}

async function handleSingleCluster(input: {
  primaryId: number;
  email: string | null;
  phoneNumber: string | null;
}): Promise<ContactResponseDto> {
  const { primaryId, email, phoneNumber } = input;

  const chain = await contactRepository.findContactChain(primaryId);

  if (!chain) {
    log.warn('cluster gone, falling back to new primary', { primaryId });
    return handleNoMatch({ email, phoneNumber });
  }

  const existing = await contactRepository.findExactContact({
    email,
    phoneNumber,
    withinPrimaryId: chain.primary.id,
  });

  if (existing) {
    return buildResponseFromContacts(chain.primary, chain.secondaries);
  }

  log.info('new info in existing cluster, adding secondary', {
    primaryId,
    email: redactSensitive(email),
  });

  const secondary = await contactRepository.createSecondaryContact({
    email,
    phoneNumber,
    linkedId: chain.primary.id,
  });

  return buildResponseFromContacts(chain.primary, [...chain.secondaries, secondary]);
}

async function handleMultipleCluster(input: {
  distinctPrimaryIds: number[];
  matchedContacts: Contact[];
  email: string | null;
  phoneNumber: string | null;
}): Promise<ContactResponseDto> {
  const { distinctPrimaryIds, matchedContacts, email, phoneNumber } = input;

  const primaries = matchedContacts.filter(
    (c) => c.linkPrecedence === 'primary' && distinctPrimaryIds.includes(c.id),
  );

  const foundIds = new Set(primaries.map((p) => p.id));
  const missing = distinctPrimaryIds.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map((id) => contactRepository.findPrimaryById(id)),
    );
    for (const p of fetched) {
      if (p) primaries.push(p);
    }
  }

  primaries.sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    return diff !== 0 ? diff : a.id - b.id;
  });

  const winner = primaries[0];
  const losers = primaries.slice(1);

  log.info('merging clusters', {
    winnerId: winner.id,
    loserIds: losers.map((l) => l.id),
  });

  await prisma.$transaction(
    async (tx: TransactionClient) => {
      for (const loser of losers) {
        await contactRepository.mergePrimaryContacts(
          { winnerId: winner.id, loserId: loser.id },
          tx,
        );
      }

      const alreadyExists = await contactRepository.findExactContact(
        { email, phoneNumber, withinPrimaryId: winner.id },
        tx,
      );

      if (!alreadyExists) {
        await contactRepository.createSecondaryContact(
          { email, phoneNumber, linkedId: winner.id },
          tx,
        );
      }
    },
    { timeout: env.DB_TRANSACTION_TIMEOUT },
  );

  const finalChain = await contactRepository.findContactChain(winner.id);

  if (!finalChain) {
    throw new Error(`Cluster for primary ${winner.id} missing after merge`);
  }

  return buildResponseFromContacts(finalChain.primary, finalChain.secondaries);
}

const identify = async (input: IdentifyRequestDto): Promise<ContactResponseDto> => {
  const { email, phoneNumber } = normaliseInput(input);

  const matches = await contactRepository.findContactsByEmailOrPhone({ email, phoneNumber });
  const primaryIds = resolveDistinctPrimaryIds(matches);

  if (primaryIds.length === 0) return handleNoMatch({ email, phoneNumber });
  if (primaryIds.length === 1) return handleSingleCluster({ primaryId: primaryIds[0], email, phoneNumber });

  return handleMultipleCluster({
    distinctPrimaryIds: primaryIds,
    matchedContacts: matches,
    email,
    phoneNumber,
  });
};

export const contactService = { identify };
