const { createStore, getInitialState } = require('../lib');

describe('Store', () => {
  it('has an initial state', async () => {
    const reducer = () => {};
    const store = await createStore({ leaf: reducer }, { leaf: 'initial' });

    expect(store.getState()).toEqual({ leaf: 'initial' });
  });

  it('receive actions and then resolves asynchronously', async done => {
    const reducer = (state = 0, action) => {
      if (action.type === 'increment') {
        return new Promise(resolve => setTimeout(() => resolve(state + 1)), 1);
      }
      return state;
    };
    const store = await createStore(reducer);
    store.subscribe(state => {
      if (state === 3) {
        done();
      }
    });

    store.dispatch({ type: 'increment' });
    store.dispatch({ type: 'increment' });
    store.dispatch({ type: 'increment' });
  });

  it('publishes chilren changes', async () => {
    const reducerTree = {
      child: (state = 0, action) => {
        if (action.type === 'increment') return state + 1;
        return state;
      }
    };
    const store = await createStore(reducerTree);
    store.subscribe(state => expect(state.child).toBe(1));
    store.dispatch({ type: 'increment' });
  });

  it('runs each transactions separately', async () => {
    let store;
    const reducerTree = {
      a: (state = 0, action) => {
        if (action.type === 'increment')
          return new Promise(resolve =>
            setTimeout(() => resolve(state + 1), 10)
          );
        return state;
      },
      b: (state = 0, action) => {
        if (action.type === 'increment') {
          expect(store.getState().a).toBe(0);
        }
        return state;
      }
    };
    store = await createStore(reducerTree);
    store.dispatch({ type: 'increment' });
  });

  it('has consistency eventually', async done => {
    const reducerTree = {
      a: (state = 0, action) => {
        if (action.type === 'increment')
          return new Promise(resolve =>
            setTimeout(() => resolve(state + 1), 10)
          );
        return state;
      },
      b: (state = 0, action) => {
        if (action.type === 'increment') {
          return state + 1;
        }
        return state;
      }
    };
    const store = await createStore(reducerTree);
    store.subscribe(state => {
      if (state.a === 3 && state.b === 3) {
        done();
      }
    });
    store.dispatch({ type: 'increment' });
    store.dispatch({ type: 'increment' });
    store.dispatch({ type: 'increment' });
  });
});
