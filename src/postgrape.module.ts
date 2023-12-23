import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './postgrape.module-definition';
import { PostgrapeClientFactory } from './client-factory';

@Module({
  providers: [PostgrapeClientFactory],
  exports: [PostgrapeClientFactory],
})
export class PostgrapeModule extends ConfigurableModuleClass {}
