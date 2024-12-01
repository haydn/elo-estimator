import useIssueSummaries from "./useIssueSummaries";

const useRelevantIssues = () => {
  const { data: issueSummaries } = useIssueSummaries();
  return (
    issueSummaries?.filter(
      (issue) =>
        issue.state === "triage" ||
        issue.state === "backlog" ||
        issue.state === "unstarted"
    ) ?? null
  );
};

export default useRelevantIssues;
