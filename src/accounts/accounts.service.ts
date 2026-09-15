import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  create(dto: CreateAccountDto): Promise<Account> {
    const account = this.accountsRepository.create({
      ...dto,
      organizationId: TenantContext.getOrganizationId(),
    });
    return this.accountsRepository.save(account);
  }

  async findAll(
    query: QueryAccountsDto,
  ): Promise<{ data: Account[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.accountsRepository.findAndCount({
      where: {
        organizationId: TenantContext.getOrganizationId(),
        ...(query.search ? { name: ILike(`%${query.search}%`) } : {}),
        ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);
    Object.assign(account, dto);
    return this.accountsRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    await this.accountsRepository.remove(account);
  }
}
