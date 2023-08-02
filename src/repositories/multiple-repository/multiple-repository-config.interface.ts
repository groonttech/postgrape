import { PoolClient } from 'pg';

/**
 * This interface defines repository config. DataClient provide repositories with this config.
 */
export interface MultipleRepositoryConfig {
  client: PoolClient;
  defaultSchema?: string;
}
