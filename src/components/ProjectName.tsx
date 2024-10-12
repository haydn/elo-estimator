import emoji from "node-emoji";

type Props = {
  icon: string | undefined;
  name: string;
};

const ProjectName = ({ icon, name }: Props) => (
  <>
    {icon && emoji.hasEmoji(icon) ? emoji.get(icon) + " " : ""}
    {name}
  </>
);

export default ProjectName;
