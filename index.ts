// Purpose
// The purpose of the the utility library is to build a type builder that uses javascript built-in type
// to create more complex or business logic oriented types

// Basic required entities
// Basically, what is need is a factory or builder class that helps build built-in and user defined types
// A user defined type if a type infered from a definition object
// A definition object is just a JSON Like (Dictionary) javscript object that map key to property definition

// #region Contraints
abstract class Constraint {
    protected _map: Map<string, { fn: (value: any) => boolean, message: string }> = new Map();
    protected _errors: string[] = [];
    private _null: boolean = false;
    private _undefined: boolean = false;

    get errors() {
        return this._errors;
    }

    abstract expectType: string | ((value: any) => boolean);
    /**
     * Constraint the variable to support null type
     */
    nullable() {
        this._null = true;
        return this;
    }

    /**
     * Constraint the variable to support null and undefined types
     */
    nullish() {
        this._undefined = true;
        return this;
    }

    /**
     * Check if the constraint fails on the variable. Constraints
     * will be in failure state if any of the validation function fails
     * 
     * **Usage**
     * 
     * ```ts
     * let constraint = (new NumberConstraint).min(10).max(30);
     * 
     * // Applying the constraint to a given value
     * constraint.apply(15); // constraint.fails() === false
     * constraint.apply(45); // constraint.fails() === true
     * ```
     */
    fails() {
        return this._errors.length !== 0;
    }

    apply(value: any) {
        // Reset the errors array to reuse the constraint for a given value
        this._errors = [];
        // Case the value is null and the constraint allow null type
        // return this to wihtout applying any other constraint 
        if (this._null === true && value === null) {
            return this;
        }
        if (this._undefined === true && value === null && typeof value === 'undefined') {
            return this;
        }
        const assertType = typeof this.expectType === 'string' ?
            (_value: any) => typeof _value === this.expectType :
            this.expectType;
        if (!assertType(value)) {
            this._errors.push(typeof this.expectType === 'string' ? `Value must be of type ${this.expectType}, ${typeof value} given` : `Unsupported type ${typeof value}`);
            return this;
        }
        for (const key of this._map.keys()) {
            const v = this._map.get(key);
            if (typeof v === 'undefined' || v === null) {
                continue;
            }
            if (v.fn(value) === false) {
                this._errors.push(v.message);
            }
        }
        return this;
    }
}

// #region Patterns
class StrConstraint extends Constraint {

    get expectType() {
        return 'string';
    }

    minLength(len: number, message?: string) {
        this._map.set('min_len', {
            fn: (value: any) => value.length >= len,
            message: message ?? `Expect length string length to be greater than or equal to ${len}`
        });
        return this;
    }

    maxLength(len: number, message?: string) {
        this._map.set('max_len', {
            fn: (value: any) => value.length <= len,
            message: message ?? `Expect length string length to be less than or equal to ${len}`
        });
        return this;
    }

    pattern(regex: RegExp, message?: string) {
        this._map.set('pattern', {
            fn: (value: any) => regex.test(value),
            message: message ?? `Expect the string to match the corresponding pattern ${regex.source}`
        });
        return this;
    }

    startsWith(needle: string, message?: string) {
        this._map.set('starts_with', {
            fn: (value: any) => value.startsWith(needle),
            message: message ?? `Expect string value to starts with ${needle}`
        });
        return this;
    }

    endsWith(needle: string, message?: string) {
        this._map.set('ends_with', {
            fn: (value: any) => value.endsWith(needle),
            message: message ?? `Expect string value to ends with ${needle}`
        });
        return this;
    }

    length(len: number, message?: string) {
        this._map.set('len', {
            fn: (value: string) => value.length === len,
            message: message ?? `Expect computed length of the string to equal ${len}`
        });
        return this;
    }

    notEmpty(message?: string) {
        this._map.set('ends_with', {
            fn: (value: string) => typeof value !== 'undefined' && typeof value === 'string' && value.trim() !== '',
            message: message ?? `Attribute must not be empty`
        });

    }

    override apply(value: any) {
        return super.apply(value);
    }
}

export class Patterns {
    public static readonly cuidRegex = /^c[^\s-]{8,}$/i;

    public static readonly uuidRegex =
        /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;

