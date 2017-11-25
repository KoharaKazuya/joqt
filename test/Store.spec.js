const { createStore } = require('../lib');

describe('Store', () => {
  describe('with no child', () => {
    it('receives action payload', async done => {
      const store = await createStore([
        {
          type: 'add',
          paths: [''],
          reducer: async function*(state, payload) {
            expect(payload).toEqual(3);
            done();
          }
        }
      ]);
      store.dispatch({ type: 'add', payload: 3 });
    });

    it('publishes state changes', async done => {
      const store = await createStore([
        {
          type: 'increment',
          paths: [''],
          reducer: async function*(state) {
            return state;
          }
        }
      ]);
      store.subscribe(() => done());
      store.dispatch({ type: 'increment' });
    });

    it('receives undefined by init reducer', async () => {
      let initial = null;
      await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*(state) {
            initial = state;
            return state;
          }
        }
      ]);
      expect(initial).toEqual(undefined);
    });

    it('has an initial state', async () => {
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*(state = { m: 'initialState' }) {
            return state;
          }
        }
      ]);
      expect(store.getState()).toEqual({ m: 'initialState' });
    });

    it('replaces object at target path', async done => {
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*() {
            return { a: { b: 1 }, c: 2 };
          }
        },
        {
          type: 'replace',
          paths: [''],
          reducer: async function*() {
            return { a: null };
          }
        }
      ]);
      store.subscribe(() => {
        expect(store.getState()).toEqual({ a: null });
        done();
      });
      store.dispatch({ type: 'replace' });
    });

    it('receive actions and then resolves asynchronously', async done => {
      const store = await createStore([
        {
          type: 'increment',
          paths: [''],
          reducer: async function*(state = 0) {
            await new Promise(resolve => setTimeout(resolve), 1);
            return state + 1;
          }
        }
      ]);
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
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*(state = 0) {
            return state;
          }
        },
        {
          type: 'increment',
          paths: [''],
          reducer: async function*(state) {
            await new Promise(resolve => (resolveTransaction = resolve));
            return state + 1;
          }
        }
      ]);
      store.dispatch({ type: 'increment' });
      await new Promise(r => setTimeout(r, 10));
      expect(store.getState()).toEqual(0);
      resolveTransaction();
      await new Promise(r => setTimeout(r, 10));
      expect(store.getState()).toEqual(1);
    });

    it('rollbacks state by error', async done => {
      const consoleMock = jest.spyOn(console, 'error');
      consoleMock.mockImplementation(() => {});

      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*(state = 0) {
            return state;
          }
        },
        {
          type: 'increment',
          paths: [''],
          reducer: async function*(state) {
            throw new Error();
            return state + 1;
          }
        }
      ]);
      store.subscribe(() => {
        expect(store.getState()).toEqual(0);
        consoleMock.mockRestore();
        done();
      });
      store.dispatch({ type: 'increment' });
    });
  });

  describe('with children', () => {
    it('has an initial state', async () => {
      const store = await createStore([
        {
          type: 'init',
          paths: ['a'],
          reducer: async function*({ a = 'initialChildState' }) {
            return { a };
          }
        },
        {
          type: 'init',
          paths: ['b'],
          reducer: async function*({ b = 'ok' }) {
            return { b };
          }
        }
      ]);
      expect(store.getState()).toEqual({ a: 'initialChildState', b: 'ok' });
    });

    it('replaces values only at target path', async done => {
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*() {
            return { a: { b: 1 }, c: 2 };
          }
        },
        {
          type: 'replace',
          paths: ['a.b'],
          reducer: async function*() {
            return { a: { b: 2 }, c: 3 };
          }
        }
      ]);
      store.subscribe(() => {
        expect(store.getState()).toEqual({ a: { b: 2 }, c: 2 });
        done();
      });
      store.dispatch({ type: 'replace' });
    });

    it('replaces values at target paths', async done => {
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*() {
            return { a: { b: 1 }, c: 2 };
          }
        },
        {
          type: 'replace',
          paths: ['a', 'c.d'],
          reducer: async function*() {
            return { a: { a: null }, c: { d: null } };
          }
        }
      ]);
      store.subscribe(() => {
        expect(store.getState()).toEqual({ a: { a: null }, c: { d: null } });
        done();
      });
      store.dispatch({ type: 'replace' });
    });

    it('runs each transactions separately', async done => {
      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*() {
            return { a: 0, b: 0 };
          }
        },
        {
          type: 'long',
          paths: ['a'],
          reducer: async function*({ a = 0 }) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            return { a: a + 1 };
          }
        },
        {
          type: 'short',
          paths: ['b'],
          reducer: async function*({ b = 0 }) {
            expect(store.getState().a).toBe(0);
            done();
          }
        }
      ]);
      store.dispatch({ type: 'long' });
      store.dispatch({ type: 'short' });
    });

    it('has consistency eventually', async done => {
      const store = await createStore([
        {
          type: 'increment',
          paths: ['a'],
          reducer: async function*({ a = 0 }) {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { a: a + 1 };
          }
        },
        {
          type: 'increment',
          paths: ['b'],
          reducer: async function*({ b = 0 }) {
            return { b: b + 1 };
          }
        }
      ]);
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

    it('exclusively runs transactions of parent and child', async done => {
      const store = await createStore([
        {
          type: '1',
          paths: ['a'],
          reducer: async function*() {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { a: { b: 1 } };
          }
        },
        {
          type: '2',
          paths: [''],
          reducer: async function*({ a: { b } }) {
            return {
              a: {
                b: b + 1
              }
            };
          }
        },
        {
          type: '3',
          paths: ['a.b'],
          reducer: async function*({ a: { b } }) {
            expect(b).toEqual(2);
            done();
          }
        }
      ]);
      store.dispatch({ type: '1' });
      store.dispatch({ type: '2' });
      store.dispatch({ type: '3' });
    });
  });

  describe('with generater state', () => {
    it('doesnt finish transaction until generator done', async () => {
      const store = await createStore([
        {
          type: 'increment3',
          paths: [''],
          reducer: async function*(state = 0) {
            yield (state += 1);
            yield (state += 1);
            return (state += 1);
          }
        }
      ]);
      store.dispatch({ type: 'increment3' });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(store.getState()).toEqual(3);
    });

    it('doesnt finish transaction until async generator done', async () => {
      let fail = false;
      const store = await createStore([
        {
          type: 'loop',
          paths: [''],
          reducer: async function*(state = 0) {
            while (true) {
              await new Promise(resolve => setTimeout(resolve, 10));
              yield (state += 1);
            }
          }
        },
        {
          type: 'error',
          paths: [''],
          reducer: async function*() {
            fail = true;
          }
        }
      ]);
      store.dispatch({ type: 'loop' });
      store.dispatch({ type: 'error' });
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(fail).toEqual(false);
    });

    it('rollbacks state by error', async () => {
      const consoleMock = jest.spyOn(console, 'error');
      consoleMock.mockImplementation(() => {});

      const store = await createStore([
        {
          type: 'init',
          paths: [''],
          reducer: async function*(state = 0) {
            return state;
          }
        },
        {
          type: 'increment',
          paths: [''],
          reducer: async function*(state) {
            yield state + 1;
            throw new Error();
            return state + 1;
          }
        }
      ]);
      store.dispatch({ type: 'increment' });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(store.getState()).toEqual(0);
      consoleMock.mockRestore();
    });
  });
});
