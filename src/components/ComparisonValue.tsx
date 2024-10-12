import styles from "./ComparisonValue.module.css";

type Props = {
  children: number;
};

const ComparisonValue = ({ children }: Props) => (
  <span
    className={
      children === 0 ? styles.none : children < 4 ? styles.low : undefined
    }
  >
    {children}
  </span>
);

export default ComparisonValue;
