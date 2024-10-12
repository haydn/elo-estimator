import { low, none } from "./ComparisonValue.css";

type Props = {
  children: number;
};

const ComparisonValue = ({ children }: Props) => (
  <span className={children === 0 ? none : children < 4 ? low : undefined}>
    {children}
  </span>
);

export default ComparisonValue;
