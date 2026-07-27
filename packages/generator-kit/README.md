# @telemax/generator-kit

An abstract SDK for building **generators** on top of Telemax AI Factory. It
defines the generator contract and a base class that plugs into the kernel.

It depends on `@telemax/core`; the Core has no knowledge of generators. This
enforces the one-way dependency direction mandated by the architecture
(generators → core).

> This package contains **no concrete generators** — only the foundation on
> which concrete generators (website, landing page, application, …) are built as
> separate packages.

## Responsibilities

- Define the generation contract: `GenerationRequest`, `GenerationResult`,
  `GeneratedArtifact`, `Generator`.
- Provide `BaseGenerator`, an abstract class that implements both `Generator`
  and the Core's `Plugin`, factoring out the common boilerplate.

## Installation

```bash
pnpm add @telemax/generator-kit @telemax/core
```

## Building a generator

```ts
import {
  BaseGenerator,
  type GenerationRequest,
  type GenerationResult,
} from "@telemax/generator-kit";
import { ok, type Result } from "@telemax/core";

class MyGenerator extends BaseGenerator {
  public readonly name = "my-generator";
  protected readonly kinds = ["my-kind"] as const;

  protected run(_request: GenerationRequest): Promise<Result<GenerationResult, Error>> {
    return Promise.resolve(ok({ artifacts: [] }));
  }
}
```

## License

MIT © Gruppo AIR srl
