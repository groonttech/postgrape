import { Entity, LimitQueryOptions, RepositoryOptions, SelectQueryOptions, WhereQueryOptions } from '../repository';

/**
 * This interface provides a standard way of defining and representing multiple repositories in the Postgrape library.
 */
export interface SearchableRepositoryOptions<TEntity extends Entity> extends RepositoryOptions {
  columnsForSearch: (keyof TEntity)[];
}

export interface SearchColumns<TEntity extends Entity> {
  columnsForSearch: (keyof TEntity)[];
}

export type SearchOptions<TEntity extends Entity> = SearchColumns<TEntity> &
  SelectQueryOptions<TEntity> &
  WhereQueryOptions<TEntity> &
  LimitQueryOptions;
