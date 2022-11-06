import { AppProps } from "next/app";
import { useState } from "react";
import { useAsync } from "react-use";
import SettingsForm from "../components/SettingsForm";
import AppContext, { Context } from "../utils/AppContext";
import { getIssues, getRelations } from "../utils/linear";
import { splash } from "./_app.css";

const App = ({ Component, pageProps }: AppProps) => {
  const [context, setContext] = useState<Context | null>(null);
  const [missingCredentials, setMissingCredentials] = useState(false);

  useAsync(async () => {
    const linearApiKey = window.localStorage.getItem("linear_api_key");
    const linearTeamId = window.localStorage.getItem("linear_team_id");

    if (!linearApiKey || !linearTeamId) {
      setMissingCredentials(true);
    } else {
      const issues = await getIssues({ linearApiKey, linearTeamId });
      const relations = await getRelations({ linearApiKey, linearTeamId });
      setContext({
        credentials: { linearApiKey, linearTeamId },
        data: { issues, relations },
      });
    }
  });

  return missingCredentials ? (
    <div className={splash}>
      <SettingsForm />
    </div>
  ) : context ? (
    <AppContext.Provider value={context}>
      <Component {...pageProps} />
    </AppContext.Provider>
  ) : (
    <p>Loading…</p>
  );
};

export default App;
