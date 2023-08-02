import { PoolClient } from 'pg';

/**
 * This interface defines repository config. DataClient provide repositories with this config.
 */
export interface SearchableRepositoryConfig {
  client: PoolClient;
  defaultSchema?: string;
}
