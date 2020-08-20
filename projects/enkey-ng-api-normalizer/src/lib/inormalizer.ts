import {ApiNormalizerService} from "./api-normalizer.service";

export interface INormalizer<T> {
  normalize(apiNormalizer: ApiNormalizerService, value: T): any
  denormalize(apiNormalizer: ApiNormalizerService, value: any): T
}
