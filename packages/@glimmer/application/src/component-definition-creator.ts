import { Template } from '@glimmer/runtime';

import ComponentFactory from './component/factory';
import ComponentDefinition from './component/definition';
import TemplateMeta from './template-meta';

interface ComponentDefinitionCreator {
  createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: ComponentFactory): ComponentDefinition;
}

export default ComponentDefinitionCreator;
