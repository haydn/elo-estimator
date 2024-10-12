import { z } from "zod";

export const issueSummarySchema = z.object({
  team: z.object({
    key: z.string(),
    issues: z.object({
      pageInfo: z.object({
        hasNextPage: z.boolean(),
        endCursor: z.string().nullable(),
      }),
      edges: z.array(
        z.object({
          node: z.object({
            estimate: z.number().nullable(),
            id: z.string(),
            identifier: z.string(),
            state: z.object({
              type: z.string(),
            }),
            title: z.string(),
            project: z
              .object({
                id: z.string(),
                name: z.string(),
                icon: z.string().nullable(),
              })
              .nullable(),
            cycle: z
              .object({
                number: z.number(),
              })
              .nullable(),
            relations: z.object({
              nodes: z.array(
                z.object({
                  id: z.string(),
                  type: z.union([
                    z.literal("blocks"),
                    z.literal("related"),
                    z.literal("duplicate"),
                  ]),
                  relatedIssue: z.object({
                    identifier: z.string(),
                    title: z.string(),
                  }),
                })
              ),
            }),
            inverseRelations: z.object({
              nodes: z.array(
                z.object({
                  id: z.string(),
                  type: z.union([
                    z.literal("blocks"),
                    z.literal("related"),
                    z.literal("duplicate"),
                  ]),
                  issue: z.object({
                    identifier: z.string(),
                    title: z.string(),
                  }),
                })
              ),
            }),
          }),
        })
      ),
    }),
  }),
});
