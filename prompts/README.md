# Prompt & Session History

This folder maintains a complete log of all instructions given to Claude Code and session progress. It serves as a recovery mechanism for context overflows and session interrupts.

## Structure

```
prompts/
├── README.md              # This file
├── YYYY-MM-DD.md          # Daily instruction & progress logs
└── ...
```

## File Format

Each daily file contains:
1. **Session metadata** - date, focus area, status
2. **Instruction log** - every prompt/instruction given, numbered sequentially
3. **Session progress** - what was accomplished, files changed, current state
4. **Recovery context** - enough info to resume if session is interrupted

## Usage

- On session start: read the latest daily file to understand prior context
- After each instruction: append the instruction and its outcome
- On session end: update with final progress summary
