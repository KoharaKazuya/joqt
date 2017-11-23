// core

export interface Action {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export interface Reducer<S, A extends Action> {
  (state: S, actionPayload?: A['payload']): S | Promise<S>;
}

export interface Store<S, A extends Action = Action> {
  getState(): S;
  dispatch(action: A): void;
  subscribe(listener: () => void): void;
}

export type MapStateAndActionTypeToReducer<A extends Action> = {
  [key: string]: Reducer<any, A>;
}

export function createStore<S, A extends Action = Action>(map: MapStateAndActionTypeToReducer<A>): Promise<Store<S>>;
