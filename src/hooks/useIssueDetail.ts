import type { IssueDetail } from "@/core/_types";
import CoreContext from "@/core/CoreContext";
import { issueDetailSchema } from "@/linear/issueDetailSchema";
import gql from "dedent";
import { useContext } from "react";
import useSWR from "swr";

const useIssueDetail = (id: string) => {
  const { apiKey } = useContext(CoreContext);

  return useSWR<IssueDetail>(
    id,
    async (id): Promise<IssueDetail> => {
      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: gql`
            query IssueDetail($id: String!) {
              issue(id: $id) {
                id
                identifier
                title
                description
                project {
                  id
                  name
                  icon
                }
                labels {
                  edges {
                    node {
                      name
                    }
                  }
                }
                parent {
                  identifier
                  title
                }
                relations {
                  nodes {
                    id
                    type
                    relatedIssue {
                      identifier
                      title
                    }
                  }
                }
                inverseRelations {
                  nodes {
                    id
                    type
                    issue {
                      identifier
                      title
                    }
                  }
                }
                comments {
                  nodes {
                    id
                    body
                    user {
                      name
                    }
                  }
                }
                cycle {
                  number
                }
                estimate
                state {
                  type
                }
              }
            }
          `,
          variables: {
            id,
          },
        }),
      });

      if (response.status !== 200) {
        throw Error(await response.text());
      }

      const { errors, data } = await response.json();

      if (Array.isArray(errors) && errors.length > 0) {
        throw Error(errors.map((error) => error.message).join("\n\n"));
      }

      const { issue } = issueDetailSchema.parse(data);

      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description ?? "",
        projectId: issue.project?.id,
        projectName: issue.project?.name,
        projectIcon: issue.project?.icon ?? undefined,
        labels: issue.labels.edges.map((edge) => edge.node.name),
        parentIdentifier: issue.parent?.identifier,
        parentTitle: issue.parent?.title,
        relations: (issue.relations?.nodes ?? [])
          .map((node: any) => ({
            id: node.id,
            type: node.type,
            identifier: node.relatedIssue.identifier,
            title: node.relatedIssue.title,
          }))
          .concat(
            (issue.inverseRelations?.nodes ?? []).map((node: any) => ({
              id: node.id,
              type: node.type === "blocks" ? "blocked-by" : node.type,
              identifier: node.issue.identifier,
              title: node.issue.title,
            }))
          ),
        comments: (issue.comments?.nodes ?? []).reverse().map((comment) => ({
          id: comment.id,
          body: comment.body,
          author: comment.user?.name ?? "unknown",
        })),
        cycle: issue.cycle?.number,
        estimate: issue.estimate ?? undefined,
        state: issue.state.type,
      };
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
    }
  );
};

export default useIssueDetail;
