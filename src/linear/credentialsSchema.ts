import { z } from "zod";

const credentialsSchema = z.object({
  apiKey: z.string(),
  teamId: z.string(),
});

export default credentialsSchema;
