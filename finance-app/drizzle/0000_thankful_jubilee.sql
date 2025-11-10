CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"quantity" numeric NOT NULL,
	"created_at" timestamp DEFAULT now()
);