    public static readonly email =
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    // Adapted from https://stackoverflow.com/a/3143231
    public static readonly datetime = (args: { precision: number | null; offset: boolean }) => {
        if (args.precision) {
            if (args.offset) {
                return new RegExp(
                    `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}(([+-]\\d{2}:\\d{2})|Z)$`
                );
            } else {
                return new RegExp(
                    `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}Z$`
                );
            }
        } else if (args.precision === 0) {
            if (args.offset) {
                return new RegExp(
                    `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}:\\d{2})|Z)$`
                );
            } else {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$`);
            }
        } else {
            if (args.offset) {
                return new RegExp(
                    `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}:\\d{2})|Z)$`
                );
            } else {
                return new RegExp(
                    `^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$`
                );
            }
        }
    };
}
// #endregion Patterns

class NumberConstraint extends Constraint {
    expectType: string = 'number';

    min(min: number, message?: string) {
        this._map.set('min', {
            fn: (value: any) => value >= min,
            message: message ?? `Expect the value to be greater than or equal to ${min}`
        })
        return this;
    }

    max(min: number, message?: string) {
        this._map.set('max', {
            fn: (value: any) => value <= min,
            message: message ?? `Expect the value to be less than or equal to ${min}`
        })
        return this;
    }

    positive(message?: string) {
        this._map.set('positive', {
            fn: (value: any) => Math.min(0, value) !== 0,
            message: message ?? `Expect the value to be a positive integer`
        })
        return this;
    }

    negative(message?: string) {
        this._map.set('negative', {
            fn: (value: any) => Math.max(0, value) === 0,
            message: message ?? `Expect the value to be a negative integer`
        })
        return this;
    }

    int(message?: string) {
        this._map.set('int', {
            fn: (value: any) => {
                return Number.isSafeInteger(value);
            },
            message: message ?? `Expect the value to be an integer value`
        })
        return this;
    }

    float(message?: string) {
        this._map.set('float', {
            fn: (value: any) => typeof value === 'number' && !Number.isInteger(value),
            message: message ?? `Expect the value to be an integer value`
        })
        return this;
    }

    finite(message?: string) {
        this._map.set('finite', {
            fn: (value: any) => Number.isFinite(value),
            message: message ?? `Expect the value to be an integer value`
        })
        return this;
    }

    between(min: number, max: number, message?: string) {
        this._map.set('between', {
            fn: (value: any) => min <= value && max >= value,
            message: message ?? `Expect the value be less than or equal to ${max} and greater than or equal to ${min}`
        })
        return this;
    }
}

class BoolConstraint extends Constraint {
    expectType: string = 'boolean';
}

class SymbolConstraint extends Constraint {
    expectType: string = 'symbol';
}

class DateContraint extends Constraint {
    // TODO : Add JSDate.isValid()
    expectType = (_value: any) => _value instanceof Date ||
        (typeof _value === 'object' &&
            Object.prototype.toString.call(_value) === '[object Date]');

    // TODO: Add JSDate method after, before, etc... for validation

}

class ArrayConstraint extends Constraint {
    expectType = (_value: any) => Array.isArray(_value);

    min(len: number, message?: string) {
        this._map.set('min', {
            fn: (value: any) => (value ?? []).length >= len,
            message: message ?? `Expects the array length to contains at least ${len} element`
        })
        return this;
    }

    max(len: number, message?: string) {
        this._map.set('min', {
            fn: (value: any) => (value ?? []).length <= len,
            message: message ?? `Expects the array length to contains at most ${len} element`
        })
        return this;
    }

    length(len: number, message?: string) {
        this._map.set('length', {
            fn: (value: any) => value.length === len,
            message: message ?? `Expects the array length to equal ${len}`
        })
        return this;
    }

    noempty(message?: string) {
        this._map.set('min', {
            fn: (value: any) => (value ?? []).length !== 0,
            message: message ?? `Expects the array to not be empty`
        })
        return this;
    }
}

class ObjectConstraint extends Constraint {
    expectType = (value: any) => {
        if (typeof value !== 'object') {
            return false;
        }
        // TODO: Provide an implementation that make more checks
        return true;
    };

    required(keys: string | string[], message?: string) {
        const _keys = typeof keys === 'string' ? [keys] : keys;
        const missingKeys: string[] = [];
        this._map.set('required', {
            fn: (value: any) => {
                for (const key of _keys) {
                    if (!(key in (value as object))) {
                        missingKeys.push(key);
                        continue;
                    }
                }
                return missingKeys.length === 0;
            },
            message: message ?? `Missing object properties ${missingKeys.join(', ')}`
        });
        return this;
    }

    // ofType<T>(key: string, type_: 'number' | 'symbol' | 'string' | 'object' | (new() => any), message?: string) {
    //     this._map.set('required', {
    //         fn: (value: any) => {
    //             if (['number', 'symbol', 'string', 'object'].indexOf(type_ as string) !== -1) {
    //                 return typeof value === type_;
    //             }
    //             return value instanceof type_.constructor;
    //         },
    //         message: message ?? `Expect object key ${key} to be instance of ${String(type_)}`
    //     });
    //     return this;
    // }

}

// #endregion Constraints

// #region Types
type TypeDef<TContraint extends Constraint = Constraint> = {
    description?: string;
    coerce?: (value: any) => any;
    constraint: TContraint;
};

type PartrialTypeDef<TContraint extends Constraint = Constraint> = {
    description?: string;
    coerce?: boolean;
    constraint: TContraint;
};

export class ParseError<TError> extends Error {
    get errors() {
        return this._errors;
    }
    constructor(private readonly _errors: TError, message?: string) {
        super(message);
    }
}

export namespace TypeUtil {
    export type MergeShapes<U extends RawShapeType, V extends RawShapeType> = {
        [k in Exclude<keyof U, keyof V>]: U[k];
    } & V;

    type OptionalKeys<T extends object> = {
        [k in keyof T]: undefined extends T[k] ? k : never;
    }[keyof T];

    type RequiredKeys<T extends object> = {
        [k in keyof T]: undefined extends T[k] ? never : k;
    }[keyof T];

    export type AddQuestionMarks<T extends object> = Partial<
        Pick<T, OptionalKeys<T>>
    > &
        Pick<T, RequiredKeys<T>>;

    export type Identity<T> = T;

    export type Flatten<T extends object> = Identity<{ [k in keyof T]: T[k] }>;

    export type NoNeverKeys<T extends RawShapeType> = {
        [k in keyof T]: [T[k]] extends [never] ? never : k;
    }[keyof T];

    export type NoNever<T extends RawShapeType> = Identity<{
        [k in NoNeverKeys<T>]: k extends keyof T ? T[k] : never;
    }>;

    export const MergeShapes = <U extends RawShapeType, T extends RawShapeType>(
        first: U,
        second: T
    ): T & U => {
        return { ...first, ...second };
    };

    // export type BaseObjectOutputType<Shape extends RawShapeType> =
    //     TypeUtil.Flatten<
    //         TypeUtil.AddQuestionMarks<{
    //             [k in keyof Shape]: Shape[k]["_output"];
    //         }>
    //     >;
    // export type ObjectOutputType<
    //     Shape extends RawShapeType,
    //     Catchall extends TypeAny
    // > = TypeAny extends Catchall
    //     ? TypeUtil.BaseObjectOutputType<Shape>
    //     : TypeUtil.Flatten<
    //         TypeUtil.BaseObjectOutputType<Shape> & { [k: string]: Catchall["_output"] }
    //     >;
}

export type SafeParseReturnType<T> = { errors: any, success: boolean, data?: T };
// #endregion Types

//

export class Type<
    TOutput = any,
    Def extends TypeDef = TypeDef,
    TInput = any
> {
    readonly _type!: TOutput;
    readonly _output!: TOutput;
    readonly _def!: Def;
    readonly _parseFn!: (value: any) => TOutput;

    get description() {
        return this._def.description;
    }

    constructor(def: Def, _parseFn?: (value: any) => TOutput) {
        if (def) {
            this._def = def;
        }
        this._parseFn = _parseFn ?? ((value: any) => value as TOutput);
    }

    parse(value: TInput) {
        const result = this.safeParse(value);
        if (!result.success) {
            throw new ParseError(result.errors, this._def.description ? `Failed parsing ${this._def.description} input` : undefined);
        }
        return result.data as TOutput;
    }

    safeParse(value: any): SafeParseReturnType<TOutput> {
        const _value = (this._parseFn)(value);
        const constraint = this._def.constraint.apply(_value);
        return {
            data: !constraint.fails() ? _value : undefined,
            errors: constraint.errors,
            success: !constraint.fails()
        };
    }

    isOptional(): boolean {
        return this.safeParse(undefined).success;
    }

    isNullable(): boolean {
        return this.safeParse(null).success;
    }

    describe(description: string) {
        const self = (this as any).constructor as new (...args: any) => Type;
        return new self({
            ...this._def,
            description
        });
    }
}

export type TypeAny = Type<any, any, any>;
export type RawShapeType = { [k: string]: TypeAny };
export type TypeOf<T extends Type<unknown, any, unknown>> = T['_output'];
export type { TypeOf as infer };

// #region Parsers
const parseNumber = (value: any) => value as number;
const parseString = (value: any) => value as string;
const parseDate = (value: any) => value as Date;
const parseBool = (value: any) => value as boolean;
const parseSymbol = (value: any) => value as symbol;
// Type<T>
function parseArray<T>(t: Type<T>) {
    // TODO: Handle async parsing
    return (value: any[]) => {
        return value.map((item: any) => t.parse(item))
    }
}

function createPropMapFunc<T extends RawShapeType>(shape: T, propertyMap?: Partial<Record<keyof T, string>>) {
    return () => {
        const _propMap: { inputKey: string; _type: TypeAny; outputKey: string }[] =
            [];
        for (const key in shape) {
            _propMap.push({
                inputKey: propertyMap ? propertyMap[key] ?? key : key,
                _type: shape[key],
                outputKey: key,
            });
        }
        return _propMap;
    };
}

function mergeTypeDefRequiredParams<T>(c: Constraint, def?: PartrialTypeDef, coerceFunc?: (value: any) => T): TypeDef {
    const { constraint, coerce, description } = typeof def !== 'undefined' && def !== null && 'constraint' in def ? def : { description: undefined, coerce: false, ...(def ?? {}), constraint: c }
    return { constraint, coerce: coerce ? coerceFunc : undefined, description };
}

function parseObject<T>(createProp: ReturnType<typeof createPropMapFunc>, instance: T) {
    return (value: any) => {
        // TODO: Handle async parsing
        const propMap = createProp();
        const _instance = instance as any;
        for (const prop of propMap) {
            if (prop.inputKey in value) {
                _instance[prop.outputKey] = prop._type.parse(value[prop.inputKey]);
            }
        }
        return _instance as T;
    }
}
// #endregion Parsers

class BuiltType {

    static str(def?: PartrialTypeDef<StrConstraint>) {
        return new Type<string>(mergeTypeDefRequiredParams(new StrConstraint, def, def?.coerce ? (_value) => String(_value) : undefined), parseString);
    }

    static num(def?: PartrialTypeDef<NumberConstraint>) {
        return new Type<number>(mergeTypeDefRequiredParams(new NumberConstraint, def, def?.coerce ? (_value) => Number(_value) : undefined), parseNumber);
    }

    static bool(def?: PartrialTypeDef<BoolConstraint>) {
        return new Type<boolean>(mergeTypeDefRequiredParams(new BoolConstraint, def, def?.coerce ? (_value) => Boolean(_value) : undefined), parseBool);
    }

    static symbolType(def?: PartrialTypeDef): Type<symbol> {
        return new Type<symbol>(mergeTypeDefRequiredParams(new SymbolConstraint, def, def?.coerce ? (_value) => Symbol(_value) : undefined), parseSymbol);
    }

    static date(def?: PartrialTypeDef<DateContraint>) {
        return new Type<Date>(mergeTypeDefRequiredParams(new DateContraint, def, def?.coerce ? (_value) => (!(_value instanceof Date) ? new Date(_value) : _value) : undefined), parseDate);
    }

    static array<T>(type_: Type<T>, def?: PartrialTypeDef<ArrayConstraint>) {
        return new Type<Array<T>>(mergeTypeDefRequiredParams(new ArrayConstraint, def), parseArray(type_));
    }

    static Type<
        T extends RawShapeType,
    >(dict: T, propMap?: Partial<{ [k in keyof T]: string }>, def?: Omit<PartrialTypeDef, 'coerce'>) {
        return new Type<{ [Property in keyof typeof dict]: TypeOf<typeof dict[Property]> }>(
            mergeTypeDefRequiredParams(new ObjectConstraint, ),
            parseObject<{ [Property in keyof typeof dict]: TypeOf<typeof dict[Property]> }>(
                createPropMapFunc(dict, propMap),
                new Object() as { [Property in keyof typeof dict]: TypeOf<typeof dict[Property]> }
            )
        );
    }
}


const person = BuiltType.Type({
    firstname: BuiltType.str(),
    lastname: BuiltType.str(),
    age: BuiltType.num(),
    birthdate: BuiltType.date(),
    active: BuiltType.bool({ coerce: true, constraint: new BoolConstraint }),
    address: BuiltType.Type({
        country: BuiltType.str(),
        city: BuiltType.str(),
        poBox: BuiltType.num()
    }),
    list: BuiltType.array(BuiltType.str({ coerce: true }))
}, { birthdate: 'birth_date' });

type PersonType = TypeOf<typeof person>;

console.log(person.parse({
    firstname: "Azandrew",
    lastname: "Sidoine",
    age: 10,
    birth_date: new Date(),
    active: 0,
    list: [1, 2, 4, 5]
}));


// const User = BuiltType.Type({
//     firstname: { _type: BuiltType.str(), _key: 'firstname' },
//     lastname: BuiltType.str(),
//     age: BuiltType.num(),
//     birthdate: BuiltType.date(),
//     address: BuiltType.Type({
//         country: BuiltType.str(),
//         city: BuiltType.str(),
//         poBox: BuiltType.num(),
//         emails: BuiltType.Type({
//             domain: BuiltType.str(),
//             // org: BuiltType.undef()
//         })
//     }),
//     scores: BuiltType.array<number>({ constraint: (new ArrayConstraint).min(10) })
// });
// type UserType = TypeOf<typeof User>;

// let user!: UserType;

const name = BuiltType.str();

type NameType = TypeOf<typeof name>;

// const constraint1 = (new StrConstraint).pattern(/^\d$/).apply('43');
// if (constraint1.fails()) {
//     console.log(constraint1.errors);
// }

// const constraint = (new StrConstraint).minLength(7).maxLength(20).startsWith('Lorem');
// let result = constraint.apply('Lorem Ipsum');
// if (result.fails()) {
//     console.log(result.errors);
// }

// let result2 = constraint.apply('Fails starts with');
// if (result2.fails()) {
//     console.log(result2.errors);
// }

// if ((new NumberConstraint).int().apply(2).fails() === false) {
//     console.log('Is number because value is an integer')
// } else {
//     console.log('Is of not a number')
// }

// if ((new NumberConstraint).float().apply(123.2).fails() === false) {
//     console.log('Is number because value is an javascript number')
// } else {
//     console.log('Is of not a number')
// }

// if ((new BoolConstraint).apply(23).fails()) {
//     console.log('Boolean validation fails: ');
// } else {
//     console.log('Boolean does validation fails: ');
// }
// if ((new BoolConstraint).apply(true).fails()) {
//     console.log('Boolean validation fails: ');
// } else {
//     console.log('Boolean does not fails validation: ');
// }
let numConstraint = (new NumberConstraint).min(10).max(30);

if (numConstraint.apply(15).fails()) {
    console.log('Constraint failed...');
} else {
    console.log('Constraint passes...');
}

const nullableConstraint = numConstraint.nullable();
if (nullableConstraint.nullable().apply(null).fails()) {
    console.log('Nullable Constraint failed...');
} else {
    console.log('Nullable Constraint passes...');
}
if (nullableConstraint.apply(45).fails()) {
    console.log('Constraint failed for 45...');
} else {
    console.log('Constraint passes for 45...');
}

const arrayConstraint = (new ArrayConstraint).length(10);
if (arrayConstraint.apply([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).fails()) {
    console.log('Array Constraint failed...');
} else {
    console.log('Array Constraint passes...');
}
// export type RefinementCtx = {
//   addIssue: (arg: IssueData) => void;
//   path: (string | number)[];
// };
// export type ZodRawShape = { [k: string]: ZodTypeAny };
// export type ZodTypeAny = ZodType<any, any, any>;
// export type TypeOf<T extends ZodType<any, any, any>> = T["_output"];
// export type input<T extends ZodType<any, any, any>> = T["_input"];
// export type output<T extends ZodType<any, any, any>> = T["_output"];
// export type { TypeOf as infer };

// export type CustomErrorParams = Partial<util.Omit<ZodCustomIssue, "code">>;
// export interface ZodTypeDef {
//   errorMap?: ZodErrorMap;
//   description?: string;
// }

// export type SafeParseSuccess<Output> = { success: true; data: Output };
// export type SafeParseError<Input> = { success: false; error: ZodError<Input> };

// export type SafeParseReturnType<Input, Output> =
//   | SafeParseSuccess<Output>
//   | SafeParseError<Input>;

// export abstract class ZodType<
//   Output = any,
//   Def extends ZodTypeDef = ZodTypeDef,
//   Input = Output
// > {
//   readonly _type!: Output;
//   readonly _output!: Output;
//   readonly _input!: Input;
//   readonly _def!: Def;

//   get description() {
//     return this._def.description;
//   }

//   _parseSync(input: ParseInput): SyncParseReturnType<Output> {
//     const result = this._parse(input);
//     if (isAsync(result)) {
//       throw new Error("Synchronous parse encountered promise.");
//     }
//     return result;
//   }

//   _parseAsync(input: ParseInput): AsyncParseReturnType<Output> {
//     const result = this._parse(input);
//     return Promise.resolve(result);
//   }

//   parse(data: unknown, params?: Partial<ParseParams>): Output {
//     const result = this.safeParse(data, params);
//     if (result.success) return result.data;
//     throw result.error;
//   }

//   safeParse(
//     data: unknown,
//     params?: Partial<ParseParams>
//   ): SafeParseReturnType<Input, Output> {
//     const ctx: ParseContext = {
//       common: {
//         issues: [],
//         async: params?.async ?? false,
//         contextualErrorMap: params?.errorMap,
//       },
//       path: params?.path || [],
//       schemaErrorMap: this._def.errorMap,
//       parent: null,
//       data,
//       parsedType: getParsedType(data),
//     };
//     const result = this._parseSync({ data, path: ctx.path, parent: ctx });

//     return handleResult(ctx, result);
//   }

//   async parseAsync(
//     data: unknown,
//     params?: Partial<ParseParams>
//   ): Promise<Output> {
//     const result = await this.safeParseAsync(data, params);
//     if (result.success) return result.data;
//     throw result.error;
//   }

//   async safeParseAsync(
//     data: unknown,
//     params?: Partial<ParseParams>
//   ): Promise<SafeParseReturnType<Input, Output>> {
//     const ctx: ParseContext = {
//       common: {
//         issues: [],
//         contextualErrorMap: params?.errorMap,
//         async: true,
//       },
//       path: params?.path || [],
//       schemaErrorMap: this._def.errorMap,
//       parent: null,
//       data,
//       parsedType: getParsedType(data),
//     };

//     const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
//     const result = await (isAsync(maybeAsyncResult)
//       ? maybeAsyncResult
//       : Promise.resolve(maybeAsyncResult));
//     return handleResult(ctx, result);
//   }

//   optional(): ZodOptional<this> {
//     return ZodOptional.create(this) as any;
//   }
//   nullable(): ZodNullable<this> {
//     return ZodNullable.create(this) as any;
//   }
//   nullish(): ZodNullable<ZodOptional<this>> {
//     return this.optional().nullable();
//   }
//   array(): ZodArray<this> {
//     return ZodArray.create(this);
//   }
//   promise(): ZodPromise<this> {
//     return ZodPromise.create(this);
//   }

//   or<T extends ZodTypeAny>(option: T): ZodUnion<[this, T]> {
//     return ZodUnion.create([this, option]) as any;
//   }

//   and<T extends ZodTypeAny>(incoming: T): ZodIntersection<this, T> {
//     return ZodIntersection.create(this, incoming);
//   }

//   transform<NewOut>(
//     transform: (arg: Output, ctx: RefinementCtx) => NewOut | Promise<NewOut>
//   ): ZodEffects<this, NewOut> {
//     return new ZodEffects({
//       schema: this,
//       typeName: ZodFirstPartyTypeKind.ZodEffects,
//       effect: { type: "transform", transform },
//     }) as any;
//   }

//   default(def: util.noUndefined<Input>): ZodDefault<this>;
//   default(def: () => util.noUndefined<Input>): ZodDefault<this>;
//   default(def: any) {
//     const defaultValueFunc = typeof def === "function" ? def : () => def;

//     return new ZodDefault({
//       innerType: this,
//       defaultValue: defaultValueFunc,
//       typeName: ZodFirstPartyTypeKind.ZodDefault,
//     }) as any;
//   }

//   brand<B extends string | number | symbol>(brand?: B): ZodBranded<this, B>;
//   brand<B extends string | number | symbol>(): ZodBranded<this, B> {
//     return new ZodBranded({
//       typeName: ZodFirstPartyTypeKind.ZodBranded,
//       type: this,
//       ...processCreateParams(undefined),
//     });
//   }
//   catch(def: Input): ZodCatch<this>;
//   catch(def: () => Input): ZodCatch<this>;
//   catch(def: any) {
//     const defaultValueFunc = typeof def === "function" ? def : () => def;

//     return new ZodCatch({
//       innerType: this,
//       defaultValue: defaultValueFunc,
//       typeName: ZodFirstPartyTypeKind.ZodCatch,
//     }) as any;
//   }

//   pipe<T extends ZodTypeAny>(target: T): ZodPipeline<this, T> {
//     return ZodPipeline.create(this, target);
//   }

// }
