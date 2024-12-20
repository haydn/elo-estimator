import type { Comparison } from "@/core/_types";
import { postBodySchema, postLinearResponseSchema } from "@/linear/_schema";
import { formatISO, fromUnixTime } from "date-fns";
import gql from "dedent";
import { NextResponse } from "next/server";
import { z } from "zod";

const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_REST_API_URL = process.env.KV_REST_API_URL;

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

const getComparisons = async (
  app: "linear",
  teamId: string,
  property: "effort",
  start: string = "-"
): Promise<Array<Comparison>> => {
  const response = await fetch(
    [
      KV_REST_API_URL,
      "xrange",
      `${app}:${property}-comparisons:${teamId}`,
      start,
      "+",
      "COUNT",
      "5000",
    ].join("/"),
    {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        ContentType: "application/json",
      },
    }
  );

  const data = getRedisResponseSchema.parse(await response.json());

  if ("error" in data) {
    throw Error(data.error);
  }

  const transformedData: Array<Comparison> = data.result.map(
    ([id, [userId, issueAId, issueBId, result]]) => ({
      date: formatISO(fromUnixTime(parseInt(id.split("-")[0]) / 1000)),
      id,
      issueAId,
      issueBId,
      result: result === "1" ? 1 : 0,
      userId,
    })
  );

  return transformedData.length === 5000
    ? transformedData.concat(
        await getComparisons(
          app,
          teamId,
          property,
          `(${transformedData[4999].id}`
        )
      )
    : transformedData;
};

type Params = {
  teamId: string;
};

const postRedisResponseSchema = z.array(
  z.union([
    z.object({
      result: z.union([
        z.string(),
        z.array(
          z.tuple([
            z.string(),
            z.tuple([z.string(), z.string(), z.string(), z.string()]),
          ])
        ),
      ]),
    }),
    z.object({
      error: z.string(),
    }),
  ])
);

const postComparisons = async (
  app: "linear",
  teamId: string,
  property: "effort" | "value",
  body: unknown
): Promise<Array<Comparison>> => {
  const { apiKey, comparisons, highWaterMark } = postBodySchema.parse(body);

  const issuesResponse = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: gql`
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

  const issuesData = postLinearResponseSchema.parse(
    await issuesResponse.json()
  );

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
      comparisons
        .map(({ issueAId, issueBId, result }) => [
          "xadd",
          `${app}:${property}-comparisons:${teamId}`,
          "maxlen",
          "~",
          "10000",
          "*",
          userId,
          issueAId,
          issueBId,
          result,
        ])
        .concat(
          highWaterMark
            ? [
                [
                  "xrange",
                  `${app}:${property}-comparisons:${teamId}`,
                  `(${highWaterMark}`,
                  "+",
                  "COUNT",
                  "10000",
                ],
              ]
            : []
        )
    ),
  });

  const redisData = postRedisResponseSchema.parse(await redisResponse.json());

  if (highWaterMark !== undefined) {
    const xRangeData = redisData.reverse().find(() => true);

    if (xRangeData === undefined) {
      throw Error("New comparisons not returned from Redis.");
    }

    if ("error" in xRangeData) {
      throw Error(xRangeData.error);
    }

    if (!Array.isArray(xRangeData.result)) {
      throw Error(
        "New comparisons returned from Redis in an unexpected format."
      );
    }

    return xRangeData.result.map(
      ([id, [userId, issueAId, issueBId, result]]) => ({
        date: formatISO(fromUnixTime(parseInt(id.split("-")[0]) / 1000)),
        id,
        issueAId,
        issueBId,
        result: result === "1" ? 1 : 0,
        userId,
      })
    );
  }

  return [];
};

export const GET = async (_: Request, { params }: { params: Params }) => {
  const data = await getComparisons("linear", params.teamId, "effort");
  return NextResponse.json(data);
};

export const POST = async (req: Request, { params }: { params: Params }) => {
  const body = await req.json();
  const data = await postComparisons("linear", params.teamId, "effort", body);
  return NextResponse.json(data);
};
