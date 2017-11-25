const { createStore } = require('../lib');

describe('createStore', () => {
  it('receives an object', async () => {
    await createStore([]);
  });

  it('receives a function reducer', async done => {
    const store = await createStore([
      {
        type: 'noop',
        paths: [],
        reducer: () => {
          done();
        }
      }
    ]);
    store.dispatch({ type: 'noop' });
  });

  it('receives an async reducer', async done => {
    const store = await createStore([
      {
        type: 'noop',
        paths: [],
        reducer: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          done();
        }
      }
    ]);
    store.dispatch({ type: 'noop' });
  });

  it('receives a generator function reducer', async done => {
    const store = await createStore([
      {
        type: 'noop',
        paths: [],
        reducer: function*() {
          yield 1;
          return 2;
        }
      },
      {
        type: 'done',
        paths: [],
        reducer: () => done()
      }
    ]);
    store.dispatch({ type: 'noop' });
    store.dispatch({ type: 'done' });
  });

  it('receives an async generator function reducer', async done => {
    const store = await createStore([
      {
        type: 'noop',
        paths: [],
        reducer: async function*() {
          yield 1;
          await new Promise(resolve => setTimeout(resolve, 10));
          return 2;
        }
      },
      {
        type: 'done',
        paths: [],
        reducer: () => done()
      }
    ]);
    store.dispatch({ type: 'noop' });
    store.dispatch({ type: 'done' });
  });

  it('receives a nested object', async () => {
    const store = await createStore([
      {
        type: 'init',
        paths: [''],
        reducer: () => ({
          a: 1
        })
      },
      {
        type: 'init',
        paths: ['b'],
        reducer: () => ({
          b: 2
        })
      }
    ]);
    expect(store.getState()).toEqual({ a: 1, b: 2 });
  });
});
