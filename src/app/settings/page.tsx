"use client";

import CoreContext from "@/core/CoreContext";
import { useContext } from "react";
import CredentialsForm from "../../linear/CredentialsForm";

const SettingsPage = () => {
  const { apiKey, teamId } = useContext(CoreContext);

  return (
    <CredentialsForm value={{ apiKey: apiKey ?? "", teamId: teamId ?? "" }} />
  );
};

export default SettingsPage;
