import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKey } from './entities/api-key.entity';

export interface ApiKeyPrincipal {
  id: string;
  organizationId: string;
  scopes: string[];
}

const KEY_PREFIX_BYTES = 4;
const KEY_SECRET_BYTES = 24;

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}

  async create(
    dto: CreateApiKeyDto,
    createdByUserId: string,
  ): Promise<{
    apiKey: Omit<ApiKey, 'hashedSecret'>;
    plaintextKey: string;
  }> {
    const organizationId = TenantContext.getOrganizationId();
    const prefix = randomBytes(KEY_PREFIX_BYTES).toString('hex');
    const secret = randomBytes(KEY_SECRET_BYTES).toString('hex');
    const plaintextKey = `sk_${prefix}_${secret}`;

    const apiKey = await this.apiKeysRepository.save(
      this.apiKeysRepository.create({
        organizationId,
        name: dto.name,
        prefix,
        hashedSecret: this.hashSecret(secret),
        scopes: dto.scopes?.length ? dto.scopes : ['*'],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdByUserId,
      }),
    );

    return { apiKey: this.sanitize(apiKey), plaintextKey };
  }

  async findAll(): Promise<Omit<ApiKey, 'hashedSecret'>[]> {
    const apiKeys = await this.apiKeysRepository.find({
      where: { organizationId: TenantContext.getOrganizationId() },
      order: { createdAt: 'DESC' },
    });
    return apiKeys.map((key) => this.sanitize(key));
  }

  async revoke(id: string): Promise<void> {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }
    apiKey.isActive = false;
    await this.apiKeysRepository.save(apiKey);
  }

  /**
   * Called on every request carrying an X-API-Key header. Runs outside
   * TenantContext (that's what this establishes), so it looks up by the
   * globally-unique prefix rather than an organization-scoped query.
   */
  async validate(plaintextKey: string): Promise<ApiKeyPrincipal | null> {
    const match = /^sk_([0-9a-f]+)_([0-9a-f]+)$/.exec(plaintextKey);
    if (!match) {
      return null;
    }
    const [, prefix, secret] = match;

    const apiKey = await this.apiKeysRepository.findOne({ where: { prefix } });
    if (!apiKey || !apiKey.isActive) {
      return null;
    }
    if (apiKey.expiresAt && apiKey.expiresAt.getTime() < Date.now()) {
      return null;
    }
    if (!this.secretMatches(secret, apiKey.hashedSecret)) {
      return null;
    }

    this.apiKeysRepository.update(apiKey.id, { lastUsedAt: new Date() }).catch(
      () => undefined,
    );

    return {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      scopes: apiKey.scopes,
    };
  }

  private sanitize(apiKey: ApiKey): Omit<ApiKey, 'hashedSecret'> {
    const { hashedSecret, ...rest } = apiKey;
    return rest;
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  private secretMatches(secret: string, hashedSecret: string): boolean {
    const candidate = Buffer.from(this.hashSecret(secret), 'hex');
    const expected = Buffer.from(hashedSecret, 'hex');
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  }
}
