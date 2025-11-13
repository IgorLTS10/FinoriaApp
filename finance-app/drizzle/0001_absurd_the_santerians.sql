CREATE TABLE "metaux" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"poids" numeric(10, 2) NOT NULL,
	"unite" text DEFAULT 'g' NOT NULL,
	"prix_achat" numeric(12, 2) NOT NULL,
	"devise_achat" text NOT NULL,
	"date_achat" date NOT NULL,
	"fournisseur" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
