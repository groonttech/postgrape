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
        await repository.search('foo_name', ['foo']);
        expect(mockQueryMethod.mock.calls[0][0]).toEqual("SELECT * FROM public.test WHERE foo ILIKE 'foo_name' || '%';");
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE foo ILIKE '%' || 'foo_name' || '%' LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[2][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (longest_common_substring(LOWER(public.test.foo::text), LOWER('foo_name'))) > 1 DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[3][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (demerau_levenshtein_distance(LOWER(public.test.foo::text), LOWER('foo_name'))) DESC LIMIT 8;",
        );
      });

      test('when check with several search columns', async () => {
        await repository.search('foo_name', ['foo', 'bar']);
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE foo ILIKE 'foo_name' || '%' AND bar ILIKE 'foo_name' || '%';",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE foo ILIKE '%' || 'foo_name' || '%' AND bar ILIKE '%' || 'foo_name' || '%' LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[2][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (longest_common_substring(LOWER(public.test.foo::text), LOWER('foo_name'))) > 1 DESC, (longest_common_substring(LOWER(public.test.bar::text), LOWER('foo_name'))) > 1 DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[3][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (demerau_levenshtein_distance(LOWER(public.test.foo::text), LOWER('foo_name'))) DESC, (demerau_levenshtein_distance(LOWER(public.test.bar::text), LOWER('foo_name'))) DESC LIMIT 8;",
        );
      });

      test('when there are SELECT options', async () => {
        await repository.search('foo_name', ['foo'], { where: { id: 1 } });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND foo ILIKE 'foo_name' || '%';",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND foo ILIKE '%' || 'foo_name' || '%' LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[2][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 ORDER BY (longest_common_substring(LOWER(public.test.foo::text), LOWER('foo_name'))) > 1 DESC LIMIT 8;",
        );
        expect(mockQueryMethod.mock.calls[3][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 ORDER BY (demerau_levenshtein_distance(LOWER(public.test.foo::text), LOWER('foo_name'))) DESC LIMIT 8;",
        );
      });

      test('when there are LIMIT options', async () => {
        await repository.search('foo_name', ['foo'], { limit: 8 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual("SELECT * FROM public.test WHERE foo ILIKE 'foo_name' || '%';");
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE foo ILIKE '%' || 'foo_name' || '%' LIMIT 6;",
        );
        expect(mockQueryMethod.mock.calls[2][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (longest_common_substring(LOWER(public.test.foo::text), LOWER('foo_name'))) > 1 DESC LIMIT 6;",
        );
        expect(mockQueryMethod.mock.calls[3][0]).toEqual(
          "SELECT * FROM public.test  ORDER BY (demerau_levenshtein_distance(LOWER(public.test.foo::text), LOWER('foo_name'))) DESC LIMIT 6;",
        );
      });

      test('when there are complex options', async () => {
        await repository.search('foo_name', ['foo'], { where: { id: 1 }, limit: 8 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND foo ILIKE 'foo_name' || '%';",
        );
        expect(mockQueryMethod.mock.calls[1][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 AND foo ILIKE '%' || 'foo_name' || '%' LIMIT 6;",
        );
        expect(mockQueryMethod.mock.calls[2][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 ORDER BY (longest_common_substring(LOWER(public.test.foo::text), LOWER('foo_name'))) > 1 DESC LIMIT 6;",
        );
        expect(mockQueryMethod.mock.calls[3][0]).toEqual(
          "SELECT * FROM public.test WHERE id = 1 ORDER BY (demerau_levenshtein_distance(LOWER(public.test.foo::text), LOWER('foo_name'))) DESC LIMIT 6;",
        );
      });
    });
  });
});
