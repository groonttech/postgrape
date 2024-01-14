import { ConfigurableModuleBuilder } from '@nestjs/common';
import { PostgrapeClient } from './client';

/**
 * Postgrape module uses this options to connect to the PostgreSQL database.
 */
export interface PostgrapeModuleOptions {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
  dataClient: typeof PostgrapeClient;
  defaultSchema?: string;
  connectionCheck?: boolean;
  useSavepoints?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<PostgrapeModuleOptions>().build();
