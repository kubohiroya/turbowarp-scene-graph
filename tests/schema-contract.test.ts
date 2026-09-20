import {readFile} from 'node:fs/promises';

import {Ajv2020, type ValidateFunction} from 'ajv/dist/2020.js';
import {beforeAll, describe, expect, it} from 'vitest';

import {validateKamishibai3DSceneExtension} from '../src/kamishibai-extension.js';
import {validateSceneGraphDocument, validateSceneGraphNode} from '../src/scene-graph.js';

/**
 * The JSON Schemas are a second description of shapes the TypeScript validators already enforce.
 * A second description is only safe while something proves the two agree, so every case below is
 * run through both and the verdicts are compared. A schema loosened or tightened on its own fails
 * here rather than silently diverging from what the package actually accepts.
 */

const SCHEMA_FILES = [
  'scene-node.schema.json',
  'scene-document.schema.json',
  'kamishibai-3d-scene-extension.schema.json'
] as const;

const BASE_URL = 'https://raw.githubusercontent.com/kubohiroya/turbowarp-scene-graph/main/schemas/';

type Case = {name: string; value: unknown; valid: boolean};

function assertsToBoolean(assert: (value: unknown) => void, value: unknown): boolean {
  try {
    assert(value);
    return true;
  } catch {
    return false;
  }
}

const nodeCases: Case[] = [
  {name: 'empty node', value: {}, valid: true},
  {name: 'typed node', value: {type: 'box', id: 'card'}, valid: true},
  {name: 'class as string', value: {class: 'a b'}, valid: true},
  {name: 'class as array', value: {class: ['a', 'b']}, valid: true},
  {name: 'classes array', value: {classes: ['a']}, valid: true},
  {name: 'scalar data', value: {data: {zone: 'field', count: 2, on: true, none: null}}, valid: true},
  {name: 'array attribute', value: {attributes: {position: [0, 1, -3]}}, valid: true},
  {name: 'vector attribute', value: {attributes: {position: {x: 0, y: 1, z: -3}}}, valid: true},
  {name: 'nested children', value: {children: [{type: 'box', children: [{type: 'sphere'}]}]}, valid: true},
  {name: 'unknown key', value: {colour: 'red'}, valid: false},
  {name: 'non-object', value: [], valid: false},
  {name: 'null', value: null, valid: false},
  {name: 'numeric type', value: {type: 1}, valid: false},
  {name: 'numeric id', value: {id: 1}, valid: false},
  {name: 'class as number', value: {class: 1}, valid: false},
  {name: 'classes with a number', value: {classes: ['a', 1]}, valid: false},
  {name: 'data as array', value: {data: []}, valid: false},
  {name: 'empty data key', value: {data: {'': 'x'}}, valid: false},
  {name: 'nested object value', value: {data: {pose: {inner: {x: 1}}}}, valid: false},
  {name: 'nested array value', value: {attributes: {position: [[0]]}}, valid: false},
  {name: 'children not an array', value: {children: {}}, valid: false},
  {name: 'invalid child', value: {children: [{colour: 'red'}]}, valid: false}
];

const documentCases: Case[] = [
  {name: 'minimal document', value: {formatVersion: 1, root: {}}, valid: true},
  {
    name: 'document with options',
    value: {formatVersion: 1, options: {layer: 'below-stage', mode: 'ar'}, root: {}},
    valid: true
  },
  {name: 'partial options', value: {formatVersion: 1, options: {mode: 'ar'}, root: {}}, valid: true},
  {name: 'missing root', value: {formatVersion: 1}, valid: false},
  {name: 'missing formatVersion', value: {root: {}}, valid: false},
  {name: 'wrong formatVersion', value: {formatVersion: 2, root: {}}, valid: false},
  {name: 'unknown document key', value: {formatVersion: 1, root: {}, extra: 1}, valid: false},
  {name: 'unknown option key', value: {formatVersion: 1, options: {depth: 1}, root: {}}, valid: false},
  {name: 'numeric option', value: {formatVersion: 1, options: {layer: 1}, root: {}}, valid: false},
  {name: 'options as array', value: {formatVersion: 1, options: [], root: {}}, valid: false},
  {name: 'invalid root', value: {formatVersion: 1, root: {colour: 'red'}}, valid: false},
  {name: 'non-object', value: 'scene', valid: false}
];

