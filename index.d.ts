export interface Action {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export type Reducer<S, A extends Action> =
  | FunctionReducer<S, A>
  | AsyncReducer<S, A>
  | GeneratorFunctionReducer<S, A>
  | AsyncGeneratorFunctionReducer<S, A>
  ;
interface FunctionReducer<S, A extends Action> {
  (state?: S, actionPayload?: A['payload']): S;
}
interface GeneratorFunctionReducer<S, A extends Action> {
  (state?: S, actionPayload?: A['payload']): IterableIterator<S>;
}
interface AsyncReducer<S, A extends Action> {
  (state?: S, actionPayload?: A['payload']): Promise<S>;
}
interface AsyncGeneratorFunctionReducer<S, A extends Action> {
  (state?: S, actionPayload?: A['payload']): AsyncIterableIterator<S>;
}

export interface Store<S, A extends Action = Action> {
  getState(): S | undefined;
  dispatch(action: A): void;
  subscribe(listener: () => void): void;
}

export type PartialDeep<T> = {
  [P in keyof T]?: PartialDeep<T[P]>;
} | undefined;
export interface TransactionHandler<S, A extends Action> {
  type: A['type'];
  paths: string[];
  reducer: Reducer<PartialDeep<S>, A>;
}
export function createStore<S, A extends Action = Action>(handlers: Array<TransactionHandler<S, A>>): Promise<Store<S>>;
