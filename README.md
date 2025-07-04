# Arcas OnlineEDA MCP Server

MCP (Model Context Protocol) server for interacting with Arcas OnlineEDA platform - a comprehensive web-based Electronic Design Automation tool suite for formal verification, equivalence checking, power analysis, security verification, and FPGA design.

## Overview

This MCP server provides programmatic access to Arcas OnlineEDA platform through web automation, enabling AI assistants and automated workflows to:

- Create and manage EDA projects with intelligent project type detection
- Upload design files with automatic format recognition
- Execute various verification types with customizable parameters
- Navigate the platform seamlessly
- Process natural language queries with extensive example matching
- Access platform resources through well-defined URIs

## Features

### Core Capabilities
- **Formal Verification**: Verify design properties, assertions, and safety requirements
- **Equivalence Checking**: Compare functional equivalence between RTL and gate-level designs
- **Power Analysis**: Analyze and optimize dynamic and static power consumption
- **Security Verification**: Detect vulnerabilities, side-channels, and information leakage
- **FPGA Verification**: Platform-specific verification for Xilinx, Intel/Altera designs

### Available Tools

1. **arcas_onlineeda_navigate** - Navigate platform sections
   - Actions: `home`, `projects`, `new-project`, `documentation`, `settings`
   - Smart navigation with session state preservation

2. **arcas_onlineeda_project** - Comprehensive project management
   - Actions: `create`, `open`, `list`, `delete`
   - Project types: `formal`, `equivalence`, `power`, `security`, `fpga`
   - Automatic project type detection from context

3. **arcas_onlineeda_upload_file** - Intelligent file upload
   - Supported formats: Verilog (.v), SystemVerilog (.sv), VHDL (.vhd/.vhdl)
   - Constraint files: SDC, XDC for timing and placement
   - Automatic file type detection

4. **arcas_onlineeda_run_verification** - Advanced verification execution
   - Types: `formal`, `equivalence`, `power`, `security`, `fpga`
   - Configurable parameters: timeout, depth, specific properties
   - Real-time progress monitoring

5. **arcas_onlineeda_natural_language** - AI-powered natural language interface
   - Extensive example database for high-confidence matching
   - Workflow suggestions and multi-step guidance
   - Context-aware recommendations

### Available Resources

Access platform data through these URIs:

- `arcas://projects` - List all projects in JSON format
- `arcas://verification-results` - Latest verification results
- `arcas://platform-status` - Current platform and connection status
- `arcas://documentation` - Platform documentation in Markdown

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd arcas-onlineeda-mcp

# Install dependencies
npm install

# Build the server
npm run build

# Optional: Run setup script for browser dependencies
npm run setup
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Arcas OnlineEDA credentials (optional - will prompt if not set)
ONLINEEDA_USERNAME=your_username
ONLINEEDA_PASSWORD=your_password

# Browser settings
ONLINEEDA_HEADLESS=true      # Set to false to see browser actions
ONLINEEDA_TIMEOUT=30000      # Page load timeout in ms

# Logging
LOG_LEVEL=info               # Options: error, warn, info, debug
LOG_FILE=arcas-onlineeda.log # Log file location
```

### MCP Configuration

Add to your MCP settings file (e.g., `~/.mcp/settings.json`):

```json
{
  "mcpServers": {
    "arcas-onlineeda": {
      "command": "node",
      "args": ["/path/to/arcas-onlineeda-mcp/dist/index.js"],
      "env": {
        "ONLINEEDA_USERNAME": "your_username",
        "ONLINEEDA_PASSWORD": "your_password"
      }
    }
  }
}
```

## Usage Examples

### Basic Tool Usage

#### Create a Formal Verification Project
```javascript
{
  "tool": "arcas_onlineeda_project",
  "arguments": {
    "action": "create",
    "projectName": "risc_v_core_verification",
    "projectType": "formal"
  }
}
```

#### Upload Multiple Design Files
```javascript
{
  "tool": "arcas_onlineeda_upload_file",
  "arguments": {
    "projectId": "proj_123",
    "filePath": "./rtl/cpu_core.v",
    "fileType": "verilog"
  }
}
```

#### Run Security Verification
```javascript
{
  "tool": "arcas_onlineeda_run_verification",
  "arguments": {
    "projectId": "proj_123",
    "verificationType": "security",
    "options": {
      "timeout": 600,
      "properties": ["information_leakage", "timing_attacks", "power_analysis"]
    }
  }
}
```

### Natural Language Examples

The natural language interface understands a wide variety of queries:

#### Project Creation Queries
- "I want to create a new formal verification project for my CPU design"
- "Let's start a power analysis project for the GPU controller"
- "Set up equivalence checking between RTL and gate-level netlist"
- "Create a security verification project for my AES encryption module"

#### Verification Queries
- "Check if my RISC-V core meets all safety properties"
- "Verify that the optimized design is functionally equivalent to the original"
- "Analyze power consumption during different operating modes"
- "Find security vulnerabilities in my crypto module"
- "Run formal verification with 20 cycle depth"

#### File Operation Queries
- "Upload my Verilog files for the memory controller"
- "Add the SystemVerilog testbench to the project"
- "Import SDC timing constraints"
- "Load all RTL files from the design directory"

#### Navigation and Status Queries
- "Show me all my verification projects"
- "Go to the documentation"
- "What's the status of my current verification?"
- "Navigate to project settings"

#### Complex Workflow Queries
- "I need to verify my AES encryption module meets FIPS standards"
- "Compare power consumption before and after optimization"
- "Set up a complete verification flow for my SoC design"
- "Help me debug failing assertions in my formal verification"

### Accessing Resources

```javascript
// List all projects
{
  "action": "read_resource",
  "uri": "arcas://projects"
}

