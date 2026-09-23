import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { User } from './entities/user.entity';

type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      where: { organizationId: TenantContext.getOrganizationId() },
      order: { firstName: 'ASC' },
    });
    return users.map((user) => this.sanitize(user));
  }

  async findOneInCurrentOrg(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  findByEmailInOrganization(
    organizationId: string,
    email: string,
  ): Promise<User | null> {
    return this.usersRepository.findOne({ where: { organizationId, email } });
  }

  /**
   * Used only at login time, before a tenant is known. Email is unique
   * per organization, not globally, so this can return multiple matches
   * across tenants (e.g. same person working with two companies).
   */
  findAllByEmail(email: string): Promise<User[]> {
    return this.usersRepository.find({ where: { email } });
  }

  findById(organizationId: string, id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { organizationId, id } });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async setRefreshTokenHash(
    id: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.usersRepository.update({ id }, { refreshTokenHash });
  }

  private sanitize(user: User): SafeUser {
    const { passwordHash, refreshTokenHash, ...rest } = user;
    return rest;
  }
}
