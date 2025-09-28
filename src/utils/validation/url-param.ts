import * as v from "valibot";

// Validator schemas for validating the shape of the `useParams()`

export const IdParamSchema = v.pipe(
	v.object({ id: v.optional(v.string(), "1") }),
	v.readonly(),
);
export type IdParamSchema = v.InferOutput<typeof IdParamSchema>;
