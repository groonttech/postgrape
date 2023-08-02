import { Inject, Injectable, Logger } from '@nestjs/common';
import { exit } from 'process';
import { Pool, types } from 'pg';
import { PostgrapeModuleOptions, MODULE_OPTIONS_TOKEN } from '../postgrape.module-definition';
import { BaseDataClient } from '../data-client';
import { DateTime, Duration } from 'luxon';
import { DurationWithTZ } from '../duration-with-tz';

// Change parse method for timestamp to Luxon DateTime
types.setTypeParser(types.builtins.TIMESTAMP, (value: string) => {
  return value === null ? null : DateTime.fromISO(value, { zone: 'utc' });
});

// Change parse method for timestamp with timezone to Luxon DateTime
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value: string) => {
  return value === null ? null : DateTime.fromISO(value);
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
 * Data provider.
 */
@Injectable()
export class DataProvider {
  private _defaultSchema: string;
  private _pool: Pool;
  private _dataClientClass: typeof BaseDataClient;
  private _logger = new Logger(DataProvider.name);

  constructor(@Inject(MODULE_OPTIONS_TOKEN) options: PostgrapeModuleOptions) {
    this._pool = new Pool({
      host: options.host,
      port: options.port || 5432,
      database: options.database,
      user: options.user || 'postgres',
      password: options.password,
    });
    this._dataClientClass = options.dataClient;
    this._defaultSchema = options.defaultSchema;

    // Trying to connect to the database
    this._pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        this._logger.error(err);
        exit(1);
      }
      this._logger.log('Successfully connected to the database');
    });
  }

  /**
   * Acquires a client from the pool and start transaction or return provided client and create savepoint.
   * @param client data client of root service
   */
  public async getClientAndBegin<TDataClient extends BaseDataClient>(client?: TDataClient): Promise<TDataClient> {
    if (!client) {
      const dbClient = await this._pool.connect();
      if (!dbClient) throw Error('Client has not been acquired');
      client = new this._dataClientClass(dbClient, this._defaultSchema) as TDataClient;
    }
    await client.begin();
    return client;
  }

  public async end(): Promise<void> {
    return this._pool.end();
  }
}
