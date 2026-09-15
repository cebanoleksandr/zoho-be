import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { ContactsModule } from '../contacts/contacts.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { Deal } from './entities/deal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal]),
    AccountsModule,
    ContactsModule,
    PipelinesModule,
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [TypeOrmModule],
})
export class DealsModule {}
