import { formatISO, fromUnixTime } from "date-fns";
import { z } from "zod";
import type { Comparison } from "./_types";

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

export default getComparisons;
