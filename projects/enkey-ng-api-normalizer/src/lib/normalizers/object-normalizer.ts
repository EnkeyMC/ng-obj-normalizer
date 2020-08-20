import {INormalizer} from "../inormalizer";
import {ApiNormalizerService} from "../api-normalizer.service";

export class ObjectNormalizer<T> implements INormalizer<T> {
  constructor(private type: {new(): T}) {
  }

  denormalize(apiNormalizer: ApiNormalizerService, value: any): T {
    return apiNormalizer.denormalize(value, this.type);
  }

  normalize(apiNormalizer: ApiNormalizerService, value: T): any {
    return apiNormalizer.normalize(value, this.type);
  }
}
