import { Entity, Repository, RepositoryConfig } from '../repository';
import { SearchOptions, SearchableRepositoryOptions } from './searchable-repository-options.interface';
import { InvalidArgumentsException } from '../../exceptions';

export class SearchableRepository<TEntity extends Entity> extends Repository<TEntity> {
  private _columnsForSearch: string[] = [];

  constructor(options: SearchableRepositoryOptions<TEntity>, config: RepositoryConfig) {
    super(options, config);
    this._columnsForSearch = options.columnsForSearch as string[];
  }

  private addUnique(firstArray: TEntity[], secondArray: TEntity[]): void {
    for (const secondEntity of secondArray) {
      let isSimilar = false;

      for (const firstEntity of firstArray) {
        if (firstEntity.id === secondEntity.id) {
          isSimilar = true;
        }
      }

      if (isSimilar === false) {
        firstArray.push(secondEntity);
      }
    }
  }

  private _searchOptionsToQueryStartSimilar(query: string, columnsForSearch: string[]) {
    if (!query || !columnsForSearch) return '';
    const res = Object.values(columnsForSearch)
      .map(entry => `${entry} ILIKE '${query}' || '%'`)
      .join(' AND ');
    return res;
  }

  private _searchOptionsToQueryEverySimilar(query: string, columnsForSearch: string[]) {
    if (!query || !columnsForSearch) return '';
    const res = Object.values(columnsForSearch)
      .map(entry => `${entry} ILIKE '%' || '${query}' || '%'`)
      .join(' AND ');
    return res;
  }

  private _searchOptionsToQueryLongestCommonSubstring(query: string, columnsForSearch: string[]) {
    if (!query || !columnsForSearch) return '';
    const res = Object.values(columnsForSearch)
      .map(entry => `(longest_common_substring(LOWER(${this._table}.${entry}::text), LOWER('${query}'))) > 1 DESC`)
      .join(', ');
    return res;
  }

  private _searchOptionsToQueryDemerauLevenshteinDistance(query: string, columnsForSearch: string[]) {
    if (!query || !columnsForSearch) return '';
    const res = Object.values(columnsForSearch)
      .map(entry => `(demerau_levenshtein_distance(LOWER(${this._table}.${entry}::text), LOWER('${query}'))) DESC`)
      .join(', ');
    return res;
  }

  public async search(
    query: string,
    columnsForSearch?: (keyof TEntity)[],
    options?: SearchOptions<TEntity>,
  ): Promise<TEntity[]> {
    if (query === '') throw new InvalidArgumentsException();
    const columns = (columnsForSearch as string[]) || this._columnsForSearch;
    const limit = !options || !options.limit ? 10 : options.limit;

    let searchableObjects: TEntity[];
    const optionsQuery = this._whereOptionsToQuery(options?.where);
    const isWhere = optionsQuery !== '' ? ' AND' : 'WHERE';

    const startSimilar = `SELECT * FROM ${
      this._table
    } ${optionsQuery}${isWhere} ${this._searchOptionsToQueryStartSimilar(query, columns)};`;

    const resStartSimilar = await this._client.query(startSimilar);

    searchableObjects = resStartSimilar.rows;
    const everySimilar = `SELECT * FROM ${
      this._table
    } ${optionsQuery}${isWhere} ${this._searchOptionsToQueryEverySimilar(query, columns)} LIMIT ${
      limit - searchableObjects.length
    };`;
    const resEverySimilar = await this._client.query(everySimilar);
    this.addUnique(searchableObjects, resEverySimilar.rows);
    if (limit - searchableObjects.length > 0) {
      const longestCommonSubstring = `SELECT * FROM ${
        this._table
      } ${optionsQuery} ORDER BY ${this._searchOptionsToQueryLongestCommonSubstring(query, columns)} LIMIT ${
        limit - searchableObjects.length
      };`;
      const resLongestCommonSubstring = await this._client.query(longestCommonSubstring);
      this.addUnique(searchableObjects, resLongestCommonSubstring.rows);

      if (limit - searchableObjects.length > 0) {
        const demerauLevenshteinDistance = `SELECT * FROM ${
          this._table
        } ${optionsQuery} ORDER BY ${this._searchOptionsToQueryDemerauLevenshteinDistance(query, columns)} LIMIT ${
          limit - searchableObjects.length
        };`;
        const resDemerauLevenshteinDistance = await this._client.query(demerauLevenshteinDistance);
        this.addUnique(searchableObjects, resDemerauLevenshteinDistance.rows);
      }
    }

    return searchableObjects;
  }
}
