import { createElement } from "react";

export const GlassCard = ({
  as = "section",
  interactive = false,
  className = "",
  children,
  ...props
}) => {
  return createElement(
    as,
    {
      className: `glass-card p-4 sm:p-5 ${interactive ? "card-hover" : ""} ${className}`.trim(),
      ...props,
    },
    children,
  );
};
