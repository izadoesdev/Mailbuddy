# Contributing to Mailbuddy

Thank you for your interest in contributing to Mailbuddy! This document provides guidelines and instructions to help you get started.

## Getting Started

1. **Fork the repository**
   - Click the "Fork" button at the top right of the [Mailbuddy repository](https://github.com/izadoesdev/mailer)

2. **Clone your fork**
   ```bash
   git clone https://github.com/izadoesdev/mailer.git
   cd mailer
   ```

3. **Set up the development environment**
   ```bash
   # Install dependencies
   bun install
   
   # Copy the environment variables template
   cp .env.example .env.local
   # Fill in required environment variables
   
   # Start the development server
   bun run dev
   ```

## Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Coding Standards**
   - Follow the existing code style in the project
   - Use TypeScript for type safety
   - Write clean, readable code with meaningful variable names
   - Keep components small and focused on a single responsibility
   - Use Biome for formatting:
     ```bash
     bun run biome-write
     ```
   - Ensure ESLint passes:
     ```bash
     bun run lint
     ```

3. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issue numbers in your commit messages when applicable
   ```bash
   git commit -m "Add feature X, resolves #123"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Submit a Pull Request**
   - Go to the [Mailbuddy repository](https://github.com/izadoesdev/mailer)
   - Click "Pull Request" and then "New Pull Request"
   - Select your fork and the branch you created
   - Fill in the PR template with details about your changes
   - Submit the PR

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if necessary
3. Add tests for new functionality
4. Make sure all tests pass
5. Your PR will be reviewed by maintainers, who may suggest changes

## Issue Reporting

- Check if the issue already exists before creating a new one
- Use the issue templates when available
- Provide clear steps to reproduce bugs
- Include relevant information like your OS, browser, and Mailbuddy version

## Issue Labels

We use various labels to organize issues:

- **good first issue**: Good for newcomers
- **bug**: Something isn't working correctly
- **enhancement**: New feature or improvement request
- **documentation**: Documentation-related tasks
- **help wanted**: Extra attention is needed

## Questions and Discussions

If you have questions about contributing:

- Open a discussion in the [GitHub Discussions tab](https://github.com/izadoesdev/mailer/discussions)
- Ask in the issue if related to an existing issue
- For security-related issues, please see our security policy

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing to Mailbuddy, you agree that your contributions will be licensed under the project's [MIT License](LICENSE). 