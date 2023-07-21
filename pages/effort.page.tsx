import type { NextPage } from "next";
import IssueComparison from "../components/IssueComparison";
import Layout from "../components/Layout";
import { Context } from "../utils/linear";

type Props = {
  context: Context;
};

const EffortPage: NextPage<Props> = ({ context }) => (
  <Layout>
    <IssueComparison
      context={context}
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
      firstButtonLabel={(issue) => `${issue.identifier} is quickest`}
      successiveButtonLabel={(issue) => `${issue.identifier} is next quickest`}
    />
  </Layout>
);

export default EffortPage;
