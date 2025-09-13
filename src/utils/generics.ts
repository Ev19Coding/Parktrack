export type PromiseValue<T> = T extends Promise<infer U> ? U : never;

export type Satisfies<
	TCustomType extends TTypeToSatisfy,
	TTypeToSatisfy,
> = TCustomType;
