import { Entity, RepositoryOptions, SelectQueryOptions } from '../repository';

/**
 * This interface provides a standard way of defining and representing multiple repositories in the Postgrape library.
 */
export interface MultipleRepositoryOptions<TEntity extends Entity> extends RepositoryOptions {
  argumentsSequence: (keyof TEntity)[];
}

export type CreateMultipleOptions<TEntity extends Entity> = SelectQueryOptions<TEntity>;
