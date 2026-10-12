import { EntitlementFeature, EntitlementStatus } from '@prisma/client';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  let prisma: {
    entitlement: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let service: EntitlementService;

  beforeEach(() => {
    process.env.RECALL_ENABLED = 'true';
    prisma = {
      entitlement: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    };
    service = new EntitlementService(prisma as never);
  });

  it('allows Recall for every user when enabled', async () => {
    const view = await service.getEntitlement(
      'user_1',
      EntitlementFeature.RECALL,
    );
    expect(view.allowed).toBe(true);
    expect(view.isPro).toBe(true);
    expect(view.source).toBe('open');
    expect(view.status).toBe(EntitlementStatus.active);
  });

  it('denies when feature disabled', async () => {
    process.env.RECALL_ENABLED = 'false';
    const view = await service.getEntitlement('user_1');
    expect(view.allowed).toBe(false);
    expect(view.source).toBe('disabled');
  });
});
