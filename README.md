# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Methods

|Name | Parameters | Description | Chains? | Returns |
|-----|------------|-------------|---------|---------|
|at, watch, location | location (string or Location) | Assign a new Location to the Sensor (thus no longer watching a prior Location)  | Yes | self |
|on, topic | topic (string, default 'update') | Assign a new topic to the Sensor (thus no longer following a prior topic) | Yes | self |

