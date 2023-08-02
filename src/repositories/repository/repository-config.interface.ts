import { PoolClient } from 'pg';

/**
 * This interface defines repository config. DataClient provide repositories with this config.
 */
export interface RepositoryConfig {
  client: PoolClient;
  defaultSchema?: string;
}
