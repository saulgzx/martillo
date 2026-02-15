-- Align roles with architecture: SUPERADMIN, ADMIN, USER
CREATE TYPE "public"."Role_new" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

ALTER TABLE "public"."User"
  ALTER COLUMN "role" TYPE "public"."Role_new"
  USING (
    CASE
      WHEN "role"::text = 'AUCTIONEER' THEN 'ADMIN'
      WHEN "role"::text IN ('CONSIGNOR', 'BIDDER') THEN 'USER'
      ELSE "role"::text
    END
  )::"public"."Role_new";

ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
