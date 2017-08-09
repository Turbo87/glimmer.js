import { Resolver as IResolver, Recast } from "@glimmer/interfaces";
import {
  Helper,
  ModifierManager,
  PartialDefinition,
  CompilableTemplate,
  CompilationOptions,
  templateFactory,
  Template,
} from '@glimmer/runtime';
import { Option, dict, Dict } from '@glimmer/util';
import { SerializedTemplateWithLazyBlock } from '@glimmer/wire-format';
import { Owner } from '@glimmer/di';

import { CompileTemplate } from '../environment';
import ComponentDefinition from '../component/definition';
import ComponentManager from '../component/manager';
import TemplateMeta from '../template-meta';
import action from '../helpers/action';
import buildUserHelper from '../helpers/user-helper';

const DEFAULT_HELPERS: Dict<any> = {
  action
};

export interface Lookup {
  helper: Helper;
  modifier: ModifierManager;
  component: ComponentDefinition;
  partial: PartialDefinition;
  template: CompileTemplate;
  layout: CompilableTemplate;
}

export type LookupType = keyof Lookup;
export type LookupValue = Lookup[LookupType];

export interface Specifier<T extends LookupType = LookupType> {
  type: T;
  name: string;
}

export type ResolverCompilationOptions = CompilationOptions<TemplateMeta, Specifier, Resolver>;

export default class Resolver implements IResolver<Specifier, TemplateMeta> {
  private owner: Owner;

  public options: ResolverCompilationOptions;
  public manager: ComponentManager;

  private componentDefinitions: Dict<ComponentDefinition> = dict();
  private layouts: Dict<CompilableTemplate> = dict();
  private helpers = dict<Helper>();

  constructor(owner: Owner) {
    this.owner = owner;
  }

  lookup(_type: LookupType, _name: string, meta: TemplateMeta): Option<Specifier> {
    let specifier = this.owner.identify(`${_type}:${_name}`, meta.specifier);
    if (!specifier) { return null; }

    let [type, name] = specifier.split(':', 2) as [LookupType, string];
    return { type, name };
  }

  resolve<T>(specifier: Specifier): T {
    let { type, name } = specifier;

    if (type === 'component') {
      return this.componentDefinitions[name] as Recast<LookupValue, T>;
    }

    if (type === 'layout') {
      return this.layouts[name] as Recast<LookupValue, T>;
    }

    if (type === 'helper') {
      return this.helpers[name] as Recast<LookupValue, T>;
    }

    return this.owner.lookup(`${type}:${name}`);
  }

  lookupPartial(name: string, meta: TemplateMeta): Option<Specifier> {
    return this.lookup('partial', name, meta);
  }

  lookupHelper(name: string, meta: TemplateMeta): Option<Specifier> {
    let specifier = { type: 'helper', name } as Specifier;

    if (name in this.helpers) {
      return specifier;
    }

    if (name in DEFAULT_HELPERS) {
      this.helpers[name] = DEFAULT_HELPERS[name];
      return specifier;
    }

    let referrer = meta && meta.specifier;
    let helperSpecifier = this.owner.identify(`helper:${name}`, referrer);

    if (helperSpecifier) {
      let helper = this.owner.lookup(helperSpecifier);
      this.helpers[name] = buildUserHelper(helper);
      return specifier;
    }

    return null;
  }

  lookupModifier(name: string, meta: TemplateMeta): Option<Specifier> {
    return this.lookup('modifier', name, meta);
  }

  lookupComponent(name: string, meta: TemplateMeta): Option<Specifier> {
    let referrer = meta && meta.specifier;
    let specifier = this.owner.identify(`template:${name}`, referrer);
    if (!specifier) { return null; }

    let [, expandedName] = specifier.split(':', 2);
    if (!this.componentDefinitions[expandedName]) {
      this.buildComponentDefinition(expandedName, meta);
    }

    return { type: 'component', name: expandedName };
  }

  buildComponentDefinition(name: string, meta: TemplateMeta): void {
    let specifier = this.owner.identify(`template:${name}`, meta && meta.specifier);
    if (specifier === undefined && this.owner.identify(`component:${name}`, meta && meta.specifier)) {
      throw new Error(`The component '${name}' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.`);
    }
    let factory = this.owner.factoryFor(`component:${name}`);
    let template = this.owner.lookup(`template:${name}`);

    let layout = compileWithOptions(template, this.options).asLayout();
    let layoutSpecifier = { type: 'layout', name } as Specifier;

    let definition = new ComponentDefinition(name, this.manager, factory, layoutSpecifier);

    this.layouts[name] = layout;
    this.componentDefinitions[name] = definition;
  }
}

export function compileWithOptions(template: SerializedTemplateWithLazyBlock<TemplateMeta>, options: ResolverCompilationOptions): Template {
  let factory = templateFactory(template);
  return factory.create(options);
}
