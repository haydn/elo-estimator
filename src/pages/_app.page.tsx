import "./app.css";

import { AppProps } from "next/app";
import Picker from "../core/Picker";

const App = ({ Component, pageProps }: AppProps) => (
  <Picker>
    <Component {...pageProps} />
  </Picker>
);

export default App;
