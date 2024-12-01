import styles from "./CredentialsForm.module.css";

import { useEffect, useState } from "react";

type Props = {
  value: {
    apiKey: string;
    teamId: string;
  };
};

const CredentialsForm = ({ value }: Props) => {
  const [apiKey, setApiKey] = useState(value?.apiKey ?? "");
  const [teamId, setTeamId] = useState(value?.teamId ?? "");

  useEffect(() => {
    setApiKey((current) =>
      current.trim() === "" ? value?.apiKey ?? "" : current
    );
    setTeamId((current) =>
      current.trim() === "" ? value?.teamId ?? "" : current
    );
  }, [value?.apiKey, value?.teamId]);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        window.localStorage.setItem("linear_api_key", apiKey);
        window.localStorage.setItem("linear_team_id", teamId);
        window.dispatchEvent(new Event("credentialsUpdated"));
      }}
    >
      <p>Details will be saved in local storage.</p>
      <div className={styles.field}>
        <label>Linear API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value);
          }}
        />
      </div>
      <div className={styles.field}>
        <label>Linear Team ID</label>
        <input
          type="text"
          value={teamId}
          onChange={(event) => {
            setTeamId(event.target.value);
          }}
        />
      </div>
      <footer className={styles.footer}>
        <button>Save</button>
      </footer>
    </form>
  );
};

export default CredentialsForm;
