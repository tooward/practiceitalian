// flow.ts – lightweight scene framework for CLI flows
import { UI } from './ui';

export type SceneKey = string;

export interface FlowContext {
  ui: UI;
  // you can extend this with additional services as needed
  [k: string]: any;
}

export interface SceneResult {
  next?: SceneKey; // next scene key; omit/undefined to stop
  statePatch?: Record<string, any>; // optional state updates
}

export interface Scene {
  key: SceneKey;
  run(ctx: FlowContext, state: Record<string, any>): Promise<SceneResult | void>;
}

export type SceneFactory = (key: SceneKey) => Scene;

export class FlowRunner {
  private scenes = new Map<SceneKey, SceneFactory>();
  private state: Record<string, any> = {};

  constructor(private ctx: FlowContext) {}

  register(key: SceneKey, factory: SceneFactory): this {
    this.scenes.set(key, factory);
    return this;
  }

  async start(initial: SceneKey, initialState: Record<string, any> = {}): Promise<void> {
    this.state = { ...initialState };
    let currentKey: SceneKey | undefined = initial;
    while (currentKey) {
      const factory = this.scenes.get(currentKey);
      if (!factory) throw new Error(`No scene registered for key: ${currentKey}`);
      const scene = factory(currentKey);
      const res = await scene.run(this.ctx, this.state);
      if (res?.statePatch) this.state = { ...this.state, ...res.statePatch };
      currentKey = res?.next;
    }
  }
}
