module.exports = async function (options) {
  const nodeMajorVersion = process.versions.node.split('.')[0]
  if (nodeMajorVersion < 14) {
    console.error('Node >= 14.0.0 is required to run quoti-cli.')
    process.exit(-1)
  }
}