// Check platform status
{
  "action": "read_resource", 
  "uri": "arcas://platform-status"
}

// Get documentation
{
  "action": "read_resource",
  "uri": "arcas://documentation"
}
```

## Advanced Usage

### Workflow Automation

Create complex workflows by chaining tools:

```javascript
// Complete verification workflow
const workflow = [
  {
    tool: "arcas_onlineeda_project",
    args: { action: "create", projectType: "formal", projectName: "soc_verification" }
  },
  {
    tool: "arcas_onlineeda_upload_file",
    args: { filePath: "./rtl/soc_top.v", fileType: "verilog" }
  },
  {
    tool: "arcas_onlineeda_upload_file",
    args: { filePath: "./constraints/timing.sdc", fileType: "constraints" }
  },
  {
    tool: "arcas_onlineeda_run_verification",
    args: { verificationType: "formal", options: { depth: 30, timeout: 1200 } }
  }
];
```

### Custom Verification Properties

Define specific properties for targeted verification:

```javascript
{
  "tool": "arcas_onlineeda_run_verification",
  "arguments": {
    "projectId": "proj_456",
    "verificationType": "formal",
    "options": {
      "properties": [
        "assert property (@(posedge clk) req |-> ##[1:3] ack);",
        "assert property (@(posedge clk) !overflow);"
      ],
      "depth": 50
    }
  }
}
```

## Architecture

The server implements a modular architecture:

```
arcas-onlineeda-mcp/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── tools/             # Tool implementations
│   │   ├── base.ts        # Abstract tool class
│   │   ├── navigate.ts    # Navigation tool
│   │   ├── project.ts     # Project management
│   │   ├── upload-file.ts # File upload handling
│   │   ├── run-verification.ts # Verification execution
│   │   └── natural-language.ts # NLP interface
│   ├── utils/             # Utility modules
│   │   ├── browser.ts     # Puppeteer browser management
│   │   └── logger.ts      # Winston logging
│   └── types/             # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

- **Browser Manager**: Handles Puppeteer lifecycle, authentication, and page navigation
- **Tool Base Class**: Provides consistent validation and error handling
- **Natural Language Processor**: Extensive example matching and intent detection
- **Resource Provider**: Serves platform data through MCP resources
- **Session Manager**: Maintains login state and project context

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# Build for production
npm run build
```

### Adding New Tools

1. Create a new tool class extending `AbstractTool`
2. Implement required methods: `getName()`, `getDescription()`, `execute()`
3. Add tool to the server's tool map
4. Update natural language examples

## Troubleshooting

### Common Issues

#### Browser Connection
```
Error: Failed to launch browser
```
**Solution**: Install Chrome/Chromium or run `npm run setup`

#### Authentication Failures
```
Error: Login failed
```
**Solutions**:
- Verify credentials in environment variables
- Check if account is active on OnlineEDA
- Try manual login with `ONLINEEDA_HEADLESS=false`

#### Element Not Found
```
Error: Waiting for selector failed
```
**Solutions**:
- Platform UI may have changed
- Check internet connectivity
- Increase timeout values

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug npm run dev
```

View browser actions:
```bash
ONLINEEDA_HEADLESS=false npm run dev
```

### Performance Tips

1. Reuse project sessions when possible
2. Batch file uploads for better performance
3. Use appropriate timeouts for long-running verifications
4. Enable caching for frequently accessed resources

## Security Considerations

- **Credentials**: Stored securely in environment variables
- **Browser Isolation**: Runs in sandboxed Chromium instance
- **Audit Logging**: All operations logged with timestamps
- **Session Management**: Automatic logout on shutdown
- **Data Privacy**: No data stored locally except logs

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Update documentation
- Follow TypeScript best practices
- Add natural language examples for new capabilities
- Ensure backward compatibility

## Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: Access via `arcas://documentation`
- **Examples**: See natural language tool for extensive examples
- **Community**: Join our Discord server

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Arcas Microelectronics for the OnlineEDA platform
- Model Context Protocol team for the MCP framework
- Puppeteer team for browser automation tools