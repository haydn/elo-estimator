import { z } from "zod";
import {
  getRedisResponseSchema,
  postBodySchema,
  postLinearResponseSchema,
  queryParamsSchema,
} from "./_schema";

export type GetRedisResponse = z.infer<typeof getRedisResponseSchema>;

export type LinearCredentials = {
  apiKey: string;
  teamId: string;
};

export type PostBody = z.infer<typeof postBodySchema>;

export type PostLinearResponse = z.infer<typeof postLinearResponseSchema>;

export type PostRedisResponse = z.infer<typeof getRedisResponseSchema>;

export type QueryParams = z.infer<typeof queryParamsSchema>;
