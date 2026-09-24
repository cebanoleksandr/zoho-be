import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790238669754 implements MigrationInterface {
  name = 'InitialSchema1790238669754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."webhooks_events_enum" AS ENUM('lead.created', 'lead.converted', 'contact.created', 'account.created', 'deal.created', 'deal.stage_changed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhooks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "url" character varying NOT NULL, "secret" character varying NOT NULL, "events" "public"."webhooks_events_enum" array NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "description" character varying, CONSTRAINT "PK_9e8795cfc899ab7bdaa831e8527" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1263da9f2a66fe09006bd86130" ON "webhooks" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pipeline_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "pipeline_id" uuid NOT NULL, "name" character varying NOT NULL, "order_index" integer NOT NULL, "probability" integer NOT NULL DEFAULT '0', "is_won" boolean NOT NULL DEFAULT false, "is_lost" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_92e43270eace072ad5182fc08e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d5f096cb55cb0607d1b004343" ON "pipeline_stages" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37b689c446ebe79ecd37e44573" ON "pipeline_stages" ("pipeline_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pipelines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e38ea171cdfad107c1f3db2c036" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7561aa4c56343cfac190f868e5" ON "pipelines" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'manager', 'sales')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'sales', "refresh_token_hash" character varying, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_04402eb4cf7be16f6cc5e5f078" ON "users" ("organization_id", "email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_deliveries_event_enum" AS ENUM('lead.created', 'lead.converted', 'contact.created', 'account.created', 'deal.created', 'deal.stage_changed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "webhook_id" uuid NOT NULL, "event" "public"."webhook_deliveries_event_enum" NOT NULL, "payload" jsonb NOT NULL, "status_code" integer, "success" boolean NOT NULL DEFAULT false, "error" text, CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9942da65d9e85fbd78e1a9bfc" ON "webhook_deliveries" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0286aeb96db651efd1ae2966f" ON "webhook_deliveries" ("webhook_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."leads_source_enum" AS ENUM('website', 'referral', 'cold_call', 'event', 'advertisement', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."leads_status_enum" AS ENUM('new', 'contacted', 'qualified', 'disqualified', 'converted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying, "phone" character varying, "company" character varying, "title" character varying, "source" "public"."leads_source_enum", "status" "public"."leads_status_enum" NOT NULL DEFAULT 'new', "owner_id" uuid, "notes" text, "converted_at" TIMESTAMP WITH TIME ZONE, "converted_account_id" uuid, "converted_contact_id" uuid, "converted_deal_id" uuid, CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e1b3f24e7d9a8d07c586ace1b" ON "leads" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_491b018d616822bd64ce7d4726" ON "leads" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e1b2fdccce9cf66bcd9c6d249" ON "leads" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."custom_field_values_entity_type_enum" AS ENUM('lead', 'contact', 'account', 'deal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "custom_field_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "field_definition_id" uuid NOT NULL, "entity_type" "public"."custom_field_values_entity_type_enum" NOT NULL, "entity_id" uuid NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_54ac5f4b6a1d6e65212ebdc222d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ecd3c7b43773c9cfad7d0819c" ON "custom_field_values" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_46447ee4e979c442ca668138f3" ON "custom_field_values" ("field_definition_id", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dbd08751aedc31b9601d1b7352" ON "custom_field_values" ("organization_id", "entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "amount" numeric(14,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'USD', "account_id" uuid, "contact_id" uuid, "pipeline_id" uuid NOT NULL, "stage_id" uuid NOT NULL, "owner_id" uuid, "expected_close_date" date, "closed_at" TIMESTAMP WITH TIME ZONE, "description" text, CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f230a7e3eddfae196239343ae9" ON "deals" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b97d1ea508c53e8e01e7feda6" ON "deals" ("account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76e504b6bb116e6cdc2ee6a0cb" ON "deals" ("contact_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e8ce2b9d84c7fb97105ce7f00" ON "deals" ("pipeline_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23f5265469e4b4daea988d9146" ON "deals" ("stage_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39cb9fb7b130a5e5f7c5e29066" ON "deals" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."custom_field_definitions_entity_type_enum" AS ENUM('lead', 'contact', 'account', 'deal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."custom_field_definitions_field_type_enum" AS ENUM('text', 'number', 'date', 'boolean', 'select')`,
    );
    await queryRunner.query(
      `CREATE TABLE "custom_field_definitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "entity_type" "public"."custom_field_definitions_entity_type_enum" NOT NULL, "field_key" character varying NOT NULL, "label" character varying NOT NULL, "field_type" "public"."custom_field_definitions_field_type_enum" NOT NULL, "options" jsonb, "required" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_91f4cf6416f7aeb02c217005cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe690f0e7023077f2c7d94edfb" ON "custom_field_definitions" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a14214b415b2dfd5b5f75ad280" ON "custom_field_definitions" ("organization_id", "entity_type", "field_key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying, "phone" character varying, "title" character varying, "account_id" uuid, "owner_id" uuid, "notes" text, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0799185e89f0eec8f7ec05a5bb" ON "contacts" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85bbf0f254d76347a346a8cbb1" ON "contacts" ("account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac270d32a01ee22d2e98a8f853" ON "contacts" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "prefix" character varying NOT NULL, "hashed_secret" character varying NOT NULL, "scopes" text array NOT NULL DEFAULT '{*}', "is_active" boolean NOT NULL DEFAULT true, "last_used_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "created_by_user_id" uuid, CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a283bdef18876e525aefaec042" ON "api_keys" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6f6105c8efe05b310d046cbdb3" ON "api_keys" ("prefix") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activities_entity_type_enum" AS ENUM('lead', 'contact', 'account', 'deal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activities_type_enum" AS ENUM('call', 'meeting', 'task', 'note', 'email')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activities_status_enum" AS ENUM('pending', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "entity_type" "public"."activities_entity_type_enum" NOT NULL, "entity_id" uuid NOT NULL, "type" "public"."activities_type_enum" NOT NULL, "subject" character varying NOT NULL, "description" text, "status" "public"."activities_status_enum" NOT NULL DEFAULT 'pending', "due_date" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "owner_id" uuid, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98a034f3603f95ab549c425914" ON "activities" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_146a66975e0a017af25c63c665" ON "activities" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5546fd6565cf2441fc40072801" ON "activities" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2560306da90064ec6d62864bd2" ON "activities" ("organization_id", "entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" character varying NOT NULL, "industry" character varying, "website" character varying, "phone" character varying, "billing_address" character varying, "owner_id" uuid, "description" text, CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_238d61e0f8ac37278f726efac2" ON "accounts" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2db43cdbf7bb862e577b5f540c" ON "accounts" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6c1947a61f955558ccca3f7c4" ON "accounts" ("owner_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" ADD CONSTRAINT "FK_37b689c446ebe79ecd37e445735" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_21a659804ed7bf61eb91688dea7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" DROP CONSTRAINT "FK_37b689c446ebe79ecd37e445735"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6c1947a61f955558ccca3f7c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2db43cdbf7bb862e577b5f540c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_238d61e0f8ac37278f726efac2"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2560306da90064ec6d62864bd2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5546fd6565cf2441fc40072801"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_146a66975e0a017af25c63c665"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98a034f3603f95ab549c425914"`,
    );
    await queryRunner.query(`DROP TABLE "activities"`);
    await queryRunner.query(`DROP TYPE "public"."activities_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."activities_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."activities_entity_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f6105c8efe05b310d046cbdb3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a283bdef18876e525aefaec042"`,
    );
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac270d32a01ee22d2e98a8f853"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85bbf0f254d76347a346a8cbb1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0799185e89f0eec8f7ec05a5bb"`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a14214b415b2dfd5b5f75ad280"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe690f0e7023077f2c7d94edfb"`,
    );
    await queryRunner.query(`DROP TABLE "custom_field_definitions"`);
    await queryRunner.query(
      `DROP TYPE "public"."custom_field_definitions_field_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."custom_field_definitions_entity_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39cb9fb7b130a5e5f7c5e29066"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23f5265469e4b4daea988d9146"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e8ce2b9d84c7fb97105ce7f00"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76e504b6bb116e6cdc2ee6a0cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2b97d1ea508c53e8e01e7feda6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f230a7e3eddfae196239343ae9"`,
    );
    await queryRunner.query(`DROP TABLE "deals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dbd08751aedc31b9601d1b7352"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46447ee4e979c442ca668138f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ecd3c7b43773c9cfad7d0819c"`,
    );
    await queryRunner.query(`DROP TABLE "custom_field_values"`);
    await queryRunner.query(
      `DROP TYPE "public"."custom_field_values_entity_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e1b2fdccce9cf66bcd9c6d249"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_491b018d616822bd64ce7d4726"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e1b3f24e7d9a8d07c586ace1b"`,
    );
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."leads_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0286aeb96db651efd1ae2966f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9942da65d9e85fbd78e1a9bfc"`,
    );
    await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
    await queryRunner.query(
      `DROP TYPE "public"."webhook_deliveries_event_enum"`,
    );
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04402eb4cf7be16f6cc5e5f078"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7561aa4c56343cfac190f868e5"`,
    );
    await queryRunner.query(`DROP TABLE "pipelines"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37b689c446ebe79ecd37e44573"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d5f096cb55cb0607d1b004343"`,
    );
    await queryRunner.query(`DROP TABLE "pipeline_stages"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1263da9f2a66fe09006bd86130"`,
    );
    await queryRunner.query(`DROP TABLE "webhooks"`);
    await queryRunner.query(`DROP TYPE "public"."webhooks_events_enum"`);
  }
}
