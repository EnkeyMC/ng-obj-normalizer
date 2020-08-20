import {Inject, Injectable, Optional} from '@angular/core';
import {INormalizer} from "./inormalizer";
import {IKeyNormalizer} from "./ikey-normalizer";
import {IKeyFilter} from "./ikey-filter";
import {UnderscoreKeyFilter} from "./underscore-key-filter";

/**
 * ApiNormalizer normalizes models into api friendly objects and denormalizes api objects into models.
 *
 * It uses key normalizers to normalize and denormalize object keys (property names). Key normalizers are
 * defined globally in providers with key 'apiKeyNormalizers'. The provider value is array of key normalizers
 * that will be applied to the key in order during normalization and in reverse order during denormalization.
 * To create custom key normalizer just implement IKeyNormalizer interface.
 *
 * Value normalization is done via implementations of INormalizer interface. These normalizers are applied to
 * properties using @ApiNormalizer.normalizer(<INormalizer>) property decorator.
 * To create custom normalizer just implement INormalizer interface.
 */
@Injectable({providedIn: "root"})
export class ApiNormalizerService {
  constructor(@Inject('apiKeyNormalizers') @Optional() private readonly keyNormalizers?: Array<IKeyNormalizer>,
              @Inject('apiKeyFilter') @Optional() private readonly keyFilter?: IKeyFilter) {
    this.keyNormalizers = keyNormalizers || [];
    this.keyFilter = keyFilter || new UnderscoreKeyFilter();
  }

  /**
   * Normalize object of given type
   * @param obj object to normalize
   * @param type object class
   * @returns normalized object
   */
  public normalize<T>(obj: T, type: {new(): T}): {[k: string]: any} {
    let result: {[k: string]: any} = {};

    for (let key in obj) {
      if (!obj.hasOwnProperty(key) || !this.keyFilter.shouldNormalize(key))
        continue;

      result[this.normalizeKey(key)] = this.normalizeValue(type, key, obj[key]);
    }

    return result;
  }

  private normalizeValue<T>(type: {new(): T}, key: string, value: any): any {
    let normalizedValue = value;

    if (ApiNormalizerService.normalizerFieldName(key) in type.prototype) {
      normalizedValue = type.prototype[ApiNormalizerService.normalizerFieldName(key)].normalize(this, normalizedValue);
    }
    return normalizedValue;
  }

  private normalizeKey<T>(key: string): string {
    let normalizedKey = key;
    for (const keyNormalizer of this.keyNormalizers) {
      normalizedKey = keyNormalizer.normalize(normalizedKey);
    }

    return normalizedKey;
  }

  /**
   * Denormalize object to object of given type. This is a reverse operation to normalizing.
   * @param obj normalized object to denormalize
   * @param type class of denormalized object
   * @returns denormalized object of given type
   */
  public denormalize<T>(obj: {[k: string]: any}, type: {new(): T}): T {
    let result: T = new type();
    for (let key in obj) {
      if (!obj.hasOwnProperty(key))
        continue;

      const denormalizedKey = this.denormalizeKey(key);
      result[denormalizedKey] = this.denormalizeValue(type, denormalizedKey, obj[key]);
    }

    return result;
  }

  private denormalizeKey<T>(key: string): string {
    let denormalizedKey = key;

    for (const keyNormalizer of [...this.keyNormalizers].reverse()) {
      denormalizedKey = keyNormalizer.denormalize(denormalizedKey);
    }

    return denormalizedKey;
  }

  private denormalizeValue<T>(type: {new(): T}, denormalizedKey: string, value: any): any {
    let denormalizedValue = value;

    if (ApiNormalizerService.normalizerFieldName(denormalizedKey) in type.prototype) {
      denormalizedValue = type.prototype[ApiNormalizerService.normalizerFieldName(denormalizedKey)].denormalize(this, denormalizedValue);
    }

    return denormalizedValue;
  }

  /**
   * Property decorator factory which applies normalizer to decorated property.
   *
   * It adds the normalizer to the class prototype property __<propertyName>_normalizer which is then
   * used during normalization or denormalization to convert the value of the property.
   *
   * @param normalizer normalizer to apply during normalization or denormalization
   * @returns decorator function
   */
  public static normalizer<T>(normalizer: INormalizer<T>): (Object, string) => void {
    return function (target: Object, propertyName: string): void {
      Object.defineProperty(target, ApiNormalizerService.normalizerFieldName(propertyName), {value: normalizer});
    }
  }

  private static normalizerFieldName(key: string): string {
    return '__'+key+'_normalizer';
  }
}
