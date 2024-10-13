import Layout from "@/components/Layout";
import LinearApp from "@/linear/LinearApp";
import type { ReactNode } from "react";
import "./layout.css";

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => (
  <html lang="en">
    <body>
      <LinearApp>
        <Layout>{children}</Layout>
      </LinearApp>
    </body>
  </html>
);

export default RootLayout;
