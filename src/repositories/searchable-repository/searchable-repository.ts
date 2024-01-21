import { Entity, Repository, RepositoryConfig } from '../repository';
import { SearchOptions, SearchableRepositoryOptions } from './searchable-repository-options.interface';
import { InvalidArgumentsException } from '../../exceptions';

export class SearchableRepository<TEntity extends Entity> extends Repository<TEntity> {
  private _columnsForSearch: string[] = [];

  constructor(options: SearchableRepositoryOptions<TEntity>, config: RepositoryConfig) {
    super(options, config);
    this._columnsForSearch = options.columnsForSearch as string[];
  }

  private _searchedWordsToQueryFindFromStart(columnsForSearch: string[], queryWords: string[]): string {
    const res = columnsForSearch.map(column => {
      return queryWords.map((elem, i) => `${column} ILIKE $${i + 1} || '%' DESC`).join('');
    });

    return '(' + res.join('), (') + ')';
  }

  private _searchedWordsToQueryFindSubstring(columnsForSearch: string[], queryWords: string[]): string {
    const res = columnsForSearch.map(column => {
      return queryWords.map((elem, i) => `${column} ILIKE '%' || $${i + 1} || '%'`).join(' AND ');
    });

    return '(' + res.join(') OR (') + ')';
  }

  public async search(query: string, options?: SearchOptions<TEntity>): Promise<TEntity[]> {
    if (query === '') throw new InvalidArgumentsException();

    let searchedObjects: TEntity[];
    const columns = (options.columnsForSearch as string[]) || this._columnsForSearch;
    const limit = options && options.limit && options.limit > 0 ? options.limit : 10;
    const queryWords: string[] = query.split(/[\s,]+/); // divide query into words

    const whereOptions = this._whereOptionsToQuery(options?.where);
    const isWhere = whereOptions !== '' ? ' AND' : 'WHERE';

    const queryString = `SELECT * FROM ${this._schema}.${
      this._table
    } ${whereOptions}${isWhere} ${this._searchedWordsToQueryFindSubstring(
      columns,
      queryWords,
    )} ORDER BY ${this._searchedWordsToQueryFindFromStart(columns, queryWords)}, ${columns.join(', ')} LIMIT ${limit};`;
    const searchQuery = await this._client.query(queryString, queryWords);

    searchedObjects = searchQuery.rows;

    return searchedObjects;
  }
}
