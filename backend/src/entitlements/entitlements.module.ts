import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { EntitlementService } from './entitlement.service';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementsModule {}
