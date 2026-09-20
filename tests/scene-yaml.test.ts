import {describe, expect, it} from 'vitest';

import {normalizeSceneGraphDocument} from '../src/scene-graph.js';
import {parseSceneGraphYaml, stringifySceneGraphYaml} from '../src/scene-yaml.js';

describe('scene graph YAML documents', () => {
  it('parses a handwritten document and fills defaults', () => {
    const scene = parseSceneGraphYaml(
      [
        'formatVersion: 1',
        'root:',
        '  children:',
        '    - type: group',
        '      id: field',
        '      children:',
        '        - type: box',
        '          id: monster-card',
        '          class: monster',
        '          data:',
        '            zone: field',
        '          attributes:',
        '            position: 0 1 -3'
      ].join('\n')
    );

    expect(scene.options).toEqual({layer: 'above-stage', mode: '3d'});
    expect(scene.root.id).toBe('scene');
    expect(scene.root.children?.[0]?.id).toBe('field');
    expect(scene.root.children?.[0]?.children?.[0]?.id).toBe('monster-card');
  });

  it('generates deterministic ids for nodes without ids', () => {
    const scene = parseSceneGraphYaml(
      [
        'formatVersion: 1',
        'root:',
        '  children:',
        '    - type: box',
        '      class: card',
        '    - type: box',
        '      class: card'
      ].join('\n')
    );

    expect(scene.root.children?.map((node) => node.id)).toEqual(['scene-box-1', 'scene-box-2']);
  });

  it('round-trips a normalized document', () => {
    const yaml = stringifySceneGraphYaml({
      formatVersion: 1,
      options: {layer: 'below-stage', mode: 'ar'},
      root: {children: [{type: 'box', id: 'card', data: {zone: 'field'}}]}
    });

    expect(yaml).toContain('formatVersion: 1');
    expect(yaml).toContain('layer: below-stage');
    expect(yaml).toContain('id: card');
    expect(yaml).toContain('zone: field');
    expect(parseSceneGraphYaml(yaml)).toEqual(
      normalizeSceneGraphDocument({
        formatVersion: 1,
        options: {layer: 'below-stage', mode: 'ar'},
        root: {children: [{type: 'box', id: 'card', data: {zone: 'field'}}]}
      })
    );
  });

  it('reports malformed documents with the scene graph vocabulary', () => {
    expect(() => parseSceneGraphYaml('formatVersion: 1\nextra: true\nroot: {}\n')).toThrow(
      'Scene graph document extra is not supported.'
    );
    expect(() =>
      parseSceneGraphYaml('formatVersion: 1\noptions:\n  extra: true\nroot: {}\n')
    ).toThrow('Scene graph document options.extra is not supported.');
    expect(() => parseSceneGraphYaml('formatVersion: 2\nroot: {}\n')).toThrow(
      'Scene graph document formatVersion must be 1.'
    );
    expect(() => parseSceneGraphYaml('formatVersion: 1\nroot:\n  children: nope\n')).toThrow(
      'Scene graph root.children must be an array.'
    );
  });

  it('rejects duplicate normalized ids', () => {
    expect(() =>
      normalizeSceneGraphDocument({
        formatVersion: 1,
        root: {
          children: [
            {type: 'box', id: 'duplicate'},
            {type: 'sphere', id: 'duplicate'}
          ]
        }
      })
    ).toThrow('Duplicate scene graph node id: duplicate');
  });
});
