/**
 * Where operators.
 */
export interface OpTypes {
  readonly and: symbol;
  readonly or: symbol;
  readonly eq: symbol;
  readonly ne: symbol;
  readonly gt: symbol;
  readonly lt: symbol;
  readonly gte: symbol;
  readonly lte: symbol;
  readonly is: symbol;
  readonly not: symbol;
}
export const Op: OpTypes = {
  and: Symbol.for('AND'),
  or: Symbol.for('OR'),

  eq: Symbol.for('='),
  ne: Symbol.for('!='),
  gt: Symbol.for('>'),
  lt: Symbol.for('<'),
  gte: Symbol.for('>='),
  lte: Symbol.for('<='),
  is: Symbol.for('IS'),
  not: Symbol.for('IS NOT'),
};
