const ProgressBar = ({ value }) => {
  const width = Math.min(Math.max(value * 100, 0), 100);

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default ProgressBar;
