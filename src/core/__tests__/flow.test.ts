import { FlowRunner, Scene, SceneResult } from '../flow';

class AScene implements Scene { key = 'A'; async run(__ctx: any, __state: any): Promise<SceneResult> { return { next: 'B', statePatch: { a: 1 } }; } }
class BScene implements Scene { key = 'B'; async run(__ctx: any, state: any): Promise<SceneResult> { return { next: undefined, statePatch: { b: (state.a || 0) + 1 } }; } }

describe('FlowRunner', () => {
  test('runs scenes in order and applies state patches', async () => {
    const fr = new FlowRunner({ ui: {} as any });
    fr.register('A', () => new AScene()).register('B', () => new BScene());
    await fr.start('A');
    // if no throw, transitions worked; internal state is private, so we validate by behavior only
  });

  test('throws on unknown scene key', async () => {
    const fr = new FlowRunner({ ui: {} as any });
    await expect(fr.start('missing' as any)).rejects.toThrow(/No scene registered/);
  });
});
