import { TestBed } from '@angular/core/testing';

import { ApiNormalizerService } from './api-normalizer.service';
import {INormalizer} from "./inormalizer";
import {IKeyNormalizer} from "./ikey-normalizer";

class NormalizerMock implements INormalizer<number>{
  private callCount: number;

  public static NORMALIZE_VALUE = "42";
  public static DENORMALIZE_VALUE = 42;

  constructor() {
    this.callCount = 0;
  }

  public resetCounter() {
    this.callCount = 0;
  }

  public getCallCount() : number {
    return this.callCount;
  }

  denormalize(apiNormalizer: ApiNormalizerService, value: any): number {
    this.callCount++;
    return NormalizerMock.DENORMALIZE_VALUE;
  }

  normalize(apiNormalizer: ApiNormalizerService, value: number): any {
    this.callCount++;
    return NormalizerMock.NORMALIZE_VALUE;
  }
}

const normalizerMock = new NormalizerMock();

class ModelBaseMock {
  prop1: string;
  @ApiNormalizerService.normalizer(normalizerMock)
  prop2: number;
}

class ModelMock extends ModelBaseMock {
  @ApiNormalizerService.normalizer(normalizerMock)
  modelProp: number = 0;
}

class SubModelMock extends ModelMock {
  @ApiNormalizerService.normalizer(normalizerMock)
  subProp: number = 0;
}

describe('ApiNormalizerService_ValueNormalizerOnly', () => {
  let service: ApiNormalizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiNormalizerService);
    normalizerMock.resetCounter();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normalize(), ModelBaseMock, should not call normalizer, because object props are not initialized', function () {
    const model = new ModelBaseMock();

    const result = service.normalize(model, ModelBaseMock);

    expect(result.prop1).toBe(undefined);
    expect(result.prop2).toBe(undefined);
    expect(normalizerMock.getCallCount()).toBe(0);
  });

  it('normalize(), ModelBaseMock, should call normalizer once', function () {
    const model = new ModelBaseMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, ModelBaseMock);

    expect(result.prop1).toBe(model.prop1);
    expect(result.prop2).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(1);
  });

  it('normalize(), ModelMock, should call normalizer twice', function () {
    const model = new ModelMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, ModelMock);

    expect(result.prop1).toBe(model.prop1);
    expect(result.prop2).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(result.modelProp).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(2);
  });

  it('normalize(), SubModelMock, should call normalizer thrice', function () {
    const model = new SubModelMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, SubModelMock);

    expect(result.prop1).toBe(model.prop1);
    expect(result.prop2).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(result.modelProp).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(result.subProp).toBe(NormalizerMock.NORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(3);
  });

  it('denormalize(), ModelBaseMock, should call normalizer once', function () {
    const obj = {
      prop1: "",
      prop2: 0
    }

    const result = service.denormalize(obj, ModelBaseMock);

    expect(result.prop1).toBe(obj.prop1);
    expect(result.prop2).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(1);
  });

  it('denormalize(), ModelMock, should call normalizer twice', function () {
    const obj = {
      prop1: "",
      prop2: 0,
      modelProp: 1
    }

    const result = service.denormalize(obj, ModelMock);

    expect(result.prop1).toBe(obj.prop1);
    expect(result.prop2).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(result.modelProp).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(2);
  });

  it('denormalize(), SubModelMock, should call normalizer thrice', function () {
    const obj = {
      prop1: "",
      prop2: 0,
      modelProp: 1,
      subProp: 2
    }

    const result = service.denormalize(obj, SubModelMock);

    expect(result.prop1).toBe(obj.prop1);
    expect(result.prop2).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(result.modelProp).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(result.subProp).toBe(NormalizerMock.DENORMALIZE_VALUE);
    expect(normalizerMock.getCallCount()).toBe(3);
  });
});



class KeyNormalizer1Mock implements IKeyNormalizer {
  denormalize(value: string): string {
    console.log("Denormalize", value);
    if (value.endsWith('1')) {
      console.log("Slicing");
      return value.slice(0, -1);
    }
    return value;
  }

  normalize(value: string): string {
    return value + '1';
  }
}

class KeyNormalizer2Mock implements IKeyNormalizer {
  denormalize(value: string): string {
    if (value.endsWith('2')) {
      return value.slice(0, -1);
    }
    return value;
  }

  normalize(value: string): string {
    return value + '2';
  }
}

describe('ApiNormalizerService_WithKeyNormalizer', () => {
  let service: ApiNormalizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: 'apiKeyNormalizers',
          useValue: [new KeyNormalizer1Mock(), new KeyNormalizer2Mock()]
        }
      ]
    });
    service = TestBed.inject(ApiNormalizerService);
  });

  it('normalize(), ModelBaseMock, should normalize keys', function () {
    const model = new ModelBaseMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, ModelBaseMock);

    expect(result['prop112']).toBeDefined();
    expect(result['prop212']).toBeDefined();
    expect(result['prop1']).toBeUndefined();
    expect(result['prop2']).toBeUndefined();
  });

  it('normalize(), ModelMock, should normalize keys', function () {
    const model = new ModelMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, ModelMock);

    expect(result['prop112']).toBeDefined();
    expect(result['prop212']).toBeDefined();
    expect(result['modelProp12']).toBeDefined();
  });

  it('normalize(), SubModelMock, should normalize keys', function () {
    const model = new SubModelMock();
    model.prop1 = "";
    model.prop2 = 0;

    const result = service.normalize(model, SubModelMock);

    expect(result['prop112']).toBeDefined();
    expect(result['prop212']).toBeDefined();
    expect(result['modelProp12']).toBeDefined();
    expect(result['subProp12']).toBeDefined();
  });

  it('denormalize(), ModelBaseMock, should denormalize keys', function () {
    const obj = {
      prop112: "",
      prop212: 3
    }

    const result = service.denormalize(obj, ModelBaseMock);

    expect(result['prop112']).toBeUndefined();
    expect(result['prop212']).toBeUndefined();
    expect(result['prop1']).toBeDefined();
    expect(result['prop2']).toBeDefined();
  });

  it('denormalize(), ModelMock, should denormalize keys', function () {
    const obj = {
      prop112: "",
      prop212: 3,
      modelProp12: 23
    }

    const result = service.denormalize(obj, ModelMock);

    expect(result['prop112']).toBeUndefined();
    expect(result['prop212']).toBeUndefined();
    expect(result['modelProp12']).toBeUndefined();
    expect(result['prop1']).toBeDefined();
    expect(result['prop2']).toBeDefined();
    expect(result['modelProp']).toBeDefined();
  });

  it('denormalize(), SubModelMock, should denormalize keys', function () {
    const obj = {
      prop112: "",
      prop212: 3,
      modelProp12: 23,
      subProp: 21
    }

    const result = service.denormalize(obj, SubModelMock);

    expect(result['prop112']).toBeUndefined();
    expect(result['prop212']).toBeUndefined();
    expect(result['modelProp12']).toBeUndefined();
    expect(result['subProp12']).toBeUndefined();
    expect(result['prop1']).toBeDefined();
    expect(result['prop2']).toBeDefined();
    expect(result['modelProp']).toBeDefined();
    expect(result['subProp']).toBeDefined();
  });
});
