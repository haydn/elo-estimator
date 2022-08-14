import { useState } from "react";
import { field, footer, form } from "./SettingsForm.css";

const SettingsForm = () => {
  const [key, setKey] = useState(
    window?.localStorage.getItem("linear_api_key") ?? ""
  );
  const [teamId, setTeamId] = useState(
    window?.localStorage.getItem("linear_team_id") ?? ""
  );
  return (
    <form
      className={form}
      onSubmit={(event) => {
        event.preventDefault();
        window.localStorage.setItem("linear_api_key", key);
        window.localStorage.setItem("linear_team_id", teamId);
        window.location.reload();
      }}
    >
      <p>Details will be saved in local storage.</p>
      <div className={field}>
        <label>Linear API Key</label>
        <input
          type="text"
          value={key}
          onChange={(event) => {
            setKey(event.target.value);
          }}
        />
      </div>
      <div className={field}>
        <label>Linear Team ID</label>
        <input
          type="text"
          value={teamId}
          onChange={(event) => {
            setTeamId(event.target.value);
          }}
        />
      </div>
      <footer className={footer}>
        <button>Save</button>
      </footer>
    </form>
  );
};

export default SettingsForm;
