# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Methods

|Name | Parameters | Description | Chains? | Returns |
|-----|------------|-------------|---------|---------|
|at, watch, location | location (string or Location) | Assign a new Location to the Sensor (thus no longer watching a prior Location).  | Yes | self |
|on, topic | topic (string, default: 'update') | Assign a new topic to the Sensor (thus no longer following a prior topic). | Yes | self |
|change | flag (boolean, default: true) | The change flag prevents a Sensor from triggering unless an incoming value differs from the last value received | Yes | self |
|batch | flag (boolean, default: true) | The batch flag causes a Sensor to accumulate messages until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). | Yes | self |
