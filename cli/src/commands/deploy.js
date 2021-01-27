const { default: axios } = require("axios");
const md5 = require("md5");
const fs = require("fs");
const { firebase } = require("../config/firebase");
const { bucket } = require("../config/storage");
const credentials = require("../config/credentials");
const { default: Command } = require("@oclif/command");

class DeployCommand extends Command {
  async run() {
    console.log("deploy na aplicação", credentials);
    const currentTime = new Date().getTime();
    console.log(currentTime);
    const filename = this.getUploadFileNameDeploy(currentTime.toString());
    console.log(filename);

    const url = `https://storage.cloud.google.com/dynamic-components/${filename}`;

    if (!fs.existsSync("./index.vue")) {
      throw new Error("File index.vue not found");
    }

    await bucket.upload("./index.vue", {
      destination: filename,
      gzip: true,
      metadata: {
        cacheControl: "public, max-age=0",
      },
    });
    const token = await firebase.auth().currentUser.getIdToken();
    const result = await axios.put(
      `http://localhost:8081/api/v1/${credentials.institution}/dynamic-components/${credentials.extensionId}`,
      {
        url: url,
        version: currentTime,
        fileVuePrefix: filename,
        id: credentials.extensionId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(result);
    await firebase
      .firestore()
      .collection("dynamicComponents")
      .doc(credentials.extensionIdStorage)
      .update({
        updatedAtToDeploy: currentTime,
      });
    console.log("Deploy feito");
    process.exit(0);
  }

  getUploadFileNameDeploy(currentTime) {
    return encodeURI(`${credentials.institution}/${md5(currentTime)}.vue`);
  }
}

// TODO: Add documentation and flags specifications

module.exports = DeployCommand