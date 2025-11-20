CREATE TABLE "metal_prices_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metal" text NOT NULL,
	"price_per_ounce_eur" numeric(30, 10) NOT NULL,
	"price_per_gram_eur" numeric(30, 10) NOT NULL,
	"as_of" timestamp DEFAULT now() NOT NULL
);
