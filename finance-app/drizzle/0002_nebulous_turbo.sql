CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" text NOT NULL,
	"quote" text NOT NULL,
	"rate" numeric(14, 6) NOT NULL,
	"as_of" timestamp DEFAULT now() NOT NULL
);
