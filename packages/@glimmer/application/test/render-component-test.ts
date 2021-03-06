import { buildApp, didRender } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/application] renderComponent');

test('renders a component', async function(assert) {
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .boot();

  app.renderComponent('HelloWorld', containerElement);

  await didRender(app);

  assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
});

test('renders a component without affecting existing content', async function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');

  previousSibling.appendChild(document.createTextNode('foo'));
  containerElement.appendChild(previousSibling);
  containerElement.appendChild(document.createTextNode('bar'));

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p>foo</p>bar');

  app.renderComponent('HelloWorld', containerElement);

  await didRender(app);

  assert.equal(containerElement.innerHTML, '<p>foo</p>bar<h1>Hello Glimmer!</h1>');
});

test('renders a component before a given sibling', async function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(previousSibling);
  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p></p><aside></aside>');

  app.renderComponent('HelloWorld', containerElement, nextSibling);

  await didRender(app);

  assert.equal(containerElement.innerHTML, '<p></p><h1>Hello Glimmer!</h1><aside></aside>');
});

test('renders multiple components in different places', async function(assert) {
  assert.expect(2);

  let firstContainerElement = document.createElement('div');
  let secondContainerElement = document.createElement('div');

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  app.renderComponent('HelloWorld', firstContainerElement);
  app.renderComponent('HelloRobbie', secondContainerElement);

  await didRender(app);

  assert.equal(firstContainerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
  assert.equal(secondContainerElement.innerHTML, '<h1>Hello Robbie!</h1>');
});

test('renders multiple components in the same container', async function(assert) {
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  app.renderComponent('HelloWorld', containerElement);
  app.renderComponent('HelloRobbie', containerElement);

  await didRender(app);

  assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1><h1>Hello Robbie!</h1>');
});

test('renders multiple components in the same container in particular places', async function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
    .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<aside></aside>');

  app.renderComponent('HelloWorld', containerElement);
  app.renderComponent('HelloRobbie', containerElement, nextSibling);

  await didRender(app);

  assert.equal(containerElement.innerHTML, '<h1>Hello Robbie!</h1><aside></aside><h1>Hello Glimmer!</h1>');
});
