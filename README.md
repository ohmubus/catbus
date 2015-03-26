# catbus
data store (cat?) and message bus (bus!) in Javascript


### Sensor Attribute Methods

|Name | Parameter | Description | Setter Default | Sensor Default | 
|-----|------------|-------------|---------|---------|
|at, watch, location | location: string or Location | Assigns a new Location to the Sensor (thus no longer watching a prior Location).  | current Location | original Location | 
|on, topic | topic: string | Assigns a new topic to the Sensor (thus no longer following a prior topic). | 'update' | 'update' | |name | name: string | Assigns a name to the Sensor. | null | null | 
|run | callback: function |  Sets a callback to be invoked by the Sensor when triggered. Can run in specified context attribute. | null | null |
|filter | handler: function |  Sets a function to silently filter messages in the Sensor so they do not trigger or accumulate. The handler will receive (msg, topic, tag) and should return true to continue processing the message. Can run in specified context attribute. | null | null |
|transform | handler: function |  Sets a function to transform messages (if not filtered). The handler will receive (msg, topic, tag) and should return a new modified message. Can run in specified context attribute. | null | null |
|pipe | location: string or Location |  Sets a target Location to which the Sensor writes when triggered. | null | null | 
|change | flag: boolean | Prevents a Sensor from triggering unless an incoming value differs from the last value received. | true | false | 
|batch | flag: boolean | Causes a Sensor to accumulate messages as specified by the Sensor's keep attribute -- until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). | true | false | 
|group | flag: boolean | Causes a Sensor to accumulate messages in a hash by tag as specified by the Sensor's keep attribute --  until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). Often used in tandem with batch and/or retain. | true | false | 
| keep | string: 'last', 'first' or 'all' | Causes a Sensor to keep certain messages (only the first, the last or all of them). If the group flag is set, the keep rules will be applied to messages by tag (not by the full set). | 'last' | 'last' |
|defer | flag: boolean | Delays triggering the Sensor until messages without the defer flag have been processed. | true | false |
|retain | flag: boolean | Retains messages even after a flush in order to accumulate a fuller list (batch) or hash (group) | true | false |
|host | name: string | Assigns a new host name to the Sensor. When a host is dropped through bus.dropHost(name), all Sensors and Locations assigned to the host are dropped and/or destroyed.  | null | null | 
|need | tag(s): string or [strings] | Prevents a Sensor from triggering until it has received messages for all specified tags. Generally used with batch, group and/or retain flags. | null | null |
|active | flag: boolean | Enables or disables the Sensor ability to trigger. | true | true |
|max | count: integer | Limits the number of times a Sensor can trigger. When the max is reached, the Sensor will automatically drop(). A value of -1 has no trigger limit. | -1 | -1 |
