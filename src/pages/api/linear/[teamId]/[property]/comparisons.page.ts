import type { NextApiRequest, NextApiResponse } from "next";
import getComparisons from "../../../../../core/getComparisons";
import postComparisons from "../../../../../core/postComparisons";
import { queryParamsSchema } from "../../../../../linear/_schema";

const LinearComparisonsEndpoint = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const query = queryParamsSchema.parse(req.query);

    switch (req.method) {
      case "GET": {
        const data = await getComparisons(
          "linear",
          query.teamId,
          query.property
        );
        res.status(200).json(data);
        return;
      }
      case "POST":
        const data = await postComparisons(
          "linear",
          query.teamId,
          query.property,
          req.body
        );
        res.status(200).json(data);
        return;
      default:
        throw Error("Only GET and POST requests are supported.");
    }
  } catch (error) {
    res
      .status(500)
      .send(error instanceof Error ? error.message : "Unknown error.");
  }
};

export default LinearComparisonsEndpoint;
