import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhookEvent } from './entities/webhook-event.enum';
import { Webhook } from './entities/webhook.entity';

const DELIVERY_TIMEOUT_MS = 5000;

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhooksRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveriesRepository: Repository<WebhookDelivery>,
  ) {}

  create(dto: CreateWebhookDto): Promise<Webhook> {
    const webhook = this.webhooksRepository.create({
      ...dto,
      organizationId: TenantContext.getOrganizationId(),
      secret: randomBytes(32).toString('hex'),
      isActive: true,
    });
    return this.webhooksRepository.save(webhook);
  }

  findAll(): Promise<Webhook[]> {
    return this.webhooksRepository.find({
      where: { organizationId: TenantContext.getOrganizationId() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.webhooksRepository.findOne({
      where: { id, organizationId: TenantContext.getOrganizationId() },
    });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.findOne(id);
    Object.assign(webhook, dto);
    return this.webhooksRepository.save(webhook);
  }

  async remove(id: string): Promise<void> {
    const webhook = await this.findOne(id);
    await this.webhooksRepository.remove(webhook);
  }

  async findDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    await this.findOne(webhookId);
    return this.deliveriesRepository.find({
      where: {
        webhookId,
        organizationId: TenantContext.getOrganizationId(),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Fire-and-forget event dispatch: looks up active subscribers for this
   * org+event and POSTs the payload, signing it so receivers can verify
   * authenticity. Failures are logged and recorded, never thrown, so a
   * webhook outage can't break the request that triggered it.
   */
  async dispatch(
    organizationId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const subscribers = await this.webhooksRepository
      .createQueryBuilder('webhook')
      .where('webhook.organization_id = :organizationId', { organizationId })
      .andWhere('webhook.is_active = true')
      .andWhere(':event = ANY(webhook.events)', { event })
      .getMany();

    await Promise.allSettled(
      subscribers.map((webhook) =>
        this.deliverOne(organizationId, webhook, event, payload),
      ),
    );
  }

  private async deliverOne(
    organizationId: string,
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify({ event, data: payload });
    const signature = createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    let statusCode: number | null = null;
    let success = false;
    let error: string | null = null;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      statusCode = response.status;
      success = response.ok;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown delivery error';
      this.logger.warn(
        `Webhook delivery failed for ${webhook.id} (${event}): ${error}`,
      );
    }

    await this.deliveriesRepository.save(
      this.deliveriesRepository.create({
        organizationId,
        webhookId: webhook.id,
        event,
        payload,
        statusCode,
        success,
        error,
      }),
    );
  }
}
