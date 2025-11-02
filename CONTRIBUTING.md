# Contributing to FlowField Studio

Thank you for your interest in contributing to FlowField Studio! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots or recordings if applicable
- Browser and OS information

### Suggesting Enhancements

We love new ideas! When suggesting an enhancement:
- Use a clear, descriptive title
- Provide a detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write clear, descriptive commit messages
- Update documentation if needed
- Test across different browsers if possible
- Include screenshots/videos for visual changes

## Code Style

- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused
- Follow existing code formatting patterns

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flowfield-studio.git
cd flowfield-studio

# Run locally
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project Structure

- `index.html` - Main HTML structure
- `sketch.js` - p5.js sketch with flow field generation
- `controls.js` - Custom control panel implementation
- `style.css` - Canvas container styling
- `controls.css` - Control panel styling

## Feature Roadmap

Check out the README.md for the current list of planned enhancements. Feel free to pick up any of these or suggest new ones!

## Questions?

Feel free to open an issue with your question, or reach out to [@antoinemoyroud](https://github.com/antoinemoyroud).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

