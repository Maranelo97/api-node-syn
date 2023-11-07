const { version } = require("../../package.json");
const uptime = () => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

exports.getHealth = (req, res) => {
  res.status(200).json({
    version: version,
    uptime: uptime(),
    status: "ok",
  });
};
