import { PoolClient } from 'pg';
import { InvalidArgumentsException } from '../../exceptions';
import { Entity } from '../entity.interface';
import { MultipleRepositoryOptions } from './multiple-repository-options.interface';
import { MultipleRepositoryConfig } from './multiple-repository-config.interface';
import { MultipleRepository } from './multiple-repository';

interface MockEntity extends Entity {
  foo?: string;
  bar?: number;
}

describe('SubjectRepository', () => {
  let repository: MultipleRepository<MockEntity>;
  let mockQueryMethod: jest.Mock;

  beforeEach(() => {
    mockQueryMethod = jest.fn((query: string, values: any[]) => Promise.resolve({ rows: [{ id: 1 }, { id: 2 }] }));
    const mockPoolClient = {
      query: mockQueryMethod,
    };
    const mockRepositoryConfig: MultipleRepositoryConfig = {
      client: mockPoolClient as unknown as PoolClient,
      defaultSchema: 'public',
    };
    const mockRepositoryOptions: MultipleRepositoryOptions<MockEntity> = {
      table: 'test',
      argumentsSequence: ['foo', 'bar'],
    };
    repository = new MultipleRepository(mockRepositoryOptions, mockRepositoryConfig);
  });

  describe('createMultiple() method', () => {
    describe('should generate valid query', () => {
      test('when options is empty', async () => {
        await repository.createMultiple({ foo: 'test', bar: 1 }, 2);
        expect(mockQueryMethod.mock.calls[0][0]).toEqual("SELECT * FROM public.insert_multiple_test('test', 1, 2)");
      });

      test('when there are SELECT fixed options', async () => {
        await repository.createMultiple({ foo: 'test', bar: 1 }, 2, { select: ['bar', 'id'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          "SELECT bar, id FROM public.insert_multiple_test('test', 1, 2)",
        );
      });
    });
  });
});
