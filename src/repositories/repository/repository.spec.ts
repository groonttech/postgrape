import { PoolClient } from 'pg';
import { RepositoryConfig } from './repository-config.interface';
import { Repository } from './repository';
import { Entity } from '../entity.interface';
import { Op } from '../operators';
import { InvalidArgumentsException } from '../../exceptions';
import { FindOneOptions } from './query-options.interface';

interface MockEntity extends Entity {
  foo?: string;
  bar?: number;
}

describe('Repository', () => {
  let repository: Repository<MockEntity>;
  let mockQueryMethod: jest.Mock;

  beforeEach(() => {
    mockQueryMethod = jest.fn((query: string, values: any[]) => Promise.resolve({ rows: [{ id: 1 }, { id: 2 }] }));
    const mockPoolClient = {
      query: mockQueryMethod,
    };
    const mockRepositoryConfig: RepositoryConfig = {
      client: mockPoolClient as unknown as PoolClient,
      defaultSchema: 'public',
    };
    repository = new Repository('test_table', mockRepositoryConfig);
  });

  describe('find() method', () => {
    test('should return an array of entities', async () => {
      const result = await repository.find({});
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    describe('should generate valid query', () => {
      test('when options is empty', async () => {
        await repository.find({});
        expect(mockQueryMethod.mock.calls[0][0]).toEqual('SELECT * FROM public."test_table" ORDER BY "id" ASC');
      });

      test('when there are simple WHERE options', async () => {
        await repository.find({ where: { bar: 6 } });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT * FROM public."test_table" WHERE bar = 6 ORDER BY "id" ASC',
        );
      });

      test('when there are complex WHERE options', async () => {
        await repository.find({
          where: {
            bar: 6,
            foo: ['test', 'strings'],
            id: {
              [Op.gt]: 2,
            },
            [Op.or]: [{ id: 5 }, { id: 9 }],
          },
        });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT * FROM public."test_table" WHERE (bar = 6 AND (foo = \'test\' OR foo = \'strings\') AND id > 2 AND (id = 5 OR id = 9)) ORDER BY "id" ASC',
        );
      });

      test('when there are ORDER BY options', async () => {
        await repository.find({ orderBy: { id: 'DESC', bar: 'ASC' } });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT * FROM public."test_table" ORDER BY "id" DESC, "bar" ASC',
        );
      });

      test('when there are LIMIT options', async () => {
        await repository.find({ limit: 5 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual('SELECT * FROM public."test_table" ORDER BY "id" ASC LIMIT 5');
      });

      test('when there are OFFSET options', async () => {
        await repository.find({ offset: 20 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT * FROM public."test_table" ORDER BY "id" ASC OFFSET 20',
        );
      });

      test('when there are SELECT options', async () => {
        await repository.find({ select: ['bar', 'id'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual('SELECT bar, id FROM public."test_table" ORDER BY "id" ASC');
      });

      test('when there are complex options', async () => {
        await repository.find({
          select: ['id', 'foo'],
          where: {
            bar: 6,
            foo: ['test', 'strings'],
            id: {
              [Op.gt]: 2,
            },
            [Op.or]: [{ id: 5 }, { id: 9 }],
          },
          orderBy: {
            bar: 'ASC',
            foo: 'DESC',
          },
          offset: 10,
          limit: 5,
        });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT id, foo FROM public."test_table" WHERE (bar = 6 AND (foo = \'test\' OR foo = \'strings\') AND id > 2 AND (id = 5 OR id = 9)) ORDER BY "bar" ASC, "foo" DESC OFFSET 10 LIMIT 5',
        );
      });
    });
  });

  describe('findOne() method', () => {
    test('should return one entity', async () => {
      const result = await repository.findOne({});
      expect(result).toEqual({ id: 1 });
    });

    describe('should generate valid query', () => {
      test('when options is empty', async () => {
        await repository.findOne({});
        expect(mockQueryMethod.mock.calls[0][0]).toEqual('SELECT * FROM public."test_table" ORDER BY "id" ASC LIMIT 1');
      });

      test('when there are several options', async () => {
        await repository.findOne({
          select: ['bar'],
          where: { bar: 6 },
          orderBy: { id: 'DESC' },
          offset: 10,
        });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT bar FROM public."test_table" WHERE bar = 6 ORDER BY "id" DESC OFFSET 10 LIMIT 1',
        );
      });

      test('when there is already the LIMIT in the options', async () => {
        await repository.findOne({
          offset: 10,
          limit: 50,
        } as FindOneOptions<MockEntity>);
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'SELECT * FROM public."test_table" ORDER BY "id" ASC OFFSET 10 LIMIT 1',
        );
      });
    });
  });

  describe('findById() method', () => {
    test('should return one entity', async () => {
      const result = await repository.findById(1);
      expect(result).toEqual({ id: 1 });
    });

    test('should generate valid query', async () => {
      await repository.findById(1);
      expect(mockQueryMethod.mock.calls[0][0]).toEqual(
        'SELECT * FROM public."test_table" WHERE id = 1 ORDER BY "id" ASC LIMIT 1',
      );
    });

    test('should generate valid query with SELECT options', async () => {
      await repository.findById(1, { select: ['bar', 'id', 'foo'] });
      expect(mockQueryMethod.mock.calls[0][0]).toEqual(
        'SELECT bar, id, foo FROM public."test_table" WHERE id = 1 ORDER BY "id" ASC LIMIT 1',
      );
    });
  });

  describe('create() method', () => {
    test('should return one entity', async () => {
      const result = await repository.create({});
      expect(result).toEqual({ id: 1 });
    });

    describe('should throw exception', () => {
      test('when invalid argument', async () => {
        expect(async () => await repository.create(undefined as unknown as MockEntity)).rejects.toThrowError(
          InvalidArgumentsException,
        );
      });
    });

    describe('should generate valid query', () => {
      test('when there is one field', async () => {
        await repository.create({ foo: 'test' });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'INSERT INTO public."test_table" ("foo") VALUES ($1) RETURNING *',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test']);
      });

      test('when there are several fields', async () => {
        await repository.create({ foo: 'test', bar: 4 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'INSERT INTO public."test_table" ("foo", "bar") VALUES ($1, $2) RETURNING *',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test', 4]);
      });

      test('when there are RETURNING options', async () => {
        await repository.create({ foo: 'test', bar: 4 }, { returning: ['id'] });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'INSERT INTO public."test_table" ("foo", "bar") VALUES ($1, $2) RETURNING id',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test', 4]);
      });
    });
  });

  describe('update() method', () => {
    test('should return an array of entities', async () => {
      const result = await repository.update({}, {});
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    describe('should throw exception', () => {
      test('when invalid argument', async () => {
        expect(async () => await repository.update({}, undefined as unknown as MockEntity)).rejects.toThrowError(
          InvalidArgumentsException,
        );
      });
    });

    describe('should generate valid query', () => {
      test('when there is one field', async () => {
        await repository.update({ where: { bar: 4 } }, { foo: 'test' });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'UPDATE public."test_table" SET "foo"=$1 WHERE bar = 4 RETURNING *',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test']);
      });

      test('when there are several fields', async () => {
        await repository.update({ where: { bar: 4, id: { [Op.gt]: 34 } } }, { foo: 'test', bar: 4 });
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'UPDATE public."test_table" SET "foo"=$1, "bar"=$2 WHERE (bar = 4 AND id > 34) RETURNING *',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test', 4]);
      });

      test('when there are RETURNING options', async () => {
        await repository.update(
          { where: { bar: 4, id: { [Op.gt]: 34 } }, returning: ['bar', 'foo'] },
          { foo: 'test', bar: 4 },
        );
        expect(mockQueryMethod.mock.calls[0][0]).toEqual(
          'UPDATE public."test_table" SET "foo"=$1, "bar"=$2 WHERE (bar = 4 AND id > 34) RETURNING bar, foo',
        );
        expect(mockQueryMethod.mock.calls[0][1]).toEqual(['test', 4]);
      });
    });
  });

  describe('updateById() method', () => {
    test('should return one entity', async () => {
      const result = await repository.updateById(1, {});
      expect(result).toEqual({ id: 1 });
    });

    test('should generate valid query', async () => {
      await repository.updateById(1, { foo: 'test' });
      expect(mockQueryMethod.mock.calls[0][0]).toEqual(
        'UPDATE public."test_table" SET "foo"=$1 WHERE id = 1 RETURNING *',
      );
    });

    test('should generate valid query with RETURNING options', async () => {
      await repository.updateById(1, { foo: 'test' }, { returning: ['bar', 'id'] });
      expect(mockQueryMethod.mock.calls[0][0]).toEqual(
        'UPDATE public."test_table" SET "foo"=$1 WHERE id = 1 RETURNING bar, id',
      );
    });
  });
});
