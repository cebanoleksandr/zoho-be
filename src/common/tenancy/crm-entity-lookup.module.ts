import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { CrmEntityLookupService } from './crm-entity-lookup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Contact, Account, Deal])],
  providers: [CrmEntityLookupService],
  exports: [CrmEntityLookupService],
})
export class CrmEntityLookupModule {}
