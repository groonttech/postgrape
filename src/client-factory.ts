import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { exit } from 'process';
import { Pool, types } from 'pg';
import { PostgrapeModuleOptions, MODULE_OPTIONS_TOKEN } from './postgrape.module-definition';
import { DateTime, Duration } from 'luxon';
import { DurationWithTZ } from './duration-with-tz';
import { PostgrapeClient } from './client';

// Change parse method for timestamp to Luxon DateTime
types.setTypeParser(types.builtins.TIMESTAMP, (value: string) => {
  return value === null ? null : DateTime.fromSQL(value, { zone: 'utc' });
});

// Change parse method for timestamp with timezone to Luxon DateTime
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value: string) => {
  return value === null ? null : DateTime.fromSQL(value);
});

// Change parse method for time to Luxon Duration
types.setTypeParser(types.builtins.TIME, (value: string) => {
  return value === null ? null : Duration.fromISOTime(value);
});

// Change parse method for time with timezone to Luxon Duration
types.setTypeParser(types.builtins.TIMETZ, (value: string) => {
  return value === null ? null : new DurationWithTZ(value);
});

/**
 * The `PostgrapeClientFactory` class is responsible for managing database connections and acquiring `PostgrapeClient` instances.
 */
@Injectable()
export class PostgrapeClientFactory implements OnModuleInit {
  public readonly useSavepoints: boolean;
  protected _connectionCheck: boolean;
  protected _defaultSchema: string;
  protected _pool: Pool;
  protected _dataClientClass: typeof PostgrapeClient;
  protected _logger = new Logger(PostgrapeClientFactory.name);

  constructor(@Inject(MODULE_OPTIONS_TOKEN) options: PostgrapeModuleOptions) {
    this._pool = new Pool({
      host: options.host,
      port: options.port || 5432,
      database: options.database,
      user: options.user || 'postgres',
      password: options.password,
    });
    this._dataClientClass = options.dataClient;
    this._defaultSchema = options.defaultSchema || 'public';
    this.useSavepoints = options.useSavepoints === false ? false : true;
    this._connectionCheck = options.connectionCheck === false ? false : true;
  }

  async onModuleInit(): Promise<void> {
    if (!this._connectionCheck) return;

    // Trying to connect to the database
    try {
      const res = await this._pool.query('SELECT NOW()');
      this._logger.log('Successfully connected to the database');
    } catch (error) {
      this._logger.error(error);
      exit(1);
    }
  }

  /**
   * Acquire a client from the pool.
   */
  public async acquireClient<TClient extends PostgrapeClient>(): Promise<TClient> {
    const dbClient = await this._pool.connect();
    if (!dbClient) throw Error('Client has not been acquired');
    return new this._dataClientClass(dbClient, this._defaultSchema) as TClient;
  }

  /**
   * Close all connections.
   */
  public async end(): Promise<void> {
    return this._pool.end();
  }
}
