import { PoolClient } from 'pg';
import { RepositoryConfig } from './repositories';

/**
 * The `PostgrapeClient` class is a wrapper around a PostgreSQL client connection from a pool.
 * It provides transaction management features, including the ability to start, commit, and rollback transactions.
 *
 * This class should be extended and repository fields should be added to access specific tables in the database:
 * ```
 * export class DataClient extends PostgrapeClient {
 *   public readonly users = new Repository<User>('user', this._config);
 * }
 * ```
 */
export class PostgrapeClient {
  private _isTransactionStarted = false;
  private _savepoints: string[] = [];
  protected _config: RepositoryConfig;

  constructor(private _client: PoolClient, _defaultSchema: string) {
    this._config = {
      client: _client,
      defaultSchema: _defaultSchema,
    };
  }

  /**
   * Begin transaction for an acquired client or set a savepoint if transaction already started.
   */
  public async begin(): Promise<void> {
    if (!this._isTransactionStarted) {
      await this._client.query('BEGIN TRANSACTION', []);
      // console.log('BEGIN TRANSACTION');
      this._isTransactionStarted = true;
    } else {
      const savepoint = `savepoint_${this._savepoints.length}`;
      await this._client.query(`SAVEPOINT ${savepoint}`, []);
      // console.log(`SAVEPOINT ${savepoint}`);
      this._savepoints.push(savepoint);
    }
  }

  /**
   * Commit transaction for an acquired client if there are no savepoints.
   */
  public async commit(): Promise<void> {
    if (this._isTransactionStarted && !this._savepoints.length) {
      await this._client.query('COMMIT TRANSACTION', []);
      // console.log('COMMIT TRANSACTION');
    }
  }

  /**
   * Rollback transaction or rollback to the latest savepoint for an acquired client.
   */
  public async rollback(): Promise<void> {
    if (!this._isTransactionStarted) return;
    if (this._savepoints.length) {
      const toSavepoint = this._savepoints[this._savepoints.length - 1];
      await this._client.query(`ROLLBACK TO ${toSavepoint}`, []);
      // console.log(`ROLLBACK TO ${toSavepoint}`);
    } else {
      await this._client.query(`ROLLBACK`, []);
      // console.log('ROLLBACK');
    }
  }

  /**
   * Return an acquired client back to the pool or delete the latest savepoint.
   */
  public release(error?: boolean): void {
    if (this._savepoints.length) {
      this._savepoints.pop();
    } else {
      this._client.release(error);
      // console.log('RELEASE');
    }
  }
}
