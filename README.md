# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Attribute Methods

|Name | Parameter | Setter Default | Sensor Default | Description | 
|-----|------------|-------------|---------|---------|
|at, watch, location | location (string or Location) | none | original Location | Assigns a new Location to the Sensor (thus no longer watching a prior Location).  |
|on, topic | topic (string) | 'update' | 'update' | Assigns a new topic to the Sensor (thus no longer following a prior topic).| |run | callback (function) | none | none | Sets a callback to be invoked by the Sensor when triggered. |
|pipe | location (string or Location) | none | none | Sets a target Location to which the Sensor writes when triggered. | 
|change | flag (boolean) | true | false | Prevents a Sensor from triggering unless an incoming value differs from the last value received |
|batch | flag (boolean) | true | false | Causes a Sensor to accumulate messages until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). |
|defer | flag (boolean) | true | false | Delays triggering the Sensor until messages without the defer flag have been processed |
