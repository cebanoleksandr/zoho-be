import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { CrmEntityType } from '../enums/crm-entity-type.enum';

/**
 * Central place to validate a polymorphic (entityType, entityId) pair
 * against the real tables — used by Activities, Custom Fields and
 * Webhooks so each doesn't duplicate the same four-way switch.
 */
@Injectable()
export class CrmEntityLookupService {
  constructor(
    @InjectRepository(Lead) private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Deal) private readonly dealsRepository: Repository<Deal>,
  ) {}

  async exists(
    entityType: CrmEntityType,
    organizationId: string,
    entityId: string,
  ): Promise<boolean> {
    return this.repositoryFor(entityType).exists({
      where: { id: entityId, organizationId },
    });
  }

  async assertExists(
    entityType: CrmEntityType,
    organizationId: string,
    entityId: string,
  ): Promise<void> {
    const found = await this.exists(entityType, organizationId, entityId);
    if (!found) {
      throw new NotFoundException(
        `${entityType} with id ${entityId} not found`,
      );
    }
  }

  private repositoryFor(
    entityType: CrmEntityType,
  ):
    | Repository<Lead>
    | Repository<Contact>
    | Repository<Account>
    | Repository<Deal> {
    switch (entityType) {
      case CrmEntityType.LEAD:
        return this.leadsRepository;
      case CrmEntityType.CONTACT:
        return this.contactsRepository;
      case CrmEntityType.ACCOUNT:
        return this.accountsRepository;
      case CrmEntityType.DEAL:
        return this.dealsRepository;
    }
  }
}
