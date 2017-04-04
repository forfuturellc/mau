# API Reference

**Table of Contents:**

* [FormSet](#FormSet)
* [QueryController](#QueryController)
* [SessionStore](#SessionStore)


<a name="FormSet"></a>

## FormSet
FormSet Class

**Kind**: global class  

* [FormSet](#FormSet)
    * [new FormSet([options])](#new_FormSet_new)
    * [.addForm(name, queries, [options])](#FormSet+addForm)
    * [.processForm(formName, chatID, ref, [options], done(error))](#FormSet+processForm)
    * [.process(chatID, text, ref, done(error))](#FormSet+process)

<a name="new_FormSet_new"></a>

### new FormSet([options])
Emits `query(question, ref)` event.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.prefix] | <code>String</code> | <code>&quot;form:&quot;</code> | Prefix for session ID |
| [options.store] | <code>[SessionStore](#SessionStore)</code> | <code>MemorySessionStore</code> | Session  store. |
| [options.ttl] | <code>Number</code> | <code>+Infinity</code> | Time-To-Live for sessions |

<a name="FormSet+addForm"></a>

### formSet.addForm(name, queries, [options])
Add a new form to this set.

**Kind**: instance method of <code>[FormSet](#FormSet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the form e.g. "profile" |
| queries | <code>Array</code> | Queries to be asked to user |
| [options] | <code>Object</code> | Options |
| [options.cb(answers, ref)] | <code>function</code> | Invoked with the final  answers |
| [options.i18n(text, ctx, ref)] | <code>function</code> | Internalization  function |

<a name="FormSet+processForm"></a>

### formSet.processForm(formName, chatID, ref, [options], done(error))
Process the message using a certain form.
If a form is being processed already, an error will be passed to
callback.

**Kind**: instance method of <code>[FormSet](#FormSet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| formName | <code>String</code> | Name of form |
| chatID | <code>String</code> \| <code>Number</code> | Unique identifier for the originating chat |
| ref | <code>Object</code> \| <code>function</code> | Reference |
| [options] | <code>Object</code> |  |
| [options.answers] | <code>Object</code> | Initial answers hash |
| done(error) | <code>function</code> |  |

<a name="FormSet+process"></a>

### formSet.process(chatID, text, ref, done(error))
Process a message.

**Kind**: instance method of <code>[FormSet](#FormSet)</code>  

| Param | Type | Description |
| --- | --- | --- |
| chatID | <code>String</code> \| <code>Number</code> | Unique identifier for the originating  chat |
| text | <code>String</code> | Text of the message |
| ref | <code>Object</code> \| <code>function</code> | Reference |
| done(error) | <code>function</code> | `error.code` equals `"ENOENT"` if form  was not found. |



<a name="QueryController"></a>

## QueryController
QueryController Class

**Kind**: global class  

* [QueryController](#QueryController)
    * [new QueryController(form, session, ref)](#new_QueryController_new)
    * [.getAnswer([name])](#QueryController+getAnswer) ⇒ <code>\*</code>
    * [.getAnswers()](#QueryController+getAnswers) ⇒ <code>Object</code>
    * [.setAnswer([name], val)](#QueryController+setAnswer)
    * [.skip(done)](#QueryController+skip)
    * [.skipTo(name, done)](#QueryController+skipTo)
    * [.retry([text], done)](#QueryController+retry)
    * [.post(done)](#QueryController+post)
    * [.text(id, ctx)](#QueryController+text) ⇒ <code>String</code> \| <code>null</code>
    * [.stop(done)](#QueryController+stop)

<a name="new_QueryController_new"></a>

### new QueryController(form, session, ref)

| Param | Type | Description |
| --- | --- | --- |
| form | <code>Object</code> | Form |
| session | <code>Object</code> | Session |
| ref | <code>Object</code> | Reference |

<a name="QueryController+getAnswer"></a>

### queryController.getAnswer([name]) ⇒ <code>\*</code>
Retrieve an answer.
If `name` is omitted, it returns answer for the current query.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  
**Returns**: <code>\*</code> - value  

| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>String</code> | Name of query |

<a name="QueryController+getAnswers"></a>

### queryController.getAnswers() ⇒ <code>Object</code>
Retrieve an object/hash containing all the answers.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  
**Returns**: <code>Object</code> - answers  
<a name="QueryController+setAnswer"></a>

### queryController.setAnswer([name], val)
Set an answer.
If `name` is omitted, it sets the answer for the current query.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>String</code> | Name of query |
| val | <code>\*</code> | New value |

<a name="QueryController+skip"></a>

### queryController.skip(done)
Skip the current query.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type |
| --- | --- |
| done | <code>function</code> | 

<a name="QueryController+skipTo"></a>

### queryController.skipTo(name, done)
Skip to the query with `name`.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of query |
| done | <code>function</code> |  |

<a name="QueryController+retry"></a>

### queryController.retry([text], done)
Retry the current query i.e. do not advance to the next query.
This should **ONLY** be used in `post` hooks.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| [text] | <code>String</code> | Text |
| done | <code>function</code> |  |

<a name="QueryController+post"></a>

### queryController.post(done)
Execute the `post` hook and advance.
This should **ONLY** be used in `pre` hooks.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type |
| --- | --- |
| done | <code>function</code> | 

<a name="QueryController+text"></a>

### queryController.text(id, ctx) ⇒ <code>String</code> \| <code>null</code>
Return the internalized text, if possible.
Return `null` if can not be performed.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of the i18n text |
| ctx | <code>Object</code> | Context to be used in interpolation |

<a name="QueryController+stop"></a>

### queryController.stop(done)
Stop processing form at the current query.

**Kind**: instance method of <code>[QueryController](#QueryController)</code>  

| Param | Type |
| --- | --- |
| done | <code>function</code> | 



<a name="SessionStore"></a>

## SessionStore
SessionStore Class

**Kind**: global class  

* [SessionStore](#SessionStore)
    * [.get(sid, done(error,)](#SessionStore+get)
    * [.put(sid, session, options, done(error))](#SessionStore+put)
    * [.del(sid, done(error))](#SessionStore+del)

<a name="SessionStore+get"></a>

### sessionStore.get(sid, done(error,)
Retrieve the session.

**Kind**: instance method of <code>[SessionStore](#SessionStore)</code>  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |
| done(error, | <code>function</code> | session) |

<a name="SessionStore+put"></a>

### sessionStore.put(sid, session, options, done(error))
Save session.

**Kind**: instance method of <code>[SessionStore](#SessionStore)</code>  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |
| session | <code>Object</code> | Session object |
| options | <code>Object</code> |  |
| options.ttl | <code>Number</code> | Session TTL. Equals `+Infinity` to  have the session stored indefinitely. |
| done(error) | <code>function</code> |  |

<a name="SessionStore+del"></a>

### sessionStore.del(sid, done(error))
Destroy session.

**Kind**: instance method of <code>[SessionStore](#SessionStore)</code>  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |
| done(error) | <code>function</code> |  |

