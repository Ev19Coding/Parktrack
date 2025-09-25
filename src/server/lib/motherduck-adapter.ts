import type { DuckDBConnection } from "@duckdb/node-api";
import { createAdapterFactory } from "better-auth/adapters";
import { getParkTrackDatabaseConnection } from "../database/util";

interface MotherDuckAdapterConfig {
	debugLogs?: boolean;
	usePlural?: boolean;
}

export const motherDuckAdapter = (
	config: MotherDuckAdapterConfig | null | undefined = {},
) =>
	createAdapterFactory({
		config: {
			adapterId: "motherduck-adapter",
			adapterName: "MotherDuck Adapter",
			usePlural: config?.usePlural ?? false,
			debugLogs: config?.debugLogs ?? false,
			supportsJSON: true,
			supportsDates: true,
			supportsBooleans: true,
			supportsNumericIds: false,
		},
		adapter: ({ debugLog }) => {
			let connection: DuckDBConnection | null = null;

			const getConnection = async (): Promise<DuckDBConnection> => {
				if (!connection) {
					connection = await getParkTrackDatabaseConnection();
				}
				return connection;
			};

			const escapeValue = (value: unknown): string => {
				if (value === null || value === undefined) {
					return "NULL";
				}
				if (typeof value === "string") {
					return `'${value.replace(/'/g, "''")}'`;
				}
				if (typeof value === "number" || typeof value === "boolean") {
					return String(value);
				}
				if (value instanceof Date) {
					return `'${value.toISOString()}'`;
				}
				if (typeof value === "object") {
					return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
				}
				return `'${String(value).replace(/'/g, "''")}'`;
			};

			// Handle Better Auth's where clause format
			const buildWhereClause = (
				where: Array<{ field: string; value: unknown; operator?: string }>,
			): string => {
				if (!where || where.length === 0) return "";

				// Map Better Auth operators to SQL operators
				const operatorMap: Record<string, string> = {
					eq: "=",
					neq: "!=",
					gt: ">",
					gte: ">=",
					lt: "<",
					lte: "<=",
					like: "LIKE",
					ilike: "ILIKE",
					in: "IN",
					nin: "NOT IN",
					is: "IS",
					isNot: "IS NOT",
				};

				const conditions = where
					.map(({ field, value, operator = "eq" }) => {
						const sqlOperator = operatorMap[operator] || operator;

						if (value === null && (sqlOperator === "IS" || operator === "is")) {
							return `${field} IS NULL`;
						}

						if (
							value === null &&
							(sqlOperator === "IS NOT" || operator === "isNot")
						) {
							return `${field} IS NOT NULL`;
						}

						if (value === null) {
							return `${field} IS NULL`;
						}

						if (sqlOperator === "IN" || sqlOperator === "NOT IN") {
							const valueList = Array.isArray(value)
								? value.map(escapeValue).join(", ")
								: escapeValue(value);
							return `${field} ${sqlOperator} (${valueList})`;
						}

						return `${field} ${sqlOperator} ${escapeValue(value)}`;
					})
					.join(" AND ");

				return `WHERE ${conditions}`;
			};

			const buildSetClause = (update: Record<string, unknown>): string => {
				return Object.entries(update)
					.map(([key, value]) => `${key} = ${escapeValue(value)}`)
					.join(", ");
			};

			const buildInsertValues = (data: Record<string, unknown>) => {
				const columns = Object.keys(data).join(", ");
				const values = Object.values(data).map(escapeValue).join(", ");
				return { columns, values };
			};

			return {
				create: async ({ data, model }) => {
					debugLog?.(`Creating record in ${model}`, { data });

					const conn = await getConnection();
					const { columns, values } = buildInsertValues(data);

					const query = `INSERT INTO ${model} (${columns}) VALUES (${values}) RETURNING *`;

					const result = await conn.streamAndReadAll(query);
					const rows = result.getRowObjectsJS();

					return (rows[0] as any) || data;
				},

				update: async ({ model, where, update }) => {
					debugLog?.(`Updating record in ${model}`, { where, update });

					const conn = await getConnection();
					const setClause = buildSetClause(update as Record<string, unknown>);
					const whereClause = buildWhereClause(where);

					const query = `UPDATE ${model} SET ${setClause} ${whereClause} RETURNING *`;

					const result = await conn.streamAndReadAll(query);
					const rows = result.getRowObjectsJS();

					return rows[0] as any;
				},

				updateMany: async ({ model, where, update }) => {
					debugLog?.(`Updating multiple records in ${model}`, {
						where,
						update,
					});

					const conn = await getConnection();
					const setClause = buildSetClause(update);
					const whereClause = buildWhereClause(where);

					const countQuery = `SELECT COUNT(*) as count FROM ${model} ${whereClause}`;
					const countResult = await conn.streamAndReadAll(countQuery);
					const countRows = countResult.getRowObjectsJS();

					const query = `UPDATE ${model} SET ${setClause} ${whereClause}`;
					await conn.streamAndReadAll(query);

					return Number(countRows[0]?.["count"]) || 0;
				},

				delete: async ({ model, where }) => {
					debugLog?.(`Deleting record from ${model}`, { where });

					const conn = await getConnection();
					const whereClause = buildWhereClause(where);

					const query = `DELETE FROM ${model} ${whereClause}`;
					await conn.streamAndReadAll(query);
				},

				deleteMany: async ({ model, where }) => {
					debugLog?.(`Deleting multiple records from ${model}`, { where });

					const conn = await getConnection();
					const whereClause = buildWhereClause(where);

					const countQuery = `SELECT COUNT(*) as count FROM ${model} ${whereClause}`;
					const countResult = await conn.streamAndReadAll(countQuery);
					const countRows = countResult.getRowObjectsJS();

					const query = `DELETE FROM ${model} ${whereClause}`;
					await conn.streamAndReadAll(query);

					return Number(countRows[0]?.["count"]) || 0;
				},

				findOne: async ({ model, where, select }) => {
					debugLog?.(`Finding one record in ${model}`, { where, select });

					const conn = await getConnection();
					const whereClause = buildWhereClause(where);
					const selectClause =
						select && select.length > 0 ? select.join(", ") : "*";

					const query = `SELECT ${selectClause} FROM ${model} ${whereClause} LIMIT 1`;

					const result = await conn.streamAndReadAll(query);
					const rows = result.getRowObjectsJS();

					return (rows[0] as any) || null;
				},

				findMany: async ({ model, where = [], limit, sortBy, offset }) => {
					debugLog?.(`Finding multiple records in ${model}`, {
						where,
						limit,
						sortBy,
						offset,
					});

					const conn = await getConnection();
					const whereClause = buildWhereClause(where);
					const limitClause = limit ? `LIMIT ${limit}` : "";
					const offsetClause = offset ? `OFFSET ${offset}` : "";
					const orderByClause = sortBy
						? `ORDER BY ${sortBy.field} ${sortBy.direction}`
						: "";

					const query =
						`SELECT * FROM ${model} ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim();

					const result = await conn.streamAndReadAll(query);
					return result.getRowObjectsJS() as any;
				},

				count: async ({ model, where = [] }) => {
					debugLog?.(`Counting records in ${model}`, { where });

					const conn = await getConnection();
					const whereClause = buildWhereClause(where);

					const query = `SELECT COUNT(*) as count FROM ${model} ${whereClause}`;

					const result = await conn.streamAndReadAll(query);
					const rows = result.getRowObjectsJS();

					return Number(rows[0]?.["count"]) || 0;
				},

				options: config ?? {},
			};
		},
	});
