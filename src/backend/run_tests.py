#!/usr/bin/env python3
"""
Test runner script for backend tests.
"""
import sys
import subprocess
import argparse
from pathlib import Path


def run_tests(args):
    """Run tests with pytest."""
    # Base pytest command
    cmd = ["pytest"]

    # Add verbose flag if requested
    if args.verbose:
        cmd.append("-vv")

    # Add coverage if requested
    if args.coverage:
        cmd.extend(["--cov=app", "--cov-report=term-missing"])
        if args.html_coverage:
            cmd.append("--cov-report=html")

    # Add markers
    if args.unit:
        cmd.extend(["-m", "unit"])
    elif args.integration:
        cmd.extend(["-m", "integration"])
    elif args.slow:
        cmd.extend(["-m", "slow"])

    # Add specific test file or directory
    if args.path:
        cmd.append(args.path)

    # Add pytest options
    if args.options:
        cmd.extend(args.options.split())

    # Run the tests
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=Path(__file__).parent)

    return result.returncode


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run backend tests")
    parser.add_argument(
        "path", nargs="?", help="Specific test file or directory to run"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument(
        "-c", "--coverage", action="store_true", help="Generate coverage report"
    )
    parser.add_argument(
        "--html-coverage", action="store_true", help="Generate HTML coverage report"
    )
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument(
        "--integration", action="store_true", help="Run only integration tests"
    )
    parser.add_argument("--slow", action="store_true", help="Run only slow tests")
    parser.add_argument("-o", "--options", help="Additional pytest options")

    args = parser.parse_args()

    # Run tests
    exit_code = run_tests(args)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
