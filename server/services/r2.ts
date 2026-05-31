import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

export const r2Configured = () =>
  Boolean(accountId && accessKeyId && secretAccessKey && bucket);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!r2Configured()) throw new Error("R2 is not configured (missing R2_* env vars)");
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });
  return client;
}

/**
 * Store a processed file with a 24h expiry marker (a metadata field for a future
 * lifecycle/cron cleanup — see decisions/architecture docs). Returns the object key.
 */
export async function storeTemp(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: { "expires-at": expiresAt },
    }),
  );
  return key;
}
