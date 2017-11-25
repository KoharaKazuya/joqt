import {
  Action,
  Reducer,
  Store,
  TransactionHandler,
} from "../index.d";
import { Exchange } from "./exchange";
import { StateTree } from "./state";
import { createTransaction } from "./transaction";

interface InitializeAction extends Action {
  type: "init";
}

export async function createStore<S, A extends Action = Action>(
  handlers: Array<TransactionHandler<S, A>>,
): Promise<Store<S>> {

  const state = new StateTree<S>();
  const listeners: Array<() => void> = [];
  const exchange = new Exchange();

  const notify = () => listeners.forEach((l) => l());

  const handleAction = (action: A | InitializeAction): void => {
    const targetHandlers = handlers
      .filter((h) => h.type === action.type);
    for (const h of targetHandlers) {
      const transaction = createTransaction(
        h.reducer as any,
        action.payload,
        () => state.getByPaths(h.paths) as any,
        (partialState: any) => {
          state.setByPaths(h.paths, partialState);
          notify();
        },
      );
      exchange.enqueueTransaction(h.paths, transaction);
    }
  };

  // initialize
  handleAction({ type: "init" });
  await exchange.waitAll();

  return {
    getState(): S | undefined {
      return state.getAll();
    },
    dispatch(action: A): void {
      handleAction(action);
    },
    subscribe(listener: () => void): void {
      listeners.push(listener);
    },
  };
}
