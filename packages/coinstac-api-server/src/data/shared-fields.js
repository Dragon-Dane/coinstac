const schemaFields = {
  consortiumFields: `
    activePipelineId: ID
    activeComputationInputs: [String]
    delete: Boolean
    description: String!
    name: String!
    tags: [String]
    owners: [ID]
    members: [ID]
    pipelines: [ID]
    results: [ID]
    isPrivate: Boolean
    mappedForRun: [ID]
    createDate: String
  `,
  computationFields: `
    display: JSON
    input: JSON
    output: JSON
  `,
  computationMetaFields: `
    repository: String
    description: String
    name: String!
    id: String!
    tags: [String]
    version: String
    controller: String
  `,
  computationRemoteFields: `
    type: String
    dockerImage: String
    command: [String]
  `,
  pipelineFields: `
    name: String
    description: String
    owner: ID
    owningConsortium: ID
    delete: Boolean
    shared: Boolean
    timeout: Int
    limitOutputToOwner: Boolean
  `,
  pipelineControllerFields: `
    id: ID
    options: JSON
    type: String
  `,
  pipelineStepFields: `
    id: ID!
    inputMap: JSON
    dataMeta: JSON
  `,
  resultFields: `
    id: ID!
    title: String
    pipelineId: ID
    date: String
    results: JSON
  `,
  userFields: `
    consortiaStatuses: JSON
    email: String!
    institution: String
    permissions: JSON
  `,
};

module.exports = schemaFields;
