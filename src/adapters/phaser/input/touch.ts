// src/adapters/phaser/input/touch.ts
// InputSource backed by the on-screen touch overlay. The DOM handlers in @shell/touch-controls mutate the
// shared `touchState`; this just surfaces it to composeInput each frame, exactly like KeyboardSource. When no
// overlay is installed (desktop) the state stays all-false, so it's a harmless no-op to include always.
import type { InputFrame } from '@core/types';
import { touchState } from '@shell/touch-controls';
import type { InputSource } from './keyboard';

export class TouchSource implements InputSource {
  read(): InputFrame { return touchState; }
}
