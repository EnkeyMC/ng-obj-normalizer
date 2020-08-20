export interface IKeyNormalizer {
  normalize(key: string): string;
  denormalize(key: string): string;
}
