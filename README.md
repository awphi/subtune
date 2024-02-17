# Subtune

A small, flexible library for node to automagically synchronise badly aligned subtitles with arbritrary audio.

- Fast - utilizes [Silero's VAD model](https://github.com/snakers4/silero-vad) and FFTs to greatly reduce computational complexity
- Multi-language - doesn't care about what language your subtitles/audio is in.
- Configurable - supports full configuration of the VAD model and audio/subtitle sample window size

## Installing

```
npm install subtune
```

## Usage

```js
import Subtune from 'subtune';

// mono audio samples at 44.8kHz
const audio = new Float32Array(...);
const subtitles = [{start: 0, end: 1000}, ...];
const offset = Subtune.run(subtitles, audio, 44800);
```

## References

- Based on the methodology of [ffsubsync](https://github.com/smacke/ffsubsync#how-it-works)
