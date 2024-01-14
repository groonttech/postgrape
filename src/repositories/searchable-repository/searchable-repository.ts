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

  private _searchOptionsToQuery(
    prefix: string,
    sufix: string,
    columnsForSearch: string[],
    countSearchWords: number,
  ): string {
    const res = columnsForSearch.map(column => {
      const words = Array.from({ length: countSearchWords }, (_, j) => `${column} ILIKE${prefix} $${j + 1}${sufix}`);
      return words.join(' AND ');
    });

    return res.join(') OR (');
  }

  public async search(
    query: string,
    options?: SearchOptions<TEntity>,
  ): Promise<TEntity[]> {
    if (query === '') throw new InvalidArgumentsException();
    const columns = (options?.columnsForSearch as string[]) || this._columnsForSearch;
    const limit = !options || !options.limit ? 10 : options.limit;
    const arrayOfWordsInQuery: string[] = query.split(/[\s,]+/); // divide query into words
    const arrayOfQuery: string[][] = new Array(options?.columnsForSearch.length).fill(arrayOfWordsInQuery);

    let searchableObjects: TEntity[] = [];
    const optionsQuery = this._whereOptionsToQuery(options?.where);
    const isWhere = optionsQuery !== '' ? ' AND' : 'WHERE';

    for (const currentQuery of arrayOfQuery) {
      const startSimilar = `SELECT * FROM ${this._schema}.${
        this._table
      } ${optionsQuery}${isWhere} (${this._searchOptionsToQuery('', " || '%'", columns, arrayOfWordsInQuery.length)});`;

      const resStartSimilar = await this._client.query(startSimilar, currentQuery);

      searchableObjects = resStartSimilar.rows;

      const everySimilar = `SELECT * FROM ${this._schema}.${
        this._table
      } ${optionsQuery}${isWhere} (${this._searchOptionsToQuery(
        " '%' || ",
        " || '%'",
        columns,
        arrayOfWordsInQuery.length,
      )}) LIMIT ${limit - (searchableObjects === undefined ? 0 : searchableObjects.length)};`;
      const resEverySimilar = await this._client.query(everySimilar, currentQuery);
      this.addUnique(searchableObjects, resEverySimilar.rows);
    }

    return searchableObjects;
  }
}
