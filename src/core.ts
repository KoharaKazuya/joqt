import { Action, Store, Reducer, ReducerTreeNode, ReducerTree } from '../index.d';
import { getInitialState } from './utils/getInitialState';

abstract class BaseStore<S> implements Store<S> {

  private subscribers: ((state: S) => void)[] = [];

  public abstract getState(): S;

  public subscribe(subscriber: (state: S) => void): void {
    this.subscribers.push(subscriber);
  }

  public abstract dispatch(action: Action): void;

  protected emit(): void {
    for (let s of this.subscribers) {
      s(this.getState());
    }
  }
}

class LeafStore<S> extends BaseStore<S> {

  private state: S;
  private taskQueue: Promise<S>;

  private constructor(private reducer: Reducer<S>, initialState: S) {
    super();
    this.state = initialState;
    this.taskQueue = Promise.resolve(initialState);
  }

  public static async create<S>(reducer: Reducer<S>, initialState: S): Promise<LeafStore<S>> {
    return new LeafStore<S>(reducer, initialState);
  }

  public getState(): S {
    return this.state;
  }

  public dispatch(action: Action): void {
    this.taskQueue = this.taskQueue.then(async state => {
      try {
        return await this.reducer(state, action);
      } catch (err) {
        console.error(err);
        return state;
      }
    });
    this.taskQueue.then((state) => {
      this.state = state;
      this.emit();
    });
  }

}

class NodeStore<S> extends BaseStore<S> {

  private children: { [K in keyof S]: Store<S[K]> };

  private constructor() {
    super();
  }

  public static async create<S>(tree: ReducerTreeNode<S>, initialState: S): Promise<NodeStore<S>> {
    const instance = new NodeStore<S>();
    await instance.initializeChildren(tree, initialState);
    return instance;
  }

  public getState(): S {
    const state: S = {} as any;
    for (let key in this.children) {
      state[key] = this.children[key].getState();
    }
    return state;
  }

  public dispatch(action: Action): void {
    for (let key in this.children) {
      this.children[key].dispatch(action);
    }
  }

  private async initializeChildren(tree: ReducerTreeNode<S>, initialState: S): Promise<void> {
    const keys = Object.keys(tree) as (keyof S)[];
    const values = await Promise.all(keys.map(key => createStore(tree[key], initialState[key])));

    this.children = {} as any;
    for (let i = 0; i < keys.length; i++) {
      this.children[keys[i]] = values[i];
      this.children[keys[i]].subscribe(() => this.emit());
    }
  }
}

export async function createStore<S>(tree: ReducerTree<S>, initialState?: S): Promise<Store<S>> {
  if (initialState === undefined) { initialState = await getInitialState(tree); }
  if (typeof tree === 'function') { return LeafStore.create(tree, initialState); }
  if (typeof tree === 'object') { return NodeStore.create(tree, initialState); }
  throw new Error('Unknown type: ' + typeof tree);
}
