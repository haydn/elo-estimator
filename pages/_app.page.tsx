import { AppProps } from "next/app";
import SettingsForm from "../components/SettingsForm";
import { Context, useLinear } from "../utils/linear";
import { splash } from "./_app.css";

const App = ({ Component, pageProps }: AppProps<{ context: Context }>) => {
  const context = useLinear();

  return context.status === "uninitialized" ? (
    <div className={splash}>
      <SettingsForm />
    </div>
  ) : context.status === "loading" ? (
    <p>Loading…</p>
  ) : (
    <Component context={context} {...pageProps} />
  );
};

export default App;
