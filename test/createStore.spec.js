const { createStore, getInitialState } = require('../lib');

describe('createStore', () => {
  it('receives a function', async done => {
    await createStore(() => {});
    done();
  });

  it('receives a reducer tree', () => {
    const reducerTree = {
      substate: () => {},
      subtree: { s: () => {} }
    };

    expect(createStore(reducerTree)).resolves.toBeTruthy();
  });

  it('receives an initial state', async () => {
    const initialState = { initial: 'state' };
    const store = await createStore(() => {}, initialState);
    expect(store.getState()).toEqual(initialState);
  });

  it('returns the same structure state with reducer tree', async () => {
    const reducerTree = {
      a: () => {},
      b: {
        c: () => {},
        d: () => {}
      },
      e: {}
    };
    const store = await createStore(reducerTree);
    const state = store.getState();

    expect(Object.keys(state)).toEqual(['a', 'b', 'e']);
    expect(Object.keys(state.b)).toEqual(['c', 'd']);
    expect(Object.keys(state.e)).toEqual([]);
  });
});
