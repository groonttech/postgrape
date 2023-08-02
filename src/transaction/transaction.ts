import { BaseDataClient } from '../data-client';

const dataClientKey = Symbol('dataClient');

/**
 * The {@link Transaction Transaction} decorator requires an instance of the `DataClient` class as a method parameter, so DC decorator marks the position of this parameter for the {@link Transaction Transaction} decorator.
 */
export function DC() {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    Reflect.defineMetadata(dataClientKey, parameterIndex, target, propertyKey);
  };
}

/**
 * The Transaction decorator is a wrapper for service methods. It wraps the entire method in a "try catch finally" block. Thus it calls the data client's `begin()` method at the beginning, `rollback()` if there are any errors occurring in the wrapped method, and `release()` at the end. Also, it acquires and injects a new instance of the `DataClient` class to a {@link DC marked} parameter if `undefined` was provided.
 *
 * It is important to have an injected instance of the `DataProvider` interface with the field name `_dataProvider`.
 */
export function Transaction() {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const method = descriptor.value;
    descriptor.value = async function () {
      const dataClientId: number = Reflect.getOwnMetadata(dataClientKey, target, propertyKey);
      if (!dataClientId)
        throw Error('Transaction decorator require DataClient decorator on data client argument of method');

      if (!(this as any)._dataProvider)
        throw Error('Service class using @Transaction() decorator must implements an ITransactable interface');

      const dataClient: BaseDataClient = await (this as any)._dataProvider.getClientAndBegin(arguments[dataClientId]);
      arguments[dataClientId] = dataClient;
      arguments.length = arguments.length > dataClientId ? arguments.length : dataClientId + 1;

      try {
        const out = await method.apply(this, arguments);
        await dataClient.commit();
        return out;
      } catch (error) {
        await dataClient.rollback();
        throw error;
      } finally {
        dataClient.release();
      }
    };
  };
}
