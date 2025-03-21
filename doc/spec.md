# Spec

## Session spec

|Aspect|Detail|
|------|:----:|
|Version|0|

```ts
interface Session {
    // Session version.
    // Check this prop if you wish to work with
    // sessions from other libraries.
    // Default is 0.
    version: number;

    // The chat associated with this session.
    chatID: string;

    // Name of the form the user is currently on.
    form: string;

    // The query (in the form above) the user is currently on.
    query?: string;

    // Text sent to the user.
    text?: string;

    // Choices sent to the user.
    choices?: integer[];

    // Answers received from user and/or
    // set expicitly by forms.
    answers?: {
        [key: string]: any
    },
}
```
