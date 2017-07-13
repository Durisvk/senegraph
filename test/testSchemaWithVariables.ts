export default `
  type Query {
    hello(someArgument: String!): String!
  }

  schema {
    query: Query
  }
`
