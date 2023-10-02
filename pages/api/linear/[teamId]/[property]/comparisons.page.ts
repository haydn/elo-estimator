import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { Comparison } from "../../../../../utils/linear";

type RequestQueryParams = z.infer<typeof requestQueryParamsSchema>;

const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_REST_API_URL = process.env.KV_REST_API_URL;

const requestQueryParamsSchema = z.object({
  teamId: z.string(),
  property: z.union([z.literal("effort"), z.literal("value")]),
});

const postSchema = z.object({
  apiKey: z.string(),
  comparisons: z.array(
    z.object({
      issueAId: z.string(),
      issueBId: z.string(),
      result: z.union([z.literal(0), z.literal(1)]),
    })
  ),
});

const linearResponseSchema = z.union([
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

const LinearComparisonsEndpoint = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const query = requestQueryParamsSchema.parse(req.query);

    switch (req.method) {
      case "GET":
        return await getComparisons(req, res, query);
      case "POST":
        return await postComparisons(req, res, query);
      default:
        throw Error("Only GET and POST requests are supported.");
    }
  } catch (error) {
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Unknown error.");
  }
};

const getComparisons = async (
  _: NextApiRequest,
  res: NextApiResponse,
  { property, teamId }: RequestQueryParams
) => {
  const result = await fetch(
    [
      KV_REST_API_URL,
      "xrange",
      `linear:${property}-comparisons:${teamId}`,
      "-",
      "+",
      "COUNT",
      "10000",
    ].join("/"),
    {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        ContentType: "application/json",
      },
    }
  );

  const data:
    | {
        result: Array<[string, [string, string, string, string]]>;
      }
    | { error: string } = await result.json();

  if ("error" in data) {
    throw Error(data.error);
  }

  const transformedData: Array<Comparison> = data.result.map(
    ([id, [userId, issueAId, issueBId, result]]) => ({
      id,
      userId,
      issueAId,
      issueBId,
      result: result === "1" ? 1 : 0,
    })
  );

  res.status(200).json(transformedData);
};

const postComparisons = async (
  req: NextApiRequest,
  res: NextApiResponse,
  { property, teamId }: RequestQueryParams
) => {
  const { apiKey, comparisons } = postSchema.parse(req.body);

  const issuesResponse = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query Issues($issueIds: [ID!]!) {
          issues(filter: { id: { in: $issueIds } }) {
            nodes {
              id
              team {
                id
              }
            }
          }
          viewer {
            id
          }
        }
      `,
      variables: {
        issueIds: comparisons.flatMap(({ issueAId, issueBId }) => [
          issueAId,
          issueBId,
        ]),
      },
    }),
  });

  if (issuesResponse.status !== 200) {
    throw Error(await issuesResponse.text());
  }

  const issuesData = linearResponseSchema.parse(await issuesResponse.json());

  if (issuesData.data === null || issuesData.data === undefined) {
    if (issuesData.errors !== undefined) {
      throw Error(issuesData.errors[0].message);
    } else {
      throw Error("Unknown error fetching issues from Linear.");
    }
  }

  if (issuesData.data.issues.nodes.some((issue) => issue.team.id !== teamId)) {
    throw Error("Issue does not belong to the team.");
  }

  const userId = issuesData.data.viewer?.id;

  if (typeof userId !== "string") {
    throw Error("Unable to retrieve user ID.");
  }

  const redisResponse = await fetch([KV_REST_API_URL, "pipeline"].join("/"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      ContentType: "application/json",
    },
    body: JSON.stringify(
      comparisons.map(({ issueAId, issueBId, result }) => [
        "xadd",
        `linear:${property}-comparisons:${teamId}`,
        "maxlen",
        "~",
        "10000",
        "*",
        userId,
        issueAId,
        issueBId,
        result,
      ])
    ),
  });

  const redisData = await redisResponse.json();

  res.status(200).json(redisData);
};

export default LinearComparisonsEndpoint;
