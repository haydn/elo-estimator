import Layout from "@/components/Layout";
import Core from "@/core/Core";
import type { ReactNode } from "react";
import "./layout.css";

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => (
  <html lang="en">
    <body>
      <Core>
        <Layout>{children}</Layout>
      </Core>
    </body>
  </html>
);

export default RootLayout;
