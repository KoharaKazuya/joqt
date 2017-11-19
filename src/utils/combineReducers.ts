import { Reducer, ReducerTree } from '../../index.d';

export function combineReducers<S>(tree: ReducerTree<S>): Reducer<S> {
  if (typeof tree === 'function') { return tree; }
  if (typeof tree === 'object') {
    return async () => {
      const keys: (keyof S)[] = Object.keys(tree) as any;
      const resolves = await Promise.all(keys.map(k => combineReducers(tree[k])));

      const state: any = {};
      for (let i = 0; i < keys.length; i++) {
        state[keys[i]] = resolves[i];
      }
      return state as S;
    };
  }
  throw new Error('Unknown type: ' + typeof tree);
}
