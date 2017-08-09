import Component from '@glimmer/component';
import {
  ComponentDefinition as GlimmerComponentDefinition,
  ComponentCapabilities
} from "@glimmer/runtime";
import { Option } from '@glimmer/util';
import { Factory } from '@glimmer/di';

import ComponentManager, { ComponentStateBucket } from "./manager";
import { Specifier } from '../compiler/resolver';

/**
 * The ComponentDefinition class encapsulates a single component's template and
 * JavaScript class.
 */
export default class ComponentDefinition extends GlimmerComponentDefinition<ComponentStateBucket> {
  componentFactory: Factory<Component>;
  layout: Option<Specifier>;

  public capabilities: ComponentCapabilities = {
    dynamicLayout: false,
    dynamicTag: true,
    prepareArgs: false,
    createArgs: true,
    attributeHook: true,
    elementHook: false
  };

  constructor(name: string, manager: ComponentManager, componentFactory: Factory<Component>, layout: Specifier) {
    super(name, manager);
    this.componentFactory = componentFactory;
    this.layout = layout;
  }

  toJSON() {
    return { GlimmerDebug: `<component-definition name="${this.name}">` };
  }
}
