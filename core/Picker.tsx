import styles from "./Picker.module.css";

import { ReactNode } from "react";
import { useLocalStorage } from "../utils/useLocalStorage";
import * as apps from "./apps";

type AppList = typeof apps;

type AppId = keyof AppList;

type Props = {
  children: ReactNode;
};

const Picker = ({ children }: Props) => {
  const [appId, setAppId] = useLocalStorage<AppId>("app");

  const App = appId === undefined ? null : apps[appId].App;

  return App === null ? (
    <div className={styles.picker}>
      <ul>
        {Object.entries(apps)
          .sort(([, a], [, b]) => a.name.localeCompare(b.name))
          .map(([id, app]) => (
            <li key={id}>
              {app.name}{" "}
              <button
                onClick={() => {
                  setAppId(id as AppId);
                }}
              >
                Select
              </button>
            </li>
          ))}
      </ul>
    </div>
  ) : (
    <App>{children}</App>
  );
};

export default Picker;
