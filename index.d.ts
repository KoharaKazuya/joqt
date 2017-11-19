// core

export interface Action {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export interface Store<S> {
  getState(): S;
  subscribe(subscriber: (state: S) => void): void;
  dispatch(action: Action): void;
}

export type Reducer<S> = (state: S, action: Action) => S | Promise<S>;

export type ReducerTreeNode<S> = { [K in keyof S]: ReducerTree<S[K]> }
export type ReducerTree<S> = ReducerTreeNode<S> | Reducer<S>;

export function createStore<S>(tree: ReducerTree<S>, initialState: S): Promise<Store<S>>;

// utils

export function combineReducers<S>(tree: ReducerTree<S>): Reducer<S>;
export function getInitialState<S>(tree: ReducerTree<S>): Promise<S>;
