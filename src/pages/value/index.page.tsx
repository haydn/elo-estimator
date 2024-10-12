import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import Layout from "../../components/Layout";
import CoreContext from "../../core/CoreContext";

const ValueIndexPage: NextPage = () => {
  const {
    createTournament,
    state: { issueSummaries },
  } = useContext(CoreContext);
  const router = useRouter();

  useEffect(() => {
    if (issueSummaries.length > 0) {
      const id = uuid();

      createTournament(id, "value");

      router.push(`/value/${id}`);
    }
  }, [createTournament, issueSummaries.length, router]);

  return <Layout>Generating tournament...</Layout>;
};

export default ValueIndexPage;
