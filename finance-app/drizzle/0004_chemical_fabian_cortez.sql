CREATE TABLE "crypto_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"name" text,
	"logo_url" text,
	"quantity" numeric(30, 10) NOT NULL,
	"buy_price_unit" numeric(18, 8) NOT NULL,
	"buy_total" numeric(18, 8) NOT NULL,
	"buy_currency" text NOT NULL,
	"buy_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crypto_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"currency" text NOT NULL,
	"price" numeric(30, 10) NOT NULL,
	"as_of" timestamp DEFAULT now() NOT NULL
);
