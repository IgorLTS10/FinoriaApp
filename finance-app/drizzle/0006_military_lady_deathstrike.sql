CREATE TABLE "stock_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" text NOT NULL,
	"name" text,
	"exchange" text,
	"logo_url" text,
	"quantity" numeric(20, 8) NOT NULL,
	"buy_price" numeric(20, 8) NOT NULL,
	"buy_total" numeric(20, 8) NOT NULL,
	"buy_currency" text NOT NULL,
	"buy_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"currency" text NOT NULL,
	"as_of" timestamp DEFAULT now() NOT NULL
);
