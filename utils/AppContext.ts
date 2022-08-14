import { createContext } from "react";
import { IssueSummary } from "./linear";

type Credentials = {
  linearApiKey: string;
  linearTeamId: string;
};

type Data = {
  issues: Array<IssueSummary>;
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
  },
});

export default AppContext;
export type { Context, Credentials, Data };
