# ng-api-normalizer
Author: Martin Omacht

## Introduction

This library includes an angular service ApiNormalizerService which can normalize or denormalize object property names and values. 
This is useful for transforming data from your API to typed objects. It can be used to transform property names between different 
cases (for example from camelCase to snake_case) or to transform dates from string to date objects and so on. However, these specific 
normalizers are not included in this library, but you can easily write your own normalizers by implementing INormalizer or IKeyNormalizer
interface. Examples are down below.

## Examples

Using a decorator `@ApiNormalizerService.normalizer()` you can specify which normalizer will be used for given class property.

```typescript
class Post {
    id: number;
    title: string;
    @ApiNormalizerService.normalizer(new MyDateNormalizer())
    publishDate: Date;
    text: string;
}
```

If you want to change the case of the property names to snake_case, you can use a library [change-case](https://github.com/blakeembrey/change-case)
and create a CamelToSnakeCaseKeyNormalizer like so:

```typescript
import {IKeyNormalizer} from "@enkey/ng-api-normalizer/ikey-normalizer";
import {camelCase, snakeCase} from "change-case";

export class CamelToSnakeCaseKeyNormalizer implements IKeyNormalizer {
  denormalize(key: string): string {
    return camelCase(key);
  }

  normalize(key: string): string {
    return snakeCase(key);
  }
}
```

Afterwards you can use it by providing it in a module:

```typescript
...
@NgModule({
    ...
    providers: [
        ...
        {
            provide: 'apiKeyNormalizers',
            useValue: [new CamelToSnakeCaseKeyNormalizer()] // You can have multiple normalizers 
        }       
    ]
})
...
```

To then use the ApiNormalizerService, you can inject it into your service:

```typescript
...
export class MyService {
    constructor(private apiNormalizer: ApiNormalizerService) {}
    ...
    createPost(post: Post): Observable<Post> {
        return this.httpClient.post<any>('/posts', this.apiNormalizer.normalize(post, Post))
            .pipe(map(response => {
                return this.apiNormalizer.denormalize(response.body, Post);            
            }));
    }
}
```

The normalized object will look like this:

```typescript
{
    id: 1,
    title: "Title",
    publish_date: "2020-06-15",
    text: "Post body content..."
}
```

### CAUTION

If you instantiate the denormalized object, properties without default value will be undefined and will not be normalized!!
The solution is to give every property a default value or to initialize every property on instantiation. 

## Included generic normalizers

### ArrayNormalizer

Calls ApiNormalizerService on each element of array to normalize/denormalize it.

### ObjectNormalizer

Calls ApiNormalizerService on nested object to normalize/denormalize it.

Example usage with ArrayNormalizer to normalize array of objects.

```typescript
class Nested {
    @ApiNormalizerService.normalizer(new MyDateNormalizer())
    date: Date;
}

class ModelWithNested {
    prop: string;
    @ApiNormalizerService.normalizer(new ArrayNormalizer(new ObjectNormalizer()))
    nestedArray: Array<Nested>;
}

// normalized
{
    prop: "...",
    nestedArray: [  // No key normalizers in this example
        { date: "2020-08-06" },
        { date: "2020-09-03" }    
    ]
}


```
