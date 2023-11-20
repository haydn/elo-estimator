import { z } from "zod";

export const issueDetailSchema = z.object({
  issue: z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    project: z
      .object({
        id: z.string(),
        name: z.string(),
        icon: z.string().nullable(),
      })
      .nullable(),
    labels: z.object({
      edges: z.array(
        z.object({
          node: z.object({
            name: z.string(),
          }),
        })
      ),
    }),
    parent: z
      .object({
        identifier: z.string(),
        title: z.string(),
      })
      .nullable(),
    relations: z.object({
      nodes: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
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
          type: z.string(),
          issue: z.object({
            identifier: z.string(),
            title: z.string(),
          }),
        })
      ),
    }),
    comments: z.object({
      nodes: z.array(
        z.object({
          id: z.string(),
          body: z.string(),
          user: z
            .object({
              name: z.string(),
            })
            .nullable(),
        })
      ),
    }),
    cycle: z
      .object({
        number: z.number(),
      })
      .nullable(),
    estimate: z.number().nullable(),
    state: z.object({
      type: z.string(),
    }),
  }),
});
