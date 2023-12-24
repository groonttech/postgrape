import { Module, ConfigurableModuleBuilder } from '@nestjs/common';
import { PostgrapeClientFactory } from './client-factory';
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
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<PostgrapeModuleOptions>().build();

/**
 * Postgrape module.
 */
@Module({
  providers: [PostgrapeClientFactory],
  exports: [PostgrapeClientFactory],
})
export class PostgrapeModule extends ConfigurableModuleClass {}
