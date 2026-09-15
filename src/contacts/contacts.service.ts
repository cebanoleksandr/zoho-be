import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async create(dto: CreateContactDto): Promise<Contact> {
    const organizationId = TenantContext.getOrganizationId();
    if (dto.accountId) {
      await this.assertAccountInTenant(organizationId, dto.accountId);
    }

    const contact = this.contactsRepository.create({
      ...dto,
      organizationId,
    });
    return this.contactsRepository.save(contact);
  }

  async findAll(
    query: QueryContactsDto,
  ): Promise<{ data: Contact[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.contactsRepository.findAndCount({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
        ...(query.search ? { lastName: ILike(`%${query.search}%`) } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async update(id: string, dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);
    if (dto.accountId) {
      await this.assertAccountInTenant(contact.organizationId, dto.accountId);
    }
    Object.assign(contact, dto);
    return this.contactsRepository.save(contact);
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactsRepository.remove(contact);
  }

  private async assertAccountInTenant(
    organizationId: string,
    accountId: string,
  ): Promise<void> {
    const exists = await this.accountsRepository.exists({
      where: { id: accountId, organizationId },
    });
    if (!exists) {
      throw new BadRequestException('Account not found');
    }
  }
}
