import { Entity } from '../entity.interface';

/**
 * This interface defines conditions for filtering the results of a query.
 */
export type WhereOptions<TEntity extends Entity> = {
  [op: symbol]: WhereOptions<TEntity>[];
} & {
  [P in keyof TEntity]?:
    | TEntity[P]
    | TEntity[P][]
    | null
    | {
        [op: symbol]: TEntity[P] | null | undefined;
      };
};

/**
 * This interface defines the ordering of the results of a query.
 */
export type OrderByOptions<TEntity extends Entity> = {
  [P in keyof TEntity]?: 'ASC' | 'DESC';
};

export type SelectQueryOptions<TEntity extends Entity> = {
  /**
   * An array of the names of the columns to be selected by a query.
   */
  select?: (keyof TEntity)[];
};

export type WhereQueryOptions<TEntity extends Entity> = {
  /**
   * An object that defines conditions for filtering the results of a query.
   */
  where?: WhereOptions<TEntity>;
};

export type OrderByQueryOptions<TEntity extends Entity> = {
  /**
   * An object that defines the ordering of the results of a query.
   */
  orderBy?: OrderByOptions<TEntity>;
};

export type OffsetQueryOptions = {
  /**
   * A number that specifies the offset of the first row to be returned by a query.
   */
  offset?: number;
};

export type LimitQueryOptions = {
  /**
   * A number that specifies the maximum number of rows to be returned by a query.
   */
  limit?: number;
};

export type ReturningQueryOptions<TEntity extends Entity> = {
  /**
   * An array of the names of the columns to be returned by a query.
   */
  returning?: (keyof TEntity)[];
};

/**
 * This interface defines options for building a SQL query for `find()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: FindOptions = {
 *   // An object that defines which columns should be selected.
 *   select: ['name', 'age'],
 *   // An object that defines conditions for filtering the results of a query.
 *   where: { name: 'Jane', age: 30 },
 *   // An object that defines the ordering of the results of a query.
 *   orderBy: { name: 'ASC', age: 'DESC' },
 *   // A number that specifies the offset of the first row to be returned by a query.
 *   offset: 0,
 *   // A number that specifies the maximum number of rows to be returned by a query.
 *   limit: 10
 * }
 * ```
 */
export type FindOptions<TEntity extends Entity> = SelectQueryOptions<TEntity> &
  WhereQueryOptions<TEntity> &
  OrderByQueryOptions<TEntity> &
  OffsetQueryOptions &
  LimitQueryOptions;

/**
 * This interface defines options for building a SQL query for `findOne()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: FindOneOptions = {
 *   // An object that defines which columns should be selected.
 *   select: ['name', 'age'],
 *   // An object that defines conditions for filtering the results of a query.
 *   where: { name: 'Jane', age: 30 },
 *   // An object that defines the ordering of the results of a query.
 *   orderBy: { name: 'ASC', age: 'DESC' },
 *   // A number that specifies the offset of the first row to be returned by a query.
 *   offset: 0,
 * }
 * ```
 */
export type FindOneOptions<TEntity extends Entity> = SelectQueryOptions<TEntity> &
  WhereQueryOptions<TEntity> &
  OrderByQueryOptions<TEntity> &
  OffsetQueryOptions;

/**
 * This interface defines options for building a SQL query for `findById()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: FindByIdOptions = {
 *   // An object that defines which columns should be selected.
 *   select: ['name', 'age']
 * }
 * ```
 */
export type FindByIdOptions<TEntity extends Entity> = SelectQueryOptions<TEntity>;

/**
 * This interface defines options for building a SQL query for `create()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: CreateOptions = {
 *   // An object that defines which columns should be returned.
 *   returning: ['name', 'age']
 * }
 * ```
 */
export type CreateOptions<TEntity extends Entity> = ReturningQueryOptions<TEntity>;

/**
 * This interface defines options for building a SQL query for `update()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: UpdateOptions = {
 *   // An object that defines conditions for filtering the results of a query.
 *   where: { name: 'Jane', age: 30 },
 *   // An object that defines which columns should be returned.
 *   returning: ['name', 'age']
 * }
 * ```
 */
export type UpdateOptions<TEntity extends Entity> = WhereQueryOptions<TEntity> & ReturningQueryOptions<TEntity>;

/**
 * This interface defines options for building a SQL query for `updateById()` method.
 *
 * The interface has several optional properties:
 * ```
 * const options: UpdateByIdOptions = {
 *   // An object that defines which columns should be returned.
 *   returning: ['name', 'age']
 * }
 * ```
 */
export type UpdateByIdOptions<TEntity extends Entity> = ReturningQueryOptions<TEntity>;

export type QueryOptions<TEntity extends Entity> = SelectQueryOptions<TEntity> &
  WhereQueryOptions<TEntity> &
  OrderByQueryOptions<TEntity> &
  OffsetQueryOptions &
  LimitQueryOptions &
  ReturningQueryOptions<TEntity>;
