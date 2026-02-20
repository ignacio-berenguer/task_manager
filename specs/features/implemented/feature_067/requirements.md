# Requirements Prompt for feature_067

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_067/specs.md' and './specs/features/feature_067/plan.md' in order to do that.

## Feature Brief

SQL Query Tool for the MCP Server. Add a new MCP tool that allows AI agents and chat users to convert natural-language questions into SQL queries, execute them against the portfolio database, and return the results. The tool must:

1. **Natural Language to SQL**: Convert the user's question into a SQL query targeting the portfolio SQLite database.
2. **SQL Safety Validation**: Analyze the generated SQL to ensure only SELECT statements are used. Reject any INSERT, UPDATE, DELETE, DROP, ALTER, or other mutating operations. Guard against SQL injection attacks.
3. **System Prompt Integration**: Add instructions to the MCP server's system prompt / tool descriptions so the chatbot knows when and how to use this SQL query tool.
4. **Transparent SQL Reporting**: In the tool's response, include the SQL sentence that was generated and a brief explanation of why it was generated that way, so the user can see exactly what query was run.

## User Story

As an AI agent or chat user, I want to ask natural-language questions about the portfolio data and have them automatically translated into safe SQL queries, executed against the database, and returned with full transparency of the SQL used, so that I can explore the data flexibly without needing to know SQL or risk modifying the database.

## Key Requirements

### Requirement 1: New MCP Tool — `ejecutar_consulta_sql`

Add a new MCP tool (following the existing Spanish naming convention) that:
- Accepts a natural-language question (or a direct SQL query) as input
- Converts the question into a SQL SELECT query against the portfolio SQLite database
- Executes the query and returns the results in a structured format
- Returns metadata: the SQL query generated, row count, column names, and a brief explanation of the query logic

### Requirement 2: SQL Safety & Injection Prevention

- Parse and validate the generated SQL before execution
- Only allow SELECT statements (reject INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, ATTACH, DETACH, PRAGMA that modify state, etc.)
- Implement parameterized queries where applicable
- Reject queries with multiple statements (no semicolons allowing chained commands)
- Add a row limit safeguard (e.g., max 1000 rows) to prevent excessive result sets
- Log all queries executed for audit purposes

### Requirement 3: System Prompt / Tool Description Updates

- Update the MCP server's tool descriptions to include guidance on when to use `ejecutar_consulta_sql`
- Provide schema context (table names, column names, relationships) so the LLM can generate accurate SQL
- Include examples of common queries in the tool description

### Requirement 4: Transparent SQL Reporting

- Every response must include:
  - The exact SQL query that was executed
  - A brief explanation of why the query was structured that way
  - The number of rows returned
  - The column names in the result set
- This information should be formatted clearly for end-user presentation

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The tool must NEVER allow data modification — read-only access only.
- The tool should work with the existing SQLite database (`db/portfolio.db`) and its 28-table schema.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
