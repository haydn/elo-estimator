import { createContext } from "react";
import { IssueSummary, RelationSummary } from "./linear";

type Credentials = {
  linearApiKey: string;
  linearTeamId: string;
};

type Data = {
  issues: Array<IssueSummary>;
  relations: Array<RelationSummary>;
};

type Context = {
  credentials: Credentials;
  data: Data;
};

const AppContext = createContext<Context>({
  credentials: {
    linearApiKey: "",
    linearTeamId: "",
  },
  data: {
    issues: [],
    relations: [],
  },
});

export default AppContext;
export type { Context, Credentials, Data };
