import { ButtonHTMLAttributes, useState } from "react";

const OneTimeButton = ({
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [pressed, setPressed] = useState(false);
  return pressed ? null : (
    <button
      onClick={(event) => {
        setPressed(true);
        if (onClick) onClick(event);
      }}
      {...props}
    />
  );
};

export default OneTimeButton;
