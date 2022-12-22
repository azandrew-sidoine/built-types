// JavaScript has 8 Datatypes
// 1. String
// 2. Number
// 3. Bigint
// 4. Boolean
// 5. Undefined
// 5. Null
// 7. Symbol
// 8. Object

// The Object Datatype
// The object data type can contain:

// 1. An object
// 2. An array
// 3. A date

// Purpose
// The purpose of the the utility library is to build a type builder that uses javascript built-in type
// to create more complex or business logic oriented types

// Basic required entities
// Basically, what is need is a factory or builder class that helps build built-in and user defined types
// A user defined type if a type infered from a definition object
// A definition object is just a JSON Like (Dictionary) javscript object that map key to property definition
type ValidatorType = { validate: () => boolean };
type TypeDef = {
  valueType: Type;
  required: boolean;
  description?: string;
  validator: ValidatorType;
};
type Error<TError> = { data: TError };

export class Type<
  TOutput = any,
  Def extends TypeDef = TypeDef,
  TInput = TOutput
> {
  readonly _type!: TOutput;
  readonly _output!: TOutput;
  readonly _input!: TInput;
  readonly _def!: Def;

  get description() {
    return this._def.description;
  }

  constructor(def: Def) {
    this._def = def;
  }
}

export class ObjectType<TKey = string, TValue extends TypeAny = TypeAny> {
  constructor(internal: any) {}
}

export type TypeAny = Type<any, any, any>;
export type ZodRawShape = { [k: string]: TypeAny };
export type TypeOf<T extends Type<unknown, any, unknown>> = T['_output'];
export type InputType<T extends Type<unknown, any, unknown>> = T['_input'];
export type OutputType<T extends Type<unknown, any, unknown>> = T['_output'];
export type { TypeOf as infer };

export type SafeParseError<Input> = { success: false; error: Error<Input> };
export type SafeParseSuccess<Output> = { success: true; data: Output };

type PropMapType = { [key: string]: TypeDef };

class BuiltType {
  static String_(def: TypeDef) {
    return new Type<typeof String>(def);
  }

  static Type_(dict: PropMapType) {
    const _keys = Object.keys(dict);
    const _tValues = Array.from(Object.values(dict)).map(
      (value) => new Type<typeof value>(value)
    );
  }
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

//   describe(description: string): this {
//     const This = (this as any).constructor;
//     return new This({
//       ...this._def,
//       description,
//     });
//   }

//   pipe<T extends ZodTypeAny>(target: T): ZodPipeline<this, T> {
//     return ZodPipeline.create(this, target);
//   }

//   isOptional(): boolean {
//     return this.safeParse(undefined).success;
//   }
//   isNullable(): boolean {
//     return this.safeParse(null).success;
//   }
// }
