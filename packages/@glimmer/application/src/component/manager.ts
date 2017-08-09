import Component from "@glimmer/component";
import {
  Bounds,
  ComponentManager as GlimmerComponentManager,
  DynamicScope,
  Arguments,
  CapturedArguments
} from "@glimmer/runtime";
import { Dict, Destroyable, Opaque } from "@glimmer/util";
import { Tag, CONSTANT_TAG } from "@glimmer/reference";
import { Simple } from "@glimmer/interfaces";

import Environment from '../environment';
import Resolver, { Specifier } from "../compiler/resolver";
import ComponentDefinition from './definition';
import { RootReference } from "../tracked/references";

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: ComponentDefinition, args: CapturedArguments) {
    let { name, componentFactory } = definition;

    this.args = args;

    let injections = {
      debugName: name,
      args: this.namedArgsSnapshot()
    };

    this.component = componentFactory.create(injections);
  }

  namedArgsSnapshot(): Readonly<Dict<Opaque>> {
    return Object.freeze(this.args.named.value());
  }
}

/**
 * The ComponentManager class defines the behavior of components, including
 * their public API and lifecycle hooks.
 */
export default class ComponentManager implements GlimmerComponentManager<ComponentStateBucket> {
  private env: Environment;

  static create(options: ConstructorOptions): ComponentManager {
    return new ComponentManager(options);
  }

  constructor(options: ConstructorOptions) {
    this.env = options.env;
  }

  prepareArgs(definition: ComponentDefinition, args: Arguments): null {
    return null;
  }

  create(environment: Environment, definition: ComponentDefinition, volatileArgs: Arguments): ComponentStateBucket {
    if (!definition.componentFactory) {
      return null;
    }

    return new ComponentStateBucket(definition, volatileArgs.capture());
  }

  getLayout(definition: ComponentDefinition, resolver: Resolver): Specifier {
    return definition.layout;
  }

  getSelf(bucket: ComponentStateBucket): RootReference {
    return bucket && new RootReference(bucket.component);
  }

  didCreateElement(bucket: ComponentStateBucket, element: Simple.Element) {
    if (!bucket) { return; }
    bucket.component.element = element;
  }

  didRenderLayout(bucket: ComponentStateBucket, bounds: Bounds) {
  }

  didCreate(bucket: ComponentStateBucket) {
    if (!bucket) { return; }
    bucket.component.didInsertElement();
  }

  getTag(bucket: ComponentStateBucket): Tag {
    return CONSTANT_TAG;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
    if (!bucket) { return; }
    bucket.component.args = bucket.namedArgsSnapshot();
  }

  didUpdateLayout() {}

  didUpdate({ component }: ComponentStateBucket) {
    component.didUpdate();
  }

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    return bucket && bucket.component;
  }
}
