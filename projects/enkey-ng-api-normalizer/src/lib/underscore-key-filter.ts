import {IKeyFilter} from "./ikey-filter";

export class UnderscoreKeyFilter implements IKeyFilter {
  shouldNormalize(key: string): boolean {
    return !(key.startsWith('_') || key.startsWith('__'));
  }

}
