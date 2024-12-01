import { createContext } from "react";

const CoreContext = createContext<{
  apiKey: string;
  teamId: string;
}>({ apiKey: "", teamId: "" });

export default CoreContext;
