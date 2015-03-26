# catbus
data store (cat?) and message bus (bus!) in Javascript

## Data

The *data* tag creates a named location owned and governed by the *cog* in which it is declared. Its name is required to be unique only within this cog. The containing cog and its descendants can read, write and subscribe via *sensors* to the data contained within it. Parent cogs have no direct access to the *data* contained within their children by design. 

### Data Tag Examples

```html
<data name="currentPage" />
<data name="furColor" value="red" prop="true" />
<data name="eyeColor" value="run determineEyeColor"  />
<data name="numArms" value="prop armCount" />
<data name="numLegs" value="number 4" />
<data name="dynamicConfig" value="config configFromFile" />
<data name="isHungry" value="true" inherit="true" />
<data name="theWordTrue" value="string true" />
```

### Data Tag Attributes

|Name | Description | Required? | Types |
|-----------|--------------|-----------|-----------|
|name| A unique name within the containing *cog* by which this *data* location may be referenced. | Yes | none |
|-----------|--------------|-----------|-----------|
|value|  The initial value to be stored within this *data* location. By default, no value is assigned and it would read as undefined. Unless specified as a 'string' type, primitive values in the tag are automatically converted to true, false and null. | No | *auto*, string, data, prop, run, config |
|-----------|--------------|-----------|-----------|
|inherit|  Set the inherit flag to true to override the initial set value with the value of a *data* location of the same name if there is a match higher up the *cog* hierarchy. | No | none |
|-----------|--------------|-----------|-----------|
|prop|  Set the prop flag to true to expose the *data* location object as a property in the *cog's* script declaration. | No | none |
