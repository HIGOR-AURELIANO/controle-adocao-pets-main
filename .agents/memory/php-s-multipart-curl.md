---
name: PHP built-in server multipart/curl bug
description: php -S corrupts $_POST when curl uploads binary files; browser FormData works fine.
---

When testing file uploads with curl against `php -S` (built-in server), the binary file data bleeds into `$_POST` variables that come AFTER the file field. Specifically, `$_FILES` is empty and the last text POST field receives the raw multipart body (boundary + binary data), causing PostgreSQL `invalid byte sequence for encoding "UTF8": 0x89` errors.

**Why:** PHP's built-in server does not handle multipart/form-data with binary files the same way Apache/Nginx do. Reading `php://input` (even though it should be empty for multipart) appears to interfere with the SAPI's internal multipart parsing in `php -S`.

**How to apply:**
- Never use curl `-F @binary_file` to test file uploads against `php -S` — results are unreliable.
- Use real browser E2E tests (Playwright/testing skill) to verify file upload endpoints.
- The fix applied: `input()` now skips `file_get_contents('php://input')` when `CONTENT_TYPE` contains `multipart/form-data`, falling directly to `$_POST`/`$_GET`.
- Browser FormData uploads work perfectly — confirmed by E2E tests creating pets with 1 and 3 photos.
