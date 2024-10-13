import { NextResponse } from "next/server";
import getComparisons from "../../../../../../core/getComparisons";
import postComparisons from "../../../../../../core/postComparisons";

type Params = {
  property: "effort";
  teamId: string;
};

export const GET = async (_: Request, { params }: { params: Params }) => {
  const data = await getComparisons("linear", params.teamId, params.property);
  return NextResponse.json(data);
};

export const POST = async (req: Request, { params }: { params: Params }) => {
  const body = await req.json();
  const data = await postComparisons(
    "linear",
    params.teamId,
    params.property,
    body
  );
  return NextResponse.json(data);
};
