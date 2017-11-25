export class Exchange {

  private transactions: { [key: string]: Promise<void> } = {};

  public enqueueTransaction(paths: string[], rawTransaction: () => Promise<void>): void {
    const wrappedTransaction = (async () => {
      const transactionsToWait = paths
        .reduce((prev: string[], path: string) => {
          const ancestorTransaction = this.transactionKeys.filter((k) => path.startsWith(k));
          const descendantTransactions = this.transactionKeys.filter((k) => k.startsWith(path));
          return [...prev, ...ancestorTransaction, ... descendantTransactions];
        }, [])
        .map((path) => this.transactions[path]);

      await Promise.all(transactionsToWait);

      await rawTransaction();
    })();

    for (const path of paths) {
      this.transactions[path] = wrappedTransaction;
    }
  }

  public async waitAll(): Promise<void> {
    await Promise.all(this.transactionKeys.map((k) => this.transactions[k]));
  }

  private get transactionKeys(): string[] {
    return Object.keys(this.transactions);
  }
}
