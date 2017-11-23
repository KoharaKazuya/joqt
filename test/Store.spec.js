const { createStore } = require('../lib');

describe('Store', () => {
  describe('with no child', () => {
    it('publishes state changes', async done => {
      const store = await createStore({
        '#increment': s => s
      });
      store.subscribe(() => done());
      store.dispatch({ type: 'increment' });
    });

    it('has an initial state', async () => {
      const store = await createStore({
        '#init': (state = Promise.resolve('initialState')) => state
      });
      expect(store.getState()).toEqual('initialState');
    });

    it('receive actions and then resolves asynchronously', async done => {
      const increment = (state = 0) =>
        new Promise(resolve => setTimeout(() => resolve(state + 1)), 1);
      const store = await createStore({ '#increment': increment });
      store.subscribe(() => {
        if (store.getState() === 3) {
          done();
        }
      });

      store.dispatch({ type: 'increment' });
      store.dispatch({ type: 'increment' });
      store.dispatch({ type: 'increment' });
    });

    it('returns the previous state until transaction resolved', async () => {
      let resolveTransaction;
      const init = (state = 0) => state;
      const increment = state =>
        new Promise(resolve => {
          resolveTransaction = () => resolve(state + 1);
        });
      const store = await createStore({
        '#init': init,
        '#increment': increment
      });

      store.dispatch({ type: 'increment' });
      await new Promise(r => setTimeout(r, 10));
      expect(store.getState()).toEqual(0);

      resolveTransaction();
      await new Promise(r => setTimeout(r, 10));
      expect(store.getState()).toEqual(1);
    });
  });

  describe('with children', () => {
    it('has an initial state', async () => {
      const store = await createStore({
        'a#init': (state = 'initialChildState') => state,
        'b#init': (state = Promise.resolve('ok')) => state
      });
      expect(store.getState()).toEqual({ a: 'initialChildState', b: 'ok' });
    });

    it('runs each transactions separately', async done => {
      let store;
      const reducerTree = {
        '#init': () => ({ a: 0, b: 0 }),
        'a#long': (state = 0) => {
          return new Promise(resolve =>
            setTimeout(() => resolve(state + 1), 10000)
          );
        },
        'b#short': (state = 0) => {
          expect(store.getState().a).toBe(0);
          done();
        }
      };
      store = await createStore(reducerTree);
      store.dispatch({ type: 'long' });
      store.dispatch({ type: 'short' });
    });

    it('has consistency eventually', async done => {
      const reducerTree = {
        'a#increment': (state = 0) => {
          return new Promise(resolve =>
            setTimeout(() => resolve(state + 1), 10)
          );
        },
        'b#increment': (state = 0) => state + 1
      };
      const store = await createStore(reducerTree);
      store.subscribe(() => {
        const state = store.getState();
        if (state.a === 3 && state.b === 3) {
          done();
        }
      });
      store.dispatch({ type: 'increment' });
      store.dispatch({ type: 'increment' });
      store.dispatch({ type: 'increment' });
    });

    it('exclusively runs transactions of parent and child', async () => {
      const store = await createStore({
        'a#1': () =>
          new Promise(resolve => setTimeout(() => resolve({ b: 1 }), 10)),
        '#2': ({ a: { b } }) =>
          Promise.resolve({
            a: {
              b: b + 1
            }
          }),
        'a.b#3': state => {
          expect(state).toEqual(2);
        }
      });
      store.dispatch({ type: '1' });
      store.dispatch({ type: '2' });
      store.dispatch({ type: '3' });
    });
  });
});
