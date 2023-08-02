/**
 * This interface provides a standard way of defining and representing repositories in the Postgrape library.
 */
export interface RepositoryOptions {
  table: string;
  schema?: string;
}
