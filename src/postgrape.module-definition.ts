import { ConfigurableModuleBuilder } from '@nestjs/common';
import { BaseDataClient } from './data-client';

/**
 * Postgrape module uses this options to connect to the PostgreSQL database.
 */
export interface PostgrapeModuleOptions {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
  dataClient: typeof BaseDataClient;
  defaultSchema?: string;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<PostgrapeModuleOptions>().build();
