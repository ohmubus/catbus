# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Attribute Methods

|Name | Parameter | Description | Setter Default | Sensor Default | 
|-----|------------|-------------|---------|---------|
|at, watch, location | location: string or Location | Assigns a new Location to the Sensor (thus no longer watching a prior Location).  | none | original Location | 
|on, topic | topic: string | Assigns a new topic to the Sensor (thus no longer following a prior topic). | 'update' | 'update' | 
|run | callback: function |  Sets a callback to be invoked by the Sensor when triggered. | none | none |
|pipe | location: string or Location |  Sets a target Location to which the Sensor writes when triggered. | none | none | 
|change | flag: boolean | Prevents a Sensor from triggering unless an incoming value differs from the last value received. | true | false | 
|batch | flag: boolean | Causes a Sensor to accumulate messages as specified by the Sensor's keep attribute -- until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). | true | false | 
|group | flag: boolean | Causes a Sensor to accumulate messages in a hash by tag as specified by the Sensor's keep attribute --  until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). Often used in tandem with batch and/or retain. | true | false | 
|defer | flag: boolean | Delays triggering the Sensor until messages without the defer flag have been processed. | true | false |
|retain | flag: boolean | Retains messages even after a flush in order to accumulate a fuller list (batch) or hash (group) | true | false |
|host | name: string | Assigns a new host name to the Sensor. When a host is dropped through bus.dropHost(name), all Sensors and Locations assigned to the host are dropped and/or destroyed.  | none | none | 
|need | tag(s): string or [strings] | Prevents a Sensor from triggering until it has received messages for all specified tags. Generally used with batch, group and/or retain flags. | true | false |
