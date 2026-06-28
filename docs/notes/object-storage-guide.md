# Object Storage Guide — Document Uploads on Laravel Cloud

> How to move document uploads from the local disk to **Laravel Cloud object storage**
> (S3-compatible). Today everything runs through `App\Services\DocumentService`, which is
> already disk-abstracted via Laravel's `Storage` facade — so the switch is mostly config.

---

## 1. How storage works today

`app/Services/DocumentService.php`:

```php
private const DISK = 'local';        // storage/app (private, not web-served)
private const DIRECTORY = 'documents';
```

- **Upload** (`storeFile`): `$file->store('documents', 'local')` → returns a key saved as
  `uploaded_files.stored_path`.
- **Download** (`download`): `Storage::disk('local')->download($file->stored_path, $file->original_name)`
  — streamed through the authorized `documents.download` route (`DocumentController@download`),
  never served directly. Authorization: owner-or-admin.
- **Delete** (`delete`): `Storage::disk('local')->delete($file->stored_path)` per version.

Because every call goes through `Storage::disk(self::DISK)`, switching providers means
**changing the disk name + config**, not rewriting upload/download/delete logic.

## 2. Provision the bucket on Laravel Cloud

1. In the Laravel Cloud dashboard, open the environment → **Storage** → create an
   object storage bucket (this provisions an S3-compatible bucket + credentials).
2. Laravel Cloud injects the standard AWS-style variables into the environment. Confirm these
   are present (names may vary slightly per provider — match what the dashboard shows):

```dotenv
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=auto
AWS_BUCKET=site-documents
AWS_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # or provider endpoint
AWS_USE_PATH_STYLE_ENDPOINT=true
```

> Keep the bucket **private**. We never expose a public URL; downloads are streamed through
> the app or via short-lived signed URLs (§5).

## 3. Define the disk (`config/filesystems.php`)

Laravel ships an `s3` disk template. Confirm/adjust it (it reads the env above):

```php
's3' => [
    'driver'                  => 's3',
    'key'                     => env('AWS_ACCESS_KEY_ID'),
    'secret'                  => env('AWS_SECRET_ACCESS_KEY'),
    'region'                  => env('AWS_DEFAULT_REGION'),
    'bucket'                  => env('AWS_BUCKET'),
    'endpoint'                => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    'throw'                   => true,   // surface storage errors instead of silently failing
    'visibility'             => 'private',
],
```

Install the driver if not already present:

```bash
composer require league/flysystem-aws-s3-v3 "^3.0"
```

## 4. Point DocumentService at the cloud disk

Prefer config over a hardcoded constant so the disk can differ per environment
(local dev stays on `local`, cloud uses `s3`).

1. Add to `config/filesystems.php` (or a small `config/documents.php`):

```php
'documents_disk' => env('DOCUMENTS_DISK', 'local'),
```

2. In `DocumentService`, replace the constant with the config lookup:

```php
private function disk(): string
{
    return config('filesystems.documents_disk', 'local');
}
```

…and swap `self::DISK` for `$this->disk()` in `storeFile`, `download`, and `delete`.

3. Set `DOCUMENTS_DISK=s3` in the Laravel Cloud environment; leave it unset (→ `local`) for
   local development so dev uploads don't hit the bucket.

> Migration note: existing rows in `uploaded_files.stored_path` point at the old `local`
> disk. If real data must move, copy objects from `storage/app/documents` into the bucket
> under the same keys before flipping `DOCUMENTS_DISK`. For this non-production app, a
> `migrate:fresh --seed` reset is acceptable.

## 5. Downloads — keep streaming, or use signed URLs

Two valid patterns; both keep the bucket private:

- **Stream through the app (current behavior — no change needed).**
  `Storage::disk($this->disk())->download(...)` works identically on `s3`. The
  `documents.download` route already enforces owner-or-admin auth. Simplest; all bytes pass
  through the app server.

- **Temporary signed URL (offloads bandwidth).** For large files, return a short-lived URL:

```php
return Storage::disk($this->disk())->temporaryUrl(
    $file->stored_path,
    now()->addMinutes(5),
    ['ResponseContentDisposition' => 'attachment; filename="'.$file->original_name.'"']
);
```

  Then have `DocumentController@download` redirect to it (still behind the auth check).
  Only enable once auth is verified, since the signed URL bypasses app auth for its lifetime.

## 6. Validation / limits (already enforced)

`DocumentController::FILE_RULES` caps uploads at 10 MB and restricts to
`pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png`. No change needed for cloud storage, but if the
bucket has its own size policy, keep the app limit ≤ the bucket limit.

## 7. Checklist

- [ ] Bucket provisioned on Laravel Cloud; env vars present (§2).
- [ ] `s3` disk configured + `league/flysystem-aws-s3-v3` installed (§3).
- [ ] `documents_disk` config + `DocumentService` uses `$this->disk()` (§4).
- [ ] `DOCUMENTS_DISK=s3` set in cloud, unset locally.
- [ ] Upload → row stores key; Download streams/signs; Delete removes object (§1, §5).
- [ ] `php artisan optimize:clear` after config changes; smoke upload + download + delete.
