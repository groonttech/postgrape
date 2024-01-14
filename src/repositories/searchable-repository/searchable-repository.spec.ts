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

  describe('createMultiple() method', () => {
    describe('should generate valid query', () => {
      test('when check with one search column', async () => {
        await repository.search('foo_name', {columnsForSearch: ['foo']});
        expect(mockQueryMethod.mock.calls[0][0]).toEqual("SELECT * FROM public.test WHERE (foo ILIKE $1 || '%');");
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' ||  $1 || '%') LIMIT 8;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo_name']);
      });

      test('when check with several search columns', async () => {
        await repository.search('foo_name', {columnsForSearch: ['foo', 'bar']});
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE $1 || '%') OR (bar ILIKE $1 || '%');",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' ||  $1 || '%') OR (bar ILIKE '%' ||  $1 || '%') LIMIT 8;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo_name']);
      });

      test('when there are SELECT options', async () => {
        await repository.search('foo_name', { where: { id: 1 }, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE $1 || '%');",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE '%' ||  $1 || '%') LIMIT 8;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo_name']);
      });

      test('when there are LIMIT options', async () => {
        await repository.search('foo_name', { limit: 8, columnsForSearch: ['foo']  });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual("SELECT * FROM public.test WHERE (foo ILIKE $1 || '%');");
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' ||  $1 || '%') LIMIT 6;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo_name']);
      });

      test('when there are search string with several words', async () => {
        await repository.search('foo name', { limit: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE $1 || '%' AND foo ILIKE $2 || '%');",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE (foo ILIKE '%' ||  $1 || '%' AND foo ILIKE '%' ||  $2 || '%') LIMIT 6;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo', 'name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo', 'name']);
      });

      test('when there are complex options', async () => {
        await repository.search('foo_name', { where: { id: 1 }, limit: 8, columnsForSearch: ['foo'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE $1 || '%');",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND (foo ILIKE '%' ||  $1 || '%') LIMIT 6;",
        );

        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['foo_name']);
        expect(mockQueryMethod.mock.calls[1][1]).toEqual(['foo_name']);
      });
    });
  });
});
