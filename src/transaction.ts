import { Action, PartialDeep, Reducer } from "../index.d";

// We shoud not depend on environments (the different browsers or node).
// Joqt, however, requires the below types.
declare const console: {
  info(...args: any[]): void;
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
};

function isIterator<T>(x: any): x is Iterator<T> | AsyncIterator<T> {
  return typeof x === "object" && typeof x.next === "function";
}

export function createTransaction<S, A extends Action>(
  reducer: Reducer<PartialDeep<S>, A>,
  payload: A["payload"],
  getState: () => PartialDeep<S>,
  setState: (s: PartialDeep<S>) => void,
): () => Promise<void> {
  return async () => {
    const oldPartialState = getState();
    const reducerRet = reducer(oldPartialState, payload);

    try {
      if (isIterator<PartialDeep<S>>(reducerRet)) {
        // for await (const newState of reducerRet) {
        //   setState(newState);
        // }
        while (true) {
          const next = await reducerRet.next();
          setState(next.value);
          if (next.done) { break; }
        }
      } else {
        const next = await reducerRet;
        setState(next);
      }
    } catch (err) {
      console.error(err);
      setState(oldPartialState);
    }
  };
}
