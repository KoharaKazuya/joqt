import {
  Action,
  MapStateAndActionTypeToReducer,
  Reducer,
  Store,
} from "../index.d";

export async function createStore<S, A extends Action = Action>(
  map: MapStateAndActionTypeToReducer<A>,
): Promise<Store<S>> {

  let state: S = undefined as any;
  const listeners: Array<() => void> = [];
  const transactions: { [key: string]: Promise<void> } = {};

  const getState = (keys: string[], self: any): any => {
    if (keys.length === 0) { return self; }
    if (typeof self !== "object") { self = {}; }
    return getState(keys.slice(1), self[keys[0]]);
  };

  const setState = (keys: string[], value: any): void => {
    if (keys.length === 0) { state = value; return; }

    if (typeof state !== "object") { state = {} as any; }
    let target: any = state;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (typeof target[k] !== "object") { target[k] = {}; }
      target = target[k];
    }
    target[keys[keys.length - 1]] = value;
  };

  const handleAction = (action: A | { type: "init" }): void => {
    const keys = Object.keys(map)
      .filter((k) => k.endsWith(`#${ action.type }`))
      .sort((a, b) => a.length - b.length);
    for (const k of keys) {
      const stateKeys = k.split("#")[0].split(".").filter((s) => s);
      const stateKeyStr = stateKeys.join(".");
      transactions[stateKeyStr] = handleNewTransaction(stateKeyStr, async () => {
        const oldState = getState(stateKeys, state);
        const newState = await map[k](oldState);
        setState(stateKeys, newState);
      });
    }
  };
  const handleNewTransaction = async (key: string, transaction: () => Promise<void>): Promise<void> => {
    const ancestorTransaction = Object.keys(transactions).filter((k) => key.startsWith(k));
    const descendantTransactions = Object.keys(transactions).filter((k) => k.startsWith(key));
    const transactionsToWait = [...ancestorTransaction, ...descendantTransactions].map((k) => transactions[k]);
    await Promise.all(transactionsToWait);

    await transaction();

    listeners.forEach((l) => l());
  };

  const store: Store<S> = {
    getState(): S {
      return state;
    },
    dispatch(action: A): void {
      handleAction(action);
    },
    subscribe(listener: () => void): void {
      listeners.push(listener);
    },
  };

  // initialize
  handleAction({ type: "init" });
  await Promise.all(Object.keys(transactions).map((k) => transactions[k]));

  return store;
}
