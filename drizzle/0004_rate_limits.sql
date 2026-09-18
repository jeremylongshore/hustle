CREATE TABLE `rateLimit` (
	`key` text PRIMARY KEY NOT NULL,
	`windowStart` integer NOT NULL,
	`count` integer NOT NULL
);
