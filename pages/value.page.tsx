import type { NextPage } from "next";
import { useContext } from "react";
import IssueCard from "../components/IssueCard";
import IssueComparison from "../components/IssueComparison";
import Layout from "../components/Layout";
import AppContext from "../utils/AppContext";
import useIssues from "../utils/useIssues";

const ValuePage: NextPage = () => {
  const context = useContext(AppContext);
  return (
    <Layout>
      <IssueComparison
        context={context}
        localStorageKey="value_comparisons"
        title={
          <>
            Which of these issues{" "}
            <abbr title="Improves the customer's experience, improves our team's productivity or has strategic importance. (Hint: a 1&times; improvement across 100% of users is equivalent to 2&times; improvement across 50% of users.)">
              makes the most sense
            </abbr>{" "}
            to{" "}
            <abbr title="Either complete or, because it's not worthwhile or has been superseded, canceled.">
              resolve first
            </abbr>
            ?
          </>
        }
        buttonLabel={(issue) => `${issue.identifier} should be resolved first`}
      />
    </Layout>
  );
};

export default ValuePage;
