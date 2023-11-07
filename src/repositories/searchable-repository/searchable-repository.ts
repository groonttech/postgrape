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

  private _searchOptionsToQuery(prefix: string, sufix: string, columnsForSearch: string[], countSearchWords: number): string {
    const res = columnsForSearch.map(column => {
      const words = Array.from({ length: countSearchWords }, (_, j) => (
        `${column} ILIKE${prefix} $${j + 1}${sufix}`
      ));
      return words.join(' AND ');
    });

    return res.join(') OR (')
  }

  public async search(
    query: string,
    columnsForSearch?: (keyof TEntity)[],
    options?: SearchOptions<TEntity>,
  ): Promise<TEntity[]> {
    if (query === '') throw new InvalidArgumentsException();
    const columns = (columnsForSearch as string[]) || this._columnsForSearch;
    const limit = !options || !options.limit ? 10 : options.limit;
    let arrayOfWordsInQuery: string[] = query.split(/[\s,]+/); // divide query into words
    let arrayOfQuery: string[][] = [];

    for (let j = 0; j < columnsForSearch.length; j++) {
      arrayOfQuery.push(arrayOfWordsInQuery);
    }

    let searchableObjects: TEntity[];
    const optionsQuery = this._whereOptionsToQuery(options?.where);
    const isWhere = optionsQuery !== '' ? ' AND' : 'WHERE';

    for (let i = 0; i < arrayOfQuery.length; i++) {
      const startSimilar = `SELECT * FROM ${this._schema}.${
        this._table
      } ${optionsQuery}${isWhere} (${this._searchOptionsToQuery("", " || '%'", columns, arrayOfWordsInQuery.length)});`;

      const resStartSimilar = await this._client.query(startSimilar, arrayOfQuery[i]);

      searchableObjects = resStartSimilar.rows;
      
      const everySimilar = `SELECT * FROM ${this._schema}.${
        this._table
      } ${optionsQuery}${isWhere} (${this._searchOptionsToQuery(" '%' || ", " || '%'", columns, arrayOfWordsInQuery.length)}) LIMIT ${
        limit - (searchableObjects == undefined ? 0 : searchableObjects.length)
      };`;
      const resEverySimilar = await this._client.query(everySimilar, arrayOfQuery[i]);
      this.addUnique(searchableObjects, resEverySimilar.rows);
    }

    return searchableObjects
  }
}
