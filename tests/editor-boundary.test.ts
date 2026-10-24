import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, realpathSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect, it} from 'vitest';

it('imports distributed planning and editor schemas without installed editor engines', () => {
  const isolated = mkdtempSync(join(tmpdir(), 'scene-graph-boundary-'));
  try {
    const installed = join(isolated, 'node_modules/@kubohiroya/turbowarp-scene-graph');
    mkdirSync(installed, {recursive: true});
    for (const file of ['package.json', 'dist', 'lib-editor', 'schemas']) {
      cpSync(new URL('../' + file, import.meta.url), join(installed, file), {recursive: true});
    }
    for (const name of ['yaml', '@kubohiroya/turbowarp-ar']) {
      const destination = join(isolated, 'node_modules', name);
      mkdirSync(destination, {recursive: true});
      cpSync(realpathSync(new URL('../node_modules/' + name, import.meta.url)), destination, {recursive: true});
    }
    const script = `
      import {createRequire} from 'node:module';
      const require = createRequire(process.cwd() + '/consumer.mjs');
      for (const name of ['ajv', '@kubohiroya/turbowarp-extension-data-editor']) {
        let found = false;
        try { require.resolve(name); found = true; } catch {}
        if (found) throw Error('Unexpected installed editor engine: ' + name);
      }
      for (const name of ['window', 'document', 'Scratch']) Object.defineProperty(globalThis, name, {
        get() { throw Error('Unexpected GUI access: ' + name); }
      });
      const api = await import('@kubohiroya/turbowarp-scene-graph');
      const editor = await import('@kubohiroya/turbowarp-scene-graph/editor-schema');
      if (!editor.sceneSchemaBundles.bare || !editor.sceneSchemaBundles.wrapper) throw Error('Missing Schema');
      editor.validateSceneGraphDocument({formatVersion: 1, root: {}});
      const plan = api.createTurboWarpExtensionPlan({scene3d: {formatVersion: 1, root: {}}, ar: {}});
      if (!plan.length) throw Error('Missing scene/AR plan');
      console.log('isolated planning and schemas passed');
    `;
    expect(execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: isolated, encoding: 'utf8'
    })).toContain('isolated planning and schemas passed');
  } finally {
    rmSync(isolated, {recursive: true, force: true});
  }
});
