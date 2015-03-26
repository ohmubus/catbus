# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Methods

|Name | Parameters | Description | Chains? | Returns |
|-----|------------|-------------|---------|---------|
|at, watch, location | location (string or Location) | Assign a new Location to the Sensor (thus no longer watching a prior Location).  | Yes | self |
|on, topic | topic (string, undefined -> 'update') | Assign a new topic to the Sensor (thus no longer following a prior topic). | Yes | self |
|change | flag (boolean, undefined -> true) | The change flag prevents a sensor from triggering unless an incoming value differs from the last value received | Yes | self |

