import type { NextPage } from "next";
import { useContext } from "react";
import Layout from "../components/Layout";
import AppContext from "../utils/AppContext";
import ProjectRelationshipGraph from "../components/ProjectRelationshipGraph";
import emoji from "node-emoji";

const ValuePage: NextPage = () => {
  const { data } = useContext(AppContext);

  const projects: Array<{ id: string; name: string; issues: number }> = [];

  for (let issue of data.issues.filter(
    (issue) =>
      issue.state === "triage" ||
      issue.state === "backlog" ||
      issue.state === "unstarted"
  )) {
    if (!issue.projectId || !issue.projectName) continue;

    const existingProject = projects.find(
      (project) => project.id === issue.projectId
    );

    if (existingProject) {
      existingProject.issues += 1;
    } else {
      projects.push({
        id: issue.projectId,
        name: `${
          issue.projectIcon && emoji.hasEmoji(issue.projectIcon)
            ? emoji.get(issue.projectIcon) + " "
            : ""
        }${issue.projectName}`,
        issues: 1,
      });
    }
  }

  return (
    <Layout>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Issues</th>
            <th>Dependencies</th>
          </tr>
        </thead>
        <tbody>
          {projects
            .sort((a, b) =>
              emoji.strip(a.name).localeCompare(emoji.strip(b.name))
            )
            .map((project) => {
              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.issues}</td>
                  <td>
                    <ProjectRelationshipGraph
                      data={data}
                      projectId={project.id}
                    />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </Layout>
  );
};

export default ValuePage;
