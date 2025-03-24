export namespace constants {
    const SESSION_VERSION: number;
}

export namespace errors {
    class BaseError {}

    const BusyErrorCode: string;
    class BusyError {}

    const FormNotFoundErrorCode: string;
    class FormNotFoundError {}

    const I18nErrorCode: string;
    class I18nError {}

    const QueryNotFoundErrorCode: string;
    class QueryNotFoundError {}

    const SessionErrorCode: string;
    class SessionError {}
}

interface AddFormOptions<Answers, Ref> {
    cb?: (
        answers: Answers,
        ref: Ref,
    ) => Promise<any>;
    i18n?: (
        text: string,
        answers: Partial<Answers>,
        ref: Ref,
    ) => Promise<any>;
}

type ChatId = number | string;

export interface Form<Answers, Ref> {
    name: string;
    queries: Query<Answers, Ref>[];
    options: AddFormOptions<Answers, Ref>;
}

export class FormSet<Answers, Ref> {
    addForm(
        formName: string,
        queries: Query<Answers, Ref>[],
        options?: AddFormOptions<Answers, Ref>,
    ): Form<Answers, Ref>;

    cancel(chatId: ChatId): Promise<boolean>;

    getForms(): Form<Answers, Ref>[];

    on(
        event: "query",
        cb: (
            question: {
                choices: Array<{ text: string }>;
                text: string;
            },
            ref: Ref,
        ) => void,
    ): void;

    process(
        chatId: ChatId,
        text: string,
        ref: Ref,
    ): Promise<void>;

    processForm(
        formName: string,
        chatId: ChatId,
        ref: Ref,
        options?: {
            answers?: Answers;
        },
    ): Promise<void>;
}

export interface Query<Answers, Ref> {
    name?: keyof Answers;

    post?(
        this: QueryController<Answers, Ref>,
        answer: string,
    ): Promise<any>;

    pre?(this: QueryController<Answers, Ref>): Promise<any>;

    question?: {
        choices?: (string | { id: number | string; text: string })[];
        strict?: boolean;
        retryText?: string;
        text?: string;
    };

    text?: string;
}

export interface QueryController<Answers, Ref> {
    form: Form<Answers, Ref>;
    formset: FormSet<Answers, Ref>;
    ref: Ref;

    do<Key extends keyof Answers>(name: Key): Promise<never>;
    
    getAnswer<Key extends keyof Answers>(): Answers[Key];
    getAnswer<Key extends keyof Answers>(name: Key, defaultValue?: any): Answers[Key];

    getAnswers(): Partial<Answers>;

    goto<Key extends keyof Answers>(name: Key): Promise<never>;

    post(): Promise<never>;

    retry(text?: string): Promise<never>;

    send(text: string): Promise<void>;

    setAnswer<Key extends keyof Answers>(key: Key, value: Answers[Key]): void;
    setAnswer<Key extends keyof Answers>(value: Answers[Key]): void;

    setText(text: string): void;

    skip(): Promise<never>;

    stop(): Promise<never>;

    text(text: string, ctx?: Partial<Answers>): Promise<string>;

    unsetAnswer(): void;
    unsetAnswer<Key extends keyof Answers>(name: Key): void;
}
