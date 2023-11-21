import { PoolClient } from 'pg';
import {
  CreateOptions,
  FindByIdOptions,
  FindOneOptions,
  FindOptions,
  OrderByOptions,
  QueryOptions,
  UpdateByIdOptions,
  UpdateOptions,
  WhereOptions,
} from './query-options.interface';
import { RepositoryOptions } from './repository-options.interface';
import { RepositoryConfig } from './repository-config.interface';
import { Entity } from '../entity.interface';
import { Op } from '../operators';
import { InvalidArgumentsException } from '../../exceptions';
import { Duration } from 'luxon';

/**
 * This class provides a standard set of methods for performing CRUD operations on entities in a data store.
 */
export class Repository<TEntity extends Entity> {
  protected _table: string;
  protected _schema: string;
  protected _client: PoolClient;

  constructor(options: string | RepositoryOptions, config: RepositoryConfig) {
    this._client = config.client;
    if (!this._client) throw Error('Client was not provided');

    if (typeof options === 'string') {
      this._table = options;
      this._schema = config.defaultSchema || 'public';
    } else {
      this._table = options.table;
      this._schema = options.schema || config.defaultSchema || 'public';
    }
  }

  /**
   * Find all entities that match the given query options and return them as an array.
   * @param options options for building a SQL query
   */
  public async find(options: FindOptions<TEntity>): Promise<TEntity[]> {
    const optionsQuery = this._optionsToQuery(options);
    const selectOptions = this._parseSelectOptions(options?.select);
    const query = `SELECT ${selectOptions} FROM ${this._schema}."${this._table}" ${optionsQuery}`;
    const res = await this._client.query(query, []);
    return res.rows;
  }

  /**
   * Find a single entity that matches the given query options and return it.
   * @param options options for building a SQL query
   */
  public async findOne(options: FindOneOptions<TEntity>): Promise<TEntity> {
    const optionsQuery = this._optionsToQuery({ ...options, limit: 1 });
    const selectOptions = this._parseSelectOptions(options?.select);
    const query = `SELECT ${selectOptions} FROM ${this._schema}."${this._table}" ${optionsQuery}`;
    const res = await this._client.query(query, []);
    return res.rows[0];
  }

  /**
   * Find an entity by its ID and return it.
   * @param id entity ID
   */
  public async findById(id: number, options?: FindByIdOptions<TEntity>): Promise<TEntity> {
    const where = { id } as WhereOptions<TEntity>;
    const optionsQuery = this._optionsToQuery({ ...options, where, limit: 1 });
    const selectOptions = this._parseSelectOptions(options?.select);
    const query = `SELECT ${selectOptions} FROM ${this._schema}."${this._table}" ${optionsQuery}`;
    const res = await this._client.query(query, []);
    return res.rows[0];
  }

  /**
   * Create a new entity with the given data and return it.
   * @param entity entity object
   */
  public async create(entity: TEntity, options?: CreateOptions<TEntity>): Promise<TEntity> {
    if (!entity) throw new InvalidArgumentsException();
    const keys = Object.keys(entity)
      .map(key => `"${key}"`)
      .join(', ');
    const values = Object.values(entity);
    const valuesTemplate = Object.values(entity)
      .map((value, index) => `$${index + 1}`)
      .join(', ');
    const optionsQuery = this._optionsToQuery(options, false, true);
    const query = `INSERT INTO ${this._schema}."${this._table}" (${keys}) VALUES (${valuesTemplate}) ${optionsQuery}`;
    const res = await this._client.query(query, this._parseValues(values));
    return res.rows[0];
  }

  /**
   * Update all entities that match the given query options with the given data and return updated entities as an array.
   * @param options options for building a SQL query
   * @param entity update object
   */
  public async update(options: UpdateOptions<TEntity>, entity: Partial<TEntity>): Promise<TEntity[]> {
    if (!entity) throw new InvalidArgumentsException();
    const optionsQuery = this._optionsToQuery(options, false, true);
    const keysTemplate = Object.keys(entity)
      .map((key, index) => `"${key}"=$${index + 1}`)
      .join(', ');
    const values = Object.values(entity);
    const query = `UPDATE ${this._schema}."${this._table}" SET ${keysTemplate} ${optionsQuery}`;
    const res = await this._client.query(query, this._parseValues(values));
    return res.rows;
  }

  /**
   * Update a single entity that matches the given query options with the given data and return the updated entity.
   * @param options options for building a SQL query
   * @param entity update object
   * @deprecated
   */
  public async updateOne(options: UpdateOptions<TEntity>, entity: Partial<TEntity>): Promise<TEntity> {
    const optionsQuery = this._optionsToQuery(options, false, true);
    const keysTemplate = Object.keys(entity)
      .map((key, index) => `"${key}"=$${index + 1}`)
      .join(', ');
    const values = Object.values(entity);
    const query = `UPDATE ${this._schema}."${this._table}" SET ${keysTemplate} ${optionsQuery}`;
    const res = await this._client.query(query, this._parseValues(values));
    return res.rows[0];
  }

