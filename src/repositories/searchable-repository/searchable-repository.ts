import { Entity, Repository, RepositoryConfig } from '../repository';
import { SearchOptions, SearchableRepositoryOptions } from './searchable-repository-options.interface';

export class SearchableRepository<TEntity extends Entity> extends Repository<TEntity> {
  private readonly _defaultLimit = 10;
  private _columnsForSearch: string[] = [];

  constructor(options: SearchableRepositoryOptions<TEntity>, config: RepositoryConfig) {
    super(options, config);
    this._columnsForSearch = options.columnsForSearch as string[];
  }

  public async search(query: string, options?: SearchOptions<TEntity>): Promise<TEntity[]> {
    let searchedObjects: TEntity[];
    const columns = (options?.columnsForSearch as string[]) || this._columnsForSearch;
    const limit = options && options.limit && options.limit > 0 ? options.limit : this._defaultLimit;
    const queryWords: string[] = query.split(/[\s,]+/);

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
}
