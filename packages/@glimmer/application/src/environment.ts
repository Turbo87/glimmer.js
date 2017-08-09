import {
  CompilableTemplate,
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  ModifierManager,
  Helper as GlimmerHelper,
  Macros,
  Program
} from '@glimmer/runtime';
import {
  Reference,
  OpaqueIterable,
} from "@glimmer/reference";
import {
  dict,
  Opaque,
} from '@glimmer/util';
import {
  ProgramSymbolTable
} from '@glimmer/interfaces';
import {
  getOwner,
  setOwner,
} from '@glimmer/di';
import Iterable from './iterable';

import Resolver, { ResolverCompilationOptions } from './compiler/resolver';
import TemplateMeta from './template-meta';

import ComponentManager from './component/manager';

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document: HTMLDocument;
  appendOperations: DOMTreeConstruction;
}

export type CompileTemplate = CompilableTemplate<ProgramSymbolTable>;

export default class Environment extends GlimmerEnvironment {
  public resolver: Resolver;
  public program: Program;
  public compileOptions: ResolverCompilationOptions;
  private manager = new ComponentManager({ env: this });
  private modifiers = dict<ModifierManager<Opaque>>();
  private uselessAnchor: HTMLAnchorElement;

  static create(options: Partial<EnvironmentOptions> = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options as EnvironmentOptions);
  }

  constructor(options: EnvironmentOptions) {
    super({
      appendOperations: options.appendOperations,
      updateOperations: new DOMChanges(options.document as HTMLDocument || document)
    });

    setOwner(this, getOwner(options));

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as HTMLAnchorElement;
  }

  setResolver(resolver: Resolver) {
    this.resolver = resolver;
    this.program = new Program(this.resolver);
    this.compileOptions = {
      resolver: this.resolver,
      program: this.program,
      macros: new Macros()
    };
    resolver.options = this.compileOptions;
    resolver.manager = this.manager;
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    let keyFor: KeyFor<Opaque>;

    if (!keyPath) {
      throw new Error('Must specify a key for #each');
    }

    switch (keyPath) {
      case '@index':
        keyFor = (_, index: number) => String(index);
      break;
      case '@primitive':
        keyFor = (item: Opaque) => String(item);
      break;
      default:
        keyFor = (item: Opaque) => (item as any)[keyPath];
      break;
    }

    return new Iterable(ref, keyFor);
  }
}
