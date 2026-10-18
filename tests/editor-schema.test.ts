import {expect, it} from 'vitest';
import {compileSchemaBundle, validateSchemaInput} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {createTurboWarpExtensionPlan} from '../src/kamishibai-extension.js';
import {sceneSchemaBundles, validateSceneDocumentInput, validateSceneExtensionInput} from '../src/editor-schema.js';
const context = {consumerId: 'applyScene', nowMs: 0, settings: null};
it('closed resources preserve parser acceptance including known published-schema differences', () => {
  for (const [variant, bundle] of Object.entries(sceneSchemaBundles)) {
    const compiled = compileSchemaBundle(bundle);expect(compiled.kind).toBe('compiled');if(compiled.kind!=='compiled')throw Error();
    const ownerValidate = variant === 'bare' ? validateSceneDocumentInput : validateSceneExtensionInput;
    const valid = {formatVersion: 1, options: {layer: '', mode: ''}, root: {id: '', type: '', class: ['a', 'a'], classes: ['a','a'], children: [{id: 'one', attributes: {position: [0,1,2]}}]}};
    const cases = variant === 'bare' ? [valid, {}, {formatVersion: 1, root: {unknown: true}}, {formatVersion: 1, root: {data: {' ': 1}}}, {formatVersion: 1, root: {children: [{id: 'x'},{id: 'x'}]}}]
      : [{scene3d: valid, ar: {cameraId: ''}}, {ar: {}}, {}, {ar: {targets: [{targetId: ' ', selector: '#x'}]}}, {scene3d: {formatVersion: 2, root: {}}}];
    for (const data of cases) {
      const before = JSON.stringify(data);let accepted = true;
      try {createTurboWarpExtensionPlan(variant === 'bare' ? {scene3d: data as never} : data as never);}catch{accepted=false;}
      expect(validateSchemaInput(compiled.validator, data, {context, ownerValidate}).kind === 'valid').toBe(accepted);
      expect(JSON.stringify(data)).toBe(before);
    }
  }
});
