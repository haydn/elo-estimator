import Link from "next/link";
import { ReactNode } from "react";
import { container, nav, content } from "./Layout.css";

type Props = {
  children: ReactNode;
};

const Layout = ({ children }: Props) => (
  <div className={container}>
    <nav className={nav}>
      <Link href="/">Issues</Link>
      <Link href="/effort">Effort</Link>
      <Link href="/value">Value</Link>
      <Link href="/settings">Settings</Link>
    </nav>
    <div className={content}>{children}</div>
  </div>
);

export default Layout;
