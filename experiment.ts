import { Entity, PostgrapeClient, Repository, RepositoryConfig, SearchableRepository } from 'postgrape';
import {
  Company,
  CompanyEmployeeView,
  CompanyGroup,
  CompanyRole,
  CompanyRoleView,
  Employee,
  EmployeeRole,
  EmployeeRoleView,
  Group,
  Partner,
  Role,
  VerificationCode,
} from '@app/entities';

const Rep = createRepositoryFactory(
  DFBundle,
  WBundle,
)

const SearchableRep = (table: string, rows: string[], config: RepositoryConfig) => createRepositoryFactory(
  DFBundle,
  SearchBundle(rows)
)(table, config)


export class DataClient extends PostgrapeClient {
  public companies = new SearchableRepository<Company>(
    { table: 'company', columnsForSearch: ['fiscal_id', 'vat', 'display_name', 'name'] },
    this._config,
  );
  public partners = new SearchableRepository<Partner>({ table: 'partner', columnsForSearch: ['label'] }, this._config);
  public employees = new Repository<Employee>('employee', this._config);
  // @ts-ignore
  public companyEmployeesView = new SearchableRepository<CompanyEmployeeView>(
    { table: 'company_employee_view', columnsForSearch: ['fiscal_id', 'vat', 'display_name', 'name'] },
    this._config,
  );
  public roles = new Repository<Role>('role', this._config);
  public employeeRoles = new Repository<EmployeeRole>('employee_role', this._config);
  public employeeRolesView = new Repository<EmployeeRoleView>('employee_role_view', this._config);
  public companyRoles = new Repository<CompanyRole>('company_role', this._config);
  public companyRolesView = new Repository<CompanyRoleView>('company_role_view', this._config);
  public group = new Repository<Group>('group', this._config);
  public companyGroups = new Repository<CompanyGroup>('company_group', this._config);

  public verificationCodes = new Repository<VerificationCode>('verification_code', this._config);

  public test = Rep('', this._config);
  public s = SearchableRep('', [], this._config);
  public r = createRepository<Employee>('', this._config).fromBundles(
    DFBundle,
    WBundle,
  )
}

type BundleFn = <TEntity extends Entity>(table: string, config:  RepositoryConfig, acc: any) => any;

type ReduceBundleReturnType<T extends BundleFn[], Result extends Record<never, never> = {}> = 
  T extends [infer Head, ...infer Rest extends BundleFn[]]
    ? Head extends BundleFn
      ? ReduceBundleReturnType<Rest, Result & ReturnType<Head>>
      : never
    : Result

function createRepositoryFromBundles<T extends BundleFn[]>(table: string, config: RepositoryConfig, ...bundles: T): ReduceBundleReturnType<T> {
  return bundles.reduceRight((acc: any, cur: BundleFn) => cur(table, config, acc), {})();
}

function createRepository<TEntity extends Entity>(table: string, config: RepositoryConfig) {
  const rep = {
    fromBundles: <T extends BundleFn[]>(...bundles: T): ReduceBundleReturnType<T> =>
      bundles.reduceRight((acc: any, cur: BundleFn) => cur<TEntity>(table, config, acc), {})()
  };
  return rep;
}

function createRep<TEntity extends Entity>(cl: TEntity, config: RepositoryConfig) {
  const rep = {
    fromBundles: <T extends BundleFn[]>(...bundles: T): ReduceBundleReturnType<T> =>
      bundles.reduceRight((acc: any, cur: BundleFn) => cur<TEntity>(table, config, acc), {})()
  };
  return rep;
}

function createRepositoryFactory<T extends BundleFn[]>(...bundles: T): (table: string, config: RepositoryConfig) => ReduceBundleReturnType<T> {
  return (table: string, config: RepositoryConfig) => bundles.reduceRight((acc: any, cur: BundleFn) => cur(table, config, acc), {});
}

function DFBundle<TEntity extends Entity, TAcc>(table: string, config: RepositoryConfig, acc: TAcc) {
  return {
    ...acc,
    findMany: (id: number): TEntity | undefined => undefined,
    create: (id: number, entity: any) => table
  }
}

function WBundle<T>(table: string, config: RepositoryConfig, acc: T) {
  return {
    ...acc,
    findById: (id: number) => 7,
    updateById: (id: number, entity: any) => 7
  }
}

function SearchBundle(rows: string[]) {
  return <T>(table: string, config: RepositoryConfig, acc: T) => ({
    ...acc,
    search: (query: string) => 7,
  })
}

type A = {
  id: number;
  str: string;
}

const rep = createRepository<A>('table', {} as unknown as RepositoryConfig).fromBundles(
  DFBundle,
  WBundle,
  SearchBundle([])
)

rep.findMany(4)

const re = createRepositoryFromBundles('', {} as unknown as RepositoryConfig, 
  DFBundle,
  WBundle,
)

