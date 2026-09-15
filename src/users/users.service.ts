import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
}
