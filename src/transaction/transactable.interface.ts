import { DataProvider } from '../data-provider';

/**
 * Interface that allows to use a `@Transaction()` decorator. An instance of `DataProvider` interface must be injected in that service.
 * ```
 * export class AwesomeService implements ITransactable {
 *   constructor(public _dataProvider: DataProvider) {}
 *   ...
 * ```
 */
export interface ITransactable {
  _dataProvider: DataProvider;
}
