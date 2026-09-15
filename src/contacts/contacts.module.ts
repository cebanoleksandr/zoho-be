import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { Contact } from './entities/contact.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), AccountsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [TypeOrmModule],
})
export class ContactsModule {}
