import {INormalizer} from "../inormalizer";
import {ApiNormalizerService} from "../api-normalizer.service";

export class ArrayNormalizer<T> implements INormalizer<Array<T>> {

  constructor(private itemNormalizer: INormalizer<T>) {
  }

  denormalize(apiNormalizer: ApiNormalizerService, value: Array<any>): Array<T> {
    return value.map(item => this.itemNormalizer.denormalize(apiNormalizer, item));
  }

  normalize(apiNormalizer: ApiNormalizerService, value: Array<T>): Array<any> {
    return value.map((item => this.itemNormalizer.normalize(apiNormalizer, item)));
  }
}
