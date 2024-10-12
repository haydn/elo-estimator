import Layout from "../components/Layout";
import CredentialsForm from "../linear/CredentialsForm";
import { useLocalStorage } from "../utils/useLocalStorage";

const SettingsPage = () => {
  const [apiKey, setApiKey] = useLocalStorage("linear_api_key");
  const [teamId, setTeamId] = useLocalStorage("linear_team_id");

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