const extensionCases: Case[] = [
  {name: 'empty fragment', value: {}, valid: true},
  {name: 'scene3d only', value: {scene3d: {formatVersion: 1, root: {}}}, valid: true},
  {name: 'ar only', value: {ar: {}}, valid: true},
  {
    name: 'both halves',
    value: {
      scene3d: {formatVersion: 1, root: {children: [{type: 'box', id: 'card'}]}},
      ar: {cameraId: 'front', layer: 'below-stage', targets: [{targetId: 'm', selector: '#card'}]}
    },
    valid: true
  },
  {name: 'unknown key', value: {scene2d: {}}, valid: false},
  {name: 'invalid scene3d', value: {scene3d: {formatVersion: 2, root: {}}}, valid: false},
  {name: 'unknown ar key', value: {ar: {tracker: 'marker'}}, valid: false},
  {name: 'layer outside the vocabulary', value: {ar: {layer: 'camera-under-3d'}}, valid: false},
  {name: 'numeric cameraId', value: {ar: {cameraId: 1}}, valid: false},
  {name: 'targets not an array', value: {ar: {targets: 'm'}}, valid: false},
  {name: 'target missing selector', value: {ar: {targets: [{targetId: 'm'}]}}, valid: false},
  {name: 'empty targetId', value: {ar: {targets: [{targetId: '', selector: '#card'}]}}, valid: false},
  {name: 'unknown target key', value: {ar: {targets: [{targetId: 'm', selector: '#c', z: 1}]}}, valid: false},
  {name: 'non-object', value: [], valid: false}
];

const validators = new Map<string, ValidateFunction>();

beforeAll(async () => {
  const ajv = new Ajv2020({allErrors: true, strict: false});
  for (const file of SCHEMA_FILES) {
    ajv.addSchema(JSON.parse(await readFile(`schemas/${file}`, 'utf8')) as object, BASE_URL + file);
  }
  for (const file of SCHEMA_FILES) {
    const compiled = ajv.getSchema(BASE_URL + file);
    if (compiled === undefined) throw new Error(`Schema did not compile: ${file}`);
    validators.set(file, compiled);
  }
});

describe('JSON Schema contracts', () => {
  it.each(SCHEMA_FILES)('%s keeps the package identity', async (file) => {
    const schema = JSON.parse(await readFile(`schemas/${file}`, 'utf8')) as Record<string, unknown>;
    expect(schema['$id']).toBe(BASE_URL + file);
    expect(schema['$schema']).toBe('https://json-schema.org/draft/2020-12/schema');
  });

  const suites: Array<[string, string, Case[], (value: unknown) => void]> = [
    ['scene-node.schema.json', 'node', nodeCases, (value) => validateSceneGraphNode(value)],
    ['scene-document.schema.json', 'document', documentCases, validateSceneGraphDocument],
    [
      'kamishibai-3d-scene-extension.schema.json',
      'extension',
      extensionCases,
      validateKamishibai3DSceneExtension
    ]
  ];

  for (const [file, label, cases, assert] of suites) {
    describe(`${file} agrees with the ${label} validator`, () => {
      it.each(cases)(`$name`, ({value, valid}) => {
        const schemaVerdict = validators.get(file)?.(value) === true;
        const codeVerdict = assertsToBoolean(assert, value);

        expect({schema: schemaVerdict, code: codeVerdict}).toEqual({schema: valid, code: valid});
      });
    });
  }
});
