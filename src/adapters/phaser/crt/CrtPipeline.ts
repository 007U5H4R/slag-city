// src/adapters/phaser/crt/CrtPipeline.ts
import Phaser from 'phaser';

export const CRT_KEY = 'crt';

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;   // framebuffer size in pixels
uniform float uScale;       // integer scale k
varying vec2 outTexCoord;

vec2 barrel(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + 0.035 * r2;           // slight curvature; edges bow ~3.5%
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = barrel(outTexCoord);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 texel = 1.0 / uResolution;
  // phosphor bleed: horizontal 3-tap blend across half a *source* pixel (k/2 framebuffer pixels)
  vec4 c0 = texture2D(uMainSampler, uv);
  vec4 cl = texture2D(uMainSampler, uv - vec2(texel.x * uScale * 0.5, 0.0));
  vec4 cr = texture2D(uMainSampler, uv + vec2(texel.x * uScale * 0.5, 0.0));
  vec4 col = c0 * 0.70 + (cl + cr) * 0.15;
  // scanline: one darker framebuffer row per source row
  float row = floor(uv.y * uResolution.y);
  float line = mod(row, uScale);
  float dark = (line < 1.0) ? 0.82 : 1.0;
  gl_FragColor = vec4(col.rgb * dark, 1.0);
}
`;

export class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private k = 1;
  constructor(game: Phaser.Game) {
    super({ game, name: CRT_KEY, fragShader: FRAG });
  }
  setScale(k: number): void { this.k = k; }
  override onPreRender(): void {
    this.set1f('uScale', this.k);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

export function crtInstance(scene: Phaser.Scene): CrtPipeline | undefined {
  const p = scene.cameras.main.getPostPipeline(CrtPipeline) as CrtPipeline | CrtPipeline[];
  return Array.isArray(p) ? p[0] : (p instanceof CrtPipeline ? p : undefined);
}

/** Attach or detach the pass on the scene's main camera. No-op on the Canvas renderer. */
export function enableCrt(scene: Phaser.Scene, on: boolean): void {
  const renderer = scene.renderer;
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  // Register the PostFX class once (idempotent). Done here rather than via the Game `pipeline`
  // config key: Phaser's PipelineConfig type only accepts WebGLPipeline subclasses (new(config)),
  // not a PostFXPipeline (new(game)), so the config key fails typecheck. addPostPipeline is the
  // type-clean API and writes the same postPipelineClasses map the config path would.
  renderer.pipelines.addPostPipeline(CRT_KEY, CrtPipeline);
  const cam = scene.cameras.main;
  if (on) {
    if (!crtInstance(scene)) cam.setPostPipeline(CrtPipeline);
    crtInstance(scene)?.setScale((scene.registry.get('scale') as number | undefined) ?? 1);
  } else {
    const inst = crtInstance(scene);
    if (inst) cam.removePostPipeline(inst);
  }
}
