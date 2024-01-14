import { Entity, Repository, RepositoryConfig } from '../repository';
import { CreateMultipleOptions, MultipleRepositoryOptions } from './multiple-repository-options.interface';
import { InvalidArgumentsException } from '../../exceptions';

export class MultipleRepository<TEntity extends Entity> extends Repository<TEntity> {
  private _argumentsSequence: (keyof TEntity)[] = [];

  constructor(options: MultipleRepositoryOptions<TEntity>, config: RepositoryConfig) {
    super(options, config);
    this._argumentsSequence = options.argumentsSequence;
  }

  public async createMultiple(
    item: Omit<TEntity, 'id'>,
    count: number,
    options?: CreateMultipleOptions<TEntity>,
  ): Promise<number[]> {
    if (!item) throw new InvalidArgumentsException();

    const func = `public.insert_multiple_${this._table}`;
    const values = this._argumentsSequence.reduce(
      (acc, key) => (acc += `${this._valueToQuery(item[key as keyof Omit<TEntity, 'id'>])}, `),
      '',
    );
    const selectOptions = this._parseSelectOptions(options?.select);
    const query = `SELECT ${selectOptions} FROM ${func}(${values}${count})`;
    const res = await this._client.query(query);

    return res.rows[0][func];
  }
}
