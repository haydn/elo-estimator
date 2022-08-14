import type { NextPage } from "next";
import Layout from "../components/Layout";
import SettingsForm from "../components/SettingsForm";

const SettingsPage: NextPage = () => (
  <Layout>
    <SettingsForm />
  </Layout>
);

export default SettingsPage;
