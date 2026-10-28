# Workflow

plan -> GO -> implement -> run tests -> (debug) -> review -> finalize -> commit

Rules of thumb
- One task per chat. New task = new chat + new context pack.
- You run the code, ChatGPT never does. Paste real errors, never paraphrase them.
- Do not merge a task with red tests.
- Review is mandatory for T04, T05, T06, T08, T11 (security-sensitive).
- If ChatGPT drifts (new libraries, new architecture, partial files), stop, start a fresh chat with the context pack again.
