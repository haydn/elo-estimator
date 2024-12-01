"use client";

import CredentialsForm from "@/linear/CredentialsForm";
import memoFn from "@/utils/memoFn";
import { useSyncExternalStore, type ReactNode } from "react";
import CoreContext from "./CoreContext";

type Props = {
  children: ReactNode;
};

const Core = ({ children }: Props) => {
  const { apiKey, teamId } = useSyncExternalStore(
    (listener) => {
      window.addEventListener("credentialsUpdated", listener);
      return () => {
        window.removeEventListener("credentialsUpdated", listener);
      };
    },
    memoFn(
      () => ({
        apiKey: window.localStorage.getItem("linear_api_key"),
        teamId: window.localStorage.getItem("linear_team_id"),
      }),
      (previous, updated) =>
        previous.apiKey === updated.apiKey && previous.teamId === updated.teamId
    ),
    memoFn(
      () => ({
        apiKey: null,
        teamId: null,
      }),
      () => true
    )
  );

  return apiKey !== null && teamId !== null ? (
    <CoreContext.Provider value={{ apiKey, teamId }}>
      {children}
    </CoreContext.Provider>
  ) : (
    <div style={{ padding: 10 }}>
      <CredentialsForm value={{ apiKey: apiKey ?? "", teamId: teamId ?? "" }} />
    </div>
  );
};

export default Core;
