import type { NextPage } from "next";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import IssueComparison from "../../core/IssueComparison";

const ValuePage: NextPage = () => {
  const { push, query } = useRouter();
  const id = Array.isArray(query.id) ? query.id[0] : query.id;

  if (!id) {
    push("/value");
    return null;
  }

  return (
    <Layout>
      <IssueComparison
        tournamentId={id}
        property="value"
        title={
          <>
            Which of these issues would{" "}
            <abbr title="Improves the customer's experience, improves our team's productivity or has strategic importance. (Hint: a 1&times; improvement across 100% of users is equivalent to 2&times; improvement across 50% of users.)">
              deliver the most value
            </abbr>{" "}
            if it was{" "}
            <abbr title="Assuming all prerequisite work has already been delivered.">
              completed right now
            </abbr>
            ?
          </>
        }
        firstButtonLabel="Most valuable"
        successiveButtonLabel="Next most valuable"
      />
    </Layout>
  );
};

export default ValuePage;
