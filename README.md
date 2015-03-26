# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Methods

|Name | Parameters | Description | Chains? | Returns |
|-----|------------|-------------|---------|---------|
|at, watch, location | location (string or Location) | Assigns a new Location to the Sensor (thus no longer watching a prior Location).  | Yes | self |
|on, topic | topic (string, default: 'update') | Assigns a new topic to the Sensor (thus no longer following a prior topic). | Yes | self |
|run | callback (function) | Sets a callback to be invoked by the Sensor when triggered. | Yes | self |
|pipe | location (string or Location) | Sets a target Location to which the Sensor writes when triggered. | Yes | self |
|change | flag (optional boolean, default: true) | The change flag prevents a Sensor from triggering unless an incoming value differs from the last value received | Yes | self |
|batch | flag (optional boolean, default: true) | The batch flag causes a Sensor to accumulate messages until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). | Yes | self |
