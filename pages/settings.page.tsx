import Layout from "../components/Layout";
import * as apps from "../core/apps";
import { useLocalStorage } from "../utils/useLocalStorage";

type AppList = typeof apps;

type AppId = keyof AppList;

const SettingsPage = () => {
  const [apiKey, setApiKey] = useLocalStorage("linear_api_key");
  const [teamId, setTeamId] = useLocalStorage("linear_team_id");
  const [appId, setAppId] = useLocalStorage<AppId>("app");

  if (!appId) {
    return null;
  }

  const CredentialsForm = apps[appId].CredentialsForm;

  return (
    <Layout>
      <CredentialsForm
        value={{ apiKey: apiKey ?? "", teamId: teamId ?? "" }}
        onSubmit={({ apiKey, teamId }) => {
          setApiKey(apiKey);
          setTeamId(teamId);
        }}
      />
    </Layout>
  );
};

export default SettingsPage;
