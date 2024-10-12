import styles from "./CredentialsForm.module.css";

import { useEffect, useState } from "react";
import { z } from "zod";
import credentialsSchema from "./credentialsSchema";
import { useLocalStorage } from "../utils/useLocalStorage";

type Props = {
  value: z.infer<typeof credentialsSchema> | null;
  onSubmit: (values: z.infer<typeof credentialsSchema>) => void;
};

const CredentialsForm = ({ value, onSubmit }: Props) => {
  const [apiKey, setApiKey] = useState(value?.apiKey ?? "");
  const [teamId, setTeamId] = useState(value?.teamId ?? "");
  const [_, setAppId] = useLocalStorage("app");

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
        onSubmit({ apiKey, teamId });
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
        <button
          type="button"
          onClick={() => {
            setAppId(undefined);
          }}
        >
          Switch App
        </button>
        <button>Save</button>
      </footer>
    </form>
  );
};

export default CredentialsForm;
