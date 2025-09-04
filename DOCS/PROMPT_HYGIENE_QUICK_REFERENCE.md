# Prompt Hygiene Quick Reference

## 🚀 Format Template

```
CC main agent - [Task description]:
1. [Action step 1]
2. [Action step 2]
3. [Verification step]
```

## ❌ Never Do This

- `npm install`
- `git commit -m "message"`
- `python manage.py runserver`
- Mixed instructions like "Run `npm test` then check results"

## ✅ Always Do This

```
CC main agent - [Clear task name]:
1. [Specific action]
2. [Next action]
3. [Verify success]
```

## 🔧 Common Patterns

### Starting Work
```
CC main agent - Begin development session:
1. Pull latest changes
2. Install dependencies
3. Start servers
4. Verify health endpoints
```

### Testing
```
CC main agent - Run tests:
1. Execute test suite
2. Display coverage
3. Show any failures
```

### Deploying
```
CC main agent - Deploy changes:
1. Push to main
2. Monitor build
3. Validate deployment
```

### Manual Actions
```
MANUAL ACTION REQUIRED:
1. Open [specific URL]
2. Click [specific button]
3. Enter [specific value]
4. Save changes
```

## 📏 Rules

1. **NO** raw commands
2. **NO** mixed text/code
3. **ALWAYS** numbered steps
4. **ALWAYS** include verification
5. **CLEARLY** mark manual tasks

---
*Full guide: [PROMPT_HYGIENE_PROTOCOL.md](PROMPT_HYGIENE_PROTOCOL.md)*