import { ReducerTree } from '../../index.d';

const init = { type: '@@/INIT' };

export async function getInitialState<S>(tree: ReducerTree<S>): Promise<S> {
  if (typeof tree === 'function') { return tree(undefined as any, init); }

  const keys = Object.keys(tree) as (keyof S)[];
  const values = await Promise.all(keys.map(k => getInitialState(tree[k])));

  const state = {} as S;
  for (let i = 0; i < keys.length; i++) {
    state[keys[i]] = values[i] as any;
  }
  return state;
}
