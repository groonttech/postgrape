import { PostgrapeClient } from './client';
import { PostgrapeClientFactory } from './client-factory';

const clientSymbol = Symbol('PostgrapeClient');

/**
 * The `DC` decorator marks a parameter of a method within a service class that inherits from the `TransactableService` class as a data client. The {@link Transaction} decorator injects a new instance of the data client class, which inherits from the `PostgrapeClient` class, into the marked parameter, if that parameter was initially `undefined`.
 */
export function DC() {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
    Reflect.defineMetadata(clientSymbol, parameterIndex, target, propertyKey);
  };
}

/**
 * The `Transaction` decorator modifies the behavior of a method within a service class that inherits from the `TransactableService` class. It wraps the method in a database transaction, ensuring that the data client's transaction methods are called at the appropriate times.
 *
 * At the start of the method, the decorator starts transaction or sets new savepoint. If any errors occur during the execution of the method, it calls rollback. Regardless of whether an error occurs, it release the transaction or savepoint at the end of the method.
 *
 * The decorator also injects a new instance of the data client class, which inherits from the `PostgrapeClient` class, into a parameter marked with the {@link DC} decorator, if that parameter was initially `undefined`.
 *
 */
export function Transaction() {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const method = descriptor.value;
    descriptor.value = async function () {
      const clientId: number = Reflect.getOwnMetadata(clientSymbol, target, propertyKey);
      if (!clientId)
        throw Error('Transaction decorator require @DC() decorator on data client argument of method');

      const factory = (this as any)._postgrapeClientFactory as PostgrapeClientFactory | undefined;
      if (!factory)
        throw Error('Service class using @Transaction() decorator must extends "TransactableService" class');

      if (!arguments[clientId]) {
        arguments[clientId] = await factory.acquireClient<PostgrapeClient>();
        arguments.length = arguments.length > clientId ? arguments.length : clientId + 1;
      }

      const client = arguments[clientId] as PostgrapeClient;
      try {
        if (factory.useSavepoints) await client.beginOrSave();
        else await client.begin();
        const out = await method.apply(this, arguments);
        await client.commit();
        return out;
      } catch (error) {
        await client.rollbackToLatest();
        throw error;
      } finally {
        client.release();
      }
    };
  };
}
