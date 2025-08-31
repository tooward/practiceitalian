import type { UI } from '../core/ui';

export class FakeUI implements UI {
  private answers: string[];
  public out: string[] = [];

  constructor(answers: string[] = []) {
    this.answers = [...answers];
  }

  clear(): void { /* no-op */ }
  print(text: string): void { this.out.push(String(text)); }
  println(text = ''): void { this.out.push(String(text)); }
  async prompt(_question: string): Promise<string> { return this.answers.shift() ?? ''; }
  async pause(_message?: string): Promise<void> { /* no-op */ }
  close(): void { /* no-op */ }
}
