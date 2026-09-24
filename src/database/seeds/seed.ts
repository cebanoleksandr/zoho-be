import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import dataSource from '../../data-source';
import { Account } from '../../accounts/entities/account.entity';
import { ActivityStatus } from '../../activities/entities/activity-status.enum';
import { ActivityType } from '../../activities/entities/activity-type.enum';
import { Activity } from '../../activities/entities/activity.entity';
import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { CrmEntityType } from '../../common/enums/crm-entity-type.enum';
import { Contact } from '../../contacts/entities/contact.entity';
import { CustomFieldType } from '../../custom-fields/entities/custom-field-type.enum';
import { CustomFieldDefinition } from '../../custom-fields/entities/custom-field-definition.entity';
import { CustomFieldValue } from '../../custom-fields/entities/custom-field-value.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { LeadSource } from '../../leads/entities/lead-source.enum';
import { LeadStatus } from '../../leads/entities/lead-status.enum';
import { Lead } from '../../leads/entities/lead.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { PipelineStage } from '../../pipelines/entities/pipeline-stage.entity';
import { Pipeline } from '../../pipelines/entities/pipeline.entity';
import { UserRole } from '../../users/entities/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { WebhookDelivery } from '../../webhooks/entities/webhook-delivery.entity';
import { WebhookEvent } from '../../webhooks/entities/webhook-event.enum';
import { Webhook } from '../../webhooks/entities/webhook.entity';

const ORG_SLUG = 'acme-corp';
const DEMO_PASSWORD = 'Password123!';

/** Tenant-scoped entities, children first, so --fresh can wipe the demo org cleanly. */
const TENANT_ENTITIES = [
  WebhookDelivery,
  Webhook,
  ApiKey,
  CustomFieldValue,
  CustomFieldDefinition,
  Activity,
  Lead,
  Deal,
  Contact,
  Account,
  PipelineStage,
  Pipeline,
];

const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const pick = <T>(items: T[], index: number): T => items[index % items.length];

async function wipeOrganization(manager: EntityManager, orgId: string) {
  for (const entity of TENANT_ENTITIES) {
    await manager.delete(entity, { organizationId: orgId });
  }
  await manager.delete(User, { organizationId: orgId });
  await manager.delete(Organization, { id: orgId });
}

