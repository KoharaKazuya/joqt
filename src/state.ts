import * as _ from "lodash";

import { PartialDeep } from "../index.d";

export class StateTree<S> {

  private tree: S | undefined = undefined;

  public getAll(): S | undefined {
    return this.tree;
  }

  public getByPaths(paths: string[]): PartialDeep<S> {
    if (paths.filter((s) => s.length === 0).length > 0) {
      return this.getAll();
    }
    return _.pick(this.tree || {}, paths);
  }

  public setByPaths(paths: string[], value: PartialDeep<S>): void {
    if (paths.filter((s) => s.length === 0).length > 0) {
      this.tree = value as any;
      return;
    }
    for (const path of paths) {
      this.tree = _.set((this.tree || {}) as any, path, _.get(value, path));
    }
  }

}
