import "./app.css";

import type { AppProps } from "next/app";
import LinearApp from "../linear/LinearApp";

const App = ({ Component, pageProps }: AppProps) => (
  <LinearApp>
    <Component {...pageProps} />
  </LinearApp>
);

export default App;
