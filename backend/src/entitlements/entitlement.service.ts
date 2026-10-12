import { Injectable } from '@nestjs/common';
import {
  EntitlementFeature,
  EntitlementStatus,
  type Entitlement,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isEntitlementStatusAllowed,
  type EntitlementView,
} from './entitlement.types';

/**
 * Recall is free — no billing provider. Entitlement checks always allow when
 * RECALL_ENABLED is on.
 */
@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async isAllowed(
    userId: string,
    feature: EntitlementFeature = EntitlementFeature.RECALL,
  ): Promise<boolean> {
    void userId;
    void feature;
    const view = await this.getEntitlement(userId, feature);
    return view.allowed;
  }

  async getEntitlement(
    userId: string,
    feature: EntitlementFeature = EntitlementFeature.RECALL,
  ): Promise<EntitlementView> {
    void userId;
    void feature;
    if (!isRecallFeatureEnabled()) {
      return denied('disabled');
    }
    return {
      feature: 'RECALL',
      status: EntitlementStatus.active,
      allowed: true,
      isPro: true,
      validUntil: null,
      source: 'open',
      store: null,
    };
  }

  /** Test/admin helper — upserts a DB entitlement row (optional bookkeeping). */
  async upsertForUser(params: {
    userId: string;
    feature?: EntitlementFeature;
    status: EntitlementStatus;
    validUntil?: Date | null;
    source?: string;
  }): Promise<Entitlement> {
    const feature = params.feature ?? EntitlementFeature.RECALL;
    const validUntil = params.validUntil ?? null;
    const isPro = isEntitlementStatusAllowed(params.status, validUntil);
    return this.prisma.entitlement.upsert({
      where: { userId_feature: { userId: params.userId, feature } },
      create: {
        userId: params.userId,
        feature,
        status: params.status,
        validUntil,
        isPro,
        source: params.source ?? 'admin',
        lastEventAt: new Date(),
      },
      update: {
        status: params.status,
        validUntil,
        isPro,
        source: params.source ?? 'admin',
        lastEventAt: new Date(),
      },
    });
  }
}

function denied(source: string): EntitlementView {
  return {
    feature: 'RECALL',
    status: EntitlementStatus.inactive,
    allowed: false,
    isPro: false,
    validUntil: null,
    source,
    store: null,
  };
}

export function isRecallFeatureEnabled(): boolean {
  const raw = (process.env.RECALL_ENABLED ?? 'true').trim().toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'no';
}
