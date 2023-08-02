import { Module } from '@nestjs/common';
import { DataProvider } from './data-provider';
import { ConfigurableModuleClass } from './postgrape.module-definition';

@Module({
  providers: [DataProvider],
  exports: [DataProvider],
})
export class PostgrapeModule extends ConfigurableModuleClass {}
