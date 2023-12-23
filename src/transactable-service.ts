import { Inject, Injectable } from '@nestjs/common';
import { PostgrapeClientFactory } from './client-factory';

/*
 * The `TransactableService` is a class that should be extended by injectable service class. It makes the `Transaction` decorator work.
 */
export class TransactableService {
  @Inject(PostgrapeClientFactory) private _postgrapeClientFactory!: PostgrapeClientFactory;
}
