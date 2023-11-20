import type { NextPage } from "next";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import IssueComparison from "../../core/IssueComparison";

const EffortPage: NextPage = () => {
  const { push, query } = useRouter();
  const id = Array.isArray(query.id) ? query.id[0] : query.id;

  if (!id) {
    push("/effort");
    return null;
  }

  return (
    <Layout>
      <IssueComparison
        tournamentId={id}
        property="effort"
        title={
          <>
            Which of these issues would be{" "}
            <abbr title="Assuming the whole team drops everything and focuses entirely on just the issue.">
              quickest
            </abbr>{" "}
            to{" "}
            <abbr title="Either complete or, because it's not worthwhile or has been superseded, cancel.">
              resolve
            </abbr>{" "}
            (
            <abbr title="Count blocking issues that needs to be resolved first, decisions that need to be made and any other work required to resolve it.">
              including prerequisite work
            </abbr>{" "}
            and{" "}
            <abbr title="Assuming more effort is needed for unclear goals/requirements, unknowns, external dependencies etc.">
              accounting for uncertainty
            </abbr>
            )?
          </>
        }
        firstButtonLabel="Quickest"
        successiveButtonLabel="Next quickest"
      />
    </Layout>
  );
};

export default EffortPage;