async function seed(manager: EntityManager) {
  const organization = await manager.save(
    manager.create(Organization, { name: 'Acme Corp', slug: ORG_SLUG }),
  );
  const organizationId = organization.id;

  // Users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = await manager.save(
    [
      { email: 'admin@acme.test', firstName: 'Alice', lastName: 'Admin', role: UserRole.ADMIN },
      { email: 'manager@acme.test', firstName: 'Mark', lastName: 'Manager', role: UserRole.MANAGER },
      { email: 'sales1@acme.test', firstName: 'Sofia', lastName: 'Seller', role: UserRole.SALES },
      { email: 'sales2@acme.test', firstName: 'Sam', lastName: 'Closer', role: UserRole.SALES },
    ].map((u) => manager.create(User, { ...u, organizationId, passwordHash })),
  );
  const salesOwners = users.slice(1);

  // Pipeline (same stages as PipelinesService.createDefaultPipeline)
  const pipeline = await manager.save(
    manager.create(Pipeline, { organizationId, name: 'Sales Pipeline', isDefault: true }),
  );
  const stages = await manager.save(
    [
      { name: 'Qualification', orderIndex: 1, probability: 10 },
      { name: 'Needs Analysis', orderIndex: 2, probability: 30 },
      { name: 'Proposal', orderIndex: 3, probability: 50 },
      { name: 'Negotiation', orderIndex: 4, probability: 75 },
      { name: 'Closed Won', orderIndex: 5, probability: 100, isWon: true },
      { name: 'Closed Lost', orderIndex: 6, probability: 0, isLost: true },
    ].map((s) =>
      manager.create(PipelineStage, { ...s, organizationId, pipelineId: pipeline.id }),
    ),
  );

  // Accounts
  const accountSeeds = [
    { name: 'Globex Corporation', industry: 'Manufacturing', website: 'https://globex.example.com', city: 'Springfield' },
    { name: 'Initech', industry: 'Software', website: 'https://initech.example.com', city: 'Austin' },
    { name: 'Umbrella Health', industry: 'Healthcare', website: 'https://umbrella.example.com', city: 'Boston' },
    { name: 'Stark Industries', industry: 'Energy', website: 'https://stark.example.com', city: 'New York' },
    { name: 'Wayne Logistics', industry: 'Logistics', website: 'https://wayne.example.com', city: 'Chicago' },
    { name: 'Hooli', industry: 'Software', website: 'https://hooli.example.com', city: 'Palo Alto' },
    { name: 'Soylent Foods', industry: 'Food & Beverage', website: 'https://soylent.example.com', city: 'Denver' },
    { name: 'Cyberdyne Systems', industry: 'Robotics', website: 'https://cyberdyne.example.com', city: 'Seattle' },
  ];
  const accounts = await manager.save(
    accountSeeds.map((a, i) =>
      manager.create(Account, {
        organizationId,
        name: a.name,
        industry: a.industry,
        website: a.website,
        phone: `+1-555-01${String(i).padStart(2, '0')}`,
        billingAddress: `${100 + i * 7} Main St, ${a.city}, USA`,
        ownerId: pick(salesOwners, i).id,
        description: `${a.industry} company based in ${a.city}.`,
      }),
    ),
  );

  // Contacts: two per account
  const firstNames = ['John', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Mia', 'Lucas', 'Isla', 'Mason', 'Zoe', 'Logan', 'Chloe', 'Jacob', 'Lily'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright'];
  const titles = ['CEO', 'CTO', 'Head of Procurement', 'VP Sales', 'Operations Manager', 'CFO'];
  const contacts = await manager.save(
    firstNames.map((firstName, i) => {
      const account = accounts[Math.floor(i / 2)];
      const lastName = lastNames[i];
      const domain = new URL(account.website!).hostname;
      return manager.create(Contact, {
        organizationId,
        firstName,
        lastName,
        email: `${firstName}.${lastName}@${domain}`.toLowerCase(),
        phone: `+1-555-02${String(i).padStart(2, '0')}`,
        title: pick(titles, i),
        accountId: account.id,
        ownerId: account.ownerId,
        notes: i % 3 === 0 ? 'Key decision maker.' : null,
      });
    }),
  );

  // Deals: spread across stages
  const dealNames = ['Annual license', 'Platform migration', 'Support renewal', 'Pilot project', 'Enterprise upgrade', 'Consulting package'];
  const deals = await manager.save(
    Array.from({ length: 14 }, (_, i) => {
      const account = accounts[i % accounts.length];
      const contact = contacts[(i % accounts.length) * 2];
      const stage = stages[i % stages.length];
      const closed = stage.isWon || stage.isLost;
      return manager.create(Deal, {
        organizationId,
        name: `${account.name} — ${pick(dealNames, i)}`,
        amount: 5000 + ((i * 7919) % 95000),
        currency: i % 4 === 3 ? 'EUR' : 'USD',
        accountId: account.id,
        contactId: contact.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        ownerId: account.ownerId,
        expectedCloseDate: daysFromNow(closed ? -10 - i : 7 + i * 5)
          .toISOString()
          .slice(0, 10),
        closedAt: closed ? daysFromNow(-5 - i) : null,
        description: `Opportunity for ${pick(dealNames, i).toLowerCase()}.`,
      });
    }),
  );

  // Leads
  const leadSeeds = [
    ['Oliver', 'Bennett', 'Vandelay Industries', 'Import Manager'],
    ['Grace', 'Holloway', 'Pied Piper', 'CEO'],
    ['Henry', 'Fischer', 'Dunder Mifflin', 'Regional Manager'],
    ['Ella', 'Novak', 'Massive Dynamic', 'Research Lead'],
    ['Jack', 'Reyes', 'Oscorp', 'Procurement'],
    ['Ruby', 'Tanaka', 'Tyrell Corp', 'CTO'],
    ['Leo', 'Morozov', 'Aperture Labs', 'Head of IT'],
    ['Nora', 'Schmidt', 'Black Mesa', 'Director'],
    ['Max', 'Kowalski', 'Nakatomi Trading', 'CFO'],
    ['Ivy', 'Dubois', 'Gringotts Finance', 'COO'],
    ['Theo', 'Almeida', 'Monsters Inc', 'Ops Lead'],
    ['Maya', 'Lindqvist', 'Wonka Sweets', 'Buyer'],
  ];
  const leadStatuses = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.NEW, LeadStatus.DISQUALIFIED, LeadStatus.CONTACTED];
  const leads = await manager.save(
    leadSeeds.map(([firstName, lastName, company, title], i) =>
      manager.create(Lead, {
        organizationId,
        firstName,
        lastName,
        company,
        title,
        email: `${firstName}.${lastName}@example.org`.toLowerCase(),
        phone: `+1-555-03${String(i).padStart(2, '0')}`,
        source: pick(Object.values(LeadSource), i),
        status: pick(leadStatuses, i),
        ownerId: pick(salesOwners, i).id,
        notes: i % 4 === 0 ? 'Met at a trade show.' : null,
      }),
    ),
  );

  // One converted lead pointing at real records
  await manager.save(
    manager.create(Lead, {
      organizationId,
      firstName: contacts[0].firstName,
      lastName: contacts[0].lastName,
      company: accounts[0].name,
      email: contacts[0].email,
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONVERTED,
      ownerId: accounts[0].ownerId,
      convertedAt: daysFromNow(-30),
      convertedAccountId: accounts[0].id,
      convertedContactId: contacts[0].id,
      convertedDealId: deals[0].id,
    }),
  );

  // Activities across leads, contacts, accounts and deals
  const targets: Array<{ entityType: CrmEntityType; entityId: string; ownerId: string | null; label: string }> = [
    ...leads.slice(0, 5).map((l) => ({ entityType: CrmEntityType.LEAD, entityId: l.id, ownerId: l.ownerId, label: `${l.firstName} ${l.lastName}` })),
    ...contacts.slice(0, 5).map((c) => ({ entityType: CrmEntityType.CONTACT, entityId: c.id, ownerId: c.ownerId, label: `${c.firstName} ${c.lastName}` })),
    ...accounts.slice(0, 4).map((a) => ({ entityType: CrmEntityType.ACCOUNT, entityId: a.id, ownerId: a.ownerId, label: a.name })),
    ...deals.slice(0, 6).map((d) => ({ entityType: CrmEntityType.DEAL, entityId: d.id, ownerId: d.ownerId, label: d.name })),
  ];
  const subjects: Record<ActivityType, string> = {
    [ActivityType.CALL]: 'Intro call with',
    [ActivityType.MEETING]: 'Demo meeting with',
    [ActivityType.TASK]: 'Prepare proposal for',
    [ActivityType.NOTE]: 'Notes on',
    [ActivityType.EMAIL]: 'Follow-up email to',
  };
  await manager.save(
    targets.map((t, i) => {
      const type = pick(Object.values(ActivityType), i);
      const status = pick([ActivityStatus.PENDING, ActivityStatus.COMPLETED, ActivityStatus.PENDING, ActivityStatus.CANCELLED], i);
      return manager.create(Activity, {
        organizationId,
        ...t,
        type,
        subject: `${subjects[type]} ${t.label}`,
        description: i % 2 === 0 ? 'Discuss requirements and timeline.' : null,
        status,
        dueDate: daysFromNow(status === ActivityStatus.PENDING ? i + 1 : -i - 1),
        completedAt: status === ActivityStatus.COMPLETED ? daysFromNow(-i) : null,
      });
    }),
  );

  // Custom fields
  const [segmentField, employeesField, renewalField] = await manager.save([
    manager.create(CustomFieldDefinition, {
      organizationId,
      entityType: CrmEntityType.ACCOUNT,
      fieldKey: 'segment',
      label: 'Segment',
      fieldType: CustomFieldType.SELECT,
      options: ['SMB', 'Mid-Market', 'Enterprise'],
    }),
    manager.create(CustomFieldDefinition, {
      organizationId,
      entityType: CrmEntityType.ACCOUNT,
      fieldKey: 'employees',
      label: 'Employees',
      fieldType: CustomFieldType.NUMBER,
    }),
    manager.create(CustomFieldDefinition, {
      organizationId,
      entityType: CrmEntityType.DEAL,
      fieldKey: 'is_renewal',
      label: 'Renewal',
      fieldType: CustomFieldType.BOOLEAN,
    }),
  ]);
  await manager.save([
    ...accounts.flatMap((a, i) => [
      manager.create(CustomFieldValue, { organizationId, fieldDefinitionId: segmentField.id, entityType: CrmEntityType.ACCOUNT, entityId: a.id, value: pick(segmentField.options!, i) }),
      manager.create(CustomFieldValue, { organizationId, fieldDefinitionId: employeesField.id, entityType: CrmEntityType.ACCOUNT, entityId: a.id, value: 50 + i * 230 }),
    ]),
    ...deals.map((d, i) =>
      manager.create(CustomFieldValue, { organizationId, fieldDefinitionId: renewalField.id, entityType: CrmEntityType.DEAL, entityId: d.id, value: i % 3 === 2 }),
    ),
  ]);

  // Webhook with a couple of past deliveries
  const webhook = await manager.save(
    manager.create(Webhook, {
      organizationId,
      url: 'https://webhook.site/acme-demo',
      secret: randomBytes(24).toString('hex'),
      events: [WebhookEvent.LEAD_CREATED, WebhookEvent.DEAL_CREATED, WebhookEvent.DEAL_STAGE_CHANGED],
      description: 'Demo webhook',
    }),
  );
  await manager.save([
    manager.create(WebhookDelivery, { organizationId, webhookId: webhook.id, event: WebhookEvent.LEAD_CREATED, payload: { id: leads[0].id }, statusCode: 200, success: true }),
    manager.create(WebhookDelivery, { organizationId, webhookId: webhook.id, event: WebhookEvent.DEAL_CREATED, payload: { id: deals[0].id }, statusCode: 500, success: false, error: 'Internal Server Error' }),
  ]);

  // API key (same format as ApiKeysService: sk_<prefix>_<secret>)
  const prefix = randomBytes(6).toString('hex');
  const secret = randomBytes(24).toString('hex');
  await manager.save(
    manager.create(ApiKey, {
      organizationId,
      name: 'Demo integration',
      prefix,
      hashedSecret: createHash('sha256').update(secret).digest('hex'),
      createdByUserId: users[0].id,
    }),
  );

  return { users, apiKey: `sk_${prefix}_${secret}` };
}

async function main() {
  const fresh = process.argv.includes('--fresh');
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Organization, { where: { slug: ORG_SLUG } });
      if (existing) {
        if (!fresh) {
          console.log(`Organization "${ORG_SLUG}" already exists. Re-run with --fresh to recreate it.`);
          return;
        }
        await wipeOrganization(manager, existing.id);
      }

      const { users, apiKey } = await seed(manager);
      console.log('Seed complete. Log in with any of these (password: %s):', DEMO_PASSWORD);
      users.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}`));
      console.log(`API key (shown once): ${apiKey}`);
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
