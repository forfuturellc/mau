# API Reference

**Table of Contents:**

* [constants](#constants)
* [errors](#errors)
* [FormSet](#FormSet)
* [QueryController](#QueryController)
* [SessionStore](#SessionStore)

* * *

<a name="module_constants"></a>

## constants
<a name="module_constants.SESSION_VERSION"></a>

### constants.SESSION\_VERSION
Version of session used by the library.
Different libraries may use same version of the session,
allowing the sessions to be interchangeable between them.

**Kind**: static constant of [<code>constants</code>](#module_constants)  

* * *

<a name="module_errors"></a>

## errors

* [errors](#module_errors)
    * [.BusyError](#module_errors.BusyError)
        * [new exports.BusyError([message])](#new_module_errors.BusyError_new)
    * [.FormNotFoundError](#module_errors.FormNotFoundError)
        * [new exports.FormNotFoundError([message])](#new_module_errors.FormNotFoundError_new)
    * [.I18nError](#module_errors.I18nError)
        * [new exports.I18nError([message])](#new_module_errors.I18nError_new)
    * [.QueryNotFoundError](#module_errors.QueryNotFoundError)
        * [new exports.QueryNotFoundError([message])](#new_module_errors.QueryNotFoundError_new)
    * [.SessionError](#module_errors.SessionError)
        * [new exports.SessionError([message])](#new_module_errors.SessionError_new)

<a name="module_errors.BusyError"></a>

### errors.BusyError
BusyError

**Kind**: static class of [<code>errors</code>](#module_errors)  
<a name="new_module_errors.BusyError_new"></a>

#### new exports.BusyError([message])
Object busy doing something already.
Usually thrown when a form is already being processed.
Error code is `"EBUSY"`.


| Param | Type | Default |
| --- | --- | --- |
| [message] | <code>String</code> \| <code>Error</code> | <code>Busy</code> | 

<a name="module_errors.FormNotFoundError"></a>

### errors.FormNotFoundError
FormNotFoundError

**Kind**: static class of [<code>errors</code>](#module_errors)  
<a name="new_module_errors.FormNotFoundError_new"></a>

#### new exports.FormNotFoundError([message])
Form not found.
Error code is `"ENOFORM"`.


| Param | Type | Description |
| --- | --- | --- |
| [message] | <code>String</code> \| <code>Error</code> | If string, should be name of form. |

<a name="module_errors.I18nError"></a>

### errors.I18nError
I18nError

**Kind**: static class of [<code>errors</code>](#module_errors)  
<a name="new_module_errors.I18nError_new"></a>

#### new exports.I18nError([message])
Error occurred during internationalization.
Error code is `"E18N"`;


| Param | Type | Default |
| --- | --- | --- |
| [message] | <code>String</code> \| <code>Error</code> | <code>I18n failed</code> | 

<a name="module_errors.QueryNotFoundError"></a>

### errors.QueryNotFoundError
QueryError

**Kind**: static class of [<code>errors</code>](#module_errors)  
<a name="new_module_errors.QueryNotFoundError_new"></a>

#### new exports.QueryNotFoundError([message])
Query not found in form.
Error code is `"ENOQUERY"`.


| Param | Type | Default |
| --- | --- | --- |
| [message] | <code>String</code> \| <code>Error</code> | <code>Query not found</code> | 

<a name="module_errors.SessionError"></a>

### errors.SessionError
SessionError

**Kind**: static class of [<code>errors</code>](#module_errors)  
<a name="new_module_errors.SessionError_new"></a>

#### new exports.SessionError([message])
Session error.
Error code is `"ESESS"`.


| Param | Type | Default |
| --- | --- | --- |
| [message] | <code>String</code> \| <code>Error</code> | <code>Session error</code> | 


* * *

<a name="FormSet"></a>

## FormSet
**Kind**: global class  

* [FormSet](#FormSet)
    * [new FormSet([options])](#new_FormSet_new)
    * [.getForms()](#FormSet+getForms) ⇒ [<code>Array.&lt;Form&gt;</code>](#Form)
    * [.addForm(name, queries, [options])](#FormSet+addForm) ⇒ [<code>Form</code>](#Form)
    * [.processForm(name, chatID, ref, [options])](#FormSet+processForm)
    * [.process(chatID, text, ref)](#FormSet+process)
    * [.cancel(chatID)](#FormSet+cancel)

<a name="new_FormSet_new"></a>

### new FormSet([options])
Emits `query(question, ref)` event.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.prefix] | <code>String</code> | <code>&quot;form:&quot;</code> | Prefix for session ID |
| [options.store] | [<code>SessionStore</code>](#SessionStore) | <code>MemorySessionStore</code> | Session store. |
| [options.ttl] | <code>Number</code> | <code>+Infinity</code> | Time-To-Live for sessions. Ensure that the session store you use does supports using TTL-ed sessions. |

<a name="FormSet+getForms"></a>

### formSet.getForms() ⇒ [<code>Array.&lt;Form&gt;</code>](#Form)
Return the added forms.

**Kind**: instance method of [<code>FormSet</code>](#FormSet)  
<a name="FormSet+addForm"></a>

### formSet.addForm(name, queries, [options]) ⇒ [<code>Form</code>](#Form)
Add a new form to this set.

**Kind**: instance method of [<code>FormSet</code>](#FormSet)  
**Returns**: [<code>Form</code>](#Form) - created form  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the form e.g. "profile" |
| queries | <code>Array</code> | Queries to be asked to user |
| [options] | <code>Object</code> | Options |
| [options.cb(answers, ref)] | <code>function</code> | Invoked with the final answers, when the form has been completed. |
| [options.i18n(text, ctx, ref)] | <code>function</code> | Internationalization function. |

<a name="FormSet+processForm"></a>

### formSet.processForm(name, chatID, ref, [options])
Process the message using a certain form.

If `chatID` is a Number, it is converted to string, using
`.toString()`.

If `ref` is a Function, it is invoked once and its return value
used as the actual reference.

**Kind**: instance method of [<code>FormSet</code>](#FormSet)  
**Throws**:

- <code>BusyError</code> if form is already being processed.
- <code>FormNotFoundError</code> if form is not found.
- <code>SessionError</code> if session is incompatible, or any error thrown by session store.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of form |
| chatID | <code>String</code> \| <code>Number</code> | Unique identifier for the originating chat |
| ref | <code>Object</code> \| <code>function</code> | Reference |
| [options] | <code>Object</code> | Options |
| [options.answers] | <code>Object</code> | Initial answers hash |

**Example** *(chatID as Number)*  
```js
// the two invocations below are 'similar'
formset.processForm(name, "12345", ref);
formset.processForm(name, 12345, ref);
```
**Example** *(FormNotFoundError)*  
```js
// Assuming there's no form with the name '404'.
formset.processForm("404", chatID, ref, function(error) {
    assert.ok(error instanceof mau.errors.FormNotFoundError);
});
```
**Example** *(BusyError)*  
```js
// Assuming there's a form already being processed.
formset.processForm(name, chatID, ref, function(error) {
    assert.ok(error instanceof mau.errors.BusyError);
});
```
<a name="FormSet+process"></a>

### formSet.process(chatID, text, ref)
Process a message. This is a variant of `FormSet#processForm()`
method. It tries to service the message using an active form,
which if not found, a `FormNotFoundError` error is thrown.

**Kind**: instance method of [<code>FormSet</code>](#FormSet)  
**Throws**:

- <code>FormNotFoundError</code> if form is not found.
- <code>SessionError</code> if session is incompatible, or any error thrown by session store.


| Param | Type | Description |
| --- | --- | --- |
| chatID | <code>String</code> \| <code>Number</code> | Unique identifier for the originating  chat |
| text | <code>String</code> | Text of the message |
| ref | <code>Object</code> \| <code>function</code> | Reference |

**Example**  
```js
// Assuming there's a form named 'hello'
try {
     await formset.process(chatID, text, ref);
} catch (error) {
     if (error && error instanceof mau.errors.FormNotFoundError) {
        // There's NO active form.
        // Let's trigger the 'hello' form.
        await formset.processForm("hello", chatID, text, ref);
    }
}
```
<a name="FormSet+cancel"></a>

### formSet.cancel(chatID)
Cancel current form processing for chat.

**Kind**: instance method of [<code>FormSet</code>](#FormSet)  
**Throws**:

- <code>SessionError</code> if fails to cancel form processing

**Todo**

- [ ] Test this method!


| Param | Type | Description |
| --- | --- | --- |
| chatID | <code>String</code> \| <code>Number</code> | Unique identifier for the originating  chat |


* * *

<a name="QueryController"></a>

## QueryController
**Kind**: global class  

* [QueryController](#QueryController)
    * [new QueryController()](#new_QueryController_new)
    * [new QueryController(formset, form, session, ref)](#new_QueryController_new)
    * [.getAnswers()](#QueryController+getAnswers) ⇒ <code>Object</code>
    * [.getAnswer([name], [defaultValue])](#QueryController+getAnswer) ⇒ <code>\*</code>
    * [.setAnswer([name], val)](#QueryController+setAnswer)
    * [.unsetAnswer([name])](#QueryController+unsetAnswer)
    * [.skip()](#QueryController+skip)
    * [.goto(name)](#QueryController+goto)
    * [.retry([text])](#QueryController+retry)
    * [.post()](#QueryController+post)
    * [.text(id, [ctx])](#QueryController+text)
    * [.stop()](#QueryController+stop)
    * [.do(name)](#QueryController+do)
    * [.send(id)](#QueryController+send)
    * [.setText(id)](#QueryController+setText)

<a name="new_QueryController_new"></a>

### new QueryController()
A query controller allows us to move from one query to the
next; supporting operations such as skipping to a target query.

<a name="new_QueryController_new"></a>

### new QueryController(formset, form, session, ref)
**Throws**:

- <code>QueryNotFoundError</code> if current query is not found.


| Param | Type | Description |
| --- | --- | --- |
| formset | [<code>FormSet</code>](#FormSet) | FormSet |
| form | [<code>Form</code>](#Form) | Form |
| session | <code>Session</code> | Session |
| ref | <code>Object</code> | Reference |

<a name="QueryController+getAnswers"></a>

### queryController.getAnswers() ⇒ <code>Object</code>
Retrieve an object/hash containing all the answers.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Returns**: <code>Object</code> - answers  
<a name="QueryController+getAnswer"></a>

### queryController.getAnswer([name], [defaultValue]) ⇒ <code>\*</code>
Retrieve an answer.
If `name` is omitted/falsey, it returns answer for the current query.
To use `defaultValue`, `name` must be specified.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Returns**: <code>\*</code> - value  
**Throws**:

- <code>QueryNotFoundError</code> If the current query is not found.


| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>String</code> | Name of query. This is actually a path. |
| [defaultValue] | <code>\*</code> | Default value |

<a name="QueryController+setAnswer"></a>

### queryController.setAnswer([name], val)
Set an answer.
If `name` is omitted, it sets the answer for the current query.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Throws**:

- <code>QueryNotFoundError</code> if current query is not found.


| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>String</code> | Name of query. This is actually a path. |
| val | <code>\*</code> | New value |

<a name="QueryController+unsetAnswer"></a>

### queryController.unsetAnswer([name])
Unset an answer.
If `name` is omitted, it unsets the answer for the current query.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Throws**:

- <code>QueryNotFoundError</code> if current query is not found


| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>String</code> | Name of query. This is actually a path. |

<a name="QueryController+skip"></a>

### queryController.skip()
Skip the current query.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
<a name="QueryController+goto"></a>

### queryController.goto(name)
Skip to the query with `name`.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of query |

<a name="QueryController+retry"></a>

### queryController.retry([text])
Retry the current query i.e. do not advance to the next query.
This should **ONLY** be used in `post` hooks.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  

| Param | Type | Description |
| --- | --- | --- |
| [text] | <code>String</code> | Text |

<a name="QueryController+post"></a>

### queryController.post()
Execute the `post` hook and advance.
This should **ONLY** be used in `pre` hooks.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
<a name="QueryController+text"></a>

### queryController.text(id, [ctx])
Return the internalized text, if possible.
Return `null` if can not be performed.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Throws**:

- <code>I18nError</code> if i18n is unavailable.


| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of the i18n text |
| [ctx] | <code>Object</code> | Context to be used in interpolation |

<a name="QueryController+stop"></a>

### queryController.stop()
Stop processing form at the current query.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
<a name="QueryController+do"></a>

### queryController.do(name)
Skip to the form with `name`.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Todo**

- [ ] Test this method!


| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of form |

<a name="QueryController+send"></a>

### queryController.send(id)
Send text message.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Todo**

- [ ] Test this method!
- [ ] Wait for the message to actually be sent! Currently, the
 `query` event is fired and we move on without waiting for
 the event handler to report status of the sending operation.


| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of the i18n text |

<a name="QueryController+setText"></a>

### queryController.setText(id)
Set the current query's text.

**Kind**: instance method of [<code>QueryController</code>](#QueryController)  
**Todo**

- [ ] Test this method!


| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | ID of the i18n text |


* * *

<a name="SessionStore"></a>

## SessionStore

* [SessionStore](#SessionStore)
    * [.get(sid)](#SessionStore+get) ⇒ <code>Promise.&lt;Session&gt;</code>
    * [.put(sid, session, options)](#SessionStore+put) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.del(sid)](#SessionStore+del) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="SessionStore+get"></a>

### sessionStore.get(sid) ⇒ <code>Promise.&lt;Session&gt;</code>
Retrieve the session.

**Kind**: instance method of [<code>SessionStore</code>](#SessionStore)  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |

<a name="SessionStore+put"></a>

### sessionStore.put(sid, session, options) ⇒ <code>Promise.&lt;void&gt;</code>
Save session.

**Kind**: instance method of [<code>SessionStore</code>](#SessionStore)  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |
| session | <code>Object</code> | Session object |
| options | <code>Object</code> |  |
| options.ttl | <code>Number</code> | Session TTL. Equals `+Infinity` to  have the session stored indefinitely. |

<a name="SessionStore+del"></a>

### sessionStore.del(sid) ⇒ <code>Promise.&lt;boolean&gt;</code>
Destroy session.

**Kind**: instance method of [<code>SessionStore</code>](#SessionStore)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves to a boolean
 indicating whether the session has been removed.  

| Param | Type | Description |
| --- | --- | --- |
| sid | <code>String</code> | Session ID |

