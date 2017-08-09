import Component from "@glimmer/component";

interface ComponentFactory {
  create(injections: object): Component;
  template: string;
}

export default ComponentFactory;
