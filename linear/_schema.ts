import { z } from "zod";

const getRedisResponseSchema = z.union([
  z.object({
    result: z.array(
      z.tuple([
        z.string(),
        z.tuple([z.string(), z.string(), z.string(), z.string()]),
      ])
    ),
  }),
  z.object({
    error: z.string(),
  }),
]);

const postBodySchema = z.object({
  apiKey: z.string(),
  comparisons: z.array(
    z.object({
      issueAId: z.string(),
      issueBId: z.string(),
      result: z.union([z.literal(0), z.literal(1)]),
    })
  ),
  highWaterMark: z.string().optional(),
});

const postLinearResponseSchema = z.union([
  z.object({
    data: z.union([z.null(), z.undefined()]),
    errors: z.array(z.object({ message: z.string() })),
  }),
  z.object({
    data: z.object({
      issues: z.object({
        nodes: z.array(
          z.object({
            id: z.string(),
            team: z.object({
              id: z.string(),
            }),
          })
        ),
      }),
      viewer: z.object({
        id: z.string(),
      }),
    }),
    errors: z.union([z.null(), z.undefined()]),
  }),
]);

const postRedisResponseSchema = z.union([
  z.object({
    result: z.array(
      z.tuple([
        z.string(),
        z.tuple([z.string(), z.string(), z.string(), z.string()]),
      ])
    ),
  }),
  z.object({
    error: z.string(),
  }),
]);

const queryParamsSchema = z.object({
  teamId: z.string(),
  property: z.union([z.literal("effort"), z.literal("value")]),
});

export {
  getRedisResponseSchema,
  postBodySchema,
  postLinearResponseSchema,
  postRedisResponseSchema,
  queryParamsSchema,
};
