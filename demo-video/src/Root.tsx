import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, H, W} from './theme';
import {TOTAL} from './timeline';

export const Root: React.FC = () => (
  <Composition id="TinyTPUDemo" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
