import { Entity, LimitQueryOptions, RepositoryOptions, SelectQueryOptions, WhereQueryOptions } from '../repository';

/**
 * This interface provides a standard way of defining and representing multiple repositories in the Postgrape library.
 */
export interface SearchableRepositoryOptions<TEntity extends Entity> extends RepositoryOptions {
  columnsForSearch: (keyof TEntity)[];
}

export type SearchOptions<TEntity extends Entity> = SelectQueryOptions<TEntity> &
  WhereQueryOptions<TEntity> &
  LimitQueryOptions;
