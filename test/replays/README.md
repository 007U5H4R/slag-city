Replay goldens: { seed, inputs (encoded InputFrame per tick, see src/core/input-codec.ts), hash (hashState after the last tick) }.
Regenerate deliberately with `UPDATE_GOLDENS=1 npm test` and commit the change with the reason in the commit body.
A golden changing without an intended sim change is a determinism regression.
