import { PoolClient } from 'pg';
import { Entity } from '../entity.interface';
import { SearchableRepositoryConfig } from './searchable-repository-config.interface';
import { SearchableRepository } from './searchable-repository';
import { SearchableRepositoryOptions } from './searchable-repository-options.interface';

interface MockEntity extends Entity {
  foo?: string;
  bar?: number;
}

describe('SearchableRepository', () => {
  let repository: SearchableRepository<MockEntity>;
  let mockQueryMethod: jest.Mock;

  beforeEach(() => {
    mockQueryMethod = jest.fn((query: string, values: any[]) => Promise.resolve({ rows: [{ id: 1 }, { id: 2 }] }));
    const mockPoolClient = {
      query: mockQueryMethod,
    };
    const mockRepositoryConfig: SearchableRepositoryConfig = {
      client: mockPoolClient as unknown as PoolClient,
      defaultSchema: 'public',
    };
    const mockRepositoryOptions: SearchableRepositoryOptions<MockEntity> = {
      table: 'test',
      columnsForSearch: [],
    };
    repository = new SearchableRepository(mockRepositoryOptions, mockRepositoryConfig);
  });

  describe('search() method', () => {
    describe('should generate valid query', () => {
      test('if query is empty', async () => {
        await repository.search('', { columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual('SELECT * FROM public.test  ORDER BY \"id\" ASC LIMIT 10;');
      });

      test('when check with one search column', async () => {
        await repository.search('foo_name', { columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC LIMIT 10;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when check with several search columns', async () => {
        await repository.search('foo_name', { columnsForSearch: ['foo', 'bar'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%' OR bar ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC, bar ILIKE $1 || '%' DESC LIMIT 10;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when there are SELECT options', async () => {
        await repository.search('foo_name', { where: { id: 1 }, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC LIMIT 10;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when there are ORDER BY options', async () => {
        await repository.search('foo_name', { orderBy: { foo: 'DESC' }, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%') ORDER BY \"foo\" DESC, foo ILIKE $1 || '%' DESC LIMIT 10;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when there are LIMIT options', async () => {
        await repository.search('foo_name', { limit: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when there are OFFSET options', async () => {
        await repository.search('foo_name', { offset: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC OFFSET 8 LIMIT 10;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });

      test('when there are search string with several words', async () => {
        await repository.search('foo name', { limit: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' || $1 || '%' OR foo ILIKE '%' || $2 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC, foo ILIKE $2 || '%' DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo', 'name']);
      });

      test('when there are complex options', async () => {
        await repository.search('foo_name', { where: { id: 1 }, limit: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE '%' || $1 || '%') ORDER BY \"id\" ASC, foo ILIKE $1 || '%' DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
      });
    });
  });
});
