const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "left",
}) => {
  const alignment =
    align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm text-muted md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default SectionHeading;
