# Joqt

Joqt is a centerized Flux Store

```js
const { createStore } = require('joqt');

(async () => {
  const store = await createStore([
    {
      type: 'ADD_TODO',
      paths: ['todos'],
      reducer: ({ todos = [] }, message) => ({ todos: todos.concat([message]) })
    },
    {
      type: 'CLEAR_TODOS',
      paths: ['todos'],
      reducer: async function*({ todos = [] }) {
        while (true) {
          await new Promise(r => setTimeout(r, 1000));
          todos.shift();
          if (todos.length === 0) break;
          yield { todos };
        }
        return { todos };
      }
    }
  ]);

  store.subscribe(() => console.log(store.getState()));

  store.dispatch({ type: 'ADD_TODO', payload: 'do!' });
})();
```

Joqt *store* reduces *prev state* and *action* to *next state*, whenever *action* dispatched.
We can control state predictably like [Redux](https://redux.js.org/).

Joqt *reducer* can be a function, async function, generator function or async generator function.
We can control asynchronous control flow like [Redux-Saga](https://redux-saga.js.org/).

To prevent from break state by race condition,
Joqt needs *paths* with *reducer* that are part of state tree and that *reducer* receives as argument.
Joqt serializes executions of reducers when reducers have overlapping state tree.


## Installation

```console
$ npm install --save joqt
```


## License

MIT