  /**
   * Update an entity with the given ID with the given data and return the updated entity.
   * @param id entity ID
   * @param entity update object
   */
  public async updateById(
    id: number,
    entity: Partial<TEntity>,
    options?: UpdateByIdOptions<TEntity>,
  ): Promise<TEntity> {
    const keysTemplate = Object.keys(entity)
      .map((key, index) => `"${key}"=$${index + 1}`)
      .join(', ');
    const values = Object.values(entity);
    const where = { id } as WhereOptions<TEntity>;
    const optionsQuery = this._optionsToQuery({ ...options, where }, false, true);
    const query = `UPDATE ${this._schema}."${this._table}" SET ${keysTemplate} ${optionsQuery}`;
    const res = await this._client.query(query, this._parseValues(values));
    return res.rows[0];
  }

  protected _parseValues(values: any[]): any[] {
    return values.map(value => (value instanceof Duration ? (value as Duration).toFormat('hh:mm:ss') : value));
  }

  protected _whereOptionsToQuery(whereOptions?: WhereOptions<TEntity>): string {
    if (!whereOptions) return '';
    const query = this._parseWhereObject(whereOptions);
    if (query == '') return '';
    return `WHERE ${query}`;
  }

  protected _orderByOptionsToQuery(orderByOptions?: OrderByOptions<TEntity>): string {
    if (!orderByOptions) return 'ORDER BY "id" ASC';
    const query = Object.entries(orderByOptions)
      .map(entry => `"${entry[0]}" ${entry[1]}`)
      .join(', ');
    if (query == '') return '';
    return `ORDER BY ${query}`;
  }

  protected _optionsToQuery(options?: QueryOptions<TEntity>, withOrder = true, withReturning = false): string {
    const optionsObj = [
      options?.where ? this._whereOptionsToQuery(options?.where) + ' ' : '',
      withOrder ? this._orderByOptionsToQuery(options?.orderBy) + ' ' : '',
      options?.offset ? `OFFSET ${options?.offset}` + ' ' : '',
      options?.limit ? `LIMIT ${options?.limit}` + ' ' : '',
      withReturning ? (options?.returning ? `RETURNING ${options?.returning.join(', ')}` : 'RETURNING *') : '',
    ];
    return Object.values(optionsObj).join('').trim();
  }

  protected _valueToQuery(value: any): string {
    if (value == undefined) return '';
    if (value === null) return 'null';

    if (value.toISOString) return `'${this.encodeRFC3986URI(value.toISOString())}'`;

    if (typeof value === 'string') return `'${this.encodeRFC3986URI(value)}'`;

    return this.encodeRFC3986URI(value);
  }

  private _keyValuesArrayToQuery(key: string, array: any[]): string {
    if (array != undefined) { return `(${array.map(v => {
      if (this._valueToQuery(v) != '')  {
        return `${key} = ${this._valueToQuery(v)}`
      }
    }).join(' OR ')})`};
    return "";
  }

  private _keyOperatorValueToQuery(key: string, object: Record<symbol, any>): string {
    const operator = Object.getOwnPropertySymbols(object)[0];

    if (this._valueToQuery(object[operator]) != '') {
      return `${key} ${operator.description} ${this._valueToQuery(object[operator])}`
    }

    return "";
  }

  private _keyValueToQuery(key: string, value: any): string {
    if (this._valueToQuery(value) != '')  {
      return `${key} = ${this._valueToQuery(value)}`
    }

    return "";
  }

  private _parseWhereObject(object: Record<string | symbol, any>): string {
    let array: string[] = [];
    const keys = Object.keys(object);
    const operators = Object.getOwnPropertySymbols(object);

    for (const key of keys) {
      if (Array.isArray(object[key])) {
        if (this._keyValuesArrayToQuery(key, object[key]) != undefined) array.push(this._keyValuesArrayToQuery(key, object[key]));
      } else if (this._containOperator(object[key])) {
        if (this._keyOperatorValueToQuery(key, object[key]) != undefined) array.push(this._keyOperatorValueToQuery(key, object[key]));
      } else {
        if (this._keyValueToQuery(key, object[key]) != undefined) array.push(this._keyValueToQuery(key, object[key]));
      }
    }

    let query = array.join(' AND ');

    if (operators.length && keys.length) query += ' AND ';

    query += operators.map(operator => `${this._parseWhereOperator(operator, object[operator])}`).join(' AND ');

    return keys.length + operators.length > 1 ? `(${query})` : query;
  }

  private _containOperator(object: Record<string | symbol, any>): boolean {
    if (!object) return false;
    const operators = Object.getOwnPropertySymbols(object);
    const existingOperators = Object.values(Op);
    return operators.some(operator => existingOperators.includes(operator));
  }

  private _parseWhereOperator(operator: symbol, objects: Record<string | symbol, any>[]): string {
    const query = objects.map(object => `${this._parseWhereObject(object)}`).join(` ${operator.description} `);
    return `(${query})`;
  }

  protected _parseSelectOptions(select?: (keyof TEntity)[]): string {
    if (!select) return '*';
    return select.join(', ');
  }

  protected encodeRFC3986URI(str: string) {
    return encodeURI(str).replace(/['-]/g,(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }
}
