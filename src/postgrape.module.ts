import { Module } from '@nestjs/common';
import { PostgrapeClientFactory } from './client-factory';
import { ConfigurableModuleClass } from './postgrape.module-definition';

/**
 * Postgrape module.
 */
@Module({
  providers: [PostgrapeClientFactory],
  exports: [PostgrapeClientFactory],
})
export class PostgrapeModule extends ConfigurableModuleClass {}
