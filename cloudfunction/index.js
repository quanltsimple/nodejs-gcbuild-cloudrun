const IncomingWebhook = require('@slack/client').IncomingWebhook;
const SLACK_WEBHOOK_URL = ""

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

// subscribe is the main function called by Cloud Functions.
module.exports.helloPubSub = (event, callback) => {

  const build = eventToBuild(event.data);
  let buildCommitCheck = build.substitutions.COMMIT_SHA || '';

  // base64
  console.log(event.data);

  // Skip if the current status is not in the status list.
  // Add additional statues to list if you'd like:
  // QUEUED, WORKING, SUCCESS, FAILURE,
  // INTERNAL_ERROR, TIMEOUT, CANCELLED
  const status = [
    'SUCCESS',
    'FAILURE',
    'INTERNAL_ERROR',
    'TIMEOUT',
    'QUEUED',
    'CANCELLED',
  ];
  if (status.indexOf(build.status) === -1 || buildCommitCheck === '') {
    return '';
  }

  // Send message to Slack.
  const message = createSlackMessage(build);
  (async () => {
  await webhook.send(message);
  })();
};

// eventToBuild transforms pubsub event message to a build object.
const eventToBuild = (data) => {
  return JSON.parse(new Buffer(data, 'base64').toString());
}

// createSlackMessage create a message from a build object.
const createSlackMessage = (build) => {
  let buildId = build.id || '';
  let buildCommit = build.substitutions.COMMIT_SHA || '';
  let branch = build.substitutions.BRANCH_NAME || '';
  let repoName = build.substitutions.REPO_NAME || ''; //Get repository name
  let projectId = build.projectId || ''; //Get project id

  let message = {
    text: `Git Repository: \`${repoName}\` - Build - \`${buildId}\``,
    mrkdwn: true,
    attachments: [
      {
        title: 'View Build Logs',
        title_link: build.logUrl,
        fields: [
          {
            title: 'Status',
            value: build.status,
          },
        ],
      },
      {
        title: `Commit - ${buildCommit}`,
        title_link: `https://source.cloud.google.com/${projectId}/${repoName}`, // Insert your Organization/Bitbucket/Github Url
        fields: [
          {
            title: 'Branch',
            value: branch,
          },
          {
            title: 'Check PIC',
            value: `<@Hello> san`,
          }
        ],
      },
    ],
  };
  return message;
};
