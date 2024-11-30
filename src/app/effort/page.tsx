"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { v4 as uuid } from "uuid";
import Layout from "../../components/Layout";
import CoreContext from "../../core/CoreContext";

const EffortIndexPage: NextPage = () => {
  const {
    createTournament,
    state: { issueSummaries },
  } = useContext(CoreContext);
  const router = useRouter();

  useEffect(() => {
    if (issueSummaries.length > 0) {
      const id = uuid();

      createTournament(id);

      router.push(`/effort/${id}`);
    }
  }, [createTournament, issueSummaries.length, router]);

  return <>Generating tournament...</>;
};

export default EffortIndexPage;
