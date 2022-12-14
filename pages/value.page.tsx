import type { NextPage } from "next";
import { useContext } from "react";
import IssueComparison from "../components/IssueComparison";
import Layout from "../components/Layout";
import AppContext from "../utils/AppContext";

const ValuePage: NextPage = () => {
  const context = useContext(AppContext);
  return (
    <Layout>
      <IssueComparison
        context={context}
        localStorageKey="value_comparisons"
        title={
          <>
            Which of these issues would be{" "}
            <abbr title="Improves the customer's experience, improves our team's productivity or has strategic importance. (Hint: a 1&times; improvement across 100% of users is equivalent to 2&times; improvement across 50% of users.)">
              most valuable
            </abbr>{" "}
            to{" "}
            <abbr title="Either complete or, because it's not worthwhile or has been superseded, cancel.">
              resolve
            </abbr>{" "}
            first?
          </>
        }
        firstButtonLabel={(issue) =>
          `${issue.identifier} should be resolved first`
        }
        successiveButtonLabel={(issue) =>
          `${issue.identifier} should be resolved next`
        }
      />
    </Layout>
  );
};

export default ValuePage;
