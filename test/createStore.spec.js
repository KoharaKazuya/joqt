const { createStore } = require('../lib');

describe('createStore', () => {
  it('receives a function', async done => {
    await createStore({});
    done();
  });
});
