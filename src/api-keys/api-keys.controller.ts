import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtOnlyGuard } from './guards/jwt-only.guard';

@UseGuards(JwtOnlyGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: { id: string },
  ) {
    const { apiKey, plaintextKey } = await this.apiKeysService.create(
      dto,
      user.id,
    );
    return {
      ...apiKey,
      key: plaintextKey,
      warning: 'Store this key now — it will not be shown again.',
    };
  }

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Delete(':id')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }
}
