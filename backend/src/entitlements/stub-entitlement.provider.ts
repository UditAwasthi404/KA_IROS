import type {
  EntitlementFeature,
  EntitlementProvider,
} from './entitlement.types';
import { EntitlementStatus } from './entitlement.types';

/**
 * Development provider. Does not talk to a billing backend.
 * Entitlement rows + RECALL_STUB_* env vars are the source of truth.
 */
export class StubEntitlementProvider implements EntitlementProvider {
  readonly name = 'stub';

  resolveRemote(
    _userId: string,
    _feature: EntitlementFeature,
  ): Promise<{
    status: EntitlementStatus;
    validUntil: Date | null;
    source: string;
  } | null> {
    void _userId;
    void _feature;
    return Promise.resolve(null);
  }
}

export function readStubGrantAll(): boolean {
  const raw = (process.env.RECALL_STUB_GRANT_ALL ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

/**
 * Temporary open access for demos / Tech Expo.
 * Allowed in production (unlike RECALL_STUB_GRANT_ALL). Turn off after the event.
 */
export function readRecallOpenAccess(): boolean {
  const raw = (process.env.RECALL_OPEN_ACCESS ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function readStubDefaultStatus(): EntitlementStatus | null {
  const raw = (process.env.RECALL_STUB_DEFAULT_STATUS ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return null;
  const allowed = Object.values(EntitlementStatus) as string[];
  if (!allowed.includes(raw)) return null;
  return raw as EntitlementStatus;
}
